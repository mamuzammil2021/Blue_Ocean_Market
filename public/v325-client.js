// Blue Ocean Market V30.25.1 — critical integrity hotfix on the V30.25 Finance Integrity layer.
(()=>{
  const VERSION='30.25.1';
  try{Object.assign(KO,{
    'Money In':'입금','Money Out':'출금','Transfer':'이체','Source Control':'원천 통제','Operational Source Control':'운영 원천 통제',
    'Finance Verified':'재무 검증 완료','Finance Verification Not Required':'재무 검증 불필요','Statement':'명세서','Search Supplier / Seller':'공급업체 / 판매자 검색','Search Buyer':'구매자 검색'
  })}catch(_){}

  // Cash references are optional everywhere. Non-cash remains mandatory.
  function applyCashReferenceRule(root=document){
    root.querySelectorAll('form').forEach(form=>{
      const method=form.querySelector('[name="payment_method"],[name="method"],select[name*="method"]');
      const ref=form.querySelector('[name="reference"],[name="payment_reference"]');
      if(!method||!ref||ref.dataset.v325CashRule)return;
      ref.dataset.v325CashRule='1';
      const label=ref.closest('.field')?.querySelector('label');if(label&&!label.dataset.v325ReferenceLabel)label.dataset.v325ReferenceLabel=label.textContent||'Reference';const sync=()=>{const cash=String(method.value||'').trim().toLowerCase()==='cash';ref.required=!cash;if(cash)ref.setCustomValidity('');ref.placeholder=cash?'Optional for cash':'Required for non-cash';if(label){const original=label.dataset.v325ReferenceLabel||label.textContent||'Reference';label.textContent=cash?original.replace(/\s*\*\s*$/,'').trim():original;}};
      method.addEventListener('change',sync);ref.addEventListener('input',sync);sync();
    });
  }
  new MutationObserver(()=>applyCashReferenceRule()).observe(document.documentElement,{subtree:true,childList:true});
  setTimeout(()=>applyCashReferenceRule(),0);

  // Robust BU-scoped searchable dropdown. It only enhances options already returned
  // by the active BU endpoint, so records can never leak across business units.
  function enhanceMasterSearch(input,items,onPick,{newLabel='Other / New'}={}){
    if(!input||input.dataset.v325Search)return;input.dataset.v325Search='1';input.removeAttribute('list');
    const wrap=document.createElement('div');wrap.className='v325-master-search';input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);
    const menu=document.createElement('div');menu.className='v325-master-menu';wrap.appendChild(menu);
    const render=()=>{const q=String(input.value||'').trim().toLowerCase(),list=items.filter(x=>!q||x.search.includes(q)).slice(0,60);menu.innerHTML=list.map(x=>`<button type="button" data-id="${x.id}" class="v325-master-option"><b>${esc(x.label)}</b>${x.sub?`<small>${esc(x.sub)}</small>`:''}</button>`).join('')+`<button type="button" data-new="1" class="v325-master-option"><b>${esc(t(newLabel))}</b></button>`;menu.hidden=false;};
    input.addEventListener('focus',render);input.addEventListener('input',render);
    menu.addEventListener('mousedown',e=>e.preventDefault());menu.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.new){input.value=newLabel;onPick(null,newLabel)}else{const x=items.find(z=>String(z.id)===b.dataset.id);if(x){input.value=x.label;onPick(x,x.label)}}menu.hidden=true;});
    input.addEventListener('keydown',e=>{if(e.key==='Escape')menu.hidden=true});input.addEventListener('blur',()=>setTimeout(()=>menu.hidden=true,120));
  }
  const style=document.createElement('style');style.textContent=`.v325-master-search{position:relative;width:100%}.v325-master-menu{position:absolute;z-index:45000;left:0;right:0;top:calc(100% + 4px);max-height:300px;overflow:auto;background:#fff;border:1px solid #d6dee8;border-radius:10px;box-shadow:0 16px 40px rgba(15,23,42,.18);padding:5px}.v325-master-menu[hidden]{display:none}.v325-master-option{display:flex;width:100%;text-align:left;border:0;background:transparent;padding:9px 10px;border-radius:7px;flex-direction:column;gap:2px}.v325-master-option:hover,.v325-master-option:focus{background:#eef5ff}.v325-master-option small{color:#64748b}.v325-statement-actions{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.v325-scoped-select-search{position:relative;margin-bottom:6px}.v325-scoped-select-search>input{width:100%}`;document.head.appendChild(style);


  // Add a dependable search box next to any BU-scoped native Buyer/Supplier/Customer selector.
  // The original <select> stays available as a fallback; search results are built only from
  // its already-authorized options, so this never broadens the active business-unit scope.
  function enhanceScopedSelect(select){
    if(!select||select.dataset.v325ScopedSearch||select.multiple||select.disabled)return;
    const name=String(select.name||select.id||'').toLowerCase();
    if(!/(buyer|supplier|seller|customer|store).*(_id|select)|^(buyer_id|supplier_id|seller_id|customer_id|store_id)$/.test(name))return;
    const options=[...select.options].filter(o=>o.value&&o.textContent.trim());if(options.length<2)return;
    select.dataset.v325ScopedSearch='1';
    const box=document.createElement('div');box.className='v325-scoped-select-search';
    const input=document.createElement('input');input.type='search';input.autocomplete='off';input.placeholder=t(name.includes('supplier')||name.includes('seller')?'Search Supplier / Seller':name.includes('buyer')?'Search Buyer':'Search');
    const menu=document.createElement('div');menu.className='v325-master-menu';menu.hidden=true;box.append(input,menu);select.parentNode.insertBefore(box,select);
    const rows=()=>[...select.options].filter(o=>o.value).map(o=>({value:o.value,label:o.textContent.trim(),search:o.textContent.trim().toLowerCase()}));
    const render=()=>{const q=String(input.value||'').trim().toLowerCase(),list=rows().filter(x=>!q||x.search.includes(q)).slice(0,60);menu.innerHTML=list.map(x=>`<button type="button" class="v325-master-option" data-value="${esc(x.value)}"><b>${esc(x.label)}</b></button>`).join('')||`<div class="empty">${esc(t('No matching records'))}</div>`;menu.hidden=false};
    input.addEventListener('focus',render);input.addEventListener('input',render);menu.addEventListener('mousedown',e=>e.preventDefault());
    menu.addEventListener('click',e=>{const b=e.target.closest('[data-value]');if(!b)return;select.value=b.dataset.value;select.dispatchEvent(new Event('change',{bubbles:true}));input.value=select.selectedOptions[0]?.textContent?.trim()||'';menu.hidden=true});
    input.addEventListener('keydown',e=>{if(e.key==='Escape')menu.hidden=true});input.addEventListener('blur',()=>setTimeout(()=>menu.hidden=true,120));
    select.addEventListener('change',()=>{if(document.activeElement!==input)input.value=select.selectedOptions[0]?.value?select.selectedOptions[0].textContent.trim():''});
    if(select.value)input.value=select.selectedOptions[0]?.textContent?.trim()||'';
  }
  function enhanceScopedSelectors(root=document){root.querySelectorAll('select[name],select[id]').forEach(enhanceScopedSelect)}
  new MutationObserver(()=>enhanceScopedSelectors()).observe(document.documentElement,{subtree:true,childList:true});setTimeout(()=>enhanceScopedSelectors(),0);

  if(typeof window.excavatorNewMachine==='function'){
    const old=window.excavatorNewMachine;window.excavatorNewMachine=async function(){const r=await old.apply(this,arguments);try{const input=document.getElementById('buySupplierSearch');if(document.getElementById('buySupplierResults')){input?.removeAttribute('data-v325-search');return r}const suppliers=await api('/api/excavator/suppliers');enhanceMasterSearch(input,suppliers.map(s=>({id:s.id,label:s.name,sub:[s.location,s.phone,`${Number(s.available_machine_count||0)} available machine(s)`].filter(Boolean).join(' · '),search:[s.name,s.location,s.phone,s.contact_person].filter(Boolean).join(' ').toLowerCase()})),(x,label)=>selectBuySupplier(x?x.name:'Other / New Supplier'),{newLabel:'Other / New Supplier'})}catch(e){console.warn('V30.25 supplier search',e.message)}return r};
  }

  // Buyer/Supplier Statement actions are native to the base profile headers in V30.25.1.

  // Accounting UI explains the new source-control rule.
  if(typeof window.postingOpenV318==='function'){
    const old=window.postingOpenV318;window.postingOpenV318=async function(id){const r=await old.apply(this,arguments);try{const d=await api('/api/accounting/posting-control/'+id),root=document.getElementById('modalRoot');if(d.finance?.operational&&root&&!root.querySelector('[data-v325-source-control]')){const box=document.createElement('div');box.dataset.v325SourceControl='1';box.className='workspace-banner';box.innerHTML=`<b>${esc(t('Operational Source Control'))}</b><span>${esc(t('Finance Verification Not Required'))} · ${esc(d.finance.source_control||'Completed / Approved')}</span>`;root.querySelector('.modal')?.prepend(box)}}catch(_){}return r}
  }

  function paymentReferenceV325(method){
    const m=String(method||'').trim();if(!m||/^cash$/i.test(m)||/^(credit|receivable|payable|buyer advance|advance balance|supplier credit|allocation)$/i.test(m))return Promise.resolve('');
    return new Promise(resolve=>{const host=document.getElementById('confirmRoot');host.innerHTML=`<div class="confirm-layer"><div class="confirm-dialog" role="dialog" aria-modal="true"><h2>${esc(t('Payment Reference'))}</h2><p>${esc(t('Enter the bank/card/online payment reference before continuing.'))}</p><label class="confirm-reason-label">${esc(t('Payment Reference'))} *</label><input id="v325PaymentReference" class="confirm-reason" autocomplete="off" placeholder="${esc(t('Required for non-cash'))}"><div id="v325RefError" class="form-error"></div><div class="actions"><button class="btn" id="v325RefCancel">${esc(t('Cancel'))}</button><button class="btn primary" id="v325RefOk">${esc(t('Continue'))}</button></div></div></div>`;try{translateElement(host)}catch(_){}const done=v=>{host.innerHTML='';resolve(v)};host.querySelector('#v325RefCancel').onclick=()=>done(null);host.querySelector('#v325RefOk').onclick=()=>{const v=host.querySelector('#v325PaymentReference').value.trim();if(!v){host.querySelector('#v325RefError').textContent=t('Payment Reference')+' '+t('Required');return}done(v)};host.querySelector('.confirm-layer').onclick=e=>{if(e.target===e.currentTarget)done(null)};host.querySelector('#v325PaymentReference')?.focus()})
  }

  // MIMI POS: a completed cash/card/bank sale creates one operational sale and one real payment event.
  if(typeof window.v320ChooseFinancialAccount==='function'){
    window.saveROrder=async function(){
      if(!window._rItems?.length)return toast('Add menu items');
      try{const type=document.getElementById('rType').value,table=document.getElementById('rTable').value;if(type==='Dine-in'&&!table)return toast('Select an available table');const method=document.getElementById('rPayment').value,accountId=await window.v320ChooseFinancialAccount(method,selectedUnitId||me?.business_unit_id);if(!/^(credit|receivable|payable|buyer advance|advance balance|supplier credit|allocation)$/i.test(method)&&accountId===null)return;const payment_reference=await paymentReferenceV325(method);if(payment_reference===null)return;const d=await api('/api/restaurant/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({table_id:table||null,order_type:type,customer_name:document.getElementById('rCustomer').value,items:window._rItems})});const sale=await api('/api/restaurant/orders/'+d.id+'/close',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payment_method:method,payment_account_id:accountId,payment_reference})});if(sale.approval_required){toast(sale.message||'Sale submitted for approval. The restaurant order remains open.');loadView();return}closeModal();toast('Order closed and posted');loadView();if(sale.id)printReceipt(d.id)}catch(x){toast(x.message)}
    };
    window.closeOpenOrder=async function(id){
      const pay=await choiceAction({title:'Close & Pay Order',message:'Select the payment method before finalizing this order.',label:'Payment Method',options:['Cash','Card','Bank','Credit'],defaultValue:'Cash',confirmLabel:'Continue',details:[{label:'Order',value:'#'+id}]});if(pay===null)return;
      try{const accountId=await window.v320ChooseFinancialAccount(pay,selectedUnitId||me?.business_unit_id);if(!/^(credit|receivable|payable|buyer advance|advance balance|supplier credit|allocation)$/i.test(pay)&&accountId===null)return;const payment_reference=await paymentReferenceV325(pay);if(payment_reference===null)return;await api('/api/restaurant/orders/'+id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({order_type:document.getElementById('erType').value,table_id:document.getElementById('erTable').value||null,customer_name:document.getElementById('erCustomer').value,items:window._rEditItems})});const d=await api('/api/restaurant/orders/'+id+'/close',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payment_method:pay,payment_account_id:accountId,payment_reference})});if(d.approval_required)return toast(d.message||'Sale submitted for approval. The order remains open.');closeModal();toast('Order closed and posted');loadView();if(d.id)printReceipt(d.id)}catch(x){toast(x.message)}
    };
  }

  // Finance is a cash-movement view in V30.25. Accounting continues to carry Revenue/Expense recognition.
  if(typeof window.financeRowHtml==='function'){
    const oldFinanceRow=window.financeRowHtml;window.financeRowHtml=function(x){const copy={...x,type:Number(x.cash_effect||0)>0?'Money In':Number(x.cash_effect||0)<0?'Money Out':x.type};return oldFinanceRow(copy)};
  }
  // System Settings is a first-class base navigation item in V30.25.1; no timed DOM/nav injection is used.
  window.__BOM_V325={version:VERSION,applyCashReferenceRule,enhanceMasterSearch};
})();
