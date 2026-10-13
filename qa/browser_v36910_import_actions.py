import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
js=Path('/mnt/data/work36910/Blue_Ocean_Market_V30_69_10/public/v36910-pink-import-actions.js').read_text()
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=await browser.new_page()
  await page.set_content('''<html><body><div id="modalRoot"></div><div id="detail"><div class="ps-actions"><button onclick="psImportPayment(2)">+ Payments</button></div></div></body></html>''')
  await page.evaluate('''() => {window.t=x=>x;window.KO={};window.toast=x=>window.lastToast=x;window.closeModal=(force)=>{window.wasClosed=force;document.getElementById('modalRoot').innerHTML='';};window.ps369SetSettlementMode=mode=>{window.selectedMode=mode};window.psImportPayment=async()=>{document.getElementById('modalRoot').innerHTML='<div id="ps369PaymentChoice"><button data-mode="advance" disabled>Supplier Advance Only</button><button data-mode="new">New Payment Only</button><button data-mode="both" disabled>Advance + New Payment</button></div><form id="ps369SettlementForm"><input name="__available_advance" value="0"></form><div id="ps3699NoAdvance">old</div>';};window.psImportCost=async()=>{document.getElementById('modalRoot').innerHTML='<form onsubmit="psSaveImportCost(event,2)"><button type="button" onclick="psImportDetail(2)">Cancel</button><button>Save</button></form>';};window.psImportDetail=async()=>{};window.workflowSurfaceV324=()=>document.getElementById('detail');window.api=async()=>({outstanding_krw:0});}''')
  await page.add_script_tag(content=js)
  await page.evaluate('psImportPayment(2)')
  buttons=page.locator('#ps369PaymentChoice button')
  assert await buttons.nth(0).is_enabled() and await buttons.nth(2).is_enabled()
  await buttons.nth(0).click()
  assert 'New Payment Only' in await page.locator('#ps36910AdvanceHint').inner_text()
  await buttons.nth(2).click()
  assert 'New Payment Only' in await page.locator('#ps36910AdvanceHint').inner_text()
  assert await page.evaluate('window.selectedMode') is None
  await page.evaluate('psImportCost(2)')
  await page.get_by_text('Cancel',exact=True).click()
  assert await page.evaluate('window.wasClosed') == True
  assert await page.locator('#modalRoot form').count()==0
  await page.evaluate('psImportDetail(2)')
  assert await page.locator('.ps-actions button').count()==0
  await page.evaluate("window.api=async()=>({outstanding_krw:100});document.querySelector('.ps-actions').innerHTML='<button onclick=\"psImportPayment(2)\">+ Payments</button>'")
  await page.evaluate('psImportDetail(2)')
  assert await page.locator('.ps-actions button').count()==1
  print('PASS: zero-advance button A / B, non-allocation, cost cancel, settled button hide, unpaid button retain')
  await browser.close()
asyncio.run(main())
