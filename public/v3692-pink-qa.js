// Blue Ocean Market V30.69.2 — Pink Salt QA 06 Oct: parent/child navigation, account compatibility,
// deep-link state, archive separation, import-cost locks/layout, edit-import polish, payment tabs and repacking fix.
(function(){
'use strict';
const VERSION='30.69.2', n=v=>Number(v||0), txt=v=>String(v??'').trim(), tr=s=>typeof t==='function'?t(s):s;
const esc2=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
// Some legacy post-load Pink Salt handlers referenced qty outside its original closure. Make a safe global formatter available.
if(typeof window.qty!=='function')window.qty=(v,d=2)=>Number(v||0).toLocaleString(undefined,{maximumFractionDigits:d});
try{Object.assign(KO,{
  'Active Suppliers':'활성 공급업체','Archived Suppliers':'보관된 공급업체','Restore Supplier':'공급업체 복원','Supplier restored':'공급업체가 복원되었습니다.','Locked':'잠김','Finance Verified':'재무 검증 완료','Import Received':'수입 입고 완료','Void Cost':'비용 무효화','Payment account must match payment method.':'지급 계정은 지급 방법과 일치해야 합니다.'
})}catch(_){ }
const style=document.createElement('style');style.textContent=`
.v3692-supplier-mode{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px}.v3692-lock{display:inline-flex;align-items:center;gap:5px;color:var(--muted);font-weight:700}.v3692-import-two{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:12px}.v3692-import-scroll{max-height:260px;overflow:auto;padding-right:3px}.v3692-category-remove{margin-left:auto}.v3692-account-warning{font-size:12px;color:#b42318;margin-top:5px}.v3692-route-note{display:none}@media(max-width:900px){.v3692-import-two{grid-template-columns:1fr!important}}
`;document.head.appendChild(style);

let supplierEditOrigin='list', supplierArchiveMode='active', restoringRoute=false;
function routeHash(viewName,kind,id,section){let path='#'+encodeURIComponent(viewName);if(kind&&id)path+='/'+encodeURIComponent(kind)+'/'+encodeURIComponent(id);const q=new URLSearchParams();if(section)q.set('section',section);q.set('unit',window.selectedUnitId||typeof selectedUnitId!=='undefined'&&selectedUnitId?String(selectedUnitId):'all');return path+'?'+q.toString()}
function setRoute(viewName,kind,id,section,replace=true){const h=routeHash(viewName,kind,id,section);if(location.hash===h)return;history[replace?'replaceState':'pushState']({view:viewName,unit:window.selectedUnitId,kind,id,section},'',h)}
function parseRoute(){const raw=decodeURIComponent((location.hash||'').slice(1));const [path,q='']=raw.split('?'),parts=path.split('/').filter(Boolean),params=new URLSearchParams(q);return {view:parts[0]||'',kind:parts[1]||'',id:Number(parts[2]||0),section:params.get('section')||''}}
function supplierProfileVisible(){return !!document.getElementById('ps315SupplierPanel')&&!!window.__ps315SupplierAccount?.supplier?.id}

// Parent-child supplier edit behavior: Save/Cancel/X stays with the opener.
const oldSupplierForm=window.psSupplierForm315;
if(oldSupplierForm)window.psSupplierForm315=async function(id){
  supplierEditOrigin=id&&supplierProfileVisible()?'profile':'list';
  const r=await oldSupplierForm(id);
  const root=document.getElementById('modalRoot'),cancel=root?.querySelector('form .actions button[type="button"]');
  if(id&&cancel)cancel.onclick=()=>{closeModal();if(supplierEditOrigin==='profile')psSupplierAccount315(id)};
  return r;
};
const oldSaveSupplier=window.psSaveSupplier315;
if(oldSaveSupplier)window.psSaveSupplier315=async function(ev,id){
  if(!id)return oldSaveSupplier(ev,id);
  ev.preventDefault();const f=ev.target,categories=[...f.querySelectorAll('[name="supplier_category"]:checked')].map(x=>x.value);if(!categories.length)return toast(tr('Supplier category is required.'));
  const body=Object.fromEntries(new FormData(f));delete body.supplier_category;body.categories=categories;body.credit_terms_days=Math.max(0,Math.trunc(n(body.credit_terms_days)));body.credit_limit_krw=Math.max(0,n(body.credit_limit_krw));
  try{await api(`/api/pink-salt/suppliers/${id}/profile-v315`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});toast(tr('Supplier profile saved'));closeModalAfterSave();if(supplierEditOrigin==='profile')return psSupplierAccount315(id);if(view==='psSuppliers')return loadView();go('psSuppliers')}catch(e){toast(tr(e.message||'Request failed'))}
};

// Active/Archived supplier separation + restore.
function supplierModeButtons(){const c=document.getElementById('content'),card=c?.querySelector('#ps315SupplierTable')?.closest('.card');if(!card)return;let bar=card.querySelector('.v3692-supplier-mode');if(!bar){bar=document.createElement('div');bar.className='v3692-supplier-mode';card.insertBefore(bar,card.firstChild)}bar.innerHTML=`<button class="btn small ${supplierArchiveMode==='active'?'primary':''}" onclick="ps3692SupplierMode('active')">${esc2(tr('Active Suppliers'))}</button><button class="btn small ${supplierArchiveMode==='archived'?'primary':''}" onclick="ps3692SupplierMode('archived')">${esc2(tr('Archived Suppliers'))}</button>`}
window.ps3692SupplierMode=function(mode){supplierArchiveMode=mode==='archived'?'archived':'active';const all=window.__ps3692AllSuppliers||window.__ps315Suppliers||[];window.__ps315Suppliers=all.filter(x=>supplierArchiveMode==='archived'?!n(x.active):!!n(x.active));supplierModeButtons();window.ps315ApplySupplierFilters?.();setTimeout(ps3692SupplierActions,0)};
function ps3692SupplierActions(){const body=document.getElementById('ps315SupplierTable');if(!body)return;const table=body.closest('table'),th=table?.querySelector('thead th:last-child');th?.classList.add('v369-sticky-action');for(const row of body.querySelectorAll('tr')){const cell=row.lastElementChild;if(!cell)continue;cell.classList.add('v369-sticky-action');const open=cell.querySelector('button[onclick*="psSupplierAccount315"]');const supplierId=Number(open?.getAttribute('onclick')?.match(/\((\d+)\)/)?.[1]||0);if(!supplierId)continue;cell.querySelectorAll('[data-v369-actions],[data-v3692-actions]').forEach(x=>x.remove());if(supplierArchiveMode==='archived'){cell.insertAdjacentHTML('beforeend',` <span data-v3692-actions><button class="btn small" onclick="psSupplierForm315(${supplierId})">${esc2(tr('Edit'))}</button> <button class="btn small primary" onclick="ps3692RestoreSupplier(${supplierId})">${esc2(tr('Restore Supplier'))}</button></span>`)}else{cell.insertAdjacentHTML('beforeend',` <span data-v3692-actions><button class="btn small" onclick="psSupplierForm315(${supplierId})">${esc2(tr('Edit'))}</button> <button class="btn small danger" onclick="ps369ArchiveSupplier(${supplierId})">${esc2(tr('Archive'))}</button></span>`)}}}
window.ps3692RestoreSupplier=async function(id){try{await api(`/api/pink-salt/suppliers/${id}/restore-v3692`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});toast(tr('Supplier restored'));supplierArchiveMode='active';await loadView()}catch(e){toast(e.message)}};
const oldSuppliersView=window.psSuppliersView;if(oldSuppliersView)window.psSuppliersView=async function(c){const r=await oldSuppliersView(c);window.__ps3692AllSuppliers=[...(window.__ps315Suppliers||[])];window.__ps315Suppliers=window.__ps3692AllSuppliers.filter(x=>supplierArchiveMode==='archived'?!n(x.active):!!n(x.active));supplierModeButtons();window.ps315ApplySupplierFilters?.();setTimeout(ps3692SupplierActions,0);return r};
const oldApply=window.ps315ApplySupplierFilters;if(oldApply)window.ps315ApplySupplierFilters=function(){const r=oldApply();setTimeout(ps3692SupplierActions,0);return r};

