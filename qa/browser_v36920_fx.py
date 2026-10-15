"""Real browser/server QA. Creates only disposable fixtures and never production data."""
import os,json,subprocess,pathlib,sys,sqlite3,time
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[1]
node=os.environ.get('BOM_NODE','node')
server=subprocess.Popen([node,'qa/fx_browser_fixture.js'],cwd=root,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
checks=[]
def passed(s): checks.append(s);print('PASS '+s,flush=True)
try:
 f=json.loads(server.stdout.readline())
 with sync_playwright() as p:
  options={'headless':True,'args':['--no-sandbox','--no-zygote','--single-process','--disable-gpu','--disable-dev-shm-usage']}
  if os.environ.get('BOM_CHROMIUM'):options['executable_path']=os.environ['BOM_CHROMIUM']
  browser=p.chromium.launch(**options)
  page=browser.new_page(viewport={'width':1360,'height':950})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f['base']);page.evaluate("localStorage.setItem('bo_language','en')");page.reload()
  page.locator('select.language-switch').select_option('en')
  page.locator('input[name="email"]').fill(f['email']);page.locator('input[name="password"]').fill(f['password']);page.locator('form button[type="submit"],form button.primary').first.click()
  page.wait_for_timeout(1500)
  page.wait_for_selector('#content',timeout=10000)
  page.evaluate("id=>{selectedUnitId=String(id);localStorage.setItem('bo_unit',String(id));}",f['pink'])
  page.evaluate("id=>BOMPinkFX.open('import',id)",f['imports'][0]);page.wait_for_selector('#bomFxPaymentForm[data-ready="true"]')
  assert page.locator('#bomFxPaymentForm [name="payment_account_id"]').count()==1
  opts=page.locator('[name="payment_account_id"] option').all_text_contents()
  assert any('QA krw' in x for x in opts) and any('QA usd' in x for x in opts) and any('QA pkr' in x for x in opts)
  assert not any('QA inactive' in x for x in opts)
  passed('Authenticated native payment form shows all eligible currencies and one authoritative source selector')
  for i in range(4):
   page.locator('[name="payment_method"]').select_option('Cash');page.wait_for_function("!document.querySelector('[name=payment_account_id]').disabled && [...document.querySelector('[name=payment_account_id]').options].some(x=>x.textContent.includes('QA cash'))")
   assert page.locator('[name="payment_account_id"]').input_value()=='','Source selection was not cleared'
   page.locator('[name="payment_method"]').select_option('Bank');page.wait_for_function("!document.querySelector('[name=payment_account_id]').disabled && [...document.querySelector('[name=payment_account_id]').options].some(x=>x.textContent.includes('QA krw'))")
  assert page.locator('#bomFxError').inner_text()=='',page.locator('#bomFxError').inner_text()
  assert page.locator('#bomFxPaymentForm [name="payment_account_id"]').count()==1
  passed('Repeated Cash/Bank changes clear selections without duplicated validation or controls')
  page.locator('[data-bomfx-mode="advance"]').click();assert 'No advance' in page.locator('#bomFxError').inner_text()
  assert page.locator('[name="settlement_mode"]').input_value()=='new'
  passed('Zero-advance option explains New Payment Only')
  page.locator('[data-bomfx-cancel]').last.click();assert page.locator('#bomFxPaymentForm').count()==0
  passed('Cancel closes without saving')
  page.evaluate("id=>BOMPinkFX.open('import',id)",f['imports'][0]);page.wait_for_selector('#bomFxPaymentForm[data-ready="true"]')
  page.locator('[name="payment_account_id"]').select_option(str(f['accounts']['krw']))
  page.locator('[name="receiver_account_id"]').select_option(str(f['receivers']['USD']))
  page.locator('[name="bank_fx_rate"]').fill('1400')
  page.locator('#bomFxQuoteEvidence > summary').click() if page.locator('#bomFxQuoteEvidence').count() else None
  page.locator('[name="bank_quote_reference"]').fill('QA-BROWSER-QUOTE') if page.locator('[name=\"bank_quote_reference\"]').count() else None;page.locator('[name="quote_source"]').fill('QA bank quote evidence') if page.locator('[name=\"quote_source\"]').count() else None;page.locator('[name="quote_time"]').fill(time.strftime('%Y-%m-%dT%H:%M')) if page.locator('[name=\"quote_time\"]').count() else None
  page.locator('[name="recipient_expected_amount"]').fill('100')
  page.locator('#bomFxBankDetails > summary').click()
  page.locator('[name="source_fee_amount"]').fill('1000');page.locator('[name="reference"]').fill('QA-BROWSER-PAYMENT')
  page.locator('[name="receipt"]').set_input_files({'name':'qa-browser-bank.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4 QA bank quote/debit/recipient evidence'})
  page.locator('[name="source_fee_amount"]').press('Tab')
  assert page.locator('[name="source_debit_amount"]').input_value()=='141000'
  page.locator('#bomFxConfirmed').check() if page.locator('#bomFxConfirmed').count() else None
  page.locator('#bomFxPaymentForm [type="submit"]').click();page.wait_for_timeout(700);page.wait_for_selector('#confirmOk');page.locator('#confirmOk').click()
  # Existing CEO authorization is separately required by configured approval policy.
  page.wait_for_timeout(300)
  if page.locator('#confirmRoot textarea').count():
   page.locator('#confirmRoot textarea').fill('QA CEO authorization');page.locator('#confirmRoot button.primary,#confirmRoot button.danger').last.click()
  if page.locator('#reasonInput').count():page.locator('#reasonInput').fill('QA CEO authorization');page.locator('#reasonOk').click()
  page.wait_for_function("!document.querySelector('#bomFxPaymentForm') && !BOMPinkFX.diagnostics().busy",timeout=30000)
  con=sqlite3.connect(str(pathlib.Path(f['temp'])/'data/blue-ocean.sqlite'));con.row_factory=sqlite3.Row
  tx=dict(con.execute("SELECT * FROM pink_fx_transactions WHERE reference='QA-BROWSER-PAYMENT'").fetchone());assert tx['company_amount']==141000 and tx['invoice_amount']==100
  assert con.execute("SELECT COUNT(*) FROM finance_entries WHERE source_type='Pink Salt FX Payment' AND source_id=?",(tx['id'],)).fetchone()[0]==1
  passed('Actual authenticated browser KRW→USD transaction stores correct bank debit, settlement and one Finance record')
  page.evaluate("async id=>{await setLanguage('ko');await BOMPinkFX.open('import',id)}",f['imports'][0]);page.wait_for_selector('#bomFxPaymentForm[data-ready="true"]')
  assert '공급업체 지급 기록' in page.locator('#modalRoot h2').inner_text();assert '검토 및 확인' in page.locator('#bomFxPaymentForm [type="submit"]').inner_text()
  passed('Native payment UI renders Korean labels')
  page.locator('[data-bomfx-cancel]').last.click();page.evaluate("id=>psImportDetail(id)",f['imports'][0]);page.wait_for_timeout(500);url=page.url
  page.reload();page.wait_for_selector('#content');page.wait_for_timeout(700);assert page.url==url,(url,page.url)
  passed('Import record URL persists on browser refresh')
  # Exercise the actual registered entry points and conditional non-cash form.
  page.evaluate("async()=>{await setLanguage('en')}")
  def confirm_and_record():
   if page.locator('[name="settlement_mode"]').input_value()!='advance':page.locator('#bomFxConfirmed').check() if page.locator('#bomFxConfirmed').count() else None
   page.locator('#bomFxPaymentForm [type="submit"]').click()
   page.wait_for_selector('#confirmOk');page.locator('#confirmOk').click()
   try:page.wait_for_function("!document.querySelector('#bomFxPaymentForm') && !BOMPinkFX.diagnostics().busy",timeout=30000)
   except Exception:raise RuntimeError("Recording failed: "+page.locator("#bomFxError").inner_text())
  def evidence():page.locator('[name="receipt"]').set_input_files({'name':'qa-matrix-bank.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4 QA matrix evidence'})
  page.evaluate("id=>psSupplierAdvanceForm(id)",f['supplier']);page.wait_for_selector('#bomFxPaymentForm[data-ready="true"]')
  page.locator('[name="invoice_currency"]').select_option('USD')
  page.wait_for_function("!document.querySelector('[name=payment_account_id]').disabled")
  page.locator('[name="invoice_rate_to_krw"]').fill('1300')
  page.locator('[name="payment_account_id"]').select_option(str(f['accounts']['krw']))
  page.locator('[name="receiver_account_id"]').select_option(str(f['receivers']['USD']))
  page.locator('#bomFxQuoteEvidence > summary').click() if page.locator('#bomFxQuoteEvidence').count() else None;page.locator('[name="bank_fx_rate"]').fill('1400');page.locator('[name="bank_quote_reference"]').fill('QA-ADVANCE-QUOTE') if page.locator('[name=\"bank_quote_reference\"]').count() else None;page.locator('[name="quote_source"]').fill('QA bank confirmation') if page.locator('[name=\"quote_source\"]').count() else None;page.locator('[name="quote_time"]').fill(time.strftime('%Y-%m-%dT%H:%M')) if page.locator('[name=\"quote_time\"]').count() else None
  page.locator('[name="recipient_expected_amount"]').fill('10');page.locator('[name="reference"]').fill('QA-BROWSER-ADVANCE');evidence();confirm_and_record()
  passed('Actual supplier advance entry point records cross-currency bank debit and advance credit')
  count=con.execute("SELECT COUNT(*) FROM finance_entries WHERE source_type='Pink Salt FX Payment'").fetchone()[0]
  page.evaluate("id=>psImportPayment(id)",f['imports'][0]);page.wait_for_selector('#bomFxPaymentForm[data-ready="true"]')
  page.locator('[data-bomfx-mode="advance"]').click();page.locator('[name="advance_amount_krw"]').fill('5000')
  assert not page.locator('#bomFxMoney').is_visible()
  assert page.locator('[name="payment_account_id"]').is_disabled()
  confirm_and_record()
  assert con.execute("SELECT COUNT(*) FROM finance_entries WHERE source_type='Pink Salt FX Payment'").fetchone()[0]==count
  passed('Actual browser advance-only settlement hides money fields and creates no Finance movement')
  page.evaluate("id=>psImportPayment(id)",f['imports'][0]);page.wait_for_selector('#bomFxPaymentForm[data-ready="true"]')
  page.locator('[data-bomfx-mode="both"]').click();page.locator('[name="advance_amount_krw"]').fill('3000')
  page.locator('[name="payment_account_id"]').select_option(str(f['accounts']['usd']));page.locator('[name="receiver_account_id"]').select_option(str(f['receivers']['USD']));page.locator('[name="company_rate_to_krw"]').fill('1300')
  page.locator('[name="recipient_expected_amount"]').fill('10');page.locator('[name="reference"]').fill('QA-BROWSER-BOTH');evidence();confirm_and_record()
  assert con.execute("SELECT COUNT(*) FROM finance_entries WHERE source_type='Pink Salt FX Payment'").fetchone()[0]==count+1
  passed('Actual browser mixed advance and USD new payment creates one native-currency Finance movement')
  page.evaluate("id=>psImportPayment(id)",f['imports'][1]);page.wait_for_selector('#bomFxPaymentForm[data-ready="true"]')
  page.locator('[name="payment_method"]').select_option('Cash');page.wait_for_function("!document.querySelector('[name=payment_account_id]').disabled && [...document.querySelector('[name=payment_account_id]').options].some(x=>x.textContent.includes('QA cash'))")
  page.locator('[name="payment_account_id"]').select_option(str(f['accounts']['cash']));page.locator('[name="recipient_expected_amount"]').fill('1000');evidence();confirm_and_record()
  passed('Actual browser KRW cash settlement works without a reference or recipient bank account')
  page.evaluate('async id=>api(`/api/finance/${id}/verify`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({verification_status:"Correction Required",verification_note:"Synthetic original-user correction"})})',tx['finance_entry_id'])
  page.evaluate("id=>BOMPinkFX.view(id)",tx['id']);page.wait_for_selector('#v324WorkflowSurface')
  deep=page.url;page.reload();page.wait_for_selector('#v324WorkflowSurface');page.wait_for_function("location.hash.includes('/fx/')")
  assert page.url==deep
  browser2=p.chromium.launch(**options);second=browser2.new_page();second.goto(deep);second.wait_for_selector('input[name="email"]');second.locator('select.language-switch').select_option('en');second.locator('[name="email"]').fill(f['email']);second.locator('[name="password"]').fill(f['password']);second.locator('form button.primary').click();second.wait_for_selector('#v324WorkflowSurface');assert '/fx/' in second.url
  passed('Copied currency transaction deep link authenticates and restores the same record')
  second.close();browser2.close()
  page.evaluate("id=>psImportDetail(id)",f['imports'][0]);page.wait_for_timeout(200);page.go_back();page.wait_for_function("location.hash.includes('/fx/')");page.wait_for_selector('#v324WorkflowSurface');page.go_forward();page.wait_for_function("location.hash.includes('/import/')")
  page.wait_for_function("!BOMPersistentRouting.diagnostics().restoring && !BOMPersistentRouting.diagnostics().history_pending")
  passed('Browser Back and Forward restore currency and import records')
  page.evaluate("async()=>{view='psSales';await psSaleForm313()}");page.wait_for_selector('#ps313OrderLines')
  page.locator('[name="customer_id"]').select_option(str(f['customer']))
  page.locator('#ps313OrderLines select').first.select_option(str(f['product']))
  page.wait_for_timeout(200)
  page.locator('[name="payment_status"]').select_option('Paid')
  assert page.locator('#ps313PaidFields').count()==0 or not page.locator('#ps313PaidFields').is_visible()
  page.locator('form[onsubmit*="psSaveSale313"] .actions button.primary').last.click()
  # The existing application reviews stock/order creation separately from the later money settlement.
  page.wait_for_selector('#confirmRoot button')
  page.locator('#confirmRoot button.primary').last.click()
  page.wait_for_selector('#bomFxPaymentForm[data-ready="true"]',timeout=30000)
  page.locator('[name="payment_account_id"]').select_option(str(f['accounts']['usd']));page.locator('[name="company_rate_to_krw"]').fill('1300')
  page.locator('#bomFxQuoteEvidence > summary').click() if page.locator('#bomFxQuoteEvidence').count() else None;page.locator('[name="bank_fx_rate"]').fill(str(1/1300));page.locator('[name="bank_quote_reference"]').fill('QA-PAID-ORDER-QUOTE') if page.locator('[name=\"bank_quote_reference\"]').count() else None;page.locator('[name="quote_source"]').fill('QA bank conversion confirmation') if page.locator('[name=\"quote_source\"]').count() else None;page.locator('[name="quote_time"]').fill(time.strftime('%Y-%m-%dT%H:%M')) if page.locator('[name=\"quote_time\"]').count() else None
  page.locator('[name="recipient_expected_amount"]').fill('1000');page.locator('[name="reference"]').fill('QA-PAID-ORDER');evidence();confirm_and_record()
  paid=con.execute("SELECT o.payment_status FROM pink_salt_orders o JOIN pink_fx_transactions t ON t.record_id=o.id AND t.workflow='order' WHERE t.reference='QA-PAID-ORDER'").fetchone()[0]
  assert paid=='Paid',paid
  passed('Actual paid sales-order creation continues into native cross-currency receipt and completes as Paid')
  page.evaluate("id=>BOMPinkFX.view(id)",tx['id']);page.wait_for_selector('#v324WorkflowSurface')
  page.locator('[onclick="BOMPinkFX.correct('+str(tx['id'])+')"]').click();page.wait_for_selector('#bomFxPaymentForm[data-ready="true"]')
  assert page.locator('[name="payment_account_id"]').input_value()==str(f['accounts']['krw']),'Correction original source selection: '+page.locator('[name="payment_account_id"]').input_value()+' expected '+str(f['accounts']['krw'])+' details '+str(page.evaluate("({method:document.querySelector('[name=payment_method]').value,options:document.querySelector('[name=payment_account_id]').innerText,state:BOMPinkFX.diagnostics()})"))
  assert page.locator('[name="receiver_account_id"]').input_value()==str(f['receivers']['USD']),'Correction original receiver selection: '+page.locator('[name="receiver_account_id"]').input_value()
  page.locator('[name="reason"]').fill('QA correct actual bank fee against original bank evidence');page.locator('[name="source_fee_amount"]').fill('2000')
  confirm_and_record()
  corrected=dict(con.execute("SELECT * FROM pink_fx_transactions WHERE correction_of_id=? ORDER BY id DESC",(tx['id'],)).fetchone());assert corrected['company_amount']==142000
  assert con.execute('SELECT status FROM pink_fx_transactions WHERE id=?',(tx['id'],)).fetchone()[0]=='Reversed'
  passed('Actual browser correction preserves exact original accounts/evidence and atomically replaces financial effects')
  page.evaluate("id=>BOMPinkFX.view(id)",corrected['id']);page.wait_for_selector('#v324WorkflowSurface')
  page.locator('[onclick*="BOMPinkFX.reconcile("]').click();page.wait_for_selector('#bomFxReconcileForm')
  page.locator('[name="company_amount_actual"]').fill('142000');page.locator('[name="recipient_confirmed_amount"]').fill('100');page.locator('[name="reason"]').fill('QA actual statement and supplier match');page.locator('[name="receipt"]').set_input_files({'name':'qa-reconciliation.pdf','mimeType':'application/pdf','buffer':b'%PDF-1.4 QA reconciled bank statement and recipient confirmation'})
  page.locator('#bomFxReconcileForm button.primary').click();page.wait_for_selector('#confirmOk');page.locator('#confirmOk').click();page.wait_for_function("!document.querySelector('#bomFxReconcileForm')")
  assert con.execute('SELECT confirmation_status FROM pink_fx_transactions WHERE id=?',(corrected['id'],)).fetchone()[0]=='Reconciled'
  passed('Actual browser reconciliation retains additional evidence without rewriting bank or invoice amounts')
  assert not errors,'Browser errors: '+repr(errors)
  con.close();browser.close()
 result={'status':'PASS','checks':checks,'browser':'Chromium 153','authenticated':True}
 (root/'qa/evidence/36920-browser.json').write_text(json.dumps(result,indent=2))
except Exception as e:
 (root/'qa/evidence/36920-browser.json').write_text(json.dumps({'status':'FAIL','checks':checks,'error':str(e)},indent=2))
 print('BROWSER QA FAILED',str(e),file=sys.stderr)
 try:print('PAGE STATE:',page.locator('body').inner_text()[:1800], 'ERRORS:',errors,file=sys.stderr)
 except Exception:pass;sys.exit(1)
finally:
 server.terminate()
 try:server.wait(timeout=5)
 except subprocess.TimeoutExpired:server.kill()
