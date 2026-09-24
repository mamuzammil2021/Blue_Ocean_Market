#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const runtime=read('public/runtime-v30392.js'),v343=read('public/v343-client.js'),v344=read('public/v344-client.js'),index=read('public/index.html'),pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json'));
function check(value,label){assert.ok(value,label);console.log('PASS '+label)}
check(pkg.version==='30.52.0'&&lock.version==='30.52.0'&&lock.packages[''].version==='30.52.0','versioned package and lockfile');
check(index.includes('/v344-client.js?v=30.52.0')&&index.indexOf('/v343-client.js')<index.indexOf('/v344-client.js'),'V30.44 client retained before V30.45');
check(read('server/server.js').includes("version:'30.52.0'"),'health release identity');
const rows=[{id:17,name:'Hina Bank Korea',payment_type:'Bank',currency:'KRW',business_unit:'Company',bank_name:'Hina Bank',account_last4:'1234',ledger_code:'1000',ledger_name:'Cash / Bank Clearing',active:1},{id:23,name:'Cash on Hand',payment_type:'Cash',currency:'KRW',active:1,ledger_code:'1010',ledger_name:'Cash on Hand'}];
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const t=v=>v,api=async()=>rows,translateElement=()=>{},canWriteAccounting=()=>true,canAdvanced=()=>true,statusBadge=v=>v,badge291=v=>v;
const extra={api,esc,t,translateElement,canWriteAccounting,canAdvanced,statusBadge,badge291};
const select=(code,a,b)=>code.slice(code.indexOf(a),code.indexOf(b,code.indexOf(a)));
const compile=(src,name)=>new Function(...Object.keys(extra),src+';return '+name)(...Object.values(extra));
const advanced=compile(select(runtime,'  async function accountingCashV29(b){','  window.addPaymentAccountV29='),'accountingCashV29');
const simple=compile(select(runtime,'  async function cashSimpleV291(b){','  window.accountingAdvancedV291='),'cashSimpleV291');
function verify(html,label,expected){check((html.match(/class="btn small v344-account-open"/g)||[]).length===expected,label+' has one real button per account');for(const x of rows)check(html.includes('onclick="v343OpenAccount('+x.id+')"'),label+' routes account '+x.id+' to shared detail');check(!html.includes('onclick="accountingSimpleTabV291('),label+' does not redirect advanced through simple tab')}
(async()=>{
for(let round=1;round<=2;round++){let b={innerHTML:''};await simple(b);verify(b.innerHTML,'Simple Cash rerender '+round,rows.length);b={innerHTML:''};await advanced(b);verify(b.innerHTML,'Advanced Cash rerender '+round,rows.length);check(b.innerHTML.includes('<th>Action</th>'),'Advanced Cash table includes action column');}
// V30.43 upgraded simple renderer also uses a real button, not a non-interactive span.
const upgraded=select(v343,'function accountCard343(p){','async function renderCashAccounts343()');
const accountCard=new Function('h','tr343',upgraded+';return accountCard343')(esc,t);
for(const r of rows){const html=accountCard(r);check(html.includes('<button type="button"')&&html.includes('onclick="v343OpenAccount('+r.id+')"'),'Upgraded Simple card has functional button '+r.id);check(!html.includes('<span class="btn small">'),'Upgraded Simple card has no fake button')}
check(!runtime.includes('DROP TABLE accounting_account_transfers_v343'),'No new destructive account migration');
const events=[],storage={blueOceanAccountingMode:'advanced'},session={bom_v343_workflow_context:'saved'};
const context={window:{v343CloseAccount(){events.push('simple-close')},closeWorkflowPageV324(force){events.push('workflow-close:'+force);return true}},document:{createElement(){return {style:{}}},head:{appendChild(){}}},localStorage:{getItem(k){return storage[k]}},sessionStorage:{removeItem(k){delete session[k]}},console};vm.runInNewContext(v344,context);
context.window.v343CloseAccount();check(events.join()==='workflow-close:true','Advanced account returns to Advanced workflow without forcing Simple view');check(!('bom_v343_workflow_context' in session),'Advanced close clears stored child context');storage.blueOceanAccountingMode='simple';context.window.v343CloseAccount();check(events.at(-1)==='simple-close','Simple account uses its existing close flow');
console.log('V30.52.0 Cash & Bank persistent action behavior QA: PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
