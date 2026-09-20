import asyncio, pathlib, re
from playwright.async_api import async_playwright
PUB=pathlib.Path(__file__).resolve().parents[1]/'public'
html=(PUB/'index.html').read_text(); scripts=re.findall(r'<script src="([^"]+)"[^>]*></script>',html); html=re.sub(r'<script src="[^"]+"[^>]*></script>','',html)
INIT=r'''(()=>{const m=new Map([['bo_token','T'],['bo_language','en'],['bo_unit','1']]);Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),key:i=>[...m.keys()][i]||null,get length(){return m.size}},configurable:true});window.__calls=[];window.__mock={};window.fetch=async function(input,opt={}){const u=typeof input==='string'?input:input.url,p=String(u).replace(/^https?:\/\/[^/]+/,'').split('?')[0];window.__calls.push({p,method:(opt.method||'GET').toUpperCase(),at:performance.now()});let spec=window.__mock[p];if(typeof spec==='function')spec=await spec(u,opt);if(spec===undefined)spec=(opt.method||'GET').toUpperCase()==='GET'?[]:{ok:true,id:999};const delay=Number(spec&&spec.__delay||0);if(delay)await new Promise(r=>setTimeout(r,delay));const body=spec&&Object.prototype.hasOwnProperty.call(spec,'body')?spec.body:spec;return new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}})};history.replaceState({},'','#dashboard')})()'''
async def main():
 results=[]; errors=[]
 def rec(name,ok,detail=''):
  results.append((name,bool(ok),str(detail))); print(('PASS' if ok else 'FAIL'),name,('— '+str(detail) if detail else ''))
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=await b.new_page(viewport={'width':1440,'height':1000}); page.on('pageerror',lambda e: errors.append(str(e)))
  await page.set_content(html,wait_until='domcontentloaded'); await page.evaluate(INIT)
  await page.evaluate("""Object.assign(window.__mock,{
   '/api/me':{body:{user:{id:1,name:'CEO',role:'CEO / Owner',preferred_language:'en'}},__delay:5},
   '/api/context':{body:{units:[{id:1,name:'Excavator'}],selected_business_unit_id:1},__delay:5},
   '/api/access/me':{body:{permissions:{},limits:{},assigned_units:[1]},__delay:5},
   '/api/notifications':[], '/api/notifications/unread-count':{count:0}, '/api/action-counts':{},
   '/api/excavator/overview':{body:{currency:'KRW',summary:{open:7,inYard:3,ready:2,margin:12345},assets:[]},__delay:700},
   '/api/excavator/assets':{body:{rows:[{id:9,asset_no:'EXC-9',machine_name:'DOOSAN DX225',make:'Doosan',model:'DX225',serial_no:'S9',condition_status:'Used',lifecycle_stage:'In Yard',purchase_cost:100,total_cost:120,sale_amount:0,profit_loss_status:'Not Sold'}],pagination:{page:1,page_size:25,total:1,pages:1,from:1,to:1}},__delay:100},
   '/api/excavator/buyers/7':{body:{buyer:{id:7,name:'Ahmed Khan',country:'Pakistan',buyer_type:'International',location:'Talagang'},balance:{total_paid_krw:1000,allocated_krw:200,available_advance_krw:800},payments:[],allocations:[],refunds:[],machines:[],requirements:[],documents:[]},__delay:180},
   '/api/v330/payee-accounts':{body:[{id:1,label:'Buyer Bank',bank_name:'HBL',currency:'PKR',account_number_masked:'****12'}],__delay:450},
   '/api/excavator/suppliers/10/machines':{body:{supplier:{id:10,name:'Supplier Ten',location:'Seoul'},listed:[],purchased:[]},__delay:100},
   '/api/excavator/suppliers/10/statement':{body:{summary:{'Machines Purchased':1,'Total Paid to Supplier':50,'Outstanding Payable':25},rows:[]},__delay:600},
   '/api/excavator/suppliers/10/requirements':{body:[],__delay:250}
  })""")
  for src in scripts: await page.add_script_tag(path=str(PUB/src.split('?')[0].lstrip('/')))
  await page.evaluate("me={id:1,name:'CEO',role:'CEO / Owner',preferred_language:'en'}; selectedUnitId='1'; document.getElementById('root').innerHTML='<main id=content></main>'")
  await page.wait_for_timeout(30)
  # Machine page: list should win the race over slow summary.
  await page.evaluate("view='excavator'; void excavator(document.getElementById('content'))")
  await page.wait_for_timeout(30)
  rec('Machine screen paints skeleton immediately',await page.locator('#v3391MachineStats .bom-skeleton').count()>0 and await page.locator('#excavatorMachineList .bom-skeleton').count()>0)
  await page.wait_for_timeout(160)
  rec('Machine rows render before slower KPI summary completes',await page.get_by_text('DOOSAN DX225',exact=True).count()==1 and await page.locator('#v3391MachineStats .bom-skeleton').count()>0)
  await page.wait_for_timeout(650)
  rec('KPI summary fills independently when ready',await page.locator('#v3391MachineStats').get_by_text('7',exact=True).count()>=1 and await page.locator('#v3391MachineStats .bom-skeleton').count()==0)
  # Buyer: shell immediately, main detail first, accounts only on demand.
  await page.evaluate("window.__calls=[]; void excavatorBuyerDetail(7)")
  await page.wait_for_timeout(25)
  rec('Buyer profile opens with skeleton before detail response',await page.locator('#v324WorkflowSurface .bom-skeleton').count()>0)
  await page.wait_for_timeout(220)
  rec('Buyer main profile renders without waiting for Accounts','Ahmed Khan' in await page.locator('#v324WorkflowSurface').inner_text())
  calls=await page.evaluate("window.__calls.map(x=>x.p)")
  rec('Buyer Accounts request is deferred until selected','/api/v330/payee-accounts' not in calls,calls)
  await page.get_by_role('button',name='Accounts',exact=True).click(); await page.wait_for_timeout(20)
  rec('Buyer Accounts section shows loading state while deferred request runs',await page.locator('#v337BuyerSectionBody .bom-skeleton').count()>0)
  await page.wait_for_timeout(500)
  rec('Buyer Accounts fills independently after selection','Buyer Bank' in await page.locator('#v337BuyerSectionBody').inner_text())
  # Supplier: machine/profile and statement begin together and fill progressively.
  await page.evaluate("window.__calls=[]; void v329SupplierOpen(10,'overview')")
  await page.wait_for_timeout(30)
  rec('Supplier opens immediately with progressive placeholders',await page.locator('#v337SupplierSectionBody .bom-skeleton').count()>0)
  await page.wait_for_timeout(140)
  txt=await page.locator('#v324WorkflowSurface').inner_text()
  rec('Supplier identity renders before slower statement','Supplier Ten' in txt and await page.locator('#v337SupplierSectionBody .bom-skeleton').count()>0)
  calls=await page.evaluate("window.__calls.map(x=>x.p)")
  rec('Supplier Requirements/Accounts are not fetched for Overview','/api/excavator/suppliers/10/requirements' not in calls and '/api/v330/payee-accounts' not in calls,calls)
  await page.wait_for_timeout(520)
  rec('Supplier overview stats complete independently',await page.locator('#v337SupplierSectionBody .bom-skeleton').count()==0)
  rec('V30.39.1 focused browser pass has no uncaught page errors',not errors,errors)
  await b.close()
 failed=sum(1 for _,ok,_ in results if not ok); print('\nSUMMARY',len(results),'checks',failed,'failed'); raise SystemExit(1 if failed else 0)
if __name__=='__main__': asyncio.run(main())
