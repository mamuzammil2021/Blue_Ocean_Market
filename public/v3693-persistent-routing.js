(function(){
'use strict';
const VERSION='30.69.8';
let restoring=false,lastRestored='',historyEpoch=0,historyPending=0;
const core=()=>window.BOMRouteCoreV3696;
function parse(){
  const c=core(); if(c?.parse)return c.parse(location.hash);
  const raw=decodeURIComponent((location.hash||'').replace(/^#/,'')).trim(),[path,q='']=raw.split('?'),parts=path.split('/').filter(Boolean),params=new URLSearchParams(q);
  return {raw,path,parts,params,view:parts[0]||'',kind:parts[1]||'',id:Number(parts[2]||0),section:params.get('section')||'',unit:params.get('unit')||''};
}
function normalize(r){return {...r,kind:r.kind||r.parts?.[1]||'',id:Number(r.id||r.parts?.[2]||0),section:r.section||r.params?.get?.('section')||'',unit:r.unit||r.params?.get?.('unit')||''}}
function hash(viewName,kind='',id=0,section=''){
  let path='#'+encodeURIComponent(viewName||'dashboard');if(kind&&id)path+='/'+encodeURIComponent(kind)+'/'+encodeURIComponent(id);
  const q=new URLSearchParams();if(section)q.set('section',section);q.set('unit',typeof selectedUnitId!=='undefined'&&selectedUnitId?String(selectedUnitId):'all');return path+'?'+q.toString();
}
function set(viewName,kind='',id=0,section='',replace=true){const h=hash(viewName,kind,id,section);if(location.hash===h)return;history[replace?'replaceState':'pushState']({view:viewName,kind,id,section,unit:typeof selectedUnitId!=='undefined'?selectedUnitId:''},'',h)}
function wrap(name,route){const fn=window[name];if(typeof fn!=='function'||fn.__v3696)return;const wrapped=async function(){const args=[...arguments],navigationNonce=window.BOMNavigationNonce||0,beforeHash=location.hash,beforeState=history.state,beforeLength=history.length,out=await fn.apply(this,args);if(navigationNonce!==(window.BOMNavigationNonce||0))return out;if(!restoring){const r=route(args);if(r){const target=hash(r.view,r.kind,r.id,r.section||'');if(beforeHash!==target&&history.length===beforeLength&&location.hash!==beforeHash)history.replaceState(beforeState,'',beforeHash);set(r.view,r.kind,r.id,r.section||'',false)}}return out};wrapped.__v3696=true;wrapped.__v3693=true;wrapped.__v3693Original=fn;window[name]=wrapped}
function install(){
  wrap('excavatorOpenMachine',a=>({view:'excavator',kind:'machine',id:Number(a[0])}));
  wrap('excavatorBuyerDetail',a=>({view:'excavatorBuyers',kind:'buyer',id:Number(a[0]),section:window.__v3693BuyerSection||''}));
  wrap('v337BuyerSection',a=>{window.__v3693BuyerSection=a[1]||'payments';return {view:'excavatorBuyers',kind:'buyer',id:Number(a[0]),section:window.__v3693BuyerSection}});
  wrap('v329SupplierOpen',a=>({view:'excavatorSuppliers',kind:'supplier',id:Number(a[0]),section:a[1]||'overview'}));
  wrap('v337SupplierSection',a=>({view:'excavatorSuppliers',kind:'supplier',id:Number(a[0]),section:a[1]||'overview'}));
  wrap('employeeProfileV359',a=>({view:'payroll',kind:'employee',id:Number(a[0]),section:a[1]||'overview'}));
  wrap('employeeProfileV3592',a=>({view:'payroll',kind:'employee',id:Number(a[0]),section:a[1]||'overview'}));
  wrap('financeOpen',a=>({view:'finance',kind:'record',id:Number(a[0])}));
  wrap('financeCorrectionOpen',a=>({view:'finance',kind:'correction',id:Number(a[0])}));
  wrap('taskDetail',a=>({view:'tasks',kind:'task',id:Number(a[0])}));
  wrap('meetingDetail',a=>({view:'meetings',kind:'meeting',id:Number(a[0])}));
  wrap('reportDetail',a=>({view:'reports',kind:'report',id:Number(a[0])}));
  wrap('psOrderDetail',a=>({view:'psSales',kind:'order',id:Number(a[0])}));
  wrap('psOrderDetail313',a=>({view:'psSales',kind:'order',id:Number(a[0])}));
  wrap('psCustomerAccount313',a=>({view:'psCustomers',kind:'customer',id:Number(a[0]),section:new URLSearchParams(location.hash.split('?')[1]||'').get('section')||'orders'}));
  wrap('psProductionDetail',a=>({view:'psProduction',kind:'batch',id:Number(a[0])}));
  // Do not depend exclusively on the separate Pink Salt QA route writer.
  wrap('psSupplierAccount315',a=>({view:'psSuppliers',kind:'supplier',id:Number(a[0]),section:window.__ps3692SupplierTab||'account'}));
  wrap('psImportDetail',a=>({view:'psImports',kind:'import',id:Number(a[0])}));
}
async function restore({renderShell=true}={}){
  if(restoring||typeof me==='undefined'||!me)return;
  if(window.BOMRouteProblemV3697)return;
  const r=normalize(parse());if(!r.view)return;const sig=[r.view,r.kind,r.id,r.section,r.unit].join('|');if(sig===lastRestored&&r.id)return;
  restoring=true;
  try{
    core()?.resolveUnit?.(r);
    if(typeof view!=='undefined'&&view!==r.view){view=r.view;if(renderShell&&typeof render==='function')render()}
    // A successful shell render is not a completed module load. The async list
    // renderer can otherwise overwrite a restored level-3 record afterwards.
    if(renderShell && typeof window.loadView==='function')await window.loadView();
    else if(renderShell&&typeof render==='function'&&!document.getElementById('content'))render();
    if(!r.id){if(r.view==='psSales'&&r.kind==='new')await window.psSaleForm313?.();lastRestored=sig;return}
    if(r.view==='excavator'&&r.kind==='machine')await window.excavatorOpenMachine?.(r.id);
    else if(r.view==='excavatorBuyers'&&r.kind==='buyer'){await window.excavatorBuyerDetail?.(r.id);if(r.section)window.v337BuyerSection?.(r.id,r.section)}
    else if(r.view==='excavatorSuppliers'&&r.kind==='supplier')await window.v329SupplierOpen?.(r.id,r.section||'overview');
    else if(r.view==='payroll'&&r.kind==='employee')await (window.employeeProfileV3592||window.employeeProfileV359)?.(r.id,r.section||'overview');
    else if(r.view==='finance'&&r.kind==='record')await window.financeOpen?.(r.id);
    else if(r.view==='finance'&&r.kind==='correction')await window.financeCorrectionOpen?.(r.id);
    else if(r.view==='tasks'&&r.kind==='task')await window.taskDetail?.(r.id);
    else if(r.view==='meetings'&&r.kind==='meeting')await window.meetingDetail?.(r.id);
    else if(r.view==='reports'&&r.kind==='report')await window.reportDetail?.(r.id);
    else if(r.view==='psSuppliers'&&r.kind==='supplier'){await window.psSupplierAccount315?.(r.id);if(r.section)window.psSupplierTab315?.(r.section)}
    else if(['psImports','psSales'].includes(r.view)&&r.kind==='fx')await window.psFxTransactionDetail?.(r.id);
    else if(r.view==='psImports'&&r.kind==='import')await window.psImportDetail?.(r.id);
    else if(r.view==='psSales'&&r.kind==='order')await (window.psOrderDetail313||window.psOrderDetail)?.(r.id);
    else if(r.view==='psCustomers'&&r.kind==='customer'){await window.psCustomerAccount313?.(r.id);if(r.section){const b=document.querySelector('[data-ps313-tab="'+r.section+'"]');if(b)window.psAccountTab313?.(b,r.section)}}
    else if(r.view==='psProduction'&&r.kind==='batch')await window.psProductionDetail?.(r.id);
    // Only mark record restored when it actually had an opener.
    const handlers={
      'excavator/machine':'excavatorOpenMachine','excavatorBuyers/buyer':'excavatorBuyerDetail',
      'excavatorSuppliers/supplier':'v329SupplierOpen','payroll/employee':'employeeProfileV359',
      'finance/record':'financeOpen','finance/correction':'financeCorrectionOpen',
      'tasks/task':'taskDetail','meetings/meeting':'meetingDetail','reports/report':'reportDetail',
      'psSuppliers/supplier':'psSupplierAccount315','psImports/import':'psImportDetail','psImports/fx':'psFxTransactionDetail','psSales/fx':'psFxTransactionDetail',
      'psCustomers/customer':'psCustomerAccount313','psSales/order':'psOrderDetail','psProduction/batch':'psProductionDetail'
    };
    const key=r.view+'/'+r.kind;
    if(handlers[key] && typeof window[handlers[key]]==='function')lastRestored=sig;
    else console.warn('Deep link has no ready handler:',key);
  }catch(e){console.warn('V30.69.8 route restore:',e?.message||e)}finally{restoring=false}
}
async function historyRestore(){
  if(typeof me==='undefined'||!me)return;
  const epoch=++historyEpoch,startedHash=location.hash;historyPending++;
  try{core()?.apply?.();lastRestored='';if(typeof render==='function')render();if(window.BOMActiveViewLoad)await window.BOMActiveViewLoad;
    if(epoch!==historyEpoch||location.hash!==startedHash)return;
    await restore({renderShell:false});
  }finally{historyPending=Math.max(0,historyPending-1)}
}
window.addEventListener('beforeunload',()=>{try{window.captureViewState?.()}catch(_){}});
window.addEventListener('hashchange',()=>{install();historyRestore()});
window.addEventListener('popstate',()=>{install();historyRestore()});
let tries=0;const timer=setInterval(()=>{tries++;install();if(typeof me!=='undefined'&&me){clearInterval(timer);setTimeout(()=>restore(),60)}else if(tries>160)clearInterval(timer)},50);
setTimeout(()=>{install();restore()},220);
window.BOMPersistentRouting={version:VERSION,parse:()=>normalize(parse()),set,restore,hash,install,diagnostics:()=>({restoring,lastRestored,history_pending:historyPending})};
console.info('Blue Ocean Market V'+VERSION+' persistent routing loaded');
})();
