import asyncio, pathlib, re
from playwright.async_api import async_playwright
PUB=pathlib.Path(__file__).resolve().parents[1]/'public'
html=(PUB/'index.html').read_text(); scripts=re.findall(r'<script src="([^"]+)"[^>]*></script>',html); html=re.sub(r'<script src="[^"]+"[^>]*></script>','',html)
INIT=r'''(()=>{const m=new Map([['bo_token','T'],['bo_language','en'],['bo_unit','1']]);Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),key:i=>[...m.keys()][i]||null,get length(){return m.size}},configurable:true});window.__mock={'/api/me':{user:{id:1,name:'CEO',role:'CEO / Owner',preferred_language:'en',business_unit_id:null}},'/api/context':{units:[{id:1,name:'Excavator'}],selected_business_unit_id:1},'/api/access/me':{permissions:{},limits:{},assigned_units:[1]},'/api/excavator/overview':{summary:{},assets:[]},'/api/notifications':[],'/api/notifications/unread-count':{count:0},'/api/action-counts':{}};window.fetch=async function(input,opt={}){const u=typeof input==='string'?input:input.url,p=u.split('?')[0];let b=window.__mock[p];if(typeof b==='function')b=await b(u,opt);if(b===undefined)b=(opt.method||'GET')==='GET'?[]:{ok:true,id:999};return new Response(JSON.stringify(b),{status:200,headers:{'Content-Type':'application/json'}})};history.replaceState({},'','#dashboard')})()'''

