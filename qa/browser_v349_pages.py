from fixture_v351_lazy import support_lazy_modules
from pathlib import Path
import re,base64
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]/'public'
html=(root/'index.html').read_text()
html=support_lazy_modules(html,root)
html=re.sub(r'src="/([^"?]+\.js)\?v=[^"]+"',lambda m:'src="data:application/javascript;base64,'+base64.b64encode((root/m.group(1)).read_bytes()).decode()+'"',html)
html=re.sub(r'href="/([^"?]+\.css)\?v=[^"]+"',lambda m:'href="data:text/css;base64,'+base64.b64encode((root/m.group(1)).read_bytes()).decode()+'"',html)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();errors=[];calls=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('about:blank');page.evaluate("""() => {const store=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}};Object.defineProperty(window,'localStorage',{configurable:true,value:store()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:store()})}""")
 page.set_content(html,wait_until='load',timeout=30000)
 page.evaluate("""() => {
 me={id:1,name:'Tester',role:'CEO / Owner',business_unit_id:2};token='fixture';selectedUnitId='2';unitOptions=[{id:2,name:'Pink Salt'}];document.getElementById('root').innerHTML='<div id="content"></div>';window.__qaCalls=[];
 api=async url=>{window.__qaCalls.push(url);
  if(url.includes('/api/v349/pink-salt/customers/page')){const pg=Number(new URL(url,'https://local.test').searchParams.get('page')||1);return {rows:[{id:pg,name:'Test Store '+pg,customer_type:'Store',sales_channel:'Direct',pricing_tier:'Retail',completed_orders:1,lifetime_sales_krw:200,paid_krw:100,outstanding_krw:100,overdue_krw:0,unallocated_credit_krw:0,account_balance_krw:100}],summary:{customers:41,outstanding_krw:9000,overdue_krw:700,unallocated_credit_krw:500},pagination:{page:pg,pageSize:25,page_size:25,pages:2,total:41,from:pg===1?1:26,to:pg===1?25:41}}}
  if(url.includes('/api/v349/pink-salt/orders/page')){const pg=Number(new URL(url,'https://local.test').searchParams.get('page')||1);return {rows:[{id:pg,order_no:'O-'+pg,order_date:'2026-09-23',customer:'Test Store',status:'Completed',total_krw:1200,paid_krw:800,outstanding_krw:400,gross_profit_krw:200,payment_status_v313:'Partially Paid'}],summary:{total_orders:61,open_orders:4,sales_krw:70000,receivable_krw:3200,overdue_krw:500,gross_profit_krw:9000},pagination:{page:pg,pageSize:25,page_size:25,pages:3,total:61,from:pg===1?1:26,to:pg===1?25:50}}}
  if(url.includes('/api/v349/accounting/journal/page'))return {rows:[{id:10,journal_no:'J-10',transaction_date:'2026-09-23',business_unit:'Pink Salt',total_debit:100,total_credit:100,source_label:'Test',status:'Posted'}],pagination:{page:1,pageSize:25,page_size:25,pages:2,total:42,from:1,to:25}};
  if(url.includes('/api/accounting/accounts'))throw Error('journal list must not fetch accounts');return []};view='psCustomers';
 }""")
 page.evaluate('window.loadView()');page.wait_for_timeout(320)
 x=page.evaluate("""() => ({account:document.getElementById('content').textContent.includes('Test Store 1'),kpi:document.getElementById('content').textContent.includes('9,000'),pager:!!document.querySelector('[data-v349-pager=customers]'),requests:window.__qaCalls.filter(x=>x.includes('/customers/page')).length})""")
 print('CUSTOMERS',x);assert x['account'] and x['kpi'] and x['pager'] and x['requests']==1
 page.evaluate("window.BOMPinkPages349.goto('customers',2)");page.wait_for_timeout(350)
 y=page.evaluate("""() => ({second:document.getElementById('content').textContent.includes('Test Store 2'),summary:document.getElementById('content').textContent.includes('9,000'),page:window.BOMPinkPages349.states.customers.page})""");print('CUSTOMERS NEXT',y);assert y['second'] and y['summary'] and y['page']==2
 page.evaluate("view='psSales';window.loadView()");page.wait_for_timeout(300)
 z=page.evaluate("""() => ({row:document.getElementById('content').textContent.includes('O-1'),summary:document.getElementById('content').textContent.includes('70,000'),pager:!!document.querySelector('[data-v349-pager=orders]')})""");print('ORDERS',z);assert all(z.values())
 page.evaluate("view='accounting';document.getElementById('root').innerHTML='<div id=content><div id=accountingV29Body></div></div>';window.accountingTabV29('journal')");page.wait_for_timeout(300)
 j=page.evaluate("""() => ({journal:document.getElementById('accountingV29Body').textContent.includes('J-10'),total:document.getElementById('accountingV29Body').textContent.includes('42'),pager:!!document.querySelector('.bom-server-pager'),legacy:window.__qaCalls.some(x=>x==='/api/accounting/journal'),accounts:window.__qaCalls.some(x=>x==='/api/accounting/accounts')})""");print('JOURNAL',j);assert j['journal'] and j['total'] and j['pager'] and not j['legacy'] and not j['accounts']
 print('BROWSER ERRORS',errors[:5]);assert not errors,errors
 print('V30.49 STATIC CHROMIUM PINK SALT / GENERAL LEDGER QA PASS');b.close()
