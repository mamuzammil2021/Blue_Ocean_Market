#!/usr/bin/env python3
from fixture_v351_lazy import support_lazy_modules
"""Static Chromium fixture for the actual served import list renderer, page navigation and legacy fallback."""
from pathlib import Path
import re,base64
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]/'public'
html=(root/'index.html').read_text()
html=support_lazy_modules(html,root)
html=re.sub(r'src="/([^"?]+\.js)\?v=[^"]+"',lambda m:'src="data:application/javascript;base64,'+base64.b64encode((root/m.group(1)).read_bytes()).decode()+'"',html)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('about:blank');page.evaluate("""() => {const m=new Map();const store={getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{configurable:true,value:store});Object.defineProperty(window,'sessionStorage',{configurable:true,value:store})}""")
 page.set_content(html,wait_until='load',timeout=30000)
 page.evaluate("""() => {me={id:1,name:'Tester',role:'CEO / Owner',business_unit_id:2};token='fixture';selectedUnitId='2';unitOptions=[{id:2,name:'Pink Salt'}];document.getElementById('root').innerHTML='<div id="content"></div>';window.__calls=[];
 api=async url=>{window.__calls.push(url);if(url.includes('/api/v350/pink-salt/imports/page')){const pg=Number(new URL(url,'https://fixture.test').searchParams.get('page')||1);return {rows:[{id:pg,import_no:'S-00'+pg,supplier:'Sea Salt Supplier',supplier_invoice_no:'IN-'+pg,container_no:'CN-'+pg,total_weight_kg:150,purchase_original:800,purchase_krw:1600,cash_paid_krw:300,advance_allocated_krw:250,paid_krw:550,outstanding_krw:1050,payment_status:'Partially Paid',ready_to_receive:false,status:'Open',invoice_currency:'USD'}],pagination:{page:pg,pageSize:25,pages:3,total:51,from:pg===1?1:pg===2?26:51,to:pg===1?25:pg===2?50:51}};}return []};view='psImports';}""")
 page.evaluate('window.loadView()');page.wait_for_timeout(280)
 first=page.evaluate("""() => ({row:document.getElementById('content').textContent.includes('S-001'),paid:document.getElementById('content').textContent.includes('550'),pager:!!document.querySelector('[data-v350-import-pager]'),search:!!document.querySelector('[data-v350-search]'),count:__calls.filter(u=>u.includes('/v350/pink-salt/imports/page')).length})""");print('IMPORT INITIAL',first);assert first['row'] and first['paid'] and first['pager'] and first['search'] and first['count']==1,first
 page.evaluate('BOMPinkImports350.goto(2)');page.wait_for_timeout(280)
 second=page.evaluate("""() => ({row:document.getElementById('content').textContent.includes('S-002'),page:BOMPinkImports350.diagnostics().page,details:document.getElementById('content').innerHTML.includes('psImportDetail(2)')})""");print('IMPORT NEXT',second);assert all([second['row'],second['page']==2,second['details']]),second
 print('BROWSER ERRORS',errors[:5]);assert not errors,errors
 print('V30.50 STATIC CHROMIUM IMPORT PAGING QA PASS');b.close()
