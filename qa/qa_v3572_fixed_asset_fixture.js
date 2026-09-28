'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),src=fs.readFileSync(path.join(root,'server/v357-realworld.js'),'utf8');
const routes=new Map(),assets=[],events=[],journals=[{id:10,transaction_date:'2026-01-05',business_unit_id:1,status:'Posted',finance_entry_id:null}],proposals=[],audits=[];
const accounts=new Map([[1,{id:1,account_type:'Asset',active:1}],[2,{id:2,account_type:'Asset',active:1}],[3,{id:3,account_type:'Expense',active:1}]]);let nextId=1;
let closed=false;
const db={exec:()=>{},transaction:f=>f,prepare:s=>({get:(...args)=>{
 if(s.includes('FROM accounting_accounts WHERE id='))return accounts.get(args[0]);
 if(s.includes('FROM accounting_journal_entries WHERE id='))return journals.find(j=>j.id===args[0]);
 if(s.includes('reversal_of_id=?'))return null;
 if(s.includes('SUM(debit_krw-credit_krw)'))return {amount:1000};
 if(s.includes('FROM accounting_fixed_assets_v357 WHERE id='))return assets.find(a=>a.id===args[0]);
 if(s.includes('FROM accounting_fixed_asset_events_v357 WHERE asset_id=? AND event_type='))return events.find(e=>e.asset_id===args[0]&&e.event_type==='Depreciation'&&e.period===args[1]);
 return null;
 },all:(...args)=>{
 if(s.includes('FROM accounting_fixed_asset_events_v357 e JOIN'))return events.filter(e=>e.asset_id===args[0]).map(e=>({...e,journal_status:journals.find(j=>j.id===e.journal_id)?.status||'Pending Review'}));
 if(s.includes('FROM accounting_fixed_assets_v357 ORDER'))return assets;
 return [];
 },run:(...args)=>{
 if(s.includes('INSERT INTO accounting_fixed_assets_v357(')){const id=nextId++;const a={id,business_unit_id:args[0],asset_no:args[1],name:args[2],category:args[3],acquisition_date:args[4],cost_krw:args[5],residual_krw:args[6],useful_life_months:args[7],asset_account_id:args[8],contra_account_id:args[9],expense_account_id:args[10],source_journal_id:args[11]};assets.push(a);return {lastInsertRowid:id};}
 if(s.includes('INSERT INTO accounting_fixed_asset_events_v357(')){const id=nextId++;events.push({id,asset_id:args[0],event_type:s.includes("'Depreciation'")?'Depreciation':'Disposal',period:args[1],amount_krw:args[2],journal_id:-1});return {lastInsertRowid:id};}
 if(s.includes('UPDATE accounting_fixed_asset_events_v357 SET journal_id=')){events.find(e=>e.id===args[1]).journal_id=args[0];return {changes:1};}
 throw new Error('Unexpected write '+s);
 }})};
const app={get:(u,...f)=>routes.set('GET '+u,f.at(-1)),post:(u,...f)=>routes.set('POST '+u,f.at(-1))};
require('../server/v357-realworld').install({app,db,auth:()=>{},allow:()=>()=>{},currentUnit:()=>1,enforceUnit:(req,bu)=>bu===1,audit:(...x)=>audits.push(x),accounting:{isPeriodClosed:()=>closed,postJournal:p=>{proposals.push(p);const id=100+proposals.length;journals.push({id,business_unit_id:p.businessUnitId,transaction_date:p.transactionDate,status:'Pending Review'});return id}},hasAccess:()=>false});
function invoke(method,url,body={},role='CEO / Owner'){let status=200,data;const res={json:x=>{data=x},status:n=>{status=n;return res}};routes.get(method+' '+url)({user:{id:7,role},params:{id:String(assets[0]?.id||1)},body},res);return {status,data};}
let payload={asset_no:'FA-001',name:'Office equipment',category:'Equipment',acquisition_date:'2026-01-06',cost_krw:1000,residual_krw:100,useful_life_months:9,asset_account_id:1,contra_account_id:2,expense_account_id:3,source_journal_id:10,policy_reference:'Approved policy FA-01'};
let r=invoke('POST','/api/accounting/fixed-assets-v357',payload);assert.equal(r.status,201);assert.equal(r.data.no_new_journal,true);assert.equal(proposals.length,0);console.log('PASS linked asset registration creates no Finance or journal');
r=invoke('POST','/api/accounting/fixed-assets-v357/:id/depreciation',{period_end:'2026-02-28',policy_reference:'Approved policy FA-01'});assert.equal(r.status,201);assert.equal(proposals.length,1);assert.equal(proposals[0].postingStatus,undefined);assert.deepEqual(proposals[0].lines.map(x=>[x.debit_krw,x.credit_krw]),[[100,0],[0,100]]);console.log('PASS balanced pending-only depreciation without cash account');
r=invoke('POST','/api/accounting/fixed-assets-v357/:id/depreciation',{period_end:'2026-02-28',policy_reference:'Approved policy FA-01'});assert.equal(r.status,409);assert.equal(proposals.length,1);console.log('PASS duplicate month blocked');
closed=true;r=invoke('POST','/api/accounting/fixed-assets-v357/:id/depreciation',{period_end:'2026-03-31',policy_reference:'Approved policy FA-01'});assert.equal(r.status,409);console.log('PASS closed period blocked');
closed=false;r=invoke('POST','/api/accounting/fixed-assets-v357/:id/depreciation',{period_end:'2026-03-31',policy_reference:'Approved policy FA-01'},'Staff Member');assert.equal(r.status,403);console.log('PASS unauthorized financial adjustment blocked');
assert(!src.includes('INSERT INTO finance_entries'));assert(src.includes("'Pending Review'"));console.log('PASS no Finance insertion and Posting Control status in module');
