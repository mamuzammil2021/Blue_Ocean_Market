'use strict';
// Disposable PostgreSQL SQL-engine harness. Production uses the pg network
// driver and DATABASE_URL; PGlite is never a production dependency/entry point.
(async()=>{
 if(process.env.APP_ENV!=='testing')throw Error('APP_ENV=testing is required');
 if(!process.env.DATABASE_URL){
 const {PGlite}=require('@electric-sql/pglite');
 const p=new PGlite(process.env.PG_TEST_DATA_DIR||undefined);await p.waitReady;
 await p.exec('SET search_path TO bom,pg_catalog; SET timezone TO UTC');
 let tail=Promise.resolve();
 async function acquire(){let release;const next=new Promise(r=>release=r),old=tail;tail=next;await old;return release}
 const run=async(sql,values=[])=>{
  if(values.length)return p.query(sql,values);
  const result=(await p.exec(sql)).at(-1)||{rows:[]};
  if(/^\s*COMMIT\s*$/i.test(sql))result.command='COMMIT';
  return result;
 };
 globalThis[Symbol.for('bom.postgres.test.pool')]={
  async query(sql,values){const release=await acquire();try{return await run(sql,values)}finally{release()}},
  async connect(){const release=await acquire();return {query:run,release}},
  async end(){await p.close()},
 };
 }
 const server=await require('../../server/server');
 if(process.send){
  process.on('message',async message=>{
   if(!['query','maintenance','sales-event'].includes(message?.type))return;
   try{
    const value=message.type==='sales-event'?await require('../../server/customer-sales').receiveEvent(server.db,...message.args):message.type==='maintenance'?await require('../../server/postgres/maintenance').perform(server.db,require('../../server/runtime-storage'),message.options):message.raw?await server.db.query(message.sql,message.args||[]):await server.db.prepare(message.sql)[message.mode](...(message.args||[]));
    process.send({type:'query-result',id:message.id,value:message.raw?{rows:value.rows,rowCount:value.rowCount}:value});
   }catch(e){process.send({type:'query-result',id:message.id,error:{message:e.message,code:e.code,status:e.status}})}
  });
  process.send({type:'ready',routes:server.app.router.stack.filter(l=>l.route&&typeof l.route.path==='string').map(l=>({path:l.route.path,methods:Object.keys(l.route.methods)}))});
 }
})().catch(e=>{console.error(e.stack);process.exitCode=1});
