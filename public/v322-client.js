// Blue Ocean Market V30.22.0 — shared UI stability and dialog-control hardening.
(function(){
'use strict';
window.__BLUE_OCEAN_V322_ACTIVE=true;
const css=document.createElement('style');css.id='v322-style';css.textContent=`
.modal{position:relative}.v322-modal-close{position:absolute!important;top:12px!important;right:12px!important;z-index:6;width:38px;height:38px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;line-height:1}.modal.v322-has-close{padding-top:18px}.modal.v322-large-workflow{max-height:92vh;overflow:auto}.modal.v322-large-workflow>.actions:last-child,.modal.v322-large-workflow>form>.actions:last-child{position:sticky;bottom:0;background:var(--card,#fff);padding:10px 0 4px;z-index:5;border-top:1px solid var(--line,#ddd)}
.confirm-dialog[role="dialog"]{position:relative}
@media(max-width:700px){.modal.v322-large-workflow{width:calc(100vw - 16px)!important;max-width:none!important;max-height:94vh!important;margin:8px!important}.v322-modal-close{top:8px!important;right:8px!important}}
`;document.head.appendChild(css);

let lastModalOpener=null;
function textOf(el){return String(el?.textContent||el?.getAttribute?.('aria-label')||'').trim().toLowerCase()}
function isCloseControl(el){const t=textOf(el);return el?.matches?.('[data-modal-close],[aria-label="Close"],[aria-label="close"]')||['×','✕','x','close'].includes(t)}
function enhanceModal(modal){if(!modal||modal.dataset.v322Enhanced==='1')return;modal.dataset.v322Enhanced='1';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');if(!modal.getAttribute('aria-label')&&!modal.getAttribute('aria-labelledby')){const h=modal.querySelector('h1,h2,h3');if(h){if(!h.id)h.id='v322-modal-title-'+Math.random().toString(36).slice(2,9);modal.setAttribute('aria-labelledby',h.id)}}
  let close=[...modal.querySelectorAll('button,.btn')].find(isCloseControl);if(!close){close=document.createElement('button');close.type='button';close.className='btn v322-modal-close';close.setAttribute('aria-label','Close');close.textContent='×';close.addEventListener('click',()=>window.closeModal?.());modal.prepend(close)}else{close.classList.add('v322-modal-close');close.setAttribute('aria-label','Close');if(close.parentElement!==modal)modal.appendChild(close)}modal.classList.add('v322-has-close');
  const controls=modal.querySelectorAll('input:not([type="hidden"]),select,textarea').length,sections=modal.querySelectorAll('.card,.section-title,fieldset').length;if(controls>=14||sections>=5)modal.classList.add('v322-large-workflow');
  const first=modal.querySelector('input:not([type="hidden"]):not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not(.v322-modal-close),a.btn');if(first&&!modal.contains(document.activeElement))setTimeout(()=>{try{first.focus({preventScroll:true})}catch(_){ }},0)
}
function enhanceDialogs(root=document){root.querySelectorAll?.('.modal').forEach(enhanceModal);root.querySelectorAll?.('.confirm-dialog').forEach(d=>{d.setAttribute('role','dialog');d.setAttribute('aria-modal','true')})}
const oldModal=window.modal;if(typeof oldModal==='function')window.modal=function(...args){lastModalOpener=document.activeElement;const r=oldModal.apply(this,args);queueMicrotask(()=>enhanceDialogs(document));return r};
const oldClose=window.closeModal;if(typeof oldClose==='function')window.closeModal=function(...args){const r=oldClose.apply(this,args);setTimeout(()=>{try{if(lastModalOpener&&document.contains(lastModalOpener))lastModalOpener.focus()}catch(_){ }lastModalOpener=null},0);return r};
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const modal=document.querySelector('.modal');const confirm=document.querySelector('.confirm-layer,.confirm-dialog');if(modal&&!confirm){e.preventDefault();window.closeModal?.()}},true);
const obs=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)enhanceDialogs(n.matches?.('.modal,.confirm-dialog')?n:n)});obs.observe(document.body,{childList:true,subtree:true});enhanceDialogs(document);
console.info('Blue Ocean Market V30.22.0 UI workflow hardening loaded');
})();
