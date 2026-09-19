import asyncio, pathlib, re
from playwright.async_api import async_playwright
PUB=pathlib.Path(__file__).resolve().parents[1]/'public'
html=(PUB/'index.html').read_text()
scripts=re.findall(r'<script src="([^"]+)"[^>]*></script>',html)
html=re.sub(r'<script src="[^"]+"[^>]*></script>','',html)
INIT=r'''(()=>{const m=new Map([['bo_token','T'],['bo_language','en'],['bo_unit','1']]);Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),key:i=>[...m.keys()][i]||null,get length(){return m.size}},configurable:true});window.__calls=[];window.fetch=async function(input,opt={}){const u=typeof input==='string'?input:input.url,full=String(u).replace(/^https?:\/\/[^/]+/,'');const parsed=new URL(full,'https://blue-ocean.test'),p=parsed.pathname;window.__calls.push({p,q:parsed.search,method:(opt.method||'GET').toUpperCase(),at:performance.now()});let body=[],delay=0;if(p==='/api/finance/v3392-page'){delay=100;const page=Number(parsed.searchParams.get('page')||1),size=Number(parsed.searchParams.get('pageSize')||25),search=parsed.searchParams.get('search')||'',status=parsed.searchParams.get('status')||'';body={rows:[{id:100+page,transaction_date:'2026-09-19',business_unit:'Excavator',source_label:search?'Search Result':'Machine Payment',source_type:'Excavator Machine Payment',source_id:9,type:'Expense',category:'Machine Purchase',amount:15000,krw_amount:15000,reference:'REF-'+page,description:status||'Payment',attachment_count:1,linked_evidence_count:0,open_request_count:0,verification_label:'Pending Verification',verification_status:'Pending Verification',status:'Active'}],pagination:{page,page_size:size,total:60,pages:Math.ceil(60/size),from:(page-1)*size+1,to:Math.min(60,page*size)},summary:{pending_count:4,correction_count:1,resubmitted_count:2,verified_count:10,unverified_amount:45000,income:100000,expenses:60000,open_request_rows:1}}}else if(p==='/api/finance/corrections'){delay=700;body=[{id:7,status:'Open',due_at:'2026-09-20',finance_entry_id:101,finance_type:'Expense',category:'Machine Purchase',amount:15000,reason:'Check evidence',requested_changes:'Confirm account',assigned_to_name:'Staff',requested_by_name:'Finance',response_hours:null}]}else if(p==='/api/action-counts')body={};else if(p==='/api/notifications/unread-count')body={count:0};else if(p==='/api/notifications')body=[];else if(p==='/api/me')body={user:{id:1,name:'CEO',role:'CEO / Owner',preferred_language:'en'}};else if(p==='/api/context')body={units:[{id:1,name:'Excavator'}],selected_business_unit_id:1};else if(p==='/api/access/me')body={permissions:{},limits:{},assigned_units:[1]};if(delay)await new Promise(r=>setTimeout(r,delay));return new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}})};history.replaceState({},'','#dashboard')})()'''
async def main():
 results=[]; errors=[]
 def rec(name,ok,detail=''):
  results.append((name,bool(ok),str(detail))); print(('PASS' if ok else 'FAIL'),name,('— '+str(detail) if detail else ''))
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=await b.new_page(viewport={'width':1440,'height':1000}); page.on('pageerror',lambda e: errors.append(str(e)))
  await page.set_content(html,wait_until='domcontentloaded'); await page.evaluate(INIT)
  for src in scripts: await page.add_script_tag(path=str(PUB/src.split('?')[0].lstrip('/')))
  await page.evaluate("me={id:1,name:'CEO',role:'CEO / Owner',preferred_language:'en'}; selectedUnitId='1'; selectedBusinessName='Excavator'; document.getElementById('root').innerHTML='<main id=content></main>'")
  await page.evaluate("window.__calls=[]; void finance(document.getElementById('content'))")
  await page.wait_for_timeout(25)
  rec('Finance paints progressive shell immediately',await page.locator('#content .bom-skeleton').count()>0 or 'Loading' in await page.locator('#content').inner_text())
  await page.wait_for_timeout(140)
  txt=await page.locator('#content').inner_text()
  rec('Finance rows render before slower corrections finish','Machine Payment' in txt)
  rec('Correction badge remains progressive while corrections are still loading',await page.locator('#v3392CorrectionBadge').inner_text()=='…')
  rec('Finance server pager shows first range','1–25' in txt and '60' in txt)
  calls=await page.evaluate("window.__calls")
  rec('Finance page and corrections started independently',any(x['p']=='/api/finance/v3392-page' for x in calls) and any(x['p']=='/api/finance/corrections' for x in calls),calls)
  await page.wait_for_timeout(620)
  rec('Correction badge fills independently when ready',await page.locator('#v3392CorrectionBadge').inner_text()=='1')
  # Server search is debounced and applied remotely.
  await page.locator('#financeSearch').fill('Doosan'); await page.wait_for_timeout(360); await page.wait_for_timeout(130)
  calls=await page.evaluate("window.__calls.filter(x=>x.p==='/api/finance/v3392-page').map(x=>x.q)")
  rec('Finance search is sent to server before paging',any('search=Doosan' in q for q in calls),calls)
  rec('Search result renders from server response','Search Result' in await page.locator('#content').inner_text())
  # Status filter and page control remain server-side.
  await page.locator('#financeStatusFilter').select_option('Pending Verification'); await page.wait_for_timeout(150)
  calls=await page.evaluate("window.__calls.filter(x=>x.p==='/api/finance/v3392-page').map(x=>x.q)")
  rec('Finance status filter is sent to server',any('status=Pending+Verification' in q or 'status=Pending%20Verification' in q for q in calls),calls)
  await page.evaluate("v3392FinancePage('page',2)"); await page.wait_for_timeout(150)
  calls=await page.evaluate("window.__calls.filter(x=>x.p==='/api/finance/v3392-page').map(x=>x.q)")
  rec('Finance Next/page request uses server page 2',any('page=2' in q for q in calls),calls)
  rec('Server pager prevents legacy client-only pager duplication',await page.locator('.v335-pagination').count()==0)
  rec('V30.39.2 Finance browser pass has no uncaught page errors',not errors,errors)
  await b.close()
 failed=sum(1 for _,ok,_ in results if not ok); print('\nSUMMARY',len(results),'checks',failed,'failed'); raise SystemExit(1 if failed else 0)
if __name__=='__main__': asyncio.run(main())
