(function(){
'use strict';
const VERSION='30.69.3';
const clean=v=>String(v??'').trim();
let restoring=false, lastRestored='';

function parse(){
  const raw=decodeURIComponent((location.hash||'').replace(/^#/,'')).trim();
  const [path,q='']=raw.split('?'), parts=path.split('/').filter(Boolean), params=new URLSearchParams(q);
  return {view:parts[0]||'',kind:parts[1]||'',id:Number(parts[2]||0),section:params.get('section')||''};
}
function hash(viewName,kind='',id=0,section=''){
  let h='#'+encodeURIComponent(viewName||'dashboard');
  if(kind&&id)h+='/'+encodeURIComponent(kind)+'/'+encodeURIComponent(id);
  if(section)h+='?section='+encodeURIComponent(section);
  return h;
}
function set(viewName,kind='',id=0,section='',replace=true){
  const h=hash(viewName,kind,id,section); if(location.hash===h)return;
  history[replace?'replaceState':'pushState']({view:viewName,kind,id,section},'',h);
}
function wrap(name,route){
  const fn=window[name]; if(typeof fn!=='function'||fn.__v3693)return;
  const wrapped=async function(){
    const args=[...arguments], out=await fn.apply(this,args);
    if(!restoring){const r=route(args); if(r)set(r.view,r.kind,r.id,r.section||'',true)}
    return out;
  };
  wrapped.__v3693=true; wrapped.__v3693Original=fn; window[name]=wrapped;
}
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
  wrap('psProductionDetail',a=>({view:'psProduction',kind:'batch',id:Number(a[0])}));
  // V30.69.2 Pink Salt supplier/import wrappers already write equivalent routes; keep them interoperable.
}
async function restore(){
  if(restoring||typeof me==='undefined'||!me)return;
  const r=parse(); if(!r.view)return;
  const sig=[r.view,r.kind,r.id,r.section].join('|');
  if(sig===lastRestored && r.id)return;
  restoring=true;
  try{
    if(typeof view!=='undefined' && view!==r.view){view=r.view; await window.loadView?.()}
    if(!r.id){lastRestored=sig;return}
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
    else if(r.view==='psImports'&&r.kind==='import')await window.psImportDetail?.(r.id);
    else if(r.view==='psSales'&&r.kind==='order')await (window.psOrderDetail313||window.psOrderDetail)?.(r.id);
    else if(r.view==='psProduction'&&r.kind==='batch')await window.psProductionDetail?.(r.id);
    lastRestored=sig;
  }catch(e){console.warn('V30.69.3 route restore:',e?.message||e)}finally{restoring=false}
}

// Preserve list/form/filter state before a hard refresh where the existing view-state engine can restore it.
window.addEventListener('beforeunload',()=>{try{window.captureViewState?.()}catch(_){}});
window.addEventListener('hashchange',()=>setTimeout(()=>{install();restore()},20));
window.addEventListener('popstate',()=>setTimeout(()=>{install();restore()},20));

// Patch after all existing late-loaded modules have installed their final handlers.
let tries=0;const timer=setInterval(()=>{tries++;install();if(typeof me!=='undefined'&&me){clearInterval(timer);setTimeout(restore,40)}else if(tries>120)clearInterval(timer)},50);
setTimeout(()=>{install();restore()},180);
window.BOMPersistentRouting={version:VERSION,parse,set,restore,hash};
console.info('Blue Ocean Market V'+VERSION+' persistent routing loaded');
})();
