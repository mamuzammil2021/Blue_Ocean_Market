from pathlib import Path
from playwright.sync_api import sync_playwright
source=Path(__file__).resolve().parents[1].joinpath('public/v3699-pink-payment-stabilization.js').read_text()
html='''<html><head></head><body><div id="modalRoot"></div><script>
window.KO={};window.t=x=>x;window.toast=x=>window.toastText=x;
window.ps369AdvanceRefreshAccounts=async(f)=>{const method=f.querySelector('[name=payment_method]').value;const from=f.querySelector('[name=payment_account_id]'),to=f.querySelector('[name=receiver_account_id]');from.innerHTML='<option value="">Choose</option><option value="'+(method==='Cash'?12:11)+'">'+method+'</option>';to.innerHTML='<option value="">Choose</option><option value="2">Supplier</option>';};
window.ps369SettlementAccounts=window.ps369AdvanceRefreshAccounts;
window.ps369SetSettlementMode=mode=>{document.querySelector('[name=settlement_mode]').value=mode};
window.psImportPayment=async()=>{document.querySelector('#modalRoot').innerHTML=`<div id="ps369PaymentChoice"><button data-mode="advance">Advance Only</button><button data-mode="new">New Payment</button><button data-mode="both">Both</button></div><form id="ps369SettlementForm" data-ps-account-layout="native"><input name="__available_advance" value="500"><input name="settlement_mode" value="new"><input name="original_amount" value="100"><input name="reference" value="INV-X"><select name="payment_method"><option>Bank</option><option>Cash</option></select><div class="ps3699-account-row"><div class="field"><label>Company account</label><select name="payment_account_id"></select></div><div class="field"><label>Supplier account</label><select name="receiver_account_id"></select></div></div></form>`;await window.ps369AdvanceRefreshAccounts(document.querySelector('#ps369SettlementForm'))};
window.psSaveSupplierPayment315=()=>{};
window.ps369SaveSettlement=(ev)=>{ev.preventDefault();window.posted=Object.fromEntries(new FormData(ev.target))};
</script></body></html>'''
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page();page.set_content(html);page.add_script_tag(content=source)
 page.evaluate('''async()=>await psImportPayment(1)''')
 assert page.locator('#ps369SettlementForm [name=payment_account_id]').count()==1
 assert page.locator('#ps369SettlementForm [name=receiver_account_id]').count()==1
 assert page.locator('#ps369SettlementForm .ps3699-account-row').count()==1
 page.locator('[name=payment_method]').select_option('Cash')
 page.evaluate('''async()=>await window.ps369AdvanceRefreshAccounts(document.querySelector('#ps369SettlementForm'),1)''')
 assert page.locator('[name=receiver_account_id]').is_hidden()
 assert page.locator('[name=payment_account_id] option').last.inner_text()=='Cash'
 page.locator('[name=payment_account_id]').select_option('12')
 page.evaluate('''()=>ps369SaveSettlement({preventDefault(){},target:document.querySelector('#ps369SettlementForm')},1)''')
 assert page.evaluate('posted.payment_account_id')=='12'
 print('PASS Chromium: native import account row, unique source/payee, Cash switching, saved account ID')
 browser.close()
