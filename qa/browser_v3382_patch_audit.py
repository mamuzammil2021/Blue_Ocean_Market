import asyncio, pathlib, re
from playwright.async_api import async_playwright

PUB=pathlib.Path(__file__).resolve().parents[1]/'public'
html=(PUB/'index.html').read_text()
scripts=re.findall(r'<script src="([^"]+)"[^>]*></script>',html)
html=re.sub(r'<script src="[^"]+"[^>]*></script>','',html)
INIT=r'''(()=>{const m=new Map([['bo_token','T'],['bo_language','en'],['bo_unit','1']]);Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),key:i=>[...m.keys()][i]||null,get length(){return m.size}},configurable:true});window.__calls=[];window.__mock={'/api/me':{user:{id:1,name:'CEO',role:'CEO / Owner',preferred_language:'en',business_unit_id:null}},'/api/context':{units:[{id:1,name:'Excavator'}],selected_business_unit_id:1},'/api/access/me':{permissions:{},limits:{},assigned_units:[1]},'/api/excavator/overview':{summary:{},assets:[]},'/api/notifications':[],'/api/notifications/unread-count':{count:0},'/api/action-counts':{}};window.fetch=async function(input,opt={}){const u=typeof input==='string'?input:input.url,p=u.split('?')[0],method=(opt.method||'GET').toUpperCase(),at=performance.now();window.__calls.push({u,p,method,at});let b=window.__mock[p];if(typeof b==='function')b=await b(u,opt);let status=200;if(b&&typeof b==='object'&&b.__status){status=b.__status;b=b.body||{error:'error'}}if(b===undefined)b=method==='GET'?[]:{ok:true,id:999};return new Response(JSON.stringify(b),{status,headers:{'Content-Type':'application/json'}})};history.replaceState({},'','#dashboard')})()'''

