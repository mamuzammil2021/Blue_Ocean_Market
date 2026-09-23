// Blue Ocean Market V30.34.0 — stable UI chrome / slow-connection integrity.
(function(){
'use strict';
const VERSION='30.34.0';
window.__BLUE_OCEAN_V334_ACTIVE=true;

const style=document.createElement('style');style.id='v334-stable-chrome-style';style.textContent=`
/* Persistent navigation/action regions must not animate or collapse while child data changes. */
.v334-stable-region,.v334-stable-region>*{animation:none!important;transition:none!important}
.v334-stable-actions{min-height:40px;align-items:center}
.v291-title-actions.v334-stable-region,.v324-workflow-toolbar.v334-stable-region{will-change:auto}
#v324WorkflowSurface [data-v334-buyer-actions]{min-height:40px}
.v334-local-busy{position:relative;min-height:48px}
.v334-local-busy:after{content:'';position:absolute;right:10px;top:10px;width:15px;height:15px;border:2px solid #d7e2ef;border-top-color:var(--brand);border-radius:50%;animation:v334spin .65s linear infinite}
@keyframes v334spin{to{transform:rotate(360deg)}}
`;
document.head.appendChild(style);

function text(v){return String(v??'').replace(/\s+/g,' ').trim()}
function markStable(root=document){
  root.querySelectorAll?.('.v291-title-actions,.v324-workflow-toolbar,[data-v334-buyer-actions],.titlebar>.actions,.titlebar>.v285-page-actions').forEach(el=>el.classList.add('v334-stable-region'));
  root.querySelectorAll?.('[data-v334-buyer-actions]').forEach(el=>el.classList.add('v334-stable-actions'));
}
function actionSignature(el){
  if(!el)return '';
  return [...el.querySelectorAll('button,a')].map(x=>[
    text(x.textContent).replace(/\d+$/,''),
    x.getAttribute('onclick')||'',
    x.dataset?.v284BuyerStatement?'statement':'',
    x.dataset?.v327PakistanResales?'resales':'',
    x.dataset?.v330BuyerPayee?'payee':'',
    x.dataset?.v332Posting?'posting':''
  ].join('|')).join('||');
}
function dedupeKnownActions(root=document){
  const keys=['data-v284-buyer-statement','data-v327-pakistan-resales','data-v330-buyer-payee','data-v332-posting'];
  root.querySelectorAll?.('.actions,.v291-title-actions,.v285-page-actions').forEach(group=>{
    keys.forEach(k=>{const rows=[...group.querySelectorAll(`[${k}]`)];rows.slice(1).forEach(x=>x.remove())});
  });
}

/* Accounting Simple View: only the selected body is allowed to change.
   The title, Open Finance / Advanced Accounting / Posting Control and tab shell stay mounted. */
function hardenAccountingTabs(){
  if(typeof window.accountingSimpleTabV291!=='function'||window.accountingSimpleTabV291.__v334Stable)return;
  const base=window.accountingSimpleTabV291;
  const wrapped=async function(tab){
    const body=document.getElementById('accountingSimpleBodyV291');
    if(!body)return base.apply(this,arguments);
    const actions=document.querySelector('#content .titlebar .v291-title-actions,#content .titlebar .actions');
    const actionSig=actionSignature(actions);
    const actionRef=actions;
    const out=await base.apply(this,arguments);
    // Defensive restoration for any historical overlay that unnecessarily replaced the title actions.
    const fresh=document.querySelector('#content .titlebar .v291-title-actions,#content .titlebar .actions');
    if(actionRef&&fresh&&fresh!==actionRef&&actionSignature(fresh)===actionSig)fresh.replaceWith(actionRef);
    markStable(document.getElementById('content'));
    return out;
  };
  wrapped.__v334Stable=true;wrapped.__v334Original=base;window.accountingSimpleTabV291=wrapped;
  try{accountingSimpleTabV291=wrapped}catch(_){ }
}

/* Full-screen workflows historically rebuilt their entire shell on detail refresh.
   When the workflow heading is unchanged, keep the toolbar mounted and replace only
   the workflow body. Buyer action controls are also preserved when their semantics
   are unchanged. This removes the 2–3 flashes seen on slow connections. */
function hardenWorkflowRenderer(){
  const base=window.openWorkflowHtmlV324;
  if(typeof base!=='function'||base.__v334Stable)return;
  const wrapped=function(html,classOrOptions='wide',maybeOptions={}){
    const current=document.querySelector('#content .v324-workflow');
    const surface=document.getElementById('v324WorkflowSurface');
    if(!current||!surface)return base.apply(this,arguments);

    const options=typeof classOrOptions==='object'?classOrOptions:(maybeOptions||{});
    const temp=document.createElement('div');temp.innerHTML=String(html||'');
    const newHeading=text(options?.title||temp.querySelector('h1,h2,h3')?.textContent||'');
    const oldHeading=text(current.querySelector('.v324-workflow-heading b')?.textContent||'');
    if(newHeading&&oldHeading&&newHeading!==oldHeading)return base.apply(this,arguments);

    const oldBuyerActions=surface.querySelector('[data-v334-buyer-actions]');
    const freshBuyerActions=temp.querySelector('[data-v334-buyer-actions]');
    if(oldBuyerActions&&freshBuyerActions&&actionSignature(oldBuyerActions)===actionSignature(freshBuyerActions))freshBuyerActions.replaceWith(oldBuyerActions);

    const main=document.querySelector('.main'),scroll=main?.scrollTop||0;
    surface.replaceChildren(...temp.childNodes);
    if(typeof classOrOptions==='string')surface.className=`v324-workflow-surface ${classOrOptions||''}`.trim();
    try{typeof rewritePageOnlyClose==='function'&&rewritePageOnlyClose(surface)}catch(_){ }
    try{typeof translateElement==='function'&&translateElement(surface)}catch(_){ }
    markStable(current);dedupeKnownActions(current);
    if(main)main.scrollTop=scroll;
    return true;
  };
  wrapped.__v334Stable=true;wrapped.__v334Original=base;window.openWorkflowHtmlV324=wrapped;
  try{openWorkflowHtmlV324=wrapped}catch(_){ }
}

/* A buyer detail refresh may be called repeatedly by old linked handlers. Coalesce
   identical in-flight requests so one click cannot produce multiple re-renders. */
function hardenBuyerDetail(){
  const base=window.excavatorBuyerDetail;
  if(typeof base!=='function'||base.__v334Stable)return;
  let pendingId=null,pendingPromise=null,lastId=null,lastAt=0;
  const wrapped=function(id){
    const key=String(id);
    if(pendingPromise&&pendingId===key)return pendingPromise;
    const now=Date.now();
    if(lastId===key&&now-lastAt<120&&document.querySelector('#v324WorkflowSurface [data-v334-buyer-actions]'))return Promise.resolve(true);
    pendingId=key;
    pendingPromise=Promise.resolve(base.apply(this,arguments)).finally(()=>{lastId=key;lastAt=Date.now();pendingId=null;pendingPromise=null;markStable(document);dedupeKnownActions(document)});
    return pendingPromise;
  };
  wrapped.__v334Stable=true;wrapped.__v334Original=base;window.excavatorBuyerDetail=wrapped;
  try{excavatorBuyerDetail=wrapped}catch(_){ }
}

function install(){hardenAccountingTabs();hardenWorkflowRenderer();hardenBuyerDetail();markStable(document);dedupeKnownActions(document)}
let scheduled=false;
BOMMutationHub.register('v334-stable-ui',()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;install()})});
install();setTimeout(install,0);setTimeout(install,400);setTimeout(install,1200);

window.BlueOceanStableUI={
  version:VERSION,
  mark:markStable,
  dedupe:dedupeKnownActions,
  signature:actionSignature,
  async updateSection(target,fn){const el=typeof target==='string'?document.querySelector(target):target;if(window.BlueOceanRefresh?.section)return BlueOceanRefresh.section(el,fn);return fn?.()}
};
console.info(`Blue Ocean Market V${VERSION} stable UI chrome / slow-connection integrity loaded`);
})();