// Browser URL deep-linking for the Pink Salt record pages/sections requested in QA.
const oldSupplierAccount=window.psSupplierAccount315;if(oldSupplierAccount)window.psSupplierAccount315=async function(id){const navigationNonce=window.BOMNavigationNonce||0;const r=await oldSupplierAccount(id);if(navigationNonce!==(window.BOMNavigationNonce||0))return r;if(!restoringRoute)setRoute('psSuppliers','supplier',id,window.__ps3692SupplierTab||'account');return r};
const oldSupplierTab=window.psSupplierTab315;if(oldSupplierTab)window.psSupplierTab315=function(key){window.__ps3692SupplierTab=key||'account';const r=oldSupplierTab(key);const id=window.__ps315SupplierAccount?.supplier?.id;if(id&&!restoringRoute)setRoute('psSuppliers','supplier',id,window.__ps3692SupplierTab);return r};
const oldImportDetail=window.psImportDetail;if(oldImportDetail)window.psImportDetail=async function(id){const navigationNonce=window.BOMNavigationNonce||0;const r=await oldImportDetail(id);if(navigationNonce!==(window.BOMNavigationNonce||0))return r;if(!restoringRoute)setRoute('psImports','import',id,'');setTimeout(()=>ps3692PolishImportDetail(id),0);return r};
async function restoreRoute(){if(restoringRoute)return;const r=parseRoute();if(r.view!==view||!r.id)return;restoringRoute=true;try{if(r.view==='psSuppliers'&&r.kind==='supplier'){await window.psSupplierAccount315?.(r.id);if(r.section)window.psSupplierTab315?.(r.section)}else if(r.view==='psImports'&&r.kind==='import'){await window.psImportDetail?.(r.id)}}catch(e){console.warn('V30.69.2 route restore:',e.message)}finally{restoringRoute=false}}
const oldLoadView=window.loadView;if(oldLoadView)window.loadView=async function(...args){const r=await oldLoadView.apply(this,args);return r};

