const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('public/v3694-pink-qa.js','utf8');
const fn=src.match(/async function companyAccounts\(method,currency\)\{[\s\S]*?\n\}/)?.[0];
assert(fn,'companyAccounts implementation missing');
const requests=[];const accounts=[
 {id:1,financial_account_type:'Bank',currency:'PKR',account_country:'Pakistan'},
 {id:2,financial_account_type:'Bank',currency:'KRW',account_country:'South Korea'},
 {id:3,financial_account_type:'Cash',currency:'PKR',account_country:''}];
const context={URLSearchParams,selectedUnitId:4,me:{business_unit_id:4},text:x=>String(x??'').trim(),api:async url=>{requests.push(new URL(url,'http://local'));const p=requests.at(-1).searchParams;return {accounts:accounts.filter(a=>a.financial_account_type.toLowerCase()===p.get('method').toLowerCase()&&a.currency===p.get('currency'))}}};
vm.createContext(context);vm.runInContext(`function bu(){return Number(selectedUnitId||me?.business_unit_id||0)}\nfunction typeOfAccount(a){return text(a.financial_account_type||a.payment_type||a.method_type||'Bank').toLowerCase()}\n${fn}\nglobalResult=companyAccounts`,context);
(async()=>{
 const load=context.globalResult;
 assert.deepEqual((await load('Bank','PKR')).map(a=>a.id),[1]);
 assert.deepEqual((await load('Bank','KRW')).map(a=>a.id),[2]);
 assert.deepEqual((await load('Cash','PKR')).map(a=>a.id),[3]);
 assert(requests.every(r=>r.searchParams.get('business_unit_id')==='4'&&r.searchParams.get('direction')==='payment'));
 assert(requests.every(r=>!r.searchParams.has('country')),'country hard-coding must not exclude Pakistani bank accounts');
 assert(!src.includes("qs.set('country','South Korea')"));
 assert(src.includes('Unable to load company accounts. Please retry.'));
 console.log('PASS 6 account-loader checks: PKR bank, KRW bank, PKR cash, business-unit scope, no forced country, loading-error differentiation');
})().catch(e=>{console.error(e);process.exit(1)});
