(function(){
'use strict';
const VERSION='30.39.0';
if(window.__BOM_V339)return;

const tr=(en,ko)=>String((typeof currentLanguage!=='undefined'?currentLanguage:'')||localStorage.getItem('bo_language')||'ko').toLowerCase().startsWith('ko')?ko:en;
const safeText=v=>String(v??'').trim();
const style=document.createElement('style');style.id='v339-performance-ui';style.textContent=`
#bomNetworkState{position:fixed;z-index:2147482500;top:12px;left:50%;transform:translateX(-50%) translateY(-18px);display:flex;align-items:center;gap:9px;min-height:38px;max-width:min(92vw,560px);padding:8px 13px;border-radius:999px;background:rgba(21,31,48,.94);color:#fff;box-shadow:0 8px 26px rgba(0,0,0,.22);font-size:13px;font-weight:700;opacity:0;pointer-events:none;transition:opacity .16s ease,transform .16s ease}#bomNetworkState.show{opacity:1;transform:translateX(-50%) translateY(0)}#bomNetworkState .bom-v339-spin,.bom-v339-button-spin{width:15px;height:15px;border:2px solid rgba(255,255,255,.38);border-top-color:currentColor;border-radius:50%;display:inline-block;animation:bomV339Spin .72s linear infinite;flex:0 0 auto}.bom-v339-button-spin{width:13px;height:13px;margin-right:7px;vertical-align:-2px;border-color:currentColor;border-right-color:transparent}.bom-v339-busy{cursor:wait!important;opacity:.82}.bom-v339-busy>*{pointer-events:none}.bom-v339-slow{background:rgba(73,53,16,.96)!important}@keyframes bomV339Spin{to{transform:rotate(360deg)}}
`;(document.head||document.documentElement).appendChild(style);

const stateHost=document.createElement('div');stateHost.id='bomNetworkState';stateHost.setAttribute('role','status');stateHost.setAttribute('aria-live','polite');stateHost.innerHTML='<span class="bom-v339-spin"></span><span data-bom-v339-label></span>';document.body.appendChild(stateHost);
let active=0,showTimer=0,slowTimer=0,recentAction=null;
const buttonState=new WeakMap();
function labelWorking(){return tr('Working…','처리 중…')}
function labelStill(){return tr('Still working… Please keep this window open.','계속 처리 중입니다… 이 창을 열어 두세요.')}
function setHost(slow=false){stateHost.classList.toggle('bom-v339-slow',!!slow);stateHost.querySelector('[data-bom-v339-label]').textContent=slow?labelStill():labelWorking()}
function showHost(){if(active<=0)return;setHost(false);stateHost.classList.add('show');clearTimeout(slowTimer);slowTimer=setTimeout(()=>{if(active>0)setHost(true)},3500)}
function hideHost(){clearTimeout(showTimer);clearTimeout(slowTimer);stateHost.classList.remove('show','bom-v339-slow')}
function actionText(btn){const explicit=btn?.dataset?.processingLabel;if(explicit)return explicit;const text=safeText(btn?.textContent).replace(/^[-+✓✕×🔒\s]+/,'');const lower=text.toLowerCase();if(/pay|payment|refund|transfer|allocate/.test(lower))return tr('Processing payment…','결제를 처리 중…');if(/save|submit|create|add|update|edit/.test(lower))return tr('Saving…','저장 중…');if(/delete|void|archive|remove|cancel/.test(lower))return tr('Processing…','처리 중…');if(/pdf|download|export|print/.test(lower))return tr('Preparing…','준비 중…');if(/approve|verify|post|complete|receive/.test(lower))return tr('Processing…','처리 중…');return labelWorking()}
function busyButton(btn,on){if(!btn||!btn.isConnected)return;if(on){let s=buttonState.get(btn);if(!s){s={count:0,html:btn.innerHTML,disabled:!!btn.disabled,width:btn.getBoundingClientRect().width};buttonState.set(btn,s)}s.count++;if(s.count>1)return;if(s.width>0)btn.style.minWidth=`${Math.ceil(s.width)}px`;btn.disabled=true;btn.setAttribute('aria-busy','true');btn.classList.add('bom-v339-busy');btn.innerHTML=`<span class="bom-v339-button-spin"></span>${safeText(actionText(btn))}`}else{const s=buttonState.get(btn);if(!s)return;s.count=Math.max(0,s.count-1);if(s.count)return;btn.innerHTML=s.html;btn.disabled=s.disabled;btn.removeAttribute('aria-busy');btn.classList.remove('bom-v339-busy');btn.style.minWidth='';buttonState.delete(btn)}}
function eligibleAction(el){const btn=el?.closest?.('button,.btn');if(!btn||btn.disabled)return null;if(btn.closest('#bomNetworkState'))return null;const text=safeText(btn.textContent).toLowerCase();if(/^(close|cancel|back|previous|next|logout|닫기|취소|뒤로)$/.test(text))return null;return btn}
document.addEventListener('click',e=>{const btn=eligibleAction(e.target);if(btn)recentAction={btn,at:Date.now()}},true);
document.addEventListener('submit',e=>{const btn=e.submitter||e.target?.querySelector?.('button[type="submit"],button:not([type])');if(btn)recentAction={btn,at:Date.now()}},true);

function beginRequest(){active++;if(active===1){clearTimeout(showTimer);showTimer=setTimeout(showHost,140)}const a=recentAction&&Date.now()-recentAction.at<1800?recentAction:null;if(a)busyButton(a.btn,true);return a?.btn||null}
function endRequest(btn){if(btn)busyButton(btn,false);active=Math.max(0,active-1);if(active===0)hideHost()}

// Covers direct downloads/fetches as well as the shared api() helper.
const baseFetch=window.fetch.bind(window);window.fetch=async function(){const btn=beginRequest();try{return await baseFetch(...arguments)}finally{endRequest(btn)}};

// Reuse identical in-flight GETs system-wide. This prevents duplicate account/config/list requests
// when several UI components mount at the same time without introducing stale financial caching.
const inFlight=new Map(),apiBefore=window.api;
if(typeof apiBefore==='function'){
  const wrappedApi=function(url,opt={}){
    const method=safeText(opt?.method||'GET').toUpperCase();
    if(method!=='GET'&&method!=='HEAD')return apiBefore.apply(this,arguments);
    const bu=safeText((typeof selectedUnitId!=='undefined'?selectedUnitId:'')||(typeof me!=='undefined'?me?.business_unit_id:'')),lang=safeText((typeof currentLanguage!=='undefined'?currentLanguage:'ko'));
    const key=`${method}|${url}|${bu}|${lang}`;
    if(inFlight.has(key))return inFlight.get(key);
    const p=Promise.resolve(apiBefore.apply(this,arguments)).finally(()=>inFlight.delete(key));inFlight.set(key,p);return p;
  };
  window.api=wrappedApi;try{api=wrappedApi}catch(_){}
}

// Shared debounce/cancel primitives for every current/future remote search.
const searchControllers=new Map(),searchTimers=new Map();
function debounce(key,fn,wait=300){clearTimeout(searchTimers.get(key));return new Promise((resolve,reject)=>{searchTimers.set(key,setTimeout(async()=>{try{resolve(await fn())}catch(e){reject(e)}finally{searchTimers.delete(key)}},Math.max(100,Number(wait)||300)))})}
function abortPrevious(key){try{searchControllers.get(key)?.abort()}catch(_){}const c=new AbortController();searchControllers.set(key,c);return c}
async function remoteSearch(key,url,opt={}){return debounce(key,async()=>{const c=abortPrevious(key);try{return await window.api(url,{...opt,signal:c.signal})}finally{if(searchControllers.get(key)===c)searchControllers.delete(key)}},opt.debounceMs||300)}

// Future modules should publish lifecycle hooks here instead of adding document-wide MutationObservers.
const lifecycleHandlers=new Map();
function onLifecycle(name,handler){if(typeof handler!=='function')return()=>{};if(!lifecycleHandlers.has(name))lifecycleHandlers.set(name,new Set());lifecycleHandlers.get(name).add(handler);return()=>lifecycleHandlers.get(name)?.delete(handler)}
function emitLifecycle(name,payload){for(const fn of lifecycleHandlers.get(name)||[])try{fn(payload)}catch(e){console.warn('BOM lifecycle handler',name,e)}}

// Client diagnostics: report long main-thread tasks in development without affecting production UX.
let longTasks=0;try{if('PerformanceObserver'in window){const po=new PerformanceObserver(list=>{for(const x of list.getEntries()){if(x.duration>=200){longTasks++;if(String(localStorage.getItem('bom_perf_debug')||'')==='1')console.warn(`[PERF][UI] long task ${x.duration.toFixed(1)}ms`)}}});po.observe({type:'longtask',buffered:true})}}catch(_){}

async function pagedApi(url,{page=1,pageSize=25,search='',filters={},sort=''}={}){const q=new URLSearchParams();q.set('page',String(Math.max(1,Number(page)||1)));q.set('pageSize',String([25,50,100].includes(Number(pageSize))?Number(pageSize):25));if(search)q.set('search',search);if(sort)q.set('sort',sort);for(const [k,v] of Object.entries(filters||{}))if(v!==''&&v!=null)q.set(k,String(v));const sep=String(url).includes('?')?'&':'?';return window.api(String(url)+sep+q.toString())}

window.__BOM_V339=window.BOMPerformance={version:VERSION,inFlight,debounce,remoteSearch,pagedApi,onLifecycle,emitLifecycle,diagnostics:()=>({active_requests:active,inflight_gets:inFlight.size,long_tasks:longTasks})};
console.info(`Blue Ocean Market V${VERSION} performance foundation loaded`);
})();
