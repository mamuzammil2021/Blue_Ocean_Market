// Blue Ocean Market V30.54.0 — preserve one cash movement per real payment.
// This module intentionally does not delete source records or posted journals.
'use strict';

const CASE_TYPE='EXCAVATOR_SALE_SETTLEMENT_MIRROR';
const REASON='V30.54 integrity quarantine: Excavator sale settlement mirror is not a cash payment. Original buyer receipts and advance allocations are authoritative.';

function isSaleSettlementMirror(db,paymentId){
  const id=Number(paymentId||0);
  if(!Number.isSafeInteger(id)||id<=0)return false;
  const p=db.prepare('SELECT payment_type,source_type,notes FROM excavator_payments WHERE id=?').get(id);
  return !!p&&(String(p.source_type||'')==='Excavator Sale'||
    (String(p.payment_type||'')==='Sale'&&/^Settlement mirror\b/i.test(String(p.notes||''))));
}
function isLegacyMirrorFinance(db,finance){
  return !!finance&&finance.source_type==='Excavator Payment'&&isSaleSettlementMirror(db,finance.source_id);
}
function caseFor(db,id){
  return db.prepare('SELECT * FROM finance_integrity_cases_v354 WHERE finance_entry_id=?').get(Number(id));
}
function install({app,db,auth,allow,currentUnit,accounting}){
  db.exec(`CREATE TABLE IF NOT EXISTS finance_integrity_cases_v354(
    finance_entry_id INTEGER PRIMARY KEY,
    business_unit_id INTEGER NOT NULL,
    source_payment_id INTEGER,
    case_type TEXT NOT NULL,
    resolution_status TEXT NOT NULL,
    amount_krw REAL NOT NULL DEFAULT 0,
    original_cash_effect INTEGER NOT NULL DEFAULT 0,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_finance_integrity_cases_v354_bu ON finance_integrity_cases_v354(business_unit_id,resolution_status);`);
  const upsertCase=db.prepare(`INSERT INTO finance_integrity_cases_v354
    (finance_entry_id,business_unit_id,source_payment_id,case_type,resolution_status,amount_krw,original_cash_effect,note)
    VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(finance_entry_id) DO UPDATE SET
    resolution_status=excluded.resolution_status,note=excluded.note,updated_at=CURRENT_TIMESTAMP`);
  const rows=db.prepare(`SELECT f.*,p.payment_type AS source_payment_type,p.source_type AS payment_source_type,p.notes AS payment_notes
    FROM finance_entries f JOIN excavator_payments p ON p.id=f.source_id
    WHERE f.source_type='Excavator Payment' AND f.status!='Voided'
      AND (p.source_type='Excavator Sale' OR (p.payment_type='Sale' AND p.notes LIKE 'Settlement mirror%'))
    ORDER BY f.id`).all();
  const result={quarantined_unposted:0,posted_requires_controlled_reversal:0,operational_purchases_reclassified:0};
  db.transaction(()=>{
    for(const f of rows){
      const posted=db.prepare(`SELECT id,journal_no FROM accounting_journal_entries WHERE status='Posted'
        AND (finance_entry_id=? OR (source_type='Finance Entry' AND source_id=?)) ORDER BY id DESC LIMIT 1`).get(f.id,f.id);
      if(posted){
        const note=`Already posted journal ${posted.journal_no||posted.id}. Requires authorized Accounting reversal and bank reconciliation; no automatic deletion or ledger mutation.`;
        upsertCase.run(f.id,f.business_unit_id,f.source_id,CASE_TYPE,'Needs Controlled Reversal',Number(f.krw_amount??f.amount??0),Number(f.cash_effect||0),note);
        result.posted_requires_controlled_reversal++;
        continue;
      }
      upsertCase.run(f.id,f.business_unit_id,f.source_id,CASE_TYPE,'Needs User Review',Number(f.krw_amount??f.amount??0),Number(f.cash_effect||0),REASON+' User review required; financial record unchanged.');
      result.review_required=(result.review_required||0)+1;
    }
    // Flag incorrect cash classifications without rewriting historical financial records.
    for(const f of db.prepare(`SELECT f.* FROM finance_entries f JOIN excavator_transactions t ON t.id=f.source_id
      WHERE f.status!='Voided' AND f.source_type='Excavator Cost Transaction' AND t.type='Purchase'
      AND (COALESCE(f.cash_effect,-1)<>0 OR COALESCE(f.finance_role,'')!='Purchase / Payable')`).all()){
      upsertCase.run(f.id,f.business_unit_id,f.source_id,'OPERATIONAL_PURCHASE_CLASSIFICATION','Needs User Review',Number(f.krw_amount??f.amount??0),Number(f.cash_effect||0),'Review purchase cash classification through an authorized correction. No automatic financial mutation.');
    }
    db.prepare(`CREATE TABLE IF NOT EXISTS system_migrations(migration_key TEXT PRIMARY KEY,applied_at TEXT DEFAULT CURRENT_TIMESTAMP,details TEXT DEFAULT '')`).run();
    db.prepare(`INSERT INTO system_migrations(migration_key,details) VALUES('v30.54-financial-integrity-scan',?)
      ON CONFLICT(migration_key) DO UPDATE SET details=excluded.details`).run(JSON.stringify(result));
  })();
  if(result.quarantined_unposted||result.posted_requires_controlled_reversal||result.operational_purchases_reclassified)
    console.warn('[V30.54 Finance integrity]',JSON.stringify(result));

  // Read-only, scoped diagnostic for controlled reconciliation of already posted legacy errors.
  app.get('/api/finance/integrity-v354',auth,allow('finance','dashboard'),(req,res)=>{
    const unit=currentUnit(req)||(req.user.role==='CEO / Owner'?null:req.user.business_unit_id),where=unit?' WHERE business_unit_id=?':'',args=unit?[Number(unit)]:[];
    const cases=db.prepare(`SELECT finance_entry_id,business_unit_id,source_payment_id,case_type,resolution_status,amount_krw,note,created_at FROM finance_integrity_cases_v354${where} ORDER BY finance_entry_id DESC LIMIT 250`).all(...args);
    res.json({ok:true,version:'30.54.0',cases,manual_reversal_required:cases.filter(x=>x.resolution_status==='Needs Controlled Reversal').length,
      note:'Review the original source and Finance record. Do not verify or re-post a suspected duplicate. Posted legacy cases require authorized reversal and reconciliation; no automatic deletion.'});
  });
  return {result,caseFor:id=>caseFor(db,id)};
}
module.exports={install,isSaleSettlementMirror,isLegacyMirrorFinance,caseFor,CASE_TYPE,REASON};
