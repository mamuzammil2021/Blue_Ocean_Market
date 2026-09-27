'use strict';
const assert=require('assert');
let endpoints=[],proposals=[],audits=[];
const financing={id:11,business_unit_id:1,agreement_no:'FIN-1-TEST',status:'Active',payment_account_id:5};
const repayment={id:22,financing_id:11,finance_entry_id:33,principal_krw:2100,interest_krw:380,fee_krw:20};
const finance={id:33,business_unit_id:1,payment_account_id:5,status:'Active',verification_status:'Verified / Correct',cash_effect:-1,accounting_journal_id:44,accounting_status:'Posted',transaction_date:'2026-09-20'};
const original={id:44,status:'Posted'};
const accounts={100:{id:100,account_type:'Expense',active:1},200:{id:200,account_type:'Liability',active:1},201:{id:201,account_type:'Expense',active:1},202:{id:202,account_type:'Expense',active:1}};
let duplicate=false,wrongBank=false;
const db={exec:()=>{},transaction:fn=>fn,prepare:sql=>({get:(...args)=>{
 if(sql.includes('FROM accounting_financing_v356 WHERE id='))return financing;
 if(sql.includes('FROM accounting_financing_repayments_v356 WHERE id='))return repayment;
 if(sql.includes("source_type='Financing Repayment Reclassification'"))return duplicate?{id:77}:null;
 if(sql.includes('FROM finance_entries WHERE id='))return finance;
 if(sql.includes('reversal_of_id='))return null;
 if(sql.includes("finance_entry_id=? AND status='Posted'"))return original;
 if(sql.includes('FROM accounting_payment_accounts WHERE id='))return {ledger_account_id:10};
 if(sql.includes('FROM accounting_accounts WHERE id='))return accounts[args[0]]||null;
 return null;
 },all:()=>{
 if(sql.includes('FROM accounting_journal_lines WHERE journal_entry_id='))return [{account_id:100,debit_krw:2500,credit_krw:0},{account_id:wrongBank?99:10,debit_krw:0,credit_krw:2500}];
 return [];
 },run:()=>({lastInsertRowid:77})})};
const app={get:(url,...f)=>endpoints.push(['GET',url,f.at(-1)]),post:(url,...f)=>endpoints.push(['POST',url,f.at(-1)])};
require('../server/v356-financing').install({app,db,auth:()=>{},allow:()=>()=>{},currentUnit:()=>1,enforceUnit:()=>true,audit:(...args)=>audits.push(args),accounting:{isPeriodClosed:()=>false,postJournal:proposal=>{proposals.push(proposal);return 77}},hasAccess:()=>true});
const handler=endpoints.find(x=>x[0]==='POST'&&x[1].endsWith('/prepare-reclassification'))[2];
function request(){let code=200,data;handler({params:{id:'11',repaymentId:'22'},body:{liability_account_id:200,interest_account_id:201,fee_account_id:202},user:{id:2,role:'Accountant'}},{status:n=>({json:o=>{code=n;data=o}}),json:o=>{data=o}});return {code,data}}
let r=request();assert.equal(r.code,201);assert.equal(r.data.journal_id,77);assert.equal(proposals.length,1);
const p=proposals[0],debits=p.lines.reduce((n,x)=>n+x.debit_krw,0),credits=p.lines.reduce((n,x)=>n+x.credit_krw,0);
assert.equal(debits,2500);assert.equal(credits,2500);assert.equal(p.postingStatus,undefined);assert(!p.lines.some(x=>x.account_id===10));assert.deepEqual(p.lines.map(x=>[x.account_id,x.debit_krw,x.credit_krw]),[[100,0,2500],[200,2100,0],[201,380,0],[202,20,0]]);
duplicate=true;r=request();assert.equal(r.code,409);assert.equal(proposals.length,1);
duplicate=false;wrongBank=true;r=request();assert.equal(r.code,409);assert.equal(proposals.length,1);
console.log('V30.56.2 mock transaction fixture: balanced cash-neutral proposal, correct split, duplicate and bank mismatch rejected (PASS).');