// Strong payment-method / Paid From compatibility in Pink Salt advance and import-settlement forms.
const oldAdvanceRefresh=window.ps369AdvanceRefreshAccounts;if(oldAdvanceRefresh)window.ps369AdvanceRefreshAccounts=async function(f,id){const r=await oldAdvanceRefresh(f,id);const method=txt(f?.payment_method?.value||'Bank'),sel=f?.payment_account_id||document.querySelector('[name="payment_account_id"][form="ps369AdvanceForm"]');if(sel){sel.dataset.paymentMethod=method;if(!sel.value)sel.insertAdjacentHTML('afterend',`<div class="v3692-account-warning">${esc2(tr(method==='Cash'?'Select a Cash account for a cash payment.':'Select an account matching the payment method.'))}</div>`)}return r};
const oldSettlementAccounts=window.ps369SettlementAccounts;if(oldSettlementAccounts)window.ps369SettlementAccounts=async function(f,id){const r=await oldSettlementAccounts(f,id);if(f?.payment_account_id)f.payment_account_id.dataset.paymentMethod=txt(f.payment_method?.value||'Bank');return r};

const oldSupplierPayment=window.psSupplierPayment315;if(oldSupplierPayment)window.psSupplierPayment315=async function(id){const r=await oldSupplierPayment(id);const f=document.getElementById('ps369AdvanceForm');if(f)await window.ps369AdvanceRefreshAccounts?.(f,id);return r};

// Import cost UI: equal-width panels, bounded scroll, verified/received lock state, Void terminology.
async function ps3692PolishImportDetail(id){const root=typeof workflowSurfaceV324==='function'?workflowSurfaceV324():document.getElementById('v324WorkflowSurface');if(!root)return;let lockData={};try{lockData=await api(`/api/pink-salt/imports/${id}/cost-locks-v3692`)}catch(_){}
  const cards=[...root.querySelectorAll('.card')],payCard=cards.find(c=>txt(c.querySelector('h3')?.textContent).includes(tr('Supplier Payments'))),costCard=cards.find(c=>txt(c.querySelector('h3')?.textContent).includes(tr('Import Cost')));const pair=payCard?.parentElement;if(pair&&costCard&&costCard.parentElement===pair)pair.classList.add('v3692-import-two');for(const c of [payCard,costCard])if(c){const minis=[...c.querySelectorAll('.ps-mini')];if(minis.length>3){let wrap=c.querySelector('.v3692-import-scroll');if(!wrap){wrap=document.createElement('div');wrap.className='v3692-import-scroll';minis.forEach(x=>wrap.appendChild(x));c.appendChild(wrap)}}}
  if(costCard){const rows=[...costCard.querySelectorAll('.ps-mini')],active=(lockData.costs||[]);rows.forEach((row,i)=>{const c=active[i];if(!c)return;row.querySelectorAll('.v369-cost-actions,.v3692-cost-actions').forEach(x=>x.remove());const locked=!!c.locked||!!lockData.import_received;if(locked)row.insertAdjacentHTML('beforeend',`<span class="v3692-cost-actions v3692-lock">🔒 ${esc2(tr(c.lock_reason|| (lockData.import_received?'Import Received':'Finance Verified')))}</span>`);else row.insertAdjacentHTML('beforeend',`<span class="v3692-cost-actions v369-cost-actions"><button class="btn small" onclick="ps369EditCost(${id},${n(c.id)})">${esc2(tr('Edit'))}</button><button class="btn small danger" onclick="ps369VoidCost(${id},${n(c.id)})">${esc2(tr('Void Cost'))}</button></span>`)})}
  try{translateElement(root)}catch(_){}
}

