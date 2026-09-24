// Blue Ocean Market V30.46 — bounded read concurrency (no response caching or write queue).
(()=>{'use strict';if(window.BOMReadScheduler)return;
const MAX=4,HEAVY_MAX=2;let active=0,heavyActive=0,sequence=0;const pending=[];
const stats={started:0,completed:0,aborted:0,max_active:0,total_queued_ms:0};
function classify(input,init){
  let u;try{u=new URL(typeof input==='string'?input:input?.url,location.href)}catch(_){return null}
  const method=String(init?.method||input?.method||'GET').toUpperCase();
  if(!['GET','HEAD'].includes(method)||u.origin!==location.origin||!u.pathname.startsWith('/api/'))return null;
  // Read-only priority never changes account/BU scope, tokens, payload or the API contract.
  const heavy=/(?:\/audit\b|\/documents\b|\/attachments?\b|\/evidence\b|\/history\b|\/statement\b|\/pdf\b|\/export\b)/i.test(u.pathname);
  const critical=/(?:\/health\b|\/me\b|\/context\b|\/business-units\b|\/action-counts\b|\/unread-count\b|\/summary\b|\/dashboard\b)/i.test(u.pathname);
  return {heavy,priority:critical?0:heavy?2:1,signal:init?.signal||input?.signal||null};
}
function abortError(){const e=new Error('Request aborted while queued');e.name='AbortError';return e}
function pump(){while(active<MAX&&pending.length){let idx=-1;
  for(let i=0;i<pending.length;i++)if(!(pending[i].heavy&&heavyActive>=HEAVY_MAX)&&(idx<0||pending[i].priority<pending[idx].priority||pending[i].priority===pending[idx].priority&&pending[i].seq<pending[idx].seq))idx=i;
  if(idx<0)break;const job=pending.splice(idx,1)[0];if(job.signal?.aborted){job.reject(abortError());stats.aborted++;continue}
  job.signal?.removeEventListener?.('abort',job.abort);active++;if(job.heavy)heavyActive++;stats.started++;stats.max_active=Math.max(stats.max_active,active);stats.total_queued_ms+=Math.max(0,performance.now()-job.at);
  Promise.resolve().then(()=>job.fetcher(...job.args)).then(job.resolve,job.reject).finally(()=>{active--;if(job.heavy)heavyActive--;stats.completed++;pump()});
}}
function fetch(fetcher,...args){const category=classify(args[0],args[1]);if(!category)return fetcher(...args);
  if(category.signal?.aborted)return Promise.reject(abortError());return new Promise((resolve,reject)=>{
  const job={fetcher,args,resolve,reject,...category,seq:++sequence,at:performance.now(),abort:null};
  job.abort=()=>{const idx=pending.indexOf(job);if(idx>=0){pending.splice(idx,1);job.signal?.removeEventListener?.('abort',job.abort);stats.aborted++;reject(abortError());pump()}};
  job.signal?.addEventListener?.('abort',job.abort,{once:true});pending.push(job);pump();
});}
window.BOMReadScheduler={version:'30.46.0',fetch,diagnostics:()=>({active,heavy_active:heavyActive,queued:pending.length,max_active:stats.max_active,started:stats.started,completed:stats.completed,aborted:stats.aborted,mean_queued_ms:stats.started?Math.round(stats.total_queued_ms/stats.started):0}),limits:{max:MAX,max_heavy:HEAVY_MAX}};
})();