async def main():
 results=[]; errors=[]
 def rec(name,ok,detail=''):
  results.append((name,bool(ok),str(detail))); print(('PASS' if ok else 'FAIL'),name,('— '+str(detail) if detail else ''))
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=await b.new_page(viewport={'width':1440,'height':1000}); page.on('pageerror',lambda e: errors.append(str(e)))
  await page.set_content(html,wait_until='domcontentloaded'); await page.evaluate(INIT)
  for s in scripts: await page.add_script_tag(path=str(PUB/s.split('?')[0].lstrip('/')))
  await page.wait_for_timeout(800)
  rec('V30.37 overlay loaded',await page.evaluate("window.__BOM_V337?.version==='30.37.0'"))

  supplier={'id':10,'name':'Akmal Abdullah','location':'Incheon','contact_person':'Akmal','phone':'0101234','email':'a@test','address':'Korea'}
  accounts=[{'id':201,'label':'Main Bank','bank_name':'KB','currency':'KRW','account_number_masked':'****2222','is_default':1,'account_holder':'Akmal Abdullah','account_country':'South Korea'}]
  await page.evaluate("m=>Object.assign(window.__mock,m)",{
   '/api/excavator/suppliers/10/machines':{'supplier':supplier,'listed':[],'purchased':[]},
   '/api/excavator/suppliers/10/requirements':[],
   '/api/excavator/suppliers/10/statement':{'summary':{'Total Purchases':100,'Total Paid to Supplier':50,'Outstanding Payable':50},'rows':[{'date':'2026-09-18','description':'Payment to Supplier','reference':'PAY1','debit':50}]},
   '/api/v330/payee-accounts':accounts
  })
  await page.evaluate("v329SupplierOpen(10,'overview')"); await page.wait_for_timeout(120)
  labels=await page.locator('[data-v337-supplier-tabs] button').all_inner_texts()
  rec('Supplier profile splits Payments and Accounts',labels==['Overview','Machines','Requirements','Payments','Accounts'],labels)
  await page.get_by_role('button',name='Payments',exact=True).click(); await page.wait_for_timeout(30)
  rec('Supplier Payments shows payment-only data','Payments Made to Supplier' in await page.locator('#v337SupplierSectionBody').inner_text())
  await page.get_by_role('button',name='Accounts',exact=True).click(); await page.wait_for_timeout(30)
  acct_text=await page.locator('#v337SupplierSectionBody').inner_text()
  rec('Supplier Accounts shows receiver-account data','Main Bank' in acct_text and 'Receiver / payee accounts' in acct_text)
  await page.locator('button',has_text='Add / Manage Account').click(); await page.wait_for_timeout(50)
  rec('Supplier account-management button opens working child manager',await page.locator('#modalRoot .v337-account-manager').count()==1)
  await page.evaluate('v337CloseAccountManager()'); await page.wait_for_timeout(60)
  rec('Closing supplier account manager preserves supplier Accounts section',await page.locator('#v337SupplierSectionBody').count()==1 and 'Main Bank' in await page.locator('#v337SupplierSectionBody').inner_text())

  buyer={'id':7,'name':'Ahmed Khan','country':'Pakistan','buyer_type':'International','location':'Talagang','contact_person':'Akmal Abdullah','phone':'92300','whatsapp':'0300','email':'ahmed@test','payment_terms':'','address':'Talagang'}
  detail={'buyer':buyer,'balance':{'total_paid_krw':100,'allocated_krw':20,'available_advance_krw':80,'refunded_krw':10},'payments':[{'id':1,'payment_date':'2026-09-18','payment_type':'Advance','original_amount':100,'currency':'KRW','fx_rate':1,'krw_amount':100,'available_krw':80,'reference':'B1','status':'Completed'}],'refunds':[{'id':2,'refund_date':'2026-09-18','original_amount':10,'currency':'KRW','krw_amount':10,'reference':'R1','status':'Completed'}],'machines':[{'id':1,'asset_no':'EX1','machine_name':'DX225','selling_price':50,'lifecycle_stage':'Sold / Completed'}],'allocations':[],'requirements':[],'documents':[],'resale_shares':[],'resale_profit_eligible':True}
  await page.evaluate("m=>Object.assign(window.__mock,m)",{'/api/excavator/buyers/7':detail,'/api/v330/payee-accounts':accounts})
  await page.evaluate('excavatorBuyerDetail(7)'); await page.wait_for_timeout(120)
  top=await page.locator('[data-v334-buyer-actions]').inner_text(); tabs=await page.locator('[data-v337-buyer-tabs] button').all_inner_texts()
  rec('Buyer top actions keep Statement/Pakistan Resales but remove Payment Accounts','Buyer Statement' in top and 'Pakistan Resales' in top and 'Payment Accounts' not in top,top)
  rec('Buyer profile has six focused section buttons',tabs==['Payments & Advance','Advance Refunds','Machines Sold','Requirements','Documents','Accounts'],tabs)
  rec('Buyer defaults to one Payments section','Payments & Advance Allocation' in await page.locator('#v337BuyerSectionBody').inner_text() and await page.locator('#v337BuyerSectionBody').count()==1)
  await page.get_by_role('button',name='Advance Refunds',exact=True).click(); await page.wait_for_timeout(20)
  txt=await page.locator('#v337BuyerSectionBody').inner_text(); rec('Buyer section switch shows only selected refund data','Buyer Advance Refunds' in txt and 'Machines Sold' not in txt,txt[:80])
  await page.get_by_role('button',name='Accounts',exact=True).click(); await page.wait_for_timeout(20)
  rec('Buyer Accounts is inside buyer detail sections','Main Bank' in await page.locator('#v337BuyerSectionBody').inner_text())
  await page.locator('button',has_text='Add / Manage Account').click(); await page.wait_for_timeout(40)
  rec('Buyer account-management button opens child manager',await page.locator('#modalRoot .v337-account-manager').count()==1)
  await page.evaluate('v337CloseAccountManager()'); await page.wait_for_timeout(50)
  active=await page.locator('[data-v337-buyer-tabs] button.active').inner_text(); rec('Buyer selected Accounts section survives child manager close',active=='Accounts',active)

  # Historical old-name entry point must route to the same manager (Buy/Sell/profile compatibility).
  await page.evaluate("managePayeeAccountsV330('excavator_supplier',10,'Akmal Abdullah')"); await page.wait_for_timeout(40)
  rec('Legacy Add/Manage account handler is repaired system-wide',await page.locator('#modalRoot .v337-account-manager').count()==1)
  await page.evaluate('v337CloseAccountManager()'); await page.wait_for_timeout(40)

  # Finance: build controls exactly as current page + v335 date fields, let V337 reorganize.
  await page.evaluate(r'''(()=>{document.getElementById('content').innerHTML=`<div id="financeRecordsPanel"><div class="finance-filterbar"><input id="financeSearch" class="search"><select id="financeStatusFilter"><option value="">All statuses</option></select><select id="financeTypeFilter"><option value="">All types</option></select><select id="financeEvidenceFilter"><option value="">All evidence</option></select><div class="v335-date-range"><div class="field"><label>From Date</label><input id="v335FinanceFrom" type="date"></div><div class="field"><label>To Date</label><input id="v335FinanceTo" type="date"></div></div></div><table><tbody id="financeTableBody"><tr data-finance-id="1"><td>2026-09-18</td></tr></tbody></table></div>`;})()'''); await page.wait_for_timeout(120)
  rec('Finance filters use shared responsive toolbar',await page.locator('#financeRecordsPanel .v337-filter-shell').count()==1 and await page.get_by_role('button',name='Clear Filters').count()==1)
  # Posting: current structure with v335 dates.
  await page.evaluate(r'''(()=>{window.__v318AccountingPostingMode=true;document.getElementById('content').innerHTML=`<div class="card"><div class="v318-posting-head"><div><h3>Posting Queue</h3></div><div class="v335-posting-filter-row"><input id="v318PostingSearch" class="search"><div class="v335-date-range"><input id="v335PostingFrom" type="date"><input id="v335PostingTo" type="date"></div></div></div><div class="v318-control-tabs"><button class="btn active">Pending Review</button><button class="btn">Correction Required</button><button class="btn">Posted</button><button class="btn">All Posting Records</button></div><table><tbody id="v318PostingBody"><tr data-v318-text="x"><td>2026-09-18</td></tr></tbody></table></div>`;})()'''); await page.wait_for_timeout(120)
  rec('Posting Queue filters use shared responsive toolbar',await page.locator('.v337-posting-shell').count()==1 and 'Date Range' in await page.locator('.v337-posting-shell').inner_text())
  # responsive check
  await page.set_viewport_size({'width':390,'height':844}); await page.wait_for_timeout(30)
  overflow=await page.evaluate("document.documentElement.scrollWidth-window.innerWidth"); rec('New filter toolbar remains mobile-safe',overflow<=2,overflow)
  rec('V30.37 focused browser pass has no uncaught page errors',len(errors)==0,errors[:4])
  await b.close()
 failed=[r for r in results if not r[1]]; print('\nSUMMARY',len(results),'checks',len(failed),'failed')
 if failed: raise SystemExit(1)
if __name__=='__main__': asyncio.run(main())
