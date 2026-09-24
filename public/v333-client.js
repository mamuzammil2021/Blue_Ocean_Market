// Blue Ocean Market V30.33.0 — targeted refresh / stable UI response architecture.
(function(){
'use strict';
const VERSION='30.33.0';
window.__BLUE_OCEAN_V333_ACTIVE=true;

try{Object.assign(KO,{
  'Updating…':'업데이트 중…',
  'Refreshing affected data…':'영향받은 데이터 업데이트 중…',
  'Updated':'업데이트됨'
})}catch(_){ }

const style=document.createElement('style');
style.id='v333-targeted-refresh-style';
style.textContent=`
/* V30.33: affected-section loading only. Unaffected UI remains stable. */
.v333-section-busy{position:relative!important;isolation:isolate}.v333-section-busy:after{content:'';position:absolute;top:10px;right:10px;width:15px;height:15px;border:2px solid rgba(80,105,135,.20);border-top-color:var(--brand,#2d6cdf);border-radius:50%;animation:v333spin .72s linear infinite;z-index:7;pointer-events:none}.v333-section-busy:before{content:attr(data-v333-busy-label);position:absolute;top:8px;right:31px;font-size:11px;font-weight:700;color:var(--muted,#65758b);background:rgba(255,255,255,.88);padding:2px 5px;border-radius:6px;z-index:7;pointer-events:none}
.v333-section-busy.v333-dark-busy:before{background:rgba(15,28,51,.88);color:#d8e1ee}
.v333-soft-refresh{position:relative}.v333-soft-refresh>.v333-refresh-indicator{position:absolute;top:8px;right:8px;z-index:10;display:inline-flex;align-items:center;gap:7px;padding:5px 8px;border:1px solid var(--line,#d8e0ea);border-radius:999px;background:rgba(255,255,255,.94);box-shadow:0 2px 8px rgba(20,40,70,.08);font-size:11px;font-weight:700;color:var(--muted,#65758b);pointer-events:none}.v333-refresh-indicator i{display:block;width:13px;height:13px;border:2px solid rgba(80,105,135,.20);border-top-color:var(--brand,#2d6cdf);border-radius:50%;animation:v333spin .72s linear infinite}
.v333-loading-placeholder-suppressed{display:none!important}
@keyframes v333spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.v333-section-busy:after,.v333-refresh-indicator i{animation-duration:1.5s}}
@media(max-width:700px){.v333-section-busy:before{display:none}.v333-soft-refresh>.v333-refresh-indicator{top:5px;right:5px}}
`;
document.head.appendChild(style);

const now=()=>Date.now();
const text=v=>String(v??'').trim();
const isMutation=(method)=>!['GET','HEAD','OPTIONS'].includes(String(method||'GET').toUpperCase());
let lastMutation=null;
let renderSerial=0;
let fallbackTimer=null;
let badgeTimer=null;
let loadDepth=0;
let uiEpoch=0;
let lastRenderedView=(typeof view!=='undefined'?view:'');

function visible(el){return !!(el&&el.isConnected&&el.getClientRects().length)}
function rootForAction(){
  const a=document.activeElement;
  const preferred=a?.closest?.('[data-refresh-scope],#modalRoot .card,#modalRoot form,#v324WorkflowSurface .card,#v324WorkflowSurface section,#content .card,#content section');
  if(visible(preferred))return preferred;
  const workflow=document.getElementById('v324WorkflowSurface');if(visible(workflow))return workflow;
  const modal=document.querySelector('#modalRoot .modal');if(visible(modal))return modal;
  return null;
}
function setBusy(el,on){
  if(!el)return;
  if(on){el.classList.add('v333-section-busy');el.dataset.v333BusyLabel=t('Updating…');el.setAttribute('aria-busy','true')}
  else{el.classList.remove('v333-section-busy');delete el.dataset.v333BusyLabel;el.removeAttribute('aria-busy')}
}
function clearBusy(){document.querySelectorAll('.v333-section-busy').forEach(x=>setBusy(x,false))}

/* Track meaningful workspace DOM changes. Toasts and badges are intentionally excluded. */
const epochObserver=new MutationObserver(muts=>{
  if(muts.some(m=>m.target?.closest?.('#content,#v324WorkflowSurface')))uiEpoch++;
});
try{epochObserver.observe(document.documentElement,{childList:true,subtree:true,characterData:true})}catch(_){ }

function mutationFamily(url=''){
  const u=text(url).toLowerCase();
  if(u.includes('/finance'))return 'finance';
  if(u.includes('/accounting'))return 'accounting';
  if(u.includes('/excavator/buyers'))return 'buyer';
  if(u.includes('/excavator/suppliers'))return 'supplier';
  if(u.includes('/excavator/assets'))return 'machine';
  if(u.includes('/pink-salt/orders')||u.includes('/pink-salt/customers'))return 'ps-sales';
  if(u.includes('/pink-salt/import')||u.includes('/pink-salt/supplier'))return 'ps-purchase';
  if(u.includes('/pink-salt')&&/(stock|production|packaging|waste|finished)/.test(u))return 'ps-stock';
  if(u.includes('/approvals'))return 'approvals';
  if(u.includes('/tasks')||u.includes('/performance'))return 'people';
  if(u.includes('/documents'))return 'documents';
  if(u.includes('/users')||u.includes('/access'))return 'access';
  if(u.includes('/business-units'))return 'business';
  return 'general';
}

/*
 * Replace the old broad post-mutation screen refresh with badge/count sync only.
 * Existing action handlers keep their explicit record/table/detail refreshes. If a
 * handler does not refresh anything, a guarded fallback performs one soft view
 * revalidation later, without the Loading-card flash.
 */
window.scheduleDataSync=function(delay=120){
  clearTimeout(badgeTimer);
  badgeTimer=setTimeout(async()=>{
    if(typeof me==='undefined'||!me)return;
    await Promise.allSettled([
      typeof refreshActionCounts==='function'?refreshActionCounts():null,
      typeof refreshNotifCount==='function'?refreshNotifCount():null
    ]);
  },Math.max(90,Number(delay)||0));
};
try{scheduleDataSync=window.scheduleDataSync}catch(_){ }

function loadingOnly(c){
  if(!c)return false;
  const s=text(c.textContent).replace(/…/g,'...').toLowerCase();
  return c.children.length<=2&&(/^(loading|loading system settings|loading\.\.\.)/.test(s)||s==='loading...');
}
function cleanCloneHtml(node){
  const c=node.cloneNode(true);
  c.classList?.remove('v333-section-busy');c.removeAttribute?.('aria-busy');c.removeAttribute?.('data-v333-busy-label');
  c.querySelectorAll?.('.v333-refresh-indicator').forEach(x=>x.remove());c.querySelectorAll?.('.v333-section-busy').forEach(x=>{x.classList.remove('v333-section-busy');x.removeAttribute('aria-busy');x.removeAttribute('data-v333-busy-label')});
  return c.outerHTML.replace(/\s+/g,' ').trim();
}
function sectionKey(node,index){
  if(!node||node.nodeType!==1)return `node-${index}`;
  if(node.classList.contains('titlebar'))return 'titlebar';
  const h=node.querySelector?.(':scope>h1,:scope>h2,:scope>h3,:scope>.section-title h1,:scope>.section-title h2,:scope>.section-title h3,.label');
  const label=text(h?.textContent).slice(0,90);
  const stable=[...node.classList].filter(x=>!/^v333-/.test(x)&&!['good','bad','warn','active'].includes(x)).slice(0,4).join('.');
  return `${node.tagName}.${stable}|${label||index}`;
}
function reconcileStableSections(c,oldNodes){
  if(!c||!oldNodes?.length)return;
  const buckets=new Map();
  oldNodes.forEach((n,i)=>{const k=sectionKey(n,i);if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(n)});
  [...c.children].forEach((fresh,i)=>{
    if(fresh.classList?.contains('v333-refresh-indicator'))return;
    const k=sectionKey(fresh,i),arr=buckets.get(k);if(!arr?.length)return;
    const old=arr.shift();
    try{if(cleanCloneHtml(old)===cleanCloneHtml(fresh))fresh.replaceWith(old)}catch(_){ }
  });
}
function addRefreshIndicator(c){
  if(!c||c.querySelector(':scope>.v333-refresh-indicator'))return;
  c.classList.add('v333-soft-refresh');
  const e=document.createElement('div');e.className='v333-refresh-indicator';e.innerHTML=`<i></i><span>${esc(t('Refreshing affected data…'))}</span>`;c.prepend(e);
}
function removeRefreshIndicator(c){c?.querySelector(':scope>.v333-refresh-indicator')?.remove();c?.classList.remove('v333-soft-refresh');c?.removeAttribute('aria-busy')}

/* Soft full-view revalidation: keep old content visible while data is fetched and
   reuse unchanged top-level sections after the new data arrives. */
const previousLoadView=(typeof loadView==='function'?loadView:window.loadView);
if(typeof previousLoadView==='function'){
  window.loadView=async function(){
    const c=document.getElementById('content'),currentView=(typeof view!=='undefined'?view:'');
    const mutationSoft=!!(lastMutation&&now()-lastMutation.at<8000&&lastMutation.view===currentView);
    const sameViewSoft=!!(c&&c.children.length&&lastRenderedView===currentView);
    const soft=!!(c&&(mutationSoft||sameViewSoft)&&!document.body.classList.contains('mobile-nav-open'));
    if(!soft){
      try{return await previousLoadView.apply(this,arguments)}
      finally{lastRenderedView=currentView;renderSerial++}
    }
    const oldNodes=[...c.children].filter(x=>!x.classList?.contains('v333-refresh-indicator'));
    const main=document.querySelector('.main'),scroll=main?.scrollTop||0;
    let restoring=false;
    addRefreshIndicator(c);c.setAttribute('aria-busy','true');
    const observer=new MutationObserver(()=>{
      if(restoring||!loadingOnly(c))return;
      restoring=true;
      c.replaceChildren(...oldNodes);
      addRefreshIndicator(c);
      c.setAttribute('aria-busy','true');
      if(main)main.scrollTop=scroll;
      queueMicrotask(()=>{restoring=false});
    });
    observer.observe(c,{childList:true});
    loadDepth++;
    try{
      const out=await previousLoadView.apply(this,arguments);
      observer.disconnect();
      reconcileStableSections(c,oldNodes);
      removeRefreshIndicator(c);
      if(main)main.scrollTop=scroll;
      lastRenderedView=currentView;
      renderSerial++;
      return out;
    }catch(e){observer.disconnect();removeRefreshIndicator(c);lastRenderedView=currentView;renderSerial++;throw e}
    finally{loadDepth=Math.max(0,loadDepth-1)}
  };
  try{loadView=window.loadView}catch(_){ }
}

/* Scope-heavy detail functions so their existing targeted reloads show a small
   local spinner instead of making the entire workspace feel busy. */
function wrapScoped(name,selector){
  const fn=window[name];if(typeof fn!=='function'||fn.__v333Wrapped)return;
  const wrapped=async function(){
    let el=null;try{el=typeof selector==='function'?selector(...arguments):document.querySelector(selector)}catch(_){ }
    if(lastMutation&&now()-lastMutation.at<8000)setBusy(el,true);
    try{return await fn.apply(this,arguments)}finally{setBusy(el,false);renderSerial++}
  };
  wrapped.__v333Wrapped=true;wrapped.__v333Original=fn;window[name]=wrapped;
}
function installScopedWrappers(){
  const workflow=()=>document.getElementById('v324WorkflowSurface');
  const modal=()=>document.querySelector('#modalRoot .modal');
  [
    ['excavatorBuyerDetail',workflow],['excavatorOpenMachine',workflow],['excavatorPayments',modal],['excavatorDocuments',modal],
    ['excavatorSupplierRequirements',modal],['financeOpen',modal],['financeCorrectionRespond',modal],
    ['financePostingControlV318',()=>document.getElementById('content')],['accountingPostingControlV318',()=>document.getElementById('content')],
    ['psImportDetail',modal],['psOrderDetail',modal],['psOrderDetail313',modal],['psProductionDetail',modal],['psCustomerDetail',modal]
  ].forEach(([n,s])=>wrapScoped(n,s));
}
installScopedWrappers();setTimeout(installScopedWrappers,0);setTimeout(installScopedWrappers,500);

function shouldFallback(mutation,epochAtSuccess,serialAtSuccess){
  if(!mutation||now()-mutation.at>3600)return false;
  if((typeof view!=='undefined'?view:'')!==mutation.view)return false;
  if(document.querySelector('#modalRoot .modal'))return false;
  if(document.getElementById('v324WorkflowSurface'))return false;
  if(typeof formDirty!=='undefined'&&formDirty)return false;
  if(renderSerial!==serialAtSuccess)return false;
  if(uiEpoch!==epochAtSuccess)return false;
  return !!document.getElementById('content');
}
function scheduleFallback(mutation,epochAtSuccess,serialAtSuccess){
  clearTimeout(fallbackTimer);
  fallbackTimer=setTimeout(async()=>{
    if(!shouldFallback(mutation,epochAtSuccess,serialAtSuccess))return;
    try{await window.loadView?.()}catch(e){console.warn('V30.33 targeted refresh fallback:',e.message)}
  },900);
}

/* Wrap API after all historical overlays. The wrapper does not change request or
   business behavior; it only records mutation context and attaches local loading. */
const previousApi=(typeof api==='function'?api:window.api);
if(typeof previousApi==='function'){
  window.api=async function(url,opt={}){
    const method=String(opt?.method||'GET').toUpperCase();
    if(!isMutation(method))return previousApi.apply(this,arguments);
    const source=rootForAction(),started=now(),beforeEpoch=uiEpoch,beforeSerial=renderSerial;
    setBusy(source,true);
    try{
      const result=await previousApi.apply(this,arguments);
      lastMutation={url:text(url),method,family:mutationFamily(url),at:now(),started,view:(typeof view!=='undefined'?view:''),businessUnitId:(typeof selectedUnitId!=='undefined'?selectedUnitId:''),beforeEpoch,beforeSerial};
      window.__boLastMutationV333=lastMutation;
      try{window.dispatchEvent(new CustomEvent('bo:mutation-complete',{detail:lastMutation}))}catch(_){ }
      const successEpoch=uiEpoch,successSerial=renderSerial;
      scheduleFallback(lastMutation,successEpoch,successSerial);
      return result;
    }finally{
      setTimeout(()=>setBusy(source,false),120);
    }
  };
  try{api=window.api}catch(_){ }
}

/* Public helper for all future development: features can explicitly invalidate a
   local section without calling the whole screen reload. */
window.BlueOceanRefresh={
  version:VERSION,
  markBusy(el,on=true){setBusy(el,on)},
  async section(el,refreshFn){
    const node=typeof el==='string'?document.querySelector(el):el;setBusy(node,true);
    try{return await refreshFn?.()}finally{setBusy(node,false)}
  },
  mutationFamily,
  lastMutation:()=>lastMutation,
  async counts(){await Promise.allSettled([typeof refreshActionCounts==='function'?refreshActionCounts():null,typeof refreshNotifCount==='function'?refreshNotifCount():null])},
  async view(){return window.loadView?.()}
};

/* Any late-created workflow gets the scoped wrappers too. */
let v333WrapQueued=false;BOMMutationHub.register('v333-scoped-wrappers',()=>{if(v333WrapQueued)return;v333WrapQueued=true;requestAnimationFrame(()=>{v333WrapQueued=false;installScopedWrappers()})});

console.info(`Blue Ocean Market V${VERSION} targeted refresh / stable UI layer loaded`);
})();
