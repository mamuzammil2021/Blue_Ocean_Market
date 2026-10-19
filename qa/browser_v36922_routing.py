"""Real authenticated routing matrix with isolated records; no production data."""
import os,json,pathlib,subprocess,sys,time
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[1]
server=subprocess.Popen([os.environ.get('BOM_NODE','node'),'qa/route_browser_fixture.js'],cwd=root,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
checks=[]
def passed(s):checks.append(s);print('PASS '+s,flush=True)
try:
 raw=server.stdout.readline()
 if not raw:raise RuntimeError('Routing fixture failed: '+server.stderr.readline())
 f=json.loads(raw)
 with sync_playwright() as p:
  opt={'headless':True,'args':['--no-sandbox','--no-zygote','--single-process','--disable-gpu','--disable-dev-shm-usage']}
  if os.environ.get('BOM_CHROMIUM'):opt['executable_path']=os.environ['BOM_CHROMIUM']
  browser=p.chromium.launch(**opt);context=browser.new_context(viewport={'width':1360,'height':950});page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  def ready():
   page.wait_for_function("['ready','access','unit','invalid','notfound','temporary'].includes(BOMRouter.diagnostics().phase) && !BOMRouter.diagnostics().restoring",timeout=30000)
   assert page.evaluate('BOMRouter.diagnostics().phase')=='ready',(page.evaluate('BOMRouter.diagnostics()'),page.locator('#content').inner_text()[-1000:])
  def sign_in():
   page.locator('select.language-switch').select_option('en');page.locator('input[name="email"]').fill(f['email']);page.locator('input[name="password"]').fill(f['password']);page.locator('form button.primary').click();ready()
  def visit(view,kind='',record=0,section='',unit=None):
   page.evaluate("async a=>{await BOMRouter.navigate(a.view,a.kind,a.id,a.section,{unit:a.unit});await BOMRouter.ready}",{'view':view,'kind':kind,'id':record,'section':section,'unit':str(unit or f['pink'])});ready()
  def refresh_case(view,kind,record,section,unit,text):
   visit(view,kind,record,section,unit);assert text in page.locator('#content,#modalRoot').all_inner_texts()[0] or text in page.locator('#modalRoot').inner_text(),text;url=page.url;before=page.evaluate('history.length');page.reload();ready();assert page.url==url,(url,page.url);assert page.evaluate('history.length')==before,('History changed',view,kind,before,page.evaluate('history.length'));assert text in page.locator('#content').inner_text() or text in page.locator('#modalRoot').inner_text(),('Record display missing',view,kind,page.locator('#content').inner_text()[-700:],page.locator('#modalRoot').inner_text()[-700:]);r=page.evaluate('BOMRouter.parse()');assert r['id']==record and r['section']==section,(r,record,section)
   if kind=='buyer':
    assert page.locator('[data-v337-buyer-tabs] .active').get_attribute('onclick').find(section)>=0
   if kind=='employee':assert page.locator('.v3592-tabs .v3592-tab.active').get_attribute('onclick').find(section)>=0
   if kind=='supplier' and view=='psSuppliers':assert page.locator('[data-ps315-tab].primary').get_attribute('data-ps315-tab')==section
   if kind=='financing':assert 'Synthetic Lender' in page.locator('h3').all_text_contents()[0] or any('Synthetic Lender' in x for x in page.locator('h3').all_text_contents())
   if kind=='supplier' and view=='excavatorSuppliers':assert page.locator('[data-v337-supplier-tabs] .active').get_attribute('onclick').find(section)>=0
   passed(view+'/'+kind+'/'+str(record)+' '+section+' restores exact URL, record and section without adding history')
  target=f"#psCustomers/customer/{f['customer']}?unit={f['pink']}&section=prices";page.goto(f['base']+'/'+target);sign_in();assert page.url.endswith(target);assert page.locator('[data-ps313-tab="prices"]').get_attribute('aria-selected')=='true';passed('Copied nested destination is preserved through first Sign In')
  cases=[('psImports','import',f['import'],'',f['pink'],'QA-IMP'),('psCustomers','customer',f['customer'],'receipts',f['pink'],'QA Customer'),('psSales','order',f['order'],'',f['pink'],'QA-ORDER'),('excavator','machine',f['machine'],'',f['excavator'],'QA-ROUTE-MACHINE'),('excavatorBuyers','buyer',f['buyer'],'accounts',f['excavator'],'Synthetic Routing Buyer'),('excavatorSuppliers','supplier',f['supplier'],'accounts',f['excavator'],'Synthetic Routing Supplier'),('payroll','employee',f['employee'],'accounts',f['pink'],'Synthetic Route Employee'),('tasks','task',f['task'],'',f['pink'],'Synthetic Route Task'),('payroll','run',f['run'],'',f['pink'],'QA-ROUTE-PAYROLL'),('meetings','meeting',f['meeting'],'',f['pink'],'Synthetic Route Meeting'),('reports','report',f['report'],'',f['pink'],'Synthetic Routing Work Report')]
  cases.extend([('approvals','approval',f['approval'],'',f['pink'],'QA-ROUTE-APPROVAL'),('finance','correction',f['correction'],'',f['pink'],'QA-ROUTE-CORRECTION'),('accounting','foreign-financing',f['foreign'],'',f['pink'],'QA-ROUTE-FOREIGN'),('accounting','asset',f['asset'],'',f['pink'],'QA-ROUTE-ASSET'),('accounting','journal',f['journal'],'',f['pink'],'QA-ROUTE-JOURNAL'),('psImports','fx',f['fx'],'',f['pink'],'QA-ROUTE-PAYMENT'),('finance','record',f['finance'],'',f['pink'],'QA-ROUTE-PAYMENT'),('psSuppliers','supplier',f['pink_supplier'],'payments',f['pink'],'QA FX Supplier'),('psProduction','batch',f['batch'],'',f['pink'],'QA-ROUTE-BATCH'),('accounting','account',f['accounts']['krw'],'',f['pink'],'QA krw'),('accounting','financing',f['financing'],'',f['pink'],'QA-ROUTE-FINANCING')])
  for case in cases:refresh_case(*case)
  for section in ['overview','records','payments','credit','refunds','transfers','documents']:
   refresh_case('excavatorBuyers','pakistan',f['pakistan'],section,f['excavator'],'Synthetic Pakistan Buyer')
  for section in ['overview','account','imports','packaging','documents','history']:
   refresh_case('psSuppliers','supplier',f['pink_supplier'],section,f['pink'],'QA FX Supplier')
  for section in ['payments','refunds','machines','requirements','documents']:
   refresh_case('excavatorBuyers','buyer',f['buyer'],section,f['excavator'],'Synthetic Routing Buyer')
  for section in ['overview','machines','requirements','payments']:
   refresh_case('excavatorSuppliers','supplier',f['supplier'],section,f['excavator'],'Synthetic Routing Supplier')
  for section in ['overview','employment','compensation','advances','payroll','documents','allocation']:
   refresh_case('payroll','employee',f['employee'],section,f['pink'],'Synthetic Route Employee')

  for v in ['psRawStock','psPackaging','psProduction','psFinished','psCommerce','finance','accounting','payroll','documents','approvals','notifications','audit','users','profile','systemSettings','meetings','reports']:
   visit(v);u=page.url;page.reload();ready();assert page.url==u;passed('Main page '+v+' restores without Dashboard fallback')
  for v in ['dashboard','sales','purchases','inventory','performance','psWaste','psSuppliers','psImports','psSales','psCustomers']:
   visit(v);u=page.url;page.reload();ready();assert page.url==u;passed('Additional main workspace '+v+' survives refresh')
  for v in ['restaurant','restaurantTables']:
   visit(v,unit=f['mimi']);u=page.url;page.reload();ready();assert page.url==u;passed('MIMI workspace '+v+' preserves its stable BU ID')
  for kind,title in [('menu','Menu Management'),('stock','Stock Management'),('weekly','Weekly Menu'),('buffet','Buffet Management'),('open-orders','Open Orders')]:
   visit('restaurant',kind,unit=f['mimi']);u=page.url;page.reload();ready();assert page.url==u;assert title in page.locator('#modalRoot').inner_text();passed('MIMI '+kind+' read workspace survives refresh')
  visit('dashboard',unit='all');u=page.url;page.reload();ready();assert page.url==u;assert page.evaluate('selectedUnitId')=='';passed('CEO All Units destination survives refresh')
  visit('dashboard',unit=f['pink']);page.locator('select.unit-switch').select_option(str(f['excavator']));ready();assert page.evaluate('selectedUnitId')==str(f['excavator']);page.go_back();ready();assert page.evaluate('selectedUnitId')==str(f['pink']);page.go_forward();ready();assert page.evaluate('selectedUnitId')==str(f['excavator']);passed('Native BU switching and Back/Forward preserve the requested stable unit IDs')
  assert 'SYNTHETIC_MARKER' not in page.evaluate("BOMRouter.hash('finance','',0,'',selectedUnitId,{password:'SYNTHETIC_MARKER',page:2})");passed('Shared URL writer rejects unregistered credential parameters')
  for section in ['summary','profiles','groups','scope','authority','advanced','history']:
   refresh_case('users','access',f['limited'],section,f['pink'],'Synthetic Restricted Reader')
  visit('users','profiles');u=page.url;page.reload();ready();assert page.url==u;assert 'Profile Library' in page.locator('#content').inner_text();passed('Access Profile Library survives refresh')
  for section in ['overview','profiles','groups','policies','approval','audit','defaults']:
   visit('systemSettings','security',section=section);u=page.url;page.reload();ready();assert page.url==u;assert 'Access Control Center' in page.locator('#content').inner_text();passed('Access Control Center '+section+' survives refresh')
  visit('excavator',unit=f['excavator']);page.locator('#excavatorMachineFilter').select_option('Open');page.locator('#excavatorMachineSort').select_option('oldest');page.evaluate("v3391MachinePager('size',50)");u=page.url;page.reload();ready();assert page.url==u;assert page.locator('#excavatorMachineFilter').input_value()=='Open';assert page.locator('#excavatorMachineSort').input_value()=='oldest';assert page.evaluate('BOMProgressive.diagnostics().machines.size')==50;passed('Excavator machine filter, sort and page size survive refresh')
  visit('profile',section='security');u=page.url;page.reload();ready();assert page.url==u;passed('My Account Security section survives refresh')
  visit('psCustomers','customer',f['customer'],'orders');page.locator('[data-ps313-tab="prices"]').click();ready();assert 'section=prices' in page.url;page.go_back();ready();assert 'section=orders' in page.url;page.go_forward();ready();assert 'section=prices' in page.url;passed('User section navigation creates predictable Back/Forward entries')
  page.goto(f['base']+'/#psImports/import/999999?unit='+str(f['pink']));page.wait_for_selector('[data-bom-route-state="notfound"]');assert '/999999?' in page.url;passed('Missing record retains URL and renders Record Not Found')
  page.goto(f['base']+'/#unknownModule/record/1?unit='+str(f['pink']));page.wait_for_selector('[data-bom-route-state="invalid"]');assert '#unknownModule' in page.url;passed('Unsupported route retains URL and renders explicit invalid state')
  page.goto(f['base']+'/#psImports/import/'+str(f['import'])+'?unit=999999');page.wait_for_selector('[data-bom-route-state="unit"]');assert 'unit=999999' in page.url;passed('Unavailable explicit BU is rejected without choosing another unit')
  visit('psSales','order',f['order']);u=page.url;page.evaluate("localStorage.setItem('bo_token','expired-qa-token')");page.reload();page.wait_for_selector('input[name="email"]');assert page.url==u;sign_in();assert page.url==u;passed('Expired session returns to exact order after authentication')
  visit('psImports','import',f['import']);u=page.url
  page.route('**/api/pink-salt/imports/'+str(f['import']),lambda route:route.fulfill(status=503,content_type='application/json',body='{"error":"Synthetic temporary outage"}'))
  page.reload();page.wait_for_selector('[data-bom-route-state="temporary"]');assert page.url==u;page.unroute('**/api/pink-salt/imports/'+str(f['import']));page.locator('[data-bom-route-state] button').click();ready();assert page.url==u;passed('Temporary API failure preserves destination and Retry restores it')
  page.route('**/api/access/me',lambda route:route.fulfill(status=503,content_type='application/json',body='{"error":"Synthetic access-service outage"}'));page.reload();page.wait_for_selector('[data-bom-route-state="temporary"]');assert page.url==u;page.unroute('**/api/access/me');page.locator('[data-bom-route-state] button').click();ready();passed('Permission-service outage is Retry state rather than false Access Denied')
  visit('finance');page.get_by_role('button',name='Show Filters',exact=True).first.click();page.locator('#financeStatusFilter').select_option('Pending Verification');page.locator('#financeTypeFilter').select_option('Expense');page.evaluate("v3392FinancePage('size',50)");u=page.url;page.reload();ready();assert page.url==u;assert page.locator('#financeStatusFilter').input_value()=='Pending Verification',('Finance status',page.url,page.locator('#financeStatusFilter').input_value(),page.evaluate('__BOM_V3392_CLIENT.state'));assert page.locator('#financeTypeFilter').input_value()=='Expense',('Finance type',page.url,page.locator('#financeTypeFilter').input_value());assert page.evaluate('__BOM_V3392_CLIENT.state.size')==50,('Finance size',page.url,page.evaluate('__BOM_V3392_CLIENT.state.size'));passed('Finance status, movement type and server pagination restore from URL')
  visit('accounting',section='cash');u=page.url;page.reload();ready();assert page.url==u;assert page.locator('#accountingSimpleBodyV291').count()==1;passed('Accounting Simple Cash & Banks section restores its actual body')
  page.evaluate("BOMRouter.navigate('accounting','',0,'accounts',{unit:"+str(f['pink'])+",params:{mode:'advanced'}})");ready();u=page.url;page.reload();ready();assert page.url==u;assert page.locator('#accountingV29Body').count()==1;passed('Accounting Advanced Chart of Accounts restores mode and section')
  for key in ['simple:overview','simple:balances','simple:financing','v358:statements','v358:cashflow','v358:management','fixed','expenses','inventory','integrity','interbu']:
   page.evaluate('async key=>{await v357AccountingOpen(key);await BOMRouter.ready}',key);ready();u=page.url;page.reload();ready();assert page.url==u;assert page.evaluate('BOMRouter.parse().section')=='workspace:'+key;passed('Accounting workspace '+key+' survives refresh')
  page.evaluate("async()=>{await v357AccountingOpen('v358:statements');await BOMRouter.ready}");ready();page.locator('#v358Range [name=from]').fill('2026-01-01');page.locator('#v358Range [name=to]').fill('2026-09-30');page.locator('#v358Range button').click();page.wait_for_function("BOMRouter.parse().params.get('from')==='2026-01-01'");u=page.url;page.reload();ready();assert page.url==u,(page.url,u);assert page.locator('#v358Range [name=from]').input_value()=='2026-01-01',(page.url,page.locator('#v358Range [name=from]').input_value());passed('Financial report date range survives refresh from URL')
  visit('accounting','control');u=page.url;page.reload();ready();assert page.url==u;assert 'Posting Control' in page.locator('#content').inner_text();passed('Posting Control workspace survives refresh')
  visit('psCustomers');page.evaluate("BOMPinkPages349.change('customers','activity','Archived')");page.wait_for_timeout(450);u=page.url;page.reload();ready();assert page.url==u;assert page.evaluate("BOMPinkPages349.states.customers.activity")=='Archived',(page.url,page.evaluate('BOMPinkPages349.states.customers'));passed('Server-paged customer activity filter is restored from URL')
  visit('excavatorBuyers','buyer',f['buyer'],'accounts',f['excavator']);u=page.url;page.evaluate("async()=>{await setLanguage('ko');await BOMRouter.ready}");ready();assert page.url==u;assert page.locator('[data-v337-buyer-tabs] .active').get_attribute('onclick').find('accounts')>=0;page.evaluate("async()=>{await setLanguage('en');await BOMRouter.ready}");ready();passed('EN/KR switching preserves buyer record and Accounts section')
  page.evaluate('BOMRouter.logout()');page.wait_for_selector('input[name="email"]');assert '#dashboard' in page.url;sign_in();assert page.evaluate('BOMRouter.parse().view')=='dashboard';passed('Explicit Logout and ordinary Sign In open Dashboard')
  slow='**/api/pink-salt/imports/'+str(f['import'])
  def delayed(route):
   time.sleep(0.8)
   try:route.continue_()
   except Exception:pass
  page.route(slow,delayed)
  page.evaluate("a=>{BOMRouter.navigate('psImports','import',a.imp,'',{unit:a.unit});setTimeout(()=>BOMRouter.navigate('psCustomers','customer',a.customer,'prices',{unit:a.unit}),80)}",{'imp':f['import'],'customer':f['customer'],'unit':f['pink']})
  page.wait_for_function("!BOMRouter.restoring && BOMRouter.parse().view==='psCustomers' && BOMRouter.diagnostics().phase==='ready'");assert page.locator('[data-ps313-tab="prices"]').get_attribute('aria-selected')=='true';page.unroute(slow);passed('Slow obsolete import response cannot overwrite newer customer navigation')
  copied=page.url;second=page.context.new_page();second.goto(copied);second.wait_for_function("typeof BOMRouter!=='undefined' && BOMRouter.diagnostics().phase==='ready' && !BOMRouter.restoring");assert second.url==copied;assert second.locator('[data-ps313-tab="prices"]').get_attribute('aria-selected')=='true';passed('Copied nested URL opens the exact customer section in another tab')
  page.screenshot(path=str(root/'qa/evidence/36922-route-restored.png'),full_page=True)
  denied_url=f['base']+'/#accounting/account/'+str(f['accounts']['krw'])+'?unit='+str(f['pink']);page.evaluate('BOMRouter.logout()');page.goto(denied_url);page.reload();page.wait_for_selector('input[name="email"]');page.locator('input[name="email"]').fill(f['limited_email']);page.locator('input[name="password"]').fill(f['password']);page.locator('form button.primary').click();page.wait_for_function("['ready','access','unit','invalid','notfound','temporary'].includes(BOMRouter.diagnostics().phase) && !BOMRouter.restoring");assert page.locator('[data-bom-route-state="access"]').count()==1,('Restricted route',page.evaluate('BOMRouter.diagnostics()'),page.evaluate('({role:me?.role,permissions:accessState.permissions})'),page.locator('body').inner_text()[-1000:]);assert page.url==denied_url;assert 'QA krw' not in page.locator('body').inner_text();passed('Restricted user sees Access Denied with exact URL and no protected record content')
  page.screenshot(path=str(root/'qa/evidence/36922-route-restored.png'),full_page=True)
  page.evaluate("BOMRouter.navigate('tasks','',0,'',{unit:BOMRouter.parse().unit})");ready();assert page.evaluate('BOMRouter.parse().view')=='tasks';passed('Restricted user can still open an authorized workspace')
  assert not errors,errors;registry_snapshot=page.evaluate("Array.from(BOMRoutes.entries.values(),e=>({view:e.view,kind:e.kind,open:e.open,section:!!e.section,temporary:!!e.temporary}))");browser.close()
 (root/'qa/evidence/36922-routing-browser.json').write_text(json.dumps({'status':'PASS','checks':checks,'production_data_used':False,'authenticated':True,'console_errors':errors,'registry':registry_snapshot},indent=2))
except Exception as e:
 try:print('FAILURE STATE',page.evaluate('({route:BOMRouter.diagnostics(),role:me?.role,unit:selectedUnitId})'),page.locator('body').inner_text()[-1800:],errors,flush=True)
 except Exception:pass
 (root/'qa/evidence/36922-routing-browser.json').write_text(json.dumps({'status':'FAIL','checks':checks,'error':str(e)},indent=2));print('ROUTING QA FAILED',str(e),file=sys.stderr);sys.exit(1)
finally:
 server.terminate()
 try:server.wait(timeout=5)
 except subprocess.TimeoutExpired:server.kill()
