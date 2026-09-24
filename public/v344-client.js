// Blue Ocean Market V30.44.0 — persistent shared Cash & Bank account actions.
(function(){
'use strict';
const VERSION='30.44.0';
window.__BLUE_OCEAN_V344_ACTIVE=true;
const style=document.createElement('style');
style.id='v344-account-actions';
style.textContent='.v344-account-action{margin-top:10px;min-height:35px}.v344-account-open{min-height:34px;white-space:nowrap}.v290-tabs .v344-account-open{white-space:nowrap}';
document.head.appendChild(style);
// Both Accounting views now render the same v343OpenAccount action in their own
// source templates. It is not an ephemeral post-render button injection.
const oldClose=window.v343CloseAccount;
if(typeof oldClose==='function'){
  window.v343CloseAccount=function(){
    const advanced=localStorage.getItem('blueOceanAccountingMode')==='advanced';
    if(!advanced)return oldClose.apply(this,arguments);
    // The V30.43 explicit close always called the Simple tab regardless of origin.
    // Preserve Advanced Accounting and its already selected Cash & Bank tab.
    try{sessionStorage.removeItem('bom_v343_workflow_context')}catch(_){}
    return typeof window.closeWorkflowPageV324==='function'?window.closeWorkflowPageV324(true):undefined;
  };
  try{v343CloseAccount=window.v343CloseAccount}catch(_){}
}
window.__BOM_V344={version:VERSION,accountDetailAction:'v343OpenAccount',persistentIn:['simple-cash','advanced-cash']};
console.info('Blue Ocean Market V'+VERSION+' persistent Cash & Bank account actions loaded');
})();
