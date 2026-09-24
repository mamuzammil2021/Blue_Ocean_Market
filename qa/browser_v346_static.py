from pathlib import Path
import re, base64
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
public=root/'public';html=(public/'index.html').read_text()
html=re.sub(r'src="/([^"?]+\.js)\?v=[^"]+"',lambda m:'src="data:application/javascript;base64,'+base64.b64encode((public/m.group(1)).read_bytes()).decode('ascii')+'"',html)
html=re.sub(r'href="/([^"?]+\.css)\?v=[^"]+"',lambda m:'href="data:text/css;base64,'+base64.b64encode((public/m.group(1)).read_bytes()).decode('ascii')+'"',html)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page()
    errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto('about:blank')
    page.evaluate("""() => { const makeStore=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}};Object.defineProperty(window,'localStorage',{configurable:true,value:makeStore()});Object.defineProperty(window,'sessionStorage',{configurable:true,value:makeStore()}) }""")
    page.set_content(html,wait_until='load',timeout=20000)
    page.wait_for_timeout(500)
    print('PAGE_TITLE',page.title())
    print('LOGIN_VISIBLE',page.locator('input[type="password"]').count())
    print('SCHEDULER',page.evaluate('Boolean(window.BOMReadScheduler)'))
    print('OBSERVER_HUB',page.evaluate('window.BOMMutationHub?.diagnostics()'))
    print('FEEDBACK',page.evaluate('window.BOMFeedback?.version'))
    print('PAGE_ERRORS',len(errors))
    for e in errors[:7]: print('PAGE_ERROR',e[:300])
    assert page.locator('input[type="password"]').count()==1
    assert page.evaluate('Boolean(window.BOMReadScheduler)')
    assert page.evaluate('window.BOMMutationHub?.diagnostics().handlers.length')==7
    assert not errors, errors
    print('V30.46 STATIC BROWSER QA PASS')
    browser.close()
