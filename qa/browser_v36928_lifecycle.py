"""Authenticated render-level slow initialization, cancellation and session tests."""
import os,json,pathlib,subprocess,time
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[1];checks=[];observations=[]
def passed(s):checks.append(s);print('PASS '+s,flush=True)
server=subprocess.Popen([os.environ.get('BOM_NODE','node'),'qa/route_browser_fixture.js'],cwd=root,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
try:
 raw=server.stdout.readline()
 if not raw:raise RuntimeError(server.stderr.readline())
 f=json.loads(raw)
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=os.environ.get('BOM_CHROMIUM'),args=['--no-sandbox','--no-zygote','--single-process','--disable-gpu','--disable-dev-shm-usage']);ctx=browser.new_context(viewport={'width':1360,'height':950});ctx.add_init_script((root/'qa/hydration_observer.js').read_text());page=ctx.new_page();page.set_default_timeout(20000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  def ready():page.wait_for_function("window.BOMRouter && !BOMRouter.restoring && BOMRouter.diagnostics().phase==='ready'",timeout=45000)
  def login(email=None):
   page.wait_for_selector('[name=email]');page.locator('select.language-switch').select_option('en');page.locator('[name=email]').fill(email or f['email']);page.locator('[name=password]').fill(f['password']);page.locator('form button.primary').click()
  def visit(v,k='',id=0,section='',unit=None):page.evaluate('async x=>BOMRouter.navigate(x.v,x.k,x.id,x.section,{unit:x.unit})',{'v':v,'k':k,'id':id,'section':section,'unit':str(unit or f['pink'])});ready()
  def record(label,allowed=None):
   page.evaluate('()=>new Promise(requestAnimationFrame)');d=page.evaluate('__hydrationQA');d['label']=label
   current_hash=page.evaluate('location.hash')
   expected=allowed or page.locator('#content h1,#content h2,#modalRoot h1,#modalRoot h2').all_text_contents()
   assert not [x for x in d['writes']+d['paint'] if x['hash']==current_hash and any(h not in expected for h in x['headings'])],(label,d,expected)
   observations.append(d)
  target=f['base']+f"/#psSuppliers/supplier/{f['pink_supplier']}?section=accounts&unit={f['pink']}"
  page.goto(target);login();ready();assert page.url==target;record('Intentional deep-link login');passed('Intentional deep-link login renders only Supplier Accounts')
  # Hold real server responses while inspecting the visible page, then release them.
  supplier_api='**/api/pink-salt/suppliers/'+str(f['pink_supplier'])+'/account*'
  held=[]
  def hold(route):held.append(route)
  page.route(supplier_api,hold);page.reload(wait_until='domcontentloaded');page.wait_for_function("document.querySelector('[data-bom-route-loading]') && window.BOMRouter?.restoring");page.wait_for_timeout(350)
  # The account response is held; the exact profile shell may already exist, but no list/dashboard may appear.
  assert page.url==target
  assert page.locator('[data-bom-route-loading]').count()==1
  assert page.locator('#content h1,#content h2').all_text_contents()==[]
  assert held,'Expected the actual supplier record dependency to be requested'
  for r in held:r.continue_()
  page.unroute(supplier_api,hold)
  ready();record('Delayed supplier API');passed('Slow supplier dependency shows one loading state and no parent page')
  # Authentication restoration itself must not choose a dashboard before context/access arrive.
  held=[];page.route('**/api/context',hold);page.reload(wait_until='domcontentloaded');page.wait_for_function("document.querySelector('[data-bom-route-loading]')");page.wait_for_timeout(250)
  assert page.locator('[data-bom-route-loading]').count()==1;assert not page.locator('#content h1,#content h2').count();assert page.url==target
  for r in held:r.continue_()
  page.unroute('**/api/context',hold)
  ready();record('Delayed session context');passed('Slow authentication/context restoration never renders Dashboard')
  # Existing shell and record heading survive local section navigation.
  page.evaluate("window.__shellQA={shell:document.querySelector('.shell'),header:document.querySelector('.top'),content:document.getElementById('content'),heading:document.querySelector('#content h2')}")
  page.locator('[data-ps315-tab="payments"]').click();ready()
  assert page.evaluate("__shellQA.shell===document.querySelector('.shell')&&__shellQA.header===document.querySelector('.top')&&__shellQA.content===document.getElementById('content')&&__shellQA.heading===document.querySelector('#content h2')")
  page.go_back();ready();assert 'section=accounts' in page.url;page.go_forward();ready();assert 'section=payments' in page.url;passed('Section Back/Forward preserves shell, profile heading and selected section')
  visit('psImports','import',f['import']);assert page.evaluate("__shellQA.shell===document.querySelector('.shell')&&__shellQA.header===document.querySelector('.top')&&__shellQA.content===document.getElementById('content')");passed('Cross-module navigation reuses the authenticated shell')
  # Cold dependency receives an HTTP error: keep exact route and show a real retry state.
  url=page.url;pattern='**/api/pink-salt/imports/'+str(f['import'])
  page.route(pattern,lambda r:r.fulfill(status=503,content_type='application/json',body='{"error":"Synthetic temporary outage"}'));page.reload();page.wait_for_selector('[data-bom-route-state=temporary]');assert page.url==url;record('Temporary API failure')
  page.unroute(pattern);page.locator('[data-bom-route-state] button').click();ready();assert page.url==url;passed('503 retains exact destination and Retry loads it without Dashboard')
  # Cancel an actual pending record fetch, then navigate elsewhere without waiting for it.
  visit('dashboard');held=[];page.route(pattern,hold)
  page.evaluate("a=>{BOMRouter.navigate('psImports','import',a.id,'',{unit:a.unit})}",{'id':f['import'],'unit':f['pink']})
  page.wait_for_timeout(250);assert held
  page.evaluate("a=>{BOMRouter.navigate('psCustomers','customer',a.id,'prices',{unit:a.unit})}",{'id':f['customer'],'unit':f['pink']});ready();assert page.locator('[data-ps313-tab=prices]').get_attribute('aria-selected')=='true'
  for r in held:
   try:r.abort()
   except Exception:pass
  page.unroute(pattern,hold)
  page.wait_for_timeout(250);assert page.evaluate('BOMRouter.parse().view')=='psCustomers';assert 'QA-IMP' not in page.locator('#content').inner_text();passed('Superseded pending fetch is aborted and cannot overwrite the newer destination')
  copied=page.url;second=ctx.new_page();second.goto(copied);second.wait_for_function("window.BOMRouter?.diagnostics().phase==='ready'&&!BOMRouter.restoring");assert second.url==copied;assert second.locator('[data-ps313-tab=prices]').get_attribute('aria-selected')=='true';second.close();passed('Copied deep link opens the exact section directly in a new tab')
  for hash_value,state in [(f"#psImports/import/999999?unit={f['pink']}",'notfound'),(f"#psSuppliers/supplier/{f['pink_supplier']}?unit={f['pink']}&section=unknown",'invalid'),(f"#psImports/import/{f['import']}?unit=999999",'unit'),(f"#systemSettings?unit={f['pink']}&section=unknown",'invalid')]:
   page.goto(f['base']+'/'+hash_value);page.wait_for_selector('[data-bom-route-state='+state+']');assert page.url.endswith(hash_value);record(state);passed(state+' renders directly and preserves the rejected URL')
  visit('psSales','order',f['order']);url=page.url;page.evaluate("localStorage.setItem('bo_token','expired-synthetic-token')");page.reload();page.wait_for_selector('[name=email]');assert page.url==url;login();ready();assert page.url==url;record('Expired-session reauthentication');passed('Expired session preserves the intended order through authentication')
  page.evaluate('BOMRouter.logout()');page.wait_for_selector('[name=email]');assert '#dashboard' in page.url;login();ready();assert page.evaluate('BOMRouter.parse().view')=='dashboard';record('Ordinary login');passed('Explicit Logout followed by ordinary Login starts at Dashboard')
  page.evaluate('BOMRouter.logout()');page.wait_for_selector('[name=email]');denied=f['base']+f"/#accounting/account/{f['accounts']['krw']}?unit={f['pink']}";page.goto(denied);login(f['limited_email']);page.wait_for_selector('[data-bom-route-state=access]');assert page.url==denied;assert 'QA krw' not in page.locator('body').inner_text();record('Permission denied');passed('Unauthorized user sees only Access Denied with no protected record render')
  assert not errors,errors;browser.close()
 (root/'qa/evidence/36928-lifecycle-browser.json').write_text(json.dumps({'status':'PASS','checks':checks,'observations':observations,'production_data_used':False},indent=2))
except Exception as e:
 (root/'qa/evidence/36928-lifecycle-browser.json').write_text(json.dumps({'status':'FAIL','checks':checks,'observations':observations,'error':str(e)},indent=2));raise
finally:server.terminate();server.wait(timeout=10)
