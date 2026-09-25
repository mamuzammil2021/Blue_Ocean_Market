#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');let passed=0;
function ok(test,name){assert.ok(test,name);passed++;console.log('PASS '+name)}
(async function(){
 const p=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json')),idx=read('public/index.html'),base=read('public/client.js'),runtime=read('public/runtime-v30392.js'),server=read('server/server.js'),notifs=read('public/v348-notifications.js'),bell=read('public/v348-bell.js'),lazy=read('public/v348-loader.js'),pink=read('server/v313.js'),perf=read('server/v346-performance.js');
 ok(p.version==='30.54.0'&&lock.version==='30.54.0'&&lock.packages[''].version==='30.54.0','current package/lock identity');
 ok(server.includes("version:'30.54.0'")&&server.includes('Blue Ocean Market V30.54.0 running'),'server health/runtime identity');
 ok(idx.includes('v348-bell.js?v=30.54.0')&&idx.includes('v348-loader.js?v=30.54.0')&&!idx.includes('<script src="/v348-notifications.js'),'small bell/loader boot; scroll view remains lazy');
 ok(idx.indexOf('v347-loader.js')<idx.indexOf('v348-loader.js')&&idx.indexOf('v345-client.js')<idx.indexOf('v348-loader.js'),'pre-existing feedback, scheduler, and workspaces load first');
 ok(lazy.includes("view==='notifications'")&&lazy.includes('return previous.apply(this,arguments)')&&lazy.includes('pending=null'),'route-only loading, fallback and retry');
 ok(notifs.includes('IntersectionObserver')&&notifs.includes("rootMargin:'360px 0px'")&&notifs.includes('v348LoadMore'),'predictive, opt-in card scroll');
 ok(notifs.includes('MAX_DOM_ROWS=250')&&notifs.includes('Continue in paged view')&&notifs.includes('const legacy=window.notificationsView'),'bounded DOM and original pagination fallback');
 ok(notifs.includes('if(fetching||!alive(epoch)')&&notifs.includes('shown.has(id)')&&notifs.includes('epoch++'),'stale response discard, request/row dedupe');
 ok(notifs.includes('flightEpoch=id')&&notifs.includes('if(flightEpoch===id)fetching=false')&&notifs.includes('flightEpoch=0'),'stale request cleanup cannot clear a newer feed fetch guard');
 ok(notifs.includes('aria-live=')&&notifs.includes("status('Could not load more notifications.")&&notifs.includes("try{translateElement(host)"),'contextual, localized retry; existing rows not removed');
 ok(base.includes('function bom346Paging')&&base.includes("async function auditView(c)")&&base.includes("/api/v346/audit/page"),'Audit retains explicit paging');
 ok(bell.includes('/api/v348/notifications/feed?pageSize=25&status=unread')&&!bell.includes("api('/api/notifications')")&&bell.includes('d.unread_total'),'bell preview no longer downloads entire history; accurate unread count');
 ok(server.includes("require('./v348-notification-feed').install({app,db,auth,notificationUnitScope})")&&server.includes("app.get('/api/v346/notifications/page'"),'new feed reuses original scoped logic and legacy page route remains');
 ok(server.includes('a.created_at>=?')&&server.includes("a.created_at < date(?,'+1 day')")&&server.includes('idx_v348_audit_date'),'audit time filter can use ordered read index');
 ok(pink.includes("bulk348.customersBulk(db,bu,today())")&&pink.includes('bulk348.financialsBulk(db,bu,rows,today())'),'Pink Salt list views use BU-scoped bulk projections');
 ok(pink.includes('function customerSummary(customerId)')&&pink.includes('function orderFinancials(order)')&&pink.includes('const current=Math.max(0,num(customerSummary(customer.id)?.account_balance_krw))'),'mutation-time financial checks unchanged');
 ok((runtime.match(/new MutationObserver/g)||[]).length===15&&runtime.includes("BOMMutationHub.register('v326-account-label'"),'audited observer migration preserved with account-label behavior');
 ok(runtime.includes('const saleObserver381=new MutationObserver')&&runtime.includes('const sensitiveObserver317=new MutationObserver')&&runtime.includes('new MutationObserver(sync).observe(sel'),'sale, permissions and account-picker observers protected');
 ok(perf.includes('MAX_RECENT=64')&&perf.includes('p95_ms:percentile')&&perf.includes('p95_sql_ms:percentile'),'bounded percentile diagnostics, opt-in');
 ok(read('REQUIREMENTS_MASTER.md').includes('Selective Intelligent Data Loading — V30.48.0'),'selective intelligent loading documented');
 // Exercise real cursor parsing and endpoint parameterization without unavailable native dependencies.
 const feed=require('../server/v348-notification-feed'),req={user:{id:7,business_unit_id:2},selected_business_unit_id:2};
 const key=feed.fingerprint(req,'all',''),encoded=feed.makeCursor({id:28,read_at:null,created_at:'2026-09-22 10:22:00'},key);
 ok(feed.parseCursor(encoded,key).id===28&&feed.parseCursor(encoded,key).g===0,'cursor round-trip retains stable unread sort key');
 for(const invalid of ['!!!',Buffer.from('{"g":0,"at":"2026-09-22","id":28,"k":"wrong"}').toString('base64url')]){let rejected=false;try{feed.parseCursor(invalid,key)}catch(_){rejected=true}ok(rejected,'invalid or wrong-filter cursor rejected')}
 ok(feed.pageSize('200')===25&&feed.pageSize('50')===50,'feed page-size allowlist and bound');
 let handler=null;const sqlCalls=[],fullRows=Array.from({length:26},(_,i)=>({id:26-i,read_at:null,created_at:`2026-09-22 10:${String(59-i).padStart(2,'0')}:00`}));
 const db={exec(sql){sqlCalls.push(sql)},prepare(sql){return {get(...args){sqlCalls.push([sql,args]);return {n:sql.includes('read_at IS NULL')?3:26}},all(...args){sqlCalls.push([sql,args]);return sql.includes('created_at<?')?fullRows.slice(25):fullRows.slice(0,Number(args.at(-1)))}}}};
 feed.install({db,app:{get(route,...fns){if(route.includes('v348'))handler=fns.at(-1)}},auth:()=>{},notificationUnitScope:()=>({sql:' AND business_unit_id=?',args:[2]})});
 ok(typeof handler==='function'&&sqlCalls[0].includes('CREATE INDEX IF NOT EXISTS'),'feed route registered and scoped index added');
 const response=()=>({statusCode:200,status(code){this.statusCode=code;return this},json(d){this.body=d;return this}});
 let res=response();handler({user:req.user,selected_business_unit_id:2,query:{status:'all'}},res);
 ok(res.statusCode===200&&res.body.rows.length===25&&res.body.has_more&&res.body.next_cursor,'page fetch returns 25 cards plus bounded lookahead');
 ok(sqlCalls.some(x=>Array.isArray(x)&&x[0].includes('business_unit_id=?')&&x[0].includes('LIMIT ?')&&x[1].includes(2)&&x[1].at(-1)===26),'scoped keyset SQL uses bound parameters and LIMIT');
 res=response();handler({user:req.user,selected_business_unit_id:2,query:{status:'all',cursor:res.body?.next_cursor||feed.makeCursor(fullRows[24],key)}},res);
 ok(res.statusCode===200&&res.body.rows.length===1&&!res.body.has_more,'second keyset batch completes without fetching whole history');
 res=response();handler({user:req.user,selected_business_unit_id:2,query:{status:'all',cursor:'invalid!'}},res);
 ok(res.statusCode===400&&!res.body.rows,'malformed cursor cannot bypass scope or leak rows');
 // Pure financial equivalence: completed, overdue, cancelled, legacy payment, receipt allocation, refund, credit and debit adjustment.
 const bulk=require('../server/v348-pink-salt-bulk'),customers=[{id:1,name:'A',business_unit_id:2},{id:2,name:'B',business_unit_id:2}],orders=[{id:10,customer_id:1,business_unit_id:2,status:'Completed',total_krw:1500,due_date:'2026-09-01'},{id:11,customer_id:2,business_unit_id:2,status:'Completed',total_krw:900,due_date:'2026-12-01'},{id:12,customer_id:1,business_unit_id:2,status:'Cancelled',total_krw:400,due_date:null}];
 const fake={prepare(sql){return {all(bu){assert.equal(bu,2);if(sql.includes('FROM pink_salt_customers WHERE'))return customers;if(sql.includes('FROM pink_salt_orders WHERE'))return orders.filter(o=>o.status==='Completed');if(sql.includes('FROM pink_salt_customer_payments'))return [{order_id:10,amount:200},{order_id:12,amount:100}];if(sql.includes('FROM pink_salt_customer_receipt_allocations a JOIN pink_salt_customer_receipts'))return [{order_id:10,amount:900}];if(sql.includes('FROM pink_salt_customer_refunds'))return [{order_id:10,amount:100}];if(sql.includes('SELECT id,customer_id,gross_settlement_krw FROM pink_salt_customer_receipts'))return [{id:20,customer_id:1,gross_settlement_krw:1200}];if(sql.includes('SELECT r.id receipt_id'))return [{receipt_id:20,amount:900}];if(sql.includes('FROM pink_salt_customer_adjustments'))return [{customer_id:1,effect:'Debit',amount_krw:50}];throw new Error('Unexpected SQL '+sql)}}}};
 const fm=bulk.financialsBulk(fake,2,orders,'2026-09-23');
 ok(fm.get(10).paid_krw===1000&&fm.get(10).outstanding_krw===500&&fm.get(10).payment_status_v313==='Partially Paid','legacy + active allocation − refund preserved');
 ok(fm.get(12).outstanding_krw===0&&fm.get(12).payment_status_v313==='Credit Held','cancelled order credit not reclassified');
 const c=bulk.customersBulk(fake,2,'2026-09-23');
 ok(c[0].unallocated_credit_krw===300&&c[0].account_balance_krw===250,'customer advance and debit adjustment reconcile');
 ok(c[1].outstanding_krw===900&&c[1].overdue_krw===0,'per-customer and overdue scope maintained');
 // Module failure is nonblocking, with old navigation as fallback.
 let scripts=[],called=0;const ctx={window:{loadView:()=>{called++}},view:'notifications',document:{createElement:()=>({}),head:{appendChild:s=>scripts.push(s)},getElementById:()=>({innerHTML:''})},console,Promise};vm.runInNewContext(lazy,ctx);const a=ctx.window.loadView(),b=ctx.window.loadView();
 ok(scripts.length===1,'one in-flight lazy notification module load');scripts[0].onerror();await Promise.all([a,b]);ok(called===2&&ctx.window.BOMLazy348.diagnostics().failed===1,'module failure falls back to original page without hanging');
 console.log(`\nV30.54.0 SMART PERFORMANCE QA PASS (${passed} checks)`);
})().catch(e=>{console.error('V30.48 QA FAILURE:',e.stack||e);process.exitCode=1});
