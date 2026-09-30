// Blue Ocean Market V30.63.0 — shared sticky dialog actions + root-level serious mutation processing.
(()=>{
  'use strict';
  if(window.BOMDialogProcessingV363)return;
  const VERSION='30.63.0';
  const root=document.getElementById('processingRoot')||(()=>{const n=document.createElement('div');n.id='processingRoot';document.body.appendChild(n);return n})();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const tr=s=>{try{return typeof t==='function'?t(s):s}catch(_){return s}};
  try{Object.assign(KO,{
    'Processing…':'처리 중…','Saving changes…':'변경사항 저장 중…','Recording payment…':'결제 기록 중…',
    'Applying approval…':'승인 처리 중…','Processing controlled change…':'통제 변경 처리 중…',
    'Please wait. Do not close this screen or repeat the action while processing.':'처리가 완료될 때까지 기다려 주세요. 이 화면을 닫거나 작업을 다시 실행하지 마세요.'
  })}catch(_){}

  const style=document.createElement('style');style.id='bom363-dialog-processing-style';style.textContent=`
    /* Shared dialog action standard: keep the action group reachable while only the dialog content scrolls. */
    .modal.bom363-dialog,.confirm-dialog.bom363-dialog{overscroll-behavior:contain;scrollbar-gutter:stable;}
    .modal.bom363-dialog>.actions.bom363-sticky-actions,
    .modal.bom363-dialog>form>.actions.bom363-sticky-actions,
    .modal.bom363-dialog form>.actions.bom363-sticky-actions,
    .modal.bom363-dialog .bom363-footer-host>.actions.bom363-sticky-actions,
    .confirm-dialog.bom363-dialog>.actions.bom363-sticky-actions,
    .confirm-dialog.bom363-dialog>form>.actions.bom363-sticky-actions{
      position:sticky!important;bottom:-1px!important;z-index:90!important;background:var(--panel,#fff)!important;
      margin-left:-4px!important;margin-right:-4px!important;margin-bottom:-4px!important;padding:12px 4px 4px!important;
      border-top:1px solid var(--line,#e5eaf1)!important;box-shadow:0 -10px 22px rgba(20,40,80,.055)!important;
    }
    .modal.bom363-dialog>.actions.bom363-sticky-actions:before,
    .modal.bom363-dialog>form>.actions.bom363-sticky-actions:before,
    .confirm-dialog.bom363-dialog>.actions.bom363-sticky-actions:before,
    .confirm-dialog.bom363-dialog>form>.actions.bom363-sticky-actions:before{content:'';position:absolute;left:0;right:0;top:-1px;height:1px;background:var(--line,#e5eaf1)}
    .modal.bom363-scrollable,.confirm-dialog.bom363-scrollable{max-height:min(92vh,92dvh)!important;overflow-y:auto!important;overflow-x:hidden!important;}
    .modal.bom363-scrollable.wide{overflow-x:hidden!important}
    @media(max-width:700px){
      .modal.bom363-scrollable,.confirm-dialog.bom363-scrollable{max-height:94dvh!important;}
      .bom363-sticky-actions{gap:8px!important;}
      .bom363-sticky-actions>.btn,.bom363-sticky-actions>button,.bom363-sticky-actions>a.btn{min-height:44px;flex:1 1 135px;}
    }

    /* Serious mutations always promote to one root-level application overlay. */
    #processingRoot{position:relative;z-index:2147483600!important;}
    #processingRoot>.bom314-processing,#processingRoot>.bom345-global,#processingRoot>.bom363-global-processing{z-index:2147483600!important;}
    .bom363-global-processing{position:fixed;inset:0;display:grid;place-items:center;padding:20px;background:rgba(8,18,34,.68);backdrop-filter:blur(2px);cursor:progress;}
    .bom363-global-processing-card{width:min(430px,92vw);background:#fff;border:1px solid var(--line,#e5eaf1);border-radius:18px;padding:26px;text-align:center;box-shadow:0 30px 90px rgba(0,0,0,.34);color:var(--ink,#162033)}
    .bom363-global-spinner{width:46px;height:46px;margin:0 auto 15px;border:4px solid #dce8f6;border-top-color:var(--brand,#0b63ce);border-radius:50%;animation:bom363spin .82s linear infinite}
    .bom363-global-processing-card h3{margin:0 0 7px;font-size:19px}.bom363-global-processing-card p{margin:0;color:var(--muted,#6b778c);line-height:1.45}
    @keyframes bom363spin{to{transform:rotate(360deg)}}
    body.bom363-processing{overflow:hidden!important;cursor:progress!important;}
    body.bom363-processing #bomNetworkState{display:none!important;}
    body.bom363-processing .modal .v3382-processing-chip,
    body.bom363-processing .modal .bom353-payment-overlay,
    body.bom363-processing .modal .bom345-progress,
    body.bom363-processing #v324WorkflowSurface .bom345-progress{display:none!important;}
    .bom363-surface-suppressed{display:none!important;}
    @media(max-width:700px){.bom363-global-processing{padding:0;align-items:end}.bom363-global-processing-card{width:100%;max-width:none;border-radius:18px 18px 0 0;padding:24px 20px calc(24px + env(safe-area-inset-bottom))}}
  `;document.head.appendChild(style);

  function visibleChildren(el){return [...(el?.children||[])].filter(x=>getComputedStyle(x).display!=='none'&&!x.hidden)}
  function isTerminalActionGroup(a){
    if(!a?.matches?.('.actions,.modal-actions,.dialog-actions,footer'))return false;
    const p=a.parentElement;if(!p)return false;
    const kids=visibleChildren(p);const ix=kids.indexOf(a);if(ix<0)return false;
    // Allow only tiny help/status nodes after the action group; do not make section-local action rows sticky.
    return kids.slice(ix+1).every(x=>x.matches?.('small,.muted,.help,.form-help,[aria-live="polite"]'));
  }
  function enhanceDialog(dialog){
    if(!dialog?.isConnected)return;
    dialog.classList.add('bom363-dialog');
    const candidates=[...dialog.querySelectorAll(':scope > .actions,:scope > form > .actions,:scope > .modal-actions,:scope > .dialog-actions,:scope > form > .modal-actions,:scope > form > .dialog-actions')];
    for(const a of candidates)if(isTerminalActionGroup(a))a.classList.add('bom363-sticky-actions');
    // Only force scrolling when the dialog actually needs it; small dialogs keep their natural layout.
    requestAnimationFrame(()=>{
      if(!dialog.isConnected)return;
      const viewport=Math.max(320,window.innerHeight||document.documentElement.clientHeight||800);
      const tall=dialog.scrollHeight>Math.min(dialog.clientHeight||Infinity,viewport*.82)+8||dialog.getBoundingClientRect().height>viewport*.82;
      if(tall||dialog.classList.contains('wide')||dialog.classList.contains('v322-large-workflow'))dialog.classList.add('bom363-scrollable');
    });
  }
  function enhanceDialogs(node=document){
    if(node.matches?.('.modal,.confirm-dialog'))enhanceDialog(node);
    node.querySelectorAll?.('.modal,.confirm-dialog').forEach(enhanceDialog);
    const owner=node.closest?.('.modal,.confirm-dialog');if(owner)enhanceDialog(owner);
  }
  if(window.BOMMutationHub){try{window.BOMMutationHub.register('v363-sticky-dialog-actions',enhanceDialogs,{root:'body'})}catch(_){}}else{
    const mo=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes||[])if(n.nodeType===1)enhanceDialogs(n)});mo.observe(document.body,{childList:true,subtree:true});
  }
  enhanceDialogs(document);

  let recentAction=null,active=0,ownOverlay=null,suppressed=[];const inertState=new Map();
  function eligibleAction(btn){
    if(!btn||btn.disabled)return null;const text=String(btn.dataset?.processingLabel||btn.dataset?.bomActionLabel||btn.textContent||'').replace(/\s+/g,' ').trim();
    if(!text||/^(close|cancel|back|previous|next|logout|닫기|취소|뒤로)$/i.test(text))return null;return {btn,text};
  }
  document.addEventListener('click',e=>{const a=eligibleAction(e.target.closest?.('button,.btn'));if(a)recentAction={...a,at:Date.now()}},true);
  document.addEventListener('submit',e=>{const a=eligibleAction(e.submitter||e.target?.querySelector?.('button[type="submit"],button:not([type])'));if(a)recentAction={...a,at:Date.now()}},true);

  function isSeriousMutation(url,opt={}){
    const method=String(opt.method||url?.method||'GET').toUpperCase();if(['GET','HEAD','OPTIONS'].includes(method))return false;
    const u=String(typeof url==='string'?url:url?.url||'');
    if(/\/api\/auth\//i.test(u)||/\/api\/notifications(?:\/|$)/i.test(u)||/\/api\/me\/language(?:\?|$)/i.test(u))return false;
    return /\/api\//i.test(u)||method==='DELETE';
  }
  function messageFor(url,action=''){
    const s=(String(action)+' '+String(url)).toLowerCase();
    if(/payment|receipt|settlement|transfer|refund/.test(s))return 'Recording payment…';
    if(/approve|approval|verify|posting/.test(s))return 'Applying approval…';
    if(/void|delete|cancel|reverse|archive|restore/.test(s))return 'Processing controlled change…';
    if(/update|edit|patch/.test(s))return 'Saving changes…';
    return 'Processing…';
  }
  function currentRootSurfaces(){return [...root.querySelectorAll(':scope > .bom345-global,:scope > .bom314-processing,:scope > .bom363-global-processing')].filter(x=>getComputedStyle(x).display!=='none')}
  function suppressDuplicateSurfaces(){
    suppressed=[];const surfaces=currentRootSurfaces();if(surfaces.length<=1)return;
    const keep=surfaces.find(x=>x.classList.contains('bom363-global-processing'))||surfaces.find(x=>x.classList.contains('bom345-global'))||surfaces.at(-1);
    for(const x of surfaces)if(x!==keep){x.classList.add('bom363-surface-suppressed');suppressed.push(x)}
  }
  function restoreSuppressed(){for(const x of suppressed)x.classList.remove('bom363-surface-suppressed');suppressed=[]}
  function setAppLocked(on){
    const targets=['root','modalRoot','confirmRoot','notifDialog'].map(id=>document.getElementById(id)).filter(Boolean);
    if(on){for(const el of targets){if(inertState.has(el))continue;inertState.set(el,{inert:!!el.inert,aria:el.getAttribute('aria-hidden')});try{el.inert=true}catch(_){} }}
    else{for(const [el,s] of inertState){try{el.inert=s.inert}catch(_){}if(s.aria===null)el.removeAttribute('aria-hidden');else el.setAttribute('aria-hidden',s.aria)}inertState.clear()}
  }
  function beginSerious(url){
    active++;document.body.classList.add('bom363-processing');setAppLocked(true);
    const action=recentAction&&Date.now()-recentAction.at<2500?recentAction.text:'';
    // Reuse an already-correct root processing surface when the upstream coordinator created one.
    const existing=currentRootSurfaces();
    if(!existing.length){
      const d=document.createElement('div');d.className='bom363-global-processing';d.setAttribute('role','status');d.setAttribute('aria-live','polite');d.setAttribute('aria-busy','true');
      d.innerHTML=`<div class="bom363-global-processing-card"><div class="bom363-global-spinner" aria-hidden="true"></div><h3>${esc(tr(messageFor(url,action)))}</h3><p>${esc(tr('Please wait. Do not close this screen or repeat the action while processing.'))}</p></div>`;
      root.appendChild(d);ownOverlay=d;
    }
    suppressDuplicateSurfaces();
  }
  function endSerious(){
    active=Math.max(0,active-1);if(active)return;
    ownOverlay?.remove();ownOverlay=null;restoreSuppressed();document.body.classList.remove('bom363-processing');setAppLocked(false);
  }

  const priorFetch=window.fetch.bind(window);
  window.fetch=async function(input,opt={}){
    const serious=isSeriousMutation(input,opt);if(serious)beginSerious(typeof input==='string'?input:input?.url||'');
    try{return await priorFetch(input,opt)}finally{if(serious)endSerious()}
  };

  // General protected lifecycle: while a serious mutation is active, modal close/Escape/backdrop actions cannot conflict.
  const priorClose=window.closeModal;
  if(typeof priorClose==='function'){
    const guardedClose=function(force=false){if(active>0&&!force)return false;return priorClose.apply(this,arguments)};
    window.closeModal=guardedClose;try{closeModal=guardedClose}catch(_){}
  }
  document.addEventListener('keydown',e=>{if(active>0&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation()}},true);
  window.addEventListener('beforeunload',e=>{if(active<=0)return;e.preventDefault();e.returnValue=''},true);

  window.BOMDialogProcessingV363={version:VERSION,enhanceDialogs,isActive:()=>active>0,diagnostics:()=>({active_mutations:active,sticky_dialogs:document.querySelectorAll('.bom363-dialog').length,sticky_action_groups:document.querySelectorAll('.bom363-sticky-actions').length,root_surfaces:currentRootSurfaces().length})};
  console.info('Blue Ocean Market V30.63.0 sticky dialog actions + root processing loaded');
})();
