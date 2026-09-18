import asyncio, pathlib, re, json
from playwright.async_api import async_playwright

PUB=pathlib.Path(__file__).resolve().parents[1]/'public'
html=(PUB/'index.html').read_text()
scripts=re.findall(r'<script src="([^"]+)"[^>]*></script>',html)
html=re.sub(r'<script src="[^"]+"[^>]*></script>','',html)
INIT=r'''(()=>{const m=new Map([['bo_token','T'],['bo_language','en'],['bo_unit','1']]);Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),key:i=>[...m.keys()][i]||null,get length(){return m.size}},configurable:true});window.__calls=[];window.__mock={'/api/me':{user:{id:1,name:'CEO',role:'CEO / Owner',preferred_language:'en',business_unit_id:null}},'/api/context':{units:[{id:1,name:'Excavator'}],selected_business_unit_id:1},'/api/access/me':{permissions:{},limits:{},assigned_units:[1]},'/api/excavator/overview':{summary:{},assets:[]},'/api/notifications':[],'/api/notifications/unread-count':{count:0},'/api/action-counts':{}};window.fetch=async function(input,opt={}){const u=typeof input==='string'?input:input.url,p=u.split('?')[0],method=(opt.method||'GET').toUpperCase(),at=performance.now();window.__calls.push({u,p,method,at});let b=window.__mock[p];if(typeof b==='function')b=await b(u,opt);if(b===undefined)b=method==='GET'?[]:{ok:true,id:999};return new Response(JSON.stringify(b),{status:200,headers:{'Content-Type':'application/json'}})};history.replaceState({},'','#dashboard')})()'''

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
  rec('V30.38.1 hotfix overlay loaded',await page.evaluate("window.__BOM_V3381?.version==='30.38.1'"))

  # Sell Machine: untouched required fields remain neutral, touched invalid field shows,
  # corrected value clears stale custom validity and all red classes immediately.
  await page.evaluate(r'''(()=>{document.getElementById('content').innerHTML=`<form id="excavatorSaleForm" data-current-paid="0"><div class="field"><input name="customer_name" required></div><div class="field"><input name="selling_price" type="number" min="1" required></div><div class="field"><input name="shipping_reference" required></div><select name="payment_source"><option value="new_payment" selected>new_payment</option></select><input name="buyer_id" value=""><input name="payment_amount"><select name="payment_currency"><option>KRW</option></select><input name="payment_fx_rate" value="1"><select name="payment_method"><option>Bank</option></select><input name="payment_date"><input name="payment_reference"><input name="payment_evidence" type="file"><div id="exNewPaymentFields"></div><span id="exPaymentCoverageStatus"></span></form>`})()''')
  await page.wait_for_timeout(120)
  initial=await page.evaluate("(()=>{const f=document.getElementById('excavatorSaleForm');return {red:f.querySelectorAll('.v335-field-invalid,.v326-invalid-field,.v338-required-missing').length,customer:f.customer_name.className,field:f.customer_name.closest('.field').className}})()")
  rec('Sell Machine required fields are not red before interaction',initial['red']==0,initial)
  await page.locator('#excavatorSaleForm input[name="customer_name"]').focus(); await page.locator('#excavatorSaleForm input[name="selling_price"]').focus(); await page.wait_for_timeout(30)
  touched=await page.evaluate("document.querySelector('#excavatorSaleForm [name=customer_name]').closest('.field').className")
  rec('Sell Machine still validates after field interaction','v335-field-invalid' in touched or 'v326-invalid-field' in touched,touched)
  await page.evaluate("(()=>{const e=document.querySelector('#excavatorSaleForm [name=customer_name]');e.setCustomValidity('Customer / Buyer is required.');e.closest('.field').classList.add('v326-invalid-field')})()")
  await page.locator('#excavatorSaleForm input[name="customer_name"]').fill('Valid Buyer'); await page.locator('#excavatorSaleForm input[name="customer_name"]').dispatch_event('input'); await page.wait_for_timeout(40)
  corrected=await page.evaluate("(()=>{const e=document.querySelector('#excavatorSaleForm [name=customer_name]');return {custom:e.validity.customError,msg:e.validationMessage,field:e.closest('.field').className,cls:e.className}})()")
  rec('Entering a valid Sell Machine value immediately clears stale red/error state',not corrected['custom'] and 'invalid' not in corrected['field'] and 'v338-required-missing' not in corrected['cls'],corrected)

  # Buy Machine: slow account endpoints are parallel, loading states appear immediately,
  # one eligible account remains enabled/selectable and is selected.
  await page.evaluate(r'''(()=>{window.__BOM_V3381.companyCache381.clear();window.__BOM_V3381.supplierCache381.clear();window._buySuppliers=[{id:10,name:'Supplier Ten'}];window.__mock['/api/v320/financial-accounts/options']=async()=>{await new Promise(r=>setTimeout(r,160));return {accounts:[{id:101,name:'Korea Acc',financial_account_type:'Bank',currency:'KRW',account_number_masked:'****1234'}],default_account_id:101}};window.__mock['/api/v338/payee-accounts']=async()=>{await new Promise(r=>setTimeout(r,160));return [{id:201,label:'Supplier Main',method_type:'Bank',bank_name:'KB',currency:'KRW',account_number_masked:'****9988',is_default:1,active:1,account_holder:'Supplier Ten',account_country:'South Korea'}]};window.__mock['/api/v338/payee-account-history']=[];window.__calls=[];document.getElementById('content').innerHTML=`<form data-v3381-accounts="1" onsubmit="saveSimpleExcavatorMachine(event)"><input name="purchase_token" value="5000"><select name="token_payment_method"><option>Bank</option></select><input name="supplier_id" value="10"><input name="supplier_option" value=""><div data-v332-token-accounts><div class="grid g2"><div class="field"><select name="token_payment_account_id"></select></div><div class="field" data-v332-existing-payee><div><select name="token_receiver_account_id"></select><button type="button" data-v332-manage-payee>Add / Manage Accounts</button></div><small data-v332-payee-help></small></div></div><div data-v332-new-payee style="display:none"><div class="grid"></div></div></div></form>`;window.__pending381=window.v332RefreshTokenAccounts(document.querySelector('form[onsubmit*=saveSimpleExcavatorMachine]'))})()''')
  await page.wait_for_timeout(25)
  loading=await page.evaluate("(()=>{const f=document.querySelector('form[onsubmit*=saveSimpleExcavatorMachine]');return {company:f.token_payment_account_id.textContent,receiver:f.token_receiver_account_id.textContent,disabled:[f.token_payment_account_id.disabled,f.token_receiver_account_id.disabled],calls:window.__calls.map(x=>({p:x.p,at:x.at}))}})()")
  rec('Slow connection shows clear account-loading states','Loading company accounts' in loading['company'] and 'Loading supplier accounts' in loading['receiver'],loading)
  starts=[x['at'] for x in loading['calls'] if x['p'] in ['/api/v320/financial-accounts/options','/api/v338/payee-accounts']]
  rec('Pay From and Paid To requests start in parallel',len(starts)>=2 and max(starts)-min(starts)<60,starts)
  await page.evaluate('window.__pending381'); await page.wait_for_timeout(20)
  loaded=await page.evaluate("(()=>{const f=document.querySelector('form[onsubmit*=saveSimpleExcavatorMachine]');return {company:f.token_payment_account_id.value,receiver:f.token_receiver_account_id.value,co:f.token_payment_account_id.options.length,ro:f.token_receiver_account_id.options.length,disabled:[f.token_payment_account_id.disabled,f.token_receiver_account_id.disabled],valid:[f.token_payment_account_id.validationMessage,f.token_receiver_account_id.validationMessage]}})()")
  rec('Single Pay From account is visible, enabled and selected',loaded['company']=='101' and loaded['co']==2 and loaded['disabled'][0] is False,loaded)
  rec('Single Paid To account is visible, enabled and selected',loaded['receiver']=='201' and loaded['ro']==2 and loaded['disabled'][1] is False,loaded)

  # Add / Manage button always routes to final shared account manager.
  await page.get_by_role('button',name='Add / Manage Accounts',exact=True).click(); await page.wait_for_timeout(240)
  manager=await page.locator('#modalRoot').inner_text()
  rec('Buy Machine Add / Manage Accounts opens shared Supplier Accounts manager','Supplier Accounts' in manager and 'Supplier Main' in manager,manager[:180])

  rec('V30.38.1 browser hotfix audit has no uncaught page errors',len(errors)==0,errors[:5])
  await b.close()
 failed=[x for x in results if not x[1]]
 print('\nSUMMARY',len(results),'checks',len(failed),'failed')
 if failed:
  for x in failed: print('FAILED:',x)
  raise SystemExit(1)

if __name__=='__main__': asyncio.run(main())
