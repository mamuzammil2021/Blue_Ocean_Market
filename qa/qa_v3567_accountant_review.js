'use strict';
const assert=require('node:assert/strict'),{DatabaseSync}=require('node:sqlite'),fs=require('node:fs'),path=require('node:path');
const db=new DatabaseSync(':memory:');
db.exec(`CREATE TABLE accounting_financing_v356(id INTEGER PRIMARY KEY,business_unit_id INTEGER,agreement_no TEXT,lender TEXT,financing_type TEXT,currency TEXT,opening_principal REAL);
CREATE TABLE accounting_financing_opening_links_v356(financing_id INTEGER,journal_entry_id INTEGER,liability_account_id INTEGER);
CREATE TABLE accounting_financing_lease_events_v356(financing_id INTEGER,event_type TEXT,journal_entry_id INTEGER,contra_account_id INTEGER);
CREATE TABLE accounting_financing_funding_v356(id INTEGER PRIMARY KEY,financing_id INTEGER);
CREATE TABLE accounting_financing_repayments_v356(id INTEGER PRIMARY KEY,financing_id INTEGER,finance_entry_id INTEGER,principal_krw REAL,interest_krw REAL,fee_krw REAL);
CREATE TABLE finance_entries(id INTEGER PRIMARY KEY,verification_status TEXT,status TEXT,cash_effect INTEGER,accounting_status TEXT,transaction_date TEXT,reference TEXT,original_currency TEXT,original_amount REAL);
CREATE TABLE accounting_journal_entries(id INTEGER PRIMARY KEY,journal_no TEXT,source_type TEXT,source_id INTEGER,transaction_date TEXT,business_unit_id INTEGER,status TEXT,reversal_of_id INTEGER);
CREATE TABLE accounting_journal_lines(journal_entry_id INTEGER,account_id INTEGER,debit_krw REAL,credit_krw REAL);
CREATE TABLE accounting_accounts(id INTEGER PRIMARY KEY,account_type TEXT);
INSERT INTO accounting_financing_v356 VALUES(1,1,'FIN-1','Lender','Bank Loan','KRW',1000),(2,2,'FIN-2','Other','Bank Loan','KRW',500);
INSERT INTO accounting_financing_opening_links_v356 VALUES(1,10,20);
INSERT INTO accounting_accounts VALUES(20,'Liability');
INSERT INTO accounting_journal_entries VALUES(10,'OPEN','Opening Balance',1,'2026-01-01',1,'Posted',null),(11,'REPAY','Financing Repayment Reclassification',1,'2026-02-01',1,'Posted',null);
INSERT INTO accounting_journal_lines VALUES(10,20,0,1000),(11,20,250,0);
INSERT INTO finance_entries VALUES(1,'Verified / Correct','Recorded',-1,'Posted','2026-02-01','BANK-1','KRW',250);
INSERT INTO accounting_financing_repayments_v356 VALUES(1,1,1,250,0,0);
`);
db.transaction=fn=>fn;
const routes=[];const app={get:(p,...f)=>routes.push({p,f:f.at(-1)}),post:(p,...f)=>routes.push({p,f:f.at(-1)})};let financeCount=()=>db.prepare('SELECT COUNT(*) n FROM finance_entries').get().n;
require('../server/v3566-financing-audit').install({app,db,auth:()=>{},allow:()=>()=>{},enforceUnit:(req,unit)=>Number(req.user.unit)===unit});
const request=(id,unit)=>({params:{id:String(id)},query:{},user:{unit}});
function invoke(req){const fn=routes.find(x=>x.p.endsWith('/financial-audit')).f;let result={status:200};fn(req,{status(n){result.status=n;return this},json(x){result.body=x;return this}});return result}

function post(body,admin=true){const fn=routes.find(x=>x.p.endsWith('/review-reconciliation')).f;let out={status:200};fn({...request(1,1),body,user:{unit:1,id:9,role:admin?'CEO / Owner':'Accountant'}},{status(n){out.status=n;return this},json(x){out.body=x;return this}});return out;}
let r=invoke(request(1,1));assert.equal(r.body.source_linked_reconciled,true);
let a=post({reviewed_balance_krw:750,statement_date:'2026-02-28',lender_reference:'BANK-STATEMENT-001',notes:'Matched lender balance and complete posted liability ledger.'});assert.equal(a.status,201);assert.equal(a.body.no_finance_or_journal_write,true);
r=invoke(request(1,1));assert.equal(r.body.accountant_review.current,true);
a=post({reviewed_balance_krw:750,statement_date:'2026-02-28',lender_reference:'BANK-STATEMENT-001',notes:'Matched lender balance and complete posted liability ledger.'});assert.equal(a.status,409);
a=post({reviewed_balance_krw:750,statement_date:'2026-02-28',lender_reference:'BANK-STATEMENT-001',notes:'Matched lender balance and complete posted liability ledger.'},false);assert.equal(a.status,403);
db.exec("INSERT INTO accounting_journal_entries VALUES(12,'OTHER','Manual Journal',12,'2026-02-05',1,'Posted',null);INSERT INTO accounting_journal_lines VALUES(12,20,0,100)");r=invoke(request(1,1));assert.equal(r.body.accountant_review.stale,true);assert.equal(r.body.requires_review,true);
a=post({reviewed_balance_krw:750,statement_date:'2026-02-28',lender_reference:'BANK-STATEMENT-001',notes:'Matched lender balance and complete posted liability ledger.'});assert.equal(a.status,409);
assert.equal(db.prepare('SELECT COUNT(*) n FROM finance_entries').get().n,1);
assert.equal(db.prepare('SELECT COUNT(*) n FROM accounting_journal_entries').get().n,3);
assert.equal(db.prepare('SELECT COUNT(*) n FROM accounting_financing_reviews_v356').get().n,1);
console.log('PASS V30.56.7: authorized reconciliation review, duplicate guard, stale on GL change, shared-account block, zero Finance/journal writes.');
