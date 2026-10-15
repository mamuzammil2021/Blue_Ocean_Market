'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const rules=require('../public/bom-payment-rules.js');
const base=path.join(__dirname,'..');
const good=[
 ['advance no fresh cash',!rules.usesNewMoney('advance')],
 ['advance no source',!rules.requiresSource('advance')],
 ['new payment source',rules.requiresSource('new')],
 ['bank payee',rules.requiresCounterparty('Bank','new')],
 ['cash no payee',!rules.requiresCounterparty('Cash','new')],
 ['noncash allocation no payee',!rules.requiresCounterparty('Bank','advance')],
 ['cash match',rules.eligibleSource({financial_account_type:'Cash',currency:'KRW'},'cash','KRW')],
 ['bank mismatch',!rules.eligibleSource({financial_account_type:'Bank',currency:'PKR'},'Cash','PKR')],
 ['currency mismatch',!rules.eligibleSource({financial_account_type:'Bank',currency:'PKR'},'Bank','KRW')],
 ['valid advance',!rules.validateSettlement({mode:'advance',advance:30,availableAdvance:40,outstanding:100})],
 ['over advance',!!rules.validateSettlement({mode:'advance',advance:60,availableAdvance:40,outstanding:100})],
 ['valid both',!rules.validateSettlement({mode:'both',advance:40,newAmount:60,availableAdvance:40,outstanding:100})],
 ['over settlement',!!rules.validateSettlement({mode:'both',advance:40,newAmount:70,availableAdvance:40,outstanding:100})],
 ['zero payment',!!rules.validateSettlement({mode:'new',newAmount:0,outstanding:100})],
 ['loader race guard',fs.readFileSync(path.join(base,'public/v3694-pink-qa.js'),'utf8').includes('paymentLoadEpoch.get(form)!==epoch')],
 ['no forced bank country',!fs.readFileSync(path.join(base,'public/v3694-pink-qa.js'),'utf8').includes("qs.set('country','South Korea')")],
 ['rule loaded first',fs.readFileSync(path.join(base,'public/index.html'),'utf8').indexOf('bom-payment-rules.js')<fs.readFileSync(path.join(base,'public/index.html'),'utf8').indexOf('v3699-pink-payment-stabilization.js')],
 ];
for(const [title,ok] of good){assert.ok(ok,title);console.log('PASS',title)}
console.log(`${good.length} payment contract/source tests passed`);
