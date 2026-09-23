// Blue Ocean Market V30.31.0 — lifecycle integrity and QA refinements.
(function(){
'use strict';
const VERSION='30.31.0';
const V331_SINGLE_NAVIGATION='v331-single-navigation'; // QA/release marker: one workflow navigation path only.
window.__BLUE_OCEAN_V331_ACTIVE=true;
try{Object.assign(KO,{
  'Request Reversal':'취소 분개 요청','Request Void':'무효 처리 요청','Lifecycle Stage':'수명주기 단계','Linked Machine':'연결된 장비','Impact Review':'영향 검토','Action unavailable':'작업 불가','Lifecycle Audit':'수명주기 감사','Original record preserved':'원본 기록 보존','Affected records':'영향 받는 기록','Void reason':'무효 처리 사유','Reversal reason':'취소 사유','Review Reversal Impact':'취소 영향 검토','Review Void Impact':'무효 처리 영향 검토','Accounting Posted':'회계 전기 완료','Finance Verified':'재무 검증 완료','Pending Finance Verification':'재무 검증 대기','Correction Required':'수정 필요'
})}catch(_){ }

const style=document.createElement('style');style.id='v331-style';style.textContent=`
/* QA: keep the sidebar scrollable without a visually heavy scrollbar. */
.side .nav{scrollbar-width:thin;scrollbar-color:rgba(150,170,200,.34) transparent}.side .nav::-webkit-scrollbar{width:3px}.side .nav::-webkit-scrollbar-track{background:transparent}.side .nav::-webkit-scrollbar-thumb{background:rgba(150,170,200,.32);border-radius:999px}
/* Full-screen workflows already have one toolbar Back button. */
.v324-workflow-toolbar{padding:8px 10px!important;min-height:48px!important;gap:10px!important}.v324-workflow-heading small{display:none}.v324-workflow-surface{padding-top:10px!important}.v324-workflow-surface .v331-duplicate-nav{display:none!important}.v324-workflow-surface .v324-hide-page-x{display:none!important}
/* Accounting working area: compact, action-first, no repeated introductory card. */
#content.v331-accounting-compact>.v291-guide{display:none!important}#content.v331-accounting-compact .v318-accounting-banner{padding:9px 12px!important;margin-bottom:9px!important;min-height:0!important;gap:8px!important}#content.v331-accounting-compact .v318-accounting-banner span{font-size:12px;line-height:1.35}#content.v331-accounting-compact .v291-advanced-return{padding:7px 10px!important;margin-bottom:9px!important}#content.v331-accounting-compact .v291-advanced-return .muted{display:none}
.v331-policy-note{margin-top:10px;padding:9px 11px;border:1px solid var(--line);border-radius:10px;background:#f7f9fc;color:var(--muted);font-size:12px}.v331-policy-note.warn{border-color:#efcf89;background:#fff9e9;color:#6e5517}.v331-linked-machine{margin-top:10px;padding:10px 11px;border:1px solid #cfe1f6;border-radius:10px;background:#f7fbff}.v331-linked-machine b{display:block;margin-bottom:3px}.v331-impact-list{display:grid;gap:6px}.v331-voided-row{opacity:.82;background:#fff7f7}.v331-voided-row .pill{margin-left:7px}.v331-audit-item{border-left:3px solid #cbd7e6;padding:7px 9px;margin:6px 0;background:#fafcff;border-radius:0 8px 8px 0}.v331-audit-item small{display:block;color:var(--muted);margin-top:2px}
@media(max-width:700px){.v324-workflow-toolbar{padding:7px 8px!important}.v324-workflow-heading b{font-size:13px}.v331-linked-machine{padding:9px}}
`;document.head.appendChild(style);

function impactDetails(policy,base=[]){
  const rows=[...base,{label:'Lifecycle Stage',value:policy?.stage||'—'}];
  (policy?.impacts||[]).slice(0,10).forEach((x,i)=>rows.push({label:(i===0?'Affected records · ':'')+(x.entity||'Record'),value:`${x.record||'—'} — ${x.effect||''}`}));
  return rows;
}
function cleanupWorkflowChrome(){
  const surface=document.getElementById('v324WorkflowSurface'),crumb=document.getElementById('crumbHost');if(!surface)return;
  if(crumb)crumb.style.display='none';
  surface.querySelectorAll('button,[role="button"]').forEach(el=>{const text=String(el.textContent||'').trim().toLowerCase(),code=String(el.getAttribute('onclick')||'');if((text.startsWith('← back')||text.startsWith('back to')||text==='back')&&code.includes('closeWorkflowPageV324'))el.classList.add('v331-duplicate-nav');if(['x','×','✕'].includes(text)&&code.includes('closeWorkflowPageV324'))el.classList.add('v331-duplicate-nav')});
}
function restoreBreadcrumbIfNeeded(){const crumb=document.getElementById('crumbHost');if(crumb&&!document.getElementById('v324WorkflowSurface'))crumb.style.display=''}

// Wrap the final V30.24.1 workflow stack implementation, preserving nested context.
const openWorkflow331=window.openWorkflowHtmlV324,closeWorkflow331=window.closeWorkflowPageV324;
if(typeof openWorkflow331==='function')window.openWorkflowHtmlV324=function(...args){const r=openWorkflow331.apply(this,args);setTimeout(cleanupWorkflowChrome,0);return r};
if(typeof closeWorkflow331==='function')window.closeWorkflowPageV324=function(...args){const r=closeWorkflow331.apply(this,args);setTimeout(()=>{cleanupWorkflowChrome();restoreBreadcrumbIfNeeded()},0);return r};

function compactAccounting(){
  const c=document.getElementById('content');if(!c)return;
  const accountingActive=(typeof view!=='undefined'&&view==='accounting')||!!c.querySelector('.v318-accounting-banner');
  c.classList.toggle('v331-accounting-compact',accountingActive);
}
let compactScheduled=false;window.BOMMutationHub.register('v331-accounting-layout',()=>{if(compactScheduled)return;compactScheduled=true;requestAnimationFrame(()=>{compactScheduled=false;compactAccounting();if(document.getElementById('v324WorkflowSurface'))cleanupWorkflowChrome();else restoreBreadcrumbIfNeeded()})});setTimeout(compactAccounting,0);

async function policy331(id){return api('/api/v331/finance/'+id+'/action-policy')}
async function lifecycleHistory331(id){try{return await api('/api/v331/lifecycle/history?entity_type=finance_entry&entity_id='+encodeURIComponent(id))}catch(_){return []}}
function addFinancePolicyUi(id,p,history){
  const actions=document.querySelector('.finance-actions');if(!actions)return;
  actions.querySelectorAll('button').forEach(b=>{const txt=String(b.textContent||'').trim().toLowerCase(),oc=String(b.getAttribute('onclick')||'');if(txt.includes('request void')||txt.includes('request reversal')||oc.includes('voidFinance('))b.remove()});
  if(p?.can_request){const b=document.createElement('button');b.className='btn danger';b.textContent=t(p.action_label||'Request Void');b.onclick=()=>window.voidFinanceV331(id);actions.appendChild(b)}
  else if(p?.reason){const card=actions.closest('.finance-control-card');if(card&&!card.querySelector('.v331-policy-note')){const n=document.createElement('div');n.className='v331-policy-note'+(p.permission_allowed===false?'':' warn');n.innerHTML=`<b>${esc(t('Action unavailable'))}</b><div>${esc(p.reason)}</div>`;card.appendChild(n)}}
  const machine=p?.source?.machine,sourceCard=[...document.querySelectorAll('.finance-review-grid .card')].find(x=>String(x.querySelector('h3')?.textContent||'').includes('Source'));
  if(machine&&sourceCard&&!sourceCard.querySelector('.v331-linked-machine')){const box=document.createElement('div');box.className='v331-linked-machine';box.innerHTML=`<b>${esc(t('Linked Machine'))}</b><div data-no-i18n>${esc(machine.asset_no||'—')} · ${esc(machine.machine_name||[machine.make,machine.model].filter(Boolean).join(' ')||'Machine')}</div><small>${esc(machine.lifecycle_stage||'—')}${machine.type?' · '+esc(machine.type):''}</small>`;sourceCard.appendChild(box)}
  const timeline=[...document.querySelectorAll('.card')].find(x=>String(x.querySelector('h3')?.textContent||'').includes('Transaction Timeline'));
  if(timeline&&history?.length&&!timeline.querySelector('.v331-audit-list')){const d=document.createElement('div');d.className='v331-audit-list';d.innerHTML=`<h4>${esc(t('Lifecycle Audit'))}</h4>`+history.slice(0,8).map(h=>`<div class="v331-audit-item"><b>${esc(h.action)} · ${esc(h.status)}</b><div>${esc(h.reason||'')}</div><small data-no-i18n>${esc(h.created_at||'')} · ${esc(h.requested_by_name||'')}</small></div>`).join('');timeline.appendChild(d)}
  try{translateElement(document.getElementById('v324WorkflowSurface')||document)}catch(_){ }
}
const financeOpen331=window.financeOpen;
if(typeof financeOpen331==='function')window.financeOpen=async function(id){await financeOpen331(id);try{const [p,h]=await Promise.all([policy331(id),lifecycleHistory331(id)]);addFinancePolicyUi(id,p,h)}catch(e){console.warn('V30.31 Finance policy UI:',e.message)}cleanupWorkflowChrome()};

window.voidFinanceV331=async function(id){
  try{
    const p=await policy331(id);if(!p.can_request)return toast(p.reason||'This transaction cannot be voided/reversed at its current stage.');
    const reversal=p.action_label==='Request Reversal',reason=await reasonAction({title:p.action_label||'Request Void',message:reversal?'This transaction is already posted. The original Finance record and Posted journal will remain; a linked reversal will be created after the controlled approval/review flow.':'The original transaction will remain in audit history. Linked source, Finance, Accounting, balances and reports will be updated together only after the controlled action succeeds.',confirmLabel:reversal?'Review Reversal Impact':'Review Void Impact',tone:'danger',placeholder:reversal?'Reason for reversing this posted transaction':'Reason for voiding this transaction',details:impactDetails(p,[{label:'Finance Record',value:'#'+id},{label:'Original record preserved',value:'Yes'}])});
    if(reason===null)return;
    const r=await api('/api/finance/'+id,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason})});
    toast(r.message||(r.approval_required?`${p.action_label} submitted for approval`:`${p.action_label} completed`));
    if(typeof refreshActionCounts==='function')refreshActionCounts().catch(()=>{});await window.financeOpen(id);
  }catch(e){toast(e.message||'Void / reversal request failed.')}
};
window.voidFinance=window.voidFinanceV331;

