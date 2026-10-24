'use strict';
// Preserve the full initial result, rerun only failed suites after a correction.
const fs=require('fs'),cp=require('child_process'),crypto=require('crypto'),assert=require('assert/strict');
const file='qa/evidence/36941-release.json',prior=fs.readFileSync(file),result=JSON.parse(prior),hash=crypto.createHash('sha256').update(prior).digest('hex');fs.mkdirSync('qa/modernization/evidence41',{recursive:true});fs.writeFileSync('qa/modernization/evidence41/release-before-resume.json',prior);
require('../server/frontend-integrity').assertFrontendIntegrity();assert.equal(require('../package.json').version,'30.69.41');for(const dir of ['server','public'])for(const name of fs.readdirSync(dir).filter(x=>x.endsWith('.js')))assert.equal(cp.spawnSync(process.execPath,['--check',dir+'/'+name]).status,0,name);
for(const check of result.checks)if(check.status==='FAIL'||check.suite==='qa_v36941_ui_contract.js'){
 const start=Date.now(),r=cp.spawnSync(process.execPath,['qa/'+check.suite],{encoding:'utf8',timeout:360000,env:process.env}),output=(r.stdout||'')+(r.stderr||'');console.log(output);check.previous_status=check.status;check.status=r.status===0?'PASS':'FAIL';check.duration_ms=Date.now()-start;check.passed_log_lines=output.split('\n').filter(x=>/^PASS\b|^✓/.test(x)).length;check.rerun_after_fix=true;
}
result.status=result.checks.every(x=>x.status==='PASS')?'PASS':'FAIL';result.resumed_from_sha256=hash;result.resume_reason='Append attachment translation pattern by copying the frozen catalogue; await report review response in browser test. Final frontend syntax and integrity checked again.';fs.writeFileSync(file,JSON.stringify(result,null,2));if(result.status!=='PASS')process.exitCode=1;
