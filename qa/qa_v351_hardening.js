#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');let passed=0;
function check(result,label){assert.ok(result,label);passed++;console.log('PASS '+label)}
(async()=>{
const pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json')),index=read('public/index.html'),server=read('server/server.js'),loader=read('public/v351-loader.js'),runtime=read('public/runtime-v30392.js');
check(pkg.version==='30.53.0'&&lock.version==='30.53.0'&&lock.packages[''].version==='30.53.0'&&server.includes("version:'30.53.0'"),'release identity consistent');
check(index.includes('/v351-loader.js?v=30.53.0')&&index.indexOf('v351-loader.js')>index.indexOf('v348-loader.js'),'optional route loader installed after protected wrappers');
for(const f of ['v349-pink-pages','v350-import-pages','v350-raw-pages'])check(!index.includes(`<script src="/${f}.js`)&&loader.includes(`/${f}.js?v=30.51.0`),'optional UI module absent from boot and registered for route: '+f);
check(index.includes('/v349-accounting-pages.js?v=30.53.0')&&index.includes('/runtime-v30392.js?v=30.53.0')&&index.includes('/v345-client.js?v=30.53.0'),'direct Accounting tab, business runtime, and unified feedback remain eager');
check((runtime.match(/new MutationObserver/g)||[]).length===15&&runtime.includes('sensitiveObserver317=new MutationObserver')&&runtime.includes('saleObserver381=new MutationObserver'),'15 protected legacy observers retained');
check(runtime.includes("api('/api/pink-salt/customers-v313')")&&runtime.includes("api('/api/pink-salt/raw-stock')")&&runtime.includes("api('/api/pink-salt/imports')"),'fail-open complete legacy list paths retained');
check(read('server/server.js').includes("require('./v350-import-pages').install")&&read('server/server.js').includes("require('./v350-raw-pages').install")&&read('server/server.js').includes("require('./v349-pink-pages').install"),'server pages still installed with original auth and BU middleware');
const scripts=[];let oldCalls=0,screen='psImports';const doc={head:{appendChild(s){scripts.push(s);return s}},createElement(){return {tagName:'SCRIPT'}},getElementById(){return {innerHTML:''}}};
const window={loadView(){oldCalls++;return 'legacy-render'},BOMProgressive:{viewShell(){return '<div>section skeleton</div>'}}};
const ctx={window,document:doc,console,view:screen};vm.runInNewContext(loader,ctx);
check(window.BOMLazy351.route('psImports')==='pink-imports'&&window.BOMLazy351.route('psRawStock')==='pink-stock'&&window.BOMLazy351.route('psSales')==='pink-lists'&&window.BOMLazy351.route('accounting')===null,'correct selective route registry');
check(!window.BOMLazy351.diagnostics().loaded.length&&scripts.length===0,'startup executes no Pink Salt optional page modules');
const a=window.BOMLazy351.ensure('pink-imports'),b=window.BOMLazy351.ensure('pink-imports');
check(a===b&&scripts.length===1&&scripts[0].src.includes('/v350-import-pages.js'),'single-flight loading avoids duplicate module requests');
window.BOMPinkImports350={};scripts[0].onload();check(await a===true&&await b===true&&window.BOMLazy351.diagnostics().loaded.length===1,'module readiness checked only after the script loads');
await window.BOMLazy351.ensure('pink-imports');check(scripts.length===1,'subsequent route uses already-loaded module');
ctx.view='psCustomers';const failure=window.loadView();check(scripts.length===2,'unloaded screen requests only its own module');scripts[1].onerror(new Error('offline'));await failure;
check(oldCalls===1&&window.BOMLazy351.diagnostics().failures['pink-lists']===1,'failed optional module falls back to original renderer');
const retry=window.loadView();check(scripts.length===3,'a failed optional module can retry');window.BOMPinkPages349={};scripts[2].onload();await retry;check(oldCalls===2,'successful retry renders original screen with enhanced module available');
ctx.view='psRawStock';const pending=window.loadView();check(scripts.length===4,'raw stock route requests only raw stock read module');ctx.view='accounting';window.BOMPinkRaw350={};scripts[3].onload();await pending;check(oldCalls===2,'stale route script does not paint over new screen');
await window.loadView();check(oldCalls===3,'unrelated Accounting route continues normally');
// Exact stale BU regression: old result must never be rendered even if the view name remains unchanged.
const readPink=read('public/v349-pink-pages.js');let resolvePink;let userUnit='2';const pinkCtx={window:{},selectedUnitId:userUnit,me:{id:1},view:'psCustomers',api:()=>new Promise(r=>{resolvePink=r}),KO:{},t:x=>x,esc:x=>x,console,URLSearchParams,setTimeout,clearTimeout,document:{}};vm.runInNewContext(readPink,pinkCtx);
const oldPink=pinkCtx.window.BOMPinkPages349.get('customers');pinkCtx.selectedUnitId='3';resolvePink({rows:[{id:1}],summary:{}});check(await oldPink===null,'old Pink Salt page response rejected after BU change');
const acct=read('public/v349-accounting-pages.js');let resolveAcct;const accountCtx={window:{},selectedUnitId:2,me:{id:1},view:'accounting',api:()=>new Promise(r=>{resolveAcct=r}),KO:{},t:x=>x,esc:x=>x,console,URLSearchParams,setTimeout,clearTimeout,document:{}};vm.runInNewContext(acct,accountCtx);
const oldAccount=accountCtx.window.BOMAccounting349.get();accountCtx.selectedUnitId=3;resolveAcct({rows:[{id:1}]});check(await oldAccount===null,'old Accounting journal response rejected after BU change');
check(read('REQUIREMENTS_MASTER.md').includes('V30.51.0 — Dependency-safe optional read-module loading')&&read('REQUIREMENTS_MASTER.md').includes('Mandatory regression gate — V30.46.0+'),'permanent selective loading and regression rules retained');
console.log(`V30.51 FRONTEND HARDENING QA PASS (${passed} checks)`);
})().catch(e=>{console.error('V30.51 QA FAILED',e.stack||e);process.exitCode=1});
