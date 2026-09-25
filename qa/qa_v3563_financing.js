'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const server=read('server/v356-financing.js'),posting=read('server/v318.js'),client=read('public/v356-accounting.js');
const routes=[];const db={exec:()=>{},prepare:()=>({get:()=>null,all:()=>[],run:()=>({lastInsertRowid:1})}),transaction:f=>f};
const app={get:(p,...handlers)=>routes.push(['GET',p,handlers.at(-1)]),post:(p,...handlers)=>routes.push(['POST',p,handlers.at(-1)])};
const inst=require('../server/v356-financing').install({app,db,auth:()=>{},allow:()=>()=>{},currentUnit:()=>1,enforceUnit:()=>true,audit:()=>{},accounting:{postJournal:()=>{throw Error('Unexpected journal creation')}},hasAccess:()=>false});
const find=(method,suffix)=>{const r=routes.find(x=>x[0]===method&&x[1].endsWith(suffix));assert(r,method+' '+suffix+' missing');return r[2]};
function invoke(route,req){let result={code:200,body:null};const res={status(n){result.code=n;return this},json(body){result.body=body;return this}};route(req,res);return result}
for(const suffix of ['/match-funding','/prepare-funding-reclassification']){
 const r=invoke(find('POST',suffix),{user:{id:8,role:'Staff'},params:{id:1},body:{finance_entry_id:1,liability_account_id:1}});
 assert.equal(r.code,403);assert(/authority/.test(r.body.error));
}
assert(find('GET','/statement'));
assert.equal(routes.length,10);
assert(server.includes('finance_entry_id INTEGER NOT NULL UNIQUE'));
assert(server.includes('financing_id INTEGER NOT NULL UNIQUE'));
assert(server.includes("sourceType:'Financing Funding Reclassification'"));
assert(server.includes('single-bank/single-income journal'));
assert(server.includes('Original funding is not a single-bank'));
assert(server.includes('No new Finance receipt'));
assert(!server.includes('INSERT INTO finance_entries'));
assert(posting.includes("j.source_type==='Financing Funding Reclassification'"));
assert(posting.includes('Linked funding receipt/original posted journal changed'));
assert(client.includes('v356MatchFunding')&&client.includes('v356PrepareFunding')&&client.includes('v356ExportFinancing'));
assert(client.includes('v356fund_liability')&&client.includes('v356r_global_liability'));
assert(client.includes('Installment status')&&client.includes('payment_status'));
for(const f of ['server/v356-financing.js','server/v318.js','public/v356-accounting.js','server/server.js'])new vm.Script(read(f),{filename:f});
const sch=inst.schedule({opening_principal:1200,annual_rate:12,term_months:3,start_date:'2026-01-31',payment_day:31,repayment_method:'Equal Principal'});
assert.equal(sch[0].due_date,'2026-02-28');assert.equal(sch[2].remaining_principal_krw,0);
console.log('V30.56.3: 10 routes, funding authority checks, one-to-one source constraints, cash-neutral posting gates, statement/export wiring, schedule & source syntax PASS. Static/mock only; live Render database not exercised.');
