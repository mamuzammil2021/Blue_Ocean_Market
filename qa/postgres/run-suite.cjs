'use strict';
// Each runtime fixture gets its own disposable database when PG_TEST_SERVER_URL
// is supplied. Production DATABASE_URL is never used as a test destination.
const cp=require('node:child_process'),fs=require('node:fs');
(async()=>{
 const directory='qa/evidence/postgres-regression-logs';fs.mkdirSync(directory,{recursive:true});
 const files=['routes.cjs','maintenance.cjs',...fs.readdirSync('qa/postgres/regressions').filter(f=>/^qa_.*\.cjs$/.test(f)).sort().map(f=>'regressions/'+f)];
 const results=[];
 for(const file of files){
  const start=Date.now();
  const result=await new Promise(resolve=>{
   const child=cp.spawn(process.execPath,['qa/postgres/'+file],{env:process.env});let log='';
   child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
   const timer=setTimeout(()=>child.kill('SIGKILL'),180000);
   child.on('exit',(code,signal)=>{clearTimeout(timer);fs.writeFileSync(directory+'/'+file.replaceAll('/','_')+'.txt',log);resolve({file,code,signal,checks:(log.match(/^PASS /gm)||[]).length,ms:Date.now()-start,...(code!==0?{error:log.slice(-3500)}:{})})});
  });
  results.push(result);fs.writeFileSync('qa/evidence/postgres-regression-run.json',JSON.stringify({engine:process.env.PG_TEST_SERVER_URL?'native-postgresql':'pglite',results},null,2));
  console.log(JSON.stringify(result));
 }
 if(results.some(r=>r.code!==0))process.exitCode=1;
})();
