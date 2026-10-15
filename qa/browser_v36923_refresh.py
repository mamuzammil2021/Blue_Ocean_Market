"""Native UI navigation + real server refresh with stale deployment gzip artifacts."""
import os,json,pathlib,subprocess,gzip
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[1]
checks=[];server=None;backups={}
def passed(s):checks.append(s);print('PASS '+s,flush=True)
try:
 for name in ['client.js','runtime-v30392.js']:
  target=root/'public'/(name+'.gz');backups[target]=target.read_bytes() if target.exists() else None
  target.write_bytes(gzip.compress(b'throw new Error("Obsolete compressed deployment asset executed");'))
 server=subprocess.Popen([os.environ.get('BOM_NODE','node'),'qa/route_browser_fixture.js'],cwd=root,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 raw=server.stdout.readline()
 if not raw:raise RuntimeError('Fixture failed: '+server.stderr.readline())
 f=json.loads(raw)
 with sync_playwright() as p:
  opt={'headless':True,'args':['--no-sandbox','--no-zygote','--single-process','--disable-gpu','--disable-dev-shm-usage']}
  if os.environ.get('BOM_CHROMIUM'):opt['executable_path']=os.environ['BOM_CHROMIUM']
  browser=p.chromium.launch(**opt);context=browser.new_context(viewport={'width':1360,'height':950});page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  def ready(view=None):
   try:page.wait_for_function("v=>window.BOMRouter && BOMRouter.diagnostics().phase==='ready' && !BOMRouter.restoring && BOMRouter.diagnostics().lastRestored===location.hash && (!v||BOMRouter.parse().view===v)",arg=view,timeout=30000)
   except Exception:raise RuntimeError('Destination '+str(view)+' did not restore: '+json.dumps(page.evaluate('({route:BOMRouter.parse(),diagnostics:BOMRouter.diagnostics()})'))+' errors='+json.dumps(errors))
  page.goto(f['base']+'/#dashboard?unit='+str(f['pink']));page.locator('select.language-switch').select_option('en');page.locator('input[name="email"]').fill(f['email']);page.locator('input[name="password"]').fill(f['password']);page.locator('form button.primary').click();ready('dashboard')
  assert page.locator('#bom314FormConfirm').count()==0;passed('Real Chromium boot and login use canonical assets despite stale gzip leftovers')
  def menu(view):
   page.locator('.nav [data-nav-key="'+view+'"]').click();ready(view)
  def refresh(expected_view,record=0,section=''):
   u=page.url;page.reload();ready(expected_view);assert page.url==u,(u,page.url);r=page.evaluate('BOMRouter.parse()');assert r['id']==record and r['section']==section
  for view in ['psSuppliers','psImports','psRawStock','psPackaging','psProduction','psFinished','psSales','psCustomers','finance','accounting','payroll','documents','tasks','meetings','reports','approvals','users','profile']:
   menu(view);refresh(view);passed('Native sidebar '+view+' then browser refresh preserves the actual destination')
  menu('psCustomers');page.locator('button[onclick="psCustomerAccount313('+str(f['customer'])+')"]').click();ready('psCustomers');page.locator('[data-ps313-tab="prices"]').click();ready('psCustomers');refresh('psCustomers',f['customer'],'prices');assert page.locator('[data-ps313-tab="prices"]').get_attribute('aria-selected')=='true';passed('Native customer Open and Prices tab survive refresh with exact record and section')
  page.locator('select.language-switch').select_option('ko');ready('psCustomers');refresh('psCustomers',f['customer'],'prices');assert page.locator('[data-ps313-tab="prices"]').get_attribute('aria-selected')=='true';passed('Korean native record navigation and refresh retain the selected customer section')
  menu('psImports');page.locator('button[onclick="psImportDetail('+str(f['import'])+')"]').first.click();ready('psImports');refresh('psImports',f['import']);assert 'QA-IMP' in page.locator('#content').inner_text();passed('Native import Open then refresh preserves the import rather than returning to its list')
  menu('finance');page.locator('select.unit-switch').select_option(str(f['excavator']));ready('finance')
  menu('excavator');page.locator('button[onclick="excavatorOpenMachine('+str(f['machine'])+')"]').click();ready('excavator');refresh('excavator',f['machine']);assert 'QA-ROUTE-MACHINE' in page.locator('#content').inner_text();passed('Native Excavator machine Open then refresh preserves the exact machine')
  menu('finance');refresh('finance');passed('Korean sidebar Finance navigation survives refresh without Dashboard fallback')
  page.locator('button.sidebar-toggle').click();assert page.locator('body').evaluate("e=>e.classList.contains('sidebar-collapsed')");page.locator('button.sidebar-toggle').click();passed('Native desktop sidebar collapse and expand helpers work')
  page.set_viewport_size({'width':430,'height':850});page.locator('button.mobile-menu').click();assert page.locator('body').evaluate("e=>e.classList.contains('mobile-nav-open')");page.locator('.mobile-side-close').click();assert not page.locator('body').evaluate("e=>e.classList.contains('mobile-nav-open')");passed('Native mobile menu opens and closes without missing helper errors')
  assert not errors,errors;passed('Stale compressed assets produce no JavaScript startup or navigation errors')
  browser.close()
 (root/'qa/evidence/36923-native-refresh.json').write_text(json.dumps({'status':'PASS','checks':checks,'authenticated':True,'stale_gzip_injected':True,'production_data_used':False},indent=2))
except Exception as e:
 (root/'qa/evidence/36923-native-refresh.json').write_text(json.dumps({'status':'FAIL','checks':checks,'error':str(e),'production_data_used':False},indent=2));print('REFRESH QA FAILED '+str(e),flush=True);raise
finally:
 if server:server.terminate();server.wait(timeout=10)
 for target,original in backups.items():
  if original is None:target.unlink(missing_ok=True)
  else:target.write_bytes(original)
