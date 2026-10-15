'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),{calculate}=require('../server/pink-fx-calculation'),{fixture}=require('./fx_fixture');const checks=[];let f;
function pass(s){checks.push(s);console.log('PASS '+s)}
(async()=>{try{
 const c={company_currency:'KRW',invoice_currency:'USD',invoice_carrying_rate:1300,direction:'Out',outstanding_krw:1300000,available_advance_krw:0},b={settlement_mode:'new',amount_entry:'recipient',recipient_expected_amount:100,bank_fx_rate:1400,fx_rate_pair:'USD/KRW',source_fee_amount:1000,fee_policy:'added_to_debit'};
 assert.throws(()=>calculate(b,c),/Bank quote reference/);pass('Strict calculation still rejects missing bank quotation evidence');
 let v=calculate(b,c,{previewOnly:true});assert.equal(v.company_amount,141000);assert.equal(v.recipient_confirmed,null);assert.equal(v.confirmation_status,'Estimated');pass('UI arithmetic preview calculates fees and debit without fabricating a quote or confirmation');
 assert.throws(()=>calculate({...b,bank_fx_rate:''},c,{previewOnly:true}),/Bank FX rate/);pass('UI preview never invents a missing bank conversion rate');
 v=calculate({...b,source_fee_amount:0,bank_fx_rate:'',fx_rate_pair:'USD/USD'}, {...c,company_currency:'USD'},{previewOnly:true});assert.equal(v.company_amount,100);assert.equal(v.bank_krw,null);assert.equal(v.fx_difference_krw,null);pass('Missing foreign KRW accounting rate remains unknown while same-currency amounts can be calculated');
 assert.throws(()=>calculate({...b,bank_fx_rate:1,source_fee_amount:0,fx_rate_pair:'USD/USD'},{...c,company_currency:'USD'}),/Company account accounting rate/);pass('Strict financial calculation continues to require the foreign-account accounting rate');
 f=await fixture();const before=f.db.prepare('SELECT COUNT(*) n FROM pink_fx_transactions').get().n;
 const request=f.payment({bank_quote_reference:'',quote_source:'',quote_time:'',source_debit_amount:'999',previewOnly:true});const response=await f.api('POST','/api/pink-salt/fx/import/'+f.imports[0]+'/preview',request);assert.equal(response.status,400);assert.match(response.j.error,/Actual company movement|실제 회사/);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM pink_fx_transactions').get().n,before);pass('Real API ignores a caller-supplied previewOnly flag and preserves strict debit reconciliation');
 const recorded=await f.api('POST','/api/pink-salt/fx/import/'+f.imports[0]+'/record',f.fd(request));assert.equal(recorded.status,400);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM pink_fx_transactions').get().n,before);pass('Real record endpoint cannot use UI preview mode to bypass exact-debit financial controls');
 fs.writeFileSync(path.join(__dirname,'evidence/36924-calculation.json'),JSON.stringify({status:'PASS',checks,production_data_used:false},null,2));
 }catch(e){console.error(e.message);process.exitCode=1}finally{f?.close()}})();
