#!/usr/bin/env python3
"""Mock-browser route behavior only. Not a native authenticated acceptance test."""
from pathlib import Path
import base64,re
from playwright.sync_api import sync_playwright
from fixture_v351_lazy import support_lazy_modules
pub=Path(__file__).resolve().parents[1]/'public'
html=support_lazy_modules((pub/'index.html').read_text(),pub)
html=re.sub(r'src="/([^"?]+\.js)\?v=[^"]+"',lambda m:'src="data:application/javascript;base64,'+base64.b64encode((pub/m.group(1)).read_bytes()).decode()+'"',html)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('about:blank');page.evaluate("""() => {const m=new Map(),store={getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{configurable:true,value:store});Object.defineProperty(window,'sessionStorage',{configurable:true,value:store})}""")
 page.set_content(html,wait_until='load',timeout=30000)
 start=page.evaluate("""() => ({lazy:!!BOMLazy351,init:BOMLazy351.diagnostics(),accounting:!!BOMAccounting349,feedback:!!window.BOMFeedback})""")
 print('INITIAL',start)
 assert start['lazy'] and start['accounting'] and not any(start['init']['ready'].values()),start
 page.evaluate("""() => {me={id:1,name:'Tester',role:'CEO / Owner',business_unit_id:2};token='fixture';selectedUnitId='2';unitOptions=[{id:2,name:'Pink Salt'}];document.getElementById('root').innerHTML='<div id="content"></div>';window.__calls=[];
 api=async url=>{__calls.push(url);
 if(url.includes('/api/v350/pink-salt/imports/page'))return {rows:[{id:1,import_no:'IMP-351',supplier:'Supplier',supplier_invoice_no:'INV-351',container_no:'CN-351',total_weight_kg:100,purchase_original:800,purchase_krw:1600,paid_krw:550,outstanding_krw:1050,payment_status:'Partially Paid',status:'Open',invoice_currency:'USD'}],pagination:{page:1,pageSize:25,pages:1,total:1,from:1,to:1}};
 if(url.includes('/api/v349/pink-salt/customers/page'))return {rows:[{id:1,name:'Customer 351',customer_type:'Store',sales_channel:'Direct',pricing_tier:'Retail',completed_orders:1,lifetime_sales_krw:200,paid_krw:100,outstanding_krw:100,overdue_krw:0,unallocated_credit_krw:0,account_balance_krw:100}],summary:{customers:1,outstanding_krw:100,overdue_krw:0,unallocated_credit_krw:0},pagination:{page:1,pageSize:25,pages:1,total:1,from:1,to:1}};
 if(url.includes('/api/v350/pink-salt/raw-stock/page'))return {rows:[{id:1,import_no:'RAW-351',container_no:'CN',salt_grade:'Mesh',specification:'fine',supplier:'Supplier',received_weight_kg:100,available_kg:80,landed_cost_krw:1000,landed_cost_per_kg:10,storage_location:'A1'}],summary:{total_kg:80,active_batches:1,mesh_kg:80,mm_2_3_kg:0,mm_3_5_kg:0},pagination:{page:1,pageSize:25,pages:1,total:1,from:1,to:1}};
 return []};view='psImports';} """)
 page.evaluate('window.loadView()');page.wait_for_timeout(450)
 imports=page.evaluate("""() => ({ready:!!window.BOMPinkImports350,stock:!!window.BOMPinkRaw350,customer:!!window.BOMPinkPages349,rendered:document.getElementById('content').textContent.includes('IMP-351'),calls:__calls.filter(u=>u.includes('/imports/page')).length,loaded:BOMLazy351.diagnostics().loaded})""")
 print('IMPORT LAZY',imports);assert imports['ready'] and imports['rendered'] and not imports['stock'] and not imports['customer'] and imports['calls']==1,imports
 page.evaluate('window.loadView()');page.wait_for_timeout(200)
 reuse=page.evaluate("BOMLazy351.diagnostics().loaded.filter(x=>x==='pink-imports').length")
 assert reuse==1,reuse
 page.evaluate("view='psCustomers';window.loadView()");page.wait_for_timeout(350)
 customer=page.evaluate("""() => ({ready:!!window.BOMPinkPages349,rendered:document.getElementById('content').textContent.includes('Customer 351'),stock:!!window.BOMPinkRaw350})""")
 print('CUSTOMER LAZY',customer);assert customer['ready'] and customer['rendered'] and not customer['stock'],customer
 page.evaluate("view='psRawStock';window.loadView()");page.wait_for_timeout(350)
 stock=page.evaluate("""() => ({ready:!!window.BOMPinkRaw350,rendered:document.getElementById('content').textContent.includes('RAW-351'),total:document.getElementById('content').textContent.includes('80')})""")
 print('STOCK LAZY',stock);assert all(stock.values()),stock
 print('PAGE ERRORS',errors[:5]);assert not errors,errors
 print('V30.51 STATIC CHROMIUM SELECTIVE LAZY QA PASS');browser.close()
