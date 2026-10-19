from pathlib import Path
from playwright.sync_api import sync_playwright
js=Path(__file__).resolve().parents[1].joinpath('public/bom-payment-rules.js').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page()
 page.set_content('<html><body><button id="cash">Cash</button><button id="bank">Bank</button><select id="from"><option value="">Select source</option></select><div id="receiver"></div></body></html>')
 page.add_script_tag(content=js)
 page.evaluate('''() => {const accounts=[{id:1,financial_account_type:'Bank',currency:'PKR'},{id:2,financial_account_type:'Cash',currency:'PKR'}];function show(method){const selected=accounts.filter(a=>BOMPaymentRules.eligibleSource(a,method,'PKR'));document.querySelector('#from').innerHTML='<option value="">Select source</option>'+selected.map(a=>`<option value="${a.id}">${a.financial_account_type}</option>`).join('');document.querySelector('#receiver').textContent=BOMPaymentRules.requiresCounterparty(method,'new')?'Supplier receiving account':'';}document.querySelector('#cash').onclick=()=>show('Cash');document.querySelector('#bank').onclick=()=>show('Bank');show('Bank');}''')
 assert page.locator('#from option').count()==2
 assert 'Supplier receiving' in page.locator('#receiver').inner_text()
 page.locator('#cash').click()
 assert page.locator('#from option').count()==2
 assert page.locator('#from option').last.inner_text()=='Cash'
 assert page.locator('#receiver').inner_text()==''
 page.locator('#bank').click()
 assert page.locator('#from option').last.inner_text()=='Bank'
 assert page.locator('#from').input_value()==''
 print('PASS Chromium isolated: company Bank/Cash switching, no preselected source, correct receiving-account visibility')
 browser.close()
