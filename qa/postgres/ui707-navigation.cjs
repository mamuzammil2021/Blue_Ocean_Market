'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{fixture}=require('./fx_fixture.cjs'),{chromium}=require('playwright');
(async()=>{let f,b;const checks=[],errors=[];try{
 f=await fixture();
 await f.db.prepare('UPDATE pink_salt_suppliers SET name=? WHERE id=?').run('대한민국 파키스탄 국제 소금 공급업체 — Long Supplier Name for Populated Layout Acceptance',f.supplier);
 await f.db.prepare('UPDATE pink_salt_customers SET name=? WHERE id=?').run('서울 고객 매장 — Long Customer and Store Name for Responsive Review',f.customer);
 b=await chromium.launch({executablePath:process.env.BOM_CHROMIUM||chromium.executablePath(),args:['--no-sandbox','--single-process','--no-zygote','--disable-dev-shm-usage']});
 const p=await b.newPage({viewport:{width:390,height:844}});p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(token=>{localStorage.setItem('bo_token',token);localStorage.setItem('bo_language','ko')},f.login.token);
 async function ready(){await p.waitForFunction(()=>BOMRouter?.diagnostics().phase==='ready');await p.waitForTimeout(200);await p.evaluate(()=>closeMobileSidebar?.())}
 const routes=['#psSuppliers/supplier/'+f.supplier+'?unit='+f.pink+'&section=payments','#psCustomers/customer/'+f.customer+'?unit='+f.pink+'&section=orders','#psImports/import/'+f.imports[0]+'?unit='+f.pink];
 for(const route of routes){await p.goto(f.base+'/'+route);await ready();const expected=await p.evaluate(()=>location.hash);await p.reload();await ready();assert.equal(await p.evaluate(()=>location.hash),expected);assert(await p.locator('#content').innerText());assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks.push('Populated long-label mobile Korean direct route and refresh: '+route);}
 await p.goto(f.base+'/'+routes[0]);await ready();await p.evaluate(hash=>{location.hash=hash},routes[2]);await ready();await p.goBack();await ready();assert((await p.evaluate(()=>location.hash)).startsWith('#psSuppliers/supplier/'));await p.goForward();await ready();assert((await p.evaluate(()=>location.hash)).startsWith('#psImports/import/'));checks.push('Browser Back and Forward restore supplier/import record routes');
 if(process.env.BOM_UI_SCREENSHOTS){fs.mkdirSync(process.env.BOM_UI_SCREENSHOTS,{recursive:true});await p.screenshot({path:require('node:path').join(process.env.BOM_UI_SCREENSHOTS,'import-mobile-ko.png'),fullPage:true});}
 assert.deepEqual(errors,[]);fs.writeFileSync('qa/evidence/ui707-navigation.json',JSON.stringify({version:require('../../package.json').version,status:'PASS',checks,errors,tested_at:new Date().toISOString()},null,2));console.log(checks);
 }finally{await b?.close();await f?.close()}})().catch(e=>{console.error(e);process.exitCode=1});
