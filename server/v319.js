// Blue Ocean Market V30.19.0 — centralized System Settings / Administration and QA hardening.
'use strict';

const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const net=require('net');
const tls=require('tls');
const zlib=require('zlib');
const multer=require('multer');

const VERSION='30.19.0';

function install({app,db,auth,currentUnit,enforceUnit,audit,notify,access,uploads,secret}){
  const text=v=>String(v??'').trim();
  const num=v=>Number(v||0);
  const now=()=>new Date().toISOString();
  const tableExists=name=>!!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
  const ensureColumn=(table,column,definition)=>{try{if(!tableExists(table))return;const cols=db.prepare(`PRAGMA table_info(${table})`).all().map(x=>x.name);if(!cols.includes(column))db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)}catch(e){console.error('V30.19 migration',table,column,e.message)}};
  const safeJson=(v,fallback={})=>{try{const x=JSON.parse(v||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:fallback}catch(_){return fallback}};
  const hashFile=filePath=>{try{return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')}catch(_){return ''}};
  const normalizePhone=v=>text(v).replace(/\D/g,'');
  const normalizeChassis=v=>text(v).toLowerCase().replace(/[^a-z0-9가-힣]/g,'');
  const validEmail=v=>!text(v)||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(v));
  const validPhone=v=>{const raw=text(v);if(!raw)return true;const digits=normalizePhone(raw);return /^\+?[0-9][0-9\s().-]{5,24}$/.test(raw)&&digits.length>=6&&digits.length<=15};

  // -------------------------------------------------------------------------
  // Additive schema only. No V30.18 data is removed or rewritten.
  // -------------------------------------------------------------------------
  ensureColumn('excavator_documents','archived','INTEGER NOT NULL DEFAULT 0');
  ensureColumn('excavator_documents','archived_by','INTEGER');
  ensureColumn('excavator_documents','archived_at','TEXT');
  ensureColumn('excavator_documents','archive_reason',"TEXT DEFAULT ''");
  ensureColumn('excavator_documents','sha256',"TEXT DEFAULT ''");
  ensureColumn('finance_attachments','archived','INTEGER NOT NULL DEFAULT 0');
  ensureColumn('finance_attachments','archived_by','INTEGER');
  ensureColumn('finance_attachments','archived_at','TEXT');
  ensureColumn('finance_attachments','archive_reason',"TEXT DEFAULT ''");
  ensureColumn('finance_attachments','sha256',"TEXT DEFAULT ''");
  ensureColumn('excavator_payments','payment_account_id','INTEGER');

  // Existing V29 payment accounts become the canonical configured company bank/cash accounts.
  ensureColumn('accounting_payment_accounts','account_holder',"TEXT DEFAULT ''");
  ensureColumn('accounting_payment_accounts','account_number',"TEXT DEFAULT ''");
  ensureColumn('accounting_payment_accounts','iban',"TEXT DEFAULT ''");
  ensureColumn('accounting_payment_accounts','swift_bic',"TEXT DEFAULT ''");
  ensureColumn('accounting_payment_accounts','branch',"TEXT DEFAULT ''");
  ensureColumn('accounting_payment_accounts','account_type',"TEXT DEFAULT 'Current'");
  ensureColumn('accounting_payment_accounts','status',"TEXT DEFAULT 'Active'");
  ensureColumn('accounting_payment_accounts','default_payment','INTEGER NOT NULL DEFAULT 0');
  ensureColumn('accounting_payment_accounts','default_receipt','INTEGER NOT NULL DEFAULT 0');
  ensureColumn('accounting_payment_accounts','opening_balance_krw','REAL NOT NULL DEFAULT 0');
  ensureColumn('accounting_payment_accounts','migration_reference',"TEXT DEFAULT ''");
  ensureColumn('accounting_payment_accounts','closed_at','TEXT');
  ensureColumn('accounting_payment_accounts','closed_by','INTEGER');
  ensureColumn('accounting_payment_accounts','updated_by','INTEGER');

  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scope_type TEXT NOT NULL,
      scope_id INTEGER NOT NULL DEFAULT 0,
      section TEXT NOT NULL,
      settings_json TEXT NOT NULL DEFAULT '{}',
      updated_by INTEGER,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(scope_type,scope_id,section),
      FOREIGN KEY(updated_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS system_settings_history(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scope_type TEXT NOT NULL,
      scope_id INTEGER NOT NULL DEFAULT 0,
      section TEXT NOT NULL,
      before_json TEXT NOT NULL DEFAULT '{}',
      after_json TEXT NOT NULL DEFAULT '{}',
      reason TEXT NOT NULL DEFAULT '',
      changed_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(changed_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS system_secrets(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scope_type TEXT NOT NULL DEFAULT 'company',
      scope_id INTEGER NOT NULL DEFAULT 0,
      secret_key TEXT NOT NULL,
      ciphertext TEXT NOT NULL,
      iv TEXT NOT NULL,
      auth_tag TEXT NOT NULL,
      updated_by INTEGER,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(scope_type,scope_id,secret_key)
    );
    CREATE TABLE IF NOT EXISTS system_email_logs(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purpose TEXT NOT NULL DEFAULT 'System Email',
      recipient TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL,
      error_text TEXT NOT NULL DEFAULT '',
      requested_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS system_backup_log(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      backup_name TEXT NOT NULL,
      backup_path TEXT NOT NULL,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Completed',
      reason TEXT NOT NULL DEFAULT '',
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS system_migration_jobs(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_no TEXT UNIQUE,
      migration_type TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_hash TEXT NOT NULL DEFAULT '',
      mapping_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'Uploaded',
      total_rows INTEGER NOT NULL DEFAULT 0,
      valid_rows INTEGER NOT NULL DEFAULT 0,
      error_rows INTEGER NOT NULL DEFAULT 0,
      warning_rows INTEGER NOT NULL DEFAULT 0,
      imported_rows INTEGER NOT NULL DEFAULT 0,
      business_unit_id INTEGER,
      notes TEXT NOT NULL DEFAULT '',
      created_by INTEGER,
      validated_by INTEGER,
      validated_at TEXT,
      imported_by INTEGER,
      imported_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS system_migration_rows(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_job_id INTEGER NOT NULL,
      row_no INTEGER NOT NULL,
      source_json TEXT NOT NULL DEFAULT '{}',
      normalized_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'Pending',
      errors_json TEXT NOT NULL DEFAULT '[]',
      warnings_json TEXT NOT NULL DEFAULT '[]',
      imported_entity TEXT NOT NULL DEFAULT '',
      imported_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(migration_job_id) REFERENCES system_migration_jobs(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS system_bank_account_history(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_account_id INTEGER NOT NULL,
      before_json TEXT NOT NULL DEFAULT '{}',
      after_json TEXT NOT NULL DEFAULT '{}',
      reason TEXT NOT NULL DEFAULT '',
      changed_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS system_bank_statement_imports(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_account_id INTEGER NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_hash TEXT NOT NULL DEFAULT '',
      imported_rows INTEGER NOT NULL DEFAULT 0,
      skipped_rows INTEGER NOT NULL DEFAULT 0,
      imported_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_system_settings_scope ON system_settings(scope_type,scope_id,section);
    CREATE INDEX IF NOT EXISTS idx_system_settings_history ON system_settings_history(scope_type,scope_id,section,id);
    CREATE INDEX IF NOT EXISTS idx_system_migration_rows_job ON system_migration_rows(migration_job_id,row_no);
    CREATE INDEX IF NOT EXISTS idx_system_email_logs_created ON system_email_logs(created_at,id);
  `);

  // Backfill hashes opportunistically for known attachment tables. Failures are harmless.
  try{for(const r of db.prepare("SELECT id,file_path FROM excavator_documents WHERE COALESCE(sha256,'')='' AND COALESCE(file_path,'')<>'' LIMIT 500").all()){const full=path.join(path.dirname(uploads),String(r.file_path).replace(/^\//,'')),h=hashFile(full);if(h)db.prepare('UPDATE excavator_documents SET sha256=? WHERE id=?').run(h,r.id)}}catch(_){ }
  try{for(const r of db.prepare("SELECT id,file_path FROM finance_attachments WHERE COALESCE(sha256,'')='' AND COALESCE(file_path,'')<>'' LIMIT 500").all()){const full=path.join(path.dirname(uploads),String(r.file_path).replace(/^\//,'')),h=hashFile(full);if(h)db.prepare('UPDATE finance_attachments SET sha256=? WHERE id=?').run(h,r.id)}}catch(_){ }

  // -------------------------------------------------------------------------
  // Central configuration catalog. Modules consume effective settings through
  // getSetting()/effectiveFor() rather than hard-coded values where V30.19 is wired.
  // -------------------------------------------------------------------------
  const SECTION_DEFS={
    overview:{label:'System Overview',policy:'technical',permission:null,defaults:{settings_version:VERSION,configuration_mode:'Controlled'}},
    company_profile_branding:{label:'Company Profile & Branding',policy:'policy',permission:null,defaults:{company_name:'Blue Ocean Market',company_logo:'',address:'',contact_phone:'',contact_email:'',registration_number:'',tax_number:'',pdf_report_branding:true,default_language:'en',timezone:'Asia/Seoul',base_currency:'KRW'}},
    business_units:{label:'Business Units',policy:'policy',permission:null,defaults:{allow_new_business_units:true,allow_bu_overrides:true,archive_instead_of_delete:true,module_configuration_enabled:true}},
    email_smtp:{label:'Email / SMTP Settings',policy:'technical',permission:'sensitive.smtp',defaults:{smtp_enabled:false,smtp_host:'',smtp_port:587,smtp_security:'STARTTLS',smtp_username:'',from_name:'Blue Ocean Market',from_email:'',reply_to:'',email_logs_enabled:true}},
    files_attachments:{label:'File & Attachment Settings',policy:'technical',permission:'sensitive.storage',defaults:{max_file_size_mb:20,allowed_file_types:'pdf,jpg,jpeg,png,webp,xlsx,xls,csv,doc,docx',max_attachments_per_record:30,optimize_images:false,image_quality:0.82,max_image_dimension_px:2200,pdf_document_limit_mb:25,preview_before_store:false,preserve_original_financial_legal:true,duplicate_hash_detection:true,storage_provider:'Local / Configured Volume',retention_days:3650,archive_instead_of_delete:true}},
    migration:{label:'Data Migration & Bulk Import',policy:'technical',permission:'sensitive.data_migration',defaults:{allow_excel:true,allow_csv:true,validate_before_import:true,preview_before_import:true,duplicate_detection:true,require_review_confirm:true,require_migration_id:true,require_opening_balance_reconciliation:true,never_silently_overwrite:true}},
    finance_accounting:{label:'Finance & Accounting Settings',policy:'policy',permission:'sensitive.accounting_configuration',defaults:{base_currency:'KRW',fiscal_year_start_month:1,posting_control_required:true,manual_journal_policy:'Review / Posting Control',evidence_required:true,bank_gl_mapping_required:true,reconciliation_required:true,period_close_requires_reconciliation:true,period_reopen_requires_reason:true,payment_method_required:true,non_cash_reference_required:true,verified_change_mode:'Correction / Reversal'}},
    bank_accounts:{label:'Company Bank Accounts',policy:'policy',permission:'sensitive.bank_accounts',defaults:{multiple_accounts_enabled:true,bank_gl_mapping_required:true,allow_unmapped_posting:false,restrict_gl_remap_after_transactions:true,close_instead_of_delete:true,bu_permission_scope_required:true}},
    security_access:{label:'Security & Access',policy:'policy',permission:null,defaults:{password_min_length:12,password_require_upper:true,password_require_lower:true,password_require_number:true,password_require_special:false,session_timeout_minutes:720,rate_limit_password_reset:true,administrator_accounts_controlled:true,sensitive_permissions_enabled:true}},
    approvals:{label:'Approval Settings',policy:'policy',permission:null,defaults:{approval_engine_enabled:true,ceo_bypass_with_confirmation:true,dual_approver_high_risk:true,bu_specific_rules:true,threshold_rules_enabled:true,settings_changes_can_require_approval:true}},
    notifications:{label:'Notifications',policy:'technical',permission:null,defaults:{in_app_enabled:true,email_enabled:false,sms_enabled:false,whatsapp_enabled:false,approval_alerts:true,task_reminders:true,finance_correction_alerts:true,failed_posting_alerts:true,period_close_warnings:true,avoid_low_value_email:true}},
    numbering:{label:'Numbering & References',policy:'policy',permission:null,defaults:{machine_prefix:'EX',deal_prefix:'DEAL',import_prefix:'IMP',invoice_prefix:'INV',payment_prefix:'PAY',batch_prefix:'BATCH',bu_specific_prefixes:true,reset_sequence_yearly:false}},
    localization:{label:'Localization',policy:'technical',permission:null,defaults:{supported_languages:'en,ko',default_language:'en',date_format:'YYYY-MM-DD',number_format:'1,234.56',timezone:'Asia/Seoul',base_currency:'KRW',persist_user_language:true}},
    backup_storage_maintenance:{label:'Backup / Storage / Maintenance',policy:'technical',permission:'sensitive.storage',defaults:{backup_enabled:true,backup_frequency:'Daily',backup_retention_days:30,orphan_file_checks:true,database_health_checks:true,maintenance_mode:false,show_migration_status:true}},
    audit:{label:'System Audit',policy:'policy',permission:null,defaults:{audit_enabled:true,old_to_new_history:true,require_change_reason:true,immutable_high_risk_history:true,retention_days:3650}},
    ai_assistant:{label:'AI Assistant Settings',policy:'technical',permission:'sensitive.ai_settings',defaults:{enabled:false,provider:'OpenAI',default_model:'',language_mode:'Auto',business_unit_scope:'User Authorized Units',module_access:'Authorized Modules Only',record_scope:'Authorized Records Only',action_capability:'Read Only',finance_accounting_access:false,employee_payroll_access:false,confidential_document_access:false,role_based_ai_permissions:true,usage_limit_per_user_month:0,monthly_budget_limit_usd:0,company_system_instructions:'',allowed_knowledge_sources:'System Help, Authorized Records',help_tutorial_mode:true,navigation_assistance:true,ai_logs_enabled:true,privacy_logging_mode:'Metadata + User-visible prompts/actions',authorization_chain:'User → Business Unit → Module → Record → Sensitive Permission',review_confirm_for_actions:true}}
  };
  const SECTIONS=Object.keys(SECTION_DEFS);
  const POLICY_SECTIONS=new Set(SECTIONS.filter(k=>SECTION_DEFS[k].policy==='policy'));
  const HIGH_RISK_KEYS=new Set(['base_currency','fiscal_year_start_month','posting_control_required','manual_journal_policy','evidence_required','bank_gl_mapping_required','storage_provider','never_silently_overwrite','machine_prefix','deal_prefix','import_prefix','invoice_prefix','payment_prefix','batch_prefix']);

  function isSystemAdmin(req,bu){return req.user.role==='CEO / Owner'||!!access?.can?.(req.user.id,'sensitive.system_admin',bu||req.selected_business_unit_id||req.user.business_unit_id)}
  function specificAllowed(req,permission,bu){return req.user.role==='CEO / Owner'||(!permission?isSystemAdmin(req,bu):isSystemAdmin(req,bu)&&!!access?.can?.(req.user.id,permission,bu||req.selected_business_unit_id||req.user.business_unit_id))}
  function canManageSection(req,section,bu){if(req.user.role==='CEO / Owner')return true;if(POLICY_SECTIONS.has(section))return false;return specificAllowed(req,SECTION_DEFS[section]?.permission,bu)}
  function normalizeScope(req,scopeType,scopeId){
    const type=['company','business_unit','user'].includes(scopeType)?scopeType:'company';
    if(type==='company')return {type,id:0,bu:null};
    if(type==='business_unit'){
      const id=Number(scopeId||req.selected_business_unit_id||currentUnit(req)||0);if(!id)throw Object.assign(new Error('Select a business unit.'),{status:400});
      if(req.user.role!=='CEO / Owner'&&!enforceUnit(req,id))throw Object.assign(new Error('You cannot manage settings for another business unit.'),{status:403});
      return {type,id,bu:id};
    }
    const id=Number(scopeId||req.user.id);if(!id)throw Object.assign(new Error('Select a user.'),{status:400});
    const u=db.prepare('SELECT id,business_unit_id FROM users WHERE id=?').get(id);if(!u)throw Object.assign(new Error('User not found.'),{status:404});
    const bu=Number(u.business_unit_id||req.selected_business_unit_id||0)||null;
    if(req.user.role!=='CEO / Owner'&&Number(id)!==Number(req.user.id)&&!isSystemAdmin(req,bu))throw Object.assign(new Error('You cannot manage settings for this user.'),{status:403});
    return {type,id,bu};
  }
  function rowSettings(type,id,section){const r=db.prepare('SELECT settings_json FROM system_settings WHERE scope_type=? AND scope_id=? AND section=?').get(type,id,section);return r?safeJson(r.settings_json,{}):{}}
  function effectiveFor(section,bu,userId){const defaults={...(SECTION_DEFS[section]?.defaults||{})},company=rowSettings('company',0,section),business=bu?rowSettings('business_unit',bu,section):{},user=userId?rowSettings('user',userId,section):{};return {...defaults,...company,...business,...user}}
  function getSetting(section,key,{businessUnitId=null,userId=null,fallback=undefined}={}){const x=effectiveFor(section,businessUnitId,userId);return Object.prototype.hasOwnProperty.call(x,key)?x[key]:fallback}
  function sanitize(section,data){
    const defs=SECTION_DEFS[section]?.defaults||{},out={};
    for(const key of Object.keys(defs))if(Object.prototype.hasOwnProperty.call(data||{},key)){
      let v=data[key],sample=defs[key];
      if(typeof sample==='boolean')v=v===true||v==='true'||v===1||v==='1';
      else if(typeof sample==='number'){v=Number(v);if(!Number.isFinite(v))v=sample}
      else v=text(v);
      out[key]=v;
    }
    if(section==='files_attachments'){
      out.max_file_size_mb=Math.max(1,Math.min(200,Number(out.max_file_size_mb||defs.max_file_size_mb)));
      out.max_attachments_per_record=Math.max(1,Math.min(100,Number(out.max_attachments_per_record||defs.max_attachments_per_record)));
      out.max_image_dimension_px=Math.max(800,Math.min(6000,Number(out.max_image_dimension_px||defs.max_image_dimension_px)));
      out.image_quality=Math.max(.4,Math.min(.98,Number(out.image_quality||defs.image_quality)));
      out.pdf_document_limit_mb=Math.max(1,Math.min(200,Number(out.pdf_document_limit_mb||defs.pdf_document_limit_mb)));
      out.retention_days=Math.max(30,Math.min(36500,Number(out.retention_days||defs.retention_days)));
    }
    if(section==='security_access'){
      out.password_min_length=Math.max(8,Math.min(64,Number(out.password_min_length||defs.password_min_length)));
      out.session_timeout_minutes=Math.max(15,Math.min(10080,Number(out.session_timeout_minutes||defs.session_timeout_minutes)));
    }
    if(section==='backup_storage_maintenance')out.backup_retention_days=Math.max(1,Math.min(3650,Number(out.backup_retention_days||defs.backup_retention_days)));
    if(section==='finance_accounting')out.fiscal_year_start_month=Math.max(1,Math.min(12,Number(out.fiscal_year_start_month||1)));
    if(section==='ai_assistant'){
      out.usage_limit_per_user_month=Math.max(0,Number(out.usage_limit_per_user_month||0));
      out.monthly_budget_limit_usd=Math.max(0,Number(out.monthly_budget_limit_usd||0));
      out.authorization_chain=defs.authorization_chain;
      out.review_confirm_for_actions=true;
    }
    return out;
  }
  function changedKeys(before,after){return [...new Set([...Object.keys(before||{}),...Object.keys(after||{})])].filter(k=>JSON.stringify(before?.[k])!==JSON.stringify(after?.[k]))}
  function fail(res,e){res.status(e.status||500).json({error:e.message||'System settings error'})}

  // -------------------------------------------------------------------------
  // Encrypted secrets. Secrets never come back through settings APIs.
  // -------------------------------------------------------------------------
  const secretKey=crypto.createHash('sha256').update(String(secret||process.env.JWT_SECRET||'BlueOceanLocalOnly')).digest();
  function encryptSecret(value){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',secretKey,iv),encrypted=Buffer.concat([cipher.update(String(value),'utf8'),cipher.final()]);return {ciphertext:encrypted.toString('base64'),iv:iv.toString('base64'),auth_tag:cipher.getAuthTag().toString('base64')}}
  function decryptSecret(row){if(!row)return '';try{const dec=crypto.createDecipheriv('aes-256-gcm',secretKey,Buffer.from(row.iv,'base64'));dec.setAuthTag(Buffer.from(row.auth_tag,'base64'));return Buffer.concat([dec.update(Buffer.from(row.ciphertext,'base64')),dec.final()]).toString('utf8')}catch(_){return ''}}
  function setSecret(scopeType,scopeId,key,value,userId){if(!text(value))return;const x=encryptSecret(value);db.prepare(`INSERT INTO system_secrets(scope_type,scope_id,secret_key,ciphertext,iv,auth_tag,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(scope_type,scope_id,secret_key) DO UPDATE SET ciphertext=excluded.ciphertext,iv=excluded.iv,auth_tag=excluded.auth_tag,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP`).run(scopeType,scopeId,key,x.ciphertext,x.iv,x.auth_tag,userId)}
  function getSecret(scopeType,scopeId,key){return decryptSecret(db.prepare('SELECT * FROM system_secrets WHERE scope_type=? AND scope_id=? AND secret_key=?').get(scopeType,scopeId,key))}
  function hasSecret(scopeType,scopeId,key){return !!db.prepare('SELECT id FROM system_secrets WHERE scope_type=? AND scope_id=? AND secret_key=?').get(scopeType,scopeId,key)}
  function clearSecret(scopeType,scopeId,key){db.prepare('DELETE FROM system_secrets WHERE scope_type=? AND scope_id=? AND secret_key=?').run(scopeType,scopeId,key)}

  // -------------------------------------------------------------------------
  // Minimal SMTP client using only Node core modules. Supports None, STARTTLS,
  // SSL/TLS and AUTH LOGIN. This keeps the local-test build dependency-free.
  // -------------------------------------------------------------------------
  function smtpReader(socket){
    let buf='',current=[],queue=[],waiters=[];
    const flush=()=>{while(queue.length&&waiters.length)waiters.shift()(queue.shift())};
    const onData=d=>{buf+=d.toString('utf8');for(;;){const i=buf.indexOf('\r\n');if(i<0)break;const line=buf.slice(0,i);buf=buf.slice(i+2);current.push(line);if(/^\d{3} /.test(line)){queue.push(current);current=[];flush()}}};
    socket.on('data',onData);
    return {read:()=>queue.length?Promise.resolve(queue.shift()):new Promise(resolve=>waiters.push(resolve)),detach:()=>socket.off('data',onData)};
  }
  async function smtpSend(config,{to,subject,textBody}){
    const host=text(config.smtp_host),port=Number(config.smtp_port||587),security=text(config.smtp_security||'STARTTLS').toUpperCase();
    if(!host||!port)throw new Error('SMTP host and port are required.');
    const rejectUnauthorized=config.allow_self_signed!==true;
    let socket=await new Promise((resolve,reject)=>{
      const s=security.includes('SSL')?tls.connect({host,port,servername:host,rejectUnauthorized},()=>resolve(s)):net.createConnection({host,port},()=>resolve(s));
      s.setTimeout(15000,()=>s.destroy(new Error('SMTP connection timed out.')));s.once('error',reject);
    });
    let reader=smtpReader(socket);
    const response=async(expected)=>{const lines=await reader.read(),last=lines[lines.length-1]||'',code=Number(last.slice(0,3));if(expected&&!expected.includes(code))throw new Error(`SMTP ${code||'error'}: ${lines.join(' | ')}`);return {code,lines}};
    const cmd=async(line,expected)=>{socket.write(line+'\r\n');return response(expected)};
    try{
      await response([220]);
      await cmd('EHLO blue-ocean-market.local',[250]);
      if(security==='STARTTLS'){
        await cmd('STARTTLS',[220]);reader.detach();
        socket=await new Promise((resolve,reject)=>{const s=tls.connect({socket,servername:host,rejectUnauthorized},()=>resolve(s));s.once('error',reject)});reader=smtpReader(socket);await cmd('EHLO blue-ocean-market.local',[250]);
      }
      const username=text(config.smtp_username),password=text(config.smtp_password);
      if(username){await cmd('AUTH LOGIN',[334]);await cmd(Buffer.from(username).toString('base64'),[334]);await cmd(Buffer.from(password).toString('base64'),[235])}
      const from=text(config.from_email||username);if(!from)throw new Error('SMTP From Email is required.');
      await cmd(`MAIL FROM:<${from}>`,[250]);await cmd(`RCPT TO:<${to}>`,[250,251]);await cmd('DATA',[354]);
      const safeBody=String(textBody||'').replace(/\r?\n\./g,'\r\n..');
      const headers=[`From: ${text(config.from_name)||'Blue Ocean Market'} <${from}>`,`To: <${to}>`,`Subject: ${String(subject||'Blue Ocean Market')}`,`Date: ${new Date().toUTCString()}`,'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8',`Reply-To: ${text(config.reply_to||from)}`,'',safeBody].join('\r\n');
      socket.write(headers+'\r\n.\r\n');await response([250]);await cmd('QUIT',[221]);return true;
    }finally{try{socket.end()}catch(_){}}
  }
  function smtpConfig(){const cfg=effectiveFor('email_smtp',null,null);return {...cfg,smtp_password:getSecret('company',0,'smtp_password')}}
  function logEmail({purpose,recipient,subject,status,error='',userId=null}){db.prepare('INSERT INTO system_email_logs(purpose,recipient,subject,status,error_text,requested_by) VALUES(?,?,?,?,?,?)').run(purpose,recipient,subject,status,text(error).slice(0,2000),userId)}

  // -------------------------------------------------------------------------
  // CSV / XLSX reader used by migration staging and bank statement imports.
  // XLSX parsing is intentionally limited to normal tabular first-sheet files.
  // -------------------------------------------------------------------------
  function parseCsv(s){
    s=String(s||'').replace(/^\uFEFF/,'');const rows=[],row=[];let field='',quoted=false;
    const pushField=()=>{row.push(field);field=''};const pushRow=()=>{if(row.some(v=>text(v)!==''))rows.push(row.slice());row.length=0};
    for(let i=0;i<s.length;i++){const ch=s[i];if(quoted){if(ch==='"'&&s[i+1]==='"'){field+='"';i++}else if(ch==='"')quoted=false;else field+=ch}else if(ch==='"')quoted=true;else if(ch===',')pushField();else if(ch==='\n'){pushField();pushRow()}else if(ch!=='\r')field+=ch}pushField();pushRow();return rows;
  }
  function zipEntries(buffer){
    let eocd=-1;for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--)if(buffer.readUInt32LE(i)===0x06054b50){eocd=i;break}if(eocd<0)throw new Error('Invalid XLSX/ZIP file.');
    const count=buffer.readUInt16LE(eocd+10),cdOffset=buffer.readUInt32LE(eocd+16),out={};let p=cdOffset;
    for(let n=0;n<count;n++){if(buffer.readUInt32LE(p)!==0x02014b50)throw new Error('Invalid XLSX central directory.');const method=buffer.readUInt16LE(p+10),comp=buffer.readUInt32LE(p+20),nameLen=buffer.readUInt16LE(p+28),extraLen=buffer.readUInt16LE(p+30),commentLen=buffer.readUInt16LE(p+32),local=buffer.readUInt32LE(p+42),name=buffer.slice(p+46,p+46+nameLen).toString('utf8');if(buffer.readUInt32LE(local)!==0x04034b50)throw new Error('Invalid XLSX local entry.');const ln=buffer.readUInt16LE(local+26),le=buffer.readUInt16LE(local+28),start=local+30+ln+le,data=buffer.slice(start,start+comp);out[name]=method===0?data:method===8?zlib.inflateRawSync(data):null;p+=46+nameLen+extraLen+commentLen}return out;
  }
  const xmlDecode=s=>String(s||'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));
  const colIndex=ref=>{const m=String(ref||'A').match(/^([A-Z]+)/i),letters=(m?.[1]||'A').toUpperCase();let n=0;for(const c of letters)n=n*26+(c.charCodeAt(0)-64);return n-1};
  function parseXlsx(buffer){
    const z=zipEntries(buffer),sharedXml=z['xl/sharedStrings.xml']?.toString('utf8')||'',shared=[];for(const m of sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)){const parts=[...m[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(x=>xmlDecode(x[1]));shared.push(parts.join(''))}
    let sheetName='xl/worksheets/sheet1.xml';if(!z[sheetName])sheetName=Object.keys(z).find(k=>/^xl\/worksheets\/sheet\d+\.xml$/i.test(k));if(!sheetName||!z[sheetName])throw new Error('No worksheet found in XLSX.');const xml=z[sheetName].toString('utf8'),rows=[];
    for(const rm of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)){const row=[];for(const cm of rm[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)){const attrs=cm[1],body=cm[2],ref=(attrs.match(/\br="([^"]+)"/)||[])[1]||'',type=(attrs.match(/\bt="([^"]+)"/)||[])[1]||'',idx=colIndex(ref);let value='';if(type==='inlineStr'){value=xmlDecode(([...body.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(x=>x[1]).join('')))}else{value=xmlDecode((body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)||[])[1]||'');if(type==='s')value=shared[Number(value)]??value}row[idx]=value}if(row.some(v=>text(v)!==''))rows.push(row)}return rows;
  }
  function parseTabularFile(file){const buf=fs.readFileSync(file.path),ext=path.extname(file.originalname||'').toLowerCase();if(ext==='.xlsx')return parseXlsx(buf);if(ext==='.csv'||ext==='.txt')return parseCsv(buf.toString('utf8'));throw new Error('Use .xlsx or .csv for structured imports.')}
  function rowsToObjects(rows){if(!rows.length)return {headers:[],objects:[]};const headers=rows[0].map((h,i)=>text(h)||`Column ${i+1}`);return {headers,objects:rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])))} }
  function hkey(v){return text(v).toLowerCase().replace(/[\s_\-\/().]+/g,'').replace(/[^a-z0-9가-힣]/g,'')}
  const FIELD_ALIASES={
    name:['suppliername','name','공급업체명','공급자명'],location:['location','위치'],contact_person:['contactperson','contact','담당자'],phone:['phone','mobile','mobilenumber','전화번호','휴대폰'],email:['email','이메일'],address:['address','주소'],notes:['notes','note','메모','비고'],
    supplier_name:['suppliername','supplier','공급업체명','공급자'],machine_name:['machinename','machine','장비명','기계명'],machine_type:['machinetype','type','장비유형'],make:['make','manufacturer','제조사'],model:['model','모델'],year:['year','연식'],condition:['condition','상태'],serial_no:['serialchassis','serialno','chassis','차대번호','시리얼'],asking_price:['askingpricekrw','askingprice','가격'],
    account_code:['accountcode','glcode','계정코드'],opening_balance:['openingbalancekrw','openingbalance','기초잔액'],reference:['reference','migrationreference','참조'],date:['date','statementdate','날짜'],description:['description','적요'],amount:['amountkrw','amount','금액']
  };
  function inferMapping(headers,fields){const normalized=headers.map(h=>hkey(h)),map={};for(const field of fields){const aliases=(FIELD_ALIASES[field]||[field]).map(hkey),i=normalized.findIndex(h=>aliases.includes(h));if(i>=0)map[field]=headers[i]}return map}
  function mapObject(source,mapping){const out={};for(const [k,h] of Object.entries(mapping||{}))out[k]=source?.[h]??'';return out}

  // -------------------------------------------------------------------------
  // Settings API and dynamic system overview.
  // -------------------------------------------------------------------------
  app.get('/api/system-settings-v319/catalog',auth,(req,res)=>{
    const bu=Number(req.selected_business_unit_id||currentUnit(req)||0)||null;if(!isSystemAdmin(req,bu))return res.status(403).json({error:'System Settings requires CEO / Owner or System Administrator access.'});
    res.json({version:VERSION,sections:SECTIONS.map(key=>({key,label:SECTION_DEFS[key].label,policy:SECTION_DEFS[key].policy,permission:SECTION_DEFS[key].permission,defaults:SECTION_DEFS[key].defaults})),can_manage_policy:req.user.role==='CEO / Owner'});
  });
  app.get('/api/system-settings-v319',auth,(req,res)=>{
    try{const sc=normalizeScope(req,text(req.query.scope_type||'company'),req.query.scope_id);if(!isSystemAdmin(req,sc.bu))return res.status(403).json({error:'System Settings requires CEO / Owner or System Administrator access.'});const bu=Number(req.query.business_unit_id||sc.bu||req.selected_business_unit_id||currentUnit(req)||0)||null,userId=Number(req.query.user_id||req.user.id||0)||null;const sections={};for(const section of SECTIONS)sections[section]={saved:rowSettings(sc.type,sc.id,section),effective:effectiveFor(section,bu,userId),can_edit:canManageSection(req,section,sc.bu)};if(sections.email_smtp)sections.email_smtp.password_set=hasSecret('company',0,'smtp_password');if(sections.ai_assistant)sections.ai_assistant.api_key_set=hasSecret('company',0,'ai_api_key');res.json({scope_type:sc.type,scope_id:sc.id,business_unit_id:bu,user_id:userId,sections})}catch(e){fail(res,e)}
  });
  app.get('/api/system-settings-v319/effective-client',auth,(req,res)=>{const bu=Number(req.selected_business_unit_id||currentUnit(req)||req.user.business_unit_id||0)||null,userId=Number(req.user.id)||null;res.json({files_attachments:effectiveFor('files_attachments',bu,userId),localization:effectiveFor('localization',bu,userId),finance_accounting:effectiveFor('finance_accounting',bu,userId),notifications:effectiveFor('notifications',bu,userId)})});
  app.get('/api/system-settings-v319/history',auth,(req,res)=>{try{const sc=normalizeScope(req,text(req.query.scope_type||'company'),req.query.scope_id);if(!isSystemAdmin(req,sc.bu))return res.status(403).json({error:'System Settings access is required.'});const section=text(req.query.section),args=[sc.type,sc.id],where=section?' AND h.section=?':'';if(section)args.push(section);const rows=db.prepare(`SELECT h.*,u.name changed_by_name FROM system_settings_history h LEFT JOIN users u ON u.id=h.changed_by WHERE h.scope_type=? AND h.scope_id=?${where} ORDER BY h.id DESC LIMIT 500`).all(...args).map(r=>({...r,before:safeJson(r.before_json,{}),after:safeJson(r.after_json,{})}));res.json(rows)}catch(e){fail(res,e)}});
  app.put('/api/system-settings-v319/:section',auth,(req,res)=>{
    try{
      const section=text(req.params.section);if(!SECTION_DEFS[section])return res.status(404).json({error:'Unknown settings section.'});const sc=normalizeScope(req,text(req.body.scope_type||'company'),req.body.scope_id);if(!isSystemAdmin(req,sc.bu))return res.status(403).json({error:'System Settings requires CEO / Owner or System Administrator access.'});if(!canManageSection(req,section,sc.bu))return res.status(403).json({error:'This policy/high-risk section is not within your System Administrator authority. CEO / Owner authorization is required.'});
      const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Change reason is required for System Settings.'});const before=rowSettings(sc.type,sc.id,section),after=sanitize(section,req.body.settings||{}),changed=changedKeys(before,after),highRisk=changed.filter(k=>HIGH_RISK_KEYS.has(k));if(highRisk.length&&!req.body.confirm_high_risk)return res.status(409).json({error:'High-risk setting change requires explicit Review & Confirm.',high_risk_keys:highRisk});
      if(section==='email_smtp'&&text(req.body.secret_password))setSecret('company',0,'smtp_password',req.body.secret_password,req.user.id);if(section==='email_smtp'&&req.body.clear_password===true)clearSecret('company',0,'smtp_password');if(section==='ai_assistant'&&text(req.body.secret_api_key))setSecret('company',0,'ai_api_key',req.body.secret_api_key,req.user.id);if(section==='ai_assistant'&&req.body.clear_api_key===true)clearSecret('company',0,'ai_api_key');
      db.transaction(()=>{db.prepare(`INSERT INTO system_settings(scope_type,scope_id,section,settings_json,updated_by,updated_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(scope_type,scope_id,section) DO UPDATE SET settings_json=excluded.settings_json,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP`).run(sc.type,sc.id,section,JSON.stringify(after),req.user.id);db.prepare('INSERT INTO system_settings_history(scope_type,scope_id,section,before_json,after_json,reason,changed_by) VALUES(?,?,?,?,?,?,?)').run(sc.type,sc.id,section,JSON.stringify(before),JSON.stringify(after),reason,req.user.id)})();audit(req.user,'system_settings',sc.id,`update:${section}`,JSON.stringify({scope_type:sc.type,reason,changed_keys:changed,high_risk_keys:highRisk,before,after}));res.json({ok:true,scope_type:sc.type,scope_id:sc.id,section,saved:after,password_set:section==='email_smtp'?hasSecret('company',0,'smtp_password'):undefined,api_key_set:section==='ai_assistant'?hasSecret('company',0,'ai_api_key'):undefined});
    }catch(e){fail(res,e)}
  });

  function dirSize(dir){let total=0;try{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())total+=dirSize(p);else total+=fs.statSync(p).size}}catch(_){ }return total}
  app.get('/api/system-settings-v319/overview',auth,(req,res)=>{
    if(!isSystemAdmin(req,Number(req.selected_business_unit_id||0)||null))return res.status(403).json({error:'System Settings access is required.'});
    let dbOk=true,dbError='';try{db.prepare('SELECT 1 ok').get()}catch(e){dbOk=false;dbError=e.message}const dbPath=db.name||'',dbSize=dbPath&&dbPath!==':memory:'&&fs.existsSync(dbPath)?fs.statSync(dbPath).size:0,storageBytes=dirSize(uploads),lastBackup=db.prepare('SELECT * FROM system_backup_log ORDER BY id DESC LIMIT 1').get()||null,pendingMigrations=Number(db.prepare("SELECT COUNT(*) c FROM system_migration_jobs WHERE status NOT IN ('Imported','Cancelled')").get().c||0),activeBus=Number(db.prepare("SELECT COUNT(*) c FROM business_units WHERE status!='Archived'").get().c||0),activeUsers=Number(db.prepare('SELECT COUNT(*) c FROM users WHERE active=1').get().c||0),smtp=effectiveFor('email_smtp',null,null),warnings=[];
    if(!smtp.smtp_enabled)warnings.push({code:'SMTP_DISABLED',level:'warning',message:'Outgoing email is disabled. Password reset links will not be emailed in production.'});if(!hasSecret('company',0,'smtp_password')&&smtp.smtp_username)warnings.push({code:'SMTP_PASSWORD_MISSING',level:'warning',message:'SMTP username is configured but no secure SMTP password is stored.'});if(pendingMigrations)warnings.push({code:'PENDING_MIGRATIONS',level:'warning',message:`${pendingMigrations} migration job(s) are not finalized.`});if(!dbOk)warnings.push({code:'DATABASE_ERROR',level:'critical',message:dbError});
    let closedOrInactiveBank=0;try{closedOrInactiveBank=Number(db.prepare("SELECT COUNT(*) c FROM accounting_payment_accounts WHERE active=0 OR COALESCE(status,'Active')!='Active'").get().c||0)}catch(_){ }
    res.json({version:VERSION,environment:process.env.NODE_ENV||'development',local_test_mode:String(process.env.LOCAL_TEST_MODE||'').toLowerCase()==='true',database:{ok:dbOk,error:dbError,size_bytes:dbSize,path_label:dbPath?path.basename(dbPath):''},storage:{provider:effectiveFor('files_attachments',null,null).storage_provider,usage_bytes:storageBytes,upload_path_label:path.basename(uploads)},last_backup:lastBackup,active_business_units:activeBus,active_users:activeUsers,pending_migrations:pendingMigrations,inactive_or_closed_bank_accounts:closedOrInactiveBank,warnings,generated_at:now()});
  });

  // -------------------------------------------------------------------------
  // Email / SMTP diagnostics, logs and secure test email.
  // -------------------------------------------------------------------------
  app.get('/api/system-settings-v319/email-logs',auth,(req,res)=>{if(!specificAllowed(req,'sensitive.smtp',Number(req.selected_business_unit_id||0)||null))return res.status(403).json({error:'SMTP permission is required.'});res.json(db.prepare('SELECT l.*,u.name requested_by_name FROM system_email_logs l LEFT JOIN users u ON u.id=l.requested_by ORDER BY l.id DESC LIMIT 300').all())});
  app.get('/api/system-settings-v319/smtp/status',auth,(req,res)=>{if(!isSystemAdmin(req,Number(req.selected_business_unit_id||0)||null))return res.status(403).json({error:'System Settings access is required.'});const c=effectiveFor('email_smtp',null,null),last=db.prepare("SELECT * FROM system_email_logs WHERE purpose='SMTP Test' ORDER BY id DESC LIMIT 1").get()||null;res.json({enabled:!!c.smtp_enabled,configured:!!(c.smtp_host&&c.smtp_port&&c.from_email),password_set:hasSecret('company',0,'smtp_password'),last_test:last})});
  app.post('/api/system-settings-v319/smtp/test',auth,async(req,res)=>{if(!specificAllowed(req,'sensitive.smtp',Number(req.selected_business_unit_id||0)||null))return res.status(403).json({error:'Manage SMTP permission is required.'});const to=text(req.body.to||req.user.email);if(!validEmail(to))return res.status(400).json({error:'Enter a valid test recipient email.'});const c=smtpConfig();try{await smtpSend(c,{to,subject:'Blue Ocean Market SMTP Test',textBody:`Blue Ocean Market V${VERSION} SMTP test succeeded at ${now()}.`});logEmail({purpose:'SMTP Test',recipient:to,subject:'Blue Ocean Market SMTP Test',status:'Sent',userId:req.user.id});audit(req.user,'system_smtp',null,'test-success',to);res.json({ok:true,message:'Test email sent successfully.'})}catch(e){logEmail({purpose:'SMTP Test',recipient:to,subject:'Blue Ocean Market SMTP Test',status:'Failed',error:e.message,userId:req.user.id});audit(req.user,'system_smtp',null,'test-failed',e.message);res.status(502).json({error:'SMTP test failed: '+e.message})}});

  // Secure forgot-password override. This route is installed before the legacy local-test route.
  const resetRate=new Map();
  app.post('/api/auth/forgot',async(req,res)=>{
    const email=text(req.body?.email).toLowerCase(),ip=text(req.ip||req.socket?.remoteAddress||'unknown'),key=crypto.createHash('sha1').update(ip+'|'+email).digest('hex'),nowMs=Date.now(),windowMs=15*60*1000,limit=5,old=resetRate.get(key);if(!old||nowMs-old.start>windowMs)resetRate.set(key,{start:nowMs,count:1});else{old.count++;if(old.count>limit)return res.status(429).json({message:'If the account exists, password-reset instructions will be sent shortly.'})}
    const response={message:'If the account exists, password-reset instructions will be sent shortly.'},u=email?db.prepare('SELECT * FROM users WHERE lower(email)=lower(?) AND active=1').get(email):null;if(!u)return res.json(response);
    const token=crypto.randomBytes(32).toString('hex');db.prepare("UPDATE password_resets SET used=1 WHERE user_id=? AND used=0").run(u.id);db.prepare("INSERT INTO password_resets(user_id,token,expires_at) VALUES(?,?,datetime('now','+30 minutes'))").run(u.id,token);const base=`${req.protocol}://${req.get('host')}`,resetUrl=`${base}/?reset=${token}`,smtp=smtpConfig();
    let emailStatus='Not Sent';if(smtp.smtp_enabled){try{await smtpSend(smtp,{to:u.email,subject:'Blue Ocean Market password reset',textBody:`A password reset was requested for your Blue Ocean Market account.\n\nOpen this link within 30 minutes:\n${resetUrl}\n\nIf you did not request this, ignore this email.`});emailStatus='Sent';logEmail({purpose:'Password Reset',recipient:u.email,subject:'Blue Ocean Market password reset',status:'Sent'})}catch(e){emailStatus='Failed';logEmail({purpose:'Password Reset',recipient:u.email,subject:'Blue Ocean Market password reset',status:'Failed',error:e.message})}}
    audit(null,'password_reset',u.id,'requested',JSON.stringify({email_status:emailStatus}));if(String(process.env.LOCAL_TEST_MODE||'').toLowerCase()==='true'&&String(process.env.NODE_ENV||'development')!=='production')response.reset_url=resetUrl;res.json(response);
  });


  // Secure password-reset completion. The V30.19 route is installed before the
  // legacy local-test route and consumes the centralized password policy.
  app.post('/api/auth/reset',(req,res)=>{
    try{
      const r=db.prepare("SELECT pr.*,u.email,u.active FROM password_resets pr JOIN users u ON u.id=pr.user_id WHERE pr.token=? AND pr.used=0 AND datetime(pr.expires_at)>datetime('now')").get(text(req.body?.token));
      if(!r||!r.active)return res.status(400).json({error:'Reset token is invalid or expired'});
      const password=String(req.body?.password||''),policy=effectiveFor('security_access',null,r.user_id),min=Math.max(8,Number(policy.password_min_length||12)),errors=[];
      if(password.length<min)errors.push(`at least ${min} characters`);
      if(policy.password_require_upper&&!/[A-Z]/.test(password))errors.push('an uppercase letter');
      if(policy.password_require_lower&&!/[a-z]/.test(password))errors.push('a lowercase letter');
      if(policy.password_require_number&&!/[0-9]/.test(password))errors.push('a number');
      if(policy.password_require_special&&!/[^A-Za-z0-9]/.test(password))errors.push('a special character');
      if(errors.length)return res.status(400).json({error:'Password must contain '+errors.join(', ')+'.'});
      const bcrypt=require('bcryptjs');
      db.transaction(()=>{db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(password,12),r.user_id);db.prepare('UPDATE password_resets SET used=1 WHERE user_id=? AND used=0').run(r.user_id)})();
      audit(null,'password_reset',r.user_id,'completed',JSON.stringify({policy_min_length:min}));
      res.json({ok:true});
    }catch(e){fail(res,e)}
  });

  // System Settings owns the administrative Business Unit view. The existing
  // operational Business Unit routes remain intact; these endpoints expose
  // archived units and always archive rather than destructively deleting history.
  app.get('/api/system-settings-v319/business-units',auth,(req,res)=>{
    if(req.user.role!=='CEO / Owner'&&!isSystemAdmin(req,Number(req.selected_business_unit_id||0)||null))return res.status(403).json({error:'System Settings access is required.'});
    res.json(db.prepare(`SELECT b.*,u.name manager_name,
      (SELECT COUNT(*) FROM users x WHERE x.active=1 AND (x.business_unit_id=b.id OR EXISTS(SELECT 1 FROM user_business_units ubu WHERE ubu.user_id=x.id AND ubu.business_unit_id=b.id))) active_user_count,
      (SELECT COUNT(*) FROM finance_entries f WHERE f.business_unit_id=b.id) finance_record_count
      FROM business_units b LEFT JOIN users u ON u.id=b.manager_id ORDER BY CASE WHEN b.status='Archived' THEN 1 ELSE 0 END,b.name`).all());
  });
  app.post('/api/system-settings-v319/business-units',auth,(req,res)=>{
    if(req.user.role!=='CEO / Owner')return res.status(403).json({error:'Only CEO / Owner can create business units.'});
    const name=text(req.body.name),reason=text(req.body.reason);if(!name)return res.status(400).json({error:'Business Unit name is required.'});if(!reason)return res.status(400).json({error:'Creation reason is required.'});
    try{const r=db.prepare("INSERT INTO business_units(name,manager_id,status,notes) VALUES(?,?,?,?)").run(name,req.body.manager_id?Number(req.body.manager_id):null,'Active',text(req.body.notes));audit(req.user,'business_unit',r.lastInsertRowid,'create-from-system-settings',JSON.stringify({name,reason}));res.json({id:r.lastInsertRowid})}catch(e){if(/UNIQUE/i.test(e.message))return res.status(409).json({error:'A Business Unit with this name already exists.'});fail(res,e)}
  });
  app.put('/api/system-settings-v319/business-units/:id',auth,(req,res)=>{
    if(req.user.role!=='CEO / Owner')return res.status(403).json({error:'Only CEO / Owner can change Business Unit policy.'});
    const b=db.prepare('SELECT * FROM business_units WHERE id=?').get(req.params.id);if(!b)return res.status(404).json({error:'Business Unit not found.'});const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Change reason is required.'});
    const status=['Active','Inactive','Closed','Archived'].includes(text(req.body.status))?text(req.body.status):b.status;
    db.prepare('UPDATE business_units SET name=?,manager_id=?,status=?,notes=? WHERE id=?').run(text(req.body.name)||b.name,req.body.manager_id?Number(req.body.manager_id):null,status,text(req.body.notes??b.notes),b.id);
    audit(req.user,'business_unit',b.id,'update-from-system-settings',JSON.stringify({reason,before:{name:b.name,status:b.status,manager_id:b.manager_id},after:{name:text(req.body.name)||b.name,status,manager_id:req.body.manager_id?Number(req.body.manager_id):null}}));res.json({ok:true});
  });
  app.post('/api/system-settings-v319/business-units/:id/archive',auth,(req,res)=>{
    if(req.user.role!=='CEO / Owner')return res.status(403).json({error:'Only CEO / Owner can archive a Business Unit.'});const b=db.prepare('SELECT * FROM business_units WHERE id=?').get(req.params.id);if(!b)return res.status(404).json({error:'Business Unit not found.'});const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Archive reason is required.'});
    db.prepare("UPDATE business_units SET status='Archived' WHERE id=?").run(b.id);audit(req.user,'business_unit',b.id,'archive-from-system-settings',JSON.stringify({reason,name:b.name}));res.json({ok:true,status:'Archived',history_preserved:true});
  });

  // -------------------------------------------------------------------------
  // Company Bank Accounts. Uses V29 accounting_payment_accounts as the single
  // operational source so Finance/Accounting/Reconciliation consume the same IDs.
  // -------------------------------------------------------------------------
  function canBank(req,bu){return req.user.role==='CEO / Owner'||(isSystemAdmin(req,bu)&&!!access?.can?.(req.user.id,'sensitive.bank_accounts',bu||req.selected_business_unit_id||req.user.business_unit_id))}
  function bankRefs(id){const q=(table,col)=>{try{return tableExists(table)?Number(db.prepare(`SELECT COUNT(*) c FROM ${table} WHERE ${col}=?`).get(id).c||0):0}catch(_){return 0}};return {finance:q('finance_entries','payment_account_id'),statements:q('accounting_bank_statement_lines','payment_account_id'),payroll:q('payroll_payments','payment_account_id'),employee_advances:q('employee_advances','payment_account_id'),inter_bu_from:q('accounting_inter_unit_transfers','from_payment_account_id'),inter_bu_to:q('accounting_inter_unit_transfers','to_payment_account_id')}}
  function bankRefTotal(r){return Object.values(r).reduce((a,b)=>a+Number(b||0),0)}
  function bankRow(id){return db.prepare(`SELECT p.*,b.name business_unit,a.code ledger_code,a.name ledger_name,a.account_type ledger_type FROM accounting_payment_accounts p LEFT JOIN business_units b ON b.id=p.business_unit_id LEFT JOIN accounting_accounts a ON a.id=p.ledger_account_id WHERE p.id=?`).get(id)}
  function validateBankScope(req,bu){if(bu&&req.user.role!=='CEO / Owner'&&!enforceUnit(req,bu))throw Object.assign(new Error('You cannot manage a bank account for another business unit.'),{status:403})}
  function bankPayload(body,existing={}){return {business_unit_id:body.business_unit_id===''||body.business_unit_id==null?null:Number(body.business_unit_id),name:text(body.name??existing.name),payment_type:text(body.payment_type??existing.payment_type??'Bank')||'Bank',currency:text(body.currency??existing.currency??'KRW').toUpperCase(),ledger_account_id:Number((body.ledger_account_id??existing.ledger_account_id) || 0),bank_name:text(body.bank_name??existing.bank_name),account_holder:text(body.account_holder??existing.account_holder),account_number:text(body.account_number??existing.account_number),iban:text(body.iban??existing.iban),swift_bic:text(body.swift_bic??existing.swift_bic),branch:text(body.branch??existing.branch),account_type:text(body.account_type??existing.account_type??'Current'),status:text(body.status??existing.status??'Active'),default_payment:body.default_payment===undefined?Number(existing.default_payment||0):(body.default_payment?1:0),default_receipt:body.default_receipt===undefined?Number(existing.default_receipt||0):(body.default_receipt?1:0),opening_balance_krw:Number(body.opening_balance_krw??existing.opening_balance_krw??0),migration_reference:text(body.migration_reference??existing.migration_reference),notes:text(body.notes??existing.notes)}}
  app.get('/api/system-settings-v319/bank-accounts',auth,(req,res)=>{const selected=Number(req.query.business_unit_id||req.selected_business_unit_id||0)||null;if(req.user.role!=='CEO / Owner'&&selected&&!enforceUnit(req,selected))return res.status(403).json({error:'You cannot access bank accounts for another business unit.'});let q=`SELECT p.*,b.name business_unit,a.code ledger_code,a.name ledger_name,a.account_type ledger_type FROM accounting_payment_accounts p LEFT JOIN business_units b ON b.id=p.business_unit_id LEFT JOIN accounting_accounts a ON a.id=p.ledger_account_id WHERE 1=1`,args=[];if(selected){q+=' AND (p.business_unit_id=? OR p.business_unit_id IS NULL)';args.push(selected)}else if(req.user.role!=='CEO / Owner'){const bu=Number(req.user.business_unit_id||0);if(!bu)return res.json([]);q+=' AND (p.business_unit_id=? OR p.business_unit_id IS NULL)';args.push(bu)}q+=' ORDER BY p.active DESC,p.bank_name,p.name';const adminView=isSystemAdmin(req,selected||Number(req.user.business_unit_id||0)||null);const rows=db.prepare(q).all(...args).map(r=>{const refs=adminView?bankRefs(r.id):null,ledgerBalance=adminView&&tableExists('accounting_journal_lines')?Number(db.prepare(`SELECT COALESCE(SUM(CASE WHEN l.business_unit_id=? OR ? IS NULL THEN l.debit_krw-l.credit_krw ELSE 0 END),0) v FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id WHERE l.account_id=? AND j.status='Posted'`).get(r.business_unit_id,r.business_unit_id,r.ledger_account_id).v||0):0;const masked=r.account_number?('*'.repeat(Math.max(0,r.account_number.length-4))+r.account_number.slice(-4)):r.account_last4?('****'+r.account_last4):'';if(!adminView)return {id:r.id,business_unit_id:r.business_unit_id,business_unit:r.business_unit,name:r.name,payment_type:r.payment_type,currency:r.currency,bank_name:r.bank_name,account_type:r.account_type,status:r.status,active:r.active,default_payment:r.default_payment,default_receipt:r.default_receipt,account_number_masked:masked,ledger_mapped:!!(r.ledger_account_id&&r.ledger_type==='Asset')};return {...r,account_number_masked:masked,references:refs,reference_count:bankRefTotal(refs),ledger_balance_krw:ledgerBalance+Number(r.opening_balance_krw||0)}});res.json(rows)});
  app.get('/api/system-settings-v319/bank-ledger-options',auth,(req,res)=>{if(!isSystemAdmin(req,Number(req.selected_business_unit_id||0)||null))return res.status(403).json({error:'System Settings access is required.'});res.json(db.prepare("SELECT id,code,name,account_type,active FROM accounting_accounts WHERE account_type='Asset' AND active=1 ORDER BY code").all())});
  app.post('/api/system-settings-v319/bank-accounts',auth,(req,res)=>{try{const x=bankPayload(req.body);validateBankScope(req,x.business_unit_id);if(!canBank(req,x.business_unit_id))return res.status(403).json({error:'Manage Company Bank Accounts permission is required.'});if(!x.name)return res.status(400).json({error:'Account name is required.'});const ledger=db.prepare("SELECT id FROM accounting_accounts WHERE id=? AND account_type='Asset' AND active=1").get(x.ledger_account_id);if(!ledger)return res.status(400).json({error:'Select an active Asset GL account.'});const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Creation reason is required.'});const r=db.prepare(`INSERT INTO accounting_payment_accounts(business_unit_id,name,payment_type,currency,ledger_account_id,bank_name,account_last4,is_default,notes,created_by,account_holder,account_number,iban,swift_bic,branch,account_type,status,default_payment,default_receipt,opening_balance_krw,migration_reference,updated_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(x.business_unit_id,x.name,x.payment_type,x.currency,x.ledger_account_id,x.bank_name,x.account_number.slice(-4),x.default_payment||x.default_receipt?1:0,x.notes,req.user.id,x.account_holder,x.account_number,x.iban,x.swift_bic,x.branch,x.account_type,'Active',x.default_payment,x.default_receipt,x.opening_balance_krw,x.migration_reference,req.user.id);const after=bankRow(r.lastInsertRowid);db.prepare('INSERT INTO system_bank_account_history(payment_account_id,before_json,after_json,reason,changed_by) VALUES(?,?,?,?,?)').run(r.lastInsertRowid,'{}',JSON.stringify(after),reason,req.user.id);audit(req.user,'company_bank_account',r.lastInsertRowid,'create',JSON.stringify({reason,name:x.name,business_unit_id:x.business_unit_id,ledger_account_id:x.ledger_account_id}));res.json({id:r.lastInsertRowid})}catch(e){fail(res,e)}});
  app.put('/api/system-settings-v319/bank-accounts/:id',auth,(req,res)=>{try{const before=bankRow(req.params.id);if(!before)return res.status(404).json({error:'Bank account not found.'});validateBankScope(req,before.business_unit_id);if(!canBank(req,before.business_unit_id))return res.status(403).json({error:'Manage Company Bank Accounts permission is required.'});const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Change reason is required.'});const x=bankPayload(req.body,before),ledger=db.prepare("SELECT id FROM accounting_accounts WHERE id=? AND account_type='Asset' AND active=1").get(x.ledger_account_id);if(!ledger)return res.status(400).json({error:'Select an active Asset GL account.'});const refs=bankRefs(before.id),used=bankRefTotal(refs)>0;if(used&&Number(x.ledger_account_id)!==Number(before.ledger_account_id)&&!(req.user.role==='CEO / Owner'&&req.body.confirm_existing_transactions===true))return res.status(409).json({error:'This bank account has transaction history. GL mapping can change only with CEO / Owner explicit high-risk confirmation.',references:refs});if(before.active===0&&x.status==='Active'&&req.user.role!=='CEO / Owner')return res.status(403).json({error:'Only CEO / Owner can reactivate a closed bank account.'});db.prepare(`UPDATE accounting_payment_accounts SET business_unit_id=?,name=?,payment_type=?,currency=?,ledger_account_id=?,bank_name=?,account_last4=?,notes=?,account_holder=?,account_number=?,iban=?,swift_bic=?,branch=?,account_type=?,status=?,active=?,default_payment=?,default_receipt=?,is_default=?,opening_balance_krw=?,migration_reference=?,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(x.business_unit_id,x.name,x.payment_type,x.currency,x.ledger_account_id,x.bank_name,x.account_number.slice(-4),x.notes,x.account_holder,x.account_number,x.iban,x.swift_bic,x.branch,x.account_type,x.status,x.status==='Active'?1:0,x.default_payment,x.default_receipt,x.default_payment||x.default_receipt?1:0,x.opening_balance_krw,x.migration_reference,req.user.id,before.id);const after=bankRow(before.id);db.prepare('INSERT INTO system_bank_account_history(payment_account_id,before_json,after_json,reason,changed_by) VALUES(?,?,?,?,?)').run(before.id,JSON.stringify(before),JSON.stringify(after),reason,req.user.id);audit(req.user,'company_bank_account',before.id,'update',JSON.stringify({reason,gl_mapping_changed:Number(before.ledger_account_id)!==Number(x.ledger_account_id),references:refs}));res.json({ok:true,references:refs})}catch(e){fail(res,e)}});
  app.delete('/api/system-settings-v319/bank-accounts/:id',auth,(req,res)=>{try{const before=bankRow(req.params.id);if(!before)return res.status(404).json({error:'Bank account not found.'});validateBankScope(req,before.business_unit_id);if(!canBank(req,before.business_unit_id))return res.status(403).json({error:'Manage Company Bank Accounts permission is required.'});const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Closure reason is required.'});db.prepare("UPDATE accounting_payment_accounts SET active=0,status='Closed',closed_at=CURRENT_TIMESTAMP,closed_by=?,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.user.id,req.user.id,before.id);const after=bankRow(before.id),refs=bankRefs(before.id);db.prepare('INSERT INTO system_bank_account_history(payment_account_id,before_json,after_json,reason,changed_by) VALUES(?,?,?,?,?)').run(before.id,JSON.stringify(before),JSON.stringify(after),reason,req.user.id);audit(req.user,'company_bank_account',before.id,'close',JSON.stringify({reason,references:refs}));res.json({ok:true,status:'Closed',preserved_history:true,references:refs})}catch(e){fail(res,e)}});
  app.get('/api/system-settings-v319/bank-accounts/:id/history',auth,(req,res)=>{const b=bankRow(req.params.id);if(!b)return res.status(404).json({error:'Bank account not found.'});if(!isSystemAdmin(req,b.business_unit_id||Number(req.selected_business_unit_id||0)||null))return res.status(403).json({error:'System Settings access is required.'});if(req.user.role!=='CEO / Owner'&&b.business_unit_id&&!enforceUnit(req,b.business_unit_id))return res.status(403).json({error:'You cannot access another business unit bank account.'});res.json(db.prepare('SELECT h.*,u.name changed_by_name FROM system_bank_account_history h LEFT JOIN users u ON u.id=h.changed_by WHERE h.payment_account_id=? ORDER BY h.id DESC LIMIT 300').all(b.id).map(x=>({...x,before:safeJson(x.before_json,{}),after:safeJson(x.after_json,{})}))) });

  const structuredUpload=multer({dest:uploads,limits:{fileSize:50*1024*1024}});
  app.post('/api/system-settings-v319/bank-accounts/:id/statement-upload',auth,structuredUpload.single('file'),(req,res)=>{try{const b=bankRow(req.params.id);if(!b)return res.status(404).json({error:'Bank account not found.'});if(!canBank(req,b.business_unit_id))return res.status(403).json({error:'Bank account permission is required.'});if(!req.file)return res.status(400).json({error:'Statement file is required.'});const parsed=rowsToObjects(parseTabularFile(req.file)),mapping=req.body.mapping?safeJson(req.body.mapping,{}):inferMapping(parsed.headers,['date','description','reference','amount']);if(!mapping.date||!mapping.amount)return res.status(400).json({error:'Statement must include Date and Amount columns.',headers:parsed.headers,inferred_mapping:mapping});let imported=0,skipped=0;const ins=db.prepare("INSERT INTO accounting_bank_statement_lines(payment_account_id,statement_date,description,reference,amount_krw,status,imported_by) VALUES(?,?,?,?,?,'Unreconciled',?)");db.transaction(()=>{for(const src of parsed.objects){const x=mapObject(src,mapping),date=text(x.date).slice(0,10),amount=Number(String(x.amount||'').replace(/,/g,''));if(!date||!Number.isFinite(amount)||Math.abs(amount)<0.000001){skipped++;continue}const dup=db.prepare('SELECT id FROM accounting_bank_statement_lines WHERE payment_account_id=? AND statement_date=? AND COALESCE(reference,\'\')=? AND ABS(amount_krw-?)<0.01 LIMIT 1').get(b.id,date,text(x.reference),amount);if(dup){skipped++;continue}ins.run(b.id,date,text(x.description),text(x.reference),amount,req.user.id);imported++}})();const h=hashFile(req.file.path);db.prepare('INSERT INTO system_bank_statement_imports(payment_account_id,original_name,file_path,file_hash,imported_rows,skipped_rows,imported_by) VALUES(?,?,?,?,?,?,?)').run(b.id,req.file.originalname,'/uploads/'+req.file.filename,h,imported,skipped,req.user.id);audit(req.user,'bank_statement_import',b.id,'import',JSON.stringify({imported,skipped,file:req.file.originalname}));res.json({ok:true,imported,skipped,mapping})}catch(e){fail(res,e)}});

  // -------------------------------------------------------------------------
  // Migration staging: Upload → Validate → Preview/Map → Review & Confirm → Import.
  // Supported live import targets in this local-test build are intentionally
  // controlled: Excavator Suppliers and Supplier Machines. Finance opening
  // balances are staged/validated for Accounting review, never auto-posted.
  // -------------------------------------------------------------------------
  const MIGRATION_TYPES={
    excavator_suppliers:{label:'Excavator Suppliers',fields:['name','location','contact_person','phone','email','address','notes'],required:['name']},
    excavator_supplier_machines:{label:'Excavator Supplier Machines',fields:['supplier_name','machine_name','machine_type','make','model','year','condition','serial_no','asking_price','location','notes'],required:['supplier_name','machine_name']},
    finance_opening_balances:{label:'Finance / Accounting Opening Balances',fields:['account_code','opening_balance','reference','notes'],required:['account_code','opening_balance'],staging_only:true}
  };
  function migrationNo(){return `MIG-${new Date().getFullYear()}-${String(Number(db.prepare('SELECT COUNT(*) c FROM system_migration_jobs').get().c||0)+1).padStart(5,'0')}`}
  function migrationJob(id){const j=db.prepare('SELECT j.*,b.name business_unit,u.name created_by_name FROM system_migration_jobs j LEFT JOIN business_units b ON b.id=j.business_unit_id LEFT JOIN users u ON u.id=j.created_by WHERE j.id=?').get(id);return j?{...j,mapping:safeJson(j.mapping_json,{})}:null}
  function canMigration(req,bu){return req.user.role==='CEO / Owner'||(isSystemAdmin(req,bu)&&!!access?.can?.(req.user.id,'sensitive.data_migration',bu||req.selected_business_unit_id||req.user.business_unit_id))}
  app.get('/api/system-settings-v319/migrations/types',auth,(req,res)=>{if(!isSystemAdmin(req,Number(req.selected_business_unit_id||0)||null))return res.status(403).json({error:'System Settings access is required.'});res.json(Object.entries(MIGRATION_TYPES).map(([key,v])=>({key,label:v.label,fields:v.fields,required:v.required,staging_only:!!v.staging_only}))) });
  app.get('/api/system-settings-v319/migrations',auth,(req,res)=>{if(!canMigration(req,Number(req.selected_business_unit_id||0)||null))return res.status(403).json({error:'Data Migration permission is required.'});let q='SELECT j.*,b.name business_unit,u.name created_by_name FROM system_migration_jobs j LEFT JOIN business_units b ON b.id=j.business_unit_id LEFT JOIN users u ON u.id=j.created_by WHERE 1=1',args=[];if(req.user.role!=='CEO / Owner'){const bu=Number(req.selected_business_unit_id||req.user.business_unit_id||0);q+=' AND j.business_unit_id=?';args.push(bu)}q+=' ORDER BY j.id DESC LIMIT 300';res.json(db.prepare(q).all(...args).map(x=>({...x,mapping:safeJson(x.mapping_json,{})}))) });
  app.get('/api/system-settings-v319/migrations/:id',auth,(req,res)=>{const j=migrationJob(req.params.id);if(!j)return res.status(404).json({error:'Migration job not found.'});if(!canMigration(req,j.business_unit_id))return res.status(403).json({error:'Data Migration permission is required.'});const rows=db.prepare('SELECT * FROM system_migration_rows WHERE migration_job_id=? ORDER BY row_no LIMIT 1000').all(j.id).map(r=>({...r,source:safeJson(r.source_json,{}),normalized:safeJson(r.normalized_json,{}),errors:JSON.parse(r.errors_json||'[]'),warnings:JSON.parse(r.warnings_json||'[]')}));res.json({job:j,rows})});
  app.get('/api/system-settings-v319/migrations/template/:type',auth,(req,res)=>{const d=MIGRATION_TYPES[text(req.params.type)];if(!d)return res.status(404).send('Unknown migration type');if(!isSystemAdmin(req,Number(req.selected_business_unit_id||0)||null))return res.status(403).send('System Settings access required');const labels={name:'Supplier Name / 공급업체명',location:'Location / 위치',contact_person:'Contact Person / 담당자',phone:'Phone / 전화번호',email:'Email / 이메일',address:'Address / 주소',notes:'Notes / 비고',supplier_name:'Supplier Name / 공급업체명',machine_name:'Machine Name / 장비명',machine_type:'Machine Type / 장비유형',make:'Make / 제조사',model:'Model / 모델',year:'Year / 연식',condition:'Condition / 상태',serial_no:'Serial / Chassis / 차대번호',asking_price:'Asking Price KRW / 요청가격 원',account_code:'Account Code / 계정코드',opening_balance:'Opening Balance KRW / 기초잔액',reference:'Reference / 참조'};const head=d.fields.map(f=>labels[f]||f),sample=req.params.type==='excavator_suppliers'?['Sample Supplier','Seoul','Kim','010-1234-5678','sample@example.com','Seoul, Korea','Sample row – delete before import']:req.params.type==='excavator_supplier_machines'?['Sample Supplier','Volvo EC220','Excavator','Volvo','EC220','2020','Used','SAMPLE-CHASSIS-001','85000000','Korea','Sample row – delete before import']:['1000','1000000','OPEN-2026','Sample staging row'];const escCsv=v=>'"'+String(v??'').replace(/"/g,'""')+'"';res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition',`attachment; filename="${req.params.type}_migration_template.csv"`);res.send('\uFEFF'+head.map(escCsv).join(',')+'\n'+sample.map(escCsv).join(',')+'\n')});
  app.post('/api/system-settings-v319/migrations/upload',auth,structuredUpload.single('file'),(req,res)=>{try{const type=text(req.body.migration_type),def=MIGRATION_TYPES[type],bu=Number(req.body.business_unit_id||req.selected_business_unit_id||currentUnit(req)||0)||null;if(!def)return res.status(400).json({error:'Select a supported migration type.'});if(!bu)return res.status(400).json({error:'Select a business unit for this migration.'});if(!canMigration(req,bu)||!enforceUnit(req,bu)&&req.user.role!=='CEO / Owner')return res.status(403).json({error:'Data Migration permission is required for this business unit.'});if(!req.file)return res.status(400).json({error:'Excel/CSV file is required.'});const parsed=rowsToObjects(parseTabularFile(req.file)),mapping=req.body.mapping?safeJson(req.body.mapping,{}):inferMapping(parsed.headers,def.fields),no=migrationNo(),r=db.prepare('INSERT INTO system_migration_jobs(migration_no,migration_type,original_name,file_path,file_hash,mapping_json,status,total_rows,business_unit_id,notes,created_by) VALUES(?,?,?,?,?,?,\'Uploaded\',?,?,?,?)').run(no,type,req.file.originalname,'/uploads/'+req.file.filename,hashFile(req.file.path),JSON.stringify(mapping),parsed.objects.length,bu,text(req.body.notes),req.user.id),jobId=Number(r.lastInsertRowid),ins=db.prepare('INSERT INTO system_migration_rows(migration_job_id,row_no,source_json,normalized_json,status) VALUES(?,?,?,?,\'Pending\')');db.transaction(()=>parsed.objects.forEach((o,i)=>ins.run(jobId,i+2,JSON.stringify(o),JSON.stringify(mapObject(o,mapping)))))();audit(req.user,'data_migration',jobId,'upload',JSON.stringify({migration_no:no,type,rows:parsed.objects.length,file:req.file.originalname}));res.json({id:jobId,migration_no:no,total_rows:parsed.objects.length,headers:parsed.headers,mapping})}catch(e){fail(res,e)}});
  app.put('/api/system-settings-v319/migrations/:id/mapping',auth,(req,res)=>{const j=migrationJob(req.params.id);if(!j)return res.status(404).json({error:'Migration job not found.'});if(!canMigration(req,j.business_unit_id))return res.status(403).json({error:'Data Migration permission is required.'});if(['Imported','Cancelled'].includes(j.status))return res.status(409).json({error:'Finalized migration mapping cannot be changed.'});const def=MIGRATION_TYPES[j.migration_type],mapping=req.body.mapping||{};for(const r of db.prepare('SELECT id,source_json FROM system_migration_rows WHERE migration_job_id=?').all(j.id))db.prepare("UPDATE system_migration_rows SET normalized_json=?,status='Pending',errors_json='[]',warnings_json='[]' WHERE id=?").run(JSON.stringify(mapObject(safeJson(r.source_json,{}),mapping)),r.id);db.prepare("UPDATE system_migration_jobs SET mapping_json=?,status='Mapped',valid_rows=0,error_rows=0,warning_rows=0,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(JSON.stringify(mapping),j.id);audit(req.user,'data_migration',j.id,'mapping-update',JSON.stringify({mapping,required:def.required}));res.json({ok:true})});
  app.post('/api/system-settings-v319/migrations/:id/validate',auth,(req,res)=>{const j=migrationJob(req.params.id);if(!j)return res.status(404).json({error:'Migration job not found.'});if(!canMigration(req,j.business_unit_id))return res.status(403).json({error:'Data Migration permission is required.'});const def=MIGRATION_TYPES[j.migration_type],rows=db.prepare('SELECT * FROM system_migration_rows WHERE migration_job_id=? ORDER BY row_no').all(j.id);let valid=0,errors=0,warnings=0;const upd=db.prepare('UPDATE system_migration_rows SET normalized_json=?,status=?,errors_json=?,warnings_json=? WHERE id=?');db.transaction(()=>{for(const r of rows){const x=safeJson(r.normalized_json,{}),es=[],ws=[];for(const k of def.required)if(text(x[k])==='')es.push(`${k} is required`);if(x.email&&!validEmail(x.email))es.push('Invalid email format');if(x.phone&&!validPhone(x.phone))es.push('Invalid phone format');if(j.migration_type==='excavator_suppliers'){const pn=normalizePhone(x.phone),em=text(x.email).toLowerCase(),dup=db.prepare('SELECT id,name FROM excavator_suppliers WHERE business_unit_id=? AND active=1 AND ((?<>\'\' AND replace(replace(replace(replace(replace(phone,\' \',\'\'),\'-\',\'\'),\'(\',\'\'),\')\',\'\'),\'+\',\'\')=?) OR (?<>\'\' AND lower(trim(email))=?)) LIMIT 1').get(j.business_unit_id,pn,pn,em,em);if(dup)es.push(`Duplicate supplier already exists: ${dup.name}`)}if(j.migration_type==='excavator_supplier_machines'){const supplier=db.prepare('SELECT id FROM excavator_suppliers WHERE business_unit_id=? AND active=1 AND lower(trim(name))=lower(trim(?))').get(j.business_unit_id,text(x.supplier_name));if(!supplier)es.push(`Supplier not found: ${text(x.supplier_name)}`);const ch=normalizeChassis(x.serial_no);if(ch){const company=db.prepare("SELECT id,asset_no,serial_no FROM excavator_assets WHERE business_unit_id=? AND COALESCE(status,'')!='Cancelled'").all(j.business_unit_id).find(a=>normalizeChassis(a.serial_no)===ch),listed=db.prepare(`SELECT sm.id,sm.serial_no FROM excavator_supplier_machines sm JOIN excavator_suppliers s ON s.id=sm.supplier_id WHERE s.business_unit_id=? AND s.active=1`).all(j.business_unit_id).find(a=>normalizeChassis(a.serial_no)===ch);if(company||listed)es.push('Serial / Chassis already exists in system')}}if(j.migration_type==='finance_opening_balances'){const amount=Number(String(x.opening_balance||'').replace(/,/g,''));if(!Number.isFinite(amount))es.push('Opening balance must be numeric');const acc=db.prepare('SELECT id FROM accounting_accounts WHERE code=? AND active=1').get(text(x.account_code));if(!acc)es.push(`GL account not found: ${text(x.account_code)}`);ws.push('Opening balances are staging-only and require Accounting reconciliation / Posting Control before activation.')}const status=es.length?'Error':ws.length?'Warning':'Valid';if(es.length)errors++;else valid++;if(ws.length)warnings++;upd.run(JSON.stringify(x),status,JSON.stringify(es),JSON.stringify(ws),r.id)}})();db.prepare("UPDATE system_migration_jobs SET status=?,valid_rows=?,error_rows=?,warning_rows=?,validated_by=?,validated_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(errors?'Validation Failed':def.staging_only?'Ready for Accounting Review':'Validated',valid,errors,warnings,req.user.id,j.id);audit(req.user,'data_migration',j.id,'validate',JSON.stringify({valid,errors,warnings}));res.json({ok:errors===0,valid_rows:valid,error_rows:errors,warning_rows:warnings,status:errors?'Validation Failed':def.staging_only?'Ready for Accounting Review':'Validated'})});
  app.post('/api/system-settings-v319/migrations/:id/import',auth,(req,res)=>{const j=migrationJob(req.params.id);if(!j)return res.status(404).json({error:'Migration job not found.'});if(!canMigration(req,j.business_unit_id))return res.status(403).json({error:'Data Migration permission is required.'});const def=MIGRATION_TYPES[j.migration_type];if(def.staging_only)return res.status(409).json({error:'Opening balances are staging-only. Reconcile them in Accounting and use Posting Control; this migration endpoint will not auto-post financial opening balances.'});if(j.status!=='Validated'||Number(j.error_rows||0)>0)return res.status(409).json({error:'Migration must pass validation before import.'});if(req.body.confirm_import!==true)return res.status(409).json({error:'Review & Confirm is required before final import.'});const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Import reason is required.'});const rows=db.prepare("SELECT * FROM system_migration_rows WHERE migration_job_id=? AND status IN ('Valid','Warning') ORDER BY row_no").all(j.id);let imported=0;const mark=db.prepare("UPDATE system_migration_rows SET status='Imported',imported_entity=?,imported_id=? WHERE id=?");db.transaction(()=>{for(const r of rows){const x=safeJson(r.normalized_json,{});if(j.migration_type==='excavator_suppliers'){const rr=db.prepare('INSERT INTO excavator_suppliers(business_unit_id,name,location,contact_person,phone,email,address,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?)').run(j.business_unit_id,text(x.name),text(x.location),text(x.contact_person),text(x.phone),text(x.email),text(x.address),text(x.notes),req.user.id);mark.run('excavator_supplier',rr.lastInsertRowid,r.id);imported++}else if(j.migration_type==='excavator_supplier_machines'){const supplier=db.prepare('SELECT id FROM excavator_suppliers WHERE business_unit_id=? AND active=1 AND lower(trim(name))=lower(trim(?))').get(j.business_unit_id,text(x.supplier_name));if(!supplier)throw new Error(`Supplier disappeared before import: ${text(x.supplier_name)}`);const rr=db.prepare("INSERT INTO excavator_supplier_machines(supplier_id,machine_name,machine_type,make,model,year,condition_status,serial_no,asking_price,location,status,notes,created_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,'Available',?,?,CURRENT_TIMESTAMP)").run(supplier.id,text(x.machine_name),text(x.machine_type)||'Excavator',text(x.make),text(x.model),x.year?Number(x.year):null,text(x.condition),text(x.serial_no),Number(String(x.asking_price||0).replace(/,/g,''))||0,text(x.location),text(x.notes),req.user.id);mark.run('excavator_supplier_machine',rr.lastInsertRowid,r.id);imported++}}db.prepare("UPDATE system_migration_jobs SET status='Imported',imported_rows=?,imported_by=?,imported_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(imported,req.user.id,j.id)})();audit(req.user,'data_migration',j.id,'import',JSON.stringify({migration_no:j.migration_no,imported,reason}));res.json({ok:true,imported_rows:imported,migration_no:j.migration_no})});
  app.post('/api/system-settings-v319/migrations/:id/cancel',auth,(req,res)=>{const j=migrationJob(req.params.id);if(!j)return res.status(404).json({error:'Migration job not found.'});if(!canMigration(req,j.business_unit_id))return res.status(403).json({error:'Data Migration permission is required.'});if(j.status==='Imported')return res.status(409).json({error:'Imported migration cannot be cancelled. Use normal correction/void workflows for imported records.'});const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Cancellation reason is required.'});db.prepare("UPDATE system_migration_jobs SET status='Cancelled',notes=trim(COALESCE(notes,'')||' | Cancelled: '||?),updated_at=CURRENT_TIMESTAMP WHERE id=?").run(reason,j.id);audit(req.user,'data_migration',j.id,'cancel',reason);res.json({ok:true})});

  // -------------------------------------------------------------------------
  // Backup / maintenance, AI diagnostics and immutable audit views.
  // -------------------------------------------------------------------------
  function canStorage(req){return specificAllowed(req,'sensitive.storage',Number(req.selected_business_unit_id||0)||null)}
  app.get('/api/system-settings-v319/backups',auth,(req,res)=>{if(!canStorage(req))return res.status(403).json({error:'Storage / Backup permission is required.'});res.json(db.prepare('SELECT l.*,u.name created_by_name FROM system_backup_log l LEFT JOIN users u ON u.id=l.created_by ORDER BY l.id DESC LIMIT 200').all())});
  app.post('/api/system-settings-v319/backups',auth,(req,res)=>{if(!canStorage(req))return res.status(403).json({error:'Storage / Backup permission is required.'});const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Backup reason is required.'});try{const dbPath=db.name;if(!dbPath||dbPath===':memory:'||!fs.existsSync(dbPath))return res.status(409).json({error:'This database is not file-backed; a filesystem backup cannot be created.'});try{db.pragma('wal_checkpoint(FULL)')}catch(_){ }const dir=path.join(path.dirname(dbPath),'backups');fs.mkdirSync(dir,{recursive:true});const stamp=new Date().toISOString().replace(/[:.]/g,'-'),name=`blue_ocean_v30_19_${stamp}.sqlite`,dest=path.join(dir,name);fs.copyFileSync(dbPath,dest);const size=fs.statSync(dest).size,r=db.prepare('INSERT INTO system_backup_log(backup_name,backup_path,size_bytes,status,reason,created_by) VALUES(?,?,?,\'Completed\',?,?)').run(name,dest,size,reason,req.user.id);audit(req.user,'system_backup',r.lastInsertRowid,'create',JSON.stringify({name,size,reason}));res.json({ok:true,id:r.lastInsertRowid,backup_name:name,size_bytes:size})}catch(e){fail(res,e)}});
  app.get('/api/system-settings-v319/attachment-diagnostics',auth,(req,res)=>{if(!canStorage(req))return res.status(403).json({error:'Storage permission is required.'});const known=new Set();const add=(table,col)=>{try{if(tableExists(table))for(const r of db.prepare(`SELECT ${col} p FROM ${table} WHERE COALESCE(${col},'')<>''`).all()){const v=String(r.p);known.add(path.basename(v))}}catch(_){}};add('excavator_documents','file_path');add('finance_attachments','file_path');add('finance_entries','receipt_file');add('documents','file_path');let files=[];try{files=fs.readdirSync(uploads).filter(n=>fs.statSync(path.join(uploads,n)).isFile())}catch(_){ }const orphan=files.filter(n=>!known.has(n));res.json({storage_usage_bytes:dirSize(uploads),file_count:files.length,known_reference_count:known.size,orphan_count:orphan.length,orphan_sample:orphan.slice(0,50)})});
  app.get('/api/system-settings-v319/ai/status',auth,(req,res)=>{if(!isSystemAdmin(req,Number(req.selected_business_unit_id||0)||null))return res.status(403).json({error:'System Settings access is required.'});const c=effectiveFor('ai_assistant',null,null);res.json({enabled:!!c.enabled,provider:c.provider,default_model:c.default_model,api_key_set:hasSecret('company',0,'ai_api_key'),authorization_chain:c.authorization_chain,write_actions_enabled:c.action_capability!=='Read Only',review_confirm_for_actions:true,diagnostic:c.enabled?(c.provider&&c.default_model&&hasSecret('company',0,'ai_api_key')?'Configuration ready for provider integration.':'Configuration incomplete.'):'AI Assistant is disabled.'})});
  app.post('/api/system-settings-v319/ai/diagnostic',auth,(req,res)=>{if(!specificAllowed(req,'sensitive.ai_settings',Number(req.selected_business_unit_id||0)||null))return res.status(403).json({error:'Manage AI Settings permission is required.'});const c=effectiveFor('ai_assistant',null,null),checks=[{key:'enabled',ok:!!c.enabled},{key:'provider',ok:!!text(c.provider)},{key:'model',ok:!!text(c.default_model)},{key:'credentials',ok:hasSecret('company',0,'ai_api_key')},{key:'access_control',ok:c.authorization_chain===SECTION_DEFS.ai_assistant.defaults.authorization_chain},{key:'review_confirm',ok:c.review_confirm_for_actions===true}];audit(req.user,'ai_settings',null,'diagnostic',JSON.stringify(checks));res.json({ok:checks.every(x=>x.ok),checks,note:'This diagnostic validates local configuration only. The AI Assistant is not allowed direct unrestricted database access.'})});
  app.get('/api/system-settings-v319/system-audit',auth,(req,res)=>{if(!(req.user.role==='CEO / Owner'||access?.can?.(req.user.id,'sensitive.audit_logs',req.selected_business_unit_id||req.user.business_unit_id)||isSystemAdmin(req,Number(req.selected_business_unit_id||0)||null)))return res.status(403).json({error:'System audit permission is required.'});res.json(db.prepare(`SELECT a.*,u.name user_name FROM audit_log a LEFT JOIN users u ON u.id=a.user_id WHERE a.entity IN ('system_settings','system_smtp','password_reset','company_bank_account','bank_statement_import','data_migration','system_backup','ai_settings') ORDER BY a.id DESC LIMIT 1000`).all())});

  // -------------------------------------------------------------------------
  // Document governance: authorized Delete is an audited archive. Original file
  // remains recoverable and previews/downloads are separate client actions.
  // -------------------------------------------------------------------------
  app.delete('/api/excavator/assets/:assetId/documents/:documentId',auth,(req,res)=>{
    const bu=Number(currentUnit(req)||req.selected_business_unit_id||0);if(!bu||!enforceUnit(req,bu))return res.status(403).json({error:'Select the Excavator business unit.'});const row=db.prepare(`SELECT d.*,a.business_unit_id,a.asset_no FROM excavator_documents d JOIN excavator_assets a ON a.id=d.asset_id WHERE d.id=? AND d.asset_id=? AND a.business_unit_id=?`).get(req.params.documentId,req.params.assetId,bu);if(!row)return res.status(404).json({error:'Document not found.'});const allowed=req.user.role==='CEO / Owner'||!!access?.canAction?.(req.user.id,'documents','delete',bu)||!!access?.canAction?.(req.user.id,'excavator','delete',bu);if(!allowed)return res.status(403).json({error:'Document delete permission is required.'});const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Delete / archive reason is required.'});if(Number(row.archived||0))return res.json({ok:true,already_archived:true});db.prepare("UPDATE excavator_documents SET archived=1,archived_by=?,archived_at=CURRENT_TIMESTAMP,archive_reason=? WHERE id=?").run(req.user.id,reason,row.id);audit(req.user,'excavator_document',row.id,'archive',JSON.stringify({asset_id:row.asset_id,asset_no:row.asset_no,reason,original_name:row.original_name,file_path:row.file_path}));res.json({ok:true,archived:true,preserved_original:true});
  });
  app.get('/api/excavator/assets/:assetId/documents-history-v319',auth,(req,res)=>{const bu=Number(currentUnit(req)||req.selected_business_unit_id||0);if(!bu||!enforceUnit(req,bu))return res.status(403).json({error:'Select the Excavator business unit.'});const a=db.prepare('SELECT id FROM excavator_assets WHERE id=? AND business_unit_id=?').get(req.params.assetId,bu);if(!a)return res.status(404).json({error:'Machine not found.'});res.json(db.prepare(`SELECT d.*,u.name uploaded_by_name,au.name archived_by_name FROM excavator_documents d LEFT JOIN users u ON u.id=d.uploaded_by LEFT JOIN users au ON au.id=d.archived_by WHERE d.asset_id=? ORDER BY d.created_at DESC,d.id DESC`).all(a.id))});

  return {VERSION,SECTION_DEFS,effectiveFor,getSetting,isSystemAdmin,canManageSection,hasSecret};
}

module.exports={install,VERSION};
