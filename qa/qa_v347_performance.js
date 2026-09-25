#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');let passed=0;
function ok(value,label){assert.ok(value,label);passed++;console.log('PASS '+label)}
async function main(){
 const pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json')),server=read('server/server.js'),doc=read('server/v3241.js'),html=read('public/index.html'),run=read('public/runtime-v30392.js'),lazy=read('public/v347-loader.js'),views=read('public/v347-client.js'),base=read('public/client.js'),perf=read('server/v346-performance.js');
 ok(pkg.version==='30.54.0'&&lock.version==='30.54.0'&&lock.packages[''].version==='30.54.0','release package and lock identities');
 ok(server.includes("version:'30.54.0'")&&server.includes('Blue Ocean Market V30.54.0 running'),'server and health identity');
 ok(html.includes('/v347-loader.js?v=30.54.0')&&!html.includes('<script src="/v347-client.js'),'workspaces are actually lazy, not eagerly duplicated');
 ok(html.indexOf('/v345-client.js')<html.indexOf('/v346-client.js')&&html.indexOf('/v346-client.js')<html.indexOf('/v347-loader.js'),'protected action feedback and read scheduler load first');
 ok(lazy.includes("['tasks','approvals','documents'].includes(screen)")&&lazy.includes('await ensure()')&&lazy.includes('return false'),'guarded lazy module load and legacy fallback');
 ok(lazy.includes('try{loadView=window.loadView}'),'historical direct navigation uses guarded lazy wrapper');
 ok(views.includes('hostOnly=hostOnly===true'),'legacy navigator DOM argument does not suppress headers/filter controls');
 ok(lazy.includes('first_useful_views')&&lazy.includes('samples.length>50'),'bounded first-useful-view metrics');
 ok((run.match(/new MutationObserver/g)||[]).length===15&&run.includes("BOMMutationHub.register('v326-account-label'"),'audited historical observer constructors retired; shared replacements verified');
 for(const name of ['v319-accounting-layout','v325-payment-selectors','v333-scoped-wrappers','v334-stable-ui'])ok(run.includes("BOMMutationHub.register('"+name+"'"),'shared audited enhancer '+name);
 ok(run.includes('const saleObserver381=new MutationObserver')&&run.includes('const sensitiveObserver317=new MutationObserver')&&run.includes('new MutationObserver(sync).observe(sel'),'sensitive sale/access/account protection remains');
 ok(server.includes("app.get('/api/v347/tasks/page',auth,allow('tasks','performance')")&&server.includes("app.get('/api/tasks',auth,allow('tasks','performance')"),'Tasks paged API plus legacy API retained');
 ok(server.includes("app.get('/api/v347/approvals/page',auth,allow('approvals')")&&server.includes("app.get('/api/approvals',auth,allow('approvals')"),'Approvals paged API plus legacy API retained');
 ok(doc.includes("app.get('/api/v347/documents/page',auth,allow('documents')")&&doc.includes("app.get('/api/documents',auth,allow('documents')"),'Documents paged API plus legacy API retained');
 ok(server.includes("if(!isWorkManager(req.user)){where+=' AND t.owner_id=?'")&&server.includes("unitScope(req,'t.business_unit_id')"),'Tasks owner and BU scope before pagination');
 ok(server.includes('const total=db.prepare(\'SELECT COUNT(*) total\'+from)')&&server.includes('LIMIT ? OFFSET ?'),'Tasks SQL scoped count/limit before transfer');
 ok(server.includes('const reviewers=db.prepare(\'SELECT id,name,role,business_unit_id,active FROM users WHERE active=1\').all()')&&server.includes('approvalClientRow(a,req.user,reviewers)'),'Approval reviewer data batched for legacy list');
 ok(server.includes('approvalClientRow(a,req.user,users)')&&server.includes('approvalCanReview(a,user)'),'Approval authorization reused in paged projections');
 ok(doc.includes("if(section==='archived'&&!canViewArchive)return res.status(403)")&&doc.includes('const safeScope=')&&doc.includes('map(d=>clientDoc(req,d))'),'Document archive permissions preserved in SQL and response');
 ok(doc.includes('const size=[25,50,100].includes')&&doc.includes('LIMIT ? OFFSET ?'),'Document SQLite pagination 25/50/100');
 ok(views.includes('window.v3241DocumentTable')&&run.includes('window.v3241DocumentTable=docTable'),'Existing document action renderer shared, no duplicate action logic');
 ok(views.includes('taskDetail(')&&views.includes('approvalRowActions(x)')&&views.includes('docForm()'),'Existing task/approval/document action paths retained');
 ok(views.includes('data-server-paged="1"')&&views.includes('window.v347Pager')&&views.includes('window.v347Search'),'Canonical paged list UI and filter controls');
 ok(base.includes('_i18nBatchSeen=new WeakSet()')&&base.includes('const roots=[]')&&base.includes('roots.some('),'Korean translation batches and deduplicates nested DOM additions');
 ok(perf.includes('monitorEventLoopDelay')&&perf.includes('p95:sample(loopLag.percentile(95)')&&perf.includes('if(loopLag)loopLag.enable()'),'Opt-in event-loop histogram available');
 ok(read('REQUIREMENTS_MASTER.md').includes('Mandatory regression gate — V30.46.0+'),'Permanent regression rule inherited');
 // Evaluate actual loader in an isolated browser-like fake: single in-flight module; fail-safe legacy navigation.
 let appends=[],called=0;const scriptNodes=[];const content={innerHTML:'',querySelector:()=>null};const context={window:{loadView:()=>{called++;return 'old-view'},BOMProgressive:{viewShell:()=>'<div class="skeleton">Loading</div>'}},view:'tasks',document:{createElement:()=>({}),head:{appendChild:x=>{appends.push(x);scriptNodes.push(x)}},getElementById:()=>content},performance:{now:()=>123},console,Promise};
 vm.runInNewContext(lazy,context);let a=context.window.loadView(),b=context.window.loadView();ok(scriptNodes.length===1,'lazy-loader deduplicates simultaneous route module fetches');
 scriptNodes[0].onerror();await Promise.all([a,b]);ok(called===2&&context.window.BOMLazy347.diagnostics().failed===1,'lazy-loader error falls back to original view');
 context.window.BOMPagedWorkspaces347={};await context.window.loadView();ok(called===3&&scriptNodes.length===1,'loaded module reused without new fetch');
 console.log(`\nV30.54.0 PERFORMANCE QA PASS (${passed} checks)`);
}
main().catch(e=>{console.error('V30.47 QA FAILURE:',e.stack||e);process.exitCode=1});
