/* Blue Ocean Market V30.42.0 — actionable task workflows, Finance correction routing, access clarity. */
(function(){
'use strict';
const VERSION='30.42.0';
window.__BLUE_OCEAN_V342_ACTIVE=true;

function openTaskV342(taskId){
  const id=Number(taskId||0);if(!id)return toast('Linked workflow task was not found.');
  try{closeModal(true)}catch(_){}
  try{closeWorkflowPageV324(true)}catch(_){}
  go('tasks');setTimeout(()=>taskDetail(id),320);
}
window.openTaskV342=openTaskV342;

// User-facing correction history intentionally excludes raw metadata/technical JSON.
window.correctionHistoryHtml=function(history){
  const rows=[];for(const h of history||[]){const changes=h.data?.changed_fields||[];if(changes.length){for(const c of changes)rows.push({h,c})}else rows.push({h,c:null})}
  return `<div class="table-wrap"><table class="table v342-history-table"><tr><th>Date/Time</th><th>User</th><th>Action</th><th>Status</th><th>Field Changed</th><th>Old Value</th><th>New Value</th><th>Reason / Note</th></tr>${rows.map(({h,c})=>`<tr><td data-no-i18n>${esc(h.created_at||'')}</td><td data-no-i18n>${esc(h.user_name||'System')}</td><td>${esc(t(h.action||''))}</td><td>${esc(t(h.status_after||''))}</td><td>${c?esc(t(c.label||c.field||'')):'—'}</td><td data-no-i18n>${c?esc(correctionValue(c.old_value)):'—'}</td><td data-no-i18n>${c?esc(correctionValue(c.new_value)):'—'}</td><td data-no-i18n>${esc(h.note||'')}</td></tr>`).join('')||'<tr><td colspan="8" class="empty">No correction history.</td></tr>'}</table></div>`;
};

// Keep the mature Finance detail implementation, but replace any correction edit route with the canonical task route.
const financeOpenBefore342=window.financeOpen;
if(typeof financeOpenBefore342==='function')window.financeOpen=async function(id){
  const r=await financeOpenBefore342.apply(this,arguments);
  try{
    const d=await api('/api/finance/'+id+'/detail'),taskId=Number(d.correction?.task_id||0);
    if(d.can_correct&&taskId){
      const surface=document.getElementById('v324WorkflowSurface')||document.querySelector('.workflow-page,.finance-review-modal')?.parentElement||document;
      for(const btn of surface.querySelectorAll?.('button')||[]){
        const txt=String(btn.textContent||'').trim();
        if(/^(Correct\s*&\s*Resubmit|Edit\s*\/\s*Correct)$/i.test(txt)){
          btn.textContent='Open Correction Task';btn.onclick=()=>openTaskV342(taskId);
        }
      }
    }
  }catch(e){console.warn('V30.42 Finance task routing:',e.message)}
  return r;
};

// Defensive rule: even an older/indirect UI path cannot open a generic Edit Finance modal for an active correction.
const financeEditBefore342=window.financeEdit;
if(typeof financeEditBefore342==='function')window.financeEdit=async function(id,correctionId=0){
  try{const d=await api('/api/finance/'+id+'/detail');if(d.can_correct&&d.correction?.task_id)return openTaskV342(d.correction.task_id)}catch(_){}
  return financeEditBefore342.apply(this,arguments);
};

function financeCorrectionContext342(d){
  const f=d.finance||{},pa=d.payment_account||{},ra=d.receiver_account||{},source=d.source||{};
  const paidFrom=pa.name?`${pa.name}${pa.bank_name?' · '+pa.bank_name:''}${pa.account_number_masked?' · '+pa.account_number_masked:''}`:(f.payment_method||'—');
  const paidTo=ra.name?`${ra.name}${ra.label?' · '+ra.label:''}${ra.account_number_masked?' · '+ra.account_number_masked:''}`:(source.party||source.record||f.description||'—');
  return `<section class="card"><div class="section-title"><div><h3>Original Transaction Context</h3><div class="muted">Review the original money movement before making the requested correction.</div></div></div><div class="detail-list"><div><small>Finance Record</small><b>#${Number(f.id||0)}</b></div><div><small>Paid From</small><b data-no-i18n>${esc(paidFrom)}</b></div><div><small>Paid To</small><b data-no-i18n>${esc(paidTo)}</b></div><div><small>Amount</small><b>${money(f.original_amount||f.amount||0)} ${esc(f.original_currency||'KRW')} ${String(f.original_currency||'KRW')!=='KRW'?`· ₩ ${money(f.krw_amount||f.amount||0)}`:''}</b></div><div><small>Payment Method</small><span>${esc(t(f.payment_method||'—'))}</span></div><div><small>Reference</small><span data-no-i18n>${esc(f.reference||'—')}</span></div><div><small>Transaction Date</small><span data-no-i18n>${esc(f.transaction_date||f.created_at||'—')}</span></div><div><small>Source</small><span data-no-i18n>${esc(source.label||f.source_type||'Manual')} ${f.source_id?'#'+f.source_id:''}</span></div></div></section>`;
}

// Canonical correction action launched from Task: dedicated full workflow page, never the generic finance edit modal.
window.financeCorrectionRespond=async function(id,taskId=0){
  try{
    await api('/api/finance/corrections/'+id+'/view',{method:'POST'});
    const d=await api('/api/finance/corrections/'+id);if(!d.can_correct)return toast('Only the original record creator can correct and resubmit this transaction.');
    taskId=Number(taskId||d.task?.id||d.correction?.task_id||0);
    const fields=(d.form?.fields||[]).map(field=>correctionFieldHtml(field,d.form.record)).join(''),atts=d.attachments||[],linked=d.linked_evidence||[],accountControlled=Number(d.finance.cash_effect||0)!==0||Number(d.finance.payment_account_id||0)>0,accounts=accountControlled?await v319PaymentAccounts(d.finance.business_unit_id):[];
    const cancel=taskId?`openTaskV342(${taskId})`:`closeWorkflowPageV324(true);financeCorrectionOpen(${id})`;
    openWorkflowHtmlV324(`<div class="finance-review-header"><div><button type="button" class="btn small" onclick="${cancel}">← Back</button><h2>Correct & Resubmit Finance Entry</h2><div class="muted">Finance #${d.finance.id} · Task ${taskId?'#'+taskId:'workflow'}</div></div><span class="pill warn">${esc(t(d.correction.status))}</span></div><div class="review-warning critical"><b>Correction requested</b><span data-no-i18n>${esc(d.correction.reason)} · ${esc(d.correction.requested_changes||'')}</span></div>${financeCorrectionContext342(d)}<form data-finance-id="${d.finance.id}" data-task-id="${taskId}" onsubmit="saveFinanceCorrection(event,${id},${d.finance.id},${taskId})" enctype="multipart/form-data"><section class="card"><h3>Corrected Finance Entry</h3><div class="correction-form-grid">${fields}${accountControlled?`<div class="field"><label>Company Financial Account *</label><select name="payment_account_id" required>${v319PaymentAccountOptions(accounts,d.finance.payment_account_id||'')}</select><small class="muted">Duplicate references are checked only against other transactions on this selected account.</small></div>`:''}</div></section><section class="card"><h3>Current / Previous Evidence</h3>${d.finance.receipt_file?`<div class="order-row"><span><button type="button" class="btn small" onclick='previewAttachmentV319(${JSON.stringify(d.finance.receipt_file.startsWith('/')?d.finance.receipt_file:'/uploads/'+d.finance.receipt_file)},"Finance receipt","")'>View Current Receipt</button><small class="muted">Existing evidence stays linked unless explicitly removed or replaced.</small></span><label><input type="checkbox" name="remove_receipt_file" value="1"> Remove from active</label></div>`:''}${atts.map(a=>`<div class="order-row ${Number(a.archived||0)?'v319-archived-row':''}"><span><button type="button" class="btn small" onclick='previewAttachmentV319(${JSON.stringify(a.file_path)},${JSON.stringify(a.original_name||a.title||'Evidence')},${JSON.stringify(a.mime_type||'')})'>View · ${esc(a.original_name||a.title||'Evidence')}</button><small class="muted">${Number(a.archived||0)?'Archived history · '+esc(a.archive_reason||''):'Active evidence'}</small></span>${Number(a.archived||0)?'<span class="pill blue">Preserved Original</span>':`<label><input type="checkbox" name="remove_attachment_ids" value="${a.id}"> Remove from active</label>`}</div>`).join('')}${linked.filter(a=>a.file_path).map(a=>`<div class="order-row"><span><button type="button" class="btn small" onclick='previewAttachmentV319(${JSON.stringify(a.file_path)},${JSON.stringify(a.evidence_label||'Linked Evidence')},${JSON.stringify(a.mime_type||'')})'>View · ${esc(a.evidence_label||'Linked Evidence')}</button><small class="muted">Linked source evidence remains preserved.</small></span><span class="pill good">Linked</span></div>`).join('')||''}${!d.finance.receipt_file&&!atts.length&&!linked.length?'<div class="muted">No existing evidence is linked.</div>':''}</section><section class="card"><div class="field"><label>Correction Response *</label><textarea name="response_note" required>${esc(d.correction.response_note||'')}</textarea></div><div class="field"><label>New / Replacement Evidence${d.has_evidence?' (optional)':' *'}</label><input name="attachments" type="file" multiple accept="application/pdf,image/*" ${d.has_evidence?'':'required'}><small class="muted">Old/replaced evidence remains preserved in audit history.</small></div></section><div class="actions"><button type="button" class="btn" onclick="${cancel}">Cancel</button><button class="btn primary">Save & Resubmit</button></div></form>`,'wide finance-review-modal');
    if(accountControlled)v3241CorrectionAccountRule(document.querySelector('#v324WorkflowSurface form')||document.querySelector('form[data-finance-id="'+d.finance.id+'"]'));
  }catch(e){toast(e.message)}
};

window.saveFinanceCorrection=async function(e,correctionId,financeId,taskId=0){
  e.preventDefault();const form=e.target;if(!form.reportValidity())return;const fd=new FormData(form),ok=await confirmAction({title:'Save Finance Correction',message:'The linked source record and Finance entry will be updated together and returned to Finance verification. The workflow task will remain open while verification is pending.',confirmLabel:'Save & Resubmit',details:[{label:'Finance Record',value:'#'+financeId},{label:'Workflow Task',value:taskId?'#'+taskId:'Linked correction task'},{label:'Correction Response *',value:fd.get('response_note')}]});if(!ok)return;
  try{const result=await multipartApi('/api/finance/'+financeId,fd,{method:'PUT'});try{closeWorkflowPageV324(true)}catch(_){}toast('Finance correction submitted. Task is now awaiting Finance verification.');if(taskId){go('tasks');setTimeout(()=>taskDetail(taskId),320)}else{go('finance');setTimeout(()=>financeOpen(financeId),320)}if(result.changed_fields?.length)toast(`${result.changed_fields.length} field(s) updated`)}catch(e2){toast(e2.message)}
};

console.info(`Blue Ocean Market V${VERSION} actionable workflow UI loaded`);
})();
