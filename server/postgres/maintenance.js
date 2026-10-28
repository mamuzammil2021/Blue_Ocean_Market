'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),readline=require('node:readline');
const {identifier:q}=require('./connection');
const gate=require('./request-boundaries');
const table=n=>`bom.${q(n)}`;
const hashFile=file=>{const h=crypto.createHash('sha256'),fd=fs.openSync(file,'r'),buffer=Buffer.alloc(1024*1024);try{let n;while((n=fs.readSync(fd,buffer,0,buffer.length,null)))h.update(buffer.subarray(0,n));return h.digest('hex')}finally{fs.closeSync(fd)}};
const inside=(child,parent)=>{const r=path.relative(path.resolve(parent),path.resolve(child));return r===''||(!r.startsWith('..')&&!path.isAbsolute(r))};
const PRIVATE=new Set(['_pg_migrations','_pg_maintenance','_pg_auth_epoch']);
const PRESERVE=new Set(['users','business_units','user_business_units','user_access_overrides','user_access_limits','access_role_templates','access_change_history','approval_rules','accounting_accounts','accounting_payment_accounts','system_bank_account_history','performance_kpi_rules','work_report_rules','system_settings','system_settings_history','system_secrets','system_backup_log','numbering_reference_definitions','numbering_reference_overrides','numbering_reference_history','schema_migrations','system_migrations','system_test_reset_log','user_access_profiles','access_permission_groups','user_permission_groups','user_approval_authority','access_policy_sets','access_approval_levels','access_permission_catalog_v342','access_permission_default_assignments_v342','platform_modules','platform_entities','platform_entity_capabilities','_pg_imports',...PRIVATE]);

