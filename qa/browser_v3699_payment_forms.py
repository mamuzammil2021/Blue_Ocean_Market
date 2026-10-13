from playwright.sync_api import sync_playwright
from pathlib import Path
script=Path('/mnt/data/work698/Blue_Ocean_Market_V30_69_8/public/v3699-pink-payment-stabilization.js').read_text()
html='''<html><head></head><body><div id="modalRoot"></div><script>
window.KO={};window.t=s=>s;window.toast=s=>{window.error=s};window.__saved=[];
window.ps369AdvanceRefreshAccounts=async(f,id)=>{let from=f.elements.namedItem('payment_account_id'),to=f.elements.namedItem('receiver_account_id'); const method=f.elements.namedItem('payment_method').value;from.innerHTML='<option value="">Select</option><option value="'+(method==='Cash'?21:31)+'">'+method+' account</option>';from.value=method==='Cash'?'21':'31';to.innerHTML='<option value="">Select</option><option value="42">Supplier bank</option>';to.value=method==='Cash'?'':'42';};
window.ps369SettlementAccounts=window.ps369AdvanceRefreshAccounts;
window.ps369SetSettlementMode=(mode)=>{const f=document.getElementById('ps369SettlementForm');f.elements.namedItem('settlement_mode').value=mode;};
window.psImportPayment=async()=>{document.getElementById('modalRoot').innerHTML=`<div id="ps369PaymentChoice"><button data-mode="advance" onclick="ps369SetSettlementMode('advance')">Advance only</button><button data-mode="new" onclick="ps369SetSettlementMode('new')">New only</button><button data-mode="both" onclick="ps369SetSettlementMode('both')">Both</button></div><form id="ps369SettlementForm"><input name="__available_advance" value="0"><input name="settlement_mode" value="new"><input name="original_amount" value="100"><input name="reference" value="x"><div class="grid"><select name="payment_method"><option>Bank</option><option>Cash</option></select></div><div class="v369-paid-sides"><div class="field"><label>Paid From</label><select name="payment_account_id"><option value="31">bank</option></select></div><div class="field"><label>Paid To</label><select name="receiver_account_id"><option value="42">supplier</option></select></div></div></form>`;};
window.psSupplierPayment315=async()=>{document.getElementById('modalRoot').innerHTML=`<div class="v369-paid-sides"><div class="field"><label>Paid From</label><select name="payment_account_id" form="ps369AdvanceForm"><option value="31">Bank</option></select></div><div class="field"><label>Paid To</label><select name="receiver_account_id" form="ps369AdvanceForm"><option value="42">Supplier</option></select></div></div><form id="ps369AdvanceForm"><input name="original_amount" value="100"><input name="reference" value="x"><div class="grid"><select name="payment_method"><option>Bank</option><option>Cash</option></select></div></form>`;};
window.psSaveSupplierPayment315=async(ev)=>{ev.preventDefault();window.__saved.push(Object.fromEntries(new FormData(ev.target)))};
window.ps369SaveSettlement=async(ev)=>{ev.preventDefault();window.__saved.push(Object.fromEntries(new FormData(ev.target)))};
</script></body></html>'''
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page();page.set_content(html);page.add_script_tag(content=script)
 page.evaluate('psImportPayment(2)');page.wait_for_timeout(120)
 assert page.locator('#ps3699NoAdvance').count()==1
 assert page.locator('[data-mode=advance]').is_disabled() and page.locator('[data-mode=both]').is_disabled()
 assert page.locator('#ps369SettlementForm [name=payment_account_id]').count()==1
 page.evaluate("document.querySelector('#ps369SettlementForm [name=payment_method]').value='Cash';ps369SettlementAccounts(document.getElementById('ps369SettlementForm'),1)")
 page.wait_for_timeout(100)
 assert page.locator('#ps369SettlementForm [name=payment_account_id]').input_value()=='21'
 assert page.locator('#ps369SettlementForm [name=receiver_account_id]').is_hidden()
 page.evaluate("ps369SaveSettlement({preventDefault(){},target:document.getElementById('ps369SettlementForm')},1)")
 assert page.evaluate('__saved.at(-1).payment_account_id')=='21'
 page.evaluate('psSupplierPayment315(1)');page.wait_for_timeout(100)
 assert page.locator('#ps369AdvanceForm [name=payment_account_id]').count()==1
 page.evaluate("document.querySelector('#ps369AdvanceForm [name=payment_method]').value='Cash';ps369AdvanceRefreshAccounts(document.getElementById('ps369AdvanceForm'),1)")
 page.wait_for_timeout(100)
 assert page.locator('#ps369AdvanceForm [name=payment_account_id]').input_value()=='21'
 page.evaluate("psSaveSupplierPayment315({preventDefault(){},target:document.getElementById('ps369AdvanceForm')},1)")
 assert page.evaluate('__saved.at(-1).payment_account_id')=='21'
 print('PASS: actual Chromium: zero advance disabled and explained; one account selector; cash account filtering; supplier receiver hidden; submitted account IDs match')
 browser.close()
