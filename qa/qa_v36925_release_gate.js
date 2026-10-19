'use strict';
// Current release gate. Historical source-string gates are retained separately.
const fs=require('fs'),path=require('path'),cp=require('child_process');const root=path.resolve(__dirname,'..'),results=[];
function run(name,cmd,args,env={}){console.log('RUN '+name);const started=Date.now();const r=cp.spawnSync(cmd,args,{cwd:root,env:{...process.env,...env},encoding:'utf8',maxBuffer:8*1024*1024,timeout:180000});const output=(r.stdout||'')+(r.stderr||'');const checks=output.split('\n').filter(x=>x.startsWith('PASS '));results.push({name,status:r.status===0?'PASS':'FAIL',checks,elapsed_ms:Date.now()-started});for(const x of checks)console.log(x);if(r.status!==0){console.error(output.replace(/local test CEO login:.*\n/g,'disposable test account created\n'));throw new Error(name+' failed')}console.log('PASS '+name)}
(async()=>{try{
 for(const directory of ['server','public'])for(const f of fs.readdirSync(path.join(root,directory))){if(f.endsWith('.js')){const r=cp.spawnSync(process.execPath,['--check',path.join(root,directory,f)],{encoding:'utf8'});if(r.status!==0)throw new Error('Syntax: '+directory+'/'+f+' '+r.stderr)}}results.push({name:'All active server and public JavaScript syntax',status:'PASS'});
 run('October14 financial correction, statement and logout server acceptance',process.execPath,['qa/qa_v36925_server.js']);
 run('October14 account, fee, notification and reversal financial matrix',process.execPath,['qa/qa_v36925_extended.js']);
 run('Statement balances, date ranges, reversals and evidence integrity',process.execPath,['qa/qa_v36925_statement_integrity.js']);
 run('Preview-only arithmetic and strict API contract',process.execPath,['qa/qa_v36924_calculation.js']);
 run('Encoded static asset release integrity',process.execPath,['qa/qa_v36923_static_assets.js']);
 run('Application, Accounting and period-control runtime regression',process.execPath,['qa/runtime_smoke.js']);
 run('Financial integrity E2E',process.execPath,['qa/qa_v36920_fx_e2e.js']);
 run('Pink Salt workflow and reconciliation matrix',process.execPath,['qa/qa_v36920_workflows.js']);
 run('Permission and approval execution matrix',process.execPath,['qa/qa_v36920_permissions.js']);
 run('Excavator financial regression',process.execPath,['qa/qa_v36920_excavator.js']);
 if(!process.env.BOM_BASELINE_ZIP)throw new Error('BOM_BASELINE_ZIP is required for previous-version migration acceptance.');
 run('Previous-version migration and restart',process.execPath,['qa/qa_v36920_migration_restart.js']);
 run('October QA server controls, inventory and order atomicity',process.execPath,['qa/qa_v36921_controls.js']);
 run('October QA authenticated sales and receiving browser',process.env.BOM_PYTHON||'python3',['qa/browser_v36921_qa.py'],{BOM_NODE:process.execPath});
 run('Authenticated Chromium payment, correction and routing matrix',process.env.BOM_PYTHON||'python3',['qa/browser_v36920_fx.py'],{BOM_NODE:process.execPath});
 run('Approval detail read integrity and permission boundaries',process.execPath,['qa/qa_v36922_read_routes.js']);
 run('Authenticated system-wide routing and deep-link browser matrix',process.env.BOM_PYTHON||'python3',['qa/browser_v36922_routing.py'],{BOM_NODE:process.execPath});
 run('Native navigation and stale-gzip refresh browser regression',process.env.BOM_PYTHON||'python3',['qa/browser_v36923_refresh.py'],{BOM_NODE:process.execPath});
 run('Simplified Pink Salt payment and blur FX browser matrix',process.env.BOM_PYTHON||'python3',['qa/browser_v36924_payments.py'],{BOM_NODE:process.execPath});
 run('Scoped logout, repeated login, delayed responses and two-tab deep links',process.env.BOM_PYTHON||'python3',['qa/browser_v36925_auth.py'],{BOM_NODE:process.execPath});
 run('Actual bilingual statement PDFs and cache invalidation',process.execPath,['qa/qa_v36925_statement_pdf.js']);
 run('October14 authenticated 12-point browser acceptance',process.env.BOM_PYTHON||'python3',['qa/browser_v36925_qa14.py'],{BOM_NODE:process.execPath});
 fs.writeFileSync(path.join(root,'qa/evidence/36925-release.json'),JSON.stringify({status:'PASS',version:require('../package.json').version,node:process.version,results,production_data_used:false},null,2));console.log('CURRENT TEST GATE PASS — see coverage report for untested acceptance items');
 }catch(e){fs.writeFileSync(path.join(root,'qa/evidence/36925-release.json'),JSON.stringify({status:'FAIL',results,error:e.message},null,2));console.error(e.message);process.exitCode=1}
})();
