"""Authenticated QA14 acceptance against real Node/SQLite; all records are synthetic."""
import os,json,pathlib,subprocess,sqlite3,time,tempfile
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[1];source=pathlib.Path(os.environ.get('BOM_UI_SOURCE',str(root)));before=bool(os.environ.get('BOM_UI_SOURCE'));checks=[]
out=pathlib.Path(tempfile.mkdtemp(prefix='bom-supplier-accounts-ui-'))
server=subprocess.Popen([os.environ.get('BOM_NODE','node'),'qa/fx_browser_fixture.js'],cwd=source,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
def passed(s):checks.append(s);print('PASS '+s,flush=True)
try:
 raw=server.stdout.readline()
 if not raw:raise RuntimeError('Fixture startup failed: '+server.stderr.readline())
 f=json.loads(raw);con=sqlite3.connect(str(pathlib.Path(f['temp'])/'data/blue-ocean.sqlite'));con.row_factory=sqlite3.Row
 with sync_playwright() as p:
  opt={'headless':True,'args':['--no-sandbox','--no-zygote','--single-process','--disable-gpu','--disable-dev-shm-usage']}
  if os.environ.get('BOM_CHROMIUM'):opt['executable_path']=os.environ['BOM_CHROMIUM']
  browser=p.chromium.launch(**opt);ctx=browser.new_context(viewport={'width':1360,'height':950});page=ctx.new_page();page.set_default_timeout(12000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  def ready():
   try:page.wait_for_function("window.BOMRouter && BOMRouter.diagnostics().phase==='ready' && !BOMRouter.restoring",timeout=30000)
   except:
    print('ROUTE FAILURE',page.evaluate('({route:window.BOMRouter?.diagnostics(),hash:location.hash,authenticated:!!window.me,toast:document.querySelector("#toastRoot")?.textContent,visible:document.body.innerText.slice(-1600)})'),errors,flush=True);raise
  def login():
   page.wait_for_selector('[name=email]');page.locator('select.language-switch').select_option('en');page.locator('[name=email]').fill(f['email']);page.locator('[name=password]').fill(f['password']);page.locator('form button.primary').click();ready()
  def visit(v,k='',id=0,section=''):
   page.evaluate('async x=>{await BOMRouter.navigate(x.v,x.k,x.id,x.section,{unit:String(x.bu)})}',{'v':v,'k':k,'id':id,'section':section,'bu':f['pink']});ready()
  def api(method,url,data=None):return page.evaluate('async x=>api(x.url,{method:x.method,headers:{"Content-Type":"application/json","X-CEO-Confirmed":"1"},...(x.data===null?{}:{body:JSON.stringify(x.data)})})',{'method':method,'url':url,'data':data})
  def shot(name):
   page.wait_for_timeout(300);page.evaluate("document.querySelectorAll('#toastRoot > *').forEach(x=>x.remove())");page.screenshot(path=str(out/(('before-' if before else 'after-')+name+'.png')),full_page=False)
  def confirm():
   page.wait_for_selector('#confirmRoot .actions button:last-child');page.locator('#confirmRoot .actions button').last.click()
  def openpay(w,id):page.evaluate('x=>BOMPinkFX.open(x.w,x.id)',{'w':w,'id':id});page.wait_for_selector('#bomFxPaymentForm[data-ready=true]')
  def amount(v):page.locator('[name=recipient_expected_amount]').fill(str(v));page.locator('[name=recipient_expected_amount]').press('Tab')
  def evidence(ref):
   page.locator('[name=reference]').fill(ref);page.locator('[name=receipt]').set_input_files({'name':'synthetic-qa.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4 Synthetic QA receipt'})
  def record(non_cash=False):
   if not non_cash:
    try:page.locator('#bomFxConfirmed').check() if page.locator('#bomFxConfirmed').count() else None
    except:
     print('CONFIRM FAILURE',page.evaluate("({values:Object.fromEntries(new FormData(document.querySelector('#bomFxPaymentForm'))),live:document.querySelector('#bomFxLive').textContent,error:document.querySelector('#bomFxError').textContent})"),flush=True);raise
   page.locator('#bomFxPaymentForm [type=submit]').click();confirm();page.wait_for_function("!document.querySelector('#bomFxPaymentForm') && !BOMPinkFX.diagnostics().busy",timeout=30000);ready()
  page.goto(f['base']);login();visit('psSuppliers','supplier',f['supplier'],'payments')
  con.execute('UPDATE counterparty_payment_accounts SET currency=?,method_type=? WHERE id=?',(' usd ','Bank Transfer',f['receivers']['USD']));con.execute("INSERT INTO counterparty_payment_accounts(business_unit_id,entity_type,entity_id,label,method_type,currency,active) VALUES(?,'pink_salt_supplier',?,'Archived supplier bank','Bank','USD',0)",(f['pink'],f['supplier']));con.commit()
  openpay('supplier_advance',f['supplier'])
  if before:
   assert page.locator('[name=receiver_account_id] option[value="'+str(f['receivers']['USD'])+'"]').count()==0;assert con.execute('SELECT active FROM counterparty_payment_accounts WHERE id=?',(f['receivers']['USD'],)).fetchone()[0]==1;passed('Protected V30.69.26 reproduces saved active USD supplier bank missing under default KRW payment and historical method label');page.evaluate('BOMPinkFX.cancel()')
  else:
   for currency in ['KRW','USD','PKR']:assert page.locator('[name=receiver_account_id] option[value="'+str(f['receivers'][currency])+'"]').count()==1
   assert 'Archived supplier bank' not in page.locator('[name=receiver_account_id]').inner_text();assert page.locator('[name=receiver_account_id] option[value="'+str(f['receivers']['USD'])+'"]').is_enabled();passed('Supplier advance lists active saved banks across currencies, including historical Bank Transfer labels')
   page.locator('[name=payment_account_id]').select_option(str(f['accounts']['krw']));page.locator('[name=receiver_account_id]').select_option(str(f['receivers']['USD']));assert page.locator('[name=invoice_currency]').input_value()=='USD';assert page.locator('[name=payment_account_id]').input_value()==str(f['accounts']['krw']);assert page.locator('[name=bank_fx_rate]').input_value()=='' and page.locator('[name=invoice_rate_to_krw]').input_value()=='';passed('Selecting saved USD receiver sets advance currency, retains eligible KRW source and requires explicit FX')
   page.locator('#bomFxQuoteEvidence').evaluate('e=>e.open=true') if page.locator('#bomFxQuoteEvidence').count() else None
   for k,v in [('invoice_rate_to_krw','1300'),('bank_fx_rate','1400'),('bank_quote_reference','SUPPLIER-BANK-QUOTE'),('quote_source','Synthetic evidenced bank confirmation'),('quote_time',page.evaluate('()=>{const d=new Date(Date.now()-60000);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}'))]:page.locator('[name='+k+']').fill(v) if page.locator('[name='+k+']').count() else None
   amount(10);assert float(page.locator('[name=source_debit_amount]').input_value())==14000;evidence('SUPPLIER-SAVED-BANK');record();tx=dict(con.execute("SELECT * FROM pink_fx_transactions WHERE reference='SUPPLIER-SAVED-BANK'").fetchone());fin=dict(con.execute('SELECT * FROM finance_entries WHERE id=?',(tx['finance_entry_id'],)).fetchone());assert tx['receiver_account_id']==f['receivers']['USD'] and tx['company_account_id']==f['accounts']['krw'] and tx['company_amount']==14000 and tx['invoice_amount']==10;assert fin['receiver_currency_snapshot']=='USD';assert con.execute("SELECT COUNT(*) FROM finance_entries WHERE source_type='Pink Salt FX Payment' AND source_id=?",(tx['id'],)).fetchone()[0]==1;passed('Authenticated bank supplier advance records exact saved receiver, KRW debit, USD receipt and one Finance movement')
   openpay('import',f['imports'][0]);usd=page.locator('[name=receiver_account_id] option[value="'+str(f['receivers']['USD'])+'"]');krw=page.locator('[name=receiver_account_id] option[value="'+str(f['receivers']['KRW'])+'"]');assert usd.is_enabled() and krw.is_disabled();assert 'must match the invoice' in page.locator('#bomFxReceiverInfo').inner_text();page.evaluate('BOMPinkFX.cancel()');passed('USD invoice shows all saved banks but disables unsupported recipient-currency routes with clear explanation')
   openpay('supplier_advance',f['supplier']);page.locator('[name=receiver_account_id]').select_option(str(f['receivers']['KRW']))
   for i in range(4):
    page.locator('[name=payment_method]').select_option('Cash');page.wait_for_function("!document.querySelector('[name=payment_account_id]').disabled");assert not page.locator('#bomFxReceiver').is_visible();assert page.locator('[name=receiver_account_id]').is_disabled();assert page.locator('[name=receiver_account_id]').input_value()=='';assert page.locator('[name=receiver_account_id]').get_attribute('aria-required')=='false';page.locator('[name=payment_method]').select_option('Bank');page.wait_for_function("!document.querySelector('[name=payment_account_id]').disabled");assert page.locator('#bomFxReceiver').is_visible();assert page.locator('[name=receiver_account_id]').input_value()==''
   assert page.locator('#bomFxReceiverInfo').count()==1 and page.locator('#bomFxError').count()==1 and page.locator('[name=payment_account_id]').count()==1;passed('Repeated Bank/Cash switching clears supplier selection and errors; Cash hides and disables recipient validation')
   page.locator('[name=payment_method]').select_option('Cash');page.wait_for_function("!document.querySelector('[name=payment_account_id]').disabled");page.locator('[name=payment_account_id]').select_option(str(f['accounts']['cash']));amount(500);page.locator('[name=receipt]').set_input_files({'name':'cash.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4 Synthetic cash receipt'});record();cash=con.execute("SELECT * FROM pink_fx_transactions WHERE workflow='supplier_advance' AND company_account_id=? ORDER BY id DESC",(f['accounts']['cash'],)).fetchone();assert cash['receiver_account_id'] is None;assert cash['company_amount']==500;assert con.execute('SELECT receiver_account_id FROM finance_entries WHERE id=?',(cash['finance_entry_id'],)).fetchone()[0] is None;passed('Authenticated cash supplier advance succeeds without supplier account or cash reference')
   # Supplier context must render even when the separate company-account request is delayed/fails.
   held=[];page.route('**/api/v320/financial-accounts/options?*',lambda route:held.append(route));page.evaluate('id=>{BOMPinkFX.open("supplier_advance",id)}',f['supplier']);page.wait_for_selector('#bomFxPaymentForm');page.locator('[name=receiver_account_id] option[value="'+str(f['receivers']['USD'])+'"]').wait_for(state='attached');assert page.locator('[name=payment_account_id]').is_disabled();passed('Saved supplier banks render before a delayed company-source account request completes')
   assert held;held[0].fulfill(status=503,content_type='application/json',body=json.dumps({'error':'Synthetic company accounts unavailable'}));page.wait_for_selector('#bomFxPaymentForm[data-ready=true]');assert page.locator('[name=receiver_account_id] option[value="'+str(f['receivers']['USD'])+'"]').count()==1;assert 'Synthetic company accounts unavailable' in page.locator('#bomFxError').inner_text();page.locator('#bomFxPaymentForm [type=submit]').click();assert page.locator('[name=payment_account_id]').get_attribute('aria-invalid')=='true';assert page.evaluate('document.activeElement.name')=='payment_account_id';page.evaluate('BOMPinkFX.cancel()');page.unroute('**/api/v320/financial-accounts/options?*');passed('Company-source failure leaves supplier bank list usable and still blocks recording without an authorized source')
   fresh=api('POST','/api/v338/payee-accounts',{'business_unit_id':f['pink'],'entity_type':'pink_salt_supplier','entity_id':f['supplier'],'label':'Immediately added supplier bank','method_type':'Bank','currency':'KRW','bank_name':'Synthetic new Bank','account_holder':'Synthetic supplier','account_number':'0011223344','reason':'Synthetic account addition'});openpay('supplier_advance',f['supplier']);assert page.locator('[name=receiver_account_id] option[value="'+str(fresh['id'])+'"]').count()==1;passed('Reopening payment after Add fetches authoritative current supplier accounts immediately')
   archived=api('PUT','/api/v338/payee-accounts/'+str(fresh['id'])+'/archive',{'reason':'Synthetic archive'});page.evaluate('async x=>BOMPinkFX.refreshReceiverAccounts("pink_salt_supplier",x)',f['supplier']);assert page.locator('[name=receiver_account_id] option[value="'+str(fresh['id'])+'"]').count()==0;page.evaluate('BOMPinkFX.cancel()');passed('Shared receiver-account refresh removes archived banks without duplicate selectors')
   page.evaluate("setLanguage('ko')");ready();openpay('supplier_advance',f['supplier']);assert '다른 통화' in page.locator('#bomFxReceiverInfo').inner_text();page.locator('[name=payment_method]').select_option('Cash');page.wait_for_function("!document.querySelector('[name=payment_account_id]').disabled");assert not page.locator('#bomFxReceiver').is_visible();page.evaluate('BOMPinkFX.cancel()');passed('Account-currency guidance is Korean and Cash keeps the supplier-account section hidden')
   assert not errors,errors;passed('Supplier account loading, Bank/Cash switching and payments produce no JavaScript errors')
  browser.close()
 (root/'qa/evidence'/('36927-supplier-before.json' if before else '36927-supplier-browser.json')).write_text(json.dumps({'status':'PASS','checks':checks,'authenticated':True,'production_data_used':False},indent=2))
except Exception as e:
 (root/'qa/evidence'/('36927-supplier-before.json' if before else '36927-supplier-browser.json')).write_text(json.dumps({'status':'FAIL','checks':checks,'error':str(e)},indent=2));raise
finally:
 server.terminate();server.wait(timeout=10)
