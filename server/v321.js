// Blue Ocean Market V30.21.1 — financial integrity, stored attachment viewing and international contact validation.
'use strict';
const VERSION='30.21.1';

function install({app,db,auth,currentUnit,enforceUnit,audit,logicalFinanceIds}){
  const text=v=>String(v??'').trim();
  const tableExists=name=>!!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
  const columns=name=>{try{return tableExists(name)?db.prepare(`PRAGMA table_info(${name})`).all().map(x=>x.name):[]}catch(_){return[]}};
  const normalizeReference=v=>text(v).toLowerCase().replace(/[^a-z0-9가-힣]/g,'');
  const normalizeEmail=v=>text(v).toLowerCase();
  const normalizePhone=v=>text(v).replace(/\D/g,'');
  const validEmail=v=>!text(v)||/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text(v));
  const validE164=v=>!text(v)||/^\+[1-9]\d{6,14}$/.test(text(v));
  const canSeeBu=(req,bu)=>!bu||req.user.role==='CEO / Owner'||enforceUnit(req,bu);

  // Contact validation endpoint used by every UI contact field. Duplicate checks are enabled
  // where a canonical contact master exists; format validation applies to every caller.
  const contactMaps={
    supplier:{table:'excavator_suppliers',label:'name',bu:'business_unit_id',active:'active'},
    buyer:{table:'excavator_buyers',label:'name',bu:'business_unit_id',active:'active'},
    customer:{table:'customers',label:'company',bu:'business_unit_id'},
    employee:{table:'employees',label:'name',bu:'business_unit_id'},
    user:{table:'users',label:'name',bu:'business_unit_id',active:'active'},
    pink_salt_supplier:{table:'pink_salt_suppliers',label:'name',bu:'business_unit_id',active:'active'},
    pink_salt_customer:{table:'pink_salt_customers',label:'name',bu:'business_unit_id',active:'active'}
  };
  app.get('/api/v321/contact-check',auth,(req,res)=>{
    const entity=text(req.query.entity).toLowerCase(),field=text(req.query.field).toLowerCase(),value=text(req.query.value),exclude=Number(req.query.exclude_id||0),bu=Number(req.query.business_unit_id||req.selected_business_unit_id||currentUnit(req)||0)||null;
    if(bu&&!canSeeBu(req,bu))return res.status(403).json({error:'You cannot validate contacts for another business unit.'});
    if(field==='email'&&!validEmail(value))return res.json({valid:false,field,message:'Enter a valid email address, for example name@example.com.'});
    if(field==='phone'&&!validE164(value))return res.json({valid:false,field,message:'Enter a valid international phone number using the country-code selector.'});
    const map=contactMaps[entity];if(!map||!tableExists(map.table))return res.json({valid:true,duplicate:false,format_only:true});
    const cols=columns(map.table);if(!cols.includes(field))return res.json({valid:true,duplicate:false,format_only:true});
    let q=`SELECT id,${cols.includes(map.label)?map.label:"''"} label,${field} value FROM ${map.table} WHERE 1=1`,args=[];
    if(map.bu&&cols.includes(map.bu)&&bu){q+=` AND ${map.bu}=?`;args.push(bu)}
    if(map.active&&cols.includes(map.active))q+=` AND COALESCE(${map.active},1)=1`;
    const target=field==='email'?normalizeEmail(value):normalizePhone(value);
    const dup=db.prepare(q).all(...args).find(r=>Number(r.id)!==exclude&&(field==='email'?normalizeEmail(r.value):normalizePhone(r.value))===target);
    if(dup)return res.json({valid:false,duplicate:true,field,message:`This ${field==='email'?'email address':'phone number'} is already used by ${dup.label||('record #'+dup.id)}.`,existing_id:dup.id,existing_name:dup.label||''});
    res.json({valid:true,duplicate:false});
  });

  // Account-scoped duplicate payment/reference validation. Same reference on a different
  // financial account is a warning only; same normalized reference on the same account blocks.
  app.get('/api/v321/payment-reference-check',auth,(req,res)=>{
    const accountId=Number(req.query.payment_account_id||0),reference=text(req.query.reference),excludeFinanceId=Number(req.query.exclude_finance_id||0),norm=normalizeReference(reference),bu=Number(req.query.business_unit_id||req.selected_business_unit_id||currentUnit(req)||0)||null;
    if(!reference||!norm)return res.json({valid:true,duplicate:false});
    if(!accountId)return res.json({valid:false,field:'reference',message:'Select the Company Financial Account before validating the payment reference.'});
    const account=db.prepare('SELECT id,name,business_unit_id FROM accounting_payment_accounts WHERE id=?').get(accountId);if(!account)return res.status(400).json({error:'Financial account not found.'});
    if(account.business_unit_id&&!canSeeBu(req,account.business_unit_id))return res.status(403).json({error:'You cannot use this financial account.'});
    const matchExpr='f.reference_normalized=?',excludeIds=excludeFinanceId?(typeof logicalFinanceIds==='function'?logicalFinanceIds(excludeFinanceId):[excludeFinanceId]):[],excludeSql=excludeIds.length?` AND f.id NOT IN (${excludeIds.map(()=>'?').join(',')})`:'';
    const same=tableExists('finance_entries')?db.prepare(`SELECT f.id,f.reference,f.transaction_date,f.created_at,f.category,f.amount,f.source_label,f.payment_account_id,p.name payment_account FROM finance_entries f LEFT JOIN accounting_payment_accounts p ON p.id=f.payment_account_id WHERE COALESCE(f.status,'')!='Voided' AND f.payment_account_id=? AND ${matchExpr}${excludeSql} ORDER BY f.id LIMIT 1`).get(accountId,norm,...excludeIds):null;
    if(same)return res.json({valid:false,duplicate:true,field:'reference',message:`Reference already used on ${same.payment_account||account.name}${same.transaction_date?' on '+same.transaction_date:''}${same.amount!=null?' · KRW '+Number(same.amount||0).toLocaleString():''}.`,existing:same});
    const elsewhere=tableExists('finance_entries')?db.prepare(`SELECT f.id,f.reference,f.transaction_date,f.amount,f.payment_account_id,p.name payment_account FROM finance_entries f LEFT JOIN accounting_payment_accounts p ON p.id=f.payment_account_id WHERE COALESCE(f.status,'')!='Voided' AND f.payment_account_id IS NOT NULL AND f.payment_account_id<>? AND ${matchExpr} ORDER BY f.id DESC LIMIT 1`).get(accountId,norm):null;
    return res.json({valid:true,duplicate:false,warning:elsewhere?`The same reference exists on another financial account (${elsewhere.payment_account||'another account'}). This is allowed, but please verify it.`:'',existing_elsewhere:elsewhere||null});
  });

  app.get('/api/v321/version',auth,(req,res)=>res.json({version:VERSION,features:['stored-attachment-viewer','international-phone','payment-reference-validation','payment-account-direction']}));
  return {VERSION};
}
module.exports={install,VERSION};