// Edit Import: same searchable supplier control, current supplier preselected, category remove button stays inside category row.
const oldEditImport=window.psV310EditImport;if(oldEditImport)window.psV310EditImport=async function(id){const r=await oldEditImport(id);const root=document.getElementById('modalRoot');const sel=root?.querySelector('select[name="supplier_id"]');if(sel){const search=root.querySelector('.v369-single-supplier-search,.v325-scoped-select-search input');if(search&&sel.selectedOptions[0]?.value)search.value=txt(sel.selectedOptions[0].textContent)}const red=[...root?.querySelectorAll('button.btn.danger,button.danger')||[]].find(b=>txt(b.textContent)==='×'||txt(b.textContent)==='✕');const categories=root?.querySelector('#psV310EditItems,.ps-line-builder');if(red&&categories&&!categories.contains(red)){const first=categories.querySelector('.ps-line,.ps-import-line,.ps-mini')||categories;first.appendChild(red);red.classList.add('v3692-category-remove')}return r};

// Import payment option buttons: explicit mode switching and account refresh every time.
const oldSetMode=window.ps369SetSettlementMode;if(oldSetMode)window.ps369SetSettlementMode=function(mode){oldSetMode(mode);const f=document.getElementById('ps369SettlementForm');if(!f)return;const newSection=document.getElementById('ps369NewPaymentFields');if(mode!=='advance'&&newSection)window.ps369SettlementAccounts?.(f,window.__ps369SettlementContext?.import?.id);window.ps369SettlementCalc?.(f)};
// Stay on Import Detail after successful settlement; v369 already redraws detail, prevent list refresh from replacing it.
const oldSaveSettlement=window.ps369SaveSettlement;if(oldSaveSettlement)window.ps369SaveSettlement=async function(ev,id){const priorView=view;await oldSaveSettlement(ev,id);if(priorView==='psImports'){setRoute('psImports','import',id,'');setTimeout(()=>window.psImportDetail?.(id),10)}};

// QA 12: ensure repacking quantity handlers always read visible values and no global qty ReferenceError can occur.
const oldProdForm=window.psProductionForm;if(oldProdForm)window.psProductionForm=async function(...args){const r=await oldProdForm.apply(this,args);const form=(typeof workflowSurfaceV324==='function'?workflowSurfaceV324():document)?.querySelector?.('form[onsubmit*="psSaveProduction"]');form?.querySelectorAll('#psProdOutputs input[type="number"]').forEach(input=>{input.addEventListener('input',()=>{const line=input.closest('.ps-output-line'),idx=[...line.parentElement.children].indexOf(line);if(window.psProdOutputs?.[idx])window.psProdOutputs[idx].quantity_units=Number(input.value||0);window.psRebuildProdInputs?.()})});return r};

// Initial deep-link restoration after boot/render.
// Restored centrally by BOMPersistentRouting after authenticated module loading.
window.__BOM_V3692={version:VERSION,reused_from_excavator:['parent_child_navigation','cash_bank_account_compatibility','archive_restore','finance_verified_lock','bounded_cost_panel','record_deep_links'],qa_points:12};
console.info(`Blue Ocean Market V${VERSION} Pink Salt QA refinements loaded`);
})();
