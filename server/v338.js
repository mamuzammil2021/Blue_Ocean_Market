'use strict';
// Blue Ocean Market V30.38.0 — account edit/history controls and release marker.
const VERSION='30.38.0';
function install(ctx){
  const {app,db,auth,allow,audit,enforceUnit,currentUnit}=ctx;
  const text=v=>String(v??'').trim();
  const methodType=v=>{const s=text(v).toLowerCase();if(s.includes('card'))return'Card';if(s.includes('wallet'))return'Wallet';if(s.includes('cash'))return'Cash';if(s.includes('other'))return'Other';return'Bank'};
  db.exec(`CREATE TABLE IF NOT EXISTS counterparty_payment_account_history(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    business_unit_id INTEGER NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    before_json TEXT DEFAULT '',
    after_json TEXT DEFAULT '',
    reason TEXT DEFAULT '',
    changed_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );CREATE INDEX IF NOT EXISTS idx_counterparty_account_history_v338 ON counterparty_payment_account_history(business_unit_id,entity_type,entity_id,account_id,id DESC);`);
  function entityRow(type,id,bu){
    if(type==='excavator_supplier')return db.prepare('SELECT id,name FROM excavator_suppliers WHERE id=? AND business_unit_id=? AND active=1').get(id,bu);
    if(type==='excavator_buyer')return db.prepare('SELECT id,name FROM excavator_buyers WHERE id=? AND business_unit_id=? AND active=1').get(id,bu);
    if(type==='employee'){try{return db.prepare('SELECT id,name FROM employees WHERE id=? AND business_unit_id=?').get(id,bu)}catch(_){return null}}
    return type==='other'?{id,name:'Other Payee'}:null;
  }
  const mask=r=>{const raw=text(r?.account_number||r?.card_last4||r?.wallet_identifier);return raw?'****'+raw.slice(-4):''};
  const publicRow=r=>({...r,account_number_masked:mask(r),account_number:undefined,wallet_identifier:r?.wallet_identifier?'Saved':'',card_last4:r?.card_last4?String(r.card_last4).slice(-4):''});
  const snap=r=>r?{id:Number(r.id),label:text(r.label),method_type:text(r.method_type),bank_name:text(r.bank_name),account_holder:text(r.account_holder),account_number_masked:mask(r),account_country:text(r.account_country),currency:text(r.currency),card_network:text(r.card_network),card_last4:text(r.card_last4).slice(-4),wallet_identifier:r.wallet_identifier?'Saved':'',active:Number(r.active||0),is_default:Number(r.is_default||0)}:null;
  function addHistory(account,before,after,action,userId,reason=''){db.prepare(`INSERT INTO counterparty_payment_account_history(account_id,business_unit_id,entity_type,entity_id,action,before_json,after_json,reason,changed_by) VALUES(?,?,?,?,?,?,?,?,?)`).run(account.id,account.business_unit_id,account.entity_type,account.entity_id,action,JSON.stringify(snap(before)),JSON.stringify(snap(after)),text(reason),userId||null)}
  function usageCount(id){let count=0;for(const [table,col] of [['finance_entries','receiver_account_id'],['excavator_payments','receiver_account_id'],['excavator_buyer_refunds','receiver_account_id'],['excavator_resale_credit_refunds','receiver_account_id']]){try{count+=Number(db.prepare(`SELECT COUNT(*) n FROM ${table} WHERE ${col}=?`).get(id)?.n||0)}catch(_){}}return count}
  function validated(req,existing=null){
    const bu=Number(req.body.business_unit_id||existing?.business_unit_id||currentUnit(req)||0),entityType=text(req.body.entity_type||existing?.entity_type),entityId=Number(req.body.entity_id||existing?.entity_id||0),entity=entityRow(entityType,entityId,bu);
    if(!bu||!enforceUnit(req,bu))throw Object.assign(new Error('Current business unit access is required.'),{status:403});
    if(!entity)throw new Error('Payee was not found in the current business unit.');
    const method=methodType(req.body.method_type||existing?.method_type||'Bank'),label=text(req.body.label||existing?.label);
    if(!label)throw new Error('Receiver account label is required.');
    const numberProvided=text(req.body.account_number),accountNumber=numberProvided||text(existing?.account_number);
    const bank=text(req.body.bank_name!==undefined?req.body.bank_name:existing?.bank_name);
    if(method==='Bank'&&!accountNumber)throw new Error('Receiver bank account number is required.');
    if(method==='Bank'&&!bank)throw new Error('Receiver bank name is required.');
    return {bu,entityType,entityId,entity,method,label,bank,accountNumber,isDefault:req.body.is_default===true||String(req.body.is_default)==='1'};
  }
  app.get('/api/v338/payee-accounts',auth,(req,res)=>{
    const bu=Number(req.query.business_unit_id||currentUnit(req)||0),type=text(req.query.entity_type),id=Number(req.query.entity_id||0),includeArchived=String(req.query.include_archived||'')==='1';
    if(!bu||!enforceUnit(req,bu))return res.status(403).json({error:'Current business unit access is required.'});if(!type||!id)return res.status(400).json({error:'Payee type and payee are required.'});
    const rows=db.prepare(`SELECT * FROM counterparty_payment_accounts WHERE business_unit_id=? AND entity_type=? AND entity_id=? ${includeArchived?'':'AND active=1'} ORDER BY active DESC,is_default DESC,label,id`).all(bu,type,id).map(r=>({...publicRow(r),usage_count:usageCount(r.id)}));res.json(rows);
  });
  app.get('/api/v338/payee-account-history',auth,(req,res)=>{
    const bu=Number(req.query.business_unit_id||currentUnit(req)||0),type=text(req.query.entity_type),id=Number(req.query.entity_id||0);
    if(!bu||!enforceUnit(req,bu))return res.status(403).json({error:'Current business unit access is required.'});if(!type||!id)return res.status(400).json({error:'Payee type and payee are required.'});
    const rows=db.prepare(`SELECT h.*,u.name changed_by_name FROM counterparty_payment_account_history h LEFT JOIN users u ON u.id=h.changed_by WHERE h.business_unit_id=? AND h.entity_type=? AND h.entity_id=? ORDER BY h.id DESC LIMIT 100`).all(bu,type,id);res.json(rows);
  });
  app.post('/api/v338/payee-accounts',auth,allow('finance','purchases','sales'),(req,res)=>{try{
    const v=validated(req),out=db.transaction(()=>{if(v.isDefault)db.prepare('UPDATE counterparty_payment_accounts SET is_default=0,updated_at=CURRENT_TIMESTAMP WHERE business_unit_id=? AND entity_type=? AND entity_id=? AND method_type=?').run(v.bu,v.entityType,v.entityId,v.method);const r=db.prepare(`INSERT INTO counterparty_payment_accounts(business_unit_id,entity_type,entity_id,label,method_type,bank_name,account_holder,account_number,account_country,currency,card_network,card_last4,wallet_identifier,active,is_default,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`).run(v.bu,v.entityType,v.entityId,v.label,v.method,v.bank,text(req.body.account_holder||v.entity.name),v.accountNumber,text(req.body.account_country),text(req.body.currency||'KRW').toUpperCase(),text(req.body.card_network),text(req.body.card_last4).replace(/\D/g,'').slice(-4),text(req.body.wallet_identifier),v.isDefault?1:0,req.user.id);const row=db.prepare('SELECT * FROM counterparty_payment_accounts WHERE id=?').get(r.lastInsertRowid);addHistory(row,null,row,'Created',req.user.id,text(req.body.reason));return row})();audit(req.user,'counterparty_payment_account',out.id,'create-v338',JSON.stringify({entity_type:out.entity_type,entity_id:out.entity_id,method_type:out.method_type,is_default:out.is_default}));res.json({id:Number(out.id),account:publicRow(out)});
  }catch(e){res.status(e.status||400).json({error:e.message})}});
  app.put('/api/v338/payee-accounts/:id',auth,allow('finance','purchases','sales'),(req,res)=>{try{
    const old=db.prepare('SELECT * FROM counterparty_payment_accounts WHERE id=?').get(Number(req.params.id));if(!old)return res.status(404).json({error:'Receiver account not found.'});if(!enforceUnit(req,old.business_unit_id))throw Object.assign(new Error('Another business unit account cannot be changed.'),{status:403});if(!Number(old.active||0))throw new Error('Archived receiver accounts cannot be edited.');
    const v=validated(req,old),out=db.transaction(()=>{if(v.isDefault)db.prepare('UPDATE counterparty_payment_accounts SET is_default=0,updated_at=CURRENT_TIMESTAMP WHERE business_unit_id=? AND entity_type=? AND entity_id=? AND method_type=? AND id<>?').run(v.bu,v.entityType,v.entityId,v.method,old.id);db.prepare(`UPDATE counterparty_payment_accounts SET label=?,method_type=?,bank_name=?,account_holder=?,account_number=?,account_country=?,currency=?,card_network=?,card_last4=?,wallet_identifier=?,is_default=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(v.label,v.method,v.bank,text(req.body.account_holder!==undefined?req.body.account_holder:old.account_holder),v.accountNumber,text(req.body.account_country!==undefined?req.body.account_country:old.account_country),text(req.body.currency!==undefined?req.body.currency:old.currency).toUpperCase(),text(req.body.card_network!==undefined?req.body.card_network:old.card_network),text(req.body.card_last4!==undefined?req.body.card_last4:old.card_last4).replace(/\D/g,'').slice(-4),text(req.body.wallet_identifier!==undefined?req.body.wallet_identifier:old.wallet_identifier),v.isDefault?1:0,old.id);const row=db.prepare('SELECT * FROM counterparty_payment_accounts WHERE id=?').get(old.id);addHistory(row,old,row,'Updated',req.user.id,text(req.body.reason));return row})();audit(req.user,'counterparty_payment_account',out.id,'update-v338',JSON.stringify({usage_count:usageCount(out.id),is_default:out.is_default}));res.json({ok:true,account:publicRow(out),usage_count:usageCount(out.id)});
  }catch(e){res.status(e.status||400).json({error:e.message})}});
  app.put('/api/v338/payee-accounts/:id/archive',auth,allow('finance','purchases','sales'),(req,res)=>{try{const old=db.prepare('SELECT * FROM counterparty_payment_accounts WHERE id=?').get(Number(req.params.id));if(!old)return res.status(404).json({error:'Receiver account not found.'});if(!enforceUnit(req,old.business_unit_id))throw Object.assign(new Error('Another business unit account cannot be changed.'),{status:403});const reason=text(req.body.reason);const row=db.transaction(()=>{db.prepare('UPDATE counterparty_payment_accounts SET active=0,is_default=0,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(old.id);const n=db.prepare('SELECT * FROM counterparty_payment_accounts WHERE id=?').get(old.id);addHistory(n,old,n,'Archived',req.user.id,reason);return n})();audit(req.user,'counterparty_payment_account',row.id,'archive-v338',JSON.stringify({reason,usage_count:usageCount(row.id)}));res.json({ok:true,usage_count:usageCount(row.id)})}catch(e){res.status(e.status||400).json({error:e.message})}});
  app.get('/api/v338/excavator/buyers/:id/resale-refunds',auth,allow('dashboard','sales','finance','purchases'),(req,res)=>{
    const bu=Number(currentUnit(req)||0),buyerId=Number(req.params.id||0);if(!bu||!enforceUnit(req,bu))return res.status(403).json({error:'Current business unit access is required.'});const buyer=db.prepare('SELECT id,name FROM excavator_buyers WHERE id=? AND business_unit_id=? AND active=1').get(buyerId,bu);if(!buyer)return res.status(404).json({error:'Buyer not found.'});
    const direct=db.prepare(`SELECT r.id,'Payment Credit Refund' refund_type,r.payment_id,r.amount_pkr,r.fx_rate_to_krw,r.krw_amount,r.refund_date,r.reference,r.reason,r.status,r.receipt_file,a.name payment_account_name FROM excavator_resale_profit_refunds r LEFT JOIN accounting_payment_accounts a ON a.id=r.payment_account_id WHERE r.buyer_id=? ORDER BY date(r.refund_date) DESC,r.id DESC`).all(buyerId);
    const pooled=db.prepare(`SELECT r.id,'Buyer Credit Refund' refund_type,NULL payment_id,r.amount_pkr,r.fx_rate_to_krw,r.krw_amount,r.refund_date,r.reference,r.reason,r.status,r.receipt_file,a.name payment_account_name FROM excavator_resale_credit_refunds r LEFT JOIN accounting_payment_accounts a ON a.id=r.payment_account_id WHERE r.buyer_id=? AND r.business_unit_id=? ORDER BY date(r.refund_date) DESC,r.id DESC`).all(buyerId,bu);
    res.json([...direct,...pooled].sort((a,b)=>String(b.refund_date||'').localeCompare(String(a.refund_date||''))||Number(b.id)-Number(a.id)).map(r=>({...r,receipt_url:r.receipt_file?'/uploads/'+r.receipt_file:''})));
  });
  return {version:VERSION,additive:true,schema_changes:['counterparty_payment_account_history'],account_editing:true,historical_snapshot_protection:true};
}
module.exports={install,VERSION};
