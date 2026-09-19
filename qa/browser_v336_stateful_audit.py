import asyncio, pathlib, re, json, traceback
from playwright.async_api import async_playwright
PUB=(pathlib.Path(__file__).resolve().parents[1]/'public')
html=(PUB/'index.html').read_text(); scripts=re.findall(r'<script src="([^"]+)"[^>]*></script>',html); html=re.sub(r'<script src="[^"]+"[^>]*></script>','',html)
INIT=r'''
(()=>{const m=new Map([['bo_token','T'],['bo_language','en'],['bo_unit','1']]);const ls={getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),key:i=>[...m.keys()][i]||null,get length(){return m.size}};Object.defineProperty(window,'localStorage',{value:ls,configurable:true});window.__seen=[];window.__mock={
'/api/me':{user:{id:1,name:'CEO',email:'ceo@test',role:'CEO / Owner',preferred_language:'en',business_unit_id:null}},
'/api/context':{units:[{id:1,name:'Excavator'},{id:2,name:'Pink Salt'},{id:3,name:'MIMI Resturant'},{id:4,name:'Mango'}],selected_business_unit_id:1},
'/api/access/me':{permissions:{},limits:{},assigned_units:[1,2,3,4]},
'/api/excavator/overview':{summary:{},assets:[]},'/api/notifications':[], '/api/notifications/unread-count':{count:0},'/api/action-counts':{}
};
window.fetch=async function(input,opt={}){const u=typeof input==='string'?input:input.url;const p=u.split('?')[0];window.__seen.push([opt.method||'GET',p]);let b=window.__mock[p];if(typeof b==='function')b=await b(u,opt);if(b===undefined){if(p.includes('notification'))b=[];else if(p.includes('count')||p.includes('action'))b={};else if((opt.method||'GET')!=='GET')b={ok:true,id:999};else b=[];}return new Response(JSON.stringify(b),{status:200,headers:{'Content-Type':'application/json'}})};history.replaceState({},'','#dashboard')})()
'''

