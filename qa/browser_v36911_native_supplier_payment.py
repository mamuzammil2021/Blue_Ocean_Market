from pathlib import Path
from playwright.sync_api import sync_playwright
s=Path('/mnt/data/workfix/Blue_Ocean_Market_V30_69_11/public/v369-pink-shared-workflows.js').read_text()
start=s.index('window.psSupplierPayment315=async function(id){');end=s.index('window.ps369AdvanceRefreshAccounts=',start)
function=s[start:end]
html='<html><body><div id="modalRoot"></div></body></html>'
bootstrap="""window.tr=s=>s;window.escx=s=>s;window.modal=(s)=>document.getElementById('modalRoot').innerHTML=s;window.translateElement=()=>{};window.closeModal=()=>document.getElementById('modalRoot').innerHTML='';window.ps369AdvanceRefreshAccounts=async(f)=>{let from=f.elements.namedItem('payment_account_id'),to=f.elements.namedItem('receiver_account_id');let cash=f.elements.namedItem('payment_method').value==='Cash';from.innerHTML='<option value=\"\">Choose</option><option value=\"'+(cash?'12':'33')+'\">account</option>';from.value=cash?'12':'33';to.closest('.field').style.display=cash?'none':'';to.disabled=cash;to.required=!cash;};"""
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page();page.set_content(html);page.add_script_tag(content=bootstrap);page.add_script_tag(content=function)
 page.evaluate('psSupplierPayment315(1)');page.wait_for_timeout(80)
 assert page.locator('#ps369AdvanceForm [name="payment_account_id"]').count()==1
 assert page.locator('[name="payment_account_id"]').count()==1
 assert page.locator('[name="receiver_account_id"]').count()==1
 assert page.locator('#ps369AdvanceForm [name="payment_account_id"]').input_value()=='33'
 page.select_option('#ps369AdvanceForm [name="payment_method"]','Cash');page.wait_for_timeout(50)
 assert page.locator('#ps369AdvanceForm [name="payment_account_id"]').input_value()=='12'
 assert page.locator('#ps369AdvanceForm [name="receiver_account_id"]').is_hidden()
 assert page.evaluate("new FormData(document.getElementById('ps369AdvanceForm')).get('payment_account_id')")=='12'
 page.select_option('#ps369AdvanceForm [name="payment_method"]','Bank');page.wait_for_timeout(50)
 assert page.locator('#ps369AdvanceForm [name="payment_account_id"]').input_value()=='33'
 assert page.locator('#ps369AdvanceForm [name="receiver_account_id"]').is_visible()
 page.get_by_role('button',name='Cancel').click();assert page.locator('#ps369AdvanceForm').count()==0
 print('PASS Chromium: native supplier form, unique selectors, Cash/Bank switch, form submitted account, Cancel')
 browser.close()
