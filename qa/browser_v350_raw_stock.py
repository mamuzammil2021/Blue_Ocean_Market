#!/usr/bin/env python3
from fixture_v351_lazy import support_lazy_modules
from pathlib import Path
import re,base64
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]/'public';html=(root/'index.html').read_text()
html=support_lazy_modules(html,root)
html=re.sub(r'src="/([^"?]+\.js)\?v=[^"]+"',lambda m:'src="data:application/javascript;base64,'+base64.b64encode((root/m.group(1)).read_bytes()).decode()+'"',html)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('about:blank');page.evaluate("""() => {const m=new Map();const store={getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()};Object.defineProperty(window,'localStorage',{configurable:true,value:store});Object.defineProperty(window,'sessionStorage',{configurable:true,value:store})}""")
 page.set_content(html,wait_until='load',timeout=30000)
 page.evaluate("""() => {me={id:1,name:'Tester',role:'CEO / Owner',business_unit_id:2};token='fixture';selectedUnitId='2';unitOptions=[{id:2,name:'Pink Salt'}];document.getElementById('root').innerHTML='<div id="content"></div>';window.__calls=[];
 api=async url=>{window.__calls.push(url);if(url.includes('/api/v350/pink-salt/raw-stock/page')){const pg=Number(new URL(url,'https://fixture.test').searchParams.get('page')||1);return {rows:[{id:pg,import_no:'I-'+pg,container_no:'CN'+pg,salt_grade:'Mesh',specification:'fine',supplier:'Supplier A',received_weight_kg:100,available_kg:80,landed_cost_krw:1000,landed_cost_per_kg:10,storage_location:'A1'}],summary:{total_kg:145,active_batches:3,mesh_kg:80,mm_2_3_kg:40,mm_3_5_kg:25},pagination:{page:pg,pageSize:25,pages:2,total:30,from:pg===1?1:26,to:pg===1?25:30}};}if(url==='/api/pink-salt/raw-stock')return [];return []};view='psRawStock';}""")
 page.evaluate('window.loadView()');page.wait_for_timeout(260)
 x=page.evaluate("""() => ({row:document.getElementById('content').textContent.includes('I-1'),total:document.getElementById('content').textContent.includes('145'),category:document.getElementById('content').textContent.includes('40'),pager:!!document.querySelector('[data-v350-stock-pager]'),search:!!document.querySelector('[data-v350-stock-search]'),legacy:__calls.some(u=>u==='/api/pink-salt/raw-stock')})""")
 print('STOCK INITIAL',x);assert x['row'] and x['total'] and x['category'] and x['pager'] and x['search'] and not x['legacy'],x
 page.evaluate('BOMPinkRaw350.goto(2)');page.wait_for_timeout(250)
 y=page.evaluate("""() => ({row:document.getElementById('content').textContent.includes('I-2'),total:document.getElementById('content').textContent.includes('145'),detail:document.getElementById('content').innerHTML.includes('psTraceRaw(2)')})""")
 print('STOCK NEXT',y);assert all(y.values()),y
 assert not errors,errors;print('V30.50 STATIC CHROMIUM RAW STOCK PAGING QA PASS');b.close()
