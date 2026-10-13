"""Isolated Chromium interaction test using the payment-account loader from the shipped v313 module."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
s=Path(__file__).resolve().parents[1].joinpath('public/v313-client.js').read_text()
start=s.index('  const ps314Epoch=new WeakMap();')
end=s.index('  window.psReceiptForm313=',start)
loader=s[start:end]
html='''<form id="receipt"><select name="payment_method"><option>Bank</option><option>Cash</option></select><select name="original_currency"><option>KRW</option><option>PKR</option></select><input name="reference"><label data-ps314-account-label></label><select name="payment_account_id"></select><div data-ps314-account-message></div></form>'''
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=browser.new_page()
    page.set_content(html)
    page.evaluate('''() => {window.selectedUnitId=2;window.me={business_unit_id:2};window.t=x=>x;window.api=async url=>{const qs=new URL(url,'https://test.local').searchParams;window.lastAccountQuery=Object.fromEntries(qs);if(qs.get('method')==='Bank'&&qs.get('currency')==='PKR')return {accounts:[{id:22,name:'Pakistan bank',financial_account_type:'Bank',currency:'PKR'},{id:23,name:'Wrong cash',financial_account_type:'Cash',currency:'PKR'}]};if(qs.get('method')==='Cash'&&qs.get('currency')==='PKR')return {accounts:[{id:24,name:'Cash PKR',financial_account_type:'Cash',currency:'PKR'}]};return {accounts:[{id:21,name:'Korea bank',financial_account_type:'Bank',currency:'KRW'}]};};}''')
    page.evaluate('''() => {'''+loader+''' }''')
    page.evaluate('''async()=>await window.ps314RefreshCompanyAccount(document.querySelector('form'))''')
    assert page.locator('select[name=payment_account_id] option').count()==2
    assert page.locator('select[name=payment_account_id]').input_value()==''
    assert page.evaluate('lastAccountQuery.direction')=='receipt'
    page.locator('select[name=original_currency]').select_option('PKR')
    page.evaluate('''async()=>await window.ps314RefreshCompanyAccount(document.querySelector('form'))''')
    assert page.locator('select[name=payment_account_id] option').last.inner_text().startswith('Pakistan bank')
    page.locator('select[name=payment_method]').select_option('Cash')
    page.evaluate('''async()=>await window.ps314RefreshCompanyAccount(document.querySelector('form'))''')
    assert page.locator('select[name=payment_account_id] option').last.inner_text().startswith('Cash PKR')
    assert page.locator('select[name=payment_account_id]').input_value()==''
    assert page.evaluate('lastAccountQuery.method')=='Cash'
    assert page.evaluate('document.querySelector("[name=reference]").required') is False
    page.locator('select[name=payment_account_id]').select_option('24')
    page.locator('select[name=payment_method]').select_option('Bank')
    page.evaluate('''async()=>await window.ps314RefreshCompanyAccount(document.querySelector('form'))''')
    assert page.locator('select[name=payment_account_id]').input_value()==''
    assert page.locator('select[name=payment_account_id] option').last.inner_text().startswith('Pakistan bank')
    assert page.evaluate('document.querySelector("[name=reference]").required') is True
    print('PASS Chromium: receipt direction; KRW/PKR Bank; PKR Cash; no implicit default; method switch clears account; reference rules')
    browser.close()
