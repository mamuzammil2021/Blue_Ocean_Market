const storage=require('../server/runtime-storage');
try{const s=storage.assertReady();console.log(JSON.stringify({...s,ok:true},null,2));process.exit(0)}catch(e){console.error(JSON.stringify({ok:false,error:e.message},null,2));process.exit(1)}
