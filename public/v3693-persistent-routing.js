(function(){
'use strict';
const VERSION='30.69.7';
let restoring=false,lastRestored='';
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
function wrap(name,route){const fn=window[name];if(typeof fn!=='function'||fn.__v3696)return;const wrapped=async function(){const args=[...arguments],out=await fn.apply(this,args);if(!restoring){const r=route(args);if(r)set(r.view,r.kind,r.id,r.section||'',true)}return out};wrapped.__v3696=true;wrapped.__v3693=true;wrapped.__v3693Original=fn;window[name]=wrapped}
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
}
async function restore({renderShell=true}={}){
  if(restoring||typeof me==='undefined'||!me)return;
  if(window.BOMRouteProblemV3697)return;
  const r=normalize(parse());if(!r.view)return;const sig=[r.view,r.kind,r.id,r.section,r.unit].join('|');if(sig===lastRestored&&r.id)return;
  restoring=true;
  try{
    core()?.resolveUnit?.(r);
    if(typeof view!=='undefined'&&view!==r.view){view=r.view;if(renderShell&&typeof render==='function')render();else await window.loadView?.()}
    else if(renderShell&&typeof render==='function'&&!document.getElementById('content'))render();
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
  }catch(e){console.warn('V30.69.6 route restore:',e?.message||e)}finally{restoring=false}
}
async function historyRestore(){
  if(typeof me==='undefined'||!me)return;
  const r=normalize(parse());
  core()?.apply?.();
  lastRestored='';
  if(typeof render==='function')render();
  await restore({renderShell:false});
}

window.addEventListener('beforeunload',()=>{try{window.captureViewState?.()}catch(_){}});
window.addEventListener('hashchange',()=>{install();historyRestore()});
window.addEventListener('popstate',()=>{install();historyRestore()});
let tries=0;const timer=setInterval(()=>{tries++;install();if(typeof me!=='undefined'&&me){clearInterval(timer);setTimeout(()=>restore(),60)}else if(tries>160)clearInterval(timer)},50);
setTimeout(()=>{install();restore()},220);
window.BOMPersistentRouting={version:VERSION,parse:()=>normalize(parse()),set,restore,hash,install};
console.info('Blue Ocean Market V'+VERSION+' persistent routing loaded');
})();
