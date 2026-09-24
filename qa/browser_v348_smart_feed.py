"""V30.48 static browser regression with scoped MOCK data; not authenticated Render QA."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import base64,re
root=Path(__file__).resolve().parents[1]/'public'
html=(root/'index.html').read_text()
lazy={name:base64.b64encode((root/name).read_bytes()).decode() for name in ['v347-client.js','v348-notifications.js']}
shim="<script>(function(){const source="+str(lazy).replace("'",'"')+";const original=document.head.appendChild.bind(document.head);document.head.appendChild=function(node){if(node.tagName==='SCRIPT'){for(const [name,b64] of Object.entries(source))if(node.src.includes('/'+name)){node.src='data:application/javascript;base64,'+b64;break}}return original(node)}})();</script>"
html=html.replace('<script src="/i18n-ko.js?v=30.51.0"></script>',shim+'<script src="/i18n-ko.js?v=30.51.0"></script>')
html=re.sub(r'src="/([^"?]+\.js)\?v=[^"]+"',lambda m:'src="data:application/javascript;base64,'+base64.b64encode((root/m.group(1)).read_bytes()).decode()+'"',html)
html=re.sub(r'href="/([^"?]+\.css)\?v=[^"]+"',lambda m:'href="data:text/css;base64,'+base64.b64encode((root/m.group(1)).read_bytes()).decode()+'"',html)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1360,'height':800});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('about:blank')
    page.evaluate("""() => {const make=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}};Object.defineProperty(window,'localStorage',{configurable:true,value:make()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:make()})}""")
    page.set_content(html,wait_until='load',timeout=35000)
    pre=page.evaluate("({loader:!!window.BOMLazy348,feed:!!window.BOMSmartNotifications348,account:!!window.v343OpenAccount})")
    print('START',pre);assert pre['loader'] and not pre['feed'] and pre['account']
    page.evaluate("""() => {me={id:7,name:'Tester',role:'CEO / Owner',business_unit_id:2};token='mock';selectedUnitId='2';currentLanguage='en';document.getElementById('root').innerHTML='<div class="main"><section class="content" id="content"></section></div>';window.__calls=[];window.__failNext=false;
      api=async url=>{window.__calls.push(String(url));if(String(url).includes('/v348/notifications/feed')){let q=new URL(url,'https://blue.test').searchParams;if(window.__failNext&&q.has('cursor'))throw new Error('Temporary failure');if(q.has('cursor'))return {rows:[{id:1,read_at:'2026-09-22 12:00:00',created_at:'2026-09-22 10:00:00',title:'Older',message:'Finished'}],total:26,unread_total:3,has_more:false,next_cursor:null};return {rows:Array.from({length:25},(_,i)=>({id:26-i,read_at:i<3?null:'2026-09-22 12:00:00',created_at:'2026-09-22 10:00:00',title:'Alert '+i,message:'Notice '+i})),total:26,unread_total:3,has_more:true,next_cursor:'cursor1'}};
        if(String(url).includes('/v346/audit/page'))return {rows:[],total:0};if(String(url).includes('/v347/tasks/page'))return {rows:[{id:5,title:'Regression task',owner:'Tester',business_unit:'Pink Salt',status:'Not Started',priority:'High'}],summary:{open:1},pagination:{page:1,page_size:25,pages:1,total:1,from:1,to:1}};if(String(url).includes('/api/approval-rules'))return [];return []};view='notifications'}""")
    page.evaluate('window.loadView()');page.wait_for_timeout(500)
    first=page.evaluate("({ready:!!window.BOMSmartNotifications348,count:document.querySelectorAll('.v348-notif').length,controls:!!document.querySelector('#v348-more'),loaded:window.BOMSmartNotifications348?.diagnostics().loaded,requests:window.__calls.filter(x=>x.includes('notifications/feed')).length})")
    print('NOTIFICATIONS FIRST',first);assert first['ready'] and first['count']==25 and first['controls'] and first['requests']==1
    page.evaluate('window.v348LoadMore()');page.wait_for_timeout(120)
    second=page.evaluate("({count:document.querySelectorAll('.v348-notif').length,loaded:window.BOMSmartNotifications348.diagnostics().loaded,hasMore:window.BOMSmartNotifications348.diagnostics().has_more})")
    print('APPENDED',second);assert second['count']==26 and not second['hasMore']
    page.evaluate('window.toggleNotifs()');page.wait_for_timeout(100)
    bell=page.evaluate("({open:!!document.getElementById('notifDialog'),preview:document.querySelectorAll('#notifDialog .notification-card').length,full:document.getElementById('notifDialog')?.textContent?.includes('View all notifications')})")
    print('BELL',bell);assert bell['open'] and bell['preview']==25 and bell['full']
    page.evaluate("closeNotifDialog();view='audit';window.loadView()");page.wait_for_timeout(100)
    audit=page.evaluate("({pager:!!document.querySelector('.bom-server-pager'),scroll:!!document.querySelector('#v348-items')})")
    print('AUDIT UNCHANGED',audit);assert audit['pager'] and not audit['scroll']
    page.evaluate("view='tasks';window.loadView()");page.wait_for_timeout(280)
    assert page.evaluate("document.getElementById('content')?.textContent?.includes('Regression task')")
    page.evaluate("view='notifications';window.__failNext=true;window.loadView()");page.wait_for_timeout(120)
    page.evaluate('window.v348LoadMore()');page.wait_for_timeout(120)
    err=page.evaluate("({retained:document.querySelectorAll('.v348-notif').length,hasRetry:document.getElementById('v348-status')?.textContent?.includes('Retry')})")
    print('INCREMENTAL ERROR',err);assert err['retained']==25 and err['hasRetry']
    print('PAGE ERRORS',errors[:3]);assert not errors,errors
    print('V30.48 STATIC CHROMIUM SMART FEED + LEGACY NAV QA PASS')
    browser.close()
