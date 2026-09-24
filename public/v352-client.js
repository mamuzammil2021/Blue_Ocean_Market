// Blue Ocean Market V30.52.0 — QA repair layer.
// Preserves V30.51 lazy modules, request scheduler, targeted refresh, and permissions.
(()=>{'use strict';
const VERSION='30.52.0';
const profileEndpoints=/^\/api\/(?:v\d+\/)?(?:excavator(?:\/|$)|finance(?:\/|$)|accounting(?:\/|$)|v\d+\/.*(?:counterparty|payee|accounts))/i;
let profileTimer=null;
const priorFetch=window.fetch;
window.fetch=async function(input,init){
  const response=await priorFetch.apply(this,arguments);
  const method=String(init?.method||input?.method||'GET').toUpperCase();
  if(response?.ok&&!['GET','HEAD','OPTIONS'].includes(method)){
    const url=typeof input==='string'?input:String(input?.url||'');
    let path='';try{path=new URL(url,window.location.href).pathname}catch(_){path=url.split('?')[0]}
    if(profileEndpoints.test(path)){
      clearTimeout(profileTimer);
      profileTimer=setTimeout(()=>{
        try{window.BOMProgressive?.invalidate?.('');window.BOMInvalidateProfilesV352?.()}catch(e){console.warn('V30.52 profile invalidation:',e.message)}
      },35);
    }
  }
  return response;
};

// Sidebar selection is an explicit request to go to the primary module. Child-detail
// restoration is only for deliberate refresh/return, not a fresh main-tab selection.
const previousGo=window.go;
if(typeof previousGo==='function'){
  const go352=function(v,opts={}){
    const current=typeof view!=='undefined'?view:window.view;
    if((v==='finance'||v==='accounting')&&v===current){
      try{sessionStorage.removeItem('bom_v343_workflow_context')}catch(_){}
      if(v==='accounting')window.__v318AccountingPostingMode=false;
      // The protected go() already performs a targeted current-view refresh;
      // clearing the child context beforehand prevents an old detail reopening.
    }
    return previousGo.apply(this,arguments);
  };
  window.go=go352;
  try{go=go352}catch(_){}
}

// Reconcile the server-paged Finance selection against actual selected rows.
// Backend independently rechecks permissions, source integrity and active evidence.
let verifying=false;
const bulk352=async function(){
  if(verifying)return;
  const ids=[...new Set([...document.querySelectorAll('#financeTableBody .finance-bulk:checked')].map(x=>Number(x.value)).filter(Number.isSafeInteger))];
  if(!ids.length)return toast(t('Select one or more low-risk Finance records with evidence.'));
  if(ids.length>50)return toast(t('Bulk verification is limited to 50 records at a time.'));
  const ok=await confirmAction({title:t('Bulk Verify Low-Risk Records'),message:t('Only selected low-value records with evidence and no critical source mismatch will be verified. The server will skip any record that fails the safety checks.'),confirmLabel:t('Verify Selected'),details:[{label:t('Selected records'),value:ids.length}]});
  if(!ok)return;
  const button=[...document.querySelectorAll('#financeRecordsPanel button')].find(b=>String(b.getAttribute('onclick')||'').includes('financeBulkVerify'));
  verifying=true;if(button)button.disabled=true;
  try{
    const result=await api('/api/finance/bulk-verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids})});
    const n=result.verified?.length||0,k=result.skipped?.length||0;
    const reasons=[...new Set((result.skipped_details||[]).map(x=>String(x.reason||'').trim()).filter(Boolean))].slice(0,3);
    if(n)await (typeof window.v3392FinanceReload==='function'?window.v3392FinanceReload():loadView());
    else document.querySelectorAll('#financeTableBody .finance-bulk:checked').forEach(x=>x.checked=false);
    toast(`${n} ${t('verified')}${k?` · ${k} ${t('skipped')}`:''}${reasons.length?` · ${reasons.join('; ')}`:''}`);
  }catch(e){toast(e.message||t('Bulk verification failed.'))}
  finally{verifying=false;if(button?.isConnected)button.disabled=false}
};
window.financeBulkVerify=bulk352;
try{financeBulkVerify=bulk352}catch(_){}

// Explicit selection of eligible rows only; it must not include hidden,
// ineligible, or rows from another server-paginated page.
window.financeToggleVisible=function(checked){
  document.querySelectorAll('#financeTableBody tr').forEach(tr=>{
    if(tr.hidden||tr.style.display==='none')return;
    const control=tr.querySelector('input.finance-bulk:not(:disabled)');
    if(control)control.checked=!!checked;
  });
};
try{financeToggleVisible=window.financeToggleVisible}catch(_){}

// Translation additions for the new action and its state in both locales.
try{Object.assign(KO,{'Sale Document':'판매 문서','Bulk verification is limited to 50 records at a time.':'일괄 검증은 한 번에 최대 50건까지 가능합니다.','verified':'검증 완료','skipped':'건너뜀'})}catch(_){}
window.__BOM_V352={version:VERSION,qa_repairs:true,profile_mutation_invalidation:true,main_tab_navigation:true,bulk_verification:true};
console.info('Blue Ocean Market V'+VERSION+' QA repair layer loaded');
})();
