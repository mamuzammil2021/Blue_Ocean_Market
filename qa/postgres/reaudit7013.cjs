'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { chromium } = require('playwright');
const { fixture } = require('./fx_fixture.cjs');

(async () => {
  const f = await fixture();
  let browser;
  const checks = [];
  const pass = message => { checks.push(message); console.log('PASS ' + message); };
  try {
    const ex = f.excavator, ps = f.pink;
    const call = (method,url,data,unit=ex) => f.api(method,url,data, {
      'x-business-unit-id':String(unit),'x-ceo-confirmed':'1','x-ceo-confirmation-note':'Synthetic audit',
    });
    const ok = async (...args) => {
      const result = await call(...args);
      assert(result.ok,JSON.stringify({url:args[1],status:result.status,body:result.j}));
      return result.j;
    };
    function evidence(data,key) {
      const form = new FormData();
      for (const [name,value] of Object.entries(data)) form.set(name,String(value));
      form.set(key,new Blob(['%PDF-1.4 Synthetic audit evidence'],{type:'application/pdf'}),'qa.pdf');
      return form;
    }
    const date='2026-11-10';
    const asset=await f.ins('excavator_assets',{
      business_unit_id:ex,asset_no:'QA-7013',machine_name:'QA unpaid excavator',
      purchase_price:100000,status:'Available',lifecycle_stage:'Purchased',
    });
    const root='/api/excavator/assets/'+asset, transactions=root+'/transactions';
    const ledger=(await f.db.prepare("SELECT id FROM accounting_accounts WHERE system_key='CASH_ON_HAND'").get()).id;
    const cash=await f.ins('accounting_payment_accounts',{
      business_unit_id:ex,name:'QA cash',account_country:'South Korea',currency:'KRW',
      payment_type:'Cash',financial_account_type:'Cash',ledger_account_id:ledger,active:1,status:'Active',
    });
    const financeFields={payment_amount:9000,payment_method:'Cash',payment_account_id:cash};
    const baselineFiles=fs.readdirSync(f.env.UPLOAD_DIR).length;
    for (const type of ['Purchase','Local Sale','Export Sale','Purchase Payment','Sale Payment']) {
      const result=await call('POST',transactions,evidence({type,...financeFields},'files'));
      assert.equal(result.status,409,JSON.stringify(result.j));
    }
    const summary=await ok('GET',root+'/summary');
    assert.equal(summary.purchase_outstanding,100000);
    assert.equal(summary.sale_amount,0);
    assert.equal((await ok('GET',transactions)).length,0);
    assert.equal(fs.readdirSync(f.env.UPLOAD_DIR).length,baselineFiles);
    const dedicated='/api/v326/excavator/assets/'+asset+'/complete-sale';
    assert.equal((await call('POST',dedicated,{})).status,400);
    pass('Generic purchase, sale, and payment writes are rejected and an unpaid machine stays unsold');

    const repair=await ok('POST',root+'/repairs',evidence({amount:7000,description:'QA original repair'},'evidence'));
    const original=(await ok('GET',transactions)).find(row=>row.type==='Repair');
    const filesAfterRepair=fs.readdirSync(f.env.UPLOAD_DIR).length;
    for (const [type,key] of [['Repair','repair_id'],['Logistics','logistics_id'],['Part Purchase','part_id']]) {
      const result=await call('POST',transactions,evidence({type,...financeFields,metadata:JSON.stringify({[key]:repair.id})},'files'));
      assert.equal(result.status,400,JSON.stringify(result.j));
    }
    assert.equal((await call('PUT',transactions+'/'+original.id,evidence({...financeFields,metadata:JSON.stringify({repair_id:999})},'files'))).status,400);
    assert.equal((await call('PUT',transactions+'/'+original.id,{type:'Local Sale'})).status,409);
    assert.equal(fs.readdirSync(f.env.UPLOAD_DIR).length,filesAfterRepair);
    assert.equal((await ok('GET',transactions)).length,1);
    assert.equal((await f.db.prepare("SELECT COUNT(*) n FROM finance_entries WHERE business_unit_id=? AND status!='Voided'").get(ex)).n,1);
    await ok('PUT',transactions+'/'+original.id,{...financeFields,notes:'QA permitted correction'});
    const source=await f.db.prepare("SELECT source_type,source_id,amount FROM finance_entries WHERE business_unit_id=? AND status!='Voided'").all(ex);
    assert.deepEqual(source,[{source_type:'Excavator Repair',source_id:repair.id,amount:9000}]);
    pass('Forged repair, freight, and parts source links are rejected while a valid correction keeps the original Finance identity');

    const part=await ok('POST',root+'/parts',evidence({part_name:'QA purchased part',cost:6000,quantity:1},'evidence'));
    const partRoute=root+'/parts/'+part.id;
    for (const body of [{status:'Sold'},{status:'Exported'},{status:'Voided'},{sold_export:1},{sale_price:7000},{sale_date:date}]) {
      assert.equal((await call('PUT',partRoute,body)).status,409);
    }
    assert.equal((await call('POST',root+'/parts',{part_name:'QA fake disposed part',status:'Sold'})).status,409);
    await ok('PUT',partRoute,{notes:'QA descriptive edit'});
    assert.equal((await ok('GET',root+'/summary')).parts_cost,6000);
    assert.deepEqual(await f.db.prepare("SELECT amount,status FROM finance_entries WHERE source_type='Excavator Part' AND source_id=?").get(part.id),{amount:6000,status:'Recorded'});
    pass('Generic parts writes cannot change financial disposition and descriptive updates preserve cost');

    await f.ins('excavator_payments',{asset_id:asset,payment_type:'Purchase',amount:100000,status:'Paid'});
    const buyer=await f.ins('excavator_buyers',{business_unit_id:ex,name:'QA local buyer',country:'South Korea',buyer_type:'Local'});
    const sale=await ok('POST',dedicated,evidence({
      buyer_id:buyer,sale_type:'Local Sale',sale_date:date,customer_name:'QA local buyer',selling_price:150000,shipping_reference:'QA-7013-SHIP',
      payment_source:'new_payment',payment_method:'Cash',payment_currency:'KRW',payment_fx_rate:1,
      payment_date:date,payment_amount:150000,payment_account_id:cash,
    },'payment_evidence'));
    assert.equal((await ok('GET',root+'/summary')).sale_amount,150000);
    assert.equal((await call('PUT',transactions+'/'+sale.transaction_id,{notes:'QA generic sale edit'})).status,409);
    assert.equal((await call('DELETE',transactions+'/'+sale.transaction_id,{reason:'QA generic sale removal'})).status,409);
    pass('A paid machine sells through the dedicated workflow and generic edit or delete cannot alter its sale');

    await f.db.prepare('UPDATE pink_salt_suppliers SET supplier_categories_json=? WHERE id=?')
      .run('["Packaging Material Supplier","Import / Raw Salt Supplier"]',f.supplier);
    await f.db.prepare("UPDATE users SET preferred_language='en' WHERE id=1").run();
    const loc=(await f.db.prepare('SELECT id FROM pink_salt_storage_locations WHERE business_unit_id=?').get(ps)).id;
    const pack='/api/pink-salt/packaging-v36', receipt='/api/pink-salt/receiving-v44';
    const material=await ok('POST',pack+'/materials',{sku:'QA-7013',name:'QA carton',unit:'pcs',idempotency_key:randomUUID()},ps);
    async function receive(physical,rejected,missingAction) {
      const purchase=await ok('POST',pack+'/purchases',{
        supplier_id:f.supplier,purchase_date:date,currency:'KRW',confirm_purchase:true,
        lines:[{material_id:material.id,quantity:5,purchase_unit:'pcs',unit_price:100}],costs:[],idempotency_key:randomUUID(),
      },ps);
      const ctx=await ok('GET',receipt+'/packaging/'+purchase.id+'/context',undefined,ps);
      const result=await ok('POST',receipt+'/simple/packaging/'+purchase.id+'/receipts',{
        version:ctx.version,receipt_date:date,location_id:loc,physical_checked:true,evidence:[],
        lines:[{line_id:ctx.lines[0].id,physical,quarantine:0,rejected,missing_action:missingAction}],idempotency_key:randomUUID(),
      },ps);
      return {id:purchase.id,receiptId:result.receipt_id};
    }
    const held=await receive(2,0,'investigate'),damaged=await receive(4,1,'later');
    browser=await chromium.launch({executablePath:process.env.BOM_CHROMIUM,args:['--no-sandbox','--single-process','--no-zygote','--disable-dev-shm-usage']});
    const page=await browser.newPage({viewport:{width:390,height:900}});
    await page.addInitScript(token=>{if(location.protocol==='http:'){localStorage.setItem('bo_token',token);localStorage.setItem('bo_language','en');}},f.login.token);
    async function show(record) {
      await page.goto(f.base+'/#psPackaging/purchase/'+record.id+'?unit='+ps);
      await page.locator('[data-pack-purchase]').waitFor();
      await page.evaluate(({id,receiptId})=>BOMOct28.received(id,receiptId),record);
      return page.locator('[data-pack-receipt-feedback]').innerText();
    }
    assert.match(await show(held),/Ordered 5.*Physically received 2.*Accepted 2.*Held for investigation 3.*Open to receive 0 pcs/);
    const row=page.locator('.receiving44 tbody tr');
    assert.deepEqual((await row.locator('td').allTextContents()).slice(-2),['3','0']);
    assert.match(await show(damaged),/Physically received 4.*Accepted 3.*Rejected 1.*Held for investigation 0.*Open to receive 1 pcs/);
    await page.evaluate(()=>setLanguage('ko'));
    await page.setViewportSize({width:820,height:900});
    assert.match(await show(held),/조사 보류 3.*입고 가능 잔량 0/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);
    pass('Packaging confirmation and Receiving table distinguish physical, accepted, rejected, held and open quantities in English and Korean');
    fs.writeFileSync('qa/evidence/reaudit7013.json',JSON.stringify({status:'PASS',checks},null,2));
  } finally {
    await browser?.close();
    await f.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
