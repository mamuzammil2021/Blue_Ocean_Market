"""Observe actual DOM writes and painted destinations, not just final hashes."""
import os,json,pathlib,subprocess,time,tempfile
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[1];source=pathlib.Path(os.environ.get('BOM_HYDRATION_SOURCE') or str(root)).resolve();before=source!=root
checks=[];evidence=[]
def passed(s):checks.append(s);print('PASS '+s,flush=True)
server=subprocess.Popen([os.environ.get('BOM_NODE','node'),'qa/route_browser_fixture.js'],cwd=source,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
observe=(root/'qa/hydration_observer.js').read_text()
try:
 raw=server.stdout.readline()
 if not raw:raise RuntimeError('Hydration fixture startup: '+server.stderr.readline())
 f=json.loads(raw)
 with sync_playwright() as p:
  opts={'headless':True,'args':['--no-sandbox','--no-zygote','--single-process','--disable-gpu','--disable-dev-shm-usage']}
  if os.environ.get('BOM_CHROMIUM'):opts['executable_path']=os.environ['BOM_CHROMIUM']
  browser=p.chromium.launch(**opts);ctx=browser.new_context(viewport={'width':1360,'height':950});ctx.add_init_script(observe);page=ctx.new_page();page.set_default_timeout(15000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  def ready():
   page.wait_for_function("window.BOMRouter && !BOMRouter.restoring && ['ready','temporary','access','unit','notfound','invalid'].includes(BOMRouter.diagnostics().phase)",timeout=45000)
   assert page.evaluate('BOMRouter.diagnostics().phase')=='ready',(page.evaluate('BOMRouter.diagnostics()'),page.locator('#content').inner_text()[-900:])
  def login():
   page.wait_for_selector('input[name=email]');page.locator('select.language-switch').select_option('en');page.locator('[name=email]').fill(f['email']);page.locator('[name=password]').fill(f['password']);page.locator('form button.primary').click();ready()
  def visit(v,k='',id=0,section='',unit=None):page.evaluate('async x=>BOMRouter.navigate(x.v,x.k,x.id,x.section,{unit:x.unit})',{'v':v,'k':k,'id':id,'section':section,'unit':str(unit or f['pink'])});ready()
  page.goto(f['base']);login()
  cases=[('psSuppliers','supplier',f['pink_supplier'],'accounts',f['pink'],'QA FX Supplier'),('excavatorSuppliers','supplier',f['supplier'],'accounts',f['excavator'],'Synthetic Routing Supplier'),('excavatorBuyers','buyer',f['buyer'],'accounts',f['excavator'],'Synthetic Routing Buyer'),('payroll','employee',f['employee'],'accounts',f['pink'],'Synthetic Route Employee'),('finance','record',f['finance'],'',f['pink'],'QA-ROUTE-PAYMENT'),('accounting','account',f['accounts']['krw'],'',f['pink'],'QA krw')]
  cases.extend([('psImports','import',f['import'],'',f['pink'],'QA-IMP'),('psCustomers','customer',f['customer'],'prices',f['pink'],'QA Customer'),('psSales','order',f['order'],'',f['pink'],'QA-ORDER'),('excavator','machine',f['machine'],'',f['excavator'],'QA-ROUTE-MACHINE'),('excavatorBuyers','pakistan',f['pakistan'],'transfers',f['excavator'],'Synthetic Pakistan Buyer'),('payroll','run',f['run'],'',f['pink'],'QA-ROUTE-PAYROLL'),('tasks','task',f['task'],'',f['pink'],'Synthetic Route Task'),('meetings','meeting',f['meeting'],'',f['pink'],'Synthetic Route Meeting'),('reports','report',f['report'],'',f['pink'],'Synthetic Routing Work Report'),('approvals','approval',f['approval'],'',f['pink'],'QA-ROUTE-APPROVAL'),('finance','correction',f['correction'],'',f['pink'],'QA-ROUTE-CORRECTION'),('accounting','foreign-financing',f['foreign'],'',f['pink'],'QA-ROUTE-FOREIGN'),('accounting','asset',f['asset'],'',f['pink'],'QA-ROUTE-ASSET'),('accounting','journal',f['journal'],'',f['pink'],'QA-ROUTE-JOURNAL'),('psImports','fx',f['fx'],'',f['pink'],'QA-ROUTE-PAYMENT'),('psProduction','batch',f['batch'],'',f['pink'],'QA-ROUTE-BATCH'),('accounting','financing',f['financing'],'',f['pink'],'QA-ROUTE-FINANCING'),('accounting','control',0,'',f['pink'],'Posting Control'),('accounting','ledger',f['ledger'],'',f['pink'],'Ledger'),('users','access',f['limited'],'groups',f['pink'],'Synthetic Restricted Reader'),('users','profiles',0,'',f['pink'],'Profile Library'),('systemSettings','security',0,'audit',f['pink'],'Access Control Center'),('profile','',0,'security',f['pink'],'My Account'),('accounting','',0,'workspace:v358:statements',f['pink'],'Financial Statements')])
  cases.extend([('psFinished','lots',0,'',f['pink'],'Lots & Expiry'),('psFinished','families',0,'',f['pink'],'Product Families'),('psSales','trace',f['order'],'',f['pink'],'Trace Order Lots'),('accounting','posting',f['journal'],'',f['pink'],'Accounting Posting Review')])
  for kind,title in [('menu','Menu Management'),('stock','Stock Management'),('weekly','Weekly Menu'),('buffet','Buffet Management'),('open-orders','Open Orders')]:cases.append(('restaurant',kind,0,'',f['mimi'],title))
  for v in ['dashboard','psFinished','psCommerce','psRawStock','psPackaging','documents','notifications','systemSettings','restaurantTables']:
   cases.append((v,'',0,'',f['mimi'] if v=='restaurantTables' else f['pink'],''))
  for v,k,id,section,unit,text in cases:
   visit(v,k,id,section,unit);url=page.url;history_length=page.evaluate('history.length');page.reload();ready();assert page.url==url;assert page.evaluate('history.length')==history_length;assert text in page.locator('#content,#modalRoot').all_text_contents()[0] or text in page.locator('#modalRoot').inner_text();page.evaluate('()=>new Promise(requestAnimationFrame)');record=page.evaluate('__hydrationQA');record['trace']=page.evaluate('BOMRouter.diagnostics().trace||[]');record.update({'route':url.split('#')[1],'final_ms':page.evaluate('Math.round(performance.now()-__hydrationQA.start)'),'case':v+'/'+k,'record_id':id,'section':section});evidence.append(record)
   if not before:
    expected=page.locator('#content h1,#content h2,#modalRoot h1,#modalRoot h2').all_text_contents();unrelated=[x for x in record['writes']+record['paint'] if any(h not in expected for h in x['headings'])]
    assert not unrelated,(v,k,unrelated[:5])
    assert len([x for x in record['trace'] if x['stage']=='destination'])==1,record['trace']
    assert not [x for x in record['history'] if x['action']=='pushState'],record['history']
    assert page.locator('[data-bom-route-loading]').count()==0
    if section:
     for x in record['writes']:
      if any(text in h for h in x['headings']) and x['tabs']:assert any(section in t for t in x['tabs']),(v,section,x)
   passed(('Baseline observed ' if before else 'Direct exact destination ')+v+'/'+k+' '+section)
  assert not errors,errors;browser.close()
 (root/'qa/evidence'/('36928-hydration-before.json' if before else '36928-hydration-browser.json')).write_text(json.dumps({'status':'PASS','baseline':before,'checks':checks,'observations':evidence,'production_data_used':False},indent=2))
except Exception as e:
 (root/'qa/evidence'/('36928-hydration-before.json' if before else '36928-hydration-browser.json')).write_text(json.dumps({'status':'FAIL','checks':checks,'observations':evidence,'error':str(e)},indent=2));raise
finally:
 server.terminate();server.wait(timeout=10)
