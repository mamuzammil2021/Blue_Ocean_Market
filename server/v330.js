// Blue Ocean Market V30.30.0 — receiver accounts, jurisdiction defaults and Pakistan resale credit controls.
'use strict';
const VERSION='30.30.0';

function install({app,db,auth,allow,audit,upload,financeSync,currentUnit,enforceUnit,excavatorGuard}){
  const text=v=>String(v??'').trim(), num=v=>Number(v||0), round2=v=>Math.round((num(v)+Number.EPSILON)*100)/100;
  const tableExists=n=>!!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(n);
  db.exec(`
    CREATE TABLE IF NOT EXISTS counterparty_payment_accounts(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_unit_id INTEGER NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      method_type TEXT NOT NULL DEFAULT 'Bank',
      bank_name TEXT DEFAULT '',
      account_holder TEXT DEFAULT '',
      account_number TEXT DEFAULT '',
      account_country TEXT DEFAULT '',
      currency TEXT DEFAULT '',
      card_network TEXT DEFAULT '',
      card_last4 TEXT DEFAULT '',
      wallet_identifier TEXT DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_counterparty_payment_accounts_entity_v330 ON counterparty_payment_accounts(business_unit_id,entity_type,entity_id,active);
    CREATE TABLE IF NOT EXISTS excavator_resale_credit_refunds(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_id INTEGER NOT NULL,
      business_unit_id INTEGER NOT NULL,
      amount_pkr REAL NOT NULL,
      fx_rate_to_krw REAL NOT NULL,
      krw_amount REAL NOT NULL,
      refund_date TEXT NOT NULL,
      method TEXT NOT NULL DEFAULT 'Bank',
      reference TEXT NOT NULL,
      payment_account_id INTEGER NOT NULL,
      receiver_account_id INTEGER,
      receipt_file TEXT DEFAULT '',
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Completed',
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS excavator_resale_credit_refund_sources(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      refund_id INTEGER NOT NULL,
      payment_id INTEGER NOT NULL,
      amount_pkr REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(refund_id) REFERENCES excavator_resale_credit_refunds(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_resale_credit_refund_sources_v330 ON excavator_resale_credit_refund_sources(payment_id,refund_id);
  `);

  function buyerGuard(req,res){
    const bu=excavatorGuard(req,res);if(!bu)return null;
    const buyer=db.prepare('SELECT * FROM excavator_buyers WHERE id=? AND business_unit_id=? AND active=1').get(Number(req.params.id),bu);
    if(!buyer){res.status(404).json({error:'Buyer not found in the current Excavator business unit.'});return null}
    return {buyer,bu};
  }
  function entityRow(type,id,bu){
    if(type==='excavator_supplier')return db.prepare('SELECT id,name FROM excavator_suppliers WHERE id=? AND business_unit_id=? AND active=1').get(id,bu);
    if(type==='excavator_buyer')return db.prepare('SELECT id,name FROM excavator_buyers WHERE id=? AND business_unit_id=? AND active=1').get(id,bu);
    if(type==='employee'){try{return db.prepare('SELECT id,name FROM employees WHERE id=? AND business_unit_id=?').get(id,bu)}catch(_){return null}}
    return type==='other'?{id,name:'Other Payee'}:null;
  }
  function methodType(v){const s=text(v).toLowerCase();if(s.includes('card'))return 'Card';if(s.includes('wallet'))return 'Wallet';if(s.includes('cash'))return 'Cash';if(s.includes('other'))return 'Other';return 'Bank'}
  function maskAccount(r){const raw=text(r.account_number||r.card_last4||r.wallet_identifier);return raw?'****'+raw.slice(-4):''}
  function publicPayee(r){return {...r,account_number_masked:maskAccount(r),account_number:undefined}}
  function payeeAccount(id,{bu,entityType='',entityId=0,method='',required=false,currency=''}={}){
    if(!Number(id||0)){if(required){const e=new Error('Select the receiver / payee account before continuing.');e.status=400;throw e}return null}
    const r=db.prepare('SELECT * FROM counterparty_payment_accounts WHERE id=? AND active=1').get(Number(id));
    if(!r){const e=new Error('Receiver / payee account is not active or no longer available.');e.status=400;throw e}
    if(bu&&Number(r.business_unit_id)!==Number(bu)){const e=new Error('Receiver account belongs to another business unit.');e.status=403;throw e}
    if(entityType&&text(r.entity_type)!==text(entityType)){const e=new Error('Receiver account belongs to another payee type.');e.status=400;throw e}
    if(entityId&&Number(r.entity_id)!==Number(entityId)){const e=new Error('Receiver account belongs to another payee.');e.status=400;throw e}
    const wanted=methodType(method);if(method&&wanted!=='Other'&&methodType(r.method_type)!==wanted&&!(wanted==='Bank'&&methodType(r.method_type)==='Bank')){const e=new Error(`Selected receiver account is not compatible with ${method}.`);e.status=400;throw e}const wantedCurrency=text(currency).toUpperCase();if(wantedCurrency&&text(r.currency||'KRW').toUpperCase()!==wantedCurrency){const e=new Error(`Paid To account currency must match Refund Currency (${wantedCurrency}).`);e.status=400;throw e}
    return r;
  }
  function pakistanCompanyAccount(id,bu){
    const r=db.prepare(`SELECT * FROM accounting_payment_accounts WHERE id=? AND active=1 AND COALESCE(status,'Active')='Active'`).get(Number(id));
    if(!r||Number(r.business_unit_id||bu)!==Number(bu)||text(r.account_country).toLowerCase()!=='pakistan'||text(r.currency).toUpperCase()!=='PKR'||text(r.financial_account_type||r.payment_type)!=='Bank')throw Object.assign(new Error('Pakistan resale transactions can use only an active PKR Company Bank Account with Bank Country = Pakistan.'),{status:400});
    return r;
  }

  // Saved receiver / payee accounts.
  app.get('/api/v330/payee-accounts',auth,(req,res)=>{
    const bu=Number(req.query.business_unit_id||currentUnit(req)||0),entityType=text(req.query.entity_type),entityId=Number(req.query.entity_id||0),method=text(req.query.method);
    if(!bu||!enforceUnit(req,bu))return res.status(403).json({error:'Current business unit access is required.'});if(!entityType||!entityId)return res.status(400).json({error:'Payee type and payee are required.'});
    let rows=db.prepare('SELECT * FROM counterparty_payment_accounts WHERE business_unit_id=? AND entity_type=? AND entity_id=? AND active=1 ORDER BY is_default DESC,label,id').all(bu,entityType,entityId);
    if(method){const wanted=methodType(method);rows=rows.filter(r=>wanted==='Other'||methodType(r.method_type)===wanted)}
    res.json(rows.map(publicPayee));
  });
  app.post('/api/v330/payee-accounts',auth,allow('finance','purchases','sales'),(req,res)=>{
    try{const bu=Number(req.body.business_unit_id||currentUnit(req)||0),entityType=text(req.body.entity_type),entityId=Number(req.body.entity_id||0),method=methodType(req.body.method_type||'Bank'),label=text(req.body.label),entity=entityRow(entityType,entityId,bu);if(!bu||!enforceUnit(req,bu))throw Object.assign(new Error('Current business unit access is required.'),{status:403});if(!entity)throw new Error('Payee was not found in the current business unit.');if(!label)throw new Error('Receiver account label is required.');if(method==='Bank'&&!text(req.body.account_number))throw new Error('Receiver bank account number is required.');if(method==='Bank'&&!text(req.body.bank_name))throw new Error('Receiver bank name is required.');
      const isDefault=req.body.is_default===true||String(req.body.is_default)==='1';const r=db.transaction(()=>{if(isDefault)db.prepare('UPDATE counterparty_payment_accounts SET is_default=0 WHERE business_unit_id=? AND entity_type=? AND entity_id=? AND method_type=?').run(bu,entityType,entityId,method);return db.prepare(`INSERT INTO counterparty_payment_accounts(business_unit_id,entity_type,entity_id,label,method_type,bank_name,account_holder,account_number,account_country,currency,card_network,card_last4,wallet_identifier,active,is_default,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)`).run(bu,entityType,entityId,label,method,text(req.body.bank_name),text(req.body.account_holder||entity.name),text(req.body.account_number),text(req.body.account_country),text(req.body.currency).toUpperCase(),text(req.body.card_network),text(req.body.card_last4).replace(/\D/g,'').slice(-4),text(req.body.wallet_identifier),isDefault?1:0,req.user.id)})();audit(req.user,'counterparty_payment_account',r.lastInsertRowid,'create-v330',JSON.stringify({entity_type:entityType,entity_id:entityId,method_type:method}));res.json({id:Number(r.lastInsertRowid)})
    }catch(e){res.status(e.status||400).json({error:e.message})}
  });
  app.put('/api/v330/payee-accounts/:id/archive',auth,allow('finance','purchases','sales'),(req,res)=>{const r=db.prepare('SELECT * FROM counterparty_payment_accounts WHERE id=?').get(req.params.id);if(!r)return res.status(404).json({error:'Receiver account not found.'});if(!enforceUnit(req,r.business_unit_id))return res.status(403).json({error:'Another business unit account cannot be changed.'});db.prepare('UPDATE counterparty_payment_accounts SET active=0,is_default=0,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(r.id);audit(req.user,'counterparty_payment_account',r.id,'archive-v330',text(req.body.reason));res.json({ok:true})});

  function paymentAllocated(paymentId){return num(db.prepare("SELECT COALESCE(SUM(amount_pkr),0) v FROM excavator_resale_profit_allocations WHERE payment_id=? AND status='Active'").get(paymentId)?.v)}
  function legacyRefunded(paymentId){return num(db.prepare("SELECT COALESCE(SUM(amount_pkr),0) v FROM excavator_resale_profit_refunds WHERE payment_id=? AND status='Completed'").get(paymentId)?.v)}
  function pooledRefunded(paymentId){return num(db.prepare("SELECT COALESCE(SUM(s.amount_pkr),0) v FROM excavator_resale_credit_refund_sources s JOIN excavator_resale_credit_refunds r ON r.id=s.refund_id WHERE s.payment_id=? AND r.status='Completed'").get(paymentId)?.v)}
  function paymentCredit(p){return round2(Math.max(0,num(p.amount_pkr)-paymentAllocated(p.id)-legacyRefunded(p.id)-pooledRefunded(p.id)))}
  function buyerCredits(buyerId){return db.prepare("SELECT * FROM excavator_resale_profit_payments WHERE buyer_id=? AND status='Active' ORDER BY date(payment_date),id").all(buyerId).map(p=>({...p,available_credit_pkr:paymentCredit(p)})).filter(p=>p.available_credit_pkr>.005)}
  function syncShare(id){const r=db.prepare('SELECT * FROM excavator_buyer_resale_shares WHERE id=?').get(id);if(!r)return;const allocated=num(db.prepare("SELECT COALESCE(SUM(a.amount_pkr),0) v FROM excavator_resale_profit_allocations a JOIN excavator_resale_profit_payments p ON p.id=a.payment_id WHERE a.resale_share_id=? AND a.status='Active' AND p.status='Active'").get(id)?.v),due=Math.max(0,num(r.our_share_pkr)),out=Math.max(0,due-allocated);db.prepare('UPDATE excavator_buyer_resale_shares SET amount_received_pkr=?,outstanding_pkr=?,received=?,received_date=CASE WHEN ?=1 THEN COALESCE(received_date,CURRENT_TIMESTAMP) ELSE received_date END WHERE id=?').run(round2(allocated),round2(out),out<=.005?1:0,out<=.005?1:0,id)}
  function targetsForBuyer(buyerId,bu,ids){const set=[...new Set((ids||[]).map(Number).filter(Boolean))];if(!set.length)throw new Error('Select at least one machine resale balance.');const rows=db.prepare(`SELECT r.*,a.asset_no,a.machine_name FROM excavator_buyer_resale_shares r JOIN excavator_assets a ON a.id=r.asset_id WHERE r.buyer_id=? AND a.business_unit_id=? AND COALESCE(r.resale_status,'Active')!='Voided'`).all(buyerId,bu).filter(r=>set.includes(Number(r.id)));if(rows.length!==set.length)throw new Error('One or more selected resale records are unavailable.');return rows.map(r=>{const paid=num(db.prepare("SELECT COALESCE(SUM(a.amount_pkr),0) v FROM excavator_resale_profit_allocations a JOIN excavator_resale_profit_payments p ON p.id=a.payment_id WHERE a.resale_share_id=? AND a.status='Active' AND p.status='Active'").get(r.id)?.v);return {...r,outstanding_pkr:round2(Math.max(0,num(r.our_share_pkr)-paid))}}).filter(r=>r.outstanding_pkr>.005)}
  function allocateSources({buyerId,bu,resaleIds,maxAmount=Infinity,userId,note='Allocated from existing Pakistan resale credit'}){const targets=targetsForBuyer(buyerId,bu,resaleIds),sources=buyerCredits(buyerId);let remaining=Math.max(0,Number(maxAmount)),total=0;const allocations=[],ins=db.prepare(`INSERT INTO excavator_resale_profit_allocations(payment_id,resale_share_id,buyer_id,amount_pkr,fx_rate_to_krw,amount_krw,allocation_date,notes,status,created_by) VALUES(?,?,?,?,?,?,date('now'),?,'Active',?)`);for(const t of targets){let due=t.outstanding_pkr;for(const p of sources){if(due<=.005||remaining<=.005)break;const available=paymentCredit(p);if(available<=.005)continue;const take=round2(Math.min(due,available,remaining));if(take<=.005)continue;ins.run(p.id,t.id,buyerId,take,num(p.fx_rate_to_krw),round2(take*num(p.fx_rate_to_krw)),note,userId);due=round2(due-take);remaining=round2(remaining-take);total=round2(total+take);allocations.push({payment_id:p.id,resale_share_id:t.id,amount_pkr:take,asset_no:t.asset_no})}}for(const t of targets)syncShare(t.id);return {allocated_pkr:total,allocations,remaining_limit_pkr:remaining}}

  app.post('/api/v330/excavator/buyers/:id/resale-credit/allocate',auth,allow('sales','finance'),(req,res)=>{const g=buyerGuard(req,res);if(!g)return;try{const ids=Array.isArray(req.body.resale_ids)?req.body.resale_ids:[],available=buyerCredits(g.buyer.id).reduce((n,p)=>n+p.available_credit_pkr,0);if(available<=.005)throw new Error('No unallocated Pakistan resale credit is available.');const amount=req.body.amount_pkr?round2(req.body.amount_pkr):available;if(amount<=0||amount>available+.005)throw new Error(`Allocation cannot exceed available resale credit PKR ${round2(available).toLocaleString()}.`);const out=db.transaction(()=>allocateSources({buyerId:g.buyer.id,bu:g.bu,resaleIds:ids,maxAmount:amount,userId:req.user.id}))();audit(req.user,'excavator_resale_credit',g.buyer.id,'allocate-v330',JSON.stringify(out));res.json({ok:true,...out,available_credit_after_pkr:round2(available-out.allocated_pkr)})}catch(e){res.status(e.status||400).json({error:e.message})}});

  app.post('/api/v330/excavator/buyers/:id/resale-credit/refund',auth,allow('finance'),upload.single('receipt'),(req,res)=>{const g=buyerGuard(req,res);if(!g)return;try{const available=buyerCredits(g.buyer.id).reduce((n,p)=>n+p.available_credit_pkr,0),amount=round2(req.body.amount_pkr),fx=num(req.body.fx_rate_to_krw),date=text(req.body.refund_date),reference=text(req.body.reference),reason=text(req.body.reason),account=pakistanCompanyAccount(req.body.payment_account_id,g.bu),refundMethod=text(req.body.method||'Bank'),receiver=payeeAccount(req.body.receiver_account_id,{bu:g.bu,entityType:'excavator_buyer',entityId:g.buyer.id,method:refundMethod,required:refundMethod.toLowerCase()!=='cash',currency:'PKR'});if(amount<=0||amount>available+.005)throw new Error(`Refund cannot exceed available resale credit PKR ${round2(available).toLocaleString()}.`);if(fx<=0)throw new Error('FX Rate to KRW must be greater than zero.');if(!date||!reason)throw new Error('Refund date and reason are required.');if(refundMethod.toLowerCase()!=='cash'&&!reference)throw new Error('Refund reference is required for non-cash payments.');if(!req.file)throw new Error('Refund evidence / receipt is required.');const krw=round2(amount*fx);const out=db.transaction(()=>{const rr=db.prepare(`INSERT INTO excavator_resale_credit_refunds(buyer_id,business_unit_id,amount_pkr,fx_rate_to_krw,krw_amount,refund_date,method,reference,payment_account_id,receiver_account_id,receipt_file,reason,status,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,'Completed',?)`).run(g.buyer.id,g.bu,amount,fx,krw,date,refundMethod,reference,account.id,receiver?.id||null,req.file.filename,reason,req.user.id),rid=Number(rr.lastInsertRowid);let left=amount;const ins=db.prepare('INSERT INTO excavator_resale_credit_refund_sources(refund_id,payment_id,amount_pkr) VALUES(?,?,?)');for(const p of buyerCredits(g.buyer.id)){if(left<=.005)break;const take=round2(Math.min(left,p.available_credit_pkr));if(take>.005){ins.run(rid,p.id,take);left=round2(left-take)}}if(left>.005)throw new Error('Resale credit changed while refund was being recorded. Refresh and try again.');const financeId=financeSync({businessUnitId:g.bu,type:'Expense',category:'Pakistan Resale Profit Refund',amount:krw,description:`Refund Pakistan resale unallocated credit · ${g.buyer.name}`,paymentMethod:refundMethod,reference,paymentAccountId:account.id,createdBy:req.user.id,sourceType:'Pakistan Resale Profit Refund',sourceId:rid,receiptFile:req.file.filename,originalAmount:amount,originalCurrency:'PKR',fxRate:fx,transactionDate:date,sourceLabel:'Excavator → Pakistan Resale Credit Refund',sourceRecordId:g.buyer.id,receiverAccountId:receiver?.id||null,receiverEntityType:'excavator_buyer',receiverEntityId:g.buyer.id,receiverName:g.buyer.name});return {refund_id:rid,finance_id:financeId}})();audit(req.user,'excavator_resale_credit_refund',out.refund_id,'create-v330',JSON.stringify({buyer_id:g.buyer.id,amount_pkr:amount,finance_id:out.finance_id}));res.json({ok:true,...out,available_credit_after_pkr:round2(available-amount)})}catch(e){res.status(e.status||400).json({error:e.message,code:e.code})}});

  app.post('/api/v330/excavator/buyers/:id/resale-settlement',auth,allow('sales','finance'),upload.single('receipt'),(req,res)=>{const g=buyerGuard(req,res);if(!g)return;try{let ids;try{ids=JSON.parse(req.body.resale_ids||'[]')}catch(_){ids=[]}const targets=targetsForBuyer(g.buyer.id,g.bu,ids),totalDue=round2(targets.reduce((n,r)=>n+r.outstanding_pkr,0)),available=round2(buyerCredits(g.buyer.id).reduce((n,p)=>n+p.available_credit_pkr,0)),useCredit=round2(req.body.use_credit_pkr||0),newPayment=round2(req.body.new_payment_pkr||0);if(totalDue<=.005)throw new Error('Selected machines have no resale share outstanding.');if(useCredit<0||useCredit>available+.005)throw new Error(`Existing credit use cannot exceed PKR ${available.toLocaleString()}.`);if(useCredit+newPayment<=.005)throw new Error('Use existing credit and/or enter a new payment.');if(useCredit>totalDue+.005)throw new Error('Existing credit allocation cannot exceed the selected outstanding amount.');let account=null,fx=num(req.body.fx_rate_to_krw),date=text(req.body.payment_date),reference=text(req.body.reference);if(newPayment>.005){account=pakistanCompanyAccount(req.body.payment_account_id,g.bu);if(fx<=0)throw new Error('FX Rate to KRW must be greater than zero.');if(!date||!reference)throw new Error('Payment date and reference are required for new money received.');if(!req.file)throw new Error('Receipt / evidence is required for the new payment.')}const out=db.transaction(()=>{const existing=useCredit>.005?allocateSources({buyerId:g.buyer.id,bu:g.bu,resaleIds:ids,maxAmount:useCredit,userId:req.user.id,note:'Combined settlement · existing Pakistan resale credit'}):{allocated_pkr:0,allocations:[]};let newPaymentId=null,financeId=null,newAllocated=0,newCredit=0;if(newPayment>.005){const p=db.prepare(`INSERT INTO excavator_resale_profit_payments(buyer_id,business_unit_id,amount_pkr,fx_rate_to_krw,krw_amount,payment_date,method,reference,payment_account_id,receipt_file,notes,status,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,'Active',?)`).run(g.buyer.id,g.bu,newPayment,fx,round2(newPayment*fx),date,text(req.body.method||'Bank'),reference,account.id,req.file.filename,text(req.body.notes||'Combined existing credit + new payment settlement'),req.user.id);newPaymentId=Number(p.lastInsertRowid);const remainingTargets=targetsForBuyer(g.buyer.id,g.bu,ids),ins=db.prepare(`INSERT INTO excavator_resale_profit_allocations(payment_id,resale_share_id,buyer_id,amount_pkr,fx_rate_to_krw,amount_krw,allocation_date,notes,status,created_by) VALUES(?,?,?,?,?,?,?,'Combined settlement · new payment','Active',?)`);let left=newPayment;for(const t of remainingTargets){if(left<=.005)break;const take=round2(Math.min(left,t.outstanding_pkr));if(take>.005){ins.run(newPaymentId,t.id,g.buyer.id,take,fx,round2(take*fx),date,req.user.id);newAllocated=round2(newAllocated+take);left=round2(left-take)}}for(const t of remainingTargets)syncShare(t.id);newCredit=round2(Math.max(0,left));financeId=financeSync({businessUnitId:g.bu,type:'Revenue',category:'Pakistan Resale Profit Payment',amount:round2(newPayment*fx),description:`Pakistan resale-profit receipt · ${g.buyer.name}`,paymentMethod:text(req.body.method||'Bank'),reference,paymentAccountId:account.id,createdBy:req.user.id,sourceType:'Pakistan Resale Profit Payment',sourceId:newPaymentId,receiptFile:req.file.filename,originalAmount:newPayment,originalCurrency:'PKR',fxRate:fx,transactionDate:date,sourceLabel:'Excavator → Pakistan Resale Profit Payment',sourceRecordId:g.buyer.id,sourcePaymentId:newPaymentId})}return {existing_credit_allocated_pkr:existing.allocated_pkr,new_payment_pkr:newPayment,new_payment_allocated_pkr:newAllocated,new_unallocated_credit_pkr:newCredit,new_payment_id:newPaymentId,finance_id:financeId}})();audit(req.user,'excavator_resale_settlement',g.buyer.id,'combined-v330',JSON.stringify(out));res.json({ok:true,...out})}catch(e){res.status(e.status||400).json({error:e.message,code:e.code})}});

  app.get('/api/v330/excavator/assets/:assetId/payee-context',auth,allow('dashboard','finance','purchases','sales'),(req,res)=>{const bu=excavatorGuard(req,res);if(!bu)return;const a=db.prepare(`SELECT a.id,a.asset_no,a.supplier_id,a.buyer_id,s.name supplier_name,b.name buyer_name FROM excavator_assets a LEFT JOIN excavator_suppliers s ON s.id=a.supplier_id LEFT JOIN excavator_buyers b ON b.id=a.buyer_id WHERE a.id=? AND a.business_unit_id=?`).get(Number(req.params.assetId),bu);if(!a)return res.status(404).json({error:'Machine not found.'});const supplierAccounts=a.supplier_id?db.prepare("SELECT * FROM counterparty_payment_accounts WHERE business_unit_id=? AND entity_type='excavator_supplier' AND entity_id=? AND active=1 ORDER BY is_default DESC,label,id").all(bu,a.supplier_id).map(publicPayee):[];const buyerAccounts=a.buyer_id?db.prepare("SELECT * FROM counterparty_payment_accounts WHERE business_unit_id=? AND entity_type='excavator_buyer' AND entity_id=? AND active=1 ORDER BY is_default DESC,label,id").all(bu,a.buyer_id).map(publicPayee):[];res.json({asset:a,supplier_accounts:supplierAccounts,buyer_accounts:buyerAccounts})});

  app.get('/api/v330/excavator/buyers/:id/resale-credit-summary',auth,allow('dashboard','sales','finance','purchases'),(req,res)=>{const g=buyerGuard(req,res);if(!g)return;const payments=db.prepare("SELECT * FROM excavator_resale_profit_payments WHERE buyer_id=? AND status='Active'").all(g.buyer.id),totalReceived=round2(payments.reduce((n,p)=>n+num(p.amount_pkr),0)),allocated=round2(payments.reduce((n,p)=>n+paymentAllocated(p.id),0)),refunded=round2(payments.reduce((n,p)=>n+legacyRefunded(p.id)+pooledRefunded(p.id),0)),available=round2(payments.reduce((n,p)=>n+paymentCredit(p),0));res.json({total_received_pkr:totalReceived,allocated_pkr:allocated,refunded_pkr:refunded,available_credit_pkr:available})});

  return {version:VERSION,payeeAccount};
}
module.exports={install,VERSION};
