// Blue Ocean Market V30.25.1 — one-payment/one-Finance-event migration and diagnostics.
'use strict';
const VERSION='30.25.1';
function install({app,db,auth,allow,currentUnit,audit,financeSync,accounting}){
  const text=v=>String(v??'').trim();
  const internal=m=>/^(credit|receivable|payable|buyer advance|advance balance|supplier credit|allocation)$/i.test(text(m));
  function queue(id){try{db.prepare('INSERT INTO accounting_sync_queue(finance_entry_id,queued_at) VALUES(?,CURRENT_TIMESTAMP) ON CONFLICT(finance_entry_id) DO UPDATE SET queued_at=CURRENT_TIMESTAMP').run(id)}catch(_){}}
  function migrateCore(){
    let separated=0,operational=0;
    const rows=db.prepare("SELECT * FROM finance_entries WHERE status!='Voided' AND source_type IN ('Sale','Purchase') ORDER BY id").all();
    const tx=db.transaction(()=>{
      for(const f of rows){
        const method=text(f.payment_method),isInternal=internal(method)||/^operational$/i.test(method),sourceType=f.source_type==='Sale'?(String(f.source_label||'').includes('MIMI')?'MIMI Sale Payment':'Sale Payment'):'Purchase Payment';
        if(!isInternal){
          const paymentId=financeSync({businessUnitId:f.business_unit_id,type:f.source_type==='Sale'?'Revenue':'Expense',category:f.source_type==='Sale'?'Customer Payment':'Supplier Payment',amount:Number(f.krw_amount??f.amount??0),description:`Legacy ${f.source_type.toLowerCase()} payment separation · ${f.description||f.reference||('#'+f.source_id)}`,paymentMethod:method||'Cash',reference:String(method||'').toLowerCase()==='cash'?'':text(f.reference),paymentAccountId:f.payment_account_id||null,createdBy:f.created_by,sourceType,sourceId:f.source_id,receiptFile:f.receipt_file||'',originalAmount:f.original_amount,originalCurrency:f.original_currency||'KRW',fxRate:f.fx_rate||1,transactionDate:f.transaction_date||f.created_at,sourceLabel:f.source_type==='Sale'?'Sales → Customer Payment':'Purchases → Supplier Payment',sourceRecordId:f.source_record_id??f.source_id,sourcePaymentId:f.source_id});
          if(paymentId){
            // Carry forward prior verification only when the old combined row had actually been reviewed.
            if(['Verified','Verified / Correct'].includes(text(f.verification_status)))db.prepare("UPDATE finance_entries SET verification_status=?,verified_by=?,verified_at=?,verification_note=COALESCE(NULLIF(verification_note,''),'Migrated from previously verified combined payment record') WHERE id=?").run(f.verification_status,f.verified_by||null,f.verified_at||null,paymentId);
            queue(paymentId);separated++;
          }
        }
        db.prepare("UPDATE finance_entries SET payment_method='Operational',payment_account_id=NULL,finance_role=?,cash_effect=0,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(f.source_type==='Sale'?'Sale / Revenue':'Purchase / Payable',f.id);
        queue(f.id);operational++;
      }
    });
    tx();try{accounting?.processQueue?.(5000)}catch(_){}
    return {operational_rows:operational,separated_payment_rows:separated};
  }
  let migration={operational_rows:0,separated_payment_rows:0};
  try{migration=migrateCore()}catch(e){console.error('V30.25 finance separation migration:',e.message)}

  app.get('/api/finance/integrity-v325',auth,allow('finance','dashboard'),(req,res)=>{
    let where="status!='Voided'",args=[];const bu=currentUnit(req);if(bu){where+=' AND business_unit_id=?';args=[Number(bu)]}else if(req.user.role!=='CEO / Owner'){where+=' AND business_unit_id=?';args=[Number(req.user.business_unit_id||0)]}
    const cash=Number(db.prepare(`SELECT COUNT(*) c FROM finance_entries WHERE ${where} AND cash_effect!=0`).get(...args)?.c||0),operational=Number(db.prepare(`SELECT COUNT(*) c FROM finance_entries WHERE ${where} AND cash_effect=0 AND source_type!='Manual'`).get(...args)?.c||0),duplicateLogical=Number(db.prepare(`SELECT COUNT(*) c FROM (SELECT business_unit_id,source_type,source_id,COUNT(*) n FROM finance_entries WHERE ${where} AND cash_effect!=0 GROUP BY business_unit_id,source_type,source_id HAVING n>1)`).get(...args)?.c||0),combined=Number(db.prepare(`SELECT COUNT(*) c FROM finance_entries WHERE ${where} AND source_type IN ('Sale','Purchase') AND cash_effect!=0`).get(...args)?.c||0);
    res.json({ok:duplicateLogical===0&&combined===0,version:VERSION,cash_movement_rows:cash,operational_bridge_rows:operational,duplicate_cash_sources:duplicateLogical,combined_operational_cash_rows:combined,migration});
  });
  console.info('Blue Ocean Market V30.25.1 Finance Integrity rule installed');
  return {VERSION,migrateCore};
}
module.exports={install,VERSION};
