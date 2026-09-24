from pathlib import Path
import re,base64
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]/'public'
html=(root/'index.html').read_text()
data=base64.b64encode((root/'v347-client.js').read_bytes()).decode()
shim=f'''<script>(function(){{const old=document.head.appendChild.bind(document.head);document.head.appendChild=function(el){{if(el.tagName==='SCRIPT'&&el.src.includes('/v347-client.js'))el.src='data:application/javascript;base64,{data}';return old(el)}}}})();</script>'''
html=html.replace('<script src="/v347-loader.js?v=30.51.0"></script>',shim+'<script src="/v347-loader.js?v=30.51.0"></script>')
html=re.sub(r'src="/([^"?]+\.js)\?v=[^"]+"',lambda m:'src="data:application/javascript;base64,'+base64.b64encode((root/m.group(1)).read_bytes()).decode()+'"',html)
html=re.sub(r'href="/([^"?]+\.css)\?v=[^"]+"',lambda m:'href="data:text/css;base64,'+base64.b64encode((root/m.group(1)).read_bytes()).decode()+'"',html)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page();errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.goto('about:blank');page.evaluate("""() => {const store=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}};Object.defineProperty(window,'localStorage',{configurable:true,value:store()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:store()})}""")
 page.set_content(html,wait_until='load',timeout=30000)
 print('INITIAL',page.evaluate("({lazy:!!window.BOMLazy347,ready:!!window.BOMPagedWorkspaces347,observers:window.BOMMutationHub?.diagnostics()?.handlers?.length,login:document.querySelectorAll('input[type=password]').length})"))
 page.evaluate("""() => {me={id:1,name:'Tester',role:'CEO / Owner',business_unit_id:1};token='mock';selectedUnitId='1';document.getElementById('root').innerHTML='<div id="content"></div>'; api=async url=>{if(url.includes('/v347/tasks/page'))return {rows:[{id:1,title:'QA task',owner:'Tester',business_unit:'Excavator',status:'Not Started',priority:'High'}],summary:{open:1},pagination:{page:1,page_size:25,pages:1,total:1,from:1,to:1}};if(url.includes('/v347/approvals/page'))return {rows:[],summary:{},pagination:{page:1,page_size:25,pages:1,total:0,from:0,to:0}};if(url.includes('/v347/documents/page'))return {rows:[],summary:{active:0,final:0,archived:0},can_view_archive:true,pagination:{page:1,page_size:25,pages:1,total:0,from:0,to:0}};if(url.includes('/api/approval-rules'))return [];return []};view='tasks';} """)
 page.evaluate('window.loadView()')
 page.wait_for_timeout(500)
 assert page.evaluate("document.getElementById('content')?.textContent?.includes('QA task')")
 print('TASKS',page.evaluate("({ready:!!window.BOMPagedWorkspaces347,task:document.getElementById('content')?.textContent?.includes('QA task'),preview:document.getElementById('content')?.textContent?.slice(0,160),metrics:window.BOMLazy347.diagnostics()})"))
 page.evaluate("view='approvals';window.loadView()")
 page.wait_for_timeout(150)
 print('APPROVAL',page.evaluate("({ready:!!window.BOMPagedWorkspaces347,table:!!document.querySelector('[data-server-paged]')})"))
 page.evaluate("view='documents';window.loadView()")
 page.wait_for_timeout(150)
 print('DOCUMENT',page.evaluate("({ready:!!window.BOMPagedWorkspaces347,tab:!!document.querySelector('[role=tab]'),preview:document.getElementById('content')?.textContent?.slice(0,320),html:document.getElementById('content')?.innerHTML?.slice(0,270)})"))
 print('ERRORS',errs[:4]);
 assert page.evaluate('window.BOMLazy347?.diagnostics().ready') is True
 assert page.evaluate("document.getElementById('content')?.textContent?.includes('문서')") is True
 assert page.evaluate("!!document.querySelector('[role=tab]')") is True
 assert page.evaluate('loadView === window.loadView') is True
 assert not errs, errs
 print('V30.47 STATIC BROWSER PAGED/LAZY QA PASS')
 b.close()
