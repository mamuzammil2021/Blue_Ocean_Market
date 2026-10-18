'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),root=path.resolve(__dirname,'..'),file=path.join(root,'qa/evidence/36932-release.json'),report=JSON.parse(fs.readFileSync(file));
if(report.status!=='PASS'||report.results.length!==43)throw Error('A complete passing 43-suite current run is required before this final affected-suite pass.');
const reruns=[
 ['Protected source and Excavator financial-handler integrity',process.env.BOM_PYTHON||'python3',['qa/qa_v36932_source_integrity.py']],
 ['October17 financial identity, native currencies, approval, operation rollback and downloads',process.execPath,['qa/qa_v36932_server.js']],
 ['Legacy supplier advance edit, evidence retries, rollback and audited void',process.execPath,['qa/qa_v36932_legacy_advances.js']],
 ['October17 authenticated browser acceptance and response recovery',process.env.BOM_PYTHON||'python3',['qa/browser_v36932_qa.py']],
 ['Protected .31 posted valuation migration, audited repair and repeat-start',process.execPath,['qa/qa_v36932_upgrade.js']],
 ['Pink Salt reference normalization, corrections, concurrency and rollback',process.execPath,['qa/qa_v36931_reference.js']],
 ['Pink Salt category, cost state, runtime reference and stale-read browser acceptance',process.env.BOM_PYTHON||'python3',['qa/browser_v36931_qa.py']],
 ['Single-entry shared exchange-rate server integrity',process.execPath,['qa/qa_v36930_shared_rate.js']],
 ['Single-entry rate authenticated browser acceptance',process.env.BOM_PYTHON||'python3',['qa/browser_v36930_shared_rate.py']],
 ['October15 focused cost locks, permissions and financial integrity',process.execPath,['qa/qa_v36929_qa15.js']]
];
for(const directory of ['server','public'])for(const f of fs.readdirSync(path.join(root,directory)))if(f.endsWith('.js')){const r=cp.spawnSync(process.execPath,['--check',path.join(root,directory,f)],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr)}
for(const [name,cmd,args] of reruns){console.log('RUN '+name);const start=Date.now(),r=cp.spawnSync(cmd,args,{cwd:root,env:{...process.env,BOM_NODE:process.execPath},encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024}),output=(r.stdout||'')+(r.stderr||''),checks=output.split('\n').filter(x=>x.startsWith('PASS ')),item={name,status:r.status===0?'PASS':'FAIL',checks,elapsed_ms:Date.now()-start,final_targeted_rerun:true};let i=report.results.findIndex(x=>x.name===name);if(i<0)report.results.push(item);else report.results[i]=item;for(const c of checks)console.log(c);report.status=report.results.every(x=>x.status==='PASS')?'PASS':'FAIL';report.suite_count=report.results.length;report.functional_check_count=report.results.reduce((n,x)=>n+(x.checks||[]).length,0);fs.writeFileSync(file,JSON.stringify(report,null,2));if(r.status!==0){console.error(output);process.exit(1)}}report.version=require('../package.json').version;report.verification_method='Full 43-suite run plus final affected source, financial, legacy evidence, browser, upgrade and rate checks; the legacy advance suite brings current coverage to 44 groups.';report.production_data_used=false;fs.writeFileSync(file,JSON.stringify(report,null,2));console.log('RELEASE GATE PASS — '+report.functional_check_count+' checks in '+report.suite_count+' suites');
