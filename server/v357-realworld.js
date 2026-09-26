'use strict';
// V30.57: additive fixed-asset accounting on top of existing approved journals.
// This module never inserts finance_entries and never auto-posts official balances.
function install({app,db,auth,allow,currentUnit,enforceUnit,audit,accounting,hasAccess}) {
 const fail=(status,message)=>Object.assign(new Error(message),{status});
 const money=v=>Math.round((Number(v)+Number.EPSILON)*100)/100;
 const validDate=s=>{const v=String(s||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T00:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===v;};
 const permitted=req=>req.user.role==='CEO / Owner'||!!hasAccess?.(req.user.id,'sensitive.accounting_adjustments',Number(currentUnit(req)||0));
 const requireUnit=(req,bu)=>{if(!bu||!enforceUnit(req,Number(bu)))throw fail(403,'Business unit not permitted');};
 const account=(id,type)=>{const a=db.prepare('SELECT * FROM accounting_accounts WHERE id=? AND active=1').get(Number(id));if(!a||a.account_type!==type)throw fail(400,'Select an active '+type+' account');return a;};
 const fixedAssetAccount=id=>{const a=account(id,'Asset');if(a.system_key||['Cash & Bank','Inventory','Receivable','Supplier Advance','Employee Receivable','Inter-BU','Suspense'].includes(a.subtype))throw fail(400,'Select a dedicated operating fixed-asset account, not a cash, inventory or control account');return a;};
 const journal=id=>db.prepare('SELECT * FROM accounting_journal_entries WHERE id=?').get(Number(id));
 const cashNeutralSource=id=>db.prepare('SELECT account_id,debit_krw,credit_krw FROM accounting_journal_lines WHERE journal_entry_id=?').all(id).every(l=>{const a=db.prepare('SELECT * FROM accounting_accounts WHERE id=?').get(l.account_id);return !(a&&(a.subtype==='Cash & Bank'||['BANK_CLEARING','CASH_ON_HAND','PAYMENT_GATEWAY_CLEARING'].includes(a.system_key))&&Math.abs(Number(l.debit_krw)-Number(l.credit_krw))>.005)});
 const posted=j=>j?.status==='Posted'&&!db.prepare("SELECT id FROM accounting_journal_entries WHERE reversal_of_id=? AND status IN ('Pending Review','Correction Required','Posted') LIMIT 1").get(j.id);
 // Official subledger balances change only after a reversal POSTS, never while it is merely proposed.
 const hasPostedReversal=id=>!!db.prepare("SELECT id FROM accounting_journal_entries WHERE reversal_of_id=? AND status='Posted' LIMIT 1").get(id);
 const guard=(bu,d)=>{if(accounting?.isPeriodClosed?.(bu,d))throw fail(409,'Accounting period is closed');};
 const write=(req,res,fn)=>{try{if(!permitted(req))throw fail(403,'Accounting adjustment authority required');res.status(201).json(fn());}catch(e){res.status(e.status||(/UNIQUE|constraint/i.test(e.message)?409:500)).json({error:e.message});}};
 db.exec(`CREATE TABLE IF NOT EXISTS accounting_fixed_assets_v357(
 id INTEGER PRIMARY KEY AUTOINCREMENT, business_unit_id INTEGER NOT NULL,asset_no TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,category TEXT NOT NULL,acquisition_date TEXT NOT NULL,cost_krw REAL NOT NULL CHECK(cost_krw>0),
 residual_krw REAL NOT NULL DEFAULT 0 CHECK(residual_krw>=0),useful_life_months INTEGER NOT NULL CHECK(useful_life_months>0),
 asset_account_id INTEGER NOT NULL,contra_account_id INTEGER NOT NULL,expense_account_id INTEGER NOT NULL,
 source_journal_id INTEGER NOT NULL UNIQUE,policy_reference TEXT NOT NULL,created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS accounting_fixed_asset_events_v357(
 id INTEGER PRIMARY KEY AUTOINCREMENT,asset_id INTEGER NOT NULL,event_type TEXT NOT NULL,period TEXT NOT NULL,
 amount_krw REAL NOT NULL, journal_id INTEGER NOT NULL UNIQUE,policy_reference TEXT NOT NULL,created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(asset_id,event_type,period),FOREIGN KEY(asset_id) REFERENCES accounting_fixed_assets_v357(id));
 CREATE INDEX IF NOT EXISTS idx_fixed_assets_bu_v357 ON accounting_fixed_assets_v357(business_unit_id,id);
 CREATE INDEX IF NOT EXISTS idx_fixed_events_v357 ON accounting_fixed_asset_events_v357(asset_id,event_type,period);
 CREATE TABLE IF NOT EXISTS accounting_fixed_asset_improvements_v357(
 id INTEGER PRIMARY KEY AUTOINCREMENT,asset_id INTEGER NOT NULL,source_journal_id INTEGER NOT NULL UNIQUE,
 improvement_date TEXT NOT NULL,amount_krw REAL NOT NULL CHECK(amount_krw>0),policy_reference TEXT NOT NULL,
 created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(asset_id) REFERENCES accounting_fixed_assets_v357(id));
 CREATE INDEX IF NOT EXISTS idx_fixed_improvements_asset_v357 ON accounting_fixed_asset_improvements_v357(asset_id,id);
 CREATE TABLE IF NOT EXISTS accounting_fixed_asset_locations_v357(
 id INTEGER PRIMARY KEY AUTOINCREMENT,asset_id INTEGER NOT NULL,location TEXT NOT NULL,effective_date TEXT NOT NULL,
 reason TEXT NOT NULL,created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(asset_id) REFERENCES accounting_fixed_assets_v357(id));
 CREATE INDEX IF NOT EXISTS idx_fixed_locations_asset_v357 ON accounting_fixed_asset_locations_v357(asset_id,id);`);
 db.exec(`CREATE TABLE IF NOT EXISTS accounting_fixed_asset_schedules_v357(
 id INTEGER PRIMARY KEY AUTOINCREMENT,asset_id INTEGER NOT NULL,effective_date TEXT NOT NULL,
 through_improvement_id INTEGER NOT NULL,remaining_months INTEGER NOT NULL CHECK(remaining_months>0),
 policy_reference TEXT NOT NULL,created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(asset_id,through_improvement_id),FOREIGN KEY(asset_id) REFERENCES accounting_fixed_assets_v357(id));
 CREATE INDEX IF NOT EXISTS idx_fixed_schedules_asset_v357 ON accounting_fixed_asset_schedules_v357(asset_id,effective_date,id);`);
 function asset(req){const a=db.prepare('SELECT * FROM accounting_fixed_assets_v357 WHERE id=?').get(Number(req.params.id));if(!a)throw fail(404,'Asset not found');requireUnit(req,a.business_unit_id);return a;}
 function events(a){return db.prepare('SELECT e.*,j.status journal_status FROM accounting_fixed_asset_events_v357 e JOIN accounting_journal_entries j ON j.id=e.journal_id WHERE e.asset_id=? ORDER BY e.period,e.id').all(a.id);}
 function state(a){const list=events(a),improvements=db.prepare('SELECT * FROM accounting_fixed_asset_improvements_v357 WHERE asset_id=? ORDER BY improvement_date,id').all(a.id).map(i=>({...i,source_status:journal(i.source_journal_id)?.status||'Missing',source_reversed:hasPostedReversal(i.source_journal_id),source_held:!posted(journal(i.source_journal_id))}));const locations=db.prepare('SELECT * FROM accounting_fixed_asset_locations_v357 WHERE asset_id=? ORDER BY effective_date,id').all(a.id),schedules=db.prepare('SELECT * FROM accounting_fixed_asset_schedules_v357 WHERE asset_id=? ORDER BY effective_date,id').all(a.id);const recognized=list.filter(e=>e.event_type==='Depreciation'&&e.journal_status==='Posted'&&!hasPostedReversal(e.journal_id)).reduce((n,e)=>n+Number(e.amount_krw),0);const pending=list.filter(e=>e.event_type==='Depreciation'&&['Pending Review','Correction Required'].includes(e.journal_status)).reduce((n,e)=>n+Number(e.amount_krw),0);const capitalized=money(improvements.filter(i=>i.source_status==='Posted'&&!i.source_reversed).reduce((n,i)=>n+Number(i.amount_krw),0));const disposal=list.find(e=>e.event_type==='Disposal'),disposed=!!disposal&&disposal.journal_status==='Posted'&&!hasPostedReversal(disposal.journal_id),gross=money(a.cost_krw+capitalized),latest=schedules.at(-1);return {posted_depreciation_krw:money(recognized),pending_depreciation_krw:money(pending),capitalized_improvements_krw:capitalized,capitalized_cost_krw:gross,carrying_value_krw:disposed?0:money(gross-recognized),depreciable_remaining_krw:disposed?0:money(gross-a.residual_krw-recognized),depreciation_schedule_requires_review:improvements.length>0&&(!latest||latest.through_improvement_id!==improvements.at(-1).id),disposed,disposal:disposal||null,improvements,locations,current_location:locations.at(-1)?.location||null,schedules,events:list};}
 app.get('/api/accounting/posted-trends-v357',auth,allow('accounting','finance','dashboard'),(req,res)=>{try{
   const bu=Number(currentUnit(req)||0),now=new Date(),months=Array.from({length:6},(_,i)=>{const d=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-5+i,1));return d.toISOString().slice(0,7)}),where=bu?' AND l.business_unit_id=?':'',args=bu?[bu]:[];
   const rows=db.prepare(`SELECT substr(j.transaction_date,1,7) period,a.account_type,a.subtype,
     SUM(l.credit_krw-l.debit_krw) credit_net,SUM(l.debit_krw-l.credit_krw) debit_net
     FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id
     JOIN accounting_accounts a ON a.id=l.account_id WHERE j.status IN ('Posted','Reversed') AND substr(j.transaction_date,1,7) BETWEEN ? AND ?${where}
     AND (a.account_type IN ('Revenue','Expense') OR a.subtype='Cash & Bank')
     GROUP BY period,a.account_type,a.subtype`).all(months[0],months[5],...args);
   const series=months.map(period=>{const r=rows.filter(x=>x.period===period);return {period,revenue_krw:money(r.filter(x=>x.account_type==='Revenue').reduce((n,x)=>n+x.credit_net,0)),expense_krw:money(r.filter(x=>x.account_type==='Expense').reduce((n,x)=>n+x.debit_net,0)),posted_cash_movement_krw:money(r.filter(x=>x.subtype==='Cash & Bank').reduce((n,x)=>n+x.debit_net,0))};});
   res.json({series,basis:'Posted and reversed General Ledger journal lines; cash series is net posted movement, not a bank statement or unverified Finance.',business_unit_id:bu||null});
  }catch(e){res.status(500).json({error:e.message})}});
 // Read-only posted inter-BU clearing check. This cannot create Finance entries or journals.
 app.get('/api/accounting/inter-bu-reconciliation-v357',auth,allow('accounting'),(req,res)=>{try{
  const asOf=String(req.query?.as_of||new Date().toISOString().slice(0,10));if(!validDate(asOf))throw fail(400,'Provide a valid as-of date');
  const selected=Number(currentUnit(req)||0),all=db.prepare(`SELECT l.business_unit_id bu,a.system_key key,SUM(l.debit_krw-l.credit_krw) net
    FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id
    JOIN accounting_accounts a ON a.id=l.account_id
    WHERE j.status IN ('Posted','Reversed') AND j.transaction_date<=? AND a.system_key IN ('INTER_BU_RECEIVABLE','INTER_BU_PAYABLE')
    GROUP BY l.business_unit_id,a.system_key`).all(asOf);
  const byBu=new Map();for(const r of all){const bu=Number(r.bu||0);if(!bu)continue;const x=byBu.get(bu)||{business_unit_id:bu,due_from_krw:0,due_to_krw:0};if(r.key==='INTER_BU_RECEIVABLE')x.due_from_krw=money(r.net);else x.due_to_krw=money(-r.net);byBu.set(bu,x);}
  const rows=[...byBu.values()].filter(x=>enforceUnit(req,x.business_unit_id)&&(!selected||selected===x.business_unit_id)).sort((a,b)=>a.business_unit_id-b.business_unit_id);
  const companyDueFrom=money([...byBu.values()].reduce((n,x)=>n+x.due_from_krw,0)),companyDueTo=money([...byBu.values()].reduce((n,x)=>n+x.due_to_krw,0));
  // A unit-scoped user must not receive undisclosed company-wide totals.
  const companyScope=!selected&&req.user.role==='CEO / Owner';
  res.json({as_of:asOf,rows,company_totals:companyScope?{due_from_krw:companyDueFrom,due_to_krw:companyDueTo,difference_krw:money(companyDueFrom-companyDueTo),balanced:Math.abs(companyDueFrom-companyDueTo)<=.01}:null,basis:'Posted and reversed GL only. Review partner-level allocations before elimination; no cash movement or journal is created.'});
 }catch(e){res.status(e.status||500).json({error:e.message})}});
 // Consolidation preview is deliberately read-only. Only a posted, un-reversed
 // transfer whose two clearing lines exactly match its source is eligible.
 // Payroll cross-unit costs need their own paired-source review before elimination.
 app.get('/api/accounting/inter-bu-elimination-preview-v357',auth,allow('accounting'),(req,res)=>{try{
  if(req.user.role!=='CEO / Owner'||Number(currentUnit(req)||0))throw fail(403,'Company-wide CEO scope required for consolidation preview');
  const asOf=String(req.query?.as_of||new Date().toISOString().slice(0,10));if(!validDate(asOf))throw fail(400,'Provide a valid as-of date');
  const transfers=db.prepare(`SELECT t.id,t.transfer_no,t.from_business_unit_id,t.to_business_unit_id,t.amount_krw,t.journal_entry_id,t.transfer_date,j.status journal_status
   FROM accounting_inter_unit_transfers t LEFT JOIN accounting_journal_entries j ON j.id=t.journal_entry_id WHERE t.transfer_date<=? ORDER BY t.id`).all(asOf);
  const pair=[],exceptions=[];
  const lines=db.prepare(`SELECT l.business_unit_id,a.system_key,SUM(l.debit_krw-l.credit_krw) net
   FROM accounting_journal_lines l JOIN accounting_accounts a ON a.id=l.account_id
   WHERE l.journal_entry_id=? AND a.system_key IN ('INTER_BU_RECEIVABLE','INTER_BU_PAYABLE') GROUP BY l.business_unit_id,a.system_key`);
  for(const t of transfers){const entries=lines.all(t.journal_entry_id),from=entries.filter(x=>x.system_key==='INTER_BU_RECEIVABLE'&&Number(x.business_unit_id)===Number(t.from_business_unit_id)).reduce((n,x)=>n+Number(x.net),0),to=entries.filter(x=>x.system_key==='INTER_BU_PAYABLE'&&Number(x.business_unit_id)===Number(t.to_business_unit_id)).reduce((n,x)=>n-Number(x.net),0);
   if(t.journal_status!=='Posted'||hasPostedReversal(t.journal_entry_id)||entries.length!==2||Number(t.from_business_unit_id)===Number(t.to_business_unit_id)||Math.abs(from-Number(t.amount_krw))>.005||Math.abs(to-Number(t.amount_krw))>.005){exceptions.push({transfer_id:t.id,transfer_no:t.transfer_no,journal_entry_id:t.journal_entry_id,reason:'Journal not posted/unreversed or clearing pair does not match transfer source'});continue;}
   pair.push({transfer_id:t.id,transfer_no:t.transfer_no,journal_entry_id:t.journal_entry_id,from_business_unit_id:t.from_business_unit_id,to_business_unit_id:t.to_business_unit_id,amount_krw:money(from)});
  }
  const matched=money(pair.reduce((n,x)=>n+x.amount_krw,0));
  res.json({as_of:asOf,matched_transfers:pair,exceptions,preview:{debit_due_to_krw:matched,credit_due_from_krw:matched},status:'Read-only consolidation preview',basis:'Matched posted transfer pairs only. No elimination journal, Finance entry or official balance is created. Payroll allocations and any other unmatched inter-BU balances require partner-level review.'});
 }catch(e){res.status(e.status||500).json({error:e.message})}});
 // Read-only source-to-subledger checks; scoped to visible units and posted accounting only.
 // Shared control accounts can contain assets outside this register; do not interpret their
 // aggregate balance as the register balance or create balancing journals automatically.
 app.get('/api/accounting/v357-integrity-review',auth,allow('accounting'),(req,res)=>{try{
  const selected=Number(currentUnit(req)||0);
  const visible=bu=>enforceUnit(req,Number(bu))&&(!selected||Number(bu)===selected);
  const assets=db.prepare('SELECT * FROM accounting_fixed_assets_v357 ORDER BY id').all().filter(a=>visible(a.business_unit_id));
  const obligations=db.prepare('SELECT * FROM accounting_expense_obligations_v357 ORDER BY id').all().filter(o=>visible(o.business_unit_id));
  const issues=[],assetRows=[],expenseRows=[];
  const lineAmount=(jid,aid)=>money(db.prepare('SELECT COALESCE(SUM(debit_krw-credit_krw),0) amount FROM accounting_journal_lines WHERE journal_entry_id=? AND account_id=?').get(jid,aid).amount);
  for(const a of assets){
   const original=journal(a.source_journal_id),s=state(a),actual=original?lineAmount(original.id,a.asset_account_id):0;
   const flags=[];
   if(!original||original.status!=='Posted'||hasPostedReversal(original.id))flags.push('ACQUISITION_NOT_POSTED_OR_REVERSED');
   if(Math.abs(actual-Number(a.cost_krw))>.005)flags.push('ACQUISITION_SOURCE_AMOUNT_MISMATCH');
   if(s.posted_depreciation_krw-s.capitalized_cost_krw+Number(a.residual_krw)>.005)flags.push('DEPRECIATION_EXCEEDS_DEPRECIABLE_BASE');
   for(const i of s.improvements){const source=journal(i.source_journal_id),amount=source?lineAmount(source.id,a.asset_account_id):0;if(!source||source.status!=='Posted'||i.source_reversed)flags.push('IMPROVEMENT_SOURCE_NOT_POSTED_OR_REVERSED');else if(i.source_held)flags.push('IMPROVEMENT_REVERSAL_PENDING');if(Math.abs(amount-Number(i.amount_krw))>.005)flags.push('IMPROVEMENT_SOURCE_AMOUNT_MISMATCH');}
   if(s.depreciation_schedule_requires_review)flags.push('IMPROVEMENT_SCHEDULE_REVIEW_REQUIRED');
   if(s.pending_depreciation_krw>.005)flags.push('DEPRECIATION_PENDING_REVIEW');
   if(s.disposal&&s.disposal.journal_status!=='Posted')flags.push('DISPOSAL_PENDING_REVIEW');
   for(const code of flags)issues.push({scope:'Fixed Asset',record_id:a.id,reference:a.asset_no,code});
   assetRows.push({id:a.id,asset_no:a.asset_no,business_unit_id:a.business_unit_id,source_journal_id:a.source_journal_id,source_amount_krw:actual,registered_cost_krw:a.cost_krw,capitalized_improvements_krw:s.capitalized_improvements_krw,posted_depreciation_krw:s.posted_depreciation_krw,carrying_value_krw:s.carrying_value_krw,flags});
  }
  for(const o of obligations){
   const r=journal(o.recognition_journal_id),st=expenseState(o),flags=[];
   if(!r||r.status!=='Posted'||hasPostedReversal(r.id))flags.push('RECOGNITION_NOT_POSTED_OR_REVERSED');
   if(o.kind==='Prepaid Expense'&&st.posted_amortization_krw-Number(o.amount_krw)>.005)flags.push('AMORTIZATION_EXCEEDS_PREPAID');
   if(o.kind==='Prepaid Expense'&&st.pending_amortization_krw>.005)flags.push('AMORTIZATION_PENDING_REVIEW');
   if(o.kind==='Accrued Expense'){
    if(st.posted_settlement_krw-Number(o.amount_krw)>.005)flags.push('SETTLEMENT_EXCEEDS_ACCRUAL');
    for(const link of st.settlements){const f=financeAvailable?db.prepare('SELECT * FROM finance_entries WHERE id=?').get(link.finance_entry_id):null,j=journal(link.journal_id);if(!f||f.status==='Voided'||!['Verified','Verified / Correct'].includes(f.verification_status)||!paymentEvidence(f)||!j||j.finance_entry_id!==link.finance_entry_id)flags.push('SETTLEMENT_SOURCE_REVIEW_REQUIRED');else if(j.status==='Posted'&&!hasPostedReversal(j.id)&&!posted(j))flags.push('SETTLEMENT_REVERSAL_PENDING');}
   }
   for(const code of flags)issues.push({scope:o.kind,record_id:o.id,reference:o.reference,code});
   expenseRows.push({id:o.id,kind:o.kind,reference:o.reference,business_unit_id:o.business_unit_id,recognition_journal_id:o.recognition_journal_id,amount_krw:o.amount_krw,posted_amortization_krw:st.posted_amortization_krw,remaining_prepaid_krw:o.kind==='Prepaid Expense'?st.remaining_prepaid_krw:null,posted_settlement_krw:o.kind==='Accrued Expense'?st.posted_settlement_krw:null,outstanding_accrual_krw:o.kind==='Accrued Expense'?st.outstanding_accrual_krw:null,flags});
  }
  res.json({asset_rows:assetRows,expense_rows:expenseRows,issues,counts:{assets:assetRows.length,expense_obligations:expenseRows.length,issues:issues.length},basis:'Read-only source-linked reconciliation; only posted entries determine recognized amounts. Pending proposals shown as attention, not posted balances. Shared GL controls and other operational subledgers are not presumed to equal this register.',no_cash_movement:true});
 }catch(e){res.status(e.status||500).json({error:e.message})}});
 // A guided selector avoids requiring ordinary users to know internal journal IDs.
 // Only posted, unreversed, unregistered same-unit non-Finance acquisition debits are offered.
 app.get('/api/accounting/fixed-assets-v357/source-journals',auth,allow('accounting'),(req,res)=>{try{
   const bu=Number(req.query?.business_unit_id||currentUnit(req)||0),aid=Number(req.query?.asset_account_id||0);
   requireUnit(req,bu);fixedAssetAccount(aid);
   const rows=db.prepare(`SELECT j.id,j.transaction_date,SUM(l.debit_krw-l.credit_krw) amount_krw
     FROM accounting_journal_entries j JOIN accounting_journal_lines l ON l.journal_entry_id=j.id
     WHERE j.business_unit_id=? AND l.account_id=? AND j.status='Posted' AND j.finance_entry_id IS NULL
     AND NOT EXISTS(SELECT 1 FROM accounting_journal_entries r WHERE r.reversal_of_id=j.id AND r.status IN ('Posted','Pending Review','Correction Required'))
     AND NOT EXISTS(SELECT 1 FROM accounting_fixed_assets_v357 a WHERE a.source_journal_id=j.id)
     AND NOT EXISTS(SELECT 1 FROM accounting_fixed_asset_improvements_v357 i WHERE i.source_journal_id=j.id)
     GROUP BY j.id,j.transaction_date HAVING SUM(l.debit_krw-l.credit_krw)>0 ORDER BY j.transaction_date DESC,j.id DESC LIMIT 50`).all(bu,aid);
   res.json({rows:rows.filter(r=>cashNeutralSource(r.id)).map(r=>({...r,amount_krw:money(r.amount_krw)})),basis:'Only unregistered posted cash-neutral source journals are selectable; verify acquisition details and match the exact asset debit.'});
 }catch(e){res.status(e.status||500).json({error:e.message})}});
 app.get('/api/accounting/fixed-assets-v357/accounts',auth,allow('accounting'),(req,res)=>{try{res.json(db.prepare("SELECT id,code,name,account_type,allow_manual,subtype,system_key FROM accounting_accounts WHERE active=1 AND account_type IN ('Asset','Expense','Liability') ORDER BY code").all().filter(a=>a.account_type!=='Asset'||(!a.system_key&&!['Cash & Bank','Inventory','Receivable','Supplier Advance','Employee Receivable','Inter-BU','Suspense'].includes(a.subtype))));}catch(e){res.status(500).json({error:e.message})}});
 app.get('/api/accounting/fixed-assets-v357',auth,allow('accounting'),(req,res)=>{try{const bu=Number(currentUnit(req)||0),all=db.prepare('SELECT * FROM accounting_fixed_assets_v357 ORDER BY id DESC').all().filter(a=>enforceUnit(req,a.business_unit_id)&&(!bu||a.business_unit_id===bu));res.json({rows:all.map(a=>({...a,...state(a)})),basis:'Registered assets linked to existing posted acquisition journals. Pending depreciation excluded from official carrying value.'});}catch(e){res.status(500).json({error:e.message})}});
 app.post('/api/accounting/fixed-assets-v357',auth,allow('accounting'),(req,res)=>write(req,res,()=>{
  const b=req.body||{},bu=Number(b.business_unit_id||currentUnit(req)),d=String(b.acquisition_date||''),cost=money(b.cost_krw),residual=money(b.residual_krw||0),life=Number(b.useful_life_months),ref=String(b.policy_reference||'').trim(),name=String(b.name||'').trim(),category=String(b.category||'').trim(),no=String(b.asset_no||'').trim();requireUnit(req,bu);
  if(!validDate(d)||!Number.isFinite(cost)||cost<=0||!Number.isFinite(residual)||residual<0||residual>=cost||!Number.isInteger(life)||life<1||life>1200||name.length<3||category.length<3||no.length<3||ref.length<8)throw fail(400,'Complete asset, date, cost, life and approved policy reference');
  const assetAccount=fixedAssetAccount(b.asset_account_id),contra=fixedAssetAccount(b.contra_account_id),expense=account(b.expense_account_id,'Expense');if(assetAccount.id===contra.id)throw fail(400,'Asset and accumulated depreciation accounts must differ');
  const source=journal(b.source_journal_id);if(!posted(source)||Number(source.business_unit_id)!==bu||source.finance_entry_id||source.transaction_date>d||!cashNeutralSource(source.id))throw fail(409,'Use an existing posted, unreversed cash-neutral same-unit non-Finance asset acquisition/opening journal dated no later than the asset');
  if(db.prepare('SELECT id FROM accounting_fixed_asset_improvements_v357 WHERE source_journal_id=?').get(source.id))throw fail(409,'Source journal is already assigned to a capitalized improvement');
  const amount=money(db.prepare('SELECT COALESCE(SUM(debit_krw-credit_krw),0) amount FROM accounting_journal_lines WHERE journal_entry_id=? AND account_id=?').get(source.id,assetAccount.id).amount);
  if(Math.abs(amount-cost)>.005)throw fail(409,'Posted acquisition journal asset line must equal registered acquisition cost');
  return db.transaction(()=>{const id=Number(db.prepare('INSERT INTO accounting_fixed_assets_v357(business_unit_id,asset_no,name,category,acquisition_date,cost_krw,residual_krw,useful_life_months,asset_account_id,contra_account_id,expense_account_id,source_journal_id,policy_reference,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(bu,no.slice(0,80),name.slice(0,160),category.slice(0,80),d,cost,residual,life,assetAccount.id,contra.id,expense.id,source.id,ref.slice(0,250),req.user.id).lastInsertRowid);audit(req.user,'accounting_fixed_asset',id,'register',JSON.stringify({source_journal_id:source.id,no_new_finance:true,no_new_journal:true}));return {ok:true,id,source_journal_id:source.id,no_new_finance:true,no_new_journal:true};})();
 }));
 app.get('/api/accounting/fixed-assets-v357/:id',auth,allow('accounting'),(req,res)=>{try{const a=asset(req);res.json({...a,...state(a)})}catch(e){res.status(e.status||500).json({error:e.message})}});
 app.get('/api/accounting/fixed-assets-v357/:id/improvement-sources',auth,allow('accounting'),(req,res)=>{try{
  const a=asset(req),s=state(a);if(s.disposal)throw fail(409,'Asset has a disposal proposal');
  const rows=db.prepare(`SELECT j.id,j.transaction_date,SUM(l.debit_krw-l.credit_krw) amount_krw
   FROM accounting_journal_entries j JOIN accounting_journal_lines l ON l.journal_entry_id=j.id
   WHERE j.business_unit_id=? AND l.account_id=? AND j.status='Posted' AND j.finance_entry_id IS NULL AND j.transaction_date>=?
   AND NOT EXISTS(SELECT 1 FROM accounting_journal_entries r WHERE r.reversal_of_id=j.id AND r.status IN ('Posted','Pending Review','Correction Required'))
   AND NOT EXISTS(SELECT 1 FROM accounting_fixed_assets_v357 x WHERE x.source_journal_id=j.id)
   AND NOT EXISTS(SELECT 1 FROM accounting_fixed_asset_improvements_v357 x WHERE x.source_journal_id=j.id)
   GROUP BY j.id,j.transaction_date HAVING SUM(l.debit_krw-l.credit_krw)>0
   ORDER BY j.transaction_date DESC,j.id DESC LIMIT 50`).all(a.business_unit_id,a.asset_account_id,a.acquisition_date);
  res.json({rows:rows.filter(r=>cashNeutralSource(r.id)).map(r=>({...r,amount_krw:money(r.amount_krw)})),basis:'Existing posted, unreversed cash-neutral same-unit asset debit; no new Finance or journal is created.'});
 }catch(e){res.status(e.status||500).json({error:e.message})}});
 app.post('/api/accounting/fixed-assets-v357/:id/improvements',auth,allow('accounting'),(req,res)=>write(req,res,()=>{
  const a=asset(req),b=req.body||{},d=String(b.improvement_date||''),amt=money(b.amount_krw),ref=String(b.policy_reference||'').trim(),source=journal(b.source_journal_id),s=state(a);
  if(!validDate(d)||d<a.acquisition_date||!Number.isFinite(amt)||amt<=0||ref.length<8)throw fail(400,'Provide improvement date, cost and approved capitalization policy');guard(a.business_unit_id,d);
  if(s.disposal||s.pending_depreciation_krw>.005||!posted(journal(a.source_journal_id)))throw fail(409,'Resolve acquisition, depreciation or disposal before adding an improvement');
  const lastDep=s.events.filter(e=>e.event_type==='Depreciation'&&e.journal_status==='Posted'&&!hasPostedReversal(e.journal_id)).at(-1);if((lastDep&&d.slice(0,7)<=lastDep.period)||(s.improvements.length&&d<s.improvements.at(-1).improvement_date))throw fail(409,'Improvement must follow the latest posted depreciation month and improvement history');
  if(!posted(source)||Number(source.business_unit_id)!==a.business_unit_id||source.finance_entry_id||source.transaction_date>d||source.transaction_date<a.acquisition_date||!cashNeutralSource(source.id))throw fail(409,'Use an existing posted, unreversed cash-neutral same-unit non-Finance asset debit');
  if(db.prepare('SELECT id FROM accounting_fixed_assets_v357 WHERE source_journal_id=?').get(source.id)||db.prepare('SELECT id FROM accounting_fixed_asset_improvements_v357 WHERE source_journal_id=?').get(source.id))throw fail(409,'Source journal already assigned to a registered asset or improvement');
  const actual=money(db.prepare('SELECT COALESCE(SUM(debit_krw-credit_krw),0) amount FROM accounting_journal_lines WHERE journal_entry_id=? AND account_id=?').get(source.id,a.asset_account_id).amount);
  if(Math.abs(actual-amt)>.005)throw fail(409,'Existing posted asset debit must equal the improvement amount');
  return db.transaction(()=>{const id=Number(db.prepare('INSERT INTO accounting_fixed_asset_improvements_v357(asset_id,source_journal_id,improvement_date,amount_krw,policy_reference,created_by) VALUES(?,?,?,?,?,?)').run(a.id,source.id,d,amt,ref.slice(0,250),req.user.id).lastInsertRowid);audit(req.user,'accounting_fixed_asset',a.id,'register-capitalized-improvement',JSON.stringify({id,source_journal_id:source.id,amount_krw:amt,no_new_cash:true}));return {ok:true,id,source_journal_id:source.id,no_new_finance:true,no_new_journal:true,depreciation_schedule_requires_review:true};})();
 }));
 app.post('/api/accounting/fixed-assets-v357/:id/depreciation-schedule',auth,allow('accounting'),(req,res)=>write(req,res,()=>{
  const a=asset(req),b=req.body||{},d=String(b.effective_date||''),months=Number(b.remaining_months),ref=String(b.policy_reference||'').trim(),s=state(a),latest=s.improvements.at(-1);
  if(!latest||!validDate(d)||d<latest.improvement_date||!Number.isInteger(months)||months<1||months>1200||ref.length<8)throw fail(400,'Provide effective date, remaining life and approved depreciation policy');guard(a.business_unit_id,d);
  if(s.disposal||s.pending_depreciation_krw>.005||s.improvements.some(i=>i.source_held)||!posted(journal(a.source_journal_id)))throw fail(409,'Resolve unposted/reversed sources or pending proposals before revising depreciation');
  const last=s.events.filter(e=>e.event_type==='Depreciation'&&e.journal_status==='Posted'&&!hasPostedReversal(e.journal_id)).at(-1);if(last&&d.slice(0,7)<=last.period)throw fail(409,'Revision must begin after the latest posted depreciation month');
  return db.transaction(()=>{const id=Number(db.prepare('INSERT INTO accounting_fixed_asset_schedules_v357(asset_id,effective_date,through_improvement_id,remaining_months,policy_reference,created_by) VALUES(?,?,?,?,?,?)').run(a.id,d,latest.id,months,ref.slice(0,250),req.user.id).lastInsertRowid);audit(req.user,'accounting_fixed_asset',a.id,'revise-depreciation-schedule',JSON.stringify({id,through_improvement_id:latest.id,remaining_months:months,no_cash:true}));return {ok:true,id,no_new_finance:true,no_new_journal:true};})();
 }));
 app.post('/api/accounting/fixed-assets-v357/:id/location',auth,allow('accounting'),(req,res)=>write(req,res,()=>{
  const a=asset(req),b=req.body||{},d=String(b.effective_date||''),location=String(b.location||'').trim(),reason=String(b.reason||'').trim(),s=state(a);
  if(!validDate(d)||d<a.acquisition_date||location.length<3||location.length>160||reason.length<8)throw fail(400,'Provide location, effective date and reason');if(s.disposal)throw fail(409,'Disposed asset cannot be transferred');
  if(s.locations.length&&d<s.locations.at(-1).effective_date)throw fail(409,'Location history must remain chronological');
  return db.transaction(()=>{const id=Number(db.prepare('INSERT INTO accounting_fixed_asset_locations_v357(asset_id,location,effective_date,reason,created_by) VALUES(?,?,?,?,?)').run(a.id,location,d,reason,req.user.id).lastInsertRowid);audit(req.user,'accounting_fixed_asset',a.id,'location-change',JSON.stringify({id,location,effective_date:d,reason,no_cash:true}));return {ok:true,id,no_new_finance:true,no_new_journal:true};})();
 }));
 app.post('/api/accounting/fixed-assets-v357/:id/depreciation',auth,allow('accounting'),(req,res)=>write(req,res,()=>{
  const a=asset(req),b=req.body||{},d=String(b.period_end||''),period=d.slice(0,7),ref=String(b.policy_reference||'').trim();if(!validDate(d)||d<a.acquisition_date||ref.length<8)throw fail(400,'Provide valid period end and approved policy reference');guard(a.business_unit_id,d);
  if(!posted(journal(a.source_journal_id)))throw fail(409,'Acquisition journal is not posted and unreversed');const s=state(a);if(s.disposal)throw fail(409,'Asset already has a disposal proposal');if(s.pending_depreciation_krw>.005)throw fail(409,'Resolve pending depreciation before another proposal');if(s.depreciation_schedule_requires_review)throw fail(409,'Approve a revised remaining-life schedule after the capitalized improvement');
  if(db.prepare("SELECT id FROM accounting_fixed_asset_events_v357 WHERE asset_id=? AND event_type='Depreciation' AND period=?").get(a.id,period))throw fail(409,'A depreciation proposal already exists for this month');
  const remaining=s.depreciable_remaining_krw;if(remaining<=.005)throw fail(409,'Asset already depreciated to residual value');const schedule=s.schedules.at(-1);if(schedule&&d<schedule.effective_date)throw fail(409,'Depreciation cannot predate the revised schedule');if(s.improvements.some(i=>i.source_held))throw fail(409,'Resolve improvement source before depreciation');const used=schedule?s.events.filter(e=>e.event_type==='Depreciation'&&e.period>=schedule.effective_date.slice(0,7)&&e.journal_status==='Posted'&&!hasPostedReversal(e.journal_id)).length:0;const periods=schedule?schedule.remaining_months-used:a.useful_life_months;if(periods<1)throw fail(409,'Approved remaining life exhausted; review depreciation policy');const amount=money(Math.min(remaining,money(schedule?remaining/periods:(a.cost_krw-a.residual_krw)/a.useful_life_months)));if(amount<=0)throw fail(409,'Depreciation rounds to zero; review accounting policy');
  return db.transaction(()=>{const id=Number(db.prepare("INSERT INTO accounting_fixed_asset_events_v357(asset_id,event_type,period,amount_krw,journal_id,policy_reference,created_by) VALUES(?,'Depreciation',?,?,-1,?,?)").run(a.id,period,amount,ref.slice(0,250),req.user.id).lastInsertRowid);const jid=accounting.postJournal({businessUnitId:a.business_unit_id,transactionDate:d,sourceType:'Fixed Asset Depreciation V357',sourceId:id,sourceLabel:a.asset_no,description:'Approved straight-line fixed asset depreciation · '+a.name,createdBy:req.user.id,lines:[{account_id:a.expense_account_id,debit_krw:amount,credit_krw:0,dimension_json:{fixed_asset_id:a.id}},{account_id:a.contra_account_id,debit_krw:0,credit_krw:amount,dimension_json:{fixed_asset_id:a.id}}]});db.prepare('UPDATE accounting_fixed_asset_events_v357 SET journal_id=? WHERE id=?').run(jid,id);audit(req.user,'accounting_fixed_asset',a.id,'depreciation-proposal',JSON.stringify({journal_id:jid,amount,no_cash:true}));return {ok:true,journal_id:jid,amount_krw:amount,status:'Pending Review',no_cash_movement:true};})();
 }));
 app.post('/api/accounting/fixed-assets-v357/:id/dispose-fully-depreciated',auth,allow('accounting'),(req,res)=>write(req,res,()=>{
  const a=asset(req),b=req.body||{},d=String(b.disposal_date||''),ref=String(b.policy_reference||'').trim();if(!validDate(d)||d<a.acquisition_date||ref.length<8)throw fail(400,'Provide disposal date and approved policy reference');guard(a.business_unit_id,d);const s=state(a);
  if(s.disposal||s.pending_depreciation_krw>.005||s.depreciation_schedule_requires_review||s.improvements.some(i=>i.source_held)||!posted(journal(a.source_journal_id))||Math.abs(s.carrying_value_krw)>.005||a.residual_krw>.005)throw fail(409,'Cash-neutral disposal requires fully depreciated zero-residual asset with valid sources and no pending proposals');
  const total=s.capitalized_cost_krw;return db.transaction(()=>{const id=Number(db.prepare("INSERT INTO accounting_fixed_asset_events_v357(asset_id,event_type,period,amount_krw,journal_id,policy_reference,created_by) VALUES(?,'Disposal',?,?,-1,?,?)").run(a.id,d,total,ref.slice(0,250),req.user.id).lastInsertRowid);const jid=accounting.postJournal({businessUnitId:a.business_unit_id,transactionDate:d,sourceType:'Fixed Asset Disposal V357',sourceId:id,sourceLabel:a.asset_no,description:'Fully depreciated asset derecognition; no cash proceeds',createdBy:req.user.id,lines:[{account_id:a.contra_account_id,debit_krw:total,credit_krw:0,dimension_json:{fixed_asset_id:a.id}},{account_id:a.asset_account_id,debit_krw:0,credit_krw:total,dimension_json:{fixed_asset_id:a.id}}]});db.prepare('UPDATE accounting_fixed_asset_events_v357 SET journal_id=? WHERE id=?').run(jid,id);audit(req.user,'accounting_fixed_asset',a.id,'disposal-proposal',JSON.stringify({jid,no_cash:true}));return {ok:true,journal_id:jid,status:'Pending Review',no_cash_movement:true};})();
 }));

 // Expense accruals and prepayments are GL proposals. Cash settlement remains in original Finance workflow.
 db.exec(`CREATE TABLE IF NOT EXISTS accounting_expense_obligations_v357(
 id INTEGER PRIMARY KEY AUTOINCREMENT,business_unit_id INTEGER NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('Accrued Expense','Prepaid Expense')),
 reference TEXT NOT NULL,description TEXT NOT NULL,recognition_date TEXT NOT NULL,amount_krw REAL NOT NULL CHECK(amount_krw>0),
 expense_account_id INTEGER NOT NULL,control_account_id INTEGER NOT NULL,source_journal_id INTEGER,
 recognition_journal_id INTEGER NOT NULL UNIQUE,policy_reference TEXT NOT NULL,created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(business_unit_id,kind,reference));
 CREATE TABLE IF NOT EXISTS accounting_expense_amortization_v357(
 id INTEGER PRIMARY KEY AUTOINCREMENT,obligation_id INTEGER NOT NULL,period TEXT NOT NULL,amount_krw REAL NOT NULL CHECK(amount_krw>0),
 journal_id INTEGER NOT NULL UNIQUE,policy_reference TEXT NOT NULL,created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(obligation_id,period),FOREIGN KEY(obligation_id) REFERENCES accounting_expense_obligations_v357(id));
 CREATE INDEX IF NOT EXISTS idx_expense_obligation_bu_v357 ON accounting_expense_obligations_v357(business_unit_id,kind,id);
 CREATE UNIQUE INDEX IF NOT EXISTS idx_prepaid_unique_source_v357 ON accounting_expense_obligations_v357(source_journal_id) WHERE kind='Prepaid Expense' AND source_journal_id IS NOT NULL;`);
 db.exec(`CREATE TABLE IF NOT EXISTS accounting_expense_settlements_v357(
 id INTEGER PRIMARY KEY AUTOINCREMENT,obligation_id INTEGER NOT NULL,finance_entry_id INTEGER NOT NULL,
 journal_id INTEGER NOT NULL,amount_krw REAL NOT NULL CHECK(amount_krw>0),policy_reference TEXT NOT NULL,
 created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(obligation_id,finance_entry_id),FOREIGN KEY(obligation_id) REFERENCES accounting_expense_obligations_v357(id));
 CREATE INDEX IF NOT EXISTS idx_expense_settlement_finance_v357 ON accounting_expense_settlements_v357(finance_entry_id);`);
 const financeAvailable=!!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='finance_entries'").get();
 const obligation=req=>{const x=db.prepare('SELECT * FROM accounting_expense_obligations_v357 WHERE id=?').get(Number(req.params.id));if(!x)throw fail(404,'Expense obligation not found');requireUnit(req,x.business_unit_id);return x;};
 const amortized=o=>db.prepare(`SELECT a.*,j.status journal_status FROM accounting_expense_amortization_v357 a JOIN accounting_journal_entries j ON j.id=a.journal_id WHERE a.obligation_id=? ORDER BY a.period`).all(o.id);
 function expenseState(o){const items=amortized(o),postedSum=items.filter(x=>x.journal_status==='Posted'&&!hasPostedReversal(x.journal_id)).reduce((n,x)=>n+Number(x.amount_krw),0),pending=items.filter(x=>['Pending Review','Correction Required'].includes(x.journal_status)).reduce((n,x)=>n+Number(x.amount_krw),0),recognized=o.kind==='Prepaid Expense'&&!!journal(o.recognition_journal_id)&&journal(o.recognition_journal_id).status==='Posted'&&!hasPostedReversal(o.recognition_journal_id);const links=db.prepare('SELECT s.*,j.status journal_status FROM accounting_expense_settlements_v357 s JOIN accounting_journal_entries j ON j.id=s.journal_id WHERE s.obligation_id=? ORDER BY s.id').all(o.id),settled=links.filter(x=>x.journal_status==='Posted'&&!hasPostedReversal(x.journal_id)).reduce((n,x)=>n+Number(x.amount_krw),0),accrualPosted=o.kind==='Accrued Expense'&&journal(o.recognition_journal_id)?.status==='Posted'&&!hasPostedReversal(o.recognition_journal_id);return {posted_amortization_krw:money(postedSum),pending_amortization_krw:money(pending),recognized_prepaid_krw:recognized?money(o.amount_krw):0,pending_recognition_krw:!recognized&&o.kind==='Prepaid Expense'?money(o.amount_krw):0,remaining_prepaid_krw:recognized?money(o.amount_krw-postedSum):0,posted_settlement_krw:money(settled),outstanding_accrual_krw:accrualPosted?money(Math.max(0,o.amount_krw-settled)):0,settlements:links,amortizations:items};}
 app.get('/api/accounting/expense-obligations-v357',auth,allow('accounting'),(req,res)=>{try{const bu=Number(currentUnit(req)||0),rows=db.prepare('SELECT * FROM accounting_expense_obligations_v357 ORDER BY id DESC').all().filter(o=>enforceUnit(req,o.business_unit_id)&&(!bu||o.business_unit_id===bu));res.json({rows:rows.map(o=>({...o,...expenseState(o),recognition_status:journal(o.recognition_journal_id)?.status||'Missing'})),basis:'Accrual recognition and expense reclassification are journal proposals; no Finance payment is fabricated.'});}catch(e){res.status(500).json({error:e.message})}});
 app.post('/api/accounting/expense-obligations-v357/accrue',auth,allow('accounting'),(req,res)=>write(req,res,()=>{
  const b=req.body||{},bu=Number(b.business_unit_id||currentUnit(req)),d=String(b.recognition_date||''),amt=money(b.amount_krw),ref=String(b.reference||'').trim(),description=String(b.description||'').trim(),policy=String(b.policy_reference||'').trim();requireUnit(req,bu);
  if(!validDate(d)||!Number.isFinite(amt)||amt<=0||ref.length<4||description.length<8||policy.length<8)throw fail(400,'Provide invoice reference, description, date, amount and approved policy');guard(bu,d);
  const exp=account(b.expense_account_id,'Expense'),liability=account(b.liability_account_id,'Liability');
  return db.transaction(()=>{const id=Number(db.prepare("INSERT INTO accounting_expense_obligations_v357(business_unit_id,kind,reference,description,recognition_date,amount_krw,expense_account_id,control_account_id,recognition_journal_id,policy_reference,created_by) VALUES(?,'Accrued Expense',?,?,?,?,?,?,-1,?,?)").run(bu,ref.slice(0,120),description.slice(0,300),d,amt,exp.id,liability.id,policy.slice(0,250),req.user.id).lastInsertRowid);const jid=accounting.postJournal({businessUnitId:bu,transactionDate:d,sourceType:'Accrued Expense V357',sourceId:id,sourceLabel:ref,description:'Invoice accrual · '+description,createdBy:req.user.id,lines:[{account_id:exp.id,debit_krw:amt,credit_krw:0,dimension_json:{expense_obligation_id:id}},{account_id:liability.id,debit_krw:0,credit_krw:amt,dimension_json:{expense_obligation_id:id}}]});db.prepare('UPDATE accounting_expense_obligations_v357 SET recognition_journal_id=? WHERE id=?').run(jid,id);audit(req.user,'accounting_expense_obligation',id,'accrual-proposal',JSON.stringify({journal_id:jid,no_new_cash:true,invoice_reference:ref}));return {ok:true,id,journal_id:jid,status:'Pending Review',no_cash_movement:true,settlement:'Link actual verified Finance payment separately'};})();
 }));
 const paymentCapacity=(financeId,liabilityId)=>{const debited=money(db.prepare('SELECT COALESCE(SUM(debit_krw-credit_krw),0) amount FROM accounting_journal_lines WHERE journal_entry_id=(SELECT id FROM accounting_journal_entries WHERE finance_entry_id=? AND status=\'Posted\') AND account_id=?').get(financeId,liabilityId).amount);const assigned=money(db.prepare(`SELECT COALESCE(SUM(s.amount_krw),0) amount FROM accounting_expense_settlements_v357 s
  JOIN accounting_expense_obligations_v357 o ON o.id=s.obligation_id JOIN accounting_journal_entries j ON j.id=s.journal_id
  WHERE s.finance_entry_id=? AND o.control_account_id=? AND j.status='Posted'
  AND NOT EXISTS(SELECT 1 FROM accounting_journal_entries r WHERE r.reversal_of_id=j.id AND r.status='Posted')`).get(financeId,liabilityId).amount);return money(Math.max(0,debited-assigned));};
 const paymentEvidence=f=>!!String(f.receipt_file||'').trim()||!!(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='finance_attachments'").get()&&db.prepare('SELECT 1 FROM finance_attachments WHERE finance_entry_id=? LIMIT 1').get(f.id));
 const eligiblePayment=(f,j,o)=>f&&j&&Number(f.business_unit_id)===Number(o.business_unit_id)&&Number(j.business_unit_id)===Number(o.business_unit_id)&&j.finance_entry_id===f.id&&j.status==='Posted'&&!hasPostedReversal(j.id)&&posted(j)&&f.status!=='Voided'&&['Verified','Verified / Correct'].includes(f.verification_status)&&Number(f.cash_effect)<0&&paymentEvidence(f)&&j.transaction_date>=o.recognition_date;
 app.get('/api/accounting/expense-obligations-v357/:id/eligible-payments',auth,allow('accounting'),(req,res)=>{try{
  const o=obligation(req);if(o.kind!=='Accrued Expense'||!financeAvailable)throw fail(409,'Verified Finance settlement is unavailable');
  const rows=db.prepare(`SELECT f.* FROM finance_entries f WHERE f.business_unit_id=? AND f.verification_status IN ('Verified','Verified / Correct')
   AND f.status!='Voided' AND f.cash_effect<0 AND f.transaction_date>=? ORDER BY f.transaction_date DESC,f.id DESC LIMIT 100`).all(o.business_unit_id,o.recognition_date);
  res.json({rows:rows.map(f=>{const j=db.prepare('SELECT * FROM accounting_journal_entries WHERE finance_entry_id=?').get(f.id);return eligiblePayment(f,j,o)?{finance_entry_id:f.id,journal_id:j.id,transaction_date:f.transaction_date,reference:f.reference||'',currency:f.original_currency||'KRW',original_amount:f.original_amount,krw_amount:f.krw_amount,available_liability_debit_krw:paymentCapacity(f.id,o.control_account_id)}:null}).filter(x=>x&&x.available_liability_debit_krw>.005),basis:'Existing verified cash-out Finance entries with posted liability debit and evidence. Linking does not create a new payment or journal.'});
 }catch(e){res.status(e.status||500).json({error:e.message})}});
 app.post('/api/accounting/expense-obligations-v357/:id/link-payment',auth,allow('accounting'),(req,res)=>write(req,res,()=>{
  const o=obligation(req),b=req.body||{},financeId=Number(b.finance_entry_id),amount=money(b.amount_krw),ref=String(b.policy_reference||'').trim();if(o.kind!=='Accrued Expense'||!financeAvailable||!Number.isInteger(financeId)||financeId<1||!Number.isFinite(amount)||amount<=0||ref.length<8)throw fail(400,'Provide verified Finance payment, amount and approved settlement reference');
  const f=db.prepare('SELECT * FROM finance_entries WHERE id=?').get(financeId),j=db.prepare('SELECT * FROM accounting_journal_entries WHERE finance_entry_id=?').get(financeId);
  if(!eligiblePayment(f,j,o)||!posted(journal(o.recognition_journal_id)))throw fail(409,'Accrual and linked Finance liability payment must be posted, verified, unreversed, same-unit and evidenced');guard(o.business_unit_id,j.transaction_date);
  return db.transaction(()=>{const remaining=expenseState(o).outstanding_accrual_krw,available=paymentCapacity(financeId,o.control_account_id);if(amount>remaining+.005||amount>available+.005)throw fail(409,'Allocation exceeds posted accrual outstanding or unallocated liability debit');const id=Number(db.prepare('INSERT INTO accounting_expense_settlements_v357(obligation_id,finance_entry_id,journal_id,amount_krw,policy_reference,created_by) VALUES(?,?,?,?,?,?)').run(o.id,financeId,j.id,amount,ref.slice(0,250),req.user.id).lastInsertRowid);audit(req.user,'accounting_expense_obligation',o.id,'link-verified-payment',JSON.stringify({settlement_id:id,finance_entry_id:financeId,journal_id:j.id,amount_krw:amount,no_new_cash:true,no_new_journal:true}));return {ok:true,id,finance_entry_id:financeId,journal_id:j.id,remaining_krw:money(remaining-amount),no_new_finance:true,no_new_journal:true};})();
 }));
 app.post('/api/accounting/expense-obligations-v357/reclassify-prepaid',auth,allow('accounting'),(req,res)=>write(req,res,()=>{
  const b=req.body||{},bu=Number(b.business_unit_id||currentUnit(req)),jid=Number(b.source_journal_id),d=String(b.recognition_date||''),ref=String(b.reference||'').trim(),description=String(b.description||'').trim(),policy=String(b.policy_reference||'').trim(),amt=money(b.amount_krw);requireUnit(req,bu);
  if(!validDate(d)||!Number.isFinite(amt)||amt<=0||ref.length<4||description.length<8||policy.length<8)throw fail(400,'Provide existing expense journal, period and approved policy');guard(bu,d);
  const source=journal(jid),expense=account(b.expense_account_id,'Expense'),prepaid=account(b.prepaid_account_id,'Asset');if(!posted(source)||Number(source.business_unit_id)!==bu||source.transaction_date>d)throw fail(409,'Select a posted, unreversed expense journal for the same unit');
  const expenseAmount=money(db.prepare('SELECT COALESCE(SUM(debit_krw-credit_krw),0) amount FROM accounting_journal_lines WHERE journal_entry_id=? AND account_id=?').get(jid,expense.id).amount);if(expenseAmount<=0||Math.abs(expenseAmount-amt)>.005)throw fail(409,'Selected original expense line must equal prepaid amount; partial or multi-component reclassification requires accountant review');
  return db.transaction(()=>{const id=Number(db.prepare("INSERT INTO accounting_expense_obligations_v357(business_unit_id,kind,reference,description,recognition_date,amount_krw,expense_account_id,control_account_id,source_journal_id,recognition_journal_id,policy_reference,created_by) VALUES(?,'Prepaid Expense',?,?,?,?,?,?,?,-1,?,?)").run(bu,ref.slice(0,120),description.slice(0,300),d,amt,expense.id,prepaid.id,jid,policy.slice(0,250),req.user.id).lastInsertRowid);const proposed=accounting.postJournal({businessUnitId:bu,transactionDate:d,sourceType:'Prepaid Expense Reclassification V357',sourceId:id,sourceLabel:ref,description:'Reclassify existing posted expense; no second bank payment',createdBy:req.user.id,lines:[{account_id:prepaid.id,debit_krw:amt,credit_krw:0,dimension_json:{source_journal_id:jid}},{account_id:expense.id,debit_krw:0,credit_krw:amt,dimension_json:{source_journal_id:jid}}]});db.prepare('UPDATE accounting_expense_obligations_v357 SET recognition_journal_id=? WHERE id=?').run(proposed,id);audit(req.user,'accounting_expense_obligation',id,'prepaid-reclassification',JSON.stringify({source_journal_id:jid,journal_id:proposed,no_new_cash:true}));return {ok:true,id,journal_id:proposed,status:'Pending Review',no_cash_movement:true};})();
 }));
 app.post('/api/accounting/expense-obligations-v357/:id/amortize',auth,allow('accounting'),(req,res)=>write(req,res,()=>{
  const o=obligation(req),b=req.body||{},d=String(b.period_end||''),period=d.slice(0,7),amount=money(b.amount_krw),policy=String(b.policy_reference||'').trim();if(o.kind!=='Prepaid Expense'||!validDate(d)||d<o.recognition_date||!Number.isFinite(amount)||amount<=0||policy.length<8)throw fail(400,'Provide prepaid period, amount and approved policy');guard(o.business_unit_id,d);
  if(!posted(journal(o.recognition_journal_id)))throw fail(409,'Prepaid reclassification must be posted before amortization');const state=expenseState(o);if(state.pending_amortization_krw>.005||amount-state.remaining_prepaid_krw>.005)throw fail(409,'Pending amortization or amount above remaining prepaid balance');
  if(db.prepare('SELECT id FROM accounting_expense_amortization_v357 WHERE obligation_id=? AND period=?').get(o.id,period))throw fail(409,'Amortization already exists for this period');
  return db.transaction(()=>{const id=Number(db.prepare('INSERT INTO accounting_expense_amortization_v357(obligation_id,period,amount_krw,journal_id,policy_reference,created_by) VALUES(?,?,?,-1,?,?)').run(o.id,period,amount,policy.slice(0,250),req.user.id).lastInsertRowid);const jid=accounting.postJournal({businessUnitId:o.business_unit_id,transactionDate:d,sourceType:'Prepaid Expense Amortization V357',sourceId:id,sourceLabel:o.reference,description:'Approved cash-neutral prepaid amortization',createdBy:req.user.id,lines:[{account_id:o.expense_account_id,debit_krw:amount,credit_krw:0,dimension_json:{expense_obligation_id:o.id}},{account_id:o.control_account_id,debit_krw:0,credit_krw:amount,dimension_json:{expense_obligation_id:o.id}}]});db.prepare('UPDATE accounting_expense_amortization_v357 SET journal_id=? WHERE id=?').run(jid,id);audit(req.user,'accounting_expense_obligation',o.id,'amortization-proposal',JSON.stringify({journal_id:jid,no_cash:true}));return {ok:true,journal_id:jid,status:'Pending Review',no_cash_movement:true};})();
 }));

}
module.exports={install};
