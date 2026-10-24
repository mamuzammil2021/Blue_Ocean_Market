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
.v3692-supplier-mode{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 10px}.v3692-lock{display:inline-flex;align-items:center;gap:5px;color:var(--muted);font-weight:700}.ps315-two.v3692-import-two,.ps-two.v3692-import-two,.v3692-import-two{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:12px}.v3692-import-scroll{max-height:260px;overflow:auto;padding-right:3px}.v3692-category-remove{margin-left:auto}.v3692-account-warning{font-size:12px;color:#b42318;margin-top:5px}.v3692-route-note{display:none}@media(max-width:900px){.ps315-two.v3692-import-two,.ps-two.v3692-import-two,.v3692-import-two{grid-template-columns:1fr!important}}
`;document.head.appendChild(style);

let supplierEditOrigin='list', supplierArchiveMode='active', restoringRoute=false;
function routeHash(viewName,kind,id,section){let path='#'+encodeURIComponent(viewName);if(kind&&id)path+='/'+encodeURIComponent(kind)+'/'+encodeURIComponent(id);const q=new URLSearchParams();if(section)q.set('section',section);q.set('unit',window.selectedUnitId||typeof selectedUnitId!=='undefined'&&selectedUnitId?String(selectedUnitId):'all');return path+'?'+q.toString()}
function setRoute(viewName,kind,id,section,replace=true){return window.BOMRouter?.set(viewName,kind,id,section,replace)}
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
  try{await api(`/api/pink-salt/suppliers/${id}/profile-v315`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});toast(tr('Supplier profile saved'));closeModalAfterSave();if(supplierEditOrigin==='profile')return (BOMWorkflowPages42.committed(["ps-supplier"]),psSupplierAccount315(id));if(view==='psSuppliers')return (await BOMWorkflowPages42.finish(["ps-supplier"])||await loadView());go('psSuppliers')}catch(e){toast(tr(e.message||'Request failed'))}
};

// Active/Archived supplier separation + restore.
function supplierModeButtons(){const c=document.getElementById('content'),card=c?.querySelector('#ps315SupplierTable')?.closest('.card');if(!card)return;let bar=card.querySelector('.v3692-supplier-mode');if(!bar){bar=document.createElement('div');bar.className='v3692-supplier-mode';card.insertBefore(bar,card.firstChild)}bar.innerHTML=`<button class="btn small ${supplierArchiveMode==='active'?'primary':''}" onclick="ps3692SupplierMode('active')">${esc2(tr('Active Suppliers'))}</button><button class="btn small ${supplierArchiveMode==='archived'?'primary':''}" onclick="ps3692SupplierMode('archived')">${esc2(tr('Archived Suppliers'))}</button>`}
window.ps3692SupplierMode=function(mode){supplierArchiveMode=mode==='archived'?'archived':'active';const all=window.__ps3692AllSuppliers||window.__ps315Suppliers||[];window.__ps315Suppliers=all.filter(x=>supplierArchiveMode==='archived'?!n(x.active):!!n(x.active));supplierModeButtons();window.ps315ApplySupplierFilters?.();setTimeout(ps3692SupplierActions,0)};
function ps3692SupplierActions(){const body=document.getElementById('ps315SupplierTable');if(!body)return;const table=body.closest('table'),th=table?.querySelector('thead th:last-child');th?.classList.add('v369-sticky-action');for(const row of body.querySelectorAll('tr')){const cell=row.lastElementChild;if(!cell)continue;cell.classList.add('v369-sticky-action');const open=cell.querySelector('button[onclick*="psSupplierAccount315"]');const supplierId=Number(open?.getAttribute('onclick')?.match(/\((\d+)\)/)?.[1]||0);if(!supplierId)continue;cell.querySelectorAll('[data-v369-actions],[data-v3692-actions]').forEach(x=>x.remove());if(supplierArchiveMode==='archived'){cell.insertAdjacentHTML('beforeend',` <span data-v3692-actions><button class="btn small" onclick="psSupplierForm315(${supplierId})">${esc2(tr('Edit'))}</button> <button class="btn small primary" onclick="ps3692RestoreSupplier(${supplierId})">${esc2(tr('Restore Supplier'))}</button></span>`)}else{cell.insertAdjacentHTML('beforeend',` <span data-v3692-actions><button class="btn small" onclick="psSupplierForm315(${supplierId})">${esc2(tr('Edit'))}</button> <button class="btn small danger" onclick="ps369ArchiveSupplier(${supplierId})">${esc2(tr('Archive'))}</button></span>`)}}}
window.ps3692RestoreSupplier=async function(id){try{await api(`/api/pink-salt/suppliers/${id}/restore-v3692`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});toast(tr('Supplier restored'));supplierArchiveMode='active';await loadView()}catch(e){toast(e.message)}};
const oldSuppliersView=window.psSuppliersView;if(oldSuppliersView)window.psSuppliersView=async function(c){const r=await oldSuppliersView(c);window.__ps3692AllSuppliers=[...(window.__ps315Suppliers||[])];window.__ps315Suppliers=window.__ps3692AllSuppliers.filter(x=>supplierArchiveMode==='archived'?!n(x.active):!!n(x.active));supplierModeButtons();window.ps315ApplySupplierFilters?.();setTimeout(ps3692SupplierActions,0);return r};
const oldApply=window.ps315ApplySupplierFilters;if(oldApply)window.ps315ApplySupplierFilters=function(){const r=oldApply();setTimeout(ps3692SupplierActions,0);return r};

// Browser URL deep-linking for the Pink Salt record pages/sections requested in QA.
// Strong payment-method / Paid From compatibility in Pink Salt advance and import-settlement forms.
const oldAdvanceRefresh=window.ps369AdvanceRefreshAccounts;if(oldAdvanceRefresh)window.ps369AdvanceRefreshAccounts=async function(f,id){const r=await oldAdvanceRefresh(f,id);const method=txt(f?.payment_method?.value||'Bank'),sel=f?.payment_account_id||document.querySelector('[name="payment_account_id"][form="ps369AdvanceForm"]');if(sel){sel.dataset.paymentMethod=method;if(!sel.value)sel.insertAdjacentHTML('afterend',`<div class="v3692-account-warning">${esc2(tr(method==='Cash'?'Select a Cash account for a cash payment.':'Select an account matching the payment method.'))}</div>`)}return r};
const oldSettlementAccounts=window.ps369SettlementAccounts;if(oldSettlementAccounts)window.ps369SettlementAccounts=async function(f,id){const r=await oldSettlementAccounts(f,id);if(f?.payment_account_id)f.payment_account_id.dataset.paymentMethod=txt(f.payment_method?.value||'Bank');return r};

const oldSupplierPayment=window.psSupplierPayment315;if(oldSupplierPayment)window.psSupplierPayment315=async function(id){const r=await oldSupplierPayment(id);const f=document.getElementById('ps369AdvanceForm');if(f)await window.ps369AdvanceRefreshAccounts?.(f,id);return r};

// Import cost UI: equal-width panels, bounded scroll, verified/received lock state, Void terminology.
async function ps3692PolishImportDetail(id){const root=typeof workflowSurfaceV324==='function'?workflowSurfaceV324():document.getElementById('v324WorkflowSurface');if(!root)return;let lockData={};try{lockData=await api(`/api/pink-salt/imports/${id}/cost-locks-v3692`)}catch(_){}
  const cards=[...root.querySelectorAll('.card')],payCard=cards.find(c=>txt(c.querySelector('h3')?.textContent).includes(tr('Supplier Payments'))),costCard=cards.find(c=>txt(c.querySelector('h3')?.textContent).includes(tr('Import Cost')));const pair=payCard?.parentElement;if(pair&&costCard&&costCard.parentElement===pair)pair.classList.add('v3692-import-two');for(const c of [payCard,costCard])if(c){const minis=[...c.querySelectorAll('.ps-mini')];if(minis.length>3){let wrap=c.querySelector('.v3692-import-scroll');if(!wrap){wrap=document.createElement('div');wrap.className='v3692-import-scroll';minis.forEach(x=>wrap.appendChild(x));c.appendChild(wrap)}}}
  let corrections=[];try{corrections=await api(`/api/pink-salt/imports/${id}/correction-status`)}catch(_){}if(!root.isConnected)return;root.querySelectorAll('[data-correction-tag]').forEach(n=>n.remove());for(const c of corrections){const row=root.querySelector(c.workflow==='import_cost'?`[data-cost-id="${c.projection_id}"]`:`[data-payment-id="${c.projection_id}"]`);if(!row)continue;row.querySelector('[data-correction-tag]')?.remove();row.insertAdjacentHTML('beforeend',`<span data-correction-tag class="pill warn"><button class="btn small" onclick="BOMRouter.navigate('finance','correction',${c.correction_id})" title="${esc2(c.reason||'')}">${esc2(tr(c.status==='Resubmitted'?'Awaiting Finance Verification':'Correction Required'))}</button>${c.task_id?`<button class="btn small" onclick="taskDetail(${c.task_id})">${esc2(tr('Task'))} #${c.task_id}</button>`:''}</span>`);}
  if(costCard){const rows=[...costCard.querySelectorAll('.ps-mini')],active=(lockData.costs||[]);rows.forEach((row,i)=>{const c=active.find(x=>Number(x.id)===Number(row.dataset.costId));if(!c)return;row.querySelectorAll('.v369-cost-actions,.v3692-cost-actions').forEach(x=>x.remove());const locked=!!c.locked||!!lockData.import_received;if(c.fx_transaction_id){if(locked)row.insertAdjacentHTML('beforeend',`<span class="v3692-lock" data-bom-cost-lock>🔒 ${esc2(tr(c.lock_reason||'Finance Verified'))}</span>`);row.insertAdjacentHTML('beforeend',`<span class="v3692-cost-actions"><button class="btn small" onclick="BOMPinkFX.view(${c.fx_transaction_id})">${esc2(tr('Open'))}</button></span>`);return}if(locked)row.insertAdjacentHTML('beforeend',`<span class="v3692-cost-actions v3692-lock">🔒 ${esc2(tr(c.lock_reason|| (lockData.import_received?'Import Received':'Finance Verified')))}</span>`);else row.insertAdjacentHTML('beforeend',`<span class="v3692-cost-actions v369-cost-actions"><button class="btn small" onclick="ps369EditCost(${id},${n(c.id)})">${esc2(tr('Edit'))}</button><button class="btn small danger" onclick="ps369VoidCost(${id},${n(c.id)})">${esc2(tr('Void Cost'))}</button></span>`)})}
  try{translateElement(root)}catch(_){}
}

window.BOMPinkImportDetailQA={refresh:ps3692PolishImportDetail};
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
