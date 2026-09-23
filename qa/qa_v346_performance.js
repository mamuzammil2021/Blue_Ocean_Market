#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),EventEmitter=require('node:events');
const root=path.join(__dirname,'..'),read=x=>fs.readFileSync(path.join(root,x),'utf8');let passed=0;
function ok(expr,label){assert.ok(expr,label);passed++;console.log('PASS '+label)}
async function main(){
const html=read('public/index.html'),run=read('public/runtime-v30392.js'),base=read('public/client.js'),server=read('server/server.js'),tiers=read('server/v313.js');
const pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json'));
ok(pkg.version==='30.51.0'&&lock.version==='30.51.0'&&lock.packages[''].version==='30.51.0','package/lock release version');
ok(server.includes("version:'30.51.0'")&&server.includes('Blue Ocean Market V30.51.0 running'),'health/log release identity');
ok(html.includes('/bom-mutation-hub.js?v=30.51.0')&&html.indexOf('bom-mutation-hub.js')<html.indexOf('runtime-v30392.js'),'shared node dispatcher installed before compatibility runtime');
ok(html.includes('/v345-client.js?v=30.51.0')&&html.indexOf('/v345-client.js')<html.indexOf('/v346-client.js'),'protected V30.45 feedback coordinator precedes new scheduler');
ok(run.includes('window.BOMReadScheduler.fetch(baseFetch,...arguments)')&&run.includes('if(method!==\'GET\'&&method!==\'HEAD\')'),'read scheduler wiring preserves mutation route');
ok((run.match(/new MutationObserver/g)||[]).length===15&&run.includes("BOMMutationHub.register('v326-account-label'"),'eleven audited shared enhancements retained while sensitive observers remain');
for(const key of ['pink-placeholders-quantities','v320-enhancements','v321-enhancements','v321-dialogs','country-and-resale','v330-context','v332-polish'])ok(run.includes("BOMMutationHub.register('"+key+"'"),'consolidated audited '+key);
ok(run.includes('const saleObserver381=new MutationObserver')&&run.includes('const sensitiveObserver317=new MutationObserver')&&run.includes('new MutationObserver(sync).observe(sel'),'sale/permission/account observers remain protected');
ok(server.includes('/api/v346/notifications/page')&&server.includes('/api/v346/audit/page')&&server.includes('LIMIT ? OFFSET ?'),'paged endpoints use SQLite limit/offset');
ok(base.includes("api('/api/v346/notifications/page?")&&base.includes("api('/api/v346/audit/page?")&&base.includes('const bom346Lists='),'canonical list views use paged endpoints and preserve filter state');
ok(server.includes("app.get('/api/notifications',auth")&&server.includes("app.get('/api/audit',auth"),'legacy array endpoints retained for dependent callers');
ok(server.includes('notificationUnitScope(req)')&&server.includes("allow('dashboard')")&&server.includes("u.business_unit_id=?"),'paged APIs preserve original scope');
ok(tiers.includes('const groups=new Map(tiers.map')&&tiers.includes('WHERE t.business_unit_id=? ORDER BY x.price_tier_id'),'Pink Salt tier N+1 replaced by BU-scoped bulk query');
ok(read('REQUIREMENTS_MASTER.md').includes('Mandatory regression gate — V30.46.0+'),'mandatory permanent regression gate in master requirements');
// Execute actual scheduler against delayed fetches: 4 global slots, 2 heavy slots, priority, abort and write bypass.
const schedulerContext={window:{},location:{href:'https://blue.test/app',origin:'https://blue.test'},URL,performance:{now:()=>Date.now()},AbortController,Error,console,Promise};
vm.runInNewContext(read('public/v346-client.js'),schedulerContext);const scheduler=schedulerContext.window.BOMReadScheduler;ok(scheduler?.limits.max===4&&scheduler.limits.max_heavy===2,'scheduler publishes bounded slots');
const fired=[],releases=new Map();function hold(url){fired.push(url);return new Promise(resolve=>{releases.set(url,resolve)})};
let active=[];for(let i=0;i<4;i++)active.push(scheduler.fetch(hold,`/api/items/${i}`));await new Promise(setImmediate);
ok(fired.length===4&&scheduler.diagnostics().active===4,'only four simultaneous reads start');
let later=scheduler.fetch(hold,'/api/items/later'),heavy=scheduler.fetch(hold,'/api/audit/history'),critical=scheduler.fetch(hold,'/api/action-counts');
releases.get('/api/items/0')('done');await active[0];await new Promise(setImmediate);
ok(fired[4]==='/api/action-counts','critical summary promoted ahead of queued background reads');
const write=await scheduler.fetch(url=>Promise.resolve('write-now'),'/api/payment',{method:'POST'});ok(write==='write-now','write/mutation requests bypass the read queue');
const outside=await scheduler.fetch(url=>Promise.resolve('outside-now'),'https://other.test/api/items');ok(outside==='outside-now','cross-origin requests bypass the scheduler');
let controller=new AbortController(),aborted=scheduler.fetch(hold,'/api/items/aborted',{signal:controller.signal});controller.abort();try{await aborted;throw new Error('expected abort')}catch(e){ok(e.name==='AbortError'&&!fired.includes('/api/items/aborted'),'queued abort rejects without initiating request')}
for(let round=0;round<5;round++){for(const release of releases.values())release('done');await new Promise(setImmediate)}await Promise.all([...active.slice(1),later,heavy,critical]);ok(scheduler.diagnostics().active===0&&scheduler.diagnostics().queued===0,'all scheduled requests settle and slots release');
// Shared observer dispatches one added element per hook and isolates exceptions.
let observers=[],body={contains:x=>!!x?.inBody},rootNode={};const document={documentElement:rootNode,body};
class FakeObserver{constructor(callback){this.cb=callback;observers.push(this)}observe(target,options){this.target=target;this.options=options}}
const context={window:{},document,MutationObserver:FakeObserver,console};vm.runInNewContext(read('public/bom-mutation-hub.js'),context);
let all=0,bodyCount=0;context.window.BOMMutationHub.register('all',()=>all++);context.window.BOMMutationHub.register('body',()=>bodyCount++,{root:'body'});
ok(observers.length===1&&observers[0].target===rootNode,'one native observer serves multiple enhancers');
observers[0].cb([{target:rootNode,addedNodes:[{nodeType:1,inBody:false},{nodeType:1,inBody:true},{nodeType:3}]}]);ok(all===2&&bodyCount===1,'body-limited and root enhancers preserve their scope');
// Dependency-free exercise of request-scoped SQL metrics. Values must never be returned in diagnostics.
const old=process.env.BOM_PERF_DETAILED;process.env.BOM_PERF_DETAILED='true';const perf=require('../server/v346-performance');
const middleware=[],routes=[];const app={use(fn){middleware.push(fn)},get(route,...handlers){routes.push(route)}};
const db={prepare(sql){return {get(){return {n:1}},all(){return [{id:1}]},run(){return {changes:1}}}}};
perf.installEarly({app,db});perf.installRoutes({app,auth:()=>{},allow:()=>()=>{}});
const req={method:'GET',path:'/api/test/123',statusCode:200},res=new EventEmitter();res.statusCode=200;res.write=function(){};res.end=function(){};
middleware[0](req,res,()=>{db.prepare('SELECT secret FROM sample WHERE id=123').get();res.end('{"ok":true}');res.emit('finish')});
const data=perf.snapshot();ok(data.enabled&&data.requests_observed>=1&&data.endpoints.some(x=>x.avg_sql_queries>=1),'request-scoped query count and duration recorded');
ok(!JSON.stringify(data).includes('secret')&&!JSON.stringify(data).includes('123'),'diagnostics redact raw SQL and values');
ok(routes.includes('/api/v346/performance/diagnostics'),'diagnostics endpoint installed behind auth/allow');
if(old===undefined)delete process.env.BOM_PERF_DETAILED;else process.env.BOM_PERF_DETAILED=old;
console.log(`\nV30.46.0 INHERITED PERFORMANCE QA PASS (${passed} checks)`);
}
main().catch(e=>{console.error('V30.46 QA FAILURE',e);process.exitCode=1});
