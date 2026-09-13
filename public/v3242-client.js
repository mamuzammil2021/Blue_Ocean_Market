// Blue Ocean Market V30.24.2 — system-wide nested dialog isolation and Finance correction hotfix UI.
(function(){
'use strict';
const VERSION='30.24.2';
window.__BLUE_OCEAN_V3242_ACTIVE=true;
try{Object.assign(KO,{'Close preview':'미리보기 닫기'})}catch(_){ }

const style=document.createElement('style');style.id='v3242-style';style.textContent=`
#modalRoot .modal{box-sizing:border-box}
#modalRoot .modal.v322-has-close{padding-right:76px!important}
#modalRoot .modal.v322-has-close>.v322-modal-close{position:absolute!important;top:12px!important;right:12px!important;z-index:30!important;flex:0 0 40px!important;width:40px!important;height:40px!important;margin:0!important}
#modalRoot .modal .v3241-dialog-header,#modalRoot .modal .v321-preview-toolbar,#modalRoot .modal .section-title{min-width:0}
#modalRoot .modal .v3241-dialog-main,#modalRoot .modal .v3241-dialog-title,#modalRoot .modal .v3241-dialog-subtitle,#modalRoot .modal .v321-preview-toolbar>div:first-child{min-width:0;overflow-wrap:anywhere;word-break:break-word}
#modalRoot .modal .v3241-dialog-actions,#modalRoot .modal .v321-preview-toolbar .actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;min-width:0}
#modalRoot .v3242-modal-layer{isolation:isolate}
@media(max-width:700px){#modalRoot .modal.v322-has-close{padding-right:62px!important}#modalRoot .modal.v322-has-close>.v322-modal-close{top:8px!important;right:8px!important;width:40px!important;height:40px!important}.v3241-dialog-header,.v321-preview-toolbar{align-items:flex-start!important}.v3241-dialog-actions,.v321-preview-toolbar .actions{width:100%;justify-content:flex-start!important}}
`;document.head.appendChild(style);

const modalStack=[];
let replaceNextModalUntil=0;
const root=()=>document.getElementById('modalRoot');
const topLayer=()=>root()?.querySelector(':scope > .modal-bg');
function activeModal(){return topLayer()?.querySelector(':scope > .modal')||topLayer()?.querySelector('.modal')||null}
function rememberLayer(layer){return {layer,dirty:!!formDirty,opener:document.activeElement,scrollY:window.scrollY,modalScroll:layer?.querySelector('.modal')?.scrollTop||0}}
function restoreParent(){const r=root(),state=modalStack.pop();if(!r||!state?.layer)return false;r.replaceChildren(state.layer);formDirty=!!state.dirty;const m=state.layer.querySelector('.modal');if(m)m.scrollTop=state.modalScroll||0;requestAnimationFrame(()=>{try{window.scrollTo({top:state.scrollY||0,behavior:'auto'})}catch(_){ }try{if(state.opener&&document.contains(state.opener))state.opener.focus({preventScroll:true})}catch(_){ }});return true}
function renderModal(html,cls=''){
  const r=root();if(!r)return false;let current=topLayer(),replace=Date.now()<replaceNextModalUntil;replaceNextModalUntil=0;
  if(current&&!replace){modalStack.push(rememberLayer(current));r.removeChild(current)}else if(current){r.removeChild(current)}
  formDirty=false;
  const layer=document.createElement('div');layer.className='modal-bg v3242-modal-layer';const box=document.createElement('div');box.className='modal '+esc(cls||'');box.innerHTML=html;layer.appendChild(box);
  layer.addEventListener('click',e=>{if(e.target===layer&&layer===topLayer())window.closeModal?.()});r.replaceChildren(layer);try{translateElement(layer)}catch(_){ }
  setTimeout(()=>{try{enhanceMandatoryEvidenceFields()}catch(_){ }try{enhanceBuyerRequirementActions()}catch(_){ }try{enhanceBuyerApprovalAndRefundActions()}catch(_){ }},0);return true
}
function performClose(){const r=root(),current=topLayer();if(!r||!current)return true;formDirty=false;current.remove();if(!restoreParent())r.replaceChildren();return true}
window.modal=function(html,cls=''){return renderModal(html,cls)};
window.closeModal=function(force=false){if(!topLayer())return true;const perform=()=>performClose();if(!force&&formDirty){guardDirty('You have unsaved changes in this form. Close it and discard the changes?',perform);return false}return perform()};
window.closeModalAfterSave=function(){try{markFormSaved()}catch(_){formDirty=false}const hadParent=modalStack.length>0,result=window.closeModal(true);if(hadParent&&topLayer())replaceNextModalUntil=Date.now()+5000;return result};
window.closeAllModalsV3242=function(force=false){const r=root();const perform=()=>{modalStack.length=0;replaceNextModalUntil=0;formDirty=false;if(r)r.replaceChildren();return true};if(!force&&formDirty){guardDirty('You have unsaved changes. Close all dialogs and discard the changes?',perform);return false}return perform()};
window.v3242ModalStackStatus=()=>({depth:modalStack.length+(topLayer()?1:0),parents:modalStack.length,has_top:!!topLayer()});

// Own Escape at Window capture so older document-level handlers cannot close two modal levels.
window.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const confirm=document.querySelector('.confirm-layer,.confirm-dialog');if(confirm){e.preventDefault();e.stopPropagation();return}if(topLayer()){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();window.closeModal?.();return}},true);

// Mark Finance correction forms defensively even when an older overlay renders them.
const identifyFinanceCorrection=()=>{const f=activeModal()?.querySelector('form[onsubmit*="saveFinanceCorrection"]');if(f&&!f.dataset.financeId){const m=String(f.getAttribute('onsubmit')||'').match(/saveFinanceCorrection\(event\s*,\s*\d+\s*,\s*(\d+)\s*\)/);if(m)f.dataset.financeId=m[1]}};
const obs=new MutationObserver(()=>identifyFinanceCorrection());obs.observe(document.getElementById('modalRoot')||document.body,{childList:true,subtree:true});
identifyFinanceCorrection();
console.info(`Blue Ocean Market V${VERSION} nested-dialog/Finance hotfix UI loaded`);
})();