async function sourcePolicy331(type,id){return api('/api/v331/source-action-policy?source_type='+encodeURIComponent(type)+'&source_id='+encodeURIComponent(id))}
window.deleteExcavatorCostV319=async function(assetId,txid){
  try{const p=await sourcePolicy331('Excavator Cost Transaction',txid);if(p.blocked||p.allowed===false)return toast(p.reason||'This machine cost cannot be voided at its current stage.');const reason=await reasonAction({title:p.action_label||'Request Machine Cost Void',message:'The machine cost will remain visible with Voided status. Machine cost basis, Finance, Accounting, sold-machine COGS/profit and reports will be updated together where applicable.',confirmLabel:(p.action_label==='Request Reversal'?'Review Reversal Impact':'Review Void Impact'),tone:'danger',placeholder:'Reason for voiding this machine cost',details:impactDetails(p,[{label:'Machine / Deal',value:'#'+assetId},{label:'Machine Cost',value:'#'+txid},{label:'Original record preserved',value:'Yes'}])});if(reason===null)return;const r=await api(`/api/excavator/assets/${assetId}/transactions/${txid}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason})});toast(r.message||(r.approval_required?'Cost void/reversal submitted for approval':'Machine cost voided; linked records synchronized'));if(typeof refreshActionCounts==='function')refreshActionCounts().catch(()=>{});await excavatorOpenMachine(assetId)}catch(e){toast(e.message||'Machine cost void/reversal failed.')}};

window.deleteExcavatorPayment=async function(assetId,paymentId){
  try{const p=await sourcePolicy331('Excavator Payment',paymentId);if(p.blocked||p.allowed===false)return toast(p.reason||'This supplier payment cannot be voided at its current stage.');const reason=await reasonAction({title:p.action_label||'Request Machine Payment Void',message:'The original supplier payment will remain visible for audit. Purchase paid/outstanding, supplier payable, Finance and Accounting will be recalculated together.',confirmLabel:(p.action_label==='Request Reversal'?'Review Reversal Impact':'Review Void Impact'),tone:'danger',placeholder:'Reason for voiding this supplier payment',details:impactDetails(p,[{label:'Machine / Deal',value:'#'+assetId},{label:'Payment',value:'#'+paymentId},{label:'Original record preserved',value:'Yes'}])});if(reason===null)return;const r=await api(`/api/excavator/assets/${assetId}/payments/${paymentId}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason})});toast(r.message||(r.approval_required?'Payment void/reversal submitted for approval':'Supplier payment voided; linked records synchronized'));if(typeof refreshActionCounts==='function')refreshActionCounts().catch(()=>{});await excavatorPayments(assetId)}catch(e){toast(e.message||'Supplier payment void/reversal failed.')}};

console.info('Blue Ocean Market V'+VERSION+' lifecycle integrity UI active');
})();
