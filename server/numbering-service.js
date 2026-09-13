'use strict';
const db=require('./db');

const DEFINITIONS=[
  {key:'generic.sale_invoice',label:'General Sales Invoice',display_group:'generic',module_key:'sales',default_prefix:'INV',table_name:'sales',column_name:'invoice_no',padding:5,include_year:1,reset_yearly:1,description:'General sales / POS invoice number outside the dedicated MIMI and Pink Salt order workflows.'},
  {key:'generic.purchase_order',label:'General Purchase',display_group:'generic',module_key:'purchases',default_prefix:'PO',table_name:'purchases',column_name:'purchase_no',padding:5,include_year:1,reset_yearly:1,description:'General purchase / inventory receipt reference.'},
  {key:'restaurant.order',label:'MIMI POS Order',display_group:'restaurant',module_key:'restaurant',default_prefix:'MIMI',table_name:'restaurant_orders',column_name:'order_no',padding:5,include_year:1,reset_yearly:1,description:'MIMI dine-in / takeaway / delivery order number.'},
  {key:'restaurant.sale_invoice',label:'MIMI Sales Invoice',display_group:'restaurant',module_key:'restaurant',default_prefix:'MIMI',table_name:'sales',column_name:'invoice_no',padding:5,include_year:1,reset_yearly:1,description:'Sales invoice created when a MIMI order is finalized. Existing historical numbers are never rewritten.'},
  {key:'accounting.journal',label:'Accounting Journal Entry',display_group:'shared',module_key:'accounting',default_prefix:'JE',table_name:'accounting_journal_entries',column_name:'journal_no',padding:6,include_year:1,reset_yearly:1,description:'Controlled accounting journal entry number.'},
  {key:'accounting.reversal',label:'Accounting Reversal',display_group:'shared',module_key:'accounting',default_prefix:'REV',table_name:'accounting_journal_entries',column_name:'journal_no',padding:6,include_year:1,reset_yearly:1,description:'Controlled accounting reversal proposal / posting number.'},
  {key:'accounting.inter_unit_transfer',label:'Inter-Business-Unit Transfer',display_group:'shared',module_key:'accounting',default_prefix:'IBU',table_name:'accounting_inter_unit_transfers',column_name:'transfer_no',padding:6,include_year:1,reset_yearly:1,description:'Inter-business-unit transfer reference.'},
  {key:'hr.employee',label:'Employee Number',display_group:'shared',module_key:'payroll',default_prefix:'EMP',table_name:'employees',column_name:'employee_no',padding:6,include_year:1,reset_yearly:1,description:'System-generated employee number when a manual employee number is not supplied.'},
  {key:'payroll.run',label:'Payroll Run',display_group:'shared',module_key:'payroll',default_prefix:'PAY',table_name:'payroll_runs',column_name:'payroll_no',padding:6,include_year:1,reset_yearly:1,description:'Payroll run reference.'},
  {key:'payroll.payslip',label:'Payslip',display_group:'shared',module_key:'payroll',default_prefix:'PS',table_name:'payroll_run_items',column_name:'payslip_no',padding:0,include_year:0,reset_yearly:0,format_template:'{PREFIX}-{RUN}-{EMP}',description:'Payslip reference. Run and employee IDs form the suffix rather than a sequential counter.'},
  {key:'migration.job',label:'Data Migration Job',display_group:'shared',module_key:'migration',default_prefix:'MIG',table_name:'system_migration_jobs',column_name:'migration_no',padding:5,include_year:1,reset_yearly:1,description:'Controlled bulk-import / migration job number.'},
  {key:'pink_salt.import',label:'Pink Salt Import',display_group:'pink_salt',module_key:'purchases',default_prefix:'PS-IMP',table_name:'pink_salt_imports',column_name:'import_no',padding:5,include_year:1,reset_yearly:1,description:'Pink Salt import / shipment number.'},
  {key:'pink_salt.production_batch',label:'Pink Salt Production / Repacking Batch',display_group:'pink_salt',module_key:'inventory',default_prefix:'PS-PROD',table_name:'pink_salt_production_batches',column_name:'batch_no',padding:5,include_year:1,reset_yearly:1,description:'Pink Salt production / repacking batch number.'},
  {key:'pink_salt.sales_order',label:'Pink Salt Sales Order',display_group:'pink_salt',module_key:'sales',default_prefix:'PS-SALE',table_name:'pink_salt_orders',column_name:'order_no',padding:5,include_year:1,reset_yearly:1,description:'Pink Salt customer/store sales order number.'},
  {key:'excavator.machine_deal',label:'Machine / Deal Number Prefix',display_group:'excavator',module_key:'excavator',default_prefix:'EX',table_name:'excavator_assets',column_name:'asset_no',padding:5,include_year:1,reset_yearly:1,auto_generate:0,description:'Configured Excavator machine/deal prefix. Current purchase workflow still accepts the explicit Machine / Deal No.; this definition keeps the prefix centrally governed for future automatic numbering.'}
];

