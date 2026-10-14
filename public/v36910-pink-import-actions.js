// V30.69.10 — Pink Salt import actions: zero-advance feedback, cost cancel, settled payment visibility.
(function(){
'use strict';
const T=s=>typeof t==='function'?t(s):s;
const message='No supplier advance is available for this import. Select New Payment Only to record a payment.';
try{Object.assign(KO,{'No supplier advance is available for this import. Select New Payment Only to record a payment.':'이 수입 건에 사용 가능한 공급업체 선급금이 없습니다. 지급을 기록하려면 신규 지급만 선택하세요.'})}catch(_){ }
function alertUnavailable(){const f=document.getElementById('ps369SettlementForm');if(!f)return;const note=document.getElementById('ps36910AdvanceHint');if(note){note.textContent=T(message);note.setAttribute('role','alert');note.focus({preventScroll:true})}else if(typeof toast==='function')toast(T(message));}
function paymentChoice(){const f=document.getElementById('ps369SettlementForm');const group=document.getElementById('ps369PaymentChoice');if(!f||!group)return;
 const available=Number(f.elements.namedItem('__available_advance')?.value||0);
 if(available>.005)return;
 const duplicate=document.getElementById('ps3699NoAdvance');if(duplicate)duplicate.remove();
 let note=document.getElementById('ps36910AdvanceHint');if(!note){note=document.createElement('div');note.id='ps36910AdvanceHint';note.className='ps3699-info ps3699-advance-unavailable';note.tabIndex=-1;group.insertAdjacentElement('afterend',note)}
 note.textContent=T(message);
 group.querySelectorAll('[data-mode="advance"],[data-mode="both"]').forEach(button=>{button.disabled=false;button.removeAttribute('aria-disabled');button.title=T(message);button.setAttribute('aria-describedby','ps36910AdvanceHint');button.onclick=function(ev){ev?.preventDefault();alertUnavailable();return false}});
}
const oldPayment=window.psImportPayment;
window.psImportPayment=async function(id){const result=await oldPayment?.(id);paymentChoice();return result};
// Guard programmatic use too; no allocation is permitted when available advance is zero.
const oldSetMode=window.ps369SetSettlementMode;
window.ps369SetSettlementMode=function(mode){const f=document.getElementById('ps369SettlementForm');if(f&&Number(f.elements.namedItem('__available_advance')?.value||0)<=.005&&(mode==='advance'||mode==='both')){alertUnavailable();return}return oldSetMode?.apply(this,arguments)};
// Replace only the Cancel action for the Import Cost form, leaving Save/verification unchanged.
const oldCost=window.psImportCost;
window.psImportCost=async function(id){const result=await oldCost?.(id);const root=document.getElementById('modalRoot');const form=[...root.querySelectorAll('form')].find(f=>(f.getAttribute('onsubmit')||'').includes('psSaveImportCost('));if(!form)return result;
 const cancel=[...form.querySelectorAll('button')].find(b=>b.type==='button'&&(/psImportDetail\(/.test(b.getAttribute('onclick')||'')||b.textContent.trim()===T('Cancel')));
 if(cancel){cancel.setAttribute('onclick','');cancel.onclick=function(ev){ev.preventDefault();ev.stopPropagation();if(window.__bomProcessingActive===true)return false;closeModal(true);return false};}
 return result};
// Keep payments hidden for fully settled imports, including after later async decorators.
const oldDetail=window.psImportDetail;
window.psImportDetail=async function(id){const r=await oldDetail?.(id);let data;try{data=await api('/api/pink-salt/imports/'+id)}catch(_){return r}if(!data)return r;
 const root=typeof workflowSurfaceV324==='function'?workflowSurfaceV324():document.getElementById('v324WorkflowSurface');if(!root)return r;
 await window.BOMPinkFX?.history('import',id,root);const eligibility=await api('/api/pink-salt/imports/'+id+'/receive-eligibility');root.querySelectorAll('button[onclick*="psReceiveImport("]').forEach(b=>{b.disabled=!eligibility.ready_to_receive;b.setAttribute('aria-disabled',String(!eligibility.ready_to_receive));if(!eligibility.ready_to_receive){b.title=(currentLanguage==='ko'?'공급업체 정산 및 재무 검증 필요. 잔액: ':'Requires full supplier settlement and Finance verification. Outstanding: ')+'₩'+Number(eligibility.outstanding_krw).toLocaleString();b.textContent='🔒 '+T('Receive Shipment')}});
 const outstanding=Number(data.outstanding_krw);
 if(Number.isFinite(outstanding)&&outstanding<=.01){root.querySelectorAll('.ps-actions button[onclick*="psImportPayment("]').forEach(b=>b.remove())}
 return r};
})();
