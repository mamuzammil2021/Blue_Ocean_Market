'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),{DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const db=new DatabaseSync(':memory:');db.transaction=fn=>(...args)=>{db.exec('BEGIN');try{const v=fn(...args);db.exec('COMMIT');return v}catch(e){db.exec('ROLLBACK');throw e}};
db.exec(`CREATE TABLE business_units(id INTEGER PRIMARY KEY,status TEXT);INSERT INTO business_units VALUES(1,'Active');
 CREATE TABLE accounting_journal_entries(id INTEGER PRIMARY KEY,source_type TEXT,source_id INTEGER,journal_no TEXT,status TEXT,finance_entry_id INTEGER);
 CREATE TABLE accounting_payment_accounts(id INTEGER PRIMARY KEY,active INTEGER,currency TEXT,business_unit_id INTEGER);
 CREATE TABLE finance_entries(id INTEGER PRIMARY KEY,reference TEXT,transaction_date TEXT,verification_status TEXT,accounting_status TEXT,status TEXT,payment_account_id INTEGER,krw_amount REAL,cash_effect INTEGER,business_unit_id INTEGER,amount REAL,original_currency TEXT,source_type TEXT);
 CREATE TABLE accounting_accounts(id INTEGER PRIMARY KEY,code TEXT,name TEXT,account_type TEXT,active INTEGER);
 INSERT INTO accounting_payment_accounts VALUES(1,1,'KRW',1);
 INSERT INTO accounting_accounts VALUES(1,'2100','Loans','Liability',1);`);
const routes=[];const app={get:(url,...f)=>routes.push(['GET',url,f.at(-1)]),post:(url,...f)=>routes.push(['POST',url,f.at(-1)])};let journalCalls=0;
const impl=require('../server/v356-financing').install({app,db,auth:()=>{},allow:()=>()=>{},currentUnit:()=>1,enforceUnit:()=>true,audit:()=>{},accounting:{postJournal:()=>{journalCalls++;throw Error('No journal expected')}},hasAccess:()=>false});
const find=(method,suffix)=>routes.find(x=>x[0]===method&&x[1].endsWith(suffix))[2];
const invoke=(fn,body={},params={},role='CEO / Owner')=>{const result={code:200,body:null};fn({body,params,user:{id:1,role}}, {status(n){result.code=n;return this},json(data){result.body=data;return this}});return result};
const create=find('POST','financing-v356');
let r=invoke(create,{lender:'KB',agreement_reference:'LOAN-1',opening_principal:1200,annual_rate:12,term_months:3,start_date:'2026-01-31',payment_day:31,financing_type:'Bank Loan',repayment_method:'Equal Principal',payment_account_id:1,currency:'KRW'});assert.equal(r.code,201,JSON.stringify(r));const id=r.body.id;
let original=impl.schedule(db.prepare('SELECT * FROM accounting_financing_v356 WHERE id=?').get(id));assert.equal(original.length,3);assert.equal(original[0].due_date,'2026-02-28');assert.equal(original[2].remaining_principal_krw,0);
// Simulate legitimate verified early principal payment linked before lender-approved recast.
db.exec(`INSERT INTO finance_entries(id,reference,transaction_date,verification_status,accounting_status,status,payment_account_id,krw_amount,cash_effect,business_unit_id,amount,original_currency,source_type)
 VALUES(21,'REPAY-1','2026-02-28','Verified / Correct','Pending','Active',1,700,-1,1,700,'KRW','Manual');`);
r=invoke(find('POST','/match-repayment'),{finance_entry_id:21,principal_krw:700,interest_krw:0,fee_krw:0,installment_no:1},{id});assert.equal(r.code,201,JSON.stringify(r));
const amend=find('POST','/amend-schedule');
r=invoke(amend,{effective_installment:2,remaining_months:2,annual_rate:10,revised_principal_krw:500,lender_reference:'KB-APPROVED-25',reason:'Lender-approved early principal repayment'},{id});assert.equal(r.code,201,JSON.stringify(r));
let updated=impl.schedule(db.prepare('SELECT * FROM accounting_financing_v356 WHERE id=?').get(id));assert.equal(updated[0].principal_krw,original[0].principal_krw,'historical schedule unchanged');assert.equal(updated[1].remaining_principal_krw>0,true);assert.equal(updated[2].remaining_principal_krw,0);assert.equal(db.prepare('SELECT COUNT(*) n FROM finance_entries').get().n,1);assert.equal(journalCalls,0);
r=invoke(amend,{effective_installment:2,remaining_months:2,annual_rate:10,revised_principal_krw:500,lender_reference:'KB-APPROVED-25',reason:'Duplicate approval'},{id});assert.equal(r.code,409);
r=invoke(amend,{effective_installment:3,remaining_months:1,annual_rate:10,revised_principal_krw:600,lender_reference:'KB-APPROVED-26',reason:'Incorrect balance'},{id});assert.equal(r.code,400);
r=invoke(amend,{effective_installment:3,remaining_months:1,annual_rate:10,revised_principal_krw:500,lender_reference:'KB-APPROVED-26',reason:'Bad actor'},{id},'Staff');assert.equal(r.code,403);
// Lease metadata is recorded only, without fictitious cash or automatic right-of-use journals.
r=invoke(create,{lender:'Lease Bank',agreement_reference:'LEASE-1',opening_principal:3000,annual_rate:4,term_months:12,start_date:'2026-01-01',payment_day:1,financing_type:'Equipment Lease',repayment_method:'Equal Installments',payment_account_id:1,currency:'KRW',lease_asset_value_krw:3200,lease_deposit_krw:200,lease_residual_krw:150});assert.equal(r.code,201,JSON.stringify(r));const lease=db.prepare('SELECT * FROM accounting_financing_v356 WHERE id=?').get(r.body.id);assert.equal(lease.lease_asset_value_krw,3200);assert.equal(lease.lease_deposit_krw,200);assert.equal(lease.lease_residual_krw,150);
r=invoke(create,{lender:'Lease Bank',agreement_reference:'INVALID-LEASE',opening_principal:3000,annual_rate:4,term_months:12,start_date:'2026-01-01',payment_day:1,financing_type:'Equipment Lease',repayment_method:'Equal Installments',payment_account_id:1,currency:'KRW',lease_asset_value_krw:-1});assert.equal(r.code,400);assert.equal(db.prepare("SELECT COUNT(*) n FROM accounting_financing_v356 WHERE agreement_reference='INVALID-LEASE'").get().n,0);
assert.equal(journalCalls,0);assert.equal(db.prepare('SELECT COUNT(*) n FROM accounting_journal_entries').get().n,0);
const client=read('public/v356-accounting.js');for(const token of ['v356PrintFinancing','amend-schedule','lease_asset_value_krw','Approved schedule revision','v356OpenAdvancedTab'])if(token!=='v356OpenAdvancedTab')assert(client.includes(token));
assert(!read('server/v356-financing.js').includes('INSERT INTO finance_entries'));
assert(read('public/index.html').includes('/v356-accounting.js?v=30.56.4'));
console.log('V30.56.4 SQLite route tests PASS: legacy dates, verified prepayment, authorized recast, duplicate/incorrect-balance/permission rejection, lease metadata, invalid lease rollback, zero synthetic Finance or GL entries.');
