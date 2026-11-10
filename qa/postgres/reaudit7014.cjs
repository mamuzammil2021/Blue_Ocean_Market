'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const {randomUUID}=require('node:crypto');
const {chromium}=require('playwright');
const {fixture}=require('./fx_fixture.cjs');

(async()=>{
 const f=await fixture();
 let browser;
 const checks=[];
 const pass=message=>{checks.push(message);console.log('PASS '+message);};
 try{
  const ex=f.excavator,ps=f.pink,date='2026-11-10';
  const call=(method,url,data,unit=ex)=>f.api(method,url,data,{
   'x-business-unit-id':String(unit),'x-ceo-confirmed':'1','x-ceo-confirmation-note':'Synthetic audit',
  });
  const ok=async(...args)=>{
   const r=await call(...args);
   assert(r.ok,JSON.stringify({url:args[1],status:r.status,body:r.j}));
   return r.j;
  };
  const evidence=(data,key)=>{
   const form=new FormData();
   for(const [name,value] of Object.entries(data))form.set(name,String(value));
   form.set(key,new Blob(['%PDF-1.4 QA synthetic evidence'],{type:'application/pdf'}),'qa.pdf');
   return form;
  };
  const machine=async name=>f.ins('excavator_assets',{
   business_unit_id:ex,asset_no:name,machine_name:name,purchase_price:100000,status:'Available',lifecycle_stage:'Purchased',
  });
  const ledger=(await f.db.prepare("SELECT id FROM accounting_accounts WHERE system_key='CASH_ON_HAND'").get()).id;
  const cash=await f.ins('accounting_payment_accounts',{
   business_unit_id:ex,name:'QA cash',account_country:'South Korea',currency:'KRW',
   payment_type:'Cash',financial_account_type:'Cash',ledger_account_id:ledger,active:1,status:'Active',
  });
  const requestCorrection=id=>ok('PUT','/api/finance/'+id+'/verify',{
   verification_status:'Correction Required',verification_note:'QA verify the source correction',
  });
  const a=await machine('QA-7014-ARCHIVE'),p='/api/excavator/assets/'+a;
  const archivedCost=await ok('POST',p+'/repairs',evidence({amount:1000,description:'QA retained archive cost'},'evidence'));
  await ok('PUT',p+'/lifecycle',{lifecycle_stage:'Cancelled'});
  await ok('POST','/api/v326/excavator/assets/'+a+'/archive',{reason:'QA archive'});
  const postBodies={
   repairs:evidence({amount:4500,description:'QA archived repair'},'evidence'),
   logistics:evidence({amount:4500,provider:'QA archived transport'},'evidence'),
   parts:evidence({cost:4500,part_name:'QA archived part'},'evidence'),
   transactions:evidence({type:'Other Cost',payment_amount:4500,payment_method:'Cash',payment_account_id:cash},'files'),
  };
  const fileCount=fs.readdirSync(f.env.UPLOAD_DIR).length;
  for(const [route,body] of Object.entries(postBodies)){
   const r=await call('POST',p+'/'+route,body);
   assert.equal(r.status,409);
   assert.equal(r.j.code,'EXCAVATOR_ARCHIVED');
  }
  assert.equal((await call('PUT',p+'/transactions/'+archivedCost.transaction_id,{notes:'QA blocked edit'})).status,409);
  assert.equal((await call('DELETE',p+'/transactions/'+archivedCost.transaction_id,{reason:'QA blocked void'})).status,409);
  assert.equal(fs.readdirSync(f.env.UPLOAD_DIR).length,fileCount);
  assert.equal((await ok('GET',p+'/summary')).total_cost,101000);
  assert.equal((await ok('GET',p+'/transactions')).length,1);
  assert.equal((await f.db.prepare('SELECT COUNT(*) n FROM finance_entries WHERE business_unit_id=?').get(ex)).n,1);
  pass('Archived machines retain readable cost history and reject all new cost writes and generic changes');

  const b=await machine('QA-7014-PART-USE'),p2='/api/excavator/assets/'+b;
  const part=await ok('POST',p2+'/parts',evidence({part_name:'QA fitted seal',purchase_date:date,cost:6000,quantity:1,used_for_repair:1},'evidence'));
  const partFinance=await f.db.prepare("SELECT id FROM finance_entries WHERE business_unit_id=? AND source_type='Excavator Part' AND source_id=?").get(ex,part.id);
  const partFinancePath='/api/finance/'+partFinance.id;
  await f.db.prepare("UPDATE finance_entries SET payment_account_id=?,payment_method='Cash' WHERE id=?").run(cash,partFinance.id);
  assert.equal((await call('DELETE',partFinancePath,{reason:'QA fitted part void'})).status,409);
  assert.equal((await call('PUT',p2+'/parts/'+part.id,{used_for_repair:false})).status,409);
  await ok('PUT',p2+'/parts/'+part.id,{notes:'QA ordinary description'});
  assert.equal((await f.db.prepare('SELECT used_for_repair FROM excavator_parts WHERE id=?').get(part.id)).used_for_repair,1);
  assert.equal((await call('DELETE',partFinancePath,{reason:'QA still fitted'})).status,409);
  await requestCorrection(partFinance.id);
  assert.equal((await call('PUT',partFinancePath,{used_for_repair:'0'})).status,400);
  await ok('PUT',partFinancePath,{used_for_repair:'0',payment_account_id:cash,response_note:'QA evidence confirmed that fitted status was recorded in error'});
  assert.equal((await f.db.prepare('SELECT used_for_repair FROM excavator_parts WHERE id=?').get(part.id)).used_for_repair,0);
  assert.equal((await f.db.prepare('SELECT amount FROM finance_entries WHERE id=?').get(partFinance.id)).amount,6000);
  pass('Generic edits preserve recorded usage and clearing it requires an assigned Finance correction with a reason');

  const c=await machine('QA-7014-LEGACY-REPAIR'),p3='/api/excavator/assets/'+c;
  const repair=await ok('POST',p3+'/repairs',evidence({amount:7000,description:'QA historic repair'},'evidence'));
  const mirror=(await ok('GET',p3+'/transactions'))[0];
  const legacy=(await f.db.prepare("SELECT id FROM finance_entries WHERE business_unit_id=? AND source_type='Excavator Repair' AND source_id=?").get(ex,repair.id)).id;
  await f.db.prepare("UPDATE finance_entries SET source_type='Excavator Cost Transaction',source_id=?,payment_account_id=?,payment_method='Cash' WHERE id=?").run(mirror.id,cash,legacy);
  await requestCorrection(legacy);
  const correction={response_note:'QA adjust historical cost',payment_amount:9000,payment_method:'Cash',payment_account_id:cash,transaction_date:date};
  await ok('PUT','/api/finance/'+legacy,correction);
  for(const [table,id] of [['excavator_repairs',repair.id],['excavator_transactions',mirror.id],['finance_entries',legacy]]){
   assert.equal((await f.db.prepare('SELECT amount FROM '+table+' WHERE id=?').get(id)).amount,9000);
  }
  assert.equal((await f.db.prepare("SELECT COUNT(*) n FROM finance_entries WHERE business_unit_id=? AND source_type='Excavator Repair' AND source_id=?").get(ex,repair.id)).n,0);
  await f.ins('finance_entries',{business_unit_id:ex,type:'Expense',category:'Repair / Maintenance',amount:9000,source_type:'Excavator Repair',source_id:repair.id,created_by:1,status:'Recorded'});
  const ambiguous=await call('PUT','/api/finance/'+legacy,{...correction,payment_amount:10000});
  assert.equal(ambiguous.status,409);
  assert.match(ambiguous.j.error,/System Integrity/);
  assert.equal((await f.db.prepare('SELECT amount FROM excavator_repairs WHERE id=?').get(repair.id)).amount,9000);
  await f.db.prepare('UPDATE excavator_transactions SET metadata=? WHERE id=?').run(JSON.stringify({repair_id:999999}),mirror.id);
  const missing=await call('PUT','/api/finance/'+legacy,correction);
  assert.equal(missing.status,409);
  assert.match(missing.j.error,/System Integrity/);
  pass('Historical Finance correction updates original repair and mirror in place and refuses missing or conflicting sources');

  await f.db.prepare('UPDATE pink_salt_suppliers SET supplier_categories_json=? WHERE id=?').run('["Packaging Material Supplier","Import / Raw Salt Supplier"]',f.supplier);
  await f.db.prepare("UPDATE users SET preferred_language='en' WHERE id=1").run();
  const loc=(await f.db.prepare('SELECT id FROM pink_salt_storage_locations WHERE business_unit_id=?').get(ps)).id;
  const pack='/api/pink-salt/packaging-v36',rec='/api/pink-salt/receiving-v44';
  const material=await ok('POST',pack+'/materials',{sku:'QA-7014',name:'QA carton',unit:'pcs',idempotency_key:randomUUID()},ps);
  async function full(rejected,quarantine){
   const purchase=await ok('POST',pack+'/purchases',{
    supplier_id:f.supplier,purchase_date:date,currency:'KRW',confirm_purchase:true,
    lines:[{material_id:material.id,quantity:5,purchase_unit:'pcs',unit_price:100}],costs:[],idempotency_key:randomUUID(),
   },ps);
   const ctx=await ok('GET',rec+'/packaging/'+purchase.id+'/context',undefined,ps);
   const saved=await ok('POST',rec+'/simple/packaging/'+purchase.id+'/receipts',{
    version:ctx.version,receipt_date:date,location_id:loc,physical_checked:true,evidence:[],
    lines:[{line_id:ctx.lines[0].id,physical:5,quarantine,rejected}],idempotency_key:randomUUID(),
   },ps);
   return {id:purchase.id,receiptId:saved.receipt_id,issueId:saved.issue_id};
  }
  const damaged=await full(2,0),quarantined=await full(0,2),clean=await full(0,0);
  browser=await chromium.launch({executablePath:process.env.BOM_CHROMIUM,args:['--no-sandbox','--single-process','--no-zygote','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:390,height:900}});
  await page.addInitScript(token=>{if(location.protocol==='http:'){localStorage.setItem('bo_token',token);localStorage.setItem('bo_language','en');}},f.login.token);
  await page.goto(f.base+'/#excavator/machine/'+a+'?unit='+ex);
  await page.getByText('Restore the archived machine before changing its costs.',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:/Add Cost/}).count(),0);
  async function show(record){
   await page.goto(f.base+'/#psPackaging/purchase/'+record.id+'?unit='+ps);
   await page.locator('[data-pack-purchase]').waitFor();
   await page.evaluate(({id,receiptId,issueId})=>BOMOct28.received(id,receiptId,issueId),record);
  }
  await show(damaged);
  const feedback=page.locator('[data-pack-receipt-feedback]');
  assert.match(await feedback.innerText(),/Physically received 5.*Accepted 3.*Rejected 2.*Open to receive 0 pcs/);
  assert.match(page.url(),/section=receiving/);
  const issueLink=feedback.getByRole('link',{name:/Open receiving issue/});
  assert.match(await issueLink.getAttribute('href'),new RegExp('/issue/'+damaged.issueId+'[?]'));
  await issueLink.click();
  await page.waitForFunction(id=>BOMRouter.parse().kind==='issue'&&Number(BOMRouter.parse().id)===id,damaged.issueId);
  await page.evaluate(()=>setLanguage('ko'));
  await show(quarantined);
  assert.match(await feedback.innerText(),/실물 입고 5.*합격 입고 3.*격리 2/);
  await show(clean);
  assert.match(page.url(),/#psPackaging\/purchases\?/);
  pass('Full damaged or quarantined receipts retain quantities and a working issue link while a clean receipt returns to Purchases');
  fs.writeFileSync('qa/evidence/reaudit7014.json',JSON.stringify({status:'PASS',checks},null,2));
 }finally{
  await browser?.close();
  await f.close();
 }
})().catch(error=>{console.error(error);process.exitCode=1});
