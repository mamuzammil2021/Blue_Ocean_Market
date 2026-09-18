import asyncio, pathlib, re
from playwright.async_api import async_playwright

PUB=pathlib.Path(__file__).resolve().parents[1]/'public'
html=(PUB/'index.html').read_text()
scripts=re.findall(r'<script src="([^"]+)"[^>]*></script>',html)
html=re.sub(r'<script src="[^"]+"[^>]*></script>','',html)
INIT=r'''(()=>{const m=new Map([['bo_token','T'],['bo_language','en'],['bo_unit','1']]);Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),key:i=>[...m.keys()][i]||null,get length(){return m.size}},configurable:true});window.__calls=[];window.__mock={'/api/me':{user:{id:1,name:'CEO',role:'CEO / Owner',preferred_language:'en',business_unit_id:null}},'/api/context':{units:[{id:1,name:'Excavator'}],selected_business_unit_id:1},'/api/access/me':{permissions:{},limits:{},assigned_units:[1]},'/api/excavator/overview':{summary:{},assets:[]},'/api/notifications':[],'/api/notifications/unread-count':{count:0},'/api/action-counts':{}};window.fetch=async function(input,opt={}){const u=typeof input==='string'?input:input.url,p=u.split('?')[0],method=(opt.method||'GET').toUpperCase();window.__calls.push({u,p,method,body:opt.body||null});let b=window.__mock[p];if(typeof b==='function')b=await b(u,opt);if(b===undefined)b=method==='GET'?[]:{ok:true,id:999};return new Response(JSON.stringify(b),{status:200,headers:{'Content-Type':'application/json'}})};history.replaceState({},'','#dashboard')})()'''

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
  await page.wait_for_timeout(800)
  rec('V30.38 overlay loaded',await page.evaluate("window.__BOM_V338?.version==='30.38.0'"))
  rec('Shared settlement engine loaded',await page.evaluate("typeof window.BOMSettlementV338?.calculateExcavatorSaleSettlementV338==='function'"))

  # Pakistan resale: exact seven sections and retained selected child context.
  resale={
   'buyer':{'id':7,'name':'Ahmed Khan','country':'Pakistan'},
   'summary':{'total_share_due_pkr':100000,'received_allocated_pkr':60000,'outstanding_pkr':40000,'unallocated_credit_pkr':5000,'resold_machines':2,'settled_machines':1},
   'resales':[{'id':11,'asset_no':'EX-11','machine_name':'DX225','resale_price_pkr':5000000,'buyer_share_pkr':100000,'status':'Active'}],
   'payments':[{'id':21,'payment_date':'2026-09-18','amount_pkr':65000,'allocated_pkr':60000,'unallocated_pkr':5000,'reference':'PKR21','status':'Completed'}],
   'transfers':[{'id':31,'transfer_date':'2026-09-18','pkr_amount':30000,'krw_amount':150000,'reference':'TR31','status':'Completed'}]
  }
  await page.evaluate("m=>Object.assign(window.__mock,m)",{
   '/api/v327/excavator/buyers/7/pakistan-resales':resale,
   '/api/v330/excavator/buyers/7/resale-credit-summary':{'total_received_pkr':65000,'allocated_pkr':60000,'refunded_pkr':0,'available_credit_pkr':5000},
   '/api/v338/excavator/buyers/7/resale-refunds':[{'id':41,'refund_type':'Credit Refund','refund_date':'2026-09-18','amount_pkr':1000,'krw_amount':5000,'reference':'RF41','status':'Completed'}],
   '/api/excavator/buyers/7':{'buyer':resale['buyer'],'documents':[]}
  })
  await page.evaluate('openPakistanResalesV327(7)'); await page.wait_for_timeout(100)
  tabs=await page.locator('[data-v338-resale-tabs] button').all_inner_texts()
  expected=['Overview','Resale Records','Payments & Settlements','Credit','Refunds','Pakistan → Korea Bank Transfers','Documents']
  rec('Pakistan Resales has exact seven profile sections',tabs==expected,tabs)
  await page.get_by_role('button',name='Pakistan → Korea Bank Transfers',exact=True).click(); await page.wait_for_timeout(25)
  transfer=await page.locator('#v338PakistanResaleBody').inner_text()
  rec('Pakistan → Korea Bank Transfers is a real selected section','Cash movement only' in transfer and 'TR31' in transfer,transfer[:130])
  await page.evaluate('openPakistanResalesV327(7)'); await page.wait_for_timeout(60)
  active=await page.locator('[data-v338-resale-tabs] button.active').inner_text()
  rec('Pakistan Resale selected section survives refresh/child return',active=='Pakistan → Korea Bank Transfers',active)

  # Shared account manager exposes edit/archive/history and performs controlled update via Review & Confirm.
  accounts=[{'id':201,'label':'Main Bank','method_type':'Bank','bank_name':'KB','currency':'KRW','account_number_masked':'****2222','is_default':1,'active':1,'account_holder':'Akmal Abdullah','account_country':'South Korea','usage_count':3}]
  history=[{'id':1,'account_id':201,'action':'Created','created_at':'2026-09-18','changed_by_name':'CEO','reason':'Initial'}]
  await page.evaluate("m=>Object.assign(window.__mock,m)",{'/api/v338/payee-accounts':accounts,'/api/v338/payee-account-history':history})
  await page.evaluate("openCounterpartyAccountsV338('excavator_supplier',10,'Akmal Abdullah')"); await page.wait_for_timeout(60)
  manager=await page.locator('#modalRoot .v337-account-manager').inner_text()
  rec('Shared account manager exposes Edit, Archive and Account History',all(x in manager for x in ['Edit','Archive','Account History']),manager[:160])
  await page.get_by_role('button',name='Edit',exact=True).click(); await page.wait_for_timeout(20)
  await page.locator('#modalRoot input[name="label"]').fill('Updated Main Bank')
  await page.locator('#modalRoot input[name="reason"]').fill('QA controlled update')
  await page.locator('#modalRoot button[type="submit"]').click(); await page.wait_for_timeout(30)
  rec('Account update requires Review & Confirm',await page.locator('#confirmRoot .confirm-dialog').count()==1)
  if await page.locator('#confirmRoot .confirm-dialog').count():
   await page.evaluate("(document.getElementById('bom314FormConfirm')||document.getElementById('confirmOk'))?.click()"); await page.wait_for_timeout(150)
  calls=await page.evaluate("({puts:window.__calls.filter(x=>x.method==='PUT').map(x=>x.p),all:window.__calls.slice(-10).map(x=>[x.method,x.p]),confirm:document.getElementById('confirmRoot').innerText,form:document.querySelector('#modalRoot form')?.outerHTML.slice(0,500),toast:document.getElementById('toastRoot')?.innerText})")
  rec('Account edit calls V30.38 controlled update endpoint','/api/v338/payee-accounts/201' in calls['puts'],calls)
  await page.evaluate('v338CloseAccountManager()'); await page.wait_for_timeout(20)

  # Finance collapsible filters; Accounting statuses remain outside the collapsed filter shell.
  await page.evaluate(r'''(()=>{document.getElementById('content').innerHTML=`<div id="financeRecordsPanel"><div class="finance-filterbar v337-filter-shell"><input id="financeSearch"><select id="financeStatusFilter"><option value=""></option></select><select id="financeTypeFilter"><option value=""></option></select><select id="financeEvidenceFilter"><option value=""></option></select><div class="v335-date-range"><input id="v335FinanceFrom" type="date"><input id="v335FinanceTo" type="date"></div></div></div>`})()''')
  await page.wait_for_timeout(100)
  rec('Finance filter toolbar is collapsible',await page.locator('[data-v338-filter-toggle="finance"]').count()==1)
  await page.evaluate("v338ToggleFilters('finance')"); await page.wait_for_timeout(15)
  rec('Finance filter body actually collapses',await page.locator('[data-v338-filter-body="finance"]').evaluate("e=>e.classList.contains('v338-collapsed')"))

  await page.evaluate(r'''(()=>{document.getElementById('content').innerHTML=`<div class="card"><div class="v337-posting-shell"><input id="v318PostingSearch"><div class="v335-date-range"><input id="v335PostingFrom" type="date"><input id="v335PostingTo" type="date"></div><div class="v318-control-tabs"><button>Pending</button><button>Posted</button></div></div></div>`})()''')
  await page.wait_for_timeout(100)
  status_outside=await page.evaluate("(()=>{const s=document.querySelector('[data-v338-posting-status]'),f=document.querySelector('[data-v338-filter-body=\"posting\"]');return !!s&&!!f&&!f.contains(s)&&s.contains(document.querySelector('.v318-control-tabs'))})()")
  rec('Accounting posting-status controls remain outside collapsible filters',status_outside)
  await page.evaluate("v338ToggleFilters('posting')"); await page.wait_for_timeout(15)
  status_visible=await page.locator('[data-v338-posting-status]').evaluate("e=>getComputedStyle(e).display!=='none'")
  rec('Accounting status controls remain visible with filters collapsed',status_visible)

  # Sell Machine exact scenario: 15,000 price + 10,000 advance = 5,000 new payment; then recalc on price change.
  await page.evaluate(r'''(()=>{document.getElementById('content').innerHTML=`<div id="exBuyerBalance" data-balance="10000"></div><form id="excavatorSaleForm" data-current-paid="0" data-available-advance="10000"><input name="selling_price" value="15000"><input name="buyer_id" value="7"><select name="settlement_mode"><option value="replace" selected>replace</option></select><select name="payment_source"><option value="advance_plus_new" selected>advance_plus_new</option></select><input name="advance_amount_krw"><div id="exAdvancePaymentInfo"></div><div id="exNewPaymentFields"><input name="payment_amount"><select name="payment_currency"><option value="KRW" selected>KRW</option></select><input name="payment_fx_rate" value="1"><select name="payment_method"><option value="Bank" selected>Bank</option></select><input name="payment_date" value="2026-09-18"><input name="payment_reference" value="SALE-QA"><input name="payment_evidence" type="file"></div><span id="exAdvanceAvailable"></span><span id="exAdvanceSaleAmount"></span><span id="exAdvanceAfter"></span><span id="v329NewPaymentRequired"></span><span id="exPaymentCoverageStatus"></span></form>`;window.__BOM_V338.syncSale338(document.getElementById('excavatorSaleForm'),true)})()''')
  vals=await page.evaluate("(()=>{const f=document.getElementById('excavatorSaleForm');return {advance:f.advance_amount_krw.value,payment:f.payment_amount.value,required:document.getElementById('v329NewPaymentRequired').textContent,preview:document.getElementById('v326PaymentPreview').innerText}})()")
  rec('Sell Machine canonical live math: ₩15,000 − ₩10,000 advance = ₩5,000 New Payment',vals['advance']=='10000' and vals['payment']=='5000' and '5,000' in vals['required'],vals)
  await page.locator('#excavatorSaleForm input[name="selling_price"]').fill('20000'); await page.locator('#excavatorSaleForm input[name="selling_price"]').dispatch_event('input'); await page.wait_for_timeout(20)
  payment=await page.locator('#excavatorSaleForm input[name="payment_amount"]').input_value()
  rec('Changing sale price immediately recalculates dependent New Payment',payment=='10000',payment)
  await page.locator('#excavatorSaleForm input[name="payment_amount"]').fill('9000'); await page.locator('#excavatorSaleForm input[name="payment_amount"]').dispatch_event('input'); await page.wait_for_timeout(20)
  invalid=await page.locator('#excavatorSaleForm input[name="payment_amount"]').evaluate("e=>e.validationMessage")
  rec('Short New Payment is dynamically invalidated','short by KRW 1,000' in invalid,invalid)

  # New supplier token receiver account defaults on and responsive layouts do not overflow.
  await page.evaluate(r'''(()=>{document.getElementById('content').innerHTML=`<form onsubmit="saveSimpleExcavatorMachine(event)"><div data-v332-new-payee><div class="grid"></div></div></form>`})()'''); await page.wait_for_timeout(80)
  rec('Inline new-supplier receiver account defaults to supplier Default account',await page.locator('input[name="token_new_receiver_is_default"]:checked').count()==1)
  await page.set_viewport_size({'width':390,'height':844}); await page.evaluate('openPakistanResalesV327(7)'); await page.wait_for_timeout(50)
  overflow=await page.evaluate('document.documentElement.scrollWidth-window.innerWidth')
  rec('V30.38 Pakistan Resale UI is mobile-safe',overflow<=2,overflow)

  rec('V30.38 browser audit has no uncaught page errors',len(errors)==0,errors[:5])
  await b.close()
 failed=[x for x in results if not x[1]]
 print('\nSUMMARY',len(results),'checks',len(failed),'failed')
 if failed:
  for x in failed: print('FAILED:',x)
  raise SystemExit(1)

if __name__=='__main__': asyncio.run(main())
