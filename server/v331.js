'use strict';

// Blue Ocean Market V30.31.0
// Finance/Accounting lifecycle integrity, source-aware correction resubmission,
// stage-driven void/reversal policy, impact review, and immutable audit history.

const VERSION='30.31.0';

function install(ctx={}){
  const {
    app,db,auth,allow,audit,notify,upload,currentUnit,enforceUnit,access,accounting,
    maybeCreateApproval,stopForApproval,markApprovalExecuted,executeApprovedAction,
    applyFinanceCorrection,financeCorrectionForm,financeCorrectionHistory,
    financeLinkedEvidence,financeSourceDetail
  }=ctx;
  if(!app||!db)throw new Error('V30.31 requires app and db');

  const text=v=>String(v??'').trim();
  const num=v=>Number(v||0)||0;
  const safeJson=(v,fallback={})=>{try{return JSON.parse(v||'')}catch(_){return fallback}};
  const canRequestLifecycle=(req,bu)=>!!req?.user&&(req.user.role==='CEO / Owner'||req.user.role==='Finance / Admin'||req.user.role==='Finance Head'||!!access?.canAction?.(req.user.id,'finance','verify',bu)||!!access?.canAction?.(req.user.id,'finance','approve',bu)||!!access?.canAction?.(req.user.id,'finance','delete',bu));
  const canRequestSourceLifecycle=(req,bu)=>canRequestLifecycle(req,bu)||['Operations Manager','Business Unit Manager'].includes(req?.user?.role)||['purchases','sales','inventory'].some(m=>!!access?.canAction?.(req.user.id,m,'delete',bu)||!!access?.canAction?.(req.user.id,m,'edit',bu));
  const cols=t=>{try{return new Set(db.prepare(`PRAGMA table_info(${t})`).all().map(x=>x.name))}catch(_){return new Set()}};
  const addColumn=(t,c,d)=>{try{if(!cols(t).has(c))db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${d}`)}catch(e){console.error(`V30.31 migration ${t}.${c}:`,e.message)}};

  // Additive-only audit structures. No historic record is rewritten or removed.
  db.exec(`
    CREATE TABLE IF NOT EXISTS lifecycle_action_history_v331(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_unit_id INTEGER,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      stage_before TEXT DEFAULT '',
      status TEXT DEFAULT 'Requested',
      reason TEXT DEFAULT '',
      impact_json TEXT DEFAULT '[]',
      source_snapshot_json TEXT DEFAULT '{}',
      result_json TEXT DEFAULT '{}',
      requested_by INTEGER,
      approved_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_lifecycle_action_entity_v331 ON lifecycle_action_history_v331(entity_type,entity_id,id);
    CREATE INDEX IF NOT EXISTS idx_lifecycle_action_status_v331 ON lifecycle_action_history_v331(status,business_unit_id,id);
  `);
  addColumn('excavator_transactions','void_reason',"TEXT DEFAULT ''");
  addColumn('excavator_transactions','voided_by','INTEGER');
  addColumn('excavator_transactions','voided_at','TEXT');

  function latestJournal(finance){
    if(!finance)return null;
    let j=null;
    if(finance.accounting_journal_id){try{j=db.prepare('SELECT * FROM accounting_journal_entries WHERE id=?').get(finance.accounting_journal_id)}catch(_){}}
    if(!j){try{j=db.prepare('SELECT * FROM accounting_journal_entries WHERE finance_entry_id=? ORDER BY id DESC LIMIT 1').get(finance.id)}catch(_){}}
    return j||null;
  }
  function financeStage(f,j){
    if(!f)return 'Missing';
    if(text(f.status)==='Voided')return 'Voided';
    if(j?.status==='Posted')return 'Accounting Posted';
    if(['Pending Review','Correction Required'].includes(text(j?.status)))return 'Accounting Pending';
    if(['Verified / Correct','Verified'].includes(text(f.verification_status)))return 'Finance Verified';
    if(text(f.verification_status)==='Correction Required')return 'Correction Required';
    if(text(f.verification_status)==='Resubmitted')return 'Resubmitted / Awaiting Finance';
    return 'Pending Finance Verification';
  }
  function periodClosed(j){
    try{return !!(j&&accounting?.isPeriodClosed?.(j.business_unit_id,j.transaction_date))}catch(_){return false}
  }
  function activeVoidApprovalForFinance(f){
    try{return db.prepare(`SELECT * FROM approvals WHERE action_key='payment.void' AND status IN ('Pending','Resubmitted','Changes Required','Approved') AND executed_at IS NULL AND ((source_entity='finance_entry' AND source_id=?) OR (source_entity=? AND source_id=?)) ORDER BY id DESC LIMIT 1`).get(f.id,mapSourceEntity(f.source_type)||'',f.source_id||0)}catch(_){return null}
  }
  function mapSourceEntity(sourceType){
    return ({
      'Sale':'sale','Purchase':'purchase','Excavator Payment':'excavator_payment','Excavator Cost Transaction':'excavator_transaction',
      'Excavator Buyer Payment':'excavator_buyer_payment','Buyer Payment':'excavator_buyer_payment','Excavator Buyer Refund':'buyer_advance_refund',
      'Pink Salt Import Payment':'pink_salt_import_payment','Pink Salt Import Cost':'pink_salt_import_cost','Pink Salt Packaging Purchase':'pink_salt_packaging_purchase',
      'Pink Salt Customer Payment':'pink_salt_customer_payment','Pink Salt Customer Refund':'pink_salt_customer_refund'
    })[text(sourceType)]||'';
  }
  function sourceManagedMessage(sourceType){
    if(sourceType==='Excavator Sale')return 'Use the linked machine sale workflow so machine status, buyer settlement, documents, Finance and Accounting are reversed together.';
    if(['Pink Salt Import Purchase','Pink Salt Sale','Pink Salt Platform Fee','Pink Salt Waste'].includes(sourceType))return 'Use the linked Pink Salt operational record so inventory, payable/receivable, Finance and Accounting remain synchronized.';
    return '';
  }
  function linkedCostMachine(f){
    if(!f||f.source_type!=='Excavator Cost Transaction')return null;
    try{return db.prepare(`SELECT t.*,a.asset_no,a.machine_name,a.make,a.model,a.lifecycle_stage,a.purchase_price,a.sale_amount,a.business_unit_id
      FROM excavator_transactions t JOIN excavator_assets a ON a.id=t.asset_id WHERE t.id=?`).get(f.source_id)}catch(_){return null}
  }
  function linkedPaymentMachine(f){
    if(!f||f.source_type!=='Excavator Payment')return null;
    try{return db.prepare(`SELECT p.*,a.asset_no,a.machine_name,a.make,a.model,a.lifecycle_stage,a.purchase_price,a.purchase_token,a.purchase_balance,a.purchase_payment_status,a.business_unit_id,a.supplier_id
      FROM excavator_payments p JOIN excavator_assets a ON a.id=p.asset_id WHERE p.id=?`).get(f.source_id)}catch(_){return null}
  }
  function activeSaleForAsset(assetId){
    try{return db.prepare("SELECT * FROM excavator_transactions WHERE asset_id=? AND type IN ('Local Sale','Export Sale') AND status NOT IN ('Cancelled','Voided') ORDER BY id DESC LIMIT 1").get(assetId)}catch(_){return null}
  }
  function saleFinanceForAsset(assetId){
    const sale=activeSaleForAsset(assetId);if(!sale)return null;
    try{return db.prepare("SELECT * FROM finance_entries WHERE source_type='Excavator Sale' AND source_id=? AND status!='Voided' ORDER BY id DESC LIMIT 1").get(sale.id)}catch(_){return null}
  }
  function costDownstreamBlocker(f){
    const x=linkedCostMachine(f);if(!x||!['Sold / Completed','Sold / Payment Pending'].includes(text(x.lifecycle_stage)))return '';
    const sf=saleFinanceForAsset(x.asset_id),sj=latestJournal(sf);
    if(sj?.status==='Posted'&&periodClosed(sj))return `Machine ${x.asset_no} is already sold and this cost is included in COGS in a closed accounting period (${text(sj.transaction_date).slice(0,7)}). Reopen the period or use an authorized accounting adjustment before reversing this cost.`;
    return '';
  }
  function paymentDownstreamBlocker(f){
    const p=linkedPaymentMachine(f);if(!p)return '';
    if(text(p.status)==='Voided')return 'This supplier payment is already voided.';
    return '';
  }
  function impactForFinance(f){
    const impacts=[];
    if(!f)return impacts;
    const amount=num(f.krw_amount||f.amount);
    impacts.push({entity:'Finance',record:`Finance #${f.id}`,effect:`${text(f.status)==='Voided'?'Already voided':'Financial record will be retained and marked Voided/Reversed'} · KRW ${amount.toLocaleString()}`});
    const j=latestJournal(f);
    if(j){
      impacts.push({entity:'Accounting',record:j.journal_no||`Journal #${j.id}`,effect:j.status==='Posted'?'Original Posted journal remains; a linked reversal proposal will be created for Posting Control.':`Unposted ${j.status} proposal will be cancelled/superseded without deleting history.`});
    }else impacts.push({entity:'Accounting',record:'No posted journal yet',effect:'No ledger entry will be silently deleted; any pending proposal will be invalidated if present.'});
    const src=financeSourceDetail?financeSourceDetail(f):null;
    if(src)impacts.push({entity:'Source',record:src.record||src.label||`${f.source_type} #${f.source_id||''}`,effect:'Linked source status/balances will be updated through its controlled lifecycle rule.'});
    const x=linkedCostMachine(f);
    if(x){
      impacts.push({entity:'Machine',record:`${x.asset_no} · ${[x.machine_name,x.make,x.model].filter(Boolean).join(' ')||'Machine'}`,effect:`Cost ${x.type} will remain visible as Voided and be excluded from active machine cost totals.`});
      if(['Sold / Completed','Sold / Payment Pending'].includes(text(x.lifecycle_stage)))impacts.push({entity:'Sale / COGS',record:`${x.asset_no} sold machine`,effect:'Machine cost basis, COGS, gross profit, Accounting proposal/ledger reversal flow and related reports will be recalculated.'});
    }
    const p=linkedPaymentMachine(f);
    if(p){
      impacts.push({entity:'Machine Purchase',record:`${p.asset_no} · ${p.payment_type} payment`,effect:'Active supplier payment total, purchase outstanding balance and purchase payment status will be recalculated.'});
      impacts.push({entity:'Supplier',record:`Supplier linked to ${p.asset_no}`,effect:'Supplier paid/outstanding figures will refresh from active payments only.'});
    }
    if(['Excavator Buyer Payment','Buyer Payment'].includes(f.source_type))impacts.push({entity:'Buyer',record:`Buyer payment #${f.source_id}`,effect:'Payment allocations and available buyer advance will be reversed/recalculated while original receipt history remains.'});
    if(f.source_type==='Excavator Buyer Refund')impacts.push({entity:'Buyer',record:`Buyer refund #${f.source_id}`,effect:'Buyer advance/refund balance will be recalculated and refund history retained.'});
    if(f.source_type?.startsWith('Pink Salt'))impacts.push({entity:'Pink Salt',record:`${f.source_type} #${f.source_id||''}`,effect:'Operational inventory/payable/receivable links must update together; unsafe downstream reversals are blocked.'});
    impacts.push({entity:'Audit / Reports',record:'Audit trail, dashboards and statements',effect:'Original record, reason, requester/approver, linked reversal and final state remain traceable; active totals refresh after execution.'});
    return impacts;
  }
  function sourceVoidPolicy(sourceType,sourceId){
    let f=null;try{f=db.prepare("SELECT * FROM finance_entries WHERE source_type=? AND source_id=? AND status!='Voided' ORDER BY id DESC LIMIT 1").get(sourceType,Number(sourceId))}catch(_){ }
    if(!f)return {allowed:true,blocked:false,stage:'Operational / no active Finance effect',reason:'',impacts:[{entity:'Source',record:`${sourceType} #${sourceId}`,effect:'Source will be preserved with a void/cancel status and audit history.'}]};
    const p=financeActionPolicy(f);
    return {allowed:p.can_request,blocked:!p.can_request,stage:p.stage,reason:p.reason,impacts:p.impacts,finance_id:f.id,action_label:p.action_label};
  }
  function executionGuard(sourceEntity,sourceId){
    let f=null;
    if(sourceEntity==='finance_entry')f=db.prepare('SELECT * FROM finance_entries WHERE id=?').get(Number(sourceId));
    else{const inverse={excavator_payment:'Excavator Payment',excavator_transaction:'Excavator Cost Transaction',excavator_buyer_payment:'Excavator Buyer Payment',buyer_advance_refund:'Excavator Buyer Refund',pink_salt_import_payment:'Pink Salt Import Payment',pink_salt_import_cost:'Pink Salt Import Cost',pink_salt_packaging_purchase:'Pink Salt Packaging Purchase',pink_salt_customer_payment:'Pink Salt Customer Payment',pink_salt_customer_refund:'Pink Salt Customer Refund',sale:'Sale',purchase:'Purchase'};if(inverse[sourceEntity])f=db.prepare('SELECT * FROM finance_entries WHERE source_type=? AND source_id=? ORDER BY id DESC LIMIT 1').get(inverse[sourceEntity],Number(sourceId));}
    if(!f)return {allowed:true};
    const j=latestJournal(f);if(text(f.status)==='Voided')return {allowed:false,reason:'This Finance/source transaction is already voided or reversed.'};
    if(j?.status==='Posted'&&periodClosed(j))return {allowed:false,reason:`This posted transaction belongs to a closed accounting period (${text(j.transaction_date).slice(0,7)}). Reopen the period or use an authorized adjustment before executing the reversal.`};
    const costBlock=costDownstreamBlocker(f);if(costBlock)return {allowed:false,reason:costBlock};
    const payBlock=paymentDownstreamBlocker(f);if(payBlock)return {allowed:false,reason:payBlock};
    return {allowed:true,finance:f,journal:j,impacts:impactForFinance(f)};
  }
  function financeActionPolicy(f){
    if(!f)return {can_request:false,action_label:'',stage:'Missing',reason:'Finance entry not found.',impacts:[]};
    const j=latestJournal(f),stage=financeStage(f,j),impacts=impactForFinance(f),sourceMessage=sourceManagedMessage(text(f.source_type));
    if(text(f.status)==='Voided')return {can_request:false,action_label:'',stage,reason:'This Finance record is already voided/reversed. Use History to review the audit chain.',impacts,journal:j};
    if(sourceMessage)return {can_request:false,action_label:'',stage,reason:sourceMessage,impacts,journal:j,source_managed:true};
    if(!mapSourceEntity(f.source_type)&&f.source_type!=='Manual'&&f.source_type!=='')return {can_request:false,action_label:'',stage,reason:`${f.source_type} is not safely reversible from Finance. Use its linked source workflow.`,impacts,journal:j,source_managed:true};
    const open=activeVoidApprovalForFinance(f);if(open)return {can_request:false,action_label:'',stage,reason:`A controlled void/reversal request (#${open.id}) is already ${open.status}.`,impacts,journal:j,open_request:open};
    if(j?.status==='Posted'&&periodClosed(j))return {can_request:false,action_label:'',stage,reason:`This posted transaction belongs to a closed accounting period (${text(j.transaction_date).slice(0,7)}). Reopen the period or use an authorized adjustment/reversal workflow.`,impacts,journal:j};
    const costBlock=costDownstreamBlocker(f);if(costBlock)return {can_request:false,action_label:'',stage,reason:costBlock,impacts,journal:j};
    const payBlock=paymentDownstreamBlocker(f);if(payBlock)return {can_request:false,action_label:'',stage,reason:payBlock,impacts,journal:j};
    return {can_request:true,action_label:j?.status==='Posted'?'Request Reversal':'Request Void',stage,reason:'',impacts,journal:j,requires_accounting_reversal:j?.status==='Posted'};
  }

  function createLifecycle({f,action,reason,impacts,status='Requested',userId,result={}}){
    const snap={finance_id:f?.id||null,source_type:f?.source_type||'',source_id:f?.source_id||null,verification_status:f?.verification_status||'',finance_status:f?.status||'',accounting_status:f?.accounting_status||'',journal_id:f?.accounting_journal_id||null};
    const r=db.prepare(`INSERT INTO lifecycle_action_history_v331(business_unit_id,entity_type,entity_id,action,stage_before,status,reason,impact_json,source_snapshot_json,result_json,requested_by,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).run(f?.business_unit_id||null,'finance_entry',f?.id||0,action,financeStage(f,latestJournal(f)),status,reason||'',JSON.stringify(impacts||[]),JSON.stringify(snap),JSON.stringify(result||{}),userId||null);
    return Number(r.lastInsertRowid);
  }
  function updateLifecycle(id,status,result={},approvedBy=null){
    if(!id)return;db.prepare('UPDATE lifecycle_action_history_v331 SET status=?,result_json=?,approved_by=COALESCE(?,approved_by),updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status,JSON.stringify(result||{}),approvedBy||null,id);
  }
  function notifyStakeholders(f,title,message,level='warning'){
    if(!f)return;const ids=new Set();if(f.created_by)ids.add(Number(f.created_by));
    try{for(const u of db.prepare("SELECT id FROM users WHERE active=1 AND (role='CEO / Owner' OR (role IN ('Finance / Admin','Finance Head','Finance User') AND (business_unit_id=? OR business_unit_id IS NULL)) OR (role IN ('Operations Manager','Business Unit Manager') AND business_unit_id=?))").all(f.business_unit_id,f.business_unit_id))ids.add(Number(u.id))}catch(_){ }
    for(const id of ids)try{notify?.(id,level,title,message,f.business_unit_id,'finance',f.id,'finance',f.id)}catch(_){ }
  }
  function ensureAutomaticApproval(req,f,reason,impacts,label){
    const snapshot={body:{reason},impact:impacts,stage:financeStage(f,latestJournal(f)),automatic_rule:'No approval threshold configured; controlled audit authorization retained.'};
    const r=db.prepare(`INSERT INTO approvals(type,requester_id,business_unit_id,amount,reason,status,current_step,action_key,source_entity,source_id,priority,required_level,current_level,request_snapshot_json,original_snapshot_json,payload_hash,direct_authorization,direct_authorization_note,decision_note,decided_by,decided_at,updated_at)
      VALUES(?,?,?,?,?,'Approved','Automatic Controlled Authorization','payment.void','finance_entry',?,'Critical',0,0,?,?,?,1,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).run(label||'Controlled Finance Void / Reversal',req.user.id,f.business_unit_id,Math.abs(num(f.krw_amount||f.amount)),reason,f.id,JSON.stringify(snapshot),JSON.stringify(snapshot),`v331-${f.id}-${Date.now()}`,'System lifecycle rule','System lifecycle rule',req.user.id);
    return db.prepare('SELECT * FROM approvals WHERE id=?').get(r.lastInsertRowid);
  }
  function recalcExcavatorPurchase(paymentId){
    const p=db.prepare('SELECT * FROM excavator_payments WHERE id=?').get(Number(paymentId));if(!p||p.payment_type!=='Purchase')return null;
    const a=db.prepare('SELECT * FROM excavator_assets WHERE id=?').get(p.asset_id);if(!a)return null;
    const activePaid=num(db.prepare("SELECT COALESCE(SUM(amount),0) v FROM excavator_payments WHERE asset_id=? AND payment_type='Purchase' AND status='Paid'").get(a.id)?.v);
    const tokenRow=db.prepare("SELECT amount FROM excavator_payments WHERE asset_id=? AND payment_type='Purchase' AND status='Paid' AND lower(COALESCE(notes,'')) LIKE '%purchase token payment%' ORDER BY id LIMIT 1").get(a.id);
    const token=num(tokenRow?.amount||0),balance=Math.max(0,num(a.purchase_price)-activePaid),status=activePaid>=num(a.purchase_price)&&num(a.purchase_price)>0?'Paid':activePaid>0?'Token/Partial Paid':'Pending';
    db.prepare('UPDATE excavator_assets SET purchase_token=?,purchase_balance=?,purchase_payment_status=? WHERE id=?').run(token,balance,status,a.id);
    return {asset_id:a.id,asset_no:a.asset_no,active_paid_krw:activePaid,active_token_krw:token,outstanding_krw:balance,purchase_payment_status:status};
  }
  function resyncSoldMachineCogs(costTxId){
    const x=db.prepare('SELECT * FROM excavator_transactions WHERE id=?').get(Number(costTxId));if(!x)return null;
    const sf=saleFinanceForAsset(x.asset_id);if(!sf)return null;
    try{return accounting?.syncFinanceEntry?.(sf.id)||null}catch(e){return {error:e.message}}
  }
  function postExecutionSync(f){
    const result={};if(!f)return result;
    try{
      const refreshed=db.prepare('SELECT * FROM finance_entries WHERE id=?').get(f.id);
      if(refreshed){
        const alreadyReversalPending=text(refreshed.status)==='Voided'&&text(refreshed.accounting_status)==='Pending Review'&&Number(refreshed.accounting_journal_id||0)>0;
        const alreadyReversed=text(refreshed.status)==='Voided'&&['Reversed','Cancelled'].includes(text(refreshed.accounting_status));
        result.accounting=alreadyReversalPending?{already_synced:true,reversal_pending:true,journal_id:Number(refreshed.accounting_journal_id)}:alreadyReversed?{already_synced:true,reversed:true}:accounting?.syncFinanceEntry?.(refreshed.id)||null;
      }
    }catch(e){result.accounting_error=e.message}
    if(f.source_type==='Excavator Payment')try{result.machine_purchase=recalcExcavatorPurchase(f.source_id)}catch(e){result.machine_purchase_error=e.message}
    if(f.source_type==='Excavator Cost Transaction')try{result.sale_cogs=resyncSoldMachineCogs(f.source_id)}catch(e){result.sale_cogs_error=e.message}
    try{db.prepare("UPDATE finance_correction_requests SET status='Cancelled',outcome='Voided / Reversed',resolved_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE finance_entry_id=? AND status IN ('Open','Viewed','Resubmitted')").run(f.id)}catch(_){ }
    return result;
  }

  // Finance action policy is the authoritative UI/server rule for showing Request Void vs Request Reversal.
  app.get('/api/v331/finance/:id/action-policy',auth,allow('finance'),(req,res)=>{
    const f=db.prepare('SELECT * FROM finance_entries WHERE id=?').get(req.params.id);if(!f)return res.status(404).json({error:'Finance entry not found.'});if(!enforceUnit(req,f.business_unit_id))return res.status(403).json({error:'You cannot access another business unit Finance record.'});
    const p=financeActionPolicy(f),machine=linkedCostMachine(f)||linkedPaymentMachine(f)||null,authorized=canRequestLifecycle(req,f.business_unit_id);res.json({...p,can_request:authorized&&p.can_request,permission_allowed:authorized,reason:authorized?p.reason:'You are not authorized to request a Finance void/reversal.',finance_id:f.id,source:{type:f.source_type,id:f.source_id,machine}});
  });
  app.get('/api/v331/source-action-policy',auth,(req,res)=>{
    const sourceType=text(req.query.source_type),sourceId=Number(req.query.source_id||0);if(!sourceType||!sourceId)return res.status(400).json({error:'source_type and source_id are required.'});const p=sourceVoidPolicy(sourceType,sourceId);if(p.finance_id){const f=db.prepare('SELECT * FROM finance_entries WHERE id=?').get(p.finance_id);if(f&&!enforceUnit(req,f.business_unit_id))return res.status(403).json({error:'You cannot access this business unit record.'});const authorized=canRequestSourceLifecycle(req,f?.business_unit_id);return res.json({...p,allowed:authorized&&p.allowed,blocked:!authorized||p.blocked,reason:authorized?p.reason:'You are not authorized to request this source void/reversal.',permission_allowed:authorized})}res.json(p);
  });

  app.get('/api/v331/lifecycle/history',auth,allow('finance'),(req,res)=>{
    const entityType=text(req.query.entity_type||'finance_entry'),entityId=Number(req.query.entity_id||0);if(!entityId)return res.status(400).json({error:'entity_id is required.'});
    const rows=db.prepare(`SELECT h.*,u.name requested_by_name,a.name approved_by_name FROM lifecycle_action_history_v331 h LEFT JOIN users u ON u.id=h.requested_by LEFT JOIN users a ON a.id=h.approved_by WHERE h.entity_type=? AND h.entity_id=? ORDER BY h.id DESC`).all(entityType,entityId).map(r=>({...r,impact:safeJson(r.impact_json,[]),source_snapshot:safeJson(r.source_snapshot_json,{}),result:safeJson(r.result_json,{})}));
    if(rows[0]?.business_unit_id&&!enforceUnit(req,rows[0].business_unit_id))return res.status(403).json({error:'You cannot access this audit history.'});res.json(rows);
  });

  app.get('/api/v331/lifecycle/rules',auth,(req,res)=>res.json({version:VERSION,rules:[
    {stage:'Draft / unused / unlinked',action:'Edit or Delete',rule:'Hard delete only when the record has never affected money, stock, Accounting, or another record.'},
    {stage:'Submitted / pending approval',action:'Cancel / Request Void',rule:'Preserve the record, reason and approval history.'},
    {stage:'Finance created, not verified',action:'Request Void',rule:'Void source + Finance together; cancel any unposted Accounting proposal.'},
    {stage:'Finance correction pending',action:'Correct & Resubmit or controlled Void',rule:'Do not run conflicting mutations simultaneously; whichever action executes closes the other workflow.'},
    {stage:'Finance Verified, Accounting not Posted',action:'Request Void / controlled reversal',rule:'Reverse source/Finance and cancel the pending Accounting proposal.'},
    {stage:'Accounting Posted',action:'Request Reversal',rule:'Never delete the original journal; create a linked reversal proposal.'},
    {stage:'Closed period / unsafe downstream dependency',action:'Blocked',rule:'Reopen/adjust downstream records or use authorized accounting adjustment.'},
    {stage:'Already Voided / Reversed',action:'History only',rule:'No second void/reversal.'}
  ]}));

  // Fix the missing source-aware Correct & Resubmit endpoint used by V30.24.1 UI.
  app.put('/api/finance/:id',auth,upload.array('attachments',20),(req,res)=>{
    try{
      const f=db.prepare('SELECT * FROM finance_entries WHERE id=?').get(req.params.id);if(!f)return res.status(404).json({error:'Finance entry not found.'});if(!enforceUnit(req,f.business_unit_id))return res.status(403).json({error:'You cannot access another business unit Finance record.'});
      const c=db.prepare("SELECT * FROM finance_correction_requests WHERE finance_entry_id=? AND status IN ('Open','Viewed','Resubmitted') ORDER BY id DESC LIMIT 1").get(f.id);if(!c)return res.status(409).json({error:'There is no active correction request for this Finance record.'});
      if(Number(c.assigned_to)!==Number(req.user.id)||Number(f.created_by)!==Number(req.user.id))return res.status(403).json({error:'Only the original record creator assigned to this correction can correct and resubmit it.'});
      const j=latestJournal(f);if(j?.status==='Posted')return res.status(409).json({error:'This Finance transaction is already posted to Accounting. Use Request Reversal instead of editing a posted transaction.'});
      const response=text(req.body.response_note);if(!response)return res.status(400).json({error:'Correction Response is required.'});
      const files=req.files||[],removeReceipt=String(req.body.remove_receipt_file||'')==='1';let removeIds=req.body.remove_attachment_ids||[];if(!Array.isArray(removeIds))removeIds=[removeIds];removeIds=removeIds.map(Number).filter(Boolean);
      const activeAttachments=db.prepare('SELECT * FROM finance_attachments WHERE finance_entry_id=? AND COALESCE(archived,0)=0').all(f.id),linked=financeLinkedEvidence?financeLinkedEvidence(f):[];
      const remainingActive=activeAttachments.filter(a=>!removeIds.includes(Number(a.id))).length,willHaveEvidence=files.length>0||(!removeReceipt&&!!f.receipt_file)||remainingActive>0||linked.length>0;
      if(!willHaveEvidence)return res.status(400).json({error:'At least one receipt/evidence item must remain linked after correction.'});
      const result=applyFinanceCorrection(f,req.body,files,req.user);
      // Preserve removed evidence as archived history. Never delete the original file.
      if(removeReceipt&&f.receipt_file){
        const exists=db.prepare('SELECT id FROM finance_attachments WHERE finance_entry_id=? AND file_path=?').get(f.id,'/uploads/'+String(f.receipt_file).replace(/^\/+/,''));
        if(!exists)db.prepare(`INSERT INTO finance_attachments(finance_entry_id,title,original_name,file_path,mime_type,size_bytes,uploaded_by,archived,archived_by,archived_at,archive_reason) VALUES(?,?,?,?,?,?,?,1,?,CURRENT_TIMESTAMP,?)`).run(f.id,'Previous Finance receipt · preserved audit copy',String(f.receipt_file),'/uploads/'+String(f.receipt_file).replace(/^\/+/,''),'',0,f.created_by||req.user.id,req.user.id,'Removed from active evidence during controlled correction; original preserved for audit.');
        if(!files.length)db.prepare("UPDATE finance_entries SET receipt_file='' WHERE id=?").run(f.id);
      }
      if(removeIds.length){const q=`UPDATE finance_attachments SET archived=1,archived_by=?,archived_at=CURRENT_TIMESTAMP,archive_reason=? WHERE finance_entry_id=? AND id IN (${removeIds.map(()=>'?').join(',')})`;db.prepare(q).run(req.user.id,'Removed from active evidence during controlled correction; original preserved for audit.',f.id,...removeIds)}
      db.prepare("UPDATE finance_correction_requests SET status='Resubmitted',response_note=?,responded_at=CURRENT_TIMESTAMP,resubmission_count=COALESCE(resubmission_count,0)+1,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(response,c.id);
      if(c.task_id){try{db.prepare("UPDATE tasks SET status='Waiting',progress_percent=90,review_status='Pending',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(c.task_id);db.prepare('INSERT INTO task_history(task_id,user_id,action,note) VALUES(?,?,?,?)').run(c.task_id,req.user.id,'Corrected & Resubmitted',response)}catch(_){ }}
      const updatedC=db.prepare('SELECT * FROM finance_correction_requests WHERE id=?').get(c.id);try{financeCorrectionHistory?.(updatedC,req.user.id,'Corrected & Resubmitted',response,{changed_fields:result.changed,source_preserved:true})}catch(_){ }
      // Any stale unposted proposal is cancelled/superseded. Posted changes are blocked above.
      try{accounting?.syncFinanceEntry?.(f.id)}catch(e){console.error('V30.31 correction accounting sync:',e.message)}
      audit?.(req.user,'finance',f.id,'correct-resubmit-v331',JSON.stringify({correction_id:c.id,changed_fields:result.changed?.map(x=>x.field)||[],archived_attachment_ids:removeIds,removed_current_receipt:removeReceipt}));
      notifyStakeholders(result.finance||f,'Finance correction resubmitted',`Finance #${f.id} was corrected by the original creator and returned for verification.`,'info');
      res.json({ok:true,changed_fields:result.changed||[],verification_status:'Resubmitted',correction_status:'Resubmitted',preserved_original:true});
    }catch(e){console.error('V30.31 Finance correction resubmit:',e);res.status(e.status||400).json({error:e.message||'Finance correction could not be resubmitted.'})}
  });

  // Fix the missing Finance Request Void endpoint and make it stage/dependency aware.
  app.delete('/api/finance/:id',auth,allow('finance'),(req,res)=>{
    const f=db.prepare('SELECT * FROM finance_entries WHERE id=?').get(req.params.id);if(!f)return res.status(404).json({error:'Finance entry not found.'});if(!enforceUnit(req,f.business_unit_id))return res.status(403).json({error:'You cannot access another business unit Finance record.'});if(!canRequestLifecycle(req,f.business_unit_id))return res.status(403).json({error:'Finance void/reversal permission is required.'});
    const reason=text(req.body?.reason);if(!reason)return res.status(400).json({error:'Void / reversal reason is required.'});const policy=financeActionPolicy(f);if(!policy.can_request)return res.status(409).json({error:policy.reason||'This record cannot be voided/reversed at its current stage.',policy});
    const lifecycleId=createLifecycle({f,action:policy.action_label,reason,impacts:policy.impacts,userId:req.user.id});
    try{
      const ap=maybeCreateApproval({req,businessUnitId:f.business_unit_id,actionKey:'payment.void',type:`${policy.action_label}: ${f.source_label||f.source_type||'Finance Transaction'}`,amount:Math.abs(num(f.krw_amount||f.amount)),reason,sourceEntity:'finance_entry',sourceId:f.id,priority:'Critical',snapshot:{body:{reason},impact:policy.impacts,stage:policy.stage,finance_id:f.id}});
      if(ap?.confirmation_required||ap?.configuration_error||ap?.required){
        if(ap?.required){updateLifecycle(lifecycleId,'Awaiting Approval',{approval_id:ap.approval?.id});notifyStakeholders(f,`${policy.action_label} requested`,`Finance #${f.id}: ${reason}. Review affects linked Finance/Accounting/operational records.`)}
        if(stopForApproval(res,ap,`${policy.action_label} submitted for controlled approval. Linked records will update only after final approval.`,{lifecycle_id:lifecycleId,impact:policy.impacts,action_label:policy.action_label}))return;
      }
      const approval=ap?.approval||ensureAutomaticApproval(req,f,reason,policy.impacts,policy.action_label);
      const execution=executeApprovedAction(approval,req.user);if(!execution?.executed){updateLifecycle(lifecycleId,'Blocked',{error:execution?.error||'Execution failed'},req.user.id);return res.status(409).json({error:execution?.error||'Void / reversal could not be applied.',execution})}
      const sync=execution?.lifecycle_sync||postExecutionSync(f);updateLifecycle(lifecycleId,'Executed',{approval_id:approval.id,execution,sync},req.user.id);notifyStakeholders(f,`${policy.action_label} executed`,`Finance #${f.id} and its linked entities were updated. Original records and reversal history were preserved.`,'warning');
      audit?.(req.user,'finance',f.id,'void-reversal-v331',JSON.stringify({reason,action_label:policy.action_label,lifecycle_id:lifecycleId,approval_id:approval.id,impact:policy.impacts,sync}));
      res.json({ok:true,status:'Executed',action_label:policy.action_label,approval_id:approval.id,lifecycle_id:lifecycleId,impact:policy.impacts,sync,preserved_original:true});
    }catch(e){updateLifecycle(lifecycleId,'Failed',{error:e.message},req.user.id);console.error('V30.31 Finance void/reversal:',e);res.status(e.status||409).json({error:e.message||'Void / reversal failed.',lifecycle_id:lifecycleId})}
  });

  function afterDirectSourceVoid(sourceType,sourceId,reason,user,approval=null){
    const f=db.prepare('SELECT * FROM finance_entries WHERE source_type=? AND source_id=? ORDER BY id DESC LIMIT 1').get(sourceType,Number(sourceId));if(!f)return null;
    const sync=postExecutionSync(f),impacts=impactForFinance(f);createLifecycle({f,action:latestJournal(f)?.status==='Posted'?'Request Reversal':'Request Void',reason:reason||'Controlled source void',impacts,status:'Executed',userId:user?.id,result:{approval_id:approval?.id||null,sync,direct_source:true}});
    notifyStakeholders(f,'Controlled source void/reversal executed',`Finance #${f.id} and linked ${sourceType} record were updated. Original history was preserved.`,'warning');return sync;
  }

  function afterApprovedAction(approval,user){
    if(!approval||approval.action_key!=='payment.void')return null;
    let f=null;const source=text(approval.source_entity),sourceId=Number(approval.source_id||0);
    if(source==='finance_entry')f=db.prepare('SELECT * FROM finance_entries WHERE id=?').get(sourceId);
    else{
      const inverse={excavator_payment:'Excavator Payment',excavator_transaction:'Excavator Cost Transaction',excavator_buyer_payment:'Excavator Buyer Payment',buyer_advance_refund:'Excavator Buyer Refund',pink_salt_import_payment:'Pink Salt Import Payment',pink_salt_import_cost:'Pink Salt Import Cost',pink_salt_packaging_purchase:'Pink Salt Packaging Purchase',pink_salt_customer_payment:'Pink Salt Customer Payment',pink_salt_customer_refund:'Pink Salt Customer Refund',sale:'Sale',purchase:'Purchase'};
      if(inverse[source])f=db.prepare('SELECT * FROM finance_entries WHERE source_type=? AND source_id=? ORDER BY id DESC LIMIT 1').get(inverse[source],sourceId);
    }
    const sync=postExecutionSync(f);if(f){
      let h=db.prepare("SELECT id FROM lifecycle_action_history_v331 WHERE entity_type='finance_entry' AND entity_id=? AND status IN ('Requested','Awaiting Approval') ORDER BY id DESC LIMIT 1").get(f.id);if(h)updateLifecycle(h.id,'Executed',{approval_id:approval.id,sync},user?.id);else createLifecycle({f,action:latestJournal(f)?.status==='Posted'?'Request Reversal':'Request Void',reason:approval.reason||'',impacts:impactForFinance(f),status:'Executed',userId:approval.requester_id,result:{approval_id:approval.id,sync}});
      notifyStakeholders(f,'Controlled void/reversal executed',`Finance #${f.id} and linked records were updated after approval. Audit history was preserved.`,'warning');
    }
    return sync;
  }

  return {version:VERSION,financeActionPolicy,sourceVoidPolicy,executionGuard,impactForFinance,afterApprovedAction,afterDirectSourceVoid,postExecutionSync,recalcExcavatorPurchase,resyncSoldMachineCogs};
}

module.exports={install,VERSION};
