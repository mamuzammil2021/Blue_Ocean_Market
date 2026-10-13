// Blue Ocean Market V30.69.4 — Pink Salt QA 07 Oct completion / regression hardening.
(function(){
'use strict';
const VERSION='30.69.4', num=v=>Number(v||0), text=v=>String(v??'').trim(), T=s=>typeof t==='function'?t(s):s;
const E=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
try{Object.assign(KO,{
 'View Shipment PDF':'선적 PDF 보기','Download Shipment PDF':'선적 PDF 다운로드','No compatible company account is configured.':'호환되는 회사 계정이 설정되어 있지 않습니다.','Select company Cash account':'회사 현금 계정 선택','Select company Bank account':'회사 은행 계정 선택','Fully Paid':'완납','No active company account matches this payment method and currency. Check the currency or account settings.':'이 결제 방식과 통화에 맞는 활성 회사 계좌가 없습니다. 통화 또는 계좌 설정을 확인하세요.','Unable to load company accounts. Please retry.':'회사 계좌를 불러올 수 없습니다. 다시 시도하세요.'
})}catch(_){}
const style=document.createElement('style');style.textContent=`
.v3694-hidden{display:none!important}.v3694-mode-active{background:var(--brand)!important;border-color:var(--brand)!important;color:#fff!important;font-weight:800}.v3694-no-account{color:var(--bad);font-size:12px;margin-top:5px}.v3694-doc-actions{display:contents}.v3694-payment-choice button{min-height:44px}
`;document.head.appendChild(style);
function bu(){return Number(selectedUnitId||me?.business_unit_id||0)}
function typeOfAccount(a){return text(a.financial_account_type||a.payment_type||a.method_type||'Bank').toLowerCase()}
async function companyAccounts(method,currency){
  const qs=new URLSearchParams({business_unit_id:String(bu()),method:text(method)||'Bank',currency:text(currency||'KRW').toUpperCase(),direction:'payment'});
  // Bank accounts may be registered in Korea, Pakistan, or another country.
  // Preserve the backend's active, business-unit, method and currency checks; never force country here.
  const d=await api('/api/v320/financial-accounts/options?'+qs);const wanted=text(method).toLowerCase();
  return (d.accounts||[]).filter(a=>{const ty=typeOfAccount(a);return wanted==='cash'?ty==='cash':wanted==='card'?ty==='card':wanted==='bank'?ty==='bank':true});
}
async function payeeAccounts(supplierId,method,currency){
  const qs=new URLSearchParams({business_unit_id:String(bu()),entity_type:'pink_salt_supplier',entity_id:String(Number(supplierId||0))});
  if(method)qs.set('method',method);let rows=await api('/api/v330/payee-accounts?'+qs);const cur=text(currency).toUpperCase();if(cur)rows=rows.filter(a=>text(a.currency||'KRW').toUpperCase()===cur);return rows;
}
function setOptions(sel,rows,placeholder){if(!sel)return;const old=String(sel.value||'');sel.innerHTML=`<option value="">${E(T(placeholder))}</option>`+(rows||[]).map(a=>`<option value="${Number(a.id)}">${E(a.label||a.name||'Account')} · ${E(a.bank_name||a.financial_account_type||a.payment_type||'')} · ${E(a.currency||'KRW')} ${E(a.account_number_masked||'')}</option>`).join('');const chosen=(rows||[]).find(a=>String(a.id)===old)||(rows||[]).find(a=>Number(a.default_payment||a.is_default||0));if(chosen)sel.value=String(chosen.id)}
function fieldOf(el){return el?.closest('.field')||el?.parentElement}
const paymentLoadEpoch=new WeakMap();
async function refreshPaymentAccounts(form,supplierId){
  if(!form)return;
  const epoch=(paymentLoadEpoch.get(form)||0)+1;
  paymentLoadEpoch.set(form,epoch);const method=text(form.payment_method?.value||'Bank'),currency=text(form.original_currency?.value||'KRW').toUpperCase();
  const from=form.payment_account_id||document.querySelector('[name="payment_account_id"][form="ps369AdvanceForm"]');const to=form.receiver_account_id||document.querySelector('[name="receiver_account_id"][form="ps369AdvanceForm"]');
  if(from){from.innerHTML=`<option value="">${E(T('Loading accounts…'))}</option>`;from.required=true}
  if(to)to.innerHTML=`<option value="">${E(T('Loading accounts…'))}</option>`;
  try{
    const fromRows=await companyAccounts(method,currency);if(paymentLoadEpoch.get(form)!==epoch)return;if(from)delete from.dataset.accountLoadError;setOptions(from,fromRows,method==='Cash'?'Select company Cash account':method==='Bank'?'Select company Bank account':'Select company financial account');
    const paidToField=fieldOf(to);if(method==='Cash'){
      if(to){to.required=false;to.value=''};paidToField?.classList.add('v3694-hidden');
    }else{
      paidToField?.classList.remove('v3694-hidden');const toRows=await payeeAccounts(supplierId,method,currency);if(paymentLoadEpoch.get(form)!==epoch)return;setOptions(to,toRows,'Select supplier Paid To account');if(to)to.required=true;
    }
    let warn=from?.parentElement?.querySelector('.v3694-no-account');if(!fromRows.length&&!warn&&from){warn=document.createElement('div');warn.className='v3694-no-account';warn.textContent=T('No active company account matches this payment method and currency. Check the currency or account settings.');from.insertAdjacentElement('afterend',warn)}else if(fromRows.length&&warn)warn.remove();
    if(form.reference)form.reference.required=method!=='Cash';if(form.fx_rate_to_krw&&currency==='KRW')form.fx_rate_to_krw.value='1';
  }catch(e){if(paymentLoadEpoch.get(form)!==epoch)return;if(from){from.innerHTML=`<option value="">${E(T('Unable to load company accounts. Please retry.'))}</option>`;from.dataset.accountLoadError='1'}toast(T('Unable to load company accounts. Please retry.')+' '+(e?.message||''))}
}
// QA 1/2 — authoritative method/account compatibility for every current Pink Salt supplier payment form.
window.ps369AdvanceRefreshAccounts=async function(form,id){await refreshPaymentAccounts(form,id)};
const oldSupplierPayment=window.psSupplierPayment315;if(oldSupplierPayment)window.psSupplierPayment315=async function(id){const r=await oldSupplierPayment(id);const f=document.getElementById('ps369AdvanceForm');if(f)await refreshPaymentAccounts(f,id);return r};
window.ps369SettlementAccounts=async function(form,id){if(!form)return;await refreshPaymentAccounts(form,window.__ps369SettlementContext?.import?.supplier_id||0);window.ps369SettlementCalc?.(form)};

// QA 6 — deterministic three-mode settlement switching. Hidden sections are disabled so stale required fields cannot block another mode.
window.ps369SetSettlementMode=function(mode){
  const f=document.getElementById('ps369SettlementForm');if(!f)return;let m=['advance','new','both'].includes(mode)?mode:'new',available=num(f.__available_advance?.value);if((m==='advance'||m==='both')&&available<=.005)m='new';
  f.settlement_mode.value=m;document.querySelectorAll('#ps369PaymentChoice [data-mode]').forEach(b=>{const active=b.dataset.mode===m;b.classList.toggle('primary',active);b.classList.toggle('v3694-mode-active',active);b.setAttribute('aria-pressed',active?'true':'false')});
  const adv=document.getElementById('ps369AdvanceFields'),fresh=document.getElementById('ps369NewPaymentFields'),summary=document.getElementById('ps369CombinedSummary');
  if(adv){adv.classList.toggle('v3694-hidden',m==='new');adv.querySelectorAll('input,select,textarea').forEach(x=>x.disabled=m==='new')}
  if(fresh){fresh.classList.toggle('v3694-hidden',m==='advance');fresh.querySelectorAll('input,select,textarea').forEach(x=>x.disabled=m==='advance')}
  if(summary)summary.classList.toggle('v3694-hidden',m==='advance');
  if(m==='advance'){if(f.original_amount)f.original_amount.value='0';if(f.advance_amount_krw&&!num(f.advance_amount_krw.value))f.advance_amount_krw.value=String(Math.min(available,num(f.__outstanding?.value)))}
  if(m==='new'&&f.advance_amount_krw)f.advance_amount_krw.value='0';
  if(m==='both'&&f.advance_amount_krw&&!num(f.advance_amount_krw.value))f.advance_amount_krw.value=String(Math.min(available,num(f.__outstanding?.value)));
  if(m!=='advance')refreshPaymentAccounts(f,window.__ps369SettlementContext?.import?.supplier_id||0).then(()=>window.ps369SettlementCalc?.(f));else window.ps369SettlementCalc?.(f);
};
document.addEventListener('click',e=>{const b=e.target.closest?.('#ps369PaymentChoice [data-mode]');if(b&&!b.disabled){e.preventDefault();window.ps369SetSettlementMode(b.dataset.mode)}});

// QA 3 — Pink Salt account manager saves/archives must targeted-refresh the supplier Accounts section without a page refresh.
function refreshPinkSupplierAccounts(){const id=Number(window.__ps315SupplierAccount?.supplier?.id||0);if(!id)return;const route=(location.hash||'').toLowerCase();if(route.includes('section=accounts')||document.querySelector('[data-ps315-tab="accounts"].primary'))setTimeout(()=>window.ps369SupplierAccounts?.(),0)}
const oldSaveAccount=window.v337SaveAccount;if(oldSaveAccount)window.v337SaveAccount=async function(e){const r=await oldSaveAccount(e);refreshPinkSupplierAccounts();return r};
const oldArchiveAccount=window.v337ArchiveAccount;if(oldArchiveAccount)window.v337ArchiveAccount=async function(id){const r=await oldArchiveAccount(id);refreshPinkSupplierAccounts();return r};
const oldCloseAccount=window.v337CloseAccountManager;if(oldCloseAccount)window.v337CloseAccountManager=function(){const r=oldCloseAccount();refreshPinkSupplierAccounts();return r};

// Routing restoration is owned by BOMRouter.
// QA 5 — category remove controls belong only to their own category row, never in the Edit Import header.
function cleanEditImportRemoveButtons(){const root=document.getElementById('modalRoot'),items=root?.querySelector('#psV310EditItems');if(!items)return;root.querySelectorAll('.ps-remove').forEach(b=>{if(!b.closest('#psV310EditItems .ps-line'))b.remove()});items.querySelectorAll('.ps-line').forEach(row=>{const b=row.querySelector('.ps-remove');if(b){b.style.position='static';b.style.inset='auto';b.style.margin='0';b.style.alignSelf='end'}})}
const oldEditImport=window.psV310EditImport;if(oldEditImport)window.psV310EditImport=async function(id){const r=await oldEditImport(id);cleanEditImportRemoveButtons();setTimeout(cleanEditImportRemoveButtons,0);return r};
const oldDrawEdit=window.psV310DrawEditItems;if(oldDrawEdit)window.psV310DrawEditItems=function(...args){const r=oldDrawEdit.apply(this,args);cleanEditImportRemoveButtons();return r};

// QA 7/8 — clean Import Detail header and expose the generated received-shipment PDF beside the other record actions.
async function fetchShipmentPdf(id,download){const headers={'X-Language':currentLanguage||'en'};if(token)headers.Authorization='Bearer '+token;if(selectedUnitId)headers['X-Business-Unit-ID']=selectedUnitId;const r=await fetch(`/api/pink-salt/imports/${id}/received-pdf-v307?lang=${currentLanguage||'en'}`,{headers});if(!r.ok){let d={};try{d=await r.json()}catch(_){}throw new Error(d.error||'PDF unavailable')}const blob=await r.blob(),url=URL.createObjectURL(blob);if(download){const a=document.createElement('a');a.href=url;a.download=(r.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/)?.[1]||`import_${id}_received.pdf`);document.body.appendChild(a);a.click();a.remove()}else window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),15000)}
window.psViewImportPdf3694=id=>fetchShipmentPdf(id,false).catch(e=>toast(e.message));window.psDownloadImportPdf3694=id=>fetchShipmentPdf(id,true).catch(e=>toast(e.message));
async function polishImportDetail(id){const root=typeof workflowSurfaceV324==='function'?workflowSurfaceV324():document.getElementById('v324WorkflowSurface');if(!root)return;const header=[...root.querySelectorAll('.section-title')].find(x=>x.querySelector('h2')&&text(x.querySelector('h2').textContent).includes(T('Import Detail')));header?.querySelectorAll('button').forEach(b=>{if(/closeModal/.test(b.getAttribute('onclick')||'')||['×','✕','X'].includes(text(b.textContent)))b.remove()});let data;try{data=await api('/api/pink-salt/imports/'+id)}catch(_){return}const actions=root.querySelector('.ps-actions');if(data.status==='Received'&&actions&&!actions.querySelector('[data-v3694-shipment-doc]')){actions.insertAdjacentHTML('beforeend',`<span class="v3694-doc-actions" data-v3694-shipment-doc><button class="btn" onclick="psViewImportPdf3694(${id})">${E(T('View Shipment PDF'))}</button><button class="btn" onclick="psDownloadImportPdf3694(${id})">${E(T('Download Shipment PDF'))}</button></span>`)}try{translateElement(root)}catch(_){}}
const oldImportDetail=window.psImportDetail;if(oldImportDetail)window.psImportDetail=async function(id){const r=await oldImportDetail(id);await polishImportDetail(id);return r};

// QA 9 fallback: if legacy data says Received, never display the pre-receipt phrase "Ready to Receive" in a visible import-list row.
function fixReceivedListLabels(){document.querySelectorAll('#psImportTableBody tr,table tr').forEach(row=>{const cells=[...row.children];if(!cells.some(c=>/^received$/i.test(text(c.textContent))))return;for(const c of cells)if(/Fully Paid\s*\/\s*Ready to Receive/i.test(text(c.textContent)))c.textContent=T('Fully Paid')})}
if(window.BOMMutationHub?.register)window.BOMMutationHub.register('v3694-pink-import-status',fixReceivedListLabels);setTimeout(fixReceivedListLabels,0);
window.__BOM_V3694={version:VERSION,qa_points:9,reused_from_excavator:['payment_method_account_compatibility','targeted_profile_refresh','persistent_record_routes','payment_source_choice']};
console.info('Blue Ocean Market V'+VERSION+' Pink Salt QA 07 Oct hardening loaded');
})();