async def main():
 results=[]; errors=[]
 def rec(name,ok,detail=''):
  results.append((name,bool(ok),str(detail)))
  print(('PASS' if ok else 'FAIL'),name,('— '+str(detail) if detail else ''))
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=await b.new_page(viewport={'width':1440,'height':1000})
  page.on('pageerror',lambda e: errors.append(str(e)))
  await page.set_content(html,wait_until='domcontentloaded'); await page.evaluate(INIT)
  for s in scripts: await page.add_script_tag(path=str(PUB/s.split('?')[0].lstrip('/')))
  await page.wait_for_timeout(700)
  rec('V30.38.2 patch overlay loaded',await page.evaluate("window.__BOM_V3382?.version==='30.38.2'"))

  # Real mouse interaction: two accounts on each side, select the non-default option.
  await page.evaluate(r'''(()=>{window.__BOM_V3381.companyCache381.clear();window.__BOM_V3381.supplierCache381.clear();window._buySuppliers=[{id:10,name:'Supplier Ten'}];window.__mock['/api/v320/financial-accounts/options']=(u)=>{const q=new URL(u,'https://x').searchParams,cur=q.get('currency')||'KRW';return {accounts:[{id:101,name:'Default Korea',financial_account_type:'Bank',currency:cur,account_number_masked:'****1111',is_default:1},{id:102,name:'Second Korea',financial_account_type:'Bank',currency:cur,account_number_masked:'****2222'}],default_account_id:101}};window.__mock['/api/v338/payee-accounts']=[{id:201,label:'Supplier Default',method_type:'Bank',bank_name:'KB',currency:'KRW',account_number_masked:'****3333',is_default:1,active:1},{id:202,label:'Supplier Second',method_type:'Bank',bank_name:'Hana',currency:'KRW',account_number_masked:'****4444',active:1}];window.__mock['/api/v338/payee-account-history']=[];(()=>{let w=document.getElementById('v324WorkflowSurface');if(!w){w=document.createElement('div');w.id='v324WorkflowSurface';document.body.appendChild(w)}w.style.display='block';w.innerHTML=`<form onsubmit="saveSimpleExcavatorMachine(event)"><input name="purchase_token" value="5000"><select name="token_payment_method"><option>Bank</option></select><input name="supplier_id" value="10"><input name="supplier_option" value=""><div data-v332-token-accounts><div class="grid g2"><div class="field"><label>Pay From</label><select name="token_payment_account_id"></select></div><div class="field" data-v332-existing-payee><label>Paid To</label><div style="display:flex;gap:8px"><select name="token_receiver_account_id"></select><button type="button" data-v332-manage-payee>Add / Manage Accounts</button></div></div></div><div data-v332-new-payee style="display:none"><div class="grid"></div></div></div></form>`})();window.__BOM_V3382.enhanceBuyAccounts382();window.__pending382=window.v332RefreshTokenAccounts(document.querySelector('form[onsubmit*=saveSimpleExcavatorMachine]'))})()''')
  await page.evaluate('window.__pending382'); await page.wait_for_timeout(100)
  rec('Pay From custom picker exists',await page.locator('select[name="token_payment_account_id"] + .v3382-account-picker').count()==1)
  payfrom_btn=page.locator('select[name="token_payment_account_id"] + .v3382-account-picker .v3382-picker-button')
  await payfrom_btn.click()
  visible=await page.locator('select[name="token_payment_account_id"] + .v3382-account-picker .v3382-picker-menu').is_visible()
  rec('Pay From list remains open after real mouse click',visible)
  await page.locator('select[name="token_payment_account_id"] + .v3382-account-picker .v3382-picker-option',has_text='Second Korea').click()
  rec('Pay From can switch away from default account',await page.locator('select[name="token_payment_account_id"]').input_value()=='102')

  paidto_btn=page.locator('select[name="token_receiver_account_id"] + .v3382-account-picker .v3382-picker-button')
  await paidto_btn.click()
  rec('Paid To list remains open after real mouse click',await page.locator('select[name="token_receiver_account_id"] + .v3382-account-picker .v3382-picker-menu').is_visible())
  await page.locator('select[name="token_receiver_account_id"] + .v3382-account-picker .v3382-picker-option',has_text='Supplier Second').click()
  rec('Paid To can switch away from default account',await page.locator('select[name="token_receiver_account_id"]').input_value()=='202')

  # Actual Manage button click after V30.38.2 removes conflicting legacy data hook.
  manage=page.locator('[data-v3382-manage-payee]')
  rec('Token Payment Manage button is repaired to V30.38.2 route',await manage.count()==1)
  await manage.click(); await page.wait_for_timeout(180)
  manager=await page.locator('#modalRoot').inner_text()
  rec('Actual Add / Manage Accounts click opens Supplier Accounts manager','Supplier Accounts' in manager and 'Supplier Default' in manager,manager[:140])
  await page.evaluate("closeModal(true)")

  # Refund engine: KRW balance, PKR refund, FX deduction and currency-matched accounts.
  await page.evaluate(r'''(()=>{window.__mock['/api/v320/financial-accounts/options']=(u)=>{const cur=new URL(u,'https://x').searchParams.get('currency')||'KRW';return {accounts:[{id:301,name:cur+' Company',financial_account_type:'Bank',currency:cur,account_number_masked:'****'+(cur==='PKR'?'7777':'8888')}],default_account_id:301}};window.__mock['/api/v338/payee-accounts']=[{id:401,label:'Buyer KRW',method_type:'Bank',currency:'KRW',bank_name:'KB',active:1},{id:402,label:'Buyer PKR',method_type:'Bank',currency:'PKR',bank_name:'HBL',active:1,is_default:1}];modal(`<h2>Refund Buyer Advance</h2><form onsubmit="fakeRefund382(event)"><div class="field"><label>Amount</label><input name="original_amount" type="number"></div><div class="field"><label>Currency</label><select name="currency"><option>KRW</option><option>PKR</option></select></div><div class="field"><label>FX</label><input name="fx_rate" type="number" value="1"></div><div class="field"><label>Method</label><select name="method"><option>Bank</option></select></div><div class="field"><label>Pay From</label><select name="payment_account_id"></select></div><div class="field"><label>Paid To</label><select name="receiver_account_id"></select></div><div class="actions"><button>Save</button></div></form>`);const f=document.querySelector('#modalRoot form');window.__BOM_V3382.configureRefund382(f,{available:47000,balanceCurrency:'KRW',receiverType:'excavator_buyer',receiverId:55});f.currency.value='PKR';f.currency.dispatchEvent(new Event('change',{bubbles:true}));f.original_amount.value='1000';f.fx_rate.value='4.8';f.original_amount.dispatchEvent(new Event('input',{bubbles:true}));f.fx_rate.dispatchEvent(new Event('input',{bubbles:true}))})()''')
  await page.wait_for_timeout(180)
  refund=await page.evaluate("(()=>{const f=document.querySelector('#modalRoot form');return {summary:f.querySelector('[data-v3382-refund-summary]').innerText,payFrom:f.payment_account_id.selectedOptions[0]?.textContent,paidTo:f.receiver_account_id.selectedOptions[0]?.textContent,receiverOptions:[...f.receiver_account_id.options].map(x=>x.textContent)}})()")
  rec('Refund preview clearly shows KRW deduction and remaining balance','47,000' in refund['summary'] and '4,800' in refund['summary'] and '42,200' in refund['summary'],refund['summary'])
  rec('Refund Pay From account is filtered to Refund Currency','PKR Company' in (refund['payFrom'] or ''),refund['payFrom'])
  rec('Refund Paid To list excludes currency-mismatched accounts',any('Buyer PKR' in x for x in refund['receiverOptions']) and not any('Buyer KRW' in x for x in refund['receiverOptions']),refund['receiverOptions'])
  await page.evaluate("closeModal(true)")

  # System-wide modal lifecycle: successful child closes, parent context restored.
  await page.evaluate(r'''(()=>{window.fakeSave382=async function(e){e.preventDefault();await api('/api/fake-save-382',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});toast('Saved')};window.__mock['/api/fake-save-382']={ok:true};modal('<h2>Parent Context</h2><div id="parent-marker">keep me</div>');modal('<h2>Child Action</h2><form onsubmit="fakeSave382(event)"><input name="x" value="1"><button type="submit">Save Child</button></form>')})()''')
  await page.get_by_role('button',name='Save Child').click(); await page.locator('#bom314FormConfirm').click(); await page.wait_for_timeout(420)
  modaltext=await page.locator('#modalRoot').inner_text()
  rec('Successful child action automatically closes only child modal','Parent Context' in modaltext and 'Child Action' not in modaltext,modaltext[:120])

  # Failure leaves action dialog open.
  await page.evaluate(r'''(()=>{window.fakeFail382=async function(e){e.preventDefault();try{await api('/api/fake-fail-382',{method:'POST',body:'{}'})}catch(x){toast(x.message)}};window.__mock['/api/fake-fail-382']={__status:400,body:{error:'Expected failure'}};modal('<h2>Failure Action</h2><form onsubmit="fakeFail382(event)"><button type="submit">Try Save</button></form>')})()''')
  await page.get_by_role('button',name='Try Save').click(); await page.locator('#bom314FormConfirm').click(); await page.wait_for_timeout(420)
  rec('Failed action keeps dialog open for correction','Failure Action' in await page.locator('#modalRoot').inner_text())
  await page.evaluate("closeAllModalsV3242(true)")

  # Costs: 5 entries inside scroll body, total outside, locked edit compact and disabled.
  await page.evaluate(r'''(()=>{const rows=[];for(let i=1;i<=5;i++){rows.push(excavatorCostRowV319({id:i,type:'Cost '+i,transaction_date:'2026-09-18',amount:1000*i,currency:'KRW',status:'Open',finance_verification_status:i===2?'Verified / Correct':'Pending',finance_accounting_status:i===3?'Posted':'Pending'},99))}let w=document.getElementById('v324WorkflowSurface');if(!w){w=document.createElement('div');w.id='v324WorkflowSurface';document.body.appendChild(w)}w.style.display='block';w.innerHTML=`<div class="machine-sections"><div class="card"><div class="section-title"><h3>Costs</h3><button>+ Add Cost</button></div>${rows.join('')}<div class="row total"><span>Total machine cost</span><b>₩ 15,000</b></div></div></div>`;window.__BOM_V3382.polishCostCard382()})()''')
  cost=await page.evaluate("(()=>{const c=document.querySelector('.v3382-cost-card'),list=c?.querySelector('.v3382-cost-list'),total=c?.querySelector(':scope > .row.total'),lock=c?.querySelector('.v3382-locked-edit');return {rows:list?.querySelectorAll(':scope > .row').length,totalOutside:!!total&&!list.contains(total),locked:!!lock&&lock.disabled,yellow:c?.querySelectorAll('.v335-cost-locked').length,actions:[...c.querySelectorAll('.v319-cost-actions')].every(x=>{const row=x.closest('.row'),rb=row.getBoundingClientRect(),xb=x.getBoundingClientRect();return xb.right>rb.left+rb.width*.72})}})()")
  rec('Machine Costs entries are isolated in bounded scroll list',cost['rows']==5,cost)
  rec('Total machine cost stays outside scroll list',cost['totalOutside'],cost)
  rec('Verified/posted cost uses compact disabled lock Edit and no yellow card',cost['locked'] and cost['yellow']==0,cost)
  rec('Machine Cost actions align to the right',cost['actions'],cost)

  rec('V30.38.2 focused browser audit has no uncaught page errors',len(errors)==0,errors[:5])
  await b.close()
 failed=[x for x in results if not x[1]]
 print('\nSUMMARY',len(results),'checks',len(failed),'failed')
 if failed:
  for x in failed: print('FAILED:',x)
  raise SystemExit(1)

if __name__=='__main__': asyncio.run(main())