async def main():
    results=[]; errors=[]
    def rec(name, ok, detail=''):
        results.append((name, bool(ok), str(detail)))
        print(('PASS' if ok else 'FAIL'), name, ('— '+str(detail) if detail else ''))
    async with async_playwright() as p:
      b=await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
      page=await b.new_page(viewport={'width':1440,'height':1000})
      page.on('pageerror', lambda e: errors.append(str(e)))
      await page.set_content(html,wait_until='domcontentloaded'); await page.evaluate(INIT)
      for s in scripts: await page.add_script_tag(path=str(PUB/s.split('?')[0].lstrip('/')))
      await page.wait_for_timeout(900)
      rec('boot Excavator dashboard renders', await page.locator('#content').count()==1 and 'Excavator' in await page.locator('#content').inner_text())

      # Buy Machine stateful account routing + nested manager
      supplier={'id':10,'name':'Seoul Heavy Equipment','location':'Incheon','phone':'01012341234','available_machine_count':1}
      await page.evaluate("m=>Object.assign(window.__mock,m)", {
        '/api/excavator/suppliers':[supplier],
        '/api/excavator/suppliers/10/machines':{'listed':[{'id':501,'machine_name':'Hyundai R215','machine_type':'Excavator','condition_status':'Used','make':'Hyundai','model':'R215LC-9S','year':2020,'serial_no':'SN501','asking_price':85000000}]},
        '/api/v320/financial-accounts/options':{'accounts':[{'id':101,'name':'Korea Operating Bank','financial_account_type':'Bank','currency':'KRW','account_number_masked':'****1234'}]},
        '/api/v330/payee-accounts':[{'id':201,'label':'Secondary','bank_name':'Woori','currency':'KRW','account_number_masked':'****11','is_default':0},{'id':202,'label':'Main Bank','bank_name':'KB','currency':'KRW','account_number_masked':'****22','is_default':1,'account_holder':'Seoul Heavy Equipment','account_country':'South Korea'}]
      })
      await page.evaluate("excavatorNewMachine()") ; await page.wait_for_timeout(250)
      await page.evaluate("selectBuySupplier('Seoul Heavy Equipment')"); await page.wait_for_timeout(180)
      await page.locator('form[onsubmit*="saveSimpleExcavatorMachine"] [name="purchase_token"]').fill('1000000')
      await page.locator('form[onsubmit*="saveSimpleExcavatorMachine"] [name="purchase_token"]').dispatch_event('input')
      await page.wait_for_timeout(220)
      buy_counts=await page.evaluate("({from:document.querySelectorAll('form[onsubmit*=saveSimpleExcavatorMachine] [name=token_payment_account_id]').length,to:document.querySelectorAll('form[onsubmit*=saveSimpleExcavatorMachine] [name=token_receiver_account_id]').length,fromVal:document.querySelector('form[onsubmit*=saveSimpleExcavatorMachine] [name=token_payment_account_id]')?.value,toVal:document.querySelector('form[onsubmit*=saveSimpleExcavatorMachine] [name=token_receiver_account_id]')?.value,supplier:document.querySelector('#buySupplierId')?.value})")
      rec('Buy Machine has exactly one Pay From and one Paid To',buy_counts['from']==1 and buy_counts['to']==1,buy_counts)
      rec('Buy Machine selects compatible company source account',buy_counts['fromVal']=='101',buy_counts['fromVal'])
      rec('Buy Machine auto-selects supplier default receiver account',buy_counts['toVal']=='202',buy_counts['toVal'])
      # listed machine fills details
      await page.locator('#buySupplierMachine').select_option('501'); await page.wait_for_timeout(50)
      machine_fill=await page.evaluate("({name:document.querySelector('[name=machine_name]').value,make:document.querySelector('[name=make]').value,model:document.querySelector('[name=model]').value,price:document.querySelector('[name=purchase_price]').value})")
      rec('Supplier listed machine fills Buy Machine details',machine_fill=={'name':'Hyundai R215','make':'Hyundai','model':'R215LC-9S','price':'85000000'},machine_fill)
      # manager child modal
      await page.locator('[data-v3382-manage-payee],[data-v332-manage-payee]').click(); await page.wait_for_timeout(100)
      child_open=await page.locator('#modalRoot .modal').count()==1
      parent_still=await page.locator('#v324WorkflowSurface form[onsubmit*="saveSimpleExcavatorMachine"]').count()==1
      rec('Add/Manage receiver account opens child modal without replacing Buy Machine',child_open and parent_still)
      await page.evaluate('v332ClosePayeeAccounts()'); await page.wait_for_timeout(120)
      parent_state=await page.evaluate("({modal:!!document.querySelector('#modalRoot .modal'),form:!!document.querySelector('#v324WorkflowSurface form[onsubmit*=saveSimpleExcavatorMachine]'),supplier:document.querySelector('#buySupplierId')?.value,token:document.querySelector('[name=purchase_token]')?.value})")
      rec('Closing receiver-account modal returns to same Buy Machine state',not parent_state['modal'] and parent_state['form'] and parent_state['supplier']=='10' and parent_state['token']=='1000000',parent_state)

      # Sell Machine payment amount behavior
      await page.evaluate("closeAllModalsV3242?.(true)")
      asset={'id':1,'asset_no':'EX-1','machine_name':'Doosan DX225','type':'Excavator','purchase_price':70000000,'purchase_paid':70000000,'purchase_status':'Paid','lifecycle_stage':'Ready for Sale','selling_price':0}
      buyers=[{'id':7,'name':'Buyer A','country':'Pakistan','buyer_type':'International','unallocated_advance_krw':30000000}]
      await page.evaluate("m=>Object.assign(window.__mock,m)", {'/api/excavator/assets':[asset],'/api/excavator/buyers':buyers})
      await page.evaluate("excavatorSell(1)"); await page.wait_for_timeout(180)
      # choose buyer, manually set available balance (fillExcavatorBuyer may need detail endpoints)
      await page.locator('#exBuyerSelect').select_option('7');
      await page.evaluate("document.getElementById('exBuyerBalance').dataset.balance='30000000'; document.getElementById('exPaymentSource').value='new_payment'; toggleExcavatorPaymentSource('new_payment')")
      await page.locator('[name=selling_price]').fill('100000000'); await page.locator('[name=selling_price]').dispatch_event('input'); await page.wait_for_timeout(80)
      new_amt=await page.locator('[name=payment_amount]').input_value()
      rec('Sell Machine New Payment follows selling price',float(new_amt)==100000000,new_amt)
      await page.evaluate("document.getElementById('exPaymentSource').value='advance_plus_new'; toggleExcavatorPaymentSource('advance_plus_new')"); await page.wait_for_timeout(80)
      adv=page.locator('[name=advance_amount_krw]'); await adv.fill('30000000'); await adv.dispatch_event('input'); await page.wait_for_timeout(80)
      comb_amt=await page.locator('[name=payment_amount]').input_value()
      rec('Buyer Advance + New Payment uses only New Payment Required',abs(float(comb_amt)-70000000)<.01,comb_amt)
      await page.locator('[name=selling_price]').fill('120000000'); await page.locator('[name=selling_price]').dispatch_event('input'); await page.wait_for_timeout(80)
      comb_amt2=await page.locator('[name=payment_amount]').input_value()
      rec('Combined payment recalculates immediately after selling-price change',abs(float(comb_amt2)-90000000)<.01,comb_amt2)

      # Validation should not fire while typing, then should on blur
      await page.evaluate("document.getElementById('toastRoot').innerHTML=''; const f=document.getElementById('excavatorSaleForm'); const x=f.querySelector('[name=customer_name]'); x.value=''; x.dataset.v335Touched='';")
      cust=page.locator('#excavatorSaleForm [name=customer_name]')
      await cust.fill(''); await cust.dispatch_event('input'); await page.wait_for_timeout(60)
      while_typing=await page.evaluate("({bad:document.querySelector('[name=customer_name]').closest('.field').classList.contains('v326-invalid-field')||document.querySelector('[name=customer_name]').closest('.field').classList.contains('v335-field-invalid'),toast:document.getElementById('toastRoot').innerText})")
      rec('Required-field validation stays quiet while user is typing',not while_typing['bad'] and not while_typing['toast'].strip(),while_typing)
      await cust.blur(); await page.wait_for_timeout(60)
      on_blur=await page.evaluate("document.querySelector('[name=customer_name]').closest('.field').classList.contains('v335-field-invalid')||document.querySelector('[name=customer_name]').closest('.field').classList.contains('v326-invalid-field')")
      rec('Required-field validation appears after blur',on_blur)

      # Sold machine purchase edit restriction by role
      await page.evaluate("closeAllModalsV3242?.(true); me.role='Operations Manager'")
      sold=dict(asset); sold.update({'lifecycle_stage':'Sold / Completed','sale_amount':100000000,'sale_paid':100000000,'customer_name':'Buyer A','total_cost':70000000})
      await page.evaluate("m=>Object.assign(window.__mock,m)", {'/api/excavator/assets':[sold],'/api/excavator/assets/1/transactions':[],'/api/excavator/assets/1/documents':[],'/api/excavator/assets/1/history':{'events':[]},'/api/excavator/assets/1/payments':[]})
      await page.evaluate('excavatorOpenMachine(1)'); await page.wait_for_timeout(180)
      edit_state=await page.evaluate("(()=>{const b=[...document.querySelectorAll('#v324WorkflowSurface button')].find(x=>x.textContent.trim()==='Edit'&&String(x.getAttribute('onclick')||'').includes('excavatorEditMachine'));return b?{hidden:b.classList.contains('v335-purchase-edit-hidden'),disabled:b.disabled}:null})()")
      rec('Sold-machine Purchase Edit is hidden/disabled for normal user',edit_state and edit_state['hidden'] and edit_state['disabled'],edit_state)
      await page.evaluate("me.role='CEO / Owner'; closeAllModalsV3242?.(true); excavatorOpenMachine(1)"); await page.wait_for_timeout(180)
      ceo_edit=await page.evaluate("(()=>{const b=[...document.querySelectorAll('#v324WorkflowSurface button')].find(x=>x.textContent.trim()==='Edit'&&String(x.getAttribute('onclick')||'').includes('excavatorEditMachine'));return b?{hidden:b.classList.contains('v335-purchase-edit-hidden'),disabled:b.disabled}:null})()")
      rec('CEO/Owner retains controlled sold-machine Purchase Edit access',ceo_edit and not ceo_edit['hidden'] and not ceo_edit['disabled'],ceo_edit)

      # Posted/verified machine cost lock
      locked_html=await page.evaluate("excavatorCostRowV319({id:88,type:'Repair',amount:1000000,status:'Active',transaction_date:'2026-09-01',finance_verification_status:'Verified / Correct',finance_accounting_status:'Posted',accounting_journal_id:55},1)")
      rec('Finance-verified/posted machine cost row uses disabled lock Edit','v3382-locked-edit' in locked_html and 'disabled' in locked_html and 'v335-cost-locked' not in locked_html, locked_html[:240])
      await page.evaluate("m=>window.__mock['/api/excavator/assets/1/transactions']=m", [{'id':88,'finance_verification_status':'Verified / Correct','finance_accounting_status':'Posted','accounting_journal_id':55,'status':'Active'}])
      await page.evaluate("document.getElementById('toastRoot').innerHTML=''; excavatorAddCost(1,88)"); await page.wait_for_timeout(80)
      lock_toast=await page.locator('#toastRoot').inner_text()
      rec('Direct open of locked machine cost is blocked', 'locked' in lock_toast.lower() and 'correction' in lock_toast.lower(), lock_toast)

      # Shared pagination + filter reset: Finance
      await page.evaluate(r'''(()=>{document.getElementById('content').innerHTML=`<div id="financeRecordsPanel"><div class="finance-filterbar"><input id="financeSearch"><select id="financeStatusFilter"><option value=""></option></select><select id="financeTypeFilter"><option value=""></option></select><select id="financeEvidenceFilter"><option value=""></option></select></div><div class="table-wrap"><table class="table"><tbody id="financeTableBody"></tbody></table></div></div>`;const b=document.getElementById('financeTableBody');for(let i=1;i<=60;i++){const tr=document.createElement('tr');tr.dataset.financeId=String(i);tr.dataset.text='row '+i;tr.dataset.status='Pending Verification';tr.dataset.type='Payment';tr.dataset.evidence='yes';tr.dataset.request='no';tr.innerHTML=`<td>${i<=30?'2026-08':'2026-09'}-${String((i%28)+1).padStart(2,'0')}</td><td>row ${i}</td>`;b.appendChild(tr)};const bar=document.querySelector('.finance-filterbar');bar.insertAdjacentHTML('beforeend','<div class="v335-date-range"><input id="v335FinanceFrom" type="date"><input id="v335FinanceTo" type="date"></div>');window.__BOM_V335.applySharedPagination335(document);})()''')
      await page.locator('.v335-pagination [data-next]').click();
      before=await page.locator('.v335-pagination .v335-pages').inner_text()
      await page.locator('#v335FinanceFrom').fill('2026-09-01'); await page.evaluate('financeApplyFilters()'); await page.wait_for_timeout(40)
      after=await page.locator('.v335-pagination .v335-pages').inner_text(); rng=await page.locator('.v335-pagination .v335-range').inner_text()
      rec('Finance filter resets pagination to page 1',before.startswith('2 /') and after.startswith('1 /'),f'{before} -> {after}; {rng}')
      # verify only Sep rows visible/not page-hidden among eligible
      visible_dates=await page.evaluate("[...document.querySelectorAll('#financeTableBody tr')].filter(x=>getComputedStyle(x).display!=='none').map(x=>x.cells[0].textContent)")
      rec('Finance date range composes before pagination',all(x.startswith('2026-09') for x in visible_dates),visible_dates[:3])

      # Machine card pagination reset after search
      await page.evaluate(r'''(()=>{document.getElementById('content').innerHTML=`<input id="excavatorMachineSearch"><select id="excavatorMachineFilter"><option>All</option></select><select id="excavatorMachineSort"><option value="newest">Newest</option></select><div id="excavatorMachineList"></div>`;const l=document.getElementById('excavatorMachineList');for(let i=1;i<=60;i++){const d=document.createElement('div');d.className='machine-card';d.dataset.exSearch=i<=30?'alpha':'beta';d.dataset.stage='Purchased';d.dataset.pnl='Not Sold';d.dataset.archived='0';d.dataset.created=String(i);d.dataset.name='m'+i;d.dataset.purchase='1';d.dataset.cost='1';d.dataset.profit='0';d.textContent='Machine '+i;l.appendChild(d)}window.__BOM_V335.applySharedPagination335(document);})()''')
      await page.locator('.v335-pagination [data-next]').click(); before=await page.locator('.v335-pagination .v335-pages').inner_text()
      await page.locator('#excavatorMachineSearch').fill('beta'); await page.evaluate('applyExcavatorMachineFilters()'); await page.wait_for_timeout(40); after=await page.locator('.v335-pagination .v335-pages').inner_text()
      rec('Machine search resets pagination to page 1',before.startswith('2 /') and after.startswith('1 /'),f'{before} -> {after}')

      # Posting Control filtering/pagination using manual DOM + observer
      await page.evaluate(r'''(()=>{window.__v318AccountingPostingMode=true;document.getElementById('content').innerHTML=`<div class="v318-posting-head"><input id="v318PostingSearch" class="search"></div><div class="table-wrap"><table class="table"><tbody id="v318PostingBody"></tbody></table></div>`;const b=document.getElementById('v318PostingBody');for(let i=1;i<=60;i++){const tr=document.createElement('tr');tr.dataset.v318Text=i<=30?'alpha':'beta';tr.innerHTML=`<td>${i<=30?'2026-08':'2026-09'}-${String((i%28)+1).padStart(2,'0')}</td><td>${i<=30?'alpha':'beta'} ${i}</td>`;b.appendChild(tr)}})()'''); await page.wait_for_timeout(150)
      post_pagers=await page.locator('.v335-pagination').count(); post_dates=await page.locator('#v335PostingFrom').count()
      rec('Posting Control receives compact date-range + pagination controls',post_pagers==1 and post_dates==1,f'pagers={post_pagers}, date={post_dates}')
      if post_pagers:
        await page.locator('.v335-pagination [data-next]').click(); bpage=await page.locator('.v335-pagination .v335-pages').inner_text(); await page.locator('#v318PostingSearch').fill('beta'); await page.evaluate('postingFilterV318()'); await page.wait_for_timeout(30); apage=await page.locator('.v335-pagination .v335-pages').inner_text(); rec('Posting Control search resets pagination to page 1',bpage.startswith('2 /') and apage.startswith('1 /'),f'{bpage} -> {apage}')

      # Pink Salt zero-stock Archive/Delete policy
      await page.evaluate("selectedUnitId='2'; me.role='CEO / Owner'; view='psFinished'; window.__mock['/api/pink-salt/products']=[{id:1,sku:'STOCK',name:'Stocked',active:1,salt_grade:'Mesh',packaging_style:'Pouch',pack_weight_g:500,on_hand_units:5,reserved_units:0,available_units:5,reorder_level_units:0,unit_cost_krw:1000,selling_price_krw:2000,bom:[]},{id:2,sku:'ZERO',name:'Zero',active:1,salt_grade:'Mesh',packaging_style:'Pouch',pack_weight_g:500,on_hand_units:0,reserved_units:0,available_units:0,reorder_level_units:0,unit_cost_krw:1000,selling_price_krw:2000,bom:[]}]; loadView()")
      await page.wait_for_timeout(180)
      fg=await page.evaluate("(()=>{const rows=[...document.querySelectorAll('#content table tr')].slice(1);return rows.map(r=>({sku:r.cells[0]?.innerText.trim(),archive:[...r.querySelectorAll('button')].find(b=>b.textContent.trim()==='Archive')?.disabled,del:[...r.querySelectorAll('button')].find(b=>b.textContent.trim()==='Delete')?.disabled}))})()")
      stocked=next((x for x in fg if x['sku']=='STOCK'),None); zero=next((x for x in fg if x['sku']=='ZERO'),None)
      rec('Finished Goods blocks Archive/Delete while stock exists',stocked and stocked['archive'] and stocked['del'],stocked)
      rec('Finished Goods enables Archive/Delete at zero stock',zero and not zero['archive'] and not zero['del'],zero)

      # Confirmation dialog resolves correctly
      await page.evaluate("window.__cp=confirmAction({title:'Audit Confirm',message:'Confirm action?',confirmLabel:'Confirm'}); true")
      await page.wait_for_timeout(30); croot=await page.locator('#confirmRoot .confirm-dialog').count(); rec('Review & Confirm dialog opens',croot==1)
      if croot:
        await page.locator('#confirmRoot .btn.primary').click(); val=await page.evaluate('window.__cp'); rec('Review & Confirm action resolves true',val is True,val)

      # Responsive chrome basic stability
      await page.set_viewport_size({'width':390,'height':844}); await page.evaluate("selectedUnitId='1'; view='dashboard'; window.__mock['/api/excavator/overview']={summary:{},assets:[]}; loadView()") ; await page.wait_for_timeout(100)
      overflow=await page.evaluate("document.documentElement.scrollWidth-window.innerWidth")
      rec('Mobile app chrome avoids body-level horizontal overflow',overflow<=2,overflow)
      await page.set_viewport_size({'width':900,'height':900}); await page.wait_for_timeout(30)
      overflow2=await page.evaluate("document.documentElement.scrollWidth-window.innerWidth")
      rec('Tablet app chrome avoids body-level horizontal overflow',overflow2<=2,overflow2)

      rec('Stateful browser pass has no uncaught page errors',len(errors)==0, errors[:5])
      await b.close()
    failed=[r for r in results if not r[1]]
    print('\nSUMMARY',len(results),'checks',len(failed),'failed')
    if failed:
      for x in failed: print('FAILED:',x)
      raise SystemExit(1)

if __name__=='__main__': asyncio.run(main())
