// Route-specific, fail-open load: only Notifications fetches the scroll-card module.
(function(){'use strict';let pending=null,failures=0;const previous=window.loadView;
function ensure(){if(window.BOMSmartNotifications348)return Promise.resolve(true);if(pending)return pending;
 pending=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/v348-notifications.js?v=30.51.0';s.async=true;s.onload=()=>window.BOMSmartNotifications348?resolve(true):reject(new Error('Notification module failed to initialize'));s.onerror=()=>reject(new Error('Notification module unavailable'));document.head.appendChild(s)}).catch(e=>{failures++;pending=null;console.warn('Notification feed fallback:',e.message);return false});return pending;
}
window.loadView=async function(){if(view==='notifications'&&!window.BOMSmartNotifications348){const c=document.getElementById('content');if(c)c.innerHTML=window.BOMProgressive?.viewShell?.('notifications')||'<div class="card">Loading…</div>';await ensure()}return previous.apply(this,arguments)};
try{loadView=window.loadView}catch(_){}
window.BOMLazy348={version:'30.49.0',ensure,diagnostics:()=>({ready:!!window.BOMSmartNotifications348,failed:failures})};
})();
