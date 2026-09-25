// Blue Ocean Market V30.18.0 — Finance Posting Control and Accounting final-posting gate.
'use strict';

const VERSION='30.18.0';

function install({app,db,auth,currentUnit,enforceUnit,audit,notify,upload,accounting,access,openFinanceCorrection}){
  const text=v=>String(v??'').trim();
  const num=v=>Number(v||0);
  const ensureColumn=(table,column,definition)=>{try{const cols=db.prepare(`PRAGMA table_info(${table})`).all().map(x=>x.name);if(!cols.includes(column))db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)}catch(e){console.error('V30.18 migration',table,column,e.message)}};

  ensureColumn('accounting_journal_entries','reviewed_by','INTEGER');
  ensureColumn('accounting_journal_entries','reviewed_at','TEXT');
  ensureColumn('accounting_journal_entries','review_note',"TEXT DEFAULT ''");
  ensureColumn('accounting_journal_entries','correction_requested_by','INTEGER');
  ensureColumn('accounting_journal_entries','correction_requested_at','TEXT');
  ensureColumn('accounting_journal_entries','correction_reason',"TEXT DEFAULT ''");
  ensureColumn('accounting_journal_entries','submitted_for_review_at','TEXT');
  try{db.exec(`
    CREATE TABLE IF NOT EXISTS accounting_posting_history(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      journal_entry_id INTEGER NOT NULL,
      business_unit_id INTEGER,
      user_id INTEGER,
      action TEXT NOT NULL,
      note TEXT DEFAULT '',
      before_status TEXT DEFAULT '',
      after_status TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(journal_entry_id) REFERENCES accounting_journal_entries(id) ON DELETE CASCADE,
      FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_accounting_posting_history_journal ON accounting_posting_history(journal_entry_id,id);
    CREATE INDEX IF NOT EXISTS idx_accounting_posting_queue ON accounting_journal_entries(status,business_unit_id,transaction_date);
  `)}catch(e){console.error('V30.18 posting-control schema:',e.message)}
  try{db.prepare("UPDATE accounting_journal_entries SET submitted_for_review_at=COALESCE(submitted_for_review_at,created_at) WHERE status IN ('Pending Review','Correction Required')").run()}catch(_){ }

  function actorScope(req){return currentUnit(req)||req.user.business_unit_id||null}
  function journalUnits(j){
    if(!j)return [];
    const ids=[];if(j.business_unit_id)ids.push(Number(j.business_unit_id));
    for(const r of db.prepare('SELECT DISTINCT business_unit_id FROM accounting_journal_lines WHERE journal_entry_id=? AND business_unit_id IS NOT NULL').all(j.id))ids.push(Number(r.business_unit_id));
    return [...new Set(ids.filter(Number.isInteger).filter(x=>x>0))];
  }
  function selectedUnit(req){return Number(req.selected_business_unit_id||actorScope(req)||0)||null}
  function canSee(req,j){
    if(!j)return false;const units=journalUnits(j),selected=selectedUnit(req);
    if(req.user.role==='CEO / Owner')return !selected||units.length===0||units.includes(selected);
    const assigned=new Set((access?.assignedUnits?.(req.user.id)||[]).map(x=>Number(x.id)));
    if(selected&&!assigned.has(selected))return false;
    if(selected)return units.includes(selected);
    return units.some(bu=>assigned.has(bu));
  }
  function permissionOnAllUnits(req,module,actions,j){
    if(req.user.role==='CEO / Owner')return true;const units=journalUnits(j);if(!units.length)return false;
    return units.every(bu=>actions.some(action=>access?.canAction?.(req.user.id,module,action,bu)));
  }
  function canViewPosting(req,j){if(req.user.role==='CEO / Owner')return true;const units=journalUnits(j);if(!units.length)return false;return units.every(bu=>access?.canAction?.(req.user.id,'accounting','view',bu)||access?.canAction?.(req.user.id,'finance','verify',bu)||access?.canAction?.(req.user.id,'finance','correct',bu))}
  function canPost(req,j){return permissionOnAllUnits(req,'accounting',['approve'],j)}
  function canCorrect(req,j){
    if(req.user.role==='CEO / Owner')return true;const units=journalUnits(j);if(!units.length)return false;
    return units.every(bu=>access?.canAction?.(req.user.id,'accounting','correct',bu)||access?.canAction?.(req.user.id,'finance','correct',bu)||access?.canAction?.(req.user.id,'finance','verify',bu));
  }
  function canVoid(req,j){return permissionOnAllUnits(req,'accounting',['void'],j)}
  function periodClosedUnits(j){const units=journalUnits(j);if(!units.length)return accounting?.isPeriodClosed?.(null,j.transaction_date)?[null]:[];return units.filter(bu=>accounting?.isPeriodClosed?.(bu,j.transaction_date))}
  function history(j,user,action,note,before,after){db.prepare('INSERT INTO accounting_posting_history(journal_entry_id,business_unit_id,user_id,action,note,before_status,after_status) VALUES(?,?,?,?,?,?,?)').run(j.id,j.business_unit_id||null,user?.id||null,action,note||'',before||j.status||'',after||j.status||'');audit(user,'accounting_posting',j.id,action,JSON.stringify({journal_no:j.journal_no,business_unit_id:j.business_unit_id,business_unit_ids:journalUnits(j),before_status:before||j.status,after_status:after||j.status,note:note||''}))}
  function pendingReversalForFinance(financeId,excludeJournalId=null){
    return db.prepare(`SELECT r.id,r.journal_no,r.status,o.id original_journal_id,o.journal_no original_journal_no
      FROM accounting_journal_entries r JOIN accounting_journal_entries o ON o.id=r.reversal_of_id
      WHERE r.source_type='Accounting Reversal' AND r.status IN ('Pending Review','Correction Required')
        AND o.source_type='Finance Entry' AND o.source_id=? AND r.id<>COALESCE(?,0)
      ORDER BY r.id DESC LIMIT 1`).get(Number(financeId),excludeJournalId);
  }
  function operationControl(finance){
    const st=text(finance?.source_type),id=Number(finance?.source_id||0),base={ready:true,source_status:'Completed / Approved',payment_requirement_status:'Not Required',linked_payment_status:'Not Required',warnings:[]};
    try{
      if(st==='Excavator Sale'){
        const sale=db.prepare("SELECT id,asset_id,amount,status,type FROM excavator_transactions WHERE id=? AND type IN ('Local Sale','Export Sale')").get(id);
        if(!sale)return {...base,ready:false,source_status:'Missing',warnings:['Linked Excavator sale is missing.']};
        const rows=db.prepare(`SELECT al.amount_krw,p.id payment_id,p.reference,COALESCE(p.status,'Active') payment_status,
          f.id finance_id,f.verification_status,f.status finance_status
          FROM excavator_buyer_payment_allocations al
          JOIN excavator_buyer_payments p ON p.id=al.payment_id
          LEFT JOIN finance_entries f ON f.source_type='Excavator Buyer Payment' AND f.source_id=p.id AND f.status!='Voided'
          WHERE al.asset_id=? AND COALESCE(al.status,'Active')='Active' AND COALESCE(p.status,'Active')!='Voided'`).all(sale.asset_id);
        const allocated=rows.reduce((n,r)=>n+num(r.amount_krw),0),verified=rows.filter(r=>['Verified','Verified / Correct'].includes(text(r.verification_status))).reduce((n,r)=>n+num(r.amount_krw),0),required=num(sale.amount),opReady=text(sale.status)==='Completed',payReady=verified+0.005>=required;
        const warnings=[];if(!opReady)warnings.push(`Excavator sale status is ${sale.status||'not completed'}.`);if(allocated+0.005<required)warnings.push(`Buyer payment allocation is incomplete: KRW ${Math.round(allocated).toLocaleString()} allocated of KRW ${Math.round(required).toLocaleString()}.`);if(!payReady)warnings.push(`Verified buyer payments cover KRW ${Math.round(verified).toLocaleString()} of required KRW ${Math.round(required).toLocaleString()}.`);
        return {ready:opReady&&payReady,source_status:sale.status||'Open',payment_requirement_status:payReady?'Satisfied / Finance Verified':'Not Satisfied',linked_payment_status:payReady?'Verified':'Pending Finance Verification',allocated_krw:allocated,verified_allocated_krw:verified,required_krw:required,warnings};
      }
      if(st==='Sale'){
        const r=db.prepare('SELECT id,status FROM sales WHERE id=?').get(id);if(!r)return {...base,ready:false,source_status:'Missing',warnings:['Linked sale is missing.']};const ok=text(r.status)==='Completed';return {...base,ready:ok,source_status:r.status||'Open',warnings:ok?[]:[`Sale status is ${r.status||'not completed'}.`]};
      }
      if(st==='Purchase'){
        const r=db.prepare('SELECT id,status FROM purchases WHERE id=?').get(id);if(!r)return {...base,ready:false,source_status:'Missing',warnings:['Linked purchase is missing.']};const ok=!['Voided','Cancelled'].includes(text(r.status));return {...base,ready:ok,source_status:r.status||'Received',warnings:ok?[]:[`Purchase status is ${r.status}.`]};
      }
      if(st==='Pink Salt Sale'){
        const r=db.prepare('SELECT id,status FROM pink_salt_orders WHERE id=?').get(id);if(!r)return {...base,ready:false,source_status:'Missing',warnings:['Linked Pink Salt order is missing.']};const ok=text(r.status)==='Completed';return {...base,ready:ok,source_status:r.status||'Open',warnings:ok?[]:[`Pink Salt order status is ${r.status||'not completed'}.`]};
      }
      if(st==='Pink Salt Import Purchase'){
        const r=db.prepare('SELECT id,status FROM pink_salt_imports WHERE id=?').get(id);if(!r)return {...base,ready:false,source_status:'Missing',warnings:['Linked Pink Salt import is missing.']};const ok=!['Cancelled','Voided'].includes(text(r.status));return {...base,ready:ok,source_status:r.status||'Ordered',warnings:ok?[]:[`Pink Salt import status is ${r.status}.`]};
      }
      if(st==='Pink Salt Packaging Purchase'){
        const r=db.prepare('SELECT id,status FROM pink_salt_packaging_movements WHERE id=?').get(id);if(!r)return {...base,ready:false,source_status:'Missing',warnings:['Linked packaging receipt is missing.']};const ok=text(r.status||'Active')!=='Voided';return {...base,ready:ok,source_status:r.status||'Active',warnings:ok?[]:['Packaging purchase is voided.']};
      }
      return base;
    }catch(e){return {...base,ready:false,source_status:'Validation Error',warnings:[`Operational source validation failed: ${e.message}`]};}
  }
  function financeReadiness(j){
    if(!j.finance_entry_id)return {linked:false,ready:true,warnings:[]};
    const f=db.prepare(`SELECT f.*,b.name business_unit,u.name created_by_name,v.name verified_by_name,
      (SELECT COUNT(*) FROM finance_attachments a WHERE a.finance_entry_id=f.id) attachment_count,
      (SELECT COUNT(*) FROM finance_correction_requests c WHERE c.finance_entry_id=f.id AND c.status IN ('Open','Viewed','Resubmitted')) open_corrections
      FROM finance_entries f LEFT JOIN business_units b ON b.id=f.business_unit_id LEFT JOIN users u ON u.id=f.created_by LEFT JOIN users v ON v.id=f.verified_by WHERE f.id=?`).get(j.finance_entry_id);
    if(!f)return {linked:true,ready:false,warnings:['Linked Finance record is missing.'],finance:null};
    const verification=text(f.verification_status),verified=['Verified','Verified / Correct'].includes(verification),warnings=[];
    const operational=Number(f.cash_effect||0)===0 && !/payment|receipt|refund|transfer/i.test(String(f.source_type||''));
    const op=operational?operationControl(f):null;
    if(f.status==='Voided')warnings.push('Linked source record is voided.');
    const integrityHold=require('./v354-finance-integrity').isLegacyMirrorFinance(db,f)||!!require('./v354-finance-integrity').caseFor(db,f.id);
    if(integrityHold)warnings.push('Duplicate sale-settlement mirror on integrity hold; cannot final-post this record.');
    if(operational&&op?.warnings?.length)warnings.push(...op.warnings);
    if(!operational&&!verified)warnings.push(`Finance verification is ${verification||'not complete'}.`);
    if(!operational&&Number(f.open_corrections||0)>0)warnings.push('A Finance correction request is still open.');
    const evidence=financeEvidence(f);if(!evidence.length)warnings.push(operational?'No linked operational evidence is available for review.':'No Finance or linked source evidence is available for review.');
    const reversal=pendingReversalForFinance(f.id,j.id);if(reversal)warnings.push(`Previous official posting must be reversed first (${reversal.journal_no}).`);
    const operationStatus=operational?(op?.source_status||'Completed / Approved'):'Finance Verified';
    return {linked:true,operational,source_control:operationStatus,source_status:op?.source_status||null,linked_payment_status:op?.linked_payment_status||null,payment_requirement_status:op?.payment_requirement_status||null,finance_verification_required:!operational,ready:!integrityHold&&f.status!=='Voided'&&(operational?!!op?.ready:verified)&&(operational||!Number(f.open_corrections||0))&&!reversal,warnings,finance:f,pending_reversal:reversal||null,evidence_count:evidence.length};
  }
  function totals(journalId){const x=db.prepare('SELECT ROUND(COALESCE(SUM(debit_krw),0),2) debit,ROUND(COALESCE(SUM(credit_krw),0),2) credit,COUNT(*) line_count FROM accounting_journal_lines WHERE journal_entry_id=?').get(journalId);return {debit:num(x?.debit),credit:num(x?.credit),line_count:Number(x?.line_count||0),balanced:Math.abs(num(x?.debit)-num(x?.credit))<=0.01&&Number(x?.line_count||0)>=2}}
  function detailRow(id){
    const j=db.prepare(`SELECT j.*,b.name business_unit,creator.name created_by_name,reviewer.name reviewed_by_name,corrector.name correction_requested_by_name,
      f.verification_status finance_verification_status,f.reference finance_reference,f.status finance_status
      FROM accounting_journal_entries j LEFT JOIN business_units b ON b.id=j.business_unit_id LEFT JOIN users creator ON creator.id=j.created_by LEFT JOIN users reviewer ON reviewer.id=j.reviewed_by LEFT JOIN users corrector ON corrector.id=j.correction_requested_by LEFT JOIN finance_entries f ON f.id=j.finance_entry_id WHERE j.id=?`).get(id);
    if(!j)return null;return {...j,...totals(j.id),business_unit_ids:journalUnits(j)};
  }
  function queueScope(req,alias='j'){
    if(req.selected_business_unit_id)return {sql:` AND (${alias}.business_unit_id=? OR (${alias}.business_unit_id IS NULL AND EXISTS(SELECT 1 FROM accounting_journal_lines ql WHERE ql.journal_entry_id=${alias}.id AND ql.business_unit_id=?)))`,args:[Number(req.selected_business_unit_id),Number(req.selected_business_unit_id)]};
    if(req.user.role==='CEO / Owner')return {sql:'',args:[]};
    const assigned=access?.assignedUnits?.(req.user.id)?.map(x=>Number(x.id))||[];if(!assigned.length)return {sql:' AND 1=0',args:[]};
    const marks=assigned.map(()=>'?').join(',');return {sql:` AND (${alias}.business_unit_id IN (${marks}) OR (${alias}.business_unit_id IS NULL AND EXISTS(SELECT 1 FROM accounting_journal_lines ql WHERE ql.journal_entry_id=${alias}.id AND ql.business_unit_id IN (${marks}))))`,args:[...assigned,...assigned]};
  }
  function proposalDocuments(journalId){try{return db.prepare('SELECT * FROM accounting_journal_documents WHERE journal_entry_id=? ORDER BY id').all(journalId)}catch(_){return []}}
  function safeEvidencePath(value){
    let v=text(value);if(!v)return '';
    if(!v.startsWith('/'))v='/uploads/'+v.replace(/^\/+/, '');
    if(!v.startsWith('/uploads/')||v.includes('..')||/[<>"'`]/.test(v))return '';
    return v;
  }
  function evidenceItem(path,label,type='Evidence',name=''){const file_path=safeEvidencePath(path);return file_path?{file_path,evidence_label:text(label)||text(name)||type,evidence_type:type,original_name:text(name)||''}:null}
  function financeEvidence(f){
    if(!f)return [];const out=[];
    const add=x=>{if(x?.file_path&&!out.some(y=>y.file_path===x.file_path&&y.evidence_label===x.evidence_label))out.push(x)};
    add(evidenceItem(f.receipt_file,`Finance #${f.id} · ${f.reference||'Receipt / Evidence'}`,'Finance Evidence'));
    try{for(const a of db.prepare('SELECT title,original_name,file_path FROM finance_attachments WHERE finance_entry_id=? ORDER BY id').all(f.id))add(evidenceItem(a.file_path,a.title||a.original_name,'Finance Attachment',a.original_name))}catch(_){}
    try{
      if(f.source_type==='Excavator Sale'){
        const sale=db.prepare("SELECT id,asset_id FROM excavator_transactions WHERE id=? AND type IN ('Local Sale','Export Sale')").get(f.source_id);if(sale)for(const r of db.prepare(`SELECT p.id payment_id,p.reference,p.receipt_file,d.file_path,d.original_name,d.title FROM excavator_buyer_payment_allocations al JOIN excavator_buyer_payments p ON p.id=al.payment_id LEFT JOIN excavator_buyer_documents d ON d.id=p.receipt_document_id WHERE al.asset_id=? AND COALESCE(al.status,'Active')='Active' AND COALESCE(p.status,'Active')!='Voided' ORDER BY p.id`).all(sale.asset_id))add(evidenceItem(r.file_path||r.receipt_file,r.title||`Buyer Advance #${r.payment_id}${r.reference?' · '+r.reference:''}`,'Buyer Advance Evidence',r.original_name));
      }else if(f.source_type==='Pink Salt Sale'){
        for(const r of db.prepare("SELECT title,original_name,file_path FROM pink_salt_attachments WHERE entity_type='Order' AND entity_id=? ORDER BY id DESC").all(f.source_id))add(evidenceItem(r.file_path,r.title||r.original_name,'Pink Salt Order Evidence',r.original_name));
        for(const r of db.prepare("SELECT id,reference,receipt_file FROM pink_salt_customer_payments WHERE order_id=? AND status='Active' ORDER BY id").all(f.source_id))add(evidenceItem(r.receipt_file,`Customer Payment #${r.id}${r.reference?' · '+r.reference:''}`,'Customer Payment Evidence'));
      }else if(f.source_type==='Pink Salt Import Purchase'){
        for(const r of db.prepare("SELECT title,original_name,file_path FROM pink_salt_attachments WHERE entity_type='Import' AND entity_id=? ORDER BY id DESC").all(f.source_id))add(evidenceItem(r.file_path,r.title||r.original_name,'Import Evidence',r.original_name));
      }else if(f.source_type==='Pink Salt Platform Fee'){
        for(const r of db.prepare("SELECT title,original_name,file_path FROM pink_salt_attachments WHERE entity_type='Order' AND entity_id=? ORDER BY id DESC").all(f.source_id))add(evidenceItem(r.file_path,r.title||r.original_name,'Order / Settlement Evidence',r.original_name));
      }else if(f.source_type==='Pink Salt Customer Receipt'||f.source_type==='Pink Salt Marketplace Settlement Fee'){
        for(const r of db.prepare("SELECT title,original_name,file_path FROM pink_salt_attachments WHERE entity_type='Customer Receipt' AND entity_id=? ORDER BY id DESC").all(f.source_id))add(evidenceItem(r.file_path,r.title||r.original_name,'Customer Receipt Evidence',r.original_name));
      }
    }catch(_){}
    return out;
  }
  function postingEvidence(j,financeInfo=null){
    const out=[],add=x=>{if(x?.file_path&&!out.some(y=>y.file_path===x.file_path&&y.evidence_label===x.evidence_label))out.push(x)};
    for(const d of proposalDocuments(j.id))add(evidenceItem(d.file_path,d.title||d.original_name,'Accounting Evidence',d.original_name));
    const f=financeInfo?.finance||financeInfo||null;if(f)for(const e of financeEvidence(f))add(e);
    return out;
  }
  function canEditManual(req,j){
    if(req.user.role==='CEO / Owner')return true;if(Number(j.created_by)!==Number(req.user.id))return false;const units=journalUnits(j);return units.length>0&&units.every(bu=>access?.canAction?.(req.user.id,'accounting','edit',bu));
  }
  function manualUnitAllowed(req,bu){if(req.user.role==='CEO / Owner')return !!db.prepare("SELECT id FROM business_units WHERE id=? AND status!='Archived'").get(Number(bu));return !!access?.isAssigned?.(req.user.id,Number(bu))&&!!access?.canAction?.(req.user.id,'accounting','edit',Number(bu))}
  function normalizeManualLines(lines,bu){
    if(!Array.isArray(lines)||lines.length<2)throw new Error('At least two journal lines are required.');const normalized=[];
    for(const l of lines){const a=db.prepare('SELECT * FROM accounting_accounts WHERE id=? AND active=1').get(Number(l.account_id));if(!a||!a.allow_manual)throw new Error('One or more selected accounts do not allow manual posting.');const debit=num(l.debit_krw),credit=num(l.credit_krw);if(debit<0||credit<0||(debit>0&&credit>0)||(!(debit>0)&&!(credit>0)))throw new Error('Each journal line must contain either a debit or a credit greater than zero, not both.');normalized.push({account_id:a.id,business_unit_id:Number(bu),debit_krw:debit,credit_krw:credit,memo:text(l.memo)})}
    const dr=normalized.reduce((n,l)=>n+l.debit_krw,0),cr=normalized.reduce((n,l)=>n+l.credit_krw,0);if(dr<=0||Math.abs(dr-cr)>0.005)throw new Error('Manual journal must have equal debit and credit totals.');return {normalized,debit:dr,credit:cr};
  }

  app.get('/api/accounting/posting-control',auth,(req,res)=>{
    const scope=queueScope(req),status=text(req.query.status)||'Pending';let statuses;
    if(status==='All')statuses=['Pending Review','Correction Required','Posted','Cancelled','Reversed'];else if(status==='Posted')statuses=['Posted'];else if(status==='Correction Required')statuses=['Correction Required'];else statuses=['Pending Review','Correction Required'];
    const marks=statuses.map(()=>'?').join(','),rows=db.prepare(`SELECT j.*,b.name business_unit,creator.name created_by_name,reviewer.name reviewed_by_name,
      f.verification_status finance_verification_status,f.reference finance_reference,f.status finance_status,
      ROUND(COALESCE(NULLIF(f.krw_amount,0),NULLIF(f.amount,0),(SELECT COALESCE(SUM(debit_krw),0) FROM accounting_journal_lines l WHERE l.journal_entry_id=j.id)),2) source_amount,
      ROUND((SELECT COALESCE(SUM(debit_krw),0) FROM accounting_journal_lines l WHERE l.journal_entry_id=j.id),2) total_debit,
      ROUND((SELECT COALESCE(SUM(credit_krw),0) FROM accounting_journal_lines l WHERE l.journal_entry_id=j.id),2) total_credit
      FROM accounting_journal_entries j LEFT JOIN business_units b ON b.id=j.business_unit_id LEFT JOIN users creator ON creator.id=j.created_by LEFT JOIN users reviewer ON reviewer.id=j.reviewed_by LEFT JOIN finance_entries f ON f.id=j.finance_entry_id
      WHERE j.status IN (${marks})${scope.sql} ORDER BY CASE j.status WHEN 'Correction Required' THEN 0 WHEN 'Pending Review' THEN 1 ELSE 2 END,date(j.transaction_date) ASC,j.id ASC LIMIT 1000`).all(...statuses,...scope.args);
    const visible=rows.map(raw=>({...raw,business_unit_ids:journalUnits(raw)})).filter(j=>canViewPosting(req,j)).map(j=>{const readiness=financeReadiness(j);return {...j,can_post:canPost(req,j),can_correct:canCorrect(req,j),finance_ready:readiness.ready,finance_readiness_reason:readiness.reason||'',period_closed:periodClosedUnits(j).length>0}});
    // V30.31: the actionable Pending/Correction queue contains only records that Accounting can act on now.
    // Finance-linked proposals wait until Finance verification is complete. The All view still preserves visibility for audit/traceability.
    res.json(status==='All'?visible:visible.filter(j=>['Posted','Cancelled','Reversed'].includes(j.status)||financeReadiness(j).ready));
  });

  app.get('/api/accounting/posting-control/summary',auth,(req,res)=>{
    const scope=queueScope(req),rows=db.prepare(`SELECT j.*,ROUND(COALESCE((SELECT SUM(debit_krw) FROM accounting_journal_lines l WHERE l.journal_entry_id=j.id),0),2) total_debit FROM accounting_journal_entries j WHERE j.status IN ('Pending Review','Correction Required','Posted')${scope.sql}`).all(...scope.args).map(j=>({...j,business_unit_ids:journalUnits(j)})).filter(j=>canViewPosting(req,j));
    const actionable=rows.filter(x=>!['Pending Review','Correction Required'].includes(x.status)||financeReadiness(x).ready);
    res.json({pending:actionable.filter(x=>x.status==='Pending Review').length,correction:actionable.filter(x=>x.status==='Correction Required').length,posted_today:rows.filter(x=>x.status==='Posted'&&String(x.reviewed_at||'').slice(0,10)===new Date().toISOString().slice(0,10)).length,pending_value_krw:actionable.filter(x=>['Pending Review','Correction Required'].includes(x.status)).reduce((n,x)=>n+Number(x.total_debit||0),0)});
  });

  app.get('/api/accounting/posting-control/:id',auth,(req,res)=>{
    const j=detailRow(req.params.id);if(!j||!canSee(req,j)||!canViewPosting(req,j))return res.status(404).json({error:'Accounting proposal not found.'});
    const lines=db.prepare(`SELECT l.*,a.code,a.name account_name,a.account_type,b.name business_unit FROM accounting_journal_lines l JOIN accounting_accounts a ON a.id=l.account_id LEFT JOIN business_units b ON b.id=l.business_unit_id WHERE l.journal_entry_id=? ORDER BY l.id`).all(j.id);
    const hist=db.prepare(`SELECT h.*,u.name user_name FROM accounting_posting_history h LEFT JOIN users u ON u.id=h.user_id WHERE h.journal_entry_id=? ORDER BY h.id DESC`).all(j.id),finance=financeReadiness(j),closed=periodClosedUnits(j),documents=proposalDocuments(j.id),evidence=postingEvidence(j,finance);
    res.json({journal:j,lines,documents,evidence,history:hist,finance,can_post:canPost(req,j),can_correct:canCorrect(req,j),can_cancel:canVoid(req,j)&&j.source_type==='Manual Journal',can_edit_manual:j.source_type==='Manual Journal'&&canEditManual(req,j),period_closed:closed.length>0,closed_business_unit_ids:closed});
  });

  app.post('/api/accounting/posting-control/:id/post',auth,(req,res)=>{
    const j=detailRow(req.params.id);if(!j||!canSee(req,j)||!canViewPosting(req,j))return res.status(404).json({error:'Accounting proposal not found.'});if(!canPost(req,j))return res.status(403).json({error:'Final Accounting posting permission is required for every business unit affected by this proposal.'});
    if(!['Pending Review','Correction Required'].includes(j.status))return res.status(409).json({error:`Only a pending/correction accounting proposal can be posted. Current status: ${j.status}.`});
    if(req.user.role!=='CEO / Owner'&&Number(j.created_by)===Number(req.user.id))return res.status(403).json({error:'Maker/checker control: you cannot final-post an Accounting proposal you created.'});
    if(!j.balanced)return res.status(409).json({error:'The accounting proposal is not balanced and cannot be posted.'});
    const closed=periodClosedUnits(j);if(closed.length)return res.status(409).json({error:'The accounting period is closed for one or more affected business units. Reopen it before final posting.',business_unit_ids:closed});
    const readiness=financeReadiness(j);if(!readiness.ready)return res.status(409).json({error:'Source control / verification checks are not complete for this accounting proposal.',warnings:readiness.warnings});
    if(j.source_type==='Manual Journal'&&!proposalDocuments(j.id).length)return res.status(409).json({error:'Manual journal evidence is missing. Add supporting evidence before final posting.'});
    if(j.source_type==='Accounting Reversal'&&j.reversal_of_id){const original=db.prepare('SELECT * FROM accounting_journal_entries WHERE id=?').get(j.reversal_of_id);if(!original||original.status!=='Posted')return res.status(409).json({error:'The original journal is no longer Posted. Refresh Posting Control before finalizing this reversal.'})}
    const note=text(req.body.note);if(!note)return res.status(400).json({error:'A final-post review note is required.'});
    const tx=db.transaction(()=>{
      const live=db.prepare('SELECT * FROM accounting_journal_entries WHERE id=?').get(j.id);if(!live||!['Pending Review','Correction Required'].includes(live.status))throw new Error('This accounting proposal has already changed. Refresh Posting Control.');
      db.prepare("UPDATE accounting_journal_entries SET status='Posted',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,review_note=?,correction_reason='',posted_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.user.id,note,j.id);
      if(j.source_type==='Accounting Reversal'&&j.reversal_of_id){
        const original=db.prepare('SELECT * FROM accounting_journal_entries WHERE id=?').get(j.reversal_of_id);if(!original||original.status!=='Posted')throw new Error('The original journal changed before the reversal was posted. Refresh Posting Control.');
        db.prepare("UPDATE accounting_journal_entries SET status='Reversed',reversed_by_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(j.id,original.id);
        db.prepare("UPDATE accounting_bank_statement_lines SET status='Unreconciled',matched_journal_entry_id=NULL WHERE matched_journal_entry_id=?").run(original.id);
        if(original.source_type==='Finance Entry'&&original.source_id){const f=db.prepare('SELECT * FROM finance_entries WHERE id=?').get(original.source_id);if(f&&f.status==='Voided'&&Number(f.accounting_journal_id||0)===Number(j.id))db.prepare("UPDATE finance_entries SET accounting_status='Reversed',accounting_journal_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(j.id,f.id)}
      }else if(j.finance_entry_id){db.prepare("UPDATE finance_entries SET accounting_status='Posted',accounting_journal_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(j.id,j.finance_entry_id)}
      history(j,req.user,j.source_type==='Accounting Reversal'?'Reversal Final Posted':'Final Posted',note,j.status,'Posted');
    });
    try{tx()}catch(e){return res.status(409).json({error:e.message})}res.json({ok:true,id:j.id,status:'Posted'});
  });

  app.put('/api/accounting/posting-control/:id/manual',auth,upload.single('evidence'),(req,res)=>{
    const cleanup=()=>{try{if(req.file?.path)require('fs').unlinkSync(req.file.path)}catch(_){}};
    const j=detailRow(req.params.id);if(!j||!canSee(req,j)||!canViewPosting(req,j)){cleanup();return res.status(404).json({error:'Manual journal proposal not found.'})}if(j.source_type!=='Manual Journal'){cleanup();return res.status(409).json({error:'Only a Manual Journal proposal can be edited here.'})}if(!['Pending Review','Correction Required'].includes(j.status)){cleanup();return res.status(409).json({error:'Only an unposted Manual Journal proposal can be edited.'})}if(!canEditManual(req,j)){cleanup();return res.status(403).json({error:'Only the responsible creator (or CEO / Owner) with Accounting edit access can correct this manual proposal.'})}
    const bu=Number(req.body.business_unit_id||j.business_unit_id||0);if(!bu||!manualUnitAllowed(req,bu)){cleanup();return res.status(403).json({error:'You cannot move or edit this manual proposal in the selected business unit.'})}const date=text(req.body.transaction_date).slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){cleanup();return res.status(400).json({error:'Transaction date is required.'})}if(accounting?.isPeriodClosed?.(bu,date)){cleanup();return res.status(409).json({error:'The selected accounting period is closed.'})}
    let lines;try{lines=JSON.parse(req.body.lines_json||'[]')}catch(_){cleanup();return res.status(400).json({error:'Manual journal lines are invalid.'})}let checked;try{checked=normalizeManualLines(lines,bu)}catch(e){cleanup();return res.status(400).json({error:e.message})}const reason=text(req.body.reason||req.body.description);if(!reason){cleanup();return res.status(400).json({error:'A reason/description is required.'})}const existingDocs=proposalDocuments(j.id);if(!existingDocs.length&&!req.file){cleanup();return res.status(400).json({error:'Supporting evidence is required.'})}
    try{db.transaction(()=>{const live=db.prepare('SELECT * FROM accounting_journal_entries WHERE id=?').get(j.id);if(!live||!['Pending Review','Correction Required'].includes(live.status))throw new Error('This proposal changed while you were editing it. Refresh and try again.');db.prepare("UPDATE accounting_journal_entries SET business_unit_id=?,transaction_date=?,description=?,status='Pending Review',correction_requested_by=NULL,correction_requested_at=NULL,correction_reason='',reviewed_by=NULL,reviewed_at=NULL,review_note='',submitted_for_review_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(bu,date,reason,j.id);db.prepare('DELETE FROM accounting_journal_lines WHERE journal_entry_id=?').run(j.id);const ins=db.prepare(`INSERT INTO accounting_journal_lines(journal_entry_id,account_id,business_unit_id,debit_krw,credit_krw,original_amount,original_currency,fx_rate,entity_type,entity_id,dimension_json,memo) VALUES(?,?,?,?,?,0,'KRW',1,'',NULL,'{}',?)`);for(const l of checked.normalized)ins.run(j.id,l.account_id,bu,l.debit_krw,l.credit_krw,l.memo);if(req.file)db.prepare('INSERT INTO accounting_journal_documents(journal_entry_id,title,original_name,file_path,mime_type,size_bytes,uploaded_by) VALUES(?,?,?,?,?,?,?)').run(j.id,'Corrected Manual Journal Evidence',req.file.originalname,'/uploads/'+req.file.filename,req.file.mimetype,req.file.size,req.user.id);history(j,req.user,'Manual Proposal Corrected',reason,j.status,'Pending Review')})();res.json({ok:true,id:j.id,status:'Pending Review'})}catch(e){cleanup();return res.status(409).json({error:e.message})}
  });

  app.post('/api/accounting/posting-control/:id/request-correction',auth,(req,res)=>{
    const j=detailRow(req.params.id);if(!j||!canSee(req,j)||!canViewPosting(req,j))return res.status(404).json({error:'Accounting proposal not found.'});if(!canCorrect(req,j))return res.status(403).json({error:'Accounting/Finance correction permission is required for every affected business unit.'});if(!['Pending Review','Correction Required'].includes(j.status))return res.status(409).json({error:'Only an unposted accounting proposal can be returned for correction.'});
    if(j.source_type==='Accounting Reversal')return res.status(409).json({error:'A system reversal proposal cannot be independently corrected. Resolve the originating source/reversal workflow instead.'});
    const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Correction reason is required.'});let correctionId=null;
    const tx=db.transaction(()=>{
      db.prepare("UPDATE accounting_journal_entries SET status='Correction Required',correction_requested_by=?,correction_requested_at=CURRENT_TIMESTAMP,correction_reason=?,review_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.user.id,reason,reason,j.id);
      if(j.finance_entry_id){const f=db.prepare('SELECT * FROM finance_entries WHERE id=?').get(j.finance_entry_id);if(f&&f.status!=='Voided'){if(Number(f.cash_effect||0)!==0){db.prepare("UPDATE finance_entries SET verification_status='Correction Required',correction_reason=?,verified_by=NULL,verified_at=NULL,verification_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(reason,'Accounting Posting Control requested correction: '+reason,f.id);if(typeof openFinanceCorrection==='function'&&f.created_by)correctionId=openFinanceCorrection({finance:{...f,verification_status:'Correction Required',correction_reason:reason},requestedBy:req.user.id,reason,requestedChanges:reason,severity:'High'});}else if(f.created_by&&Number(f.created_by)!==Number(req.user.id)){try{notify(f.created_by,'Warning','Operational source correction required',`${j.journal_no}: ${reason}`,j.business_unit_id||journalUnits(j)[0]||null,f.source_type,f.source_id,'accounting',j.id)}catch(_){}}}}
      else if(j.created_by&&Number(j.created_by)!==Number(req.user.id)){try{notify(j.created_by,'Warning','Accounting correction required',`${j.journal_no}: ${reason}`,j.business_unit_id||journalUnits(j)[0]||null,'accounting_journal',j.id,'accounting',j.id)}catch(_){}}
      history(j,req.user,'Correction Requested',reason,j.status,'Correction Required');
    });
    try{tx()}catch(e){return res.status(409).json({error:e.message})}res.json({ok:true,id:j.id,status:'Correction Required',finance_correction_id:correctionId});
  });

  app.post('/api/accounting/posting-control/:id/cancel-proposal',auth,(req,res)=>{
    const j=detailRow(req.params.id);if(!j||!canSee(req,j)||!canViewPosting(req,j))return res.status(404).json({error:'Accounting proposal not found.'});if(!canVoid(req,j))return res.status(403).json({error:'Accounting void permission is required for every affected business unit.'});if(!['Pending Review','Correction Required'].includes(j.status))return res.status(409).json({error:'Only an unposted proposal can be cancelled.'});if(j.source_type!=='Manual Journal')return res.status(409).json({error:'Only a standalone Manual Journal proposal can be cancelled here. Correct or void the operational source for system-generated proposals.'});if(j.finance_entry_id)return res.status(409).json({error:'This proposal is linked to a Finance/source transaction. Correct or void the source instead of cancelling Accounting only.'});const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Cancellation reason is required.'});db.prepare("UPDATE accounting_journal_entries SET status='Cancelled',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,review_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.user.id,reason,j.id);history(j,req.user,'Proposal Cancelled',reason,j.status,'Cancelled');res.json({ok:true,status:'Cancelled'});
  });

  console.info('Blue Ocean Market V30.18.0 Posting Control installed');
  return {version:VERSION};
}

module.exports={install};
