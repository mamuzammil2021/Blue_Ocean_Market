'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const ui=read('public/v313-client.js'),runtime=read('public/runtime-v30392.js'),server=read('server/v313.js'),index=read('public/index.html');
const cases=[
 ['native receipt account selector',ui.includes('ps314SourceField()}<div class="field"')],
 ['native paid order account selector',ui.includes('ps314SourceField(false)')],
 ['account selector disabled for initially unpaid order',ui.includes("${active?'required':'disabled'}")],
 ['receipt account method/currency load',ui.includes('ps314RefreshCompanyAccount')&&ui.includes("direction:form.dataset.ps314Direction||'receipt'")],
 ['no country restriction for receipt',!ui.includes("country:'South Korea'")],
 ['no implicit account selection',ui.includes('if(accounts.some(a=>String(a.id)===was))select.value=was')],
 ['receipt rejects missing account',server.includes("if(!Number(body.payment_account_id||0))throw new Error('Select a company account")],
 ['server checks receipt account currency',server.includes("company receiving account currency does not match receipt currency")],
 ['receipt direction passed to account validator',server.includes("{requiredForNonCash:true,direction:'receipt'}")],
 ['paid-order validates before insert',server.indexOf('if(paidNow&&total>0){\n      try{')<server.indexOf('let orderId=null;try{')],
 ['runtime bundle includes latest native code',runtime.includes('const ps314Epoch=new WeakMap();')&&runtime.includes('ps314SourceField(false)')],
 ['runtime cache busting',index.includes('/runtime-v30392.js?v=30.69.14')],
 ['legacy Pink loader has no country lock',!read('public/v369-pink-shared-workflows.js').includes("country:'South Korea'")],
 ['Excavator payment handler untouched by changes',!ui.includes('excavatorPayment')],
];
for(const [name,pass] of cases){assert.ok(pass,name);console.log('PASS',name)}
console.log(`${cases.length} V30.69.14 assertions passed`);