function ensure(){
  db.exec(`
    CREATE TABLE IF NOT EXISTS numbering_reference_definitions(
      reference_key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      display_group TEXT NOT NULL DEFAULT 'shared',
      module_key TEXT NOT NULL DEFAULT '',
      default_prefix TEXT NOT NULL,
      table_name TEXT DEFAULT '',
      column_name TEXT DEFAULT '',
      padding INTEGER NOT NULL DEFAULT 5,
      include_year INTEGER NOT NULL DEFAULT 1,
      reset_yearly INTEGER NOT NULL DEFAULT 1,
      format_template TEXT DEFAULT '',
      auto_generate INTEGER NOT NULL DEFAULT 1,
      system_managed INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS numbering_reference_overrides(
      reference_key TEXT NOT NULL,
      business_unit_id INTEGER NOT NULL DEFAULT 0,
      prefix TEXT DEFAULT '',
      padding INTEGER,
      include_year INTEGER,
      reset_yearly INTEGER,
      enabled INTEGER NOT NULL DEFAULT 1,
      updated_by INTEGER,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(reference_key,business_unit_id),
      FOREIGN KEY(reference_key) REFERENCES numbering_reference_definitions(reference_key)
    );
    CREATE TABLE IF NOT EXISTS numbering_reference_history(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_key TEXT NOT NULL,
      business_unit_id INTEGER NOT NULL DEFAULT 0,
      before_json TEXT DEFAULT '{}',
      after_json TEXT DEFAULT '{}',
      reason TEXT NOT NULL,
      changed_by INTEGER,
      changed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS number_sequences(
      sequence_key TEXT NOT NULL,
      year INTEGER NOT NULL,
      last_value INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(sequence_key,year)
    );
  `);
  for(const d of DEFINITIONS)register(d);
}
function text(v){return String(v??'').trim()}
function normalizePrefix(v){return text(v).toUpperCase().replace(/\s+/g,'-').replace(/[^A-Z0-9-]/g,'').replace(/-+/g,'-').replace(/^-|-$/g,'')}
function register(def){
  const d={...def},key=text(d.key||d.reference_key);if(!key)throw new Error('Numbering definition key is required.');
  const prefix=normalizePrefix(d.default_prefix||d.prefix||'REF');
  db.prepare(`INSERT INTO numbering_reference_definitions(reference_key,label,display_group,module_key,default_prefix,table_name,column_name,padding,include_year,reset_yearly,format_template,auto_generate,system_managed,active,description)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(reference_key) DO UPDATE SET label=excluded.label,display_group=excluded.display_group,module_key=excluded.module_key,default_prefix=excluded.default_prefix,table_name=excluded.table_name,column_name=excluded.column_name,padding=excluded.padding,include_year=excluded.include_year,reset_yearly=excluded.reset_yearly,format_template=excluded.format_template,auto_generate=excluded.auto_generate,system_managed=excluded.system_managed,active=excluded.active,description=excluded.description,updated_at=CURRENT_TIMESTAMP`).run(
      key,text(d.label)||key,text(d.display_group)||'shared',text(d.module_key),prefix,text(d.table_name),text(d.column_name),Math.max(0,Number(d.padding??5)),d.include_year===0?0:1,d.reset_yearly===0?0:1,text(d.format_template),d.auto_generate===0?0:1,d.system_managed===0?0:1,d.active===0?0:1,text(d.description)
    );
  return definition(key);
}
function definition(key){return db.prepare('SELECT * FROM numbering_reference_definitions WHERE reference_key=?').get(text(key))||null}
function override(key,bu=0){return db.prepare('SELECT * FROM numbering_reference_overrides WHERE reference_key=? AND business_unit_id=?').get(text(key),Number(bu||0))||null}
function effective(key,businessUnitId=0){
  const d=definition(key);if(!d)return null;const company=override(key,0),bu=Number(businessUnitId||0),local=bu?override(key,bu):null;
  const choose=(field,base)=>local&&local[field]!==null&&local[field]!==undefined&&local[field]!==''?local[field]:company&&company[field]!==null&&company[field]!==undefined&&company[field]!==''?company[field]:base;
  return {...d,business_unit_id:bu,prefix:normalizePrefix(choose('prefix',d.default_prefix))||d.default_prefix,padding:Number(choose('padding',d.padding)),include_year:Number(choose('include_year',d.include_year))?1:0,reset_yearly:Number(choose('reset_yearly',d.reset_yearly))?1:0,enabled:Number(choose('enabled',1))?1:0,company_override:company||null,business_unit_override:local||null};
}
function safeCount(table){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(text(table)))return 0;try{return Number(db.prepare(`SELECT COUNT(*) c FROM ${table}`).get()?.c||0)}catch(_){return 0}}
function next(key,{businessUnitId=0,definition:def=null,tableName='',prefix='',padding=null,includeYear=null,resetYearly=null}={}){
  let d=definition(key);if(!d)d=register({...def,key,default_prefix:def?.default_prefix||prefix||'REF',table_name:def?.table_name||tableName,padding:def?.padding??padding??5,include_year:def?.include_year??includeYear??1,reset_yearly:def?.reset_yearly??resetYearly??1});
  const e=effective(key,businessUnitId);if(!e||!e.enabled)throw new Error(`${d?.label||key} numbering is disabled in System Settings → Numbering & References.`);
  if(Number(e.auto_generate||0)!==1)throw new Error(`${e.label} is configured as a manual reference type.`);
  const year=new Date().getFullYear(),bucket=e.reset_yearly?year:0,seqKey=`ref:${key}:${e.prefix}`;
  let baseline=safeCount(e.table_name||tableName);
  try{const legacy=db.prepare('SELECT MAX(last_value) v FROM number_sequences WHERE sequence_key IN (?,?)').get(`${e.table_name}:${e.prefix}`,`${e.table_name}:${d.default_prefix}`);baseline=Math.max(baseline,Number(legacy?.v||0))}catch(_){ }
  const row=db.prepare(`INSERT INTO number_sequences(sequence_key,year,last_value,updated_at) VALUES(?,?,?+1,CURRENT_TIMESTAMP)
    ON CONFLICT(sequence_key,year) DO UPDATE SET last_value=MAX(number_sequences.last_value,?)+1,updated_at=CURRENT_TIMESTAMP RETURNING last_value`).get(seqKey,bucket,baseline,baseline);
  const n=Number(row?.last_value||baseline+1),parts=[e.prefix];if(e.include_year)parts.push(String(year));parts.push(String(n).padStart(Math.max(1,Number(e.padding||5)),'0'));return parts.join('-');
}
function prefix(key,businessUnitId=0){const e=effective(key,businessUnitId);return e?.prefix||''}
function formatPreview(e){if(!e)return'';if(e.format_template)return String(e.format_template).replaceAll('{PREFIX}',e.prefix||e.default_prefix||'REF').replaceAll('{RUN}','000123').replaceAll('{EMP}','000456');const p=[e.prefix||e.default_prefix||'REF'];if(Number(e.include_year))p.push(String(new Date().getFullYear()));p.push(String(1).padStart(Math.max(1,Number(e.padding||5)),'0'));return p.join('-')}
function setOverride(key,businessUnitId,data,{userId=null,reason=''}={}){
  const d=definition(key);if(!d)throw new Error('Numbering reference type not found.');const bu=Number(businessUnitId||0),before=effective(key,bu),p=normalizePrefix(data.prefix||before.prefix);if(!p||p.length>24)throw new Error('Prefix must contain 1–24 letters, numbers or hyphens.');
  const padding=Math.max(0,Math.min(10,Number((data.padding ?? before.padding ?? 5)))),includeYear=data.include_year===false||data.include_year===0||data.include_year==='0'?0:1,resetYearly=data.reset_yearly===false||data.reset_yearly===0||data.reset_yearly==='0'?0:1,enabled=data.enabled===false||data.enabled===0||data.enabled==='0'?0:1;
  db.prepare(`INSERT INTO numbering_reference_overrides(reference_key,business_unit_id,prefix,padding,include_year,reset_yearly,enabled,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(reference_key,business_unit_id) DO UPDATE SET prefix=excluded.prefix,padding=excluded.padding,include_year=excluded.include_year,reset_yearly=excluded.reset_yearly,enabled=excluded.enabled,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP`).run(key,bu,p,padding,includeYear,resetYearly,enabled,userId);
  const after=effective(key,bu);db.prepare('INSERT INTO numbering_reference_history(reference_key,business_unit_id,before_json,after_json,reason,changed_by) VALUES(?,?,?,?,?,?)').run(key,bu,JSON.stringify(before||{}),JSON.stringify(after||{}),text(reason)||'Numbering configuration changed',userId);
  return after;
}
function listDefinitions(){return db.prepare('SELECT * FROM numbering_reference_definitions WHERE active=1 ORDER BY display_group,label').all()}
function currentSequence(e){if(!e)return 0;const bucket=e.reset_yearly?new Date().getFullYear():0,seqKey=`ref:${e.reference_key}:${e.prefix}`;let n=safeCount(e.table_name);try{n=Math.max(n,Number(db.prepare('SELECT last_value FROM number_sequences WHERE sequence_key=? AND year=?').get(seqKey,bucket)?.last_value||0),Number(db.prepare('SELECT MAX(last_value) v FROM number_sequences WHERE sequence_key IN (?,?)').get(`${e.table_name}:${e.prefix}`,`${e.table_name}:${e.default_prefix}`)?.v||0))}catch(_){ }return n}

ensure();
module.exports={DEFINITIONS,ensure,register,definition,effective,next,prefix,formatPreview,setOverride,listDefinitions,currentSequence,normalizePrefix};
