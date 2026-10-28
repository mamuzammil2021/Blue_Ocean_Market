'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {fixture}=require('./fx_fixture.cjs');
(async()=>{
 let f;
 try{
  f=await fixture();
  const paths=[...new Set(f.routes?.filter(r=>r.methods.includes('get')).map(r=>r.path)||[])];
  // The low-level harness exposes the complete Express route inventory.
  const selected=paths.filter(p=>p.startsWith('/api/')&&!p.includes(':')&&!/pdf|download|export|backup|test-reset/i.test(p));
  assert(selected.length>100,'Route inventory must contain the real application routes');
  const results=[];
  for(const path of selected){
   const response=await f.api('GET',path);
   results.push({path,status:response.status,...(response.status>=500?{body:response.j}:{})});
  }
  const errors=results.filter(r=>r.status>=500);
  fs.writeFileSync('qa/evidence/postgres-get-route-audit.json',JSON.stringify({total:results.length,errors,results},null,2));
  assert.deepEqual(errors,[]);
  console.log(`PASS ${results.length} static GET API routes without server errors`);
 }catch(e){console.error(e);process.exitCode=1}finally{await f?.close()}
})();
