"""Real authenticated two-tab logout/login and delayed-response acceptance."""
import os,json,pathlib,subprocess
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[1]
server=subprocess.Popen([os.environ.get('BOM_NODE','node'),'qa/fx_browser_fixture.js'],cwd=root,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
checks=[]
def passed(s):checks.append(s);print('PASS '+s,flush=True)
try:
 raw=server.stdout.readline()
 if not raw:raise RuntimeError('Disposable server failed to start')
 f=json.loads(raw)
 with sync_playwright() as p:
  opt={'headless':True,'args':['--no-sandbox','--no-zygote','--single-process','--disable-gpu','--disable-dev-shm-usage']}
  if os.environ.get('BOM_CHROMIUM'):opt['executable_path']=os.environ['BOM_CHROMIUM']
  browser=p.chromium.launch(**opt);context=browser.new_context();context.add_init_script("""window.qaAuthTrace=[];const remove=Storage.prototype.removeItem;Storage.prototype.removeItem=function(k){if(k==='bo_token')qaAuthTrace.push({event:'removeToken',stack:new Error().stack});return remove.call(this,k)};document.addEventListener('DOMContentLoaded',()=>{const old=window.doLogin;window.doLogin=async function(e){qaAuthTrace.push({event:'loginBegin',valid:e.target.checkValidity()});await old(e);qaAuthTrace.push({event:'loginEnd',signedIn:!!me})}});window.addEventListener('storage',e=>{if(e.key==='bo_token')qaAuthTrace.push({event:'storage',present:!!e.newValue})});""");page=context.new_page();responses=[];page.on('response',lambda r:responses.append([r.url.split('/api/')[-1],r.status]) if '/api/' in r.url else None);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  def ready(tab):
   try:tab.wait_for_function("window.BOMRouter && !BOMRouter.restoring && BOMRouter.diagnostics().phase==='ready'",timeout=30000)
   except:
    print('AUTH FAILURE STATE',tab.evaluate('({route:BOMRouter.diagnostics(),url:location.hash,body:document.body.innerText.slice(-1800),authenticated:!!me,trace:window.qaAuthTrace})'),responses[-35:],flush=True);raise
  def login():
   page.wait_for_selector('[name=email]');page.locator('select.language-switch').select_option('en');page.locator('[name=email]').fill(f['email']);page.locator('[name=password]').fill(f['password']);page.locator('form button.primary').click();ready(page)
  page.goto(f['base']);login();deep=f['base']+'/#psSuppliers/supplier/'+str(f['supplier'])+'?section=accounts&unit='+str(f['pink'])
  page.goto(deep);ready(page);other=context.new_page();other.goto(deep);ready(other)
  # Delay delivery of a genuine old-session server response; no endpoint or UI is mocked.
  other.evaluate("()=>{const prior=window.fetch;let held=false;window.fetch=async function(input,opt){const r=await prior(input,opt);if(!held&&String(input)==='/api/me'){held=true;window.qaOldResponseHeld=true;await new Promise(resolve=>window.qaReleaseOldResponse=resolve)}return r};boot()}")
  other.wait_for_function('window.qaOldResponseHeld===true')
  page.evaluate('BOMRouter.logout()');page.wait_for_selector('[name=email]');login();assert page.evaluate('BOMRouter.parse().view')=='dashboard';ready(other)
  other.evaluate('qaReleaseOldResponse()');other.wait_for_timeout(300);ready(other);assert page.evaluate('!!token && !!me && localStorage.getItem("bo_token")===token');assert other.evaluate('!!token && !!me');passed('Delayed genuine old-session response cannot clear a newly authenticated session in either tab')
  for i in range(3):
   page.evaluate('BOMRouter.logout()');page.wait_for_selector('[name=email]');assert '#dashboard' in page.url;page.go_back();page.wait_for_selector('[name=email]');assert page.locator('#v324WorkflowSurface').count()==0;page.goto(f['base']);login();assert page.evaluate('BOMRouter.parse().view')=='dashboard';passed('Two-tab explicit Logout / Back / ordinary Login opens Home and exposes no previous private page, cycle '+str(i+1))
   page.evaluate('BOMRouter.logout()');page.wait_for_selector('[name=email]');page.goto(deep);login();assert page.locator('[data-ps315-tab=accounts]').evaluate('n=>n.classList.contains("primary")');page.reload();ready(page);assert page.url==deep;passed('Two-tab intentional deep-link Login and Refresh retain exact authorized supplier section, cycle '+str(i+1))
  assert not errors,errors;browser.close()
 (root/'qa/evidence/36925-auth-browser.json').write_text(json.dumps({'status':'PASS','checks':checks,'authenticated':True,'real_server_responses':True,'production_data_used':False},indent=2))
except Exception as e:
 (root/'qa/evidence/36925-auth-browser.json').write_text(json.dumps({'status':'FAIL','checks':checks,'error':str(e)},indent=2));raise
finally:server.terminate();server.wait(timeout=10)
