// Blue Ocean Market V30.38.1 — Sell Machine validation-state repair and
// Buy Machine token account loading/selection hotfix.
(function(){
'use strict';
const VERSION='30.38.1';
window.__BLUE_OCEAN_V3381_ACTIVE=true;
const txt=v=>String(v??'').trim();
const num=v=>Number(v||0)||0;
const currentBu=()=>Number(selectedUnitId||me?.business_unit_id||0);
const isElectronic=m=>/bank|card|cheque|check|wallet/i.test(txt(m));
try{Object.assign(KO,{
  'Loading company accounts…':'회사 계정 불러오는 중…',
  'Loading supplier accounts…':'공급업체 계정 불러오는 중…',
  'Select company financial account':'회사 금융 계정 선택',
  'Select supplier receiver account':'공급업체 수취 계정 선택',
  'Company accounts loaded':'회사 계정 로드 완료',
  'Supplier accounts loaded':'공급업체 계정 로드 완료',
  'No compatible company account configured.':'호환되는 회사 금융 계정이 설정되어 있지 않습니다.',
  'Company accounts could not be loaded. Retry or check connection.':'회사 계정을 불러오지 못했습니다. 다시 시도하거나 연결 상태를 확인하세요.',
  'No compatible saved supplier account. Use Add / Manage Accounts.':'호환되는 저장된 공급업체 계정이 없습니다. 계정 추가/관리를 사용하세요.',
  'Select a supplier first.':'먼저 공급업체를 선택하세요.',
  'Supplier accounts could not be loaded. Retry or check connection.':'공급업체 계정을 불러오지 못했습니다. 다시 시도하거나 연결 상태를 확인하세요.',
  'No compatible company account':'호환되는 회사 계정 없음',
  'Supplier accounts unavailable':'공급업체 계정을 사용할 수 없음',
  'Select supplier first':'먼저 공급업체 선택',
  'Select an existing supplier first. For a new supplier, enter the receiver account below.':'먼저 기존 공급업체를 선택하세요. 신규 공급업체의 경우 아래에 수취 계정을 입력하세요.',
  'Account manager is unavailable. Refresh the screen and try again.':'계정 관리자를 사용할 수 없습니다. 화면을 새로고침한 후 다시 시도하세요.'
})}catch(_){ }

const style=document.createElement('style');style.id='v3381-style';style.textContent=`
/* V30.38.1: untouched Sell Machine fields stay neutral. Blur/submit validation still
   uses the shared V30.35/V30.26 error components. */
#excavatorSaleForm .v338-required-missing:not([data-v3381-visible-invalid="1"]){outline:none!important;border-color:var(--line)!important;box-shadow:none!important;background:#fff!important}
#excavatorSaleForm .v338-required-missing:not([data-v3381-visible-invalid="1"]):focus{border-color:#8db9ee!important;box-shadow:0 0 0 3px #e8f2ff!important}
.v3381-account-loading{opacity:.78}.v3381-account-status{display:block;margin-top:5px;color:var(--muted);font-size:11px}.v3381-account-status.good{color:var(--good)}.v3381-account-status.bad{color:var(--bad)}
`;document.head.appendChild(style);

/* --------------------------------------------------------------------------
   Sell Machine — touched/submit-aware visual validation.
   -------------------------------------------------------------------------- */
function saleForm381(){return document.getElementById('excavatorSaleForm')}
function saleElVisible381(el){return !!el&&!el.disabled&&el.type!=='hidden'&&el.offsetParent!==null}
function fieldBox381(el){return el?.closest?.('.field')||null}
function clearSaleVisual381(el){if(!el)return;el.classList.remove('v338-required-missing');el.removeAttribute('data-v3381-visible-invalid');const f=fieldBox381(el);if(!f)return;f.classList.remove('v335-field-invalid','v326-invalid-field');f.querySelectorAll('.v335-field-error,.v326-field-error').forEach(x=>x.remove())}
function refreshSimpleValidity381(el){if(!el)return;const name=el.name||'';
  // V30.26 sets custom errors on submit for these fields. Native value changes do not
  // automatically clear a custom error, so explicitly release it once the value is valid.
  if(name==='customer_name'&&txt(el.value))el.setCustomValidity('');
  if(name==='selling_price'&&num(el.value)>0)el.setCustomValidity('');
  if(name==='other_destination_country'&&(!el.required||txt(el.value)))el.setCustomValidity('');
  if(name==='new_buyer_name'&&(!el.required||txt(el.value)))el.setCustomValidity('');
  // Do not blindly clear payment/reference/country custom errors; those can represent
  // settlement, duplicate-reference or country-selector validation and are authoritative.
}
function refreshSaleVisuals381(form=saleForm381()){
  if(!form)return;
  const submitted=form.dataset.v3381Submitted==='1';
  for(const el of form.querySelectorAll('input,select,textarea')){
    refreshSimpleValidity381(el);
    const touched=el.dataset.v335Touched==='1'||el.dataset.v3381Touched==='1';
    const visible=saleElVisible381(el);
    const invalid=visible&&el.validity?.valid===false;
    if(!visible||!el.required||!invalid||(!submitted&&!touched)){
      clearSaleVisual381(el);
      continue;
    }
    // V30.38's direct class is allowed to render only after interaction/submission.
    el.dataset.v3381VisibleInvalid='1';
  }
}
function wireSaleValidation381(){const form=saleForm381();if(!form||form.dataset.v3381Validation==='1')return;form.dataset.v3381Validation='1';delete form.dataset.v3381Submitted;
  for(const el of form.querySelectorAll('input,select,textarea'))clearSaleVisual381(el);
  const onEdit=e=>{const el=e.target;if(!el?.matches?.('input,select,textarea'))return;el.dataset.v3381Touched='1';refreshSimpleValidity381(el);setTimeout(()=>refreshSaleVisuals381(form),0)};
  form.addEventListener('input',onEdit);form.addEventListener('change',onEdit);
  form.addEventListener('blur',e=>{const el=e.target;if(el?.matches?.('input,select,textarea')){el.dataset.v3381Touched='1';setTimeout(()=>refreshSaleVisuals381(form),0)}},true);
  form.addEventListener('submit',()=>{form.dataset.v3381Submitted='1';setTimeout(()=>refreshSaleVisuals381(form),0)},true);
  refreshSaleVisuals381(form);
}
let saleCleanupQueued381=false;
const saleObserver381=new MutationObserver(()=>{if(saleCleanupQueued381)return;saleCleanupQueued381=true;requestAnimationFrame(()=>{saleCleanupQueued381=false;wireSaleValidation381();refreshSaleVisuals381()})});
saleObserver381.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','required','style']});

/* --------------------------------------------------------------------------
   Buy Machine token account selectors — one fast cached/parallel path.
   -------------------------------------------------------------------------- */
const companyCache381=new Map(),supplierCache381=new Map();
function cachedPromise381(map,key,loader,ttl=60000){const now=Date.now(),hit=map.get(key);if(hit&&now-hit.at<ttl)return hit.promise;const promise=Promise.resolve().then(loader).catch(e=>{map.delete(key);throw e});map.set(key,{at:now,promise});return promise}
function companyAccounts381(method='Bank',force=false){const key=[currentBu(),txt(method).toLowerCase()].join(':');if(force)companyCache381.delete(key);return cachedPromise381(companyCache381,key,async()=>{const q=new URLSearchParams({business_unit_id:String(currentBu()),method:txt(method)||'Bank',country:'South Korea',currency:'KRW',direction:'payment'});const d=await api('/api/v320/financial-accounts/options?'+q);return {rows:d.accounts||[],defaultId:Number(d.default_account_id||0)}})}
function normalizeRows381(d){if(Array.isArray(d))return d;if(Array.isArray(d?.accounts))return d.accounts;if(Array.isArray(d?.rows))return d.rows;if(Array.isArray(d?.items))return d.items;return []}
function supplierAccounts381(id,force=false){id=Number(id||0);if(!id)return Promise.resolve([]);const key=[currentBu(),id].join(':');if(force)supplierCache381.delete(key);return cachedPromise381(supplierCache381,key,async()=>{const params=new URLSearchParams({business_unit_id:String(currentBu()),entity_type:'excavator_supplier',entity_id:String(id),include_archived:'0'});let rows=[];try{rows=normalizeRows381(await api('/api/v338/payee-accounts?'+params))}catch(_){rows=[]}
  // Compatibility fallback for older deployments/mocks while V30.38.1 rolls out. The
  // V330 endpoint reads the same supplier payee master and keeps slow-link workflows usable.
  if(!rows.length){try{const legacy=new URLSearchParams({business_unit_id:String(currentBu()),entity_type:'excavator_supplier',entity_id:String(id)});rows=normalizeRows381(await api('/api/v330/payee-accounts?'+legacy))}catch(_){}}
  return rows
})}
function compatibleSupplier381(rows,method){const m=txt(method).toLowerCase(),list=normalizeRows381(rows);return list.filter(x=>{let t=txt(x.method_type).toLowerCase();if(!t&&(x.bank_name||x.account_number||x.account_number_masked||x.iban))t='bank';if(!m)return true;if(m.includes('card'))return t==='card';if(m.includes('wallet'))return t==='wallet';if(m.includes('bank')||m.includes('cheque')||m.includes('check'))return t==='bank';return true})}
function buyForm381(){return document.querySelector('#v324WorkflowSurface form[onsubmit*="saveSimpleExcavatorMachine"],#modalRoot form[onsubmit*="saveSimpleExcavatorMachine"]')}
function setStatus381(sel,msg,kind=''){const field=sel?.closest?.('.field');if(!field)return;let s=field.querySelector('.v3381-account-status');if(!s){s=document.createElement('small');s.className='v3381-account-status';field.appendChild(s)}s.textContent=msg||'';s.className='v3381-account-status'+(kind?' '+kind:'')}
function loadingSelect381(sel,label){if(!sel)return;sel.disabled=true;sel.classList.add('v3381-account-loading');sel.innerHTML=`<option value="">${esc(t(label))}</option>`;sel.setCustomValidity('')}
function finishSelect381(sel){if(!sel)return;sel.disabled=false;sel.classList.remove('v3381-account-loading')}
function accountLabel381(a){return [a.name||a.label,a.financial_account_type||a.bank_name||a.method_type,a.currency||'KRW',a.account_number_masked||''].filter(Boolean).map(esc).join(' · ')}
function fillCompany381(sel,data,preferred=''){if(!sel)return;const rows=data?.rows||[],ids=rows.map(x=>String(x.id)),want=String(preferred||data?.defaultId||rows.find(x=>Number(x.is_default||0))?.id||rows[0]?.id||'');sel.innerHTML=`<option value="">${esc(t('Select company financial account'))}</option>`+rows.map(a=>`<option value="${Number(a.id)}">${accountLabel381(a)}</option>`).join('');if(want&&ids.includes(want))sel.value=want;finishSelect381(sel);sel.required=true;sel.setCustomValidity(sel.value?'':'Configure an active compatible company financial account.');setStatus381(sel,rows.length?`${rows.length} ${t('Company accounts loaded')}`:t('No compatible company account configured.'),rows.length?'good':'bad')}
function fillSupplier381(sel,rows,preferred=''){if(!sel)return;const ids=(rows||[]).map(x=>String(x.id)),want=String(preferred||rows.find(x=>Number(x.is_default||0))?.id||rows[0]?.id||'');sel.innerHTML=`<option value="">${esc(t('Select supplier receiver account'))}</option>`+(rows||[]).map(a=>`<option value="${Number(a.id)}">${accountLabel381(a)}</option>`).join('');if(want&&ids.includes(want))sel.value=want;finishSelect381(sel);sel.required=true;sel.setCustomValidity(sel.value?'':'Select or add the supplier receiver account.');setStatus381(sel,rows.length?`${rows.length} ${t('Supplier accounts loaded')}`:t('No compatible saved supplier account. Use Add / Manage Accounts.'),rows.length?'good':'bad')}
async function refreshTokenAccounts381(f=buyForm381(),opts={}){if(!f)return;const amount=num(f.purchase_token?.value),method=txt(f.token_payment_method?.value||'Bank'),electronic=isElectronic(method),supplierId=Number(f.supplier_id?.value||0),newSupplier=txt(f.supplier_option?.value)==='Other / New Supplier',wrap=f.querySelector('[data-v332-token-accounts]'),existing=f.querySelector('[data-v332-existing-payee]'),newBox=f.querySelector('[data-v332-new-payee]'),company=f.token_payment_account_id,receiver=f.token_receiver_account_id;
  if(wrap)wrap.style.display=amount>0?'block':'none';
  // Prefetch even while token is zero so slow links have data ready when the user needs it.
  companyAccounts381(method).catch(()=>{});if(supplierId)supplierAccounts381(supplierId).catch(()=>{});
  if(amount<=0)return;
  const oldCompany=String(company?.value||''),oldReceiver=String(receiver?.value||'');
  if(company)loadingSelect381(company,'Loading company accounts…');
  if(receiver&&electronic&&!newSupplier&&supplierId)loadingSelect381(receiver,'Loading supplier accounts…');
  if(!electronic&&receiver){receiver.required=false;receiver.setCustomValidity('')}
  if(existing)existing.style.display=electronic&&!newSupplier?'block':'none';if(newBox)newBox.style.display=electronic&&newSupplier?'block':'none';
  for(const n of ['token_new_receiver_label','token_new_receiver_bank_name','token_new_receiver_account_number','token_new_receiver_account_country','token_new_receiver_currency'])if(f.elements[n])f.elements[n].required=electronic&&newSupplier;
  
  const companyP=companyAccounts381(method,!!opts.forceCompany);
  const supplierP=electronic&&!newSupplier&&supplierId?supplierAccounts381(supplierId,!!opts.forceSupplier):Promise.resolve([]);
  const [companyResult,supplierResult]=await Promise.allSettled([companyP,supplierP]);
  if(company){if(companyResult.status==='fulfilled')fillCompany381(company,companyResult.value,oldCompany);else{finishSelect381(company);company.innerHTML=`<option value="">${esc(t('No compatible company account'))}</option>`;company.required=true;company.setCustomValidity(companyResult.reason?.message||'Company accounts could not be loaded.');setStatus381(company,t('Company accounts could not be loaded. Retry or check connection.'),'bad')}}
  if(!electronic||newSupplier)return;
  if(!supplierId){if(receiver){finishSelect381(receiver);receiver.innerHTML=`<option value="">${esc(t('Select supplier first'))}</option>`;receiver.required=true;receiver.setCustomValidity('Select a supplier before recording the token payment.');setStatus381(receiver,t('Select a supplier first.'),'bad')}return}
  if(receiver){if(supplierResult.status==='fulfilled'){const rows=compatibleSupplier381(supplierResult.value,method);fillSupplier381(receiver,rows,oldReceiver)}else{finishSelect381(receiver);receiver.innerHTML=`<option value="">${esc(t('Supplier accounts unavailable'))}</option>`;receiver.required=true;receiver.setCustomValidity(supplierResult.reason?.message||'Supplier accounts could not be loaded.');setStatus381(receiver,t('Supplier accounts could not be loaded. Retry or check connection.'),'bad')}}
}
window.v3381RefreshTokenAccounts=refreshTokenAccounts381;
window.v332RefreshTokenAccounts=refreshTokenAccounts381;

function prefetchBuy381(f=buyForm381(),supplierId=0){const method=txt(f?.token_payment_method?.value||'Bank');companyAccounts381(method).catch(()=>{});if(supplierId)supplierAccounts381(supplierId).catch(()=>{})}
const chooseBefore381=window.chooseBuySupplier;if(typeof chooseBefore381==='function')window.chooseBuySupplier=async function(id){const f=buyForm381(),sid=String(id)==='new'?0:Number(id||0);if(f&&sid){if(f.supplier_id)f.supplier_id.value=String(sid);if(f.supplier_option)f.supplier_option.value='';prefetchBuy381(f,sid);refreshTokenAccounts381(f).catch(()=>{})}else prefetchBuy381(f,0);const r=await chooseBefore381.apply(this,arguments);const form=buyForm381();if(form)refreshTokenAccounts381(form).catch(()=>{});return r};
const selectBefore381=window.selectBuySupplier;if(typeof selectBefore381==='function')window.selectBuySupplier=async function(value){const f=buyForm381(),s=(window._buySuppliers||[]).find(x=>txt(x.name).toLowerCase()===txt(value).toLowerCase()),sid=Number(s?.id||0);if(f&&sid){if(f.supplier_id)f.supplier_id.value=String(sid);if(f.supplier_option)f.supplier_option.value='';prefetchBuy381(f,sid);refreshTokenAccounts381(f).catch(()=>{})}const r=await selectBefore381.apply(this,arguments);const form=buyForm381();if(form)refreshTokenAccounts381(form).catch(()=>{});return r};

// Capture-phase handler bypasses legacy inline/closure routing and always opens the final shared manager.
document.addEventListener('click',e=>{const btn=e.target?.closest?.('[data-v332-manage-payee]');if(!btn)return;const f=btn.closest('form')||buyForm381();if(!f)return;e.preventDefault();e.stopImmediatePropagation();const id=Number(f.supplier_id?.value||0),s=(window._buySuppliers||[]).find(x=>Number(x.id)===id);if(!id)return toast(t('Select an existing supplier first. For a new supplier, enter the receiver account below.'));const opener=window.openCounterpartyAccountsV338||window.managePayeeAccountsV330;if(typeof opener!=='function')return toast(t('Account manager is unavailable. Refresh the screen and try again.'));opener('excavator_supplier',id,s?.name||'Supplier')},true);

const closeAccountsBefore381=window.v338CloseAccountManager;if(typeof closeAccountsBefore381==='function')window.v338CloseAccountManager=function(){companyCache381.clear();supplierCache381.clear();const r=closeAccountsBefore381.apply(this,arguments);setTimeout(()=>{const f=buyForm381();if(f)refreshTokenAccounts381(f,{forceSupplier:true}).catch(()=>{})},30);return r};
window.v337CloseAccountManager=window.v338CloseAccountManager;

function wireBuy381(){const f=buyForm381();if(!f||f.dataset.v3381Accounts==='1')return;f.dataset.v3381Accounts='1';prefetchBuy381(f,Number(f.supplier_id?.value||0));f.purchase_token?.addEventListener('input',()=>refreshTokenAccounts381(f).catch(()=>{}));f.token_payment_method?.addEventListener('change',()=>refreshTokenAccounts381(f,{forceCompany:true}).catch(()=>{}));f.token_payment_account_id?.addEventListener('change',()=>{f.token_payment_account_id.setCustomValidity(f.token_payment_account_id.value?'':'Select the company financial account.');if(f.token_payment_account_id.value)clearSaleVisual381(f.token_payment_account_id)});f.token_receiver_account_id?.addEventListener('change',()=>{f.token_receiver_account_id.setCustomValidity(f.token_receiver_account_id.value?'':'Select or add the supplier receiver account.')});refreshTokenAccounts381(f).catch(()=>{})}

let scheduled381=false;const observer381=new MutationObserver(()=>{if(scheduled381)return;scheduled381=true;requestAnimationFrame(()=>{scheduled381=false;wireSaleValidation381();wireBuy381()})});observer381.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>{wireSaleValidation381();wireBuy381()},0);setTimeout(()=>{wireSaleValidation381();wireBuy381()},500);

window.__BOM_V3381={version:VERSION,refreshTokenAccounts381,refreshSaleVisuals381,companyCache381,supplierCache381};
console.info(`Blue Ocean Market V${VERSION} hotfix loaded`);
})();
