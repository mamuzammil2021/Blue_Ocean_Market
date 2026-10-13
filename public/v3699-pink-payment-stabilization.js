// V30.69.9 — Pink Salt payment form stabilization.
// Last-loaded UI adapter: consolidates legacy layered account widgets without altering posting endpoints.
(function(){
'use strict';
const T=s=>typeof t==='function'?t(s):s;
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=(f,n)=>f?.elements?.namedItem(n);
const number=v=>Number(v||0);
try{Object.assign(KO,{
 'No supplier advance available. Record a new payment, or create and verify a supplier advance first.':'사용 가능한 공급업체 선급금이 없습니다. 신규 지급을 기록하거나 먼저 공급업체 선급금을 등록하고 확인하세요.',
 'Company cash account':'회사 현금 계정','Company bank account':'회사 은행 계좌',
 'Supplier receiving account':'공급업체 수취 계좌',
 'Select an active company account matching the payment method and currency.':'지급 방식과 통화가 일치하는 활성 회사 계정을 선택하세요.',
 'Enter a positive payment amount.':'0보다 큰 지급 금액을 입력하세요.',
 'The selected account is not available for this payment method.':'선택한 계좌는 이 지급 방식에 사용할 수 없습니다.'
 })}catch(_){}
const style=document.createElement('style');style.textContent=`
.ps3699-hidden{display:none!important}.ps3699-account-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:12px 0}.ps3699-account-row>.field{min-width:0}.ps3699-info{margin:6px 0 12px;color:var(--muted,#637184);font-size:13px}.ps3699-account-row select{width:100%}.ps3699-advance-unavailable{border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--soft,#f7f9fc)}@media(max-width:700px){.ps3699-account-row{grid-template-columns:1fr}}
`;document.head.appendChild(style);
function moveAccounts(form){
 if(!form)return;
 if(form.dataset.psAccountLayout==='native'){const from=$(form,'payment_account_id'),to=$(form,'receiver_account_id');const root=from?.closest('.ps3699-account-row');return from&&to&&root?{from,to,root}:undefined}
 const from=$(form,'payment_account_id')||document.querySelector('[name="payment_account_id"][form="'+form.id+'"]');
 const to=$(form,'receiver_account_id')||document.querySelector('[name="receiver_account_id"][form="'+form.id+'"]');
 if(!from||!to)return;
 // Move existing authoritative controls instead of cloning: one field -> one submitted account ID.
 const paymentMethod=$(form,'payment_method');const anchor=paymentMethod?.closest('.grid')||paymentMethod?.closest('.field');
 const root=from.closest('.v369-paid-sides')||from.closest('.ps3699-account-row');
 if(!root)return;
 root.classList.add('ps3699-account-row');
 if(root.parentElement!==form){const insertion=anchor?([...form.children].find(ch=>ch===anchor||ch.contains(anchor))||null):null;form.insertBefore(root,insertion?.nextSibling||form.firstChild)}
 else if(anchor&&root.previousElementSibling!==anchor){anchor.insertAdjacentElement('afterend',root)}
 root.querySelectorAll('[name="payment_account_id"],[name="receiver_account_id"]').forEach(el=>{if(el!==from&&el!==to)el.remove()});
 from.removeAttribute('form');to.removeAttribute('form');
 const fromLabel=from.closest('.field')?.querySelector('label');if(fromLabel)fromLabel.textContent=T('Company bank account')+' *';
 const toLabel=to.closest('.field')?.querySelector('label');if(toLabel)toLabel.textContent=T('Supplier receiving account')+' *';
 // Previous QA scripts can append obsolete warnings. Remove instead of retaining duplicate feedback.
 form.querySelectorAll('.v3692-account-warning').forEach(el=>el.remove());
 return {from,to,root};
}
function updateVisibility(form){
 const p=moveAccounts(form);if(!p)return;
 const method=String($(form,'payment_method')?.value||'Bank').toLowerCase();
 const isCash=method==='cash';
 p.to.closest('.field')?.classList.toggle('ps3699-hidden',isCash);
 p.to.disabled=isCash;p.to.required=!isCash;
 if(isCash)p.to.value='';
 p.from.required=true;p.from.disabled=false;
 const label=p.from.closest('.field')?.querySelector('label');if(label)label.textContent=T(isCash?'Company cash account':'Company bank account')+' *';
 const ref=$(form,'reference');if(ref)ref.required=!isCash;
}
function guardAccount(form){
 const mode=$(form,'settlement_mode')?.value;
 const cashSection=window.BOMPaymentRules?.requiresSource? !window.BOMPaymentRules.requiresSource(mode):mode==='advance';if(cashSection)return true;
 const original=number($(form,'original_amount')?.value);
 if(original<=0){toast(T('Enter a positive payment amount.'));return false}
 const from=$(form,'payment_account_id');if(!from?.value){toast(T('Select an active company account matching the payment method and currency.'));from?.focus();return false}
 const method=String($(form,'payment_method')?.value||'Bank').toLowerCase();
 if((window.BOMPaymentRules?.requiresCounterparty?.(method,mode)??method!=='cash')&&!$(form,'receiver_account_id')?.value){toast(T('Select supplier Paid To account'));return false}
 return true;
}
// The API is authoritative: all accounts are method/currency filtered by V30.69.4.
let updateSeq=new WeakMap();
async function refresh(form,supplierId){
 if(!form)return;const seq=(updateSeq.get(form)||0)+1;updateSeq.set(form,seq);
 updateVisibility(form);
 const p=moveAccounts(form);if(!p)return;
 p.from.disabled=true;
 try{
   // Use the existing latest QA account loader and preserve its enforced account type filters.
   await window.ps3694LoadPaymentAccounts(form,supplierId);
 }finally{
   if(updateSeq.get(form)===seq){p.from.disabled=false;updateVisibility(form)}
 }
}
// Expose the already filtered account loader before replacing older wrappers; it remains read-only.
const previousRefresh=window.ps369AdvanceRefreshAccounts;
window.ps3694LoadPaymentAccounts=previousRefresh;
window.ps369AdvanceRefreshAccounts=async function(form,id){await refresh(form,id)};
const previousSettlementRefresh=window.ps369SettlementAccounts;
window.ps369SettlementAccounts=async function(form,id){
 if(!form)return;
 updateVisibility(form);
 const mode=$(form,'settlement_mode')?.value;
 if(mode==='advance')return;
 await previousSettlementRefresh?.(form,id);
 updateVisibility(form);
};
const previousSupplier=window.psSupplierPayment315;
window.psSupplierPayment315=async function(id){
 const result=await previousSupplier?.(id);const form=document.getElementById('ps369AdvanceForm');
 if(!form)return result;
 if(form.dataset.psAccountLayout==='native')return result;
 moveAccounts(form);
 // Remove legacy non-authoritative selectors injected by other scripts; never clone submitted IDs.
 const primary=$(form,'payment_account_id');
 document.querySelectorAll('[name="payment_account_id"]').forEach(s=>{if((s.closest('#modalRoot')||s.closest('#ps369AdvanceForm'))&&s!==primary)s.closest('.field')?.remove()});
 const method=$(form,'payment_method');method?.addEventListener('change',()=>{updateVisibility(form)});
 await window.ps369AdvanceRefreshAccounts(form,id);
 return result;
};
const previousSupplierSave=window.psSaveSupplierPayment315;
window.psSaveSupplierPayment315=async function(ev,id){
 ev.preventDefault();const f=ev.target;updateVisibility(f);if(!guardAccount(f))return;
 const source=$(f,'payment_account_id'),dest=$(f,'receiver_account_id');
 // Legacy save reads external form-linked controls; mark these same controls as explicitly linked.
 if(source)source.setAttribute('form',f.id);if(dest)dest.setAttribute('form',f.id);
 return previousSupplierSave?.(ev,id);
};
const previousImport=window.psImportPayment;
window.psImportPayment=async function(id){
 const result=await previousImport?.(id),f=document.getElementById('ps369SettlementForm');if(!f)return result;
 const available=number($(f,'__available_advance')?.value);
 const group=document.getElementById('ps369PaymentChoice');
 if(available<=.005&&group&&!document.getElementById('ps3699NoAdvance')){
   const note=document.createElement('div');note.id='ps3699NoAdvance';note.className='ps3699-info ps3699-advance-unavailable';note.textContent=T('No supplier advance available. Record a new payment, or create and verify a supplier advance first.');group.insertAdjacentElement('afterend',note);
   group.querySelectorAll('[data-mode="advance"],[data-mode="both"]').forEach(b=>{b.title=note.textContent});
 }
 moveAccounts(f);updateVisibility(f);
 const mode=$(f,'settlement_mode')?.value||'new';
 window.ps369SetSettlementMode(mode);
 return result;
};
const previousMode=window.ps369SetSettlementMode;
window.ps369SetSettlementMode=function(mode){
 const f=document.getElementById('ps369SettlementForm');if(!f)return;
 const available=number($(f,'__available_advance')?.value);
 if(available<=.005&&(mode==='advance'||mode==='both'))return;
 previousMode?.(mode);
 moveAccounts(f);updateVisibility(f);
 const active=$(f,'settlement_mode')?.value;
 const row=f.querySelector('.ps3699-account-row');if(row)row.classList.toggle('ps3699-hidden',active==='advance');
 if(row)row.querySelectorAll('select').forEach(s=>{if(active==='advance')s.disabled=true});
};
const previousImportSave=window.ps369SaveSettlement;
window.ps369SaveSettlement=async function(ev,id){
 ev.preventDefault();const f=ev.target;updateVisibility(f);
 if($(f,'settlement_mode')?.value!=='advance'&&!guardAccount(f))return;
 return previousImportSave?.(ev,id);
};
})();
