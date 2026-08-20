const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const path=require('path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'public','client.js'),'utf8');
const start=src.indexOf('async function excavatorSupplierMachines(id){');
const end=src.indexOf('async function deleteExcavatorSupplierMachine',start);
assert(start>=0 && end>start,'Supplier Machines function not found');
const fnSource=src.slice(start,end);
assert(!fnSource.includes('machine.asset_no'),'Undefined machine.asset_no reference still exists');
assert(fnSource.includes("a.asset_no||'—'"),'Purchased machine asset number is not rendered from the current row');
assert(fnSource.includes('Unable to load supplier machines'),'Supplier Machines error handling is missing');

async function runSuccess(){
  let html=''; let toastText='';
  const ctx={
    api:async()=>({supplier:{name:'Supplier A'},listed:[],purchased:[{id:5,asset_no:'EX-0005',machine_name:'Doosan DX140',make:'Doosan',model:'DX140',serial_no:'SN5',purchase_date:'2026-08-01',purchase_price:25000000,lifecycle_stage:'Purchased'}]}),
    esc:v=>String(v??''),money:v=>Number(v||0).toFixed(2),modal:v=>{html=v},toast:v=>{toastText=v},console
  };
  vm.createContext(ctx); vm.runInContext(fnSource+';this.testFn=excavatorSupplierMachines;',ctx);
  await ctx.testFn(1);
  assert(html.includes('EX-0005'),'Purchased machine deal number did not render');
  assert(html.includes('Doosan DX140'),'Purchased machine name did not render');
  assert.strictEqual(toastText,'','Success path unexpectedly showed an error');
}
async function runFailure(){
  let toastText='';
  const ctx={api:async()=>{throw new Error('backend unavailable')},esc:v=>String(v??''),money:v=>String(v??0),modal:()=>{},toast:v=>{toastText=v},console};
  vm.createContext(ctx); vm.runInContext(fnSource+';this.testFn=excavatorSupplierMachines;',ctx);
  await ctx.testFn(1);
  assert(toastText.includes('Unable to load supplier machines'),'Failure path did not show a visible error');
}
(async()=>{await runSuccess();await runFailure();console.log('V26.8 Supplier Machines QA: PASS')})().catch(e=>{console.error(e);process.exit(1)});
