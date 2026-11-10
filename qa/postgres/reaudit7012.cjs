'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { chromium } = require('playwright');
const { fixture } = require('./fx_fixture.cjs');

(async () => {
  const f = await fixture();
  const checks = [];
  let browser;
  const pass = message => { checks.push(message); console.log('PASS ' + message); };
  try {
    const call = (method, route, body, key) => f.api(method, route, body, {
      'x-business-unit-id': String(f.excavator), 'x-ceo-confirmed': '1', 'x-ceo-confirmation-note': 'QA controlled reversal', ...(key ? { 'x-idempotency-key': key } : {}),
    });
    const ok = async (...args) => {
      const r = await call(...args);
      assert(r.ok, JSON.stringify(r.j));
      return r.j;
    };
    const proof = (fields, contents = '%PDF-1.4 QA evidence') => {
      const form = new FormData();
      for (const [name, value] of Object.entries(fields)) form.set(name, value);
      form.set('evidence', new Blob([contents], { type: 'application/pdf' }), 'qa.pdf');
      return form;
    };
    const asset = await f.ins('excavator_assets', {
      business_unit_id: f.excavator, asset_no: 'QA-7012', machine_name: 'QA Machine Under Repair',
      purchase_price: 100000, lifecycle_stage: 'In Yard', status: 'Available',
    });
    const root = '/api/excavator/assets/' + asset;
    await f.ins('excavator_payments', { asset_id: asset, payment_type: 'Purchase', amount: 40000, status: 'Paid' });
    await f.ins('excavator_payments', { asset_id: asset, payment_type: 'Sale', amount: 50000, status: 'Paid' });
    await f.ins('excavator_transactions', { asset_id: asset, type: 'Local Sale', stage: 'In Yard', amount: 200000, status: 'Completed' });
    await f.ins('excavator_repairs', { id: 100, asset_id: asset, amount: 7000 });
    await f.ins('excavator_repairs', { id: 1001, asset_id: asset, amount: 9000 });
    await f.ins('excavator_transactions', { asset_id: asset, type: 'Repair', stage: 'In Yard', amount: 9000, status: 'Completed', metadata: '{"repair_id": 1001}' });
    const part = await ok('POST', root + '/parts', proof({ part_name: 'QA seal', quantity: '2', cost: '2000' }));
    const mirror = await f.ins('excavator_transactions', {
      asset_id: asset, type: 'Part Purchase', stage: 'In Yard', amount: 4000, status: 'Completed', metadata: JSON.stringify({ part_id: part.id }),
    });
    const summary = await ok('GET', root + '/summary');
    assert.equal(Number(summary.repair_cost), 16000);
    assert.equal(Number(summary.total_cost), 120000);
    assert.equal((await ok('GET','/api/excavator/assets?paged=1')).rows.find(x => x.id === asset).total_cost, summary.total_cost);
    const dashboard = (await ok('GET', '/api/excavator/overview?include_assets=0')).summary;
    assert.deepEqual([dashboard.inYard,dashboard.partCost,dashboard.totalCost,dashboard.margin,dashboard.payable,dashboard.receivable],
      [1,4000,120000,80000,60000,150000]);
    pass('Operations and Machine Detail retain exact legacy costs and Dashboard reconciles costs, margin, balances and counts');

    const partCost = () => f.db.prepare('SELECT cost FROM excavator_parts WHERE id=?').get(part.id);
    const mirrorCost = () => f.db.prepare('SELECT amount FROM excavator_transactions WHERE id=?').get(mirror);
    const finance = () => f.db.prepare("SELECT amount,status FROM finance_entries WHERE source_type='Excavator Part' AND source_id=?").get(part.id);
    assert.equal((await call('PUT', root + '/parts/' + part.id, { cost: 0 })).status, 409);
    assert.equal((await call('PUT', root + '/parts/' + part.id, { cost: -1 })).status, 400);
    assert.equal((await call('PUT', root + '/parts/' + part.id, { status: 'Voided' })).status, 409);
    assert.deepEqual([Number((await partCost()).cost),Number((await mirrorCost()).amount),Number((await finance()).amount)], [2000,4000,4000]);
    const nonfinancial = await ok('POST', root + '/parts', { part_name: 'Unpriced stock', cost: 0 });
    await ok('PUT', root + '/parts/' + nonfinancial.id, { cost: 0, notes: 'QA metadata' });
    pass('A direct parts edit cannot zero out an active Finance cost, while unpriced parts stay editable');

    const financeRoute = id => '/api/finance/' + id;
    const soldFinance = await f.db.prepare("SELECT id FROM finance_entries WHERE source_type='Excavator Part' AND source_id=?").get(part.id);
    assert.equal((await call('DELETE', financeRoute(soldFinance.id), {reason:'QA sold machine guard'})).status,409);
    const unsold = await f.ins('excavator_assets', {
      business_unit_id:f.excavator,asset_no:'QA-VOID-7012',machine_name:'QA unsold machine',purchase_price:100000,
      lifecycle_stage:'In Yard',status:'Available',
    });
    const unsoldRoot='/api/excavator/assets/'+unsold;
    const unused=await ok('POST',unsoldRoot+'/parts',proof({part_name:'QA unused seal',cost:'5000'}));
    const unusedTx=await f.ins('excavator_transactions',{
      asset_id:unsold,type:'Part Purchase',stage:'In Yard',amount:5000,status:'Completed',metadata:JSON.stringify({part_id:unused.id}),
    });
    const unusedFinance=await f.db.prepare("SELECT id FROM finance_entries WHERE source_type='Excavator Part' AND source_id=?").get(unused.id);
    await ok('DELETE',financeRoute(unusedFinance.id),{reason:'QA controlled parts void'});
    for(const [table,id] of [['excavator_parts',unused.id],['excavator_transactions',unusedTx],['finance_entries',unusedFinance.id]]) {
      assert.equal((await f.db.prepare('SELECT status FROM '+table+' WHERE id=?').get(id)).status,'Voided');
    }
    assert.equal((await ok('GET',unsoldRoot+'/summary')).total_cost,100000);
    assert.equal((await call('PUT',unsoldRoot+'/parts/'+unused.id,{cost:5000})).status,409);
    pass('Controlled Finance void removes an unused part from active costs and blocks a sold-machine reversal');

    const route = root + '/repairs', key = randomUUID();
    const fields = { amount: '12000', description: 'QA retry' };
    const uploadFiles = () => fs.readdirSync(f.env.UPLOAD_DIR).length;
    const baselineFiles = uploadFiles();
    const [first, concurrent] = await Promise.all([
      ok('POST', route, proof(fields), key), ok('POST', route, proof(fields), key),
    ]);
    assert.deepEqual(first, concurrent);
    assert.equal((await call('POST', route, proof({ ...fields, amount: '13000' }), key)).status, 409);
    assert.equal((await call('POST', route, proof(fields, 'different evidence'), key)).status, 409);
    await f.restart();
    assert.equal((await f.db.prepare('SELECT status FROM finance_entries WHERE id=?').get(unusedFinance.id)).status,'Voided');
    assert.deepEqual(await ok('POST', route, proof(fields), key), first);
    assert.equal((await f.db.prepare("SELECT COUNT(*) n FROM finance_entries WHERE source_type='Excavator Repair' AND source_id=?").get(first.id)).n, 1);
    assert.equal((await f.db.prepare("SELECT COUNT(*) n FROM excavator_repairs WHERE asset_id=? AND description='QA retry'").get(asset)).n, 1);
    assert.equal(uploadFiles(), baselineFiles + 1);
    const freightKey = randomUUID(), freight = () => ok('POST', root + '/logistics', proof({ amount: '5000' }), freightKey);
    assert.deepEqual(await freight(), await freight());
    pass('Concurrent, restarted, and freight retries replay one result, reject changed details and clean duplicate evidence');

    for (const suffix of ['', '/lifecycle']) {
      for (const [stage,status] of [['Reserved','Available'],['On Hold','Available'],['In Yard','Reserved']]) {
        assert.equal((await call('PUT', root+suffix, { lifecycle_stage: stage, status })).status, 400);
      }
    }
    assert.equal((await ok('PUT', root+'/lifecycle',{lifecycle_stage:'Reserved'})).status,'Reserved');
    assert.equal((await ok('PUT', root+'/lifecycle',{lifecycle_stage:'In Yard'})).status,'Available');
    await f.db.prepare("UPDATE excavator_assets SET status='On Hold' WHERE id=?").run(asset);
    await ok('PUT',root,{notes:'QA saved an older machine with a stale status'});
    assert.equal((await ok('GET',root+'/summary')).status,'Available');
    pass('Both lifecycle entry points reject conflicting pairs and derive the expected statuses');

    await f.db.prepare("UPDATE users SET preferred_language='ko' WHERE id=1").run();
    browser = await chromium.launch({ executablePath: process.env.BOM_CHROMIUM || chromium.executablePath(), args: ['--no-sandbox','--disable-dev-shm-usage','--single-process','--no-zygote'] });
    const page = await browser.newPage({ viewport: { width:390,height:900 } });
    await page.addInitScript(({ token, route }) => {
      localStorage.setItem('bo_token',token);
      localStorage.setItem('bo_language','ko');
      window.qaCostRequests=[];
      const fetch=window.fetch.bind(window);
      window.fetch=async (input,options)=>{
        const response=await fetch(input,options);
        if(input!==route)return response;
        window.qaCostRequests.push(new Headers(options.headers).get('x-idempotency-key'));
        if(window.qaCostRequests.length===1){
          window.qaFirstCostResponse=await response.clone().json();
          throw new TypeError('Synthetic lost response after commit');
        }
        return response;
      };
    }, {token:f.login.token,route});
    await page.goto(f.base+'/#excavator?unit='+f.excavator);
    await page.waitForFunction(()=>document.documentElement.lang==='ko'&&window.BOMRouter?.diagnostics().phase==='ready');
    await page.getByText('QA Machine Under Repair',{exact:true}).waitFor();
    await page.goto(f.base+'/#excavator/machine/'+asset+'?unit='+f.excavator);
    await page.getByText('QA Machine Under Repair',{exact:true}).waitFor();
    pass('Korean Operations and Machine Detail preserve the saved machine name verbatim');

    const result=await page.evaluate(async ({path,unit}) => {
      // Exercise the request helper through the real HTTP API while isolating the review dialog.
      const originalApi=window.api;
      window.api=async (url,options)=>{
        const response=await fetch(url,{...options,headers:{
          ...options.headers,Authorization:'Bearer '+localStorage.getItem('bo_token'),'X-Business-Unit-ID':String(unit),
        }});
        if(!response.ok)throw new Error(await response.text());
        return response.json();
      };
      try{
        const form=document.createElement('form'),data=new FormData();
        data.set('amount','13000');
        data.set('description','QA browser retry');
        data.set('evidence',new File(['%PDF-1.4 QA browser'],'browser.pdf',{type:'application/pdf'}));
        try{await submitExcavatorCost(form,path,data);}catch(error){
          if(!error.message.includes('Synthetic lost response'))throw error;
        }
        const replay=await submitExcavatorCost(form,path,data);
        const distinct=await submitExcavatorCost(document.createElement('form'),path,data);
        return {replay,distinct};
      }finally{window.api=originalApi;}
    },{path:route,unit:f.excavator});
    const {requests,firstResponse}=await page.evaluate(()=>({requests:window.qaCostRequests,firstResponse:window.qaFirstCostResponse}));
    assert(requests[0]);
    assert.equal(requests.length,3);
    assert.equal(requests[0],requests[1]);
    assert.notEqual(requests[0],requests[2]);
    assert.deepEqual(result.replay,firstResponse);
    assert.notEqual(result.distinct.id,result.replay.id);
    assert.equal((await f.db.prepare("SELECT COUNT(*) n FROM excavator_repairs WHERE asset_id=? AND description='QA browser retry'").get(asset)).n,2);
    pass('The browser reuses a lost-response key and allows a separate save with identical details');

    fs.writeFileSync('qa/evidence/reaudit7012.json', JSON.stringify({ status:'PASS',checks }, null, 2));
  } finally {
    await browser?.close();
    await f.close();
  }
})().catch(error => { console.error(error); process.exitCode=1; });
