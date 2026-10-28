'use strict';
// Reviewed replacements that require subsystem behavior changes rather than
// mechanical await propagation. Run after convert-runtime.cjs, before tests.
const fs=require('fs'),path=require('path'),parser=require('@babel/parser'),traverse=require('@babel/traverse').default,generator=require('@babel/generator').default;
const root=path.resolve(__dirname,'../..');
function replaceFunction(file,name,source){
 const target=path.join(root,file),input=fs.readFileSync(target,'utf8'),ast=parser.parse(input,{sourceType:'script'});
 const fn=parser.parse(source,{sourceType:'script'}).program.body[0];let count=0;
 traverse(ast,{FunctionDeclaration(p){if(p.node.id.name===name){p.replaceWith(fn);p.skip();count++}}});
 if(count!==1)throw Error(`Expected exactly one ${name} in ${file}, found ${count}`);
 fs.writeFileSync(target,generator(ast,{retainLines:true,comments:true},input).code+'\n');
}
replaceFunction('server/v290.js','processQueue',`async function processQueue(limit=40,timeBudgetMs=25){
 if(processing)return {busy:true,processed:0,remaining:Number((await db.prepare('SELECT COUNT(*) c FROM accounting_sync_queue').get()).c)};
 processing=true;let processed=0;const started=Date.now(),hardLimit=Math.max(1,Math.min(Number(limit)||40,100));
 try{
  while(processed<hardLimit){
   if(processed&&Date.now()-started>=Math.max(5,Number(timeBudgetMs)||25))break;
   const claimed=await db.transaction(async()=>{
    await db.query('SELECT pg_advisory_xact_lock_shared(1112493391,3)');
    await db.query("SELECT set_config('bom.internal_sync','on',true)");
    const q=await db.prepare('SELECT * FROM accounting_sync_queue WHERE attempts<5 ORDER BY queued_at,finance_entry_id FOR UPDATE SKIP LOCKED LIMIT 1').get();
    if(!q)return false;
    try{
     await db.transaction(async()=>syncFinanceEntry(q.finance_entry_id));
    }catch(e){
     const f=await db.prepare('SELECT * FROM finance_entries WHERE id=?').get(q.finance_entry_id);
     if(f){await db.prepare("UPDATE finance_entries SET accounting_status='Error' WHERE id=?").run(f.id);await addException(f,'ACCOUNTING_SYNC_ERROR',String(e.message||e),'Critical')}
     await db.prepare('UPDATE accounting_sync_queue SET attempts=attempts+1,last_error=?,queued_at=bom.utc_now() WHERE finance_entry_id=?').run(String(e.message||e).slice(0,1000),q.finance_entry_id);
    }
    return true;
   },{isolation:'SERIALIZABLE'});
   if(!claimed)break;processed++;
  }
 }finally{processing=false}
 return {busy:false,processed,remaining:Number((await db.prepare('SELECT COUNT(*) c FROM accounting_sync_queue WHERE attempts<5').get()).c),elapsed_ms:Date.now()-started};
}`);

// Replace the legacy file-copy backup handler while preserving its existing
// authorization, failure logging and critical-notification path.
{
 const file=path.join(root,'server/v319.js');let source=fs.readFileSync(file,'utf8');
 const start=source.indexOf('const dbPath = db.name;if (!dbPath');
 if(start<0)throw Error('Manual backup replacement anchor missing');
 const end=source.indexOf('} catch (e)',start);
 const body=`const result=await require('./postgres/maintenance').perform(db,require('./runtime-storage'),{action:'backup',actor:req.user,reason});await audit(req.user,'system_backup',null,'create',JSON.stringify({name:result.backup_name,reason,provider:'postgresql'}));res.json(result); `;
 source=source.slice(0,start)+body+source.slice(end);
 source=source.replace("const dbPath = db.name || '',dbSize = dbPath && dbPath !== ':memory:' && fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0", "const dbPath = 'PostgreSQL',dbSize = Number((await db.one('SELECT pg_database_size(current_database())::text AS bytes')).bytes)");
 fs.writeFileSync(file,source);
}
{
 const file=path.join(root,'server/server.js');let source=fs.readFileSync(file,'utf8');
 const start=source.indexOf('let shuttingDown = false;');
 const end=source.indexOf("process.on('SIGTERM'",start);
 if(start<0||end<0)throw Error('Shutdown replacement anchor missing');
 source=source.slice(0,start)+`let shuttingDown=false;function gracefulShutdown(signal){if(shuttingDown)return;shuttingDown=true;console.log(signal+' received; closing HTTP server and PostgreSQL pool.');const force=setTimeout(()=>process.exit(1),25000);force.unref();httpServer.close(async()=>{try{await db.close();clearTimeout(force);process.exit(0)}catch(e){console.error('PostgreSQL shutdown failed',e.code||e.message);process.exit(1)}});} `+source.slice(end);
 // Readiness must check PostgreSQL, not only storage/version/module flags.
 const ast=parser.parse(source,{sourceType:'script'});
 traverse(ast,{CallExpression(p){
  const c=p.node.callee;if(c.type!=='MemberExpression'||c.property.name!=='get'||p.node.arguments[0]?.value!=='/api/health')return;
  const fn=p.node.arguments.at(-1);
  if(!['ArrowFunctionExpression','FunctionExpression'].includes(fn.type))throw Error('Health handler shape changed');
  fn.async=true;fn.body=parser.parse(`async function health(req,res){try{const ready=await db.readiness();await require('./postgres/migrate').assertMigrationsCurrent(db);if(!ready.ready)return res.status(503).json({ok:false,database:'unavailable'});return res.json({ok:true,version:require('../package.json').version,database:'postgresql',schema:ready.schema,storage:storage.status()})}catch(e){return res.status(503).json({ok:false,database:'unavailable',code:e.code||'DB_NOT_READY'})}}`).program.body[0].body;
 }});
 fs.writeFileSync(file,generator(ast,{retainLines:true,comments:true},source).code+'\n');
}
console.log('Reviewed queue, backup, health and shutdown overrides applied');