function files(directory,prefix=''){
 if(!fs.existsSync(directory))return [];
 const out=[];
 for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  if(entry.name==='.gitkeep')continue;
  const rel=prefix+entry.name,file=path.join(directory,entry.name);
  if(entry.isSymbolicLink())throw Error('Backup/restore refuses symbolic links in upload storage');
  if(entry.isDirectory())out.push(...files(file,rel+'/'));
  else if(entry.isFile())out.push({name:rel,bytes:fs.statSync(file).size,sha256:hashFile(file)});
  else throw Error('Unsupported object in upload storage');
 }
 return out.sort((a,b)=>a.name.localeCompare(b.name));
}
async function inventory(db){
 const tables=await db.all("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='bom' ORDER BY tablename");
 const out=[];
 for(const {tablename:name} of tables){
  if(PRIVATE.has(name))continue;
  const columns=await db.all(`SELECT a.attname AS name,a.attidentity AS identity FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON c.oid=a.attrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='bom' AND c.relname=$1 AND a.attnum>0 AND NOT a.attisdropped ORDER BY a.attnum`,[name]);
  out.push({name,columns});
 }
 return out;
}
async function operationalRows(db){
 const names=['finance_entries','accounting_journal_entries','sales','purchases','excavator_assets','excavator_transactions','excavator_buyer_payments','pink_salt_imports','pink_salt_orders','pink_salt_customer_payments','restaurant_orders','documents','tasks','employees','payroll_runs','pink_pack_purchases','pink_receiving_receipts'];
 let total=0;const by_table={};
 for(const name of names){const count=Number((await db.one(`SELECT COUNT(*)::text AS n FROM ${table(name)}`)).n);by_table[name]=count;total+=count}
 return {total,by_table};
}
async function lock(db,tables){
 await db.query('SELECT pg_advisory_xact_lock(1112493391,3)');
 await db.query(`LOCK TABLE ${tables.map(t=>table(t.name)).join(',')} IN ACCESS EXCLUSIVE MODE`);
}
async function digestTable(db,t,file){
 const select=t.columns.map(c=>`${q(c.name)}::text AS ${q(c.name)}`).join(',');
 const order=t.columns.map(c=>`(${q(c.name)}::text) COLLATE "C" NULLS FIRST`).join(',');
 const cursor='bom_maintenance_rows';
 await db.query(`DECLARE ${cursor} NO SCROLL CURSOR FOR SELECT ${select} FROM ${table(t.name)} ORDER BY ${order}`);
 const hash=crypto.createHash('sha256');let count=0,fd;
 if(file)fd=fs.openSync(file,'wx',0o600);
 try{
  for(;;){
   const batch=await db.all(`FETCH FORWARD 500 FROM ${cursor}`);if(!batch.length)break;
   for(const row of batch){const text=JSON.stringify(t.columns.map(c=>row[c.name]))+'\n';hash.update(text);if(fd!==undefined)fs.writeSync(fd,text);count++}
  }
 }finally{try{await db.query(`CLOSE ${cursor}`)}finally{if(fd!==undefined)fs.closeSync(fd)}}
 return {rows:count,sha256:hash.digest('hex')};
}
async function snapshot(db,storage,tables,{operation,actor,reason}){
 const root=path.join(storage.dataDir,'backups','postgres');fs.mkdirSync(root,{recursive:true,mode:0o700});
 const name=new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomBytes(5).toString('hex')+'-'+operation;
 const directory=path.join(root,name);fs.mkdirSync(directory,{mode:0o700});fs.mkdirSync(path.join(directory,'tables'));
 try{
  const manifest={format:'bom-postgres-data-v1',version:require('../../package.json').version,name,operation,created_at:new Date().toISOString(),created_by_id:actor.id,created_by_name:actor.name||'',created_by_email:actor.email||'',reason,tables:[],sequences:[],migrations:await db.all('SELECT filename,sha256 FROM bom._pg_migrations ORDER BY filename')};
  for(const t of tables){
   const file='tables/'+t.name+'.jsonl',data=await digestTable(db,t,path.join(directory,file));
   manifest.tables.push({...t,file,...data});
   for(const c of t.columns.filter(c=>c.identity)){
    const {name:sequence}=await db.one('SELECT pg_get_serial_sequence($1,$2) AS name',[table(t.name),c.name]);
    if(!/^bom\.[a-z0-9_]+$/.test(sequence))throw Error('Unexpected PostgreSQL sequence name');
    const state=await db.one(`SELECT last_value::text AS last_value,is_called FROM ${sequence}`);
    manifest.sequences.push({table:t.name,column:c.name,...state});
   }
  }
  const uploadFiles=files(storage.uploadDir);const dest=path.join(directory,'uploads');fs.mkdirSync(dest);
  for(const f of uploadFiles){const output=path.join(dest,f.name);fs.mkdirSync(path.dirname(output),{recursive:true});fs.copyFileSync(path.join(storage.uploadDir,f.name),output);if(hashFile(output)!==f.sha256)throw Error('Upload changed during maintenance snapshot')}
  manifest.files=uploadFiles;manifest.upload_files=uploadFiles.length;manifest.upload_bytes=uploadFiles.reduce((n,f)=>n+f.bytes,0);
  manifest.database_bytes=manifest.tables.reduce((n,t)=>n+fs.statSync(path.join(directory,t.file)).size,0);
  const file=path.join(directory,'manifest.json');fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n',{mode:0o600});
  return {manifest,directory,sha256:hashFile(file)};
 }catch(error){fs.rmSync(directory,{recursive:true,force:true});throw error}
}
function backupRoot(storage){return path.join(storage.dataDir,'backups','postgres')}
function listBackups(storage){
 const root=backupRoot(storage);if(!fs.existsSync(root))return [];
 return fs.readdirSync(root,{withFileTypes:true}).filter(x=>x.isDirectory()).flatMap(x=>{
  try{const m=JSON.parse(fs.readFileSync(path.join(root,x.name,'manifest.json'),'utf8'));if(m.format!=='bom-postgres-data-v1'||m.name!==x.name)return [];return [{...m,path:path.join(root,x.name)}]}catch{return []}
 }).sort((a,b)=>b.created_at.localeCompare(a.created_at));
}
async function verifyBackup(db,storage,name,tables){
 if(typeof name!=='string'||path.basename(name)!==name)throw Error('Invalid backup name');
 const directory=path.join(backupRoot(storage),name);if(!inside(directory,backupRoot(storage)))throw Error('Invalid backup location');
 const manifestFile=path.join(directory,'manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
 if(manifest.format!=='bom-postgres-data-v1'||manifest.name!==name)throw Error('Unsupported backup format');
 const registered=await db.maybeOne('SELECT backup_sha256 FROM bom._pg_maintenance WHERE backup_name=$1 ORDER BY created_at DESC LIMIT 1',[name]);
 if(!registered||registered.backup_sha256!==hashFile(manifestFile))throw Error('Backup manifest is unregistered or its checksum changed');
 const migrations=await db.all('SELECT filename,sha256 FROM bom._pg_migrations ORDER BY filename');
 if(JSON.stringify(manifest.migrations)!==JSON.stringify(migrations))throw Error('Backup schema does not match this application build');
 if(JSON.stringify(manifest.tables.map(t=>({name:t.name,columns:t.columns})))!==JSON.stringify(tables))throw Error('Backup table/column inventory does not match the current schema');
 for(const t of manifest.tables){
  if(t.file!=='tables/'+t.name+'.jsonl'||!inside(path.join(directory,t.file),directory)||hashFile(path.join(directory,t.file))!==t.sha256)throw Error('Backup table checksum failed');
 }
 if(JSON.stringify(files(path.join(directory,'uploads')))!==JSON.stringify(manifest.files))throw Error('Backup upload checksum failed');
 return {manifest,directory};
}
function markerPath(storage){return path.join(storage.dataDir,'.postgres-maintenance.json')}
function swapUploads(storage,source,operationId){
 const parent=path.dirname(storage.uploadDir),stage=path.join(parent,'.bom-restore-'+operationId),old=path.join(parent,'.bom-previous-'+operationId);
 fs.mkdirSync(parent,{recursive:true});fs.mkdirSync(stage,{recursive:true});
 if(source)for(const f of files(source)){const dest=path.join(stage,f.name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(source,f.name),dest)}
 const marker={operationId,stage,old,upload:storage.uploadDir};fs.mkdirSync(storage.dataDir,{recursive:true});fs.writeFileSync(markerPath(storage),JSON.stringify(marker),{mode:0o600});
 if(fs.existsSync(storage.uploadDir))fs.renameSync(storage.uploadDir,old);
 fs.renameSync(stage,storage.uploadDir);
 return marker;
}
function settleUploads(storage,marker,committed){
 const parent=path.dirname(storage.uploadDir);
 if(marker.upload!==storage.uploadDir||!inside(marker.stage,parent)||!inside(marker.old,parent)||!/^[-a-f0-9]+$/.test(marker.operationId))throw Error('Invalid maintenance recovery marker');
 if(committed){
  if(!fs.existsSync(storage.uploadDir)&&fs.existsSync(marker.stage))fs.renameSync(marker.stage,storage.uploadDir);
  fs.rmSync(marker.old,{recursive:true,force:true});
 }else if(fs.existsSync(marker.old)){
  fs.rmSync(storage.uploadDir,{recursive:true,force:true});fs.renameSync(marker.old,storage.uploadDir);
 }
 fs.rmSync(marker.stage,{recursive:true,force:true});fs.rmSync(markerPath(storage),{force:true});
}
async function recover(db,storage){
 const file=markerPath(storage);if(!fs.existsSync(file))return;
 const marker=JSON.parse(fs.readFileSync(file,'utf8'));
 const committed=await db.maybeOne('SELECT id FROM bom._pg_maintenance WHERE id=$1',[marker.operationId]);
 settleUploads(storage,marker,!!committed);
}
async function loadRows(db,manifest,directory){
 const suppressed=[['finance_entries','trg_v290_finance_insert'],['finance_entries','trg_v290_finance_update'],['excavator_buyer_payment_allocations','set_excavator_allocation_entry_time_v352']];
 for(const [t,tr] of suppressed)await db.query(`ALTER TABLE ${table(t)} DISABLE TRIGGER ${q(tr)}`);
 await db.query('SET CONSTRAINTS ALL DEFERRED');
 for(const t of manifest.tables){
  const input=readline.createInterface({input:fs.createReadStream(path.join(directory,t.file)),crlfDelay:Infinity});let batch=[];
  const flush=async()=>{
   if(!batch.length)return;const values=[];
   const tuples=batch.map(row=>'('+row.map(v=>{values.push(v);return '$'+values.length}).join(',')+')');
   await db.query(`INSERT INTO ${table(t.name)}(${t.columns.map(c=>q(c.name)).join(',')}) VALUES ${tuples.join(',')}`,values);batch=[];
  };
  for await(const line of input){const row=JSON.parse(line);if(!Array.isArray(row)||row.length!==t.columns.length||row.some(x=>x!==null&&typeof x!=='string'))throw Error('Invalid backup row');batch.push(row);if(batch.length>=Math.min(250,Math.floor(60000/t.columns.length)))await flush()}
  await flush();
 }
 await db.query('SET CONSTRAINTS ALL IMMEDIATE');
 for(const [t,tr] of suppressed)await db.query(`ALTER TABLE ${table(t)} ENABLE TRIGGER ${q(tr)}`);
 for(const t of manifest.tables){const actual=await digestTable(db,t);if(actual.rows!==t.rows||actual.sha256!==t.sha256)throw Error('Restored database failed value reconciliation')}
 for(const s of manifest.sequences){
  const {name}=await db.one('SELECT pg_get_serial_sequence($1,$2) AS name',[table(s.table),s.column]);
  if(!/^bom\.[a-z0-9_]+$/.test(name)||!/^\d+$/.test(s.last_value))throw Error('Invalid identity state in backup');
  const next=BigInt(s.last_value)+(s.is_called?1n:0n);if(next<1n||next>=2n**63n)throw Error('Identity sequence is exhausted');
  await db.query(`ALTER SEQUENCE ${name} RESTART WITH ${next}`);
 }
}
async function perform(db,storage,{action='backup',actor,reason,restoreName,failAfterSwap=false,operationId=crypto.randomUUID(),expectedEpoch}){
 if(!actor?.id||!String(reason||'').trim())throw Error('Maintenance actor and reason are required');
 if(!['backup','quick','full','clear-uploads','restore'].includes(action))throw Error('Unknown maintenance action');
 return gate.exclusive(async()=>{
  let marker,backup,restored,completedResult;
  if(!/^[a-f0-9-]{36}$/.test(operationId))throw Error('Invalid maintenance operation identifier');
  try{
   const result=await db.transaction(async()=>{
    const tables=await inventory(db);await lock(db,tables);
    if(expectedEpoch&&(await db.one('SELECT epoch::text AS epoch FROM bom._pg_auth_epoch WHERE id=1')).epoch!==expectedEpoch)throw Object.assign(Error('The maintenance session expired; sign in again'),{status:401});
    if(action==='restore')restored=await verifyBackup(db,storage,restoreName,tables);
    if(action==='clear-uploads'){
     if((await operationalRows(db)).total)throw Error('Operational records still exist; uploads-only clearing is blocked');
     const existing=files(storage.uploadDir);
     if(existing.length){
      const patterns=existing.map(f=>'%'+f.name.replace(/[\\%_]/g,'\\$&')+'%');
      // Also protect company configuration/master/audit attachment references,
      // which can exist without a sale, purchase or other operational record.
      for(const t of tables){
       if(await db.maybeOne(`SELECT 1 AS found FROM ${table(t.name)} r WHERE to_jsonb(r)::text LIKE ANY($1::text[]) LIMIT 1`,[patterns]))throw Error('An existing record or configuration still references uploads; clearing is blocked');
      }
     }
    }
    backup=await snapshot(db,storage,tables,{operation:action==='restore'?'pre-restore':action,actor,reason});
    let targets=[];
    if(action==='restore'){
     targets=tables;
     await db.query(`TRUNCATE TABLE ${targets.map(t=>table(t.name)).join(',')} RESTART IDENTITY RESTRICT`);
     await loadRows(db,restored.manifest,restored.directory);
    }else if(action==='quick'||action==='full'){
     targets=tables.filter(t=>action==='full'||!PRESERVE.has(t.name));
     await db.query(`TRUNCATE TABLE ${targets.map(t=>table(t.name)).join(',')} RESTART IDENTITY RESTRICT`);
    }
    if(action!=='backup')marker=swapUploads(storage,restored?path.join(restored.directory,'uploads'):null,operationId);
    if(failAfterSwap)throw Error('Injected maintenance rollback failure');
    if(action==='full'||action==='restore')await db.query('UPDATE bom._pg_auth_epoch SET epoch=gen_random_uuid() WHERE id=1');
    await db.query('INSERT INTO bom._pg_maintenance(id,action,backup_name,backup_sha256,actor_json,reason) VALUES($1,$2,$3,$4,$5::jsonb,$6)',[operationId,action,backup.manifest.name,backup.sha256,JSON.stringify({id:actor.id,name:actor.name,email:actor.email}),reason]);
    await db.query("INSERT INTO bom.system_backup_log(backup_name,backup_path,size_bytes,status,reason,created_by) VALUES($1,$2,$3,'Completed',$4,$5)",[backup.manifest.name,backup.directory,backup.manifest.database_bytes+backup.manifest.upload_bytes,reason,action==='full'?null:actor.id]);
    await db.query("INSERT INTO bom.system_test_reset_log(action,status,backup_name,reason,actor_name,actor_email,details_json) VALUES($1,'Completed',$2,$3,$4,$5,$6)",[action,backup.manifest.name,reason,actor.name||'',actor.email||'',JSON.stringify({provider:'postgresql',cleared_tables:targets.length,restored_backup:restoreName||null,operation_id:operationId})]);
    completedResult={ok:true,operation_id:operationId,backup_name:backup.manifest.name,cleared_tables:targets.length,uploads_cleared:action!=='backup',restored_backup:restoreName||undefined};return completedResult;
   },{isolation:'SERIALIZABLE'});
   if(marker)settleUploads(storage,marker,true);
   process.emit('bom:database-reset');return result;
  }catch(error){
   if(marker||backup){
    // Resolve an ambiguous network failure from a separate connection after
    // the transaction callback has exited. Keep the marker if DB is offline;
    // startup recovery finishes the same decision before accepting requests.
    const committed=await db.maybeOne('SELECT id FROM bom._pg_maintenance WHERE id=$1',[operationId]);
    if(marker)settleUploads(storage,marker,!!committed);
    if(committed)return completedResult;
    if(backup)fs.rmSync(backup.directory,{recursive:true,force:true});
   }
   throw error;
  }
 });
}
module.exports={perform,recover,listBackups,backupRoot,files,PRESERVE,inventory,digestTable,verifyBackup,operationalRows};
