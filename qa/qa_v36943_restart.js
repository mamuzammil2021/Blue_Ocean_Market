'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto'),assert=require('assert/strict');
(async()=>{let f,child;const root=path.resolve(__dirname,'..'),baseline=process.env.BOM_BASELINE_DIR;try{
assert(baseline,'Set BOM_BASELINE_DIR to protected V30.69.42 source');
f=await require(path.join(baseline,'qa/fx_fixture')).fixture();
const stop=async c=>{if(c?.exitCode===null)await new Promise(r=>{c.once('exit',r);c.kill('SIGTERM')})};
const start=async cwd=>{child=cp.spawn(process.execPath,['server/server.js'],{cwd,env:f.env,stdio:['ignore','pipe','pipe']});let log='';child.stdout.on('data',x=>log+=x);child.stderr.on('data',x=>log+=x);let ready=false;for(let i=0;i<200;i++){if(child.exitCode!==null)throw Error(log);try{if((await fetch(f.base+'/api/health')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,50))}assert(ready,'Startup failed');await new Promise(r=>setTimeout(r,500));};
await stop(f.child);f.env.LOCAL_TEST_MODE='false';
// Fixtures deliberately insert historical-style rows directly. Let the ORIGINAL
// server normalize those rows before comparing the UI-only release, so existing
// baseline migrations are not mistaken for UI-release database changes.
await start(baseline);await stop(child);
const tables=f.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(x=>x.name),ignored={numbering_reference_definitions:['updated_at'],platform_entities:['updated_at'],platform_modules:['updated_at']};
const snapshot=()=>Object.fromEntries(tables.map(t=>[t,f.db.prepare('SELECT * FROM "'+t+'" ORDER BY rowid').all().map(r=>{for(const k of ignored[t]||[])delete r[k];return r})]));
const before=snapshot(),schema=f.db.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' ORDER BY name").all();
for(let i=0;i<2;i++){await start(root);assert.deepEqual(f.db.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' ORDER BY name").all(),schema);assert.deepEqual(snapshot(),before);assert.deepEqual(f.db.pragma('foreign_key_check'),[]);console.log('PASS '+(i?'Repeated QA release startup':'V30.69.42 → V30.69.43 QA release startup')+' preserves '+tables.length+' tables and protected row values');await stop(child);}
fs.writeFileSync('qa/evidence/36943-upgrade.json',JSON.stringify({status:'PASS',tables:tables.length,baseline:'30.69.42',version:'30.69.43',restarts:2,baseline_normalization_restart:true,ignored_registry_refresh_timestamps:ignored,new_database_migration:false,production_data_used:false},null,2));
}catch(e){console.error(e);process.exitCode=1}finally{if(child?.exitCode===null)child.kill('SIGTERM');f?.db.close()}})();
