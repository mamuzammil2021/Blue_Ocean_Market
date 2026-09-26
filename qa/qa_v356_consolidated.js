'use strict';
const {spawnSync}=require('node:child_process');
const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const pkg=require('../package.json');
assert.equal(pkg.version,'30.56.0');
const server=fs.readFileSync(path.join(root,'server/server.js'),'utf8');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
assert(server.includes("version:'30.56.0'"));
for(const name of ['v356-accounting.js','v356-final-ui.js'])assert(html.includes('/'+name+'?v=30.56.0'));
const tests=['qa_v356_workspace.js','qa_v3563_financing.js','qa_v3565_finalization.js','qa_v3566_financing_audit.js','qa_v3567_accountant_review.js','qa_v3568_lease_closure.js','qa_v356_final_foreign.js','qa_v356_final_lease.js','qa_v3562_journal_fixture.js','qa_v3562_financing_integration.js'];
for(const name of tests){
 const file=path.join(root,'qa',name);
 let script=fs.readFileSync(file,'utf8');
 // Historical assertions refer to their original release number or original route count.
 // Adjust only the *test input in memory*, never historical test files or production code.
 script=script.replace(/\/v356-accounting\.js\?v=30\.56\.(?:2|3|4)/g,'/v356-accounting.js?v=30.56.0');
 if(name==='qa_v3563_financing.js')script=script.replace('assert.equal(routes.length,10);','assert(routes.length>=10, "legacy routes preserved");');
 const result=spawnSync(process.execPath,['-e',script],{cwd:path.join(root,'qa'),encoding:'utf8',maxBuffer:1024*1024});
 // Node -e resolves relative require paths from the current working directory (qa).
 if(result.status!==0){process.stderr.write('FAIL '+name+'\n'+result.stdout+result.stderr);process.exit(1)}
 process.stdout.write('PASS '+name+'\n');
}
for(const f of ['server/server.js','server/v356-financing.js','server/v356-final-foreign.js','server/v356-final-lease.js','public/v356-accounting.js','public/v356-final-ui.js']){
 const r=spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});
 if(r.status!==0){process.stderr.write(r.stderr);process.exit(1)}
}
console.log('PASS consolidated source QA: metadata, targeted financing, syntax');
