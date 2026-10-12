'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('public/v3693-persistent-routing.js','utf8');
async function check(viewName,kind,id,section,handler){
 const calls=[], listeners={}, location={hash:`#${viewName}/${kind}/${id}?section=${section}&unit=2`};
 const ctx={window:{},location,document:{getElementById:()=>({})},console:{info(){},warn:console.warn},setTimeout:()=>0,setInterval:()=>0,clearInterval:()=>{},URLSearchParams,history:{replaceState(){},pushState(){}},me:{role:'CEO / Owner'},view:viewName,selectedUnitId:'2',render:()=>calls.push('shell')};
 ctx.window=ctx;ctx.window.addEventListener=(name,fn)=>listeners[name]=fn;
 ctx.window.BOMRouteCoreV3696={parse:()=>({view:viewName,kind,id,section,unit:'2',parts:[viewName,kind,String(id)]}),resolveUnit:()=>{},apply:()=>{}};
 ctx.window.loadView=async()=>{await new Promise(r=>process.nextTick(r));calls.push('module')};
 ctx.window[handler]=async()=>{calls.push('detail')};
 if(section&&kind==='buyer')ctx.window.v337BuyerSection=()=>calls.push('section');
 if(section&&viewName==='psSuppliers')ctx.window.psSupplierTab315=()=>calls.push('section');
 vm.createContext(ctx);vm.runInContext(src,ctx);
 await ctx.window.BOMPersistentRouting.restore();
 assert.deepStrictEqual(calls.slice(0,2),['module','detail'],`${viewName} loaded detail prematurely: ${calls}`);
 if(section&&(['buyer','supplier'].includes(kind)))assert(calls.includes('section')||viewName==='excavatorSuppliers');
 console.log('PASS',viewName,kind,'module -> detail',section||'');
}
(async()=>{
 await check('excavatorBuyers','buyer',13,'payments','excavatorBuyerDetail');
 await check('excavatorSuppliers','supplier',12,'accounts','v329SupplierOpen');
 await check('psImports','import',15,'','psImportDetail');
 await check('psSuppliers','supplier',9,'payments','psSupplierAccount315');
 await check('finance','record',7,'','financeOpen');
})().catch(e=>{console.error(e);process.exit(1)});
