// V30.47: guarded route-level code splitting for Tasks, Approvals and Documents.
// Existing global workflow/permission layers load normally until a dependency-verified split is safe.
(function(){'use strict';
let pending=null,failed=0;const samples=[];
function ensure(){if(window.BOMPagedWorkspaces347)return Promise.resolve(true);if(pending)return pending;
  pending=new Promise((resolve,reject)=>{const el=document.createElement('script');el.src='/v347-client.js?v=30.51.0';el.async=true;
    el.onload=()=>{if(window.BOMPagedWorkspaces347)resolve(true);else reject(new Error('Paged workspace module did not initialize'))};
    el.onerror=()=>reject(new Error('Paged workspace module unavailable'));document.head.appendChild(el);
  }).catch(e=>{pending=null;failed++;console.warn('V30.47 lazy workspace fallback:',e.message);return false});return pending;
}
const base=window.loadView;
if(typeof base==='function')window.loadView=async function(){
  const screen=typeof view!=='undefined'?view:'',started=performance.now();
  if(['tasks','approvals','documents'].includes(screen)){
    if(!window.BOMPagedWorkspaces347){const host=document.getElementById('content');if(host)host.innerHTML=window.BOMProgressive?.viewShell?.(view)||'<div class="card">Loading…</div>';await ensure()}
  }
  const out=await base.apply(this,arguments);
  // Render may settle later for legacy async sub-sections; record first useful visible section only.
  const host=document.getElementById('content');if(screen===view&&host&&!host.querySelector('.bom-progressive-shell')&&host.querySelector('.card,.table')){
    samples.push({view:screen,first_useful_ms:Math.round(performance.now()-started)});if(samples.length>50)samples.shift();
  }return out;
};
// Navigation uses the historical global function binding; point it at this guarded wrapper.
try{loadView=window.loadView}catch(_){}
window.BOMLazy347={version:'30.49.0',ensure,diagnostics:()=>({ready:!!window.BOMPagedWorkspaces347,failed,first_useful_views:[...samples]})};
})();
