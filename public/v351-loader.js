// V30.51: dependency-audited, fail-open Pink Salt read-view module loading.
// Core business/permission/finance/transaction scripts deliberately remain eager.
(function(){'use strict';
const modules=Object.freeze({
 'pink-lists':{path:'/v349-pink-pages.js?v=30.51.0',ready:()=>!!window.BOMPinkPages349},
 'pink-imports':{path:'/v350-import-pages.js?v=30.51.0',ready:()=>!!window.BOMPinkImports350},
 'pink-stock':{path:'/v350-raw-pages.js?v=30.51.0',ready:()=>!!window.BOMPinkRaw350}
});
const routes=Object.freeze({psCustomers:'pink-lists',psSales:'pink-lists',psImports:'pink-imports',psRawStock:'pink-stock'});
const inflight=new Map(),failed=new Map(),loads=new Map();
function ensure(key){const item=modules[key];if(!item)return Promise.resolve(false);if(item.ready())return Promise.resolve(true);
 if(inflight.has(key))return inflight.get(key);
 const attempt=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=item.path;script.async=true;
  script.onload=()=>item.ready()?resolve(true):reject(new Error('Read-view module initialization failed'));
  script.onerror=()=>reject(new Error('Read-view module unavailable'));
  document.head.appendChild(script);
 }).catch(error=>{failed.set(key,(failed.get(key)||0)+1);console.warn('Optional Pink Salt list fallback:',key,error.message);return false})
 .then(ready=>{inflight.delete(key);if(ready)loads.set(key,(loads.get(key)||0)+1);return ready});
 inflight.set(key,attempt);return attempt;
}
const previous=window.loadView;
if(typeof previous==='function')window.loadView=async function(){
 const requested=String(typeof view!=='undefined'?view:'');const key=routes[requested];
 if(key&&!modules[key].ready()){
  const target=document.getElementById('content');
  if(target)target.innerHTML=window.BOMProgressive?.viewShell?.(requested)||'<div class="card">Loading…</div>';
  await ensure(key);
  // Do not render the previous view after the user has navigated elsewhere during script loading.
  if(String(typeof view!=='undefined'?view:'')!==requested)return;
 }
 return previous.apply(this,arguments);
};
try{loadView=window.loadView}catch(_){}
window.BOMLazy351={version:'30.51.0',ensure,route:screen=>routes[String(screen)]||null,
 diagnostics:()=>({loaded:[...loads.keys()],pending:[...inflight.keys()],failures:Object.fromEntries(failed),ready:Object.fromEntries(Object.entries(modules).map(([k,v])=>[k,v.ready()]))})};
})();
