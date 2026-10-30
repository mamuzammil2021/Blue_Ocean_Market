'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
(async()=>{
 assert.equal(process.versions.node.split('.')[0],'22','Use the supported Node 22 release runtime');
 const p=require('../../package.json'),lock=require('../../package-lock.json');assert.equal(p.version,lock.version);assert.equal(p.version,lock.packages[''].version);
 require('../../server/frontend-integrity').assertFrontendIntegrity();
 let files=0;function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const name=dir+'/'+entry.name;if(entry.isDirectory())walk(name);else if(/\.(js|cjs)$/.test(name)){const r=cp.spawnSync(process.execPath,['--check',name],{encoding:'utf8'});assert.equal(r.status,0,name+' '+r.stderr);files++}}}
 for(const dir of ['server','public','scripts','qa/postgres'])walk(dir);
 const run=(args,env=process.env)=>new Promise((resolve,reject)=>{const child=cp.spawn(process.execPath,args,{env,stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Failed: '+args.join(' '))))});
 let admin,name,env={...process.env};
 try{
  if(env.PG_TEST_SERVER_URL){admin=new(require('pg').Pool)({connectionString:env.PG_TEST_SERVER_URL,max:1});name='bom_foundation_'+crypto.randomBytes(10).toString('hex');await admin.query('CREATE DATABASE "'+name+'"');const url=new URL(env.PG_TEST_SERVER_URL);url.pathname='/'+name;env.TEST_DATABASE_URL=url.toString()}
  await run(['--test','qa/postgres/connection.test.js','qa/postgres/database.test.js'],env);
 }finally{if(admin){if(name)await admin.query('DROP DATABASE IF EXISTS "'+name+'" WITH (FORCE)');await admin.end()}}
 await run(['scripts/postgres/check-runtime-sql.cjs']);
 await run(['qa/postgres/run-suite.cjs']);
 await run(['qa/postgres/oct28.cjs']);
 const suites=JSON.parse(fs.readFileSync('qa/evidence/postgres-regression-run.json'));
 const result={status:'PASS',version:p.version,node:process.version,engine:suites.engine,syntax_files:files,suites:suites.results.length,workflow_checks:suites.results.reduce((n,s)=>n+s.checks,0)+JSON.parse(fs.readFileSync('qa/evidence/oct28.json')).checks.length,tested_at:new Date().toISOString(),render_deployed:false,git_pushed:false};
 fs.writeFileSync('qa/evidence/postgres-release.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
})().catch(error=>{console.error(error);process.exitCode=1});
