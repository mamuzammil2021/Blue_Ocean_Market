'use strict';
// Shared read-only cost policy. Resolve actual Finance links; never infer a lock from a UI flag.
function costState(db,cost,{received=false}={}){
 const tx=cost.fx_transaction_id?db.prepare('SELECT id,finance_entry_id FROM pink_fx_transactions WHERE id=?').get(cost.fx_transaction_id):db.prepare("SELECT id,finance_entry_id FROM pink_fx_transactions WHERE projection_table='pink_salt_import_costs' AND projection_id=? ORDER BY id DESC LIMIT 1").get(cost.id);
 const f=tx?.finance_entry_id?db.prepare('SELECT * FROM finance_entries WHERE id=?').get(tx.finance_entry_id):db.prepare("SELECT * FROM finance_entries WHERE source_type='Pink Salt Import Cost' AND source_id=? AND status!='Voided' ORDER BY id DESC LIMIT 1").get(cost.id);
 const journal=f?db.prepare("SELECT id,status FROM accounting_journal_entries WHERE source_type='Finance Entry' AND source_id=? ORDER BY id DESC LIMIT 1").get(f.id):null;
 const posted=['Posted','Reversed'].includes(f?.accounting_status)||['Posted','Reversed'].includes(journal?.status),verified=['Verified / Correct','Verified'].includes(f?.verification_status),voided=cost.status==='Voided'||f?.status==='Voided';
 return {transaction_id:tx?.id||null,locked:!!(voided||posted||verified||received),lock_reason:voided?'Voided':posted?'Accounting Posted':verified?'Finance Verified':received?'Import Received':'',finance_entry_id:f?.id||null,verification_status:f?.verification_status||'Pending Verification',accounting_status:journal?.status||f?.accounting_status||'Pending',posted,finance:f||null,journal:journal||null};
}
module.exports={costState};
