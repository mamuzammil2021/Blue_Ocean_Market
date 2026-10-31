'use strict';
const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
async function launch({directory,overrides={}}={}){
 const root=path.resolve(__dirname,'../..'),temp=directory||fs.mkdtempSync(path.join(os.tmpdir(),'bom-postgres-e2e-'));
 const password='Qa!'+crypto.randomBytes(18).toString('hex');
 const port=32000+Math.floor(Math.random()*9000),base=`http://127.0.0.1:${port}`;
 const env={...process.env,APP_ENV:'testing',NODE_ENV:'development',PORT:String(port),JWT_SECRET:crypto.randomBytes(48).toString('hex'),ADMIN_EMAIL:'qa@blueocean.local',ADMIN_PASSWORD:password,LOCAL_TEST_MODE:'false',SEED_DEMO_USERS:'false',SEED_DEMO_DATA:'false',DATA_DIR:path.join(temp,'data'),UPLOAD_DIR:path.join(temp,'uploads'),PG_TEST_DATA_DIR:path.join(temp,'postgres'),...overrides};
 let admin,nativeName;
 if(process.env.PG_TEST_SERVER_URL){
  admin=new (require('pg').Pool)({connectionString:process.env.PG_TEST_SERVER_URL,max:1});
  nativeName='bom_qa_'+crypto.randomBytes(10).toString('hex');
  await admin.query('CREATE DATABASE "'+nativeName+'"');
  const target=new URL(process.env.PG_TEST_SERVER_URL);target.pathname='/'+nativeName;env.DATABASE_URL=target.toString();
 }else delete env.DATABASE_URL;
 let child,logs='',sequence=0,closed=false,routes=[];
 const pending=new Map();
 async function start(){
  child=cp.fork(path.join(root,'qa/postgres/start-test-server.cjs'),[],{cwd:root,env,stdio:['ignore','pipe','pipe','ipc']});
  child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);
  await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>{child.kill('SIGTERM');reject(Error('PostgreSQL test startup timeout: '+logs))},120000);
   child.on('message',m=>{
    if(m?.type==='ready'){routes=m.routes||[];clearTimeout(timeout);resolve()}
    if(m?.type==='query-result'){
     const request=pending.get(m.id);if(!request)return;pending.delete(m.id);clearTimeout(request.timeout);
     m.error?request.reject(Object.assign(Error(m.error.message),m.error)):request.resolve(m.value);
    }
   });
   child.once('exit',(code,signal)=>{clearTimeout(timeout);for(const request of pending.values()){clearTimeout(request.timeout);request.reject(Error('PostgreSQL test process exited: '+logs.slice(-8000)))}pending.clear();if(code||signal)reject(Error('PostgreSQL test startup failed: '+logs))});
  });
 }
 await start();
 const rpc=(sql,args,mode,raw=false)=>new Promise((resolve,reject)=>{
  if(closed||!child.connected)return reject(Error('PostgreSQL test connection is closed'));
  const id=++sequence,timeout=setTimeout(()=>{pending.delete(id);reject(Error('PostgreSQL test query timeout'))},120000);
  pending.set(id,{resolve,reject,timeout});child.send({type:'query',id,sql,args,mode,raw});
 });
 const db={afterCommit(callback){queueMicrotask(()=>Promise.resolve().then(callback).catch(e=>console.error(e)))},prepare(sql){return {all:(...args)=>rpc(sql,args,'all'),get:(...args)=>rpc(sql,args,'get'),run:(...args)=>rpc(sql,args,'run')}},query:(sql,args=[])=>rpc(sql,args,null,true),async close(){},async foreignKeyCheck(){return (await rpc("SELECT c.conname FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='bom' AND c.contype='f' AND NOT c.convalidated",[],null,true)).rows}};
 const maintenance=options=>new Promise((resolve,reject)=>{
  const id=++sequence,timeout=setTimeout(()=>{pending.delete(id);reject(Error('Maintenance test timeout'))},120000);
  pending.set(id,{resolve,reject,timeout});child.send({type:'maintenance',id,options});
 });
 const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:env.ADMIN_EMAIL,password:env.ADMIN_PASSWORD})}).then(r=>r.json());
 if(!login.token){await stop();throw Error('PostgreSQL fixture login failed: '+JSON.stringify(login)+'\n'+logs)}
 async function stop(){
  if(!child||child.exitCode!==null)return;
  await new Promise(resolve=>{const timer=setTimeout(()=>{child.kill('SIGKILL')},10000);child.once('exit',()=>{clearTimeout(timer);resolve()});child.kill('SIGTERM')});
 }
 async function close(){closed=true;await stop();if(admin){await admin.query('DROP DATABASE IF EXISTS "'+nativeName+'" WITH (FORCE)');await admin.end();admin=null}fs.writeFileSync(path.join(temp,'application.log'),logs);if(process.env.PG_TEST_DEBUG_LOG==='true')console.error(logs.slice(-20000))}
 async function restart(){await stop();closed=false;await start();return child}
 const salesEvent=(...args)=>new Promise((resolve,reject)=>{const id=++sequence,timeout=setTimeout(()=>{pending.delete(id);reject(Error('Sales event test timeout'))},120000);pending.set(id,{resolve,reject,timeout});child.send({type:'sales-event',id,args})});
 return {salesEvent,root,temp,env,password:env.ADMIN_PASSWORD,base,login,db,maintenance,get child(){return child},get routes(){return routes},logs:()=>logs,close,restart};
}
module.exports={launch};
