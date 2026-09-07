const fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'blue-ocean-v312-'));
const data=path.join(temp,'data'),uploads=path.join(temp,'uploads');fs.mkdirSync(data);fs.mkdirSync(uploads);
const port=32000+Math.floor(Math.random()*1000);
const env={...process.env,PORT:String(port),JWT_SECRET:'BlueOceanV312RuntimeSmokeSecret_2026_123456789',ADMIN_EMAIL:'admin@blueocean.local',ADMIN_PASSWORD:'BlueOceanAdmin123!',LOCAL_TEST_MODE:'true',LOCAL_TEST_ADMIN_EMAIL:'admin@blueocean.local',LOCAL_TEST_ADMIN_PASSWORD:'BlueOceanAdmin123!',NODE_ENV:'development',DATA_DIR:data,UPLOAD_DIR:uploads,SEED_DEMO_USERS:'false',SEED_DEMO_DATA:'false'};
const child=cp.spawn(process.execPath,['server/server.js'],{cwd:root,env,stdio:['ignore','pipe','pipe']});
let output='',done=false;
child.stdout.on('data',d=>{output+=d.toString();process.stdout.write(d)});child.stderr.on('data',d=>{output+=d.toString();process.stderr.write(d)});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{try{
  for(let i=0;i<80;i++){if(output.includes('running on port'))break;if(child.exitCode!==null)throw new Error('Server exited before startup');await sleep(100)}
  const health=await fetch(`http://127.0.0.1:${port}/api/health`).then(r=>r.json());if(!health.ok||health.version!=='30.12.0')throw new Error('Health/version check failed');console.log('PASS runtime health');
  const login=await fetch(`http://127.0.0.1:${port}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@blueocean.local',password:'BlueOceanAdmin123!'})});const body=await login.json();if(!login.ok||!body.token||body.user?.role!=='CEO / Owner')throw new Error('Local CEO login smoke failed: '+JSON.stringify(body));console.log('PASS runtime local CEO login');
  const auth={'Authorization':'Bearer '+body.token};
  const unitsRes=await fetch(`http://127.0.0.1:${port}/api/business-units`,{headers:auth}),units=await unitsRes.json(),pink=units.find(x=>x.name==='Pink Salt');if(!unitsRes.ok||!pink)throw new Error('Pink Salt business unit unavailable in runtime smoke');const h={...auth,'x-business-unit-id':String(pink.id)};
  const postJson=async(path,payload)=>{const r=await fetch(`http://127.0.0.1:${port}${path}`,{method:'POST',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify(payload)});let j={};try{j=await r.json()}catch(_){}return {r,j}};
  const pcsCreate=await postJson('/api/pink-salt/packaging',{sku:'QA-PCS-001',name:'QA Pouch',category:'Pouch / Bag',unit:'pcs',reorder_level:10,last_unit_cost_krw:20});if(!pcsCreate.r.ok||!pcsCreate.j.id)throw new Error('Create pcs packaging failed: '+JSON.stringify(pcsCreate.j));
  const badReorder=await postJson('/api/pink-salt/packaging',{sku:'QA-PCS-BAD',name:'QA Bad Pouch',category:'Pouch / Bag',unit:'pcs',reorder_level:0.5,last_unit_cost_krw:20});if(badReorder.r.status!==400)throw new Error('Discrete packaging accepted decimal reorder level');console.log('PASS discrete reorder level rejects decimals');
  const receive=async(id,qty,ref)=>{const fd=new FormData();fd.set('movement_date','2026-09-04');fd.set('quantity',String(qty));fd.set('calculation_mode','Unit Cost');fd.set('unit_cost_krw','20');fd.set('total_amount_krw',String(Number(qty)*20));fd.set('supplier_name','QA Packaging Supplier');fd.set('payment_method','Bank');fd.set('reference',ref);fd.set('receipt',new Blob(['qa evidence'],{type:'text/plain'}),'qa-evidence.txt');const r=await fetch(`http://127.0.0.1:${port}/api/pink-salt/packaging/${id}/receive`,{method:'POST',headers:h,body:fd});let j={};try{j=await r.json()}catch(_){}return {r,j}};
  const pcsReceive=await receive(pcsCreate.j.id,100,'QA-PCS-100');if(!pcsReceive.r.ok||Number(pcsReceive.j.available_quantity)!==100)throw new Error('Whole-number packaging receive failed: '+JSON.stringify(pcsReceive.j));console.log('PASS packaging quantity 100 accepted');
  const kgCreate=await postJson('/api/pink-salt/packaging',{sku:'QA-KG-001',name:'QA Bulk Packaging',category:'Other',unit:'kg',reorder_level:0.5,last_unit_cost_krw:20});if(!kgCreate.r.ok||!kgCreate.j.id)throw new Error('Create kg packaging failed: '+JSON.stringify(kgCreate.j));
  const kgReceive=await receive(kgCreate.j.id,1.25,'QA-KG-1.25');if(!kgReceive.r.ok||Math.abs(Number(kgReceive.j.available_quantity)-1.25)>1e-9)throw new Error('Decimal kg packaging receive failed: '+JSON.stringify(kgReceive.j));console.log('PASS kg measurement quantity 1.25 accepted');
  const badWaste=await postJson('/api/pink-salt/waste',{waste_date:'2026-09-04',waste_type:'Damage / Loss',source_type:'Packaging',source_id:pcsCreate.j.id,quantity:0.5,reason:'QA decimal count rejection'});if(badWaste.r.status!==400)throw new Error('Discrete packaging waste accepted decimal count');
  const kgWaste=await postJson('/api/pink-salt/waste',{waste_date:'2026-09-04',waste_type:'Damage / Loss',source_type:'Packaging',source_id:kgCreate.j.id,quantity:0.25,reason:'QA kg measurement'});if(!kgWaste.r.ok)throw new Error('kg packaging waste rejected valid decimal: '+JSON.stringify(kgWaste.j));console.log('PASS waste quantity precision follows packaging unit');
  done=true;process.exitCode=0;
}catch(e){console.error('RUNTIME SMOKE FAIL',e);process.exitCode=1}finally{child.kill('SIGTERM');await sleep(150);try{fs.rmSync(temp,{recursive:true,force:true})}catch(_){}}})();
process.on('exit',()=>{if(!done&&child.exitCode===null)try{child.kill('SIGKILL')}catch(_){}});
