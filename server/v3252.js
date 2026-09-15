// Blue Ocean Market V30.25.2 — guarded test-environment reset & pre-reset backups.
'use strict';

const fs=require('fs');
const path=require('path');
const bcrypt=require('bcryptjs');
const storage=require('./runtime-storage');

const VERSION='30.25.2';
const CONFIRM_RESET='RESET TEST DATA';
const CONFIRM_RESTORE='RESTORE TEST BACKUP';

function install({app,db,auth,audit,access,uploads}){
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_test_reset_log(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Completed',
      backup_name TEXT NOT NULL DEFAULT '',
      reason TEXT NOT NULL DEFAULT '',
      actor_name TEXT NOT NULL DEFAULT '',
      actor_email TEXT NOT NULL DEFAULT '',
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const text=v=>String(v??'').trim();
  const resetEnvironment=()=>text(process.env.APP_ENV).toLowerCase();
  const isEnabled=()=>['development','testing'].includes(resetEnvironment())&&text(process.env.ALLOW_TEST_DATA_RESET).toLowerCase()==='true';
  const retention=()=>Math.max(2,Math.min(3,Number(process.env.TEST_RESET_BACKUP_RETENTION||3)||3));
  const backupRoot=path.join(storage.dataDir,'backups','pre-reset');
  const markerPath=path.join(storage.dataDir,'.test-reset-pending.json');
  const completedPath=path.join(storage.dataDir,'.test-reset-completed.json');
  const tableExists=name=>!!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
  const canReset=req=>req.user?.role==='CEO / Owner'||(!!access?.can?.(req.user.id,'sensitive.system_admin',req.selected_business_unit_id||req.user.business_unit_id||null)&&!!access?.can?.(req.user.id,'sensitive.storage',req.selected_business_unit_id||req.user.business_unit_id||null));
  const requireResetAccess=(req,res)=>{if(!isEnabled()){res.status(403).json({error:'Development/Test Environment Reset is disabled. Set APP_ENV=development (or testing) and ALLOW_TEST_DATA_RESET=true only on the dedicated non-production service.'});return false}if(!canReset(req)){res.status(403).json({error:'CEO / Owner or an authorized System Administrator with Storage permission is required.'});return false}return true};
  const verifyPassword=(req)=>{const row=db.prepare('SELECT password_hash FROM users WHERE id=? AND active=1').get(req.user.id);return !!row&&bcrypt.compareSync(String(req.body.password||''),row.password_hash)};
  const safeSegment=v=>text(v).replace(/[^a-zA-Z0-9_.-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64)||'reset';
  const stamp=()=>new Date().toISOString().replace(/[:.]/g,'-');
  function dirStats(dir){let count=0,bytes=0;if(!fs.existsSync(dir))return{count,bytes};for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()){const x=dirStats(p);count+=x.count;bytes+=x.bytes}else if(e.isFile()){count++;try{bytes+=fs.statSync(p).size}catch(_){}}}return{count,bytes}}
  function clearDir(dir){fs.mkdirSync(dir,{recursive:true});for(const name of fs.readdirSync(dir)){if(name==='.gitkeep')continue;fs.rmSync(path.join(dir,name),{recursive:true,force:true})}}
  function listBackups(){fs.mkdirSync(backupRoot,{recursive:true});const out=[];for(const e of fs.readdirSync(backupRoot,{withFileTypes:true})){if(!e.isDirectory())continue;const dir=path.join(backupRoot,e.name),manifestPath=path.join(dir,'manifest.json');if(!fs.existsSync(manifestPath))continue;try{const m=JSON.parse(fs.readFileSync(manifestPath,'utf8'));if(!fs.existsSync(path.join(dir,'blue-ocean.sqlite')))continue;out.push({...m,name:e.name,path:dir})}catch(_){}}return out.sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')))}
  function pruneBackups(){const rows=listBackups(),keep=retention();for(const b of rows.slice(keep))try{fs.rmSync(b.path,{recursive:true,force:true});try{db.prepare('DELETE FROM system_backup_log WHERE backup_path=?').run(b.path)}catch(_){}}catch(e){console.error('V30.25.2 backup prune:',e.message)}return listBackups()}
  function createPreResetBackup(req,operation,reason){const dbPath=db.name;if(!dbPath||dbPath===':memory:'||!fs.existsSync(dbPath))throw new Error('The current test database is not file-backed.');try{db.pragma('wal_checkpoint(FULL)')}catch(_){}fs.mkdirSync(backupRoot,{recursive:true});const name=`${stamp()}-${safeSegment(operation)}`,dir=path.join(backupRoot,name);fs.mkdirSync(dir,{recursive:true});const dbDest=path.join(dir,'blue-ocean.sqlite');fs.copyFileSync(dbPath,dbDest);const uploadsDest=path.join(dir,'uploads');fs.mkdirSync(uploadsDest,{recursive:true});if(fs.existsSync(uploads))fs.cpSync(uploads,uploadsDest,{recursive:true,force:true,filter:(src)=>path.basename(src)!=='.gitkeep'});const stats=dirStats(uploadsDest),manifest={version:VERSION,name,operation,created_at:new Date().toISOString(),created_by_id:req.user.id,created_by_name:req.user.name||'',created_by_email:req.user.email||'',reason:text(reason),database_bytes:fs.statSync(dbDest).size,upload_files:stats.count,upload_bytes:stats.bytes};fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2));try{db.prepare("INSERT INTO system_backup_log(backup_name,backup_path,size_bytes,status,reason,created_by) VALUES(?,?,?,'Completed',?,?)").run(`pre-reset/${name}`,dir,manifest.database_bytes+manifest.upload_bytes,`Automatic pre-reset backup: ${text(reason)||operation}`,req.user.id)}catch(_){}pruneBackups();return manifest}
  function record(action,status,backupName,reason,actor,details={}){try{db.prepare('INSERT INTO system_test_reset_log(action,status,backup_name,reason,actor_name,actor_email,details_json) VALUES(?,?,?,?,?,?,?)').run(action,status,backupName||'',reason||'',actor?.name||'',actor?.email||'',JSON.stringify(details||{}))}catch(e){console.error('V30.25.2 reset log:',e.message)}}
  function writeMarker(payload){fs.writeFileSync(markerPath,JSON.stringify({...payload,requested_at:new Date().toISOString()},null,2));}
  function scheduleRestart(){setTimeout(()=>{try{db.pragma('wal_checkpoint(TRUNCATE)')}catch(_){}process.exit(0)},900)}

  const QUICK_PRESERVE=new Set([
    'users','business_units','user_business_units','user_access_overrides','user_access_limits','access_role_templates','access_change_history',
    'approval_rules','accounting_accounts','accounting_payment_accounts','system_bank_account_history','performance_kpi_rules','work_report_rules',
    'system_settings','system_settings_history','system_secrets','system_backup_log','numbering_reference_definitions','numbering_reference_overrides','numbering_reference_history',
    'schema_migrations','system_test_reset_log'
  ]);
  function quickReset(req,reason){const tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(x=>x.name),targets=tables.filter(t=>!QUICK_PRESERVE.has(t));db.pragma('foreign_keys=OFF');try{db.transaction(()=>{for(const t of targets){db.exec(`DELETE FROM \"${t.replace(/\"/g,'\"\"')}\"`);try{db.prepare('DELETE FROM sqlite_sequence WHERE name=?').run(t)}catch(_){}}})()}finally{db.pragma('foreign_keys=ON')}clearDir(uploads);try{db.pragma('wal_checkpoint(TRUNCATE)')}catch(_){}return targets}
  function operationalRows(){const names=['finance_entries','sales','purchases','excavator_assets','excavator_transactions','excavator_buyer_payments','pink_salt_imports','pink_salt_orders','pink_salt_customer_payments','restaurant_orders','documents','tasks','employees'];let total=0,by_table={};for(const t of names){if(!tableExists(t))continue;try{const c=Number(db.prepare(`SELECT COUNT(*) c FROM \"${t}\"`).get().c||0);by_table[t]=c;total+=c}catch(_){}}return{total,by_table}}

  // Complete a reset/restore audit entry after the next process starts.
  try{if(fs.existsSync(completedPath)){const c=JSON.parse(fs.readFileSync(completedPath,'utf8'));record(c.action||'restart-reset','Completed',c.backup_name||'',c.reason||'',{name:c.actor_name||'',email:c.actor_email||''},c);const actor=c.actor_email?db.prepare('SELECT id,name,email FROM users WHERE lower(email)=lower(?) LIMIT 1').get(c.actor_email):null;if(actor)try{audit(actor,'test_environment_reset',null,'complete',JSON.stringify(c))}catch(_){}fs.rmSync(completedPath,{force:true})}}catch(e){console.error('V30.25.2 completed reset import:',e.message)}

  app.get('/api/system-settings-v3252/test-reset/status',auth,(req,res)=>{if(!canReset(req))return res.status(403).json({error:'Test reset access is not authorized.'});const rows=listBackups(),op=operationalRows(),dbPath=db.name,up=dirStats(uploads);res.json({enabled:isEnabled(),app_env:text(process.env.APP_ENV)||'(not set)',allow_flag:text(process.env.ALLOW_TEST_DATA_RESET).toLowerCase()==='true',retention:retention(),pre_reset_backups:rows.map(({path,...x})=>x),latest_backup:rows[0]?Object.fromEntries(Object.entries(rows[0]).filter(([k])=>k!=='path')):null,database_bytes:dbPath&&fs.existsSync(dbPath)?fs.statSync(dbPath).size:0,upload_files:up.count,upload_bytes:up.bytes,operational_rows:op.total,clear_uploads_allowed:op.total===0,guard:'APP_ENV=development|testing + ALLOW_TEST_DATA_RESET=true + authorized user + password + typed confirmation'})});
  app.get('/api/system-settings-v3252/test-reset/history',auth,(req,res)=>{if(!requireResetAccess(req,res))return;res.json(db.prepare('SELECT * FROM system_test_reset_log ORDER BY id DESC LIMIT 100').all())});

  app.post('/api/system-settings-v3252/test-reset/quick',auth,(req,res)=>{if(!requireResetAccess(req,res))return;if(text(req.body.confirmation)!==CONFIRM_RESET)return res.status(400).json({error:`Type ${CONFIRM_RESET} exactly to continue.`});if(!verifyPassword(req))return res.status(403).json({error:'Current password is incorrect.'});const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Reset reason is required.'});try{const backup=createPreResetBackup(req,'quick-reset',reason),targets=quickReset(req,reason);record('Quick Reset','Completed',backup.name,reason,req.user,{cleared_tables:targets.length,uploads_cleared:true});audit(req.user,'test_environment_reset',null,'quick-reset',JSON.stringify({reason,backup:backup.name,cleared_tables:targets.length}));res.json({ok:true,action:'Quick Reset',backup_name:backup.name,retained_pre_reset_backups:retention(),cleared_tables:targets.length,uploads_cleared:true,restarting:false})}catch(e){console.error('V30.25.2 quick reset:',e);res.status(500).json({error:e.message})}});

  function queueFull(req,res,mode){if(!requireResetAccess(req,res))return;if(text(req.body.confirmation)!==CONFIRM_RESET)return res.status(400).json({error:`Type ${CONFIRM_RESET} exactly to continue.`});if(!verifyPassword(req))return res.status(403).json({error:'Current password is incorrect.'});const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Reset reason is required.'});if(!text(process.env.ADMIN_EMAIL)||text(process.env.ADMIN_PASSWORD).length<12)return res.status(409).json({error:'ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) must be configured before a Full Reset so the CEO account can be recreated.'});if(mode==='full_demo'&&text(process.env.DEMO_USER_PASSWORD).length<12)return res.status(409).json({error:'DEMO_USER_PASSWORD (12+ characters) must be configured before Full Reset + Demo Users/Data.'});try{const backup=createPreResetBackup(req,mode==='full_demo'?'full-reset-demo':'full-reset',reason);writeMarker({action:mode,reason,backup_name:backup.name,actor_name:req.user.name||'',actor_email:req.user.email||'',seed_demo:mode==='full_demo'});try{audit(req.user,'test_environment_reset',null,'queued-'+mode,JSON.stringify({reason,backup:backup.name}))}catch(_){}res.json({ok:true,action:mode==='full_demo'?'Full Reset + Demo':'Full Reset',backup_name:backup.name,retained_pre_reset_backups:retention(),restarting:true,message:'The test service is restarting. The persistent disk stays attached; only the test database and uploads are reset.'});scheduleRestart()}catch(e){console.error('V30.25.2 full reset queue:',e);res.status(500).json({error:e.message})}}
  app.post('/api/system-settings-v3252/test-reset/full',auth,(req,res)=>queueFull(req,res,'full'));
  app.post('/api/system-settings-v3252/test-reset/full-demo',auth,(req,res)=>queueFull(req,res,'full_demo'));

  app.post('/api/system-settings-v3252/test-reset/clear-uploads',auth,(req,res)=>{if(!requireResetAccess(req,res))return;if(text(req.body.confirmation)!==CONFIRM_RESET)return res.status(400).json({error:`Type ${CONFIRM_RESET} exactly to continue.`});if(!verifyPassword(req))return res.status(403).json({error:'Current password is incorrect.'});const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Reset reason is required.'});const op=operationalRows();if(op.total>0)return res.status(409).json({error:'Uploads-only clearing is blocked while operational/test records still exist because it would create broken attachment references. Use Quick Reset or Full Reset instead.',operational_rows:op.total});try{const backup=createPreResetBackup(req,'clear-uploads',reason);clearDir(uploads);record('Clear Uploads','Completed',backup.name,reason,req.user,{uploads_cleared:true});audit(req.user,'test_environment_reset',null,'clear-uploads',JSON.stringify({reason,backup:backup.name}));res.json({ok:true,action:'Clear Uploads',backup_name:backup.name,retained_pre_reset_backups:retention(),uploads_cleared:true,restarting:false})}catch(e){res.status(500).json({error:e.message})}});

  app.post('/api/system-settings-v3252/test-reset/restore-last',auth,(req,res)=>{if(!requireResetAccess(req,res))return;if(text(req.body.confirmation)!==CONFIRM_RESTORE)return res.status(400).json({error:`Type ${CONFIRM_RESTORE} exactly to continue.`});if(!verifyPassword(req))return res.status(403).json({error:'Current password is incorrect.'});const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Restore reason is required.'});const before=listBackups(),target=before[0];if(!target)return res.status(404).json({error:'No pre-reset backup is available to restore.'});try{const safety=createPreResetBackup(req,'pre-restore-current-state',reason);writeMarker({action:'restore',reason,backup_name:target.name,backup_path:target.path,safety_backup_name:safety.name,actor_name:req.user.name||'',actor_email:req.user.email||''});try{audit(req.user,'test_environment_reset',null,'queued-restore',JSON.stringify({reason,restore_backup:target.name,safety_backup:safety.name}))}catch(_){}res.json({ok:true,action:'Restore Last Pre-Reset Backup',backup_name:target.name,safety_backup_name:safety.name,retained_pre_reset_backups:retention(),restarting:true,message:'The service is restarting and will restore both the SQLite database and upload snapshot from the selected pre-reset backup.'});scheduleRestart()}catch(e){console.error('V30.25.2 restore queue:',e);res.status(500).json({error:e.message})}});

  return {VERSION,isEnabled,retention,listBackups};
}

module.exports={install,VERSION};
