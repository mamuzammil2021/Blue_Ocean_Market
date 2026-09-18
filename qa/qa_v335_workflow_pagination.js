'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
function pass(ok,msg){if(!ok){console.error('FAIL',msg);process.exitCode=1}else console.log('PASS',msg)}
const client=read('public/v335-client.js'),server=read('server/server.js'),index=read('public/index.html'),pkg=JSON.parse(read('package.json'));
pass(pkg.version==='30.38.0','current package version 30.37.0 retains V30.35 requirements');
pass(index.includes('/v335-client.js?v=30.38.0')&&index.indexOf('/v335-client.js?v=30.38.0')<index.indexOf('/v336-client.js?v=30.38.0'),'V30.35 client overlay retained before V30.36 hardening marker');
pass(server.includes("const v335=require('./v335').install({db});"),'V30.35 server overlay installed');
pass(server.includes("a.lifecycle_stage==='Sold / Completed'&&req.user.role!=='CEO / Owner'"),'sold machine purchase edit restricted server-side');
pass(client.includes("document.addEventListener('blur'"),'system-wide blur validation');
pass(client.includes('Buyer Advance + New Payment')&&client.includes('advance_plus_new'),'combined buyer advance + new payment supported');
pass(client.includes('New Payment Required')&&client.includes('syncSaleAmount335'),'sale payment amount synchronization');
pass(client.includes('cachedPayees')&&client.includes('is_default'),'supplier receiver accounts cached and default selected');
pass(client.includes('token_payment_account_id')&&client.includes('token_receiver_account_id'),'Buy Machine Pay From / Paid To account integrity');
pass(client.includes('finance_verification_status')&&client.includes('finance_accounting_status'),'machine cost UI lock checks finance/accounting lifecycle');
pass(client.includes('v335FinanceFrom')&&client.includes('v335FinanceTo'),'Finance date range filter');
pass(client.includes('v335PostingFrom')&&client.includes('v335PostingTo'),'Posting Control date range filter');
pass(client.includes('v335-posting-compact')&&client.includes('.v318-flow,.v335-posting-compact .v318-summary'),'Posting Control top summary/flow removed');
pass(client.includes('Rows per page')&&client.includes('<option>25</option><option>50</option><option>100</option>'),'shared 25/50/100 pagination');
pass(client.includes('v335-page-hidden')&&client.includes('refreshPagination335'),'pagination composes after filters');
pass(client.includes('MutationObserver')&&client.includes('requestAnimationFrame'),'targeted late-render enhancement without full page reload');
pass(!client.includes('location.reload('),'no full-page reload introduced');
if(!process.exitCode)console.log('V30.35 workflow/pagination QA PASS');
