'use strict';
// V30.56.1: Operational financing register and Finance-linked repayment reconciliation.
// Never invent a Finance movement or bypass Accounting Posting Control.
function install({app,db,auth,allow,currentUnit,enforceUnit,audit,accounting,hasAccess}){
 db.exec(`CREATE TABLE IF NOT EXISTS accounting_financing_v356(
 id INTEGER PRIMARY KEY AUTOINCREMENT,business_unit_id INTEGER NOT NULL,agreement_no TEXT NOT NULL UNIQUE,
 lender TEXT NOT NULL,financing_type TEXT NOT NULL,asset_description TEXT DEFAULT '',currency TEXT NOT NULL,
 opening_principal REAL NOT NULL,annual_rate REAL NOT NULL DEFAULT 0,term_months INTEGER NOT NULL,
 start_date TEXT NOT NULL,payment_day INTEGER NOT NULL,repayment_method TEXT NOT NULL,
 payment_account_id INTEGER,agreement_reference TEXT NOT NULL,notes TEXT DEFAULT '',status TEXT NOT NULL DEFAULT 'Active',
 created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE INDEX IF NOT EXISTS idx_financing_v356_scope ON accounting_financing_v356(business_unit_id,status,id);
 CREATE TABLE IF NOT EXISTS accounting_financing_repayments_v356(
 id INTEGER PRIMARY KEY AUTOINCREMENT,financing_id INTEGER NOT NULL,finance_entry_id INTEGER NOT NULL UNIQUE,
 principal_krw REAL NOT NULL,interest_krw REAL NOT NULL,fee_krw REAL NOT NULL,
 installment_no INTEGER,created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(financing_id) REFERENCES accounting_financing_v356(id));
 CREATE INDEX IF NOT EXISTS idx_financing_repayments_v356_financing ON accounting_financing_repayments_v356(financing_id,id);`);
 // Additive lease agreement attributes and lender-authorized schedule amendments. No automatic GL creation.
 const leaseColumns=[['lease_asset_value_krw','REAL'],['lease_deposit_krw','REAL'],['lease_residual_krw','REAL'],['lease_accounting_policy','TEXT']];
 for(const [name,type] of leaseColumns){if(!db.prepare('PRAGMA table_info(accounting_financing_v356)').all().some(x=>x.name===name))db.exec('ALTER TABLE accounting_financing_v356 ADD COLUMN '+name+' '+type);}
 db.exec(`CREATE TABLE IF NOT EXISTS accounting_financing_amendments_v356(
 id INTEGER PRIMARY KEY AUTOINCREMENT, financing_id INTEGER NOT NULL, effective_installment INTEGER NOT NULL,
 remaining_months INTEGER NOT NULL, annual_rate REAL NOT NULL, revised_principal_krw REAL NOT NULL,
 lender_reference TEXT NOT NULL, reason TEXT NOT NULL, created_by INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(financing_id) REFERENCES accounting_financing_v356(id));
 CREATE UNIQUE INDEX IF NOT EXISTS idx_financing_amendment_effective_v356 ON accounting_financing_amendments_v356(financing_id,effective_installment);
 CREATE INDEX IF NOT EXISTS idx_financing_amendment_parent_v356 ON accounting_financing_amendments_v356(financing_id,id);`);
 const canAdjust=req=>req.user.role==='CEO / Owner'||!!hasAccess?.(req.user.id,'sensitive.accounting_adjustments',Number(currentUnit(req)||0));
 db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_financing_reclassification_unique ON accounting_journal_entries(source_id) WHERE source_type='Financing Repayment Reclassification'");
 // Financing funding uses an existing Finance receipt. Matching is informational until the actual
 // receipt's posted journal can be reclassified into a liability without touching bank/cash twice.
 db.exec(`CREATE TABLE IF NOT EXISTS accounting_financing_funding_v356(
 id INTEGER PRIMARY KEY AUTOINCREMENT, financing_id INTEGER NOT NULL UNIQUE,
 finance_entry_id INTEGER NOT NULL UNIQUE, amount_krw REAL NOT NULL, created_by INTEGER,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(financing_id) REFERENCES accounting_financing_v356(id));
 CREATE UNIQUE INDEX IF NOT EXISTS idx_financing_funding_reclass_unique
 ON accounting_journal_entries(source_id) WHERE source_type='Financing Funding Reclassification';`);
 const round=n=>Math.round((Number(n)+Number.EPSILON)*100)/100;
 const existsTable=name=>!!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
 function leaseCloseState(a){if(a.financing_type!=='Equipment Lease')return null;const records=[...(existsTable('accounting_financing_lease_closure_v356')?db.prepare('SELECT asset_journal_id journal_id FROM accounting_financing_lease_closure_v356 WHERE financing_id=?').all(a.id):[]),...(existsTable('accounting_financing_lease_terminations_v356')?db.prepare('SELECT journal_id FROM accounting_financing_lease_terminations_v356 WHERE financing_id=?').all(a.id):[])];if(!records.length)return null;const journals=records.map(x=>db.prepare('SELECT id,status FROM accounting_journal_entries WHERE id=?').get(x.journal_id));return journals.some(x=>x?.status==='Posted')?'Closed': 'Closure Pending Posting'}
 const iso=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''))&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))?s:'';
 function scope(req){const unit=Number(currentUnit(req)||0);if(!unit||!db.prepare("SELECT id FROM business_units WHERE id=? AND status!='Archived'").get(unit))throw Object.assign(new Error('Select an active business unit first.'),{status:400});return unit;}
 function readable(req,row){return row&&enforceUnit(req,row.business_unit_id)}
 function payments(id){return db.prepare(`SELECT r.*,f.reference,f.transaction_date,f.verification_status,f.accounting_status,f.status finance_status,f.payment_account_id,
 f.krw_amount,f.cash_effect FROM accounting_financing_repayments_v356 r JOIN finance_entries f ON f.id=r.finance_entry_id WHERE r.financing_id=? ORDER BY r.id`).all(id).map(r=>({...r,eligible:r.finance_status!=='Voided'&&r.verification_status==='Verified / Correct'&&Number(r.cash_effect)===-1}));}
 function amendedSchedule(a,amendments){
  let principal=round(a.opening_principal),rate=Number(a.annual_rate)/1200,months=a.term_months;
  const revisions=[...amendments].sort((x,y)=>x.effective_installment-y.effective_installment),rows=[];
  const dueDate=n=>{const y=Number(a.start_date.slice(0,4)),m=Number(a.start_date.slice(5,7))-1+n;const d=new Date(Date.UTC(y,m+1,0)).getUTCDate();return new Date(Date.UTC(y,m,Math.min(a.payment_day,d))).toISOString().slice(0,10)};
  const calculate=(base,r,count,method)=>{const i=r/1200;return i?base*i/(1-Math.pow(1+i,-count)):base/count};
  let segmentPrincipal=principal,segmentMonths=months,annuity=calculate(principal,Number(a.annual_rate),months,a.repayment_method),segmentStart=1;
  const last=Math.max(months,...revisions.map(x=>x.effective_installment+x.remaining_months-1));
  for(let n=1;n<=last;n++){
    const revision=revisions.find(x=>x.effective_installment===n);
    if(revision){principal=round(revision.revised_principal_krw);segmentPrincipal=principal;segmentMonths=revision.remaining_months;segmentStart=n;rate=Number(revision.annual_rate)/1200;annuity=calculate(principal,Number(revision.annual_rate),segmentMonths,a.repayment_method);}
    if(n>segmentStart+segmentMonths-1)break;
    const interest=round(principal*rate),principalDue=n===segmentStart+segmentMonths-1?principal:Math.max(0,Math.min(principal,round(a.repayment_method==='Equal Principal'?segmentPrincipal/segmentMonths:annuity-interest)));
    principal=round(principal-principalDue);
    rows.push({number:n,due_date:dueDate(n),principal_krw:principalDue,interest_krw:interest,total_krw:round(principalDue+interest),remaining_principal_krw:principal,amendment_id:revision?.id||null});
  }
  return rows;
 }
 function amendments(id){return db.prepare('SELECT * FROM accounting_financing_amendments_v356 WHERE financing_id=? ORDER BY effective_installment,id').all(id);}
 function schedule(a){return amendedSchedule(a,amendments(a.id));}

 function funding(a){const item=db.prepare('SELECT x.*,f.reference,f.transaction_date,f.verification_status,f.status finance_status,f.accounting_status FROM accounting_financing_funding_v356 x JOIN finance_entries f ON f.id=x.finance_entry_id WHERE x.financing_id=?').get(a.id);if(!item)return null;return {...item,journal:db.prepare("SELECT id,journal_no,status FROM accounting_journal_entries WHERE source_type='Financing Funding Reclassification' AND source_id=? ORDER BY id DESC LIMIT 1").get(item.id)||null,original_journal:db.prepare('SELECT id,journal_no,status FROM accounting_journal_entries WHERE finance_entry_id=? ORDER BY id DESC LIMIT 1').get(item.finance_entry_id)||null};}
 function publicRow(a){const leaseMods=a.financing_type==='Equipment Lease'&&db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='accounting_financing_lease_modifications_v356'").get()?db.prepare('SELECT delta_krw,journal_id FROM accounting_financing_lease_modifications_v356 WHERE financing_id=?').all(a.id):[];const leaseDelta=round(leaseMods.filter(x=>{const j=db.prepare('SELECT id,status FROM accounting_journal_entries WHERE id=?').get(x.journal_id);return j?.status==='Posted'&&!db.prepare("SELECT id FROM accounting_journal_entries WHERE reversal_of_id=? AND status IN ('Pending Review','Correction Required','Posted') LIMIT 1").get(j.id)}).reduce((n,x)=>n+Number(x.delta_krw),0));const ps=payments(a.id),paid=ps.filter(x=>x.eligible),sum=k=>round(paid.reduce((v,x)=>v+Number(x[k]||0),0));const today=new Date().toISOString().slice(0,10);const scheduled=schedule(a).map(x=>{const matched=paid.filter(p=>Number(p.installment_no)===x.number),principalPaid=round(matched.reduce((v,p)=>v+Number(p.principal_krw),0)),interestPaid=round(matched.reduce((v,p)=>v+Number(p.interest_krw),0));const remaining=round(Math.max(0,x.principal_krw-principalPaid)+Math.max(0,x.interest_krw-interestPaid));return {...x,paid_principal_krw:principalPaid,paid_interest_krw:interestPaid,remaining_due_krw:remaining,payment_status:remaining<=.005?'Paid':matched.length?'Partially Paid':x.due_date<today?'Overdue':'Scheduled'};});return {...a,effective_status:leaseCloseState(a)||a.status,principal_paid_krw:sum('principal_krw'),interest_paid_krw:sum('interest_krw'),fee_paid_krw:sum('fee_krw'),outstanding_principal_krw:round(Math.max(0,a.opening_principal+leaseDelta-sum('principal_krw'))),posted_lease_modification_delta_krw:leaseDelta,overdue_estimate_krw:round(scheduled.filter(x=>x.due_date<today).reduce((v,x)=>v+x.remaining_due_krw,0)),funding:funding(a),repayments:ps.map(r=>({...r,journal:db.prepare("SELECT id,journal_no,status FROM accounting_journal_entries WHERE source_type='Financing Repayment Reclassification' AND source_id=? ORDER BY id DESC LIMIT 1").get(r.id)||null,original_journal:db.prepare('SELECT id,journal_no,status FROM accounting_journal_entries WHERE finance_entry_id=? ORDER BY id DESC LIMIT 1').get(r.finance_entry_id)||null})),schedule:scheduled,amendments:amendments(a.id),lease_accounting_basis:a.financing_type==='Equipment Lease'?'Lease contract register only: asset/right-of-use measurement, liability, depreciation and deposit require Accounting approval; no automatic journal.':null,balance_basis:'Operational financing register; not the posted GL liability',accounting_reconciliation_required:true};}
 app.get('/api/accounting/financing-v356',auth,allow('accounting'),(req,res)=>{try{const unit=scope(req);const rows=db.prepare('SELECT * FROM accounting_financing_v356 WHERE business_unit_id=? ORDER BY id DESC LIMIT 100').all(unit).filter(r=>readable(req,r)).map(publicRow);res.json({rows,summary:{outstanding_principal_krw:round(rows.reduce((s,r)=>s+r.outstanding_principal_krw,0)),active:rows.filter(r=>r.status==='Active').length},accounting_basis:'Operational; compare against posted loan and lease liability ledger.'});}catch(e){res.status(e.status||500).json({error:e.message})}});
 app.get('/api/accounting/financing-v356/:id',auth,allow('accounting'),(req,res)=>{const row=db.prepare('SELECT * FROM accounting_financing_v356 WHERE id=?').get(req.params.id);if(!readable(req,row))return res.status(404).json({error:'Financing agreement not found'});res.json(publicRow(row))});
 app.post('/api/accounting/financing-v356',auth,allow('accounting'),(req,res)=>{try{
 const bu=scope(req),b=req.body||{},amount=Number(b.opening_principal),rate=Number(b.annual_rate),months=Number(b.term_months),date=iso(b.start_date),day=Number(b.payment_day||date.slice(8)),type=String(b.financing_type||''),method=String(b.repayment_method||'');
 if(!['Bank Loan','Equipment Lease','Other Financing'].includes(type)||!String(b.lender||'').trim()||!String(b.agreement_reference||'').trim()||!date||!Number.isFinite(amount)||amount<=0||amount>1e12||!Number.isFinite(rate)||rate<0||rate>100||!Number.isInteger(months)||months<1||months>600||!Number.isInteger(day)||day<1||day>31||!['Equal Installments','Equal Principal'].includes(method))return res.status(400).json({error:'Complete a valid lender, agreement reference, opening principal, rate, term, start date, payment day and repayment method.'});
 const currency=String(b.currency||'KRW').trim().toUpperCase();if(currency!=='KRW')return res.status(400).json({error:'This stage supports KRW-denominated financing only. Foreign-currency financing requires FX-aware ledger integration.'});
 const account=b.payment_account_id?db.prepare('SELECT * FROM accounting_payment_accounts WHERE id=? AND active=1').get(Number(b.payment_account_id)):null;
 if(b.payment_account_id&&(!account||account.currency!=='KRW'||(account.business_unit_id&&Number(account.business_unit_id)!==bu)))return res.status(400).json({error:'Select an eligible active KRW company payment account.'});
 const leaseValues=['lease_asset_value_krw','lease_deposit_krw','lease_residual_krw'].map(k=>Number(b[k]||0));
 if(type==='Equipment Lease'&&leaseValues.some(v=>!Number.isFinite(v)||v<0||v>1e12))return res.status(400).json({error:'Invalid lease value, refundable deposit or residual amount.'});
 const agreement=String(b.agreement_reference).trim().slice(0,120);if(db.prepare('SELECT id FROM accounting_financing_v356 WHERE business_unit_id=? AND agreement_reference=?').get(bu,agreement))return res.status(409).json({error:'Agreement reference already exists in this business unit.'});
 const result=db.prepare(`INSERT INTO accounting_financing_v356(business_unit_id,agreement_no,lender,financing_type,asset_description,currency,opening_principal,annual_rate,term_months,start_date,payment_day,repayment_method,payment_account_id,agreement_reference,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(bu,'FIN-'+bu+'-'+require('crypto').randomBytes(6).toString('hex').toUpperCase(),String(b.lender).trim().slice(0,160),type,String(b.asset_description||'').slice(0,250),currency,round(amount),rate,months,date,day,method,account?.id||null,agreement,String(b.notes||'').slice(0,1000),req.user.id);
 audit(req.user,'accounting_financing',Number(result.lastInsertRowid),'create',JSON.stringify({business_unit_id:bu,agreement_reference:agreement,opening_principal:round(amount),ledger_posted:false}));if(type==='Equipment Lease'){
   db.prepare('UPDATE accounting_financing_v356 SET lease_asset_value_krw=?,lease_deposit_krw=?,lease_residual_krw=?,lease_accounting_policy=? WHERE id=?').run(...leaseValues,String(b.lease_accounting_policy||'Accountant review required').slice(0,160),Number(result.lastInsertRowid));
 }
 res.status(201).json({ok:true,id:Number(result.lastInsertRowid),message:'Financing register created. No Finance receipt or accounting journal has been generated.'});
 }catch(e){res.status(e.status||500).json({error:e.message})}});
 app.post('/api/accounting/financing-v356/:id/match-repayment',auth,allow('accounting'),(req,res)=>{try{
 const a=db.prepare('SELECT * FROM accounting_financing_v356 WHERE id=?').get(req.params.id);if(!readable(req,a))return res.status(404).json({error:'Financing agreement not found'});if(a.status!=='Active'||leaseCloseState(a))return res.status(409).json({error:'Financing agreement is inactive or has a closure/termination proposal.'});
 const b=req.body||{},financeId=Number(b.finance_entry_id),principal=Number(b.principal_krw),interest=Number(b.interest_krw||0),fee=Number(b.fee_krw||0),installment=Number(b.installment_no||0);
 if(!Number.isInteger(financeId)||financeId<1||![principal,interest,fee].every(x=>Number.isFinite(x)&&x>=0)||principal+interest+fee<=0||![principal,interest,fee].every(x=>Math.abs(round(x)-x)<0.001)||!Number.isInteger(installment)||installment<0||installment>Math.max(...schedule(a).map(x=>x.number)))return res.status(400).json({error:'Provide an existing Finance payment and valid principal/interest/fee allocation.'});
 const f=db.prepare('SELECT * FROM finance_entries WHERE id=?').get(financeId);
 if(!f||Number(f.business_unit_id)!==Number(a.business_unit_id)||f.verification_status!=='Verified / Correct'||f.status==='Voided'||Number(f.cash_effect)!==-1||Number(f.payment_account_id)!==Number(a.payment_account_id)||!a.payment_account_id)return res.status(409).json({error:'Payment must be an eligible verified outgoing Finance record from the financing company account and same business unit.'});
 if(db.prepare('SELECT id FROM accounting_financing_repayments_v356 WHERE finance_entry_id=?').get(financeId))return res.status(409).json({error:'This Finance payment is already matched to a financing agreement.'});
 if(!(Number(f.krw_amount||f.amount)>0)||Math.abs(round(principal+interest+fee)-round(f.krw_amount||f.amount))>0.005)return res.status(400).json({error:'Allocation must equal the verified Finance payment amount.'});
 const futureRevision=amendments(a.id).find(x=>installment&&installment<x.effective_installment);if(futureRevision)return res.status(409).json({error:'Historical repayment allocation is locked by an approved schedule revision; use controlled correction.'});
 const p=publicRow(a);if(round(principal)>p.outstanding_principal_krw+0.005)return res.status(400).json({error:'Principal exceeds the remaining financing balance.'});
 const id=db.transaction(()=>{const r=db.prepare('INSERT INTO accounting_financing_repayments_v356(financing_id,finance_entry_id,principal_krw,interest_krw,fee_krw,installment_no,created_by) VALUES(?,?,?,?,?,?,?)').run(a.id,financeId,round(principal),round(interest),round(fee),installment||null,req.user.id);audit(req.user,'accounting_financing_repayment',Number(r.lastInsertRowid),'match-existing-finance',JSON.stringify({financing_id:a.id,finance_entry_id:financeId,ledger_posted:false}));return Number(r.lastInsertRowid)})();
 res.status(201).json({ok:true,id,finance_entry_id:financeId,accounting_reconciliation_required:true,message:'Existing verified payment matched. No additional Finance or GL cash entry was created.'});
 }catch(e){res.status(e.status||500).json({error:e.code==='SQLITE_CONSTRAINT_UNIQUE'?'Finance payment is already matched.':e.message})}});
 // Adjustment only reclassifies an already-posted Finance journal. It NEVER moves cash twice.
 app.get('/api/accounting/financing-v356/accounts',auth,allow('accounting'),(req,res)=>{try{scope(req);res.json(db.prepare("SELECT id,code,name,account_type,active FROM accounting_accounts WHERE active=1 AND account_type IN ('Liability','Expense') ORDER BY code").all());}catch(e){res.status(e.status||500).json({error:e.message})}});
 app.get('/api/accounting/financing-v356/:id/repayment/:repaymentId/reclassification',auth,allow('accounting'),(req,res)=>{try{
   const a=db.prepare('SELECT * FROM accounting_financing_v356 WHERE id=?').get(req.params.id);
   if(!readable(req,a))return res.status(404).json({error:'Agreement not found.'});
   const r=db.prepare('SELECT * FROM accounting_financing_repayments_v356 WHERE id=? AND financing_id=?').get(req.params.repaymentId,a.id);
   if(!r)return res.status(404).json({error:'Repayment not found.'});
   const journal=db.prepare('SELECT id,journal_no,status FROM accounting_journal_entries WHERE source_type=? AND source_id=? ORDER BY id DESC LIMIT 1').get('Financing Repayment Reclassification',r.id);
   const original=db.prepare('SELECT id,journal_no,status FROM accounting_journal_entries WHERE finance_entry_id=? ORDER BY id DESC LIMIT 1').get(r.finance_entry_id);
   res.json({repayment:r,original_journal:original||null,reclassification:journal||null});
 }catch(e){res.status(500).json({error:e.message})}});
 app.post('/api/accounting/financing-v356/:id/repayment/:repaymentId/prepare-reclassification',auth,allow('accounting'),(req,res)=>{try{
   if(!canAdjust(req))return res.status(403).json({error:'Accounting adjustment authority is required.'});
   const a=db.prepare('SELECT * FROM accounting_financing_v356 WHERE id=?').get(req.params.id);
   if(!readable(req,a))return res.status(404).json({error:'Agreement not found.'});
   const r=db.prepare('SELECT * FROM accounting_financing_repayments_v356 WHERE id=? AND financing_id=?').get(req.params.repaymentId,a.id);
   if(!r)return res.status(404).json({error:'Repayment not found.'});
   const old=db.prepare("SELECT id,journal_no,status FROM accounting_journal_entries WHERE source_type='Financing Repayment Reclassification' AND source_id=? ORDER BY id DESC LIMIT 1").get(r.id);
   if(old)return res.status(409).json({error:'A reclassification already exists; review it in Posting Control.',journal:old});
   const f=db.prepare('SELECT * FROM finance_entries WHERE id=?').get(r.finance_entry_id);
   if(!f||f.status==='Voided'||f.verification_status!=='Verified / Correct'||Number(f.cash_effect)!==-1||Number(f.business_unit_id)!==Number(a.business_unit_id)||Number(f.payment_account_id)!==Number(a.payment_account_id))return res.status(409).json({error:'Original Finance payment is not currently verified and eligible.'});
   const original=db.prepare("SELECT * FROM accounting_journal_entries WHERE finance_entry_id=? AND status='Posted' ORDER BY id DESC LIMIT 1").get(f.id);
   if(!original||Number(f.accounting_journal_id)!==Number(original.id)||f.accounting_status!=='Posted'||db.prepare("SELECT id FROM accounting_journal_entries WHERE reversal_of_id=? AND status IN ('Pending Review','Correction Required','Posted') LIMIT 1").get(original?.id||0))return res.status(409).json({error:'First complete the original Finance journal and any pending reversal/correction in Posting Control.'});
   const lines=db.prepare('SELECT * FROM accounting_journal_lines WHERE journal_entry_id=?').all(original.id);
   const bank=db.prepare('SELECT ledger_account_id FROM accounting_payment_accounts WHERE id=?').get(a.payment_account_id);
   const total=round(Number(r.principal_krw)+Number(r.interest_krw)+Number(r.fee_krw));
   // Fail closed on complex, already-split, or differently classified underlying journals.
   const bankCredits=lines.filter(l=>Number(l.account_id)===Number(bank?.ledger_account_id)&&Number(l.credit_krw)>0);
   const debits=lines.filter(l=>Number(l.debit_krw)>0.005);
   if(bankCredits.length!==1||Math.abs(round(bankCredits[0].credit_krw)-total)>.005||debits.length!==1||Math.abs(round(debits[0].debit_krw)-total)>.005||lines.some(l=>Number(l.credit_krw)>.005&&l!==bankCredits[0]))return res.status(409).json({error:'Original journal is not a single-expense/single-bank payment. Use controlled Accounting correction; no automatic reclassification was created.'});
   const originalAccount=db.prepare('SELECT * FROM accounting_accounts WHERE id=?').get(debits[0].account_id);
   if(originalAccount?.account_type!=='Expense')return res.status(409).json({error:'Original Finance journal is not a single expense. Review existing classification; no reclassification created.'});
   const ids=[Number(req.body?.liability_account_id),Number(req.body?.interest_account_id),Number(req.body?.fee_account_id)];
   if(!Number.isInteger(ids[0])||ids[0]<=0||[1,2].some(i=>Number.isNaN(ids[i])))return res.status(400).json({error:'Select financing liability, interest and fee accounts.'});
   const [liability,interest,fee]=ids.map(id=>db.prepare('SELECT * FROM accounting_accounts WHERE id=? AND active=1').get(id));
   if(!liability||liability.account_type!=='Liability'||Number(liability.id)===Number(bank.ledger_account_id)||Number(liability.id)===Number(originalAccount.id))return res.status(400).json({error:'Choose an active financing liability account (not the bank or original expense).'});
   if(Number(r.interest_krw)>0&&(!interest||interest.account_type!=='Expense'))return res.status(400).json({error:'Choose an active interest expense account.'});
   if(Number(r.fee_krw)>0&&(!fee||fee.account_type!=='Expense'))return res.status(400).json({error:'Choose an active fee expense account.'});
   if(accounting?.isPeriodClosed?.(a.business_unit_id,String(f.transaction_date||'').slice(0,10)))return res.status(409).json({error:'Payment period is closed. Use the authorized period adjustment workflow.'});
   // Reclassification is an adjustment to expense/liability only; no bank line, no Finance row.
   const correction=[{account_id:originalAccount.id,debit_krw:0,credit_krw:total,memo:'Reverse original generic expense classification; Finance #'+f.id}];
   if(Number(r.principal_krw)>0)correction.push({account_id:liability.id,debit_krw:round(r.principal_krw),credit_krw:0,memo:'Loan principal · '+a.agreement_no});
   if(Number(r.interest_krw)>0)correction.push({account_id:interest.id,debit_krw:round(r.interest_krw),credit_krw:0,memo:'Financing interest · '+a.agreement_no});
   if(Number(r.fee_krw)>0)correction.push({account_id:fee.id,debit_krw:round(r.fee_krw),credit_krw:0,memo:'Financing fee · '+a.agreement_no});
   if(!accounting?.postJournal)throw new Error('Accounting posting engine is unavailable.');
   const jid=db.transaction(()=>{
     const duplicate=db.prepare("SELECT id FROM accounting_journal_entries WHERE source_type='Financing Repayment Reclassification' AND source_id=?").get(r.id);
     if(duplicate)throw new Error('Repayment already has a reclassification proposal.');
     const id=accounting.postJournal({businessUnitId:a.business_unit_id,transactionDate:String(f.transaction_date||'').slice(0,10),sourceType:'Financing Repayment Reclassification',sourceId:r.id,sourceLabel:a.agreement_no+' · Finance #'+f.id,description:'Reclassify the original posted payment expense into financing principal, interest and fees; no new bank entry.',createdBy:req.user.id,lines:correction});
     audit(req.user,'accounting_financing_repayment',r.id,'prepare-reclassification',JSON.stringify({financing_id:a.id,finance_entry_id:f.id,original_journal_id:original.id,proposal_id:id,original_expense_account_id:originalAccount.id,liability_account_id:liability.id,interest_account_id:interest?.id||null,fee_account_id:fee?.id||null}));return id;
   })();
   res.status(201).json({ok:true,journal_id:jid,status:'Pending Review',message:'Cash-neutral reclassification proposal created. Authorized reviewer must post it in Accounting Posting Control.'});
 }catch(e){res.status(409).json({error:e.message})}});
 // Agreement-scoped posted-journal reconciliation; never pretend a shared liability COA balance is one loan.
 app.get('/api/accounting/financing-v356/:id/reconciliation',auth,allow('accounting'),(req,res)=>{try{
  const a=db.prepare('SELECT * FROM accounting_financing_v356 WHERE id=?').get(req.params.id);
  if(!readable(req,a))return res.status(404).json({error:'Agreement not found.'});
  const row=publicRow(a),sources=[];
  if(row.funding){const j=row.funding.journal;sources.push({kind:'Funding',finance_entry_id:row.funding.finance_entry_id,source_id:row.funding.id,journal:j||null,posted:j?.status==='Posted'});}
  for(const r of row.repayments)sources.push({kind:'Repayment',finance_entry_id:r.finance_entry_id,source_id:r.id,journal:r.journal||null,posted:r.journal?.status==='Posted',eligible:r.eligible});
  const pending=sources.filter(x=>x.eligible!==false&&!x.posted);
  // A shared liability GL can contain multiple loans. Only linked posting records are shown here.
  const postedFunding=sources.filter(x=>x.kind==='Funding'&&x.posted).length,postedRepayments=sources.filter(x=>x.kind==='Repayment'&&x.posted).length;
  res.json({agreement_no:a.agreement_no,operational_outstanding_principal_krw:row.outstanding_principal_krw,posted_funding_count:postedFunding,posted_repayment_count:postedRepayments,pending_or_unclassified_count:pending.length,source_journals:sources,official_gl_reconciled:false,basis:'Source-linked posted journal check only. It is NOT a certified agreement-specific GL liability balance; opening migration, already-correct journals, reversals and shared liability accounts require accountant signoff.'});
 }catch(e){res.status(500).json({error:e.message})}});
 // Lender-approved schedule recast: only changes future operational estimates. Never changes existing Finance or posted journals.
 app.post('/api/accounting/financing-v356/:id/amend-schedule',auth,allow('accounting'),(req,res)=>{try{
  if(!canAdjust(req))return res.status(403).json({error:'Accounting adjustment authority is required.'});
  const a=db.prepare('SELECT * FROM accounting_financing_v356 WHERE id=?').get(req.params.id);
  if(!readable(req,a))return res.status(404).json({error:'Agreement not found.'});
  if(a.status!=='Active'||a.currency!=='KRW'||leaseCloseState(a))return res.status(409).json({error:'Only active, unterminated KRW agreements support an approved schedule recast.'});
  const b=req.body||{},effective=Number(b.effective_installment),months=Number(b.remaining_months),rate=Number(b.annual_rate);
  const lender=String(b.lender_reference||'').trim(),reason=String(b.reason||'').trim();
  if(!Number.isSafeInteger(effective)||effective<1||effective>600||!Number.isSafeInteger(months)||months<1||months>600||effective+months>601||!Number.isFinite(rate)||rate<0||rate>100||lender.length<3||reason.length<5)return res.status(400).json({error:'Provide a valid future installment, revised months/rate, lender approval reference and reason.'});
  const past=amendments(a.id);if(past.length&&effective<=past[past.length-1].effective_installment)return res.status(409).json({error:'Amendments must be chronological and cannot overwrite earlier approved schedules.'});
  const existingSchedule=schedule(a);if(effective>existingSchedule[existingSchedule.length-1].number+1)return res.status(400).json({error:'Effective installment must follow the existing schedule.'});
  const current=publicRow(a),future=current.repayments.filter(x=>x.eligible&&(!x.installment_no||Number(x.installment_no)>=effective));
  if(future.length)return res.status(409).json({error:'Existing allocations on or after the effective installment (or without installment number) require controlled review before rescheduling.'});
  const latestPast=current.repayments.filter(x=>x.eligible&&Number(x.installment_no)<effective),principalPaid=round(latestPast.reduce((v,x)=>v+Number(x.principal_krw),0));
  const actual=round(a.opening_principal+Number(current.posted_lease_modification_delta_krw||0)-principalPaid);
  if(actual<0||Math.abs(actual-current.outstanding_principal_krw)>.005)return res.status(409).json({error:'Outstanding principal cannot be reconciled to eligible Finance repayments.'});
  if(actual<=0)return res.status(409).json({error:'Loan has no outstanding principal.'});
  const revised=Number(b.revised_principal_krw);
  if(!Number.isFinite(revised)||Math.abs(round(revised)-actual)>.005)return res.status(400).json({error:'Revised principal must equal the verified outstanding operational principal; record an actual prepayment in Finance first.'});
  const value=db.transaction(()=>{
   if(db.prepare('SELECT id FROM accounting_financing_amendments_v356 WHERE financing_id=? AND effective_installment=?').get(a.id,effective))throw Object.assign(new Error('Schedule revision already exists for this installment.'),{status:409});
   const r=db.prepare('INSERT INTO accounting_financing_amendments_v356(financing_id,effective_installment,remaining_months,annual_rate,revised_principal_krw,lender_reference,reason,created_by) VALUES(?,?,?,?,?,?,?,?)').run(a.id,effective,months,rate,actual,lender.slice(0,120),reason.slice(0,500),req.user.id);
   audit(req.user,'accounting_financing',a.id,'approved-schedule-amendment',JSON.stringify({amendment_id:Number(r.lastInsertRowid),effective_installment:effective,remaining_months:months,rate,revised_principal_krw:actual,lender_reference:lender,no_cash_or_gl_created:true}));return Number(r.lastInsertRowid);
  })();
  res.status(201).json({ok:true,id:value,message:'Future estimated schedule revised. Historical installments, Finance receipts/payments and posted journals are unchanged.'});
 }catch(e){res.status(e.status||500).json({error:e.message})}});
 // Read-only lender statement: includes original Finance and journal links, and actual vs estimated schedule.
 app.get('/api/accounting/financing-v356/:id/statement',auth,allow('accounting'),(req,res)=>{try{
   const a=db.prepare('SELECT * FROM accounting_financing_v356 WHERE id=?').get(req.params.id);
   if(!readable(req,a))return res.status(404).json({error:'Financing agreement not found.'});
   const row=publicRow(a),paid=row.repayments.filter(x=>x.eligible),totals={principal_krw:round(paid.reduce((v,x)=>v+Number(x.principal_krw),0)),interest_krw:round(paid.reduce((v,x)=>v+Number(x.interest_krw),0)),fee_krw:round(paid.reduce((v,x)=>v+Number(x.fee_krw),0))};
   res.json({agreement:{id:a.id,agreement_no:a.agreement_no,agreement_reference:a.agreement_reference,lender:a.lender,financing_type:a.financing_type,currency:a.currency,start_date:a.start_date,opening_principal_krw:a.opening_principal,annual_rate:a.annual_rate,term_months:a.term_months},funding:row.funding,repayments:row.repayments,estimate:row.schedule,amendments:row.amendments,lease:{asset_value_krw:a.lease_asset_value_krw||0,deposit_krw:a.lease_deposit_krw||0,residual_krw:a.lease_residual_krw||0,policy:a.lease_accounting_policy||'',accounting_basis:row.lease_accounting_basis},totals,outstanding_principal_krw:row.outstanding_principal_krw,basis:'Operational register, not an official lender or posted GL statement. Only eligible verified Finance repayments reduce operational principal.'});
 }catch(e){res.status(500).json({error:e.message})}});
 // A financing disbursement is matched to ONE already-existing verified receipt; NO new Finance row.
 app.post('/api/accounting/financing-v356/:id/match-funding',auth,allow('accounting'),(req,res)=>{try{
   if(!canAdjust(req))return res.status(403).json({error:'Accounting adjustment authority is required.'});
   const a=db.prepare('SELECT * FROM accounting_financing_v356 WHERE id=?').get(req.params.id);
   if(!readable(req,a))return res.status(404).json({error:'Financing agreement not found.'});
   if(a.status!=='Active'||a.currency!=='KRW'||!a.payment_account_id||leaseCloseState(a))return res.status(409).json({error:'An active, unterminated KRW agreement and company account are required.'});
   const fid=Number(req.body?.finance_entry_id);
   if(!Number.isSafeInteger(fid)||fid<1)return res.status(400).json({error:'Select an existing Finance receipt.'});
   const f=db.prepare('SELECT * FROM finance_entries WHERE id=?').get(fid);
   if(!f||f.status==='Voided'||f.verification_status!=='Verified / Correct'||Number(f.cash_effect)!==1||Number(f.business_unit_id)!==Number(a.business_unit_id)||Number(f.payment_account_id)!==Number(a.payment_account_id)||Math.abs(round(f.krw_amount||f.amount)-round(a.opening_principal))>.005)return res.status(409).json({error:'Funding receipt must be a verified incoming KRW Finance record for this agreement amount, BU and company account.'});
   if(String(f.reference||'').trim().toLowerCase()!==String(a.agreement_reference||'').trim().toLowerCase()||String(f.original_currency||'KRW').toUpperCase()!=='KRW'||(f.source_type&&!['Manual','Manual Finance','Financing','Loan Disbursement'].includes(String(f.source_type))))return res.status(409).json({error:'Funding Finance reference must match this financing agreement, currency must be KRW and the receipt must not be linked to an unrelated operational sale, advance or other business event.'});
   if(db.prepare('SELECT id FROM accounting_financing_funding_v356 WHERE financing_id=? OR finance_entry_id=?').get(a.id,fid))return res.status(409).json({error:'Agreement or Finance receipt is already linked to funding.'});
   const id=db.transaction(()=>{const x=db.prepare('INSERT INTO accounting_financing_funding_v356(financing_id,finance_entry_id,amount_krw,created_by) VALUES(?,?,?,?)').run(a.id,fid,round(a.opening_principal),req.user.id);audit(req.user,'accounting_financing',a.id,'match-existing-funding',JSON.stringify({finance_entry_id:fid,no_cash_created:true}));return Number(x.lastInsertRowid)})();
   res.status(201).json({ok:true,id,message:'Existing verified receipt linked. No new Finance receipt or bank journal was generated. Review liability recognition in Posting Control.'});
 }catch(e){res.status(e.code==='SQLITE_CONSTRAINT_UNIQUE'?409:500).json({error:e.code==='SQLITE_CONSTRAINT_UNIQUE'?'Receipt is already linked.':e.message})}});
 // Only reclassify a posted two-line bank/income receipt; never post a second bank debit.
 app.post('/api/accounting/financing-v356/:id/prepare-funding-reclassification',auth,allow('accounting'),(req,res)=>{try{
   if(!canAdjust(req))return res.status(403).json({error:'Accounting adjustment authority is required.'});
   const a=db.prepare('SELECT * FROM accounting_financing_v356 WHERE id=?').get(req.params.id);
   if(!readable(req,a))return res.status(404).json({error:'Agreement not found.'});
   const x=db.prepare('SELECT * FROM accounting_financing_funding_v356 WHERE financing_id=?').get(a.id);
   if(!x)return res.status(404).json({error:'Match a verified funding receipt first.'});
   const old=db.prepare("SELECT id,status FROM accounting_journal_entries WHERE source_type='Financing Funding Reclassification' AND source_id=?").get(x.id);
   if(old)return res.status(409).json({error:'Funding recognition proposal already exists.',journal:old});
   const f=db.prepare('SELECT * FROM finance_entries WHERE id=?').get(x.finance_entry_id);
   const original=f&&db.prepare("SELECT * FROM accounting_journal_entries WHERE finance_entry_id=? AND status='Posted' ORDER BY id DESC LIMIT 1").get(f.id);
   if(String(f?.reference||'').trim().toLowerCase()!==String(a.agreement_reference||'').trim().toLowerCase()||String(f?.original_currency||'KRW').toUpperCase()!=='KRW')return res.status(409).json({error:'Financing reference/currency has changed; do not reclassify.'});
   if(!f||f.status==='Voided'||f.verification_status!=='Verified / Correct'||Number(f.cash_effect)!==1||Number(f.business_unit_id)!==Number(a.business_unit_id)||Number(f.payment_account_id)!==Number(a.payment_account_id)||!original||f.accounting_status!=='Posted'||Number(f.accounting_journal_id)!==Number(original.id)||db.prepare("SELECT id FROM accounting_journal_entries WHERE reversal_of_id=? AND status IN ('Pending Review','Correction Required','Posted') LIMIT 1").get(original?.id||0))return res.status(409).json({error:'Funding receipt/original posted journal is not eligible; use controlled correction.'});
   const bank=db.prepare('SELECT ledger_account_id FROM accounting_payment_accounts WHERE id=?').get(a.payment_account_id);
   const lines=db.prepare('SELECT * FROM accounting_journal_lines WHERE journal_entry_id=?').all(original.id),amount=round(x.amount_krw);
   const bankDebit=lines.filter(l=>Number(l.account_id)===Number(bank?.ledger_account_id)&&Number(l.debit_krw)>.005),credits=lines.filter(l=>Number(l.credit_krw)>.005);
   if(lines.length!==2||bankDebit.length!==1||credits.length!==1||Math.abs(round(bankDebit[0].debit_krw)-amount)>.005||Math.abs(round(credits[0].credit_krw)-amount)>.005)return res.status(409).json({error:'Original funding is not a single-bank/single-income journal; use controlled correction.'});
   const income=db.prepare('SELECT * FROM accounting_accounts WHERE id=?').get(credits[0].account_id);
   const liability=db.prepare('SELECT * FROM accounting_accounts WHERE id=? AND active=1').get(Number(req.body?.liability_account_id));
   if(income?.account_type!=='Revenue'||!liability||liability.account_type!=='Liability'||liability.id===income.id)return res.status(409).json({error:'Original receipt must be classified as revenue and target must be an active liability; otherwise use controlled review.'});
   if(accounting?.isPeriodClosed?.(a.business_unit_id,String(f.transaction_date||'').slice(0,10)))return res.status(409).json({error:'Closed period; use authorized adjustment workflow.'});
   if(!accounting?.postJournal)throw new Error('Accounting engine unavailable.');
   const jid=db.transaction(()=>{if(db.prepare("SELECT id FROM accounting_journal_entries WHERE source_type='Financing Funding Reclassification' AND source_id=?").get(x.id))throw new Error('Funding proposal exists.');const id=accounting.postJournal({businessUnitId:a.business_unit_id,transactionDate:String(f.transaction_date||'').slice(0,10),sourceType:'Financing Funding Reclassification',sourceId:x.id,sourceLabel:a.agreement_no+' · Finance #'+f.id,description:'Reclassify verified funding from generic revenue to loan liability; no second bank movement.',createdBy:req.user.id,lines:[{account_id:income.id,debit_krw:amount,credit_krw:0,memo:'Reverse original funding income classification'},{account_id:liability.id,debit_krw:0,credit_krw:amount,memo:'Recognize loan liability · '+a.agreement_no}]});audit(req.user,'accounting_financing',a.id,'prepare-funding-reclassification',JSON.stringify({finance_entry_id:f.id,original_journal_id:original.id,proposal_id:id}));return id})();
   res.status(201).json({ok:true,journal_id:jid,status:'Pending Review',message:'Cash-neutral financing liability proposal created for Accounting Posting Control.'});
 }catch(e){res.status(409).json({error:e.message})}});
 return {schedule};
}
module.exports={install};
