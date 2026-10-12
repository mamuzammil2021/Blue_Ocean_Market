const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const client=fs.readFileSync(path.join(root,'public/client.js'),'utf8');
const route=fs.readFileSync(path.join(root,'public/v3693-persistent-routing.js'),'utf8');
const index=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const checks=[
 ['dynamic top-level routes survive boot',/routeViews=new Set\(\[\.\.\.Object\.keys\(viewLabels\|\|\{\}\).*'accounting'.*'payroll'.*'psImports'.*'psSuppliers'/s.test(client)],
 ['hard refresh restores saved list state',client.includes("sessionStorage.setItem('bo_view_state_'+view")&&client.includes("sessionStorage.getItem('bo_view_state_'+v")],
 ['boot restores saved view state',client.includes('render();setTimeout(()=>restoreViewState(view),120)')],
 ['record hash parser',route.includes("parts=path.split('/').filter(Boolean)")],
 ['machine route',route.includes("view:'excavator',kind:'machine'")],
 ['buyer route',route.includes("view:'excavatorBuyers',kind:'buyer'")],
 ['supplier route',route.includes("view:'excavatorSuppliers',kind:'supplier'")],
 ['employee route',route.includes("view:'payroll',kind:'employee'")],
 ['finance route',route.includes("view:'finance',kind:'record'")],
 ['task route',route.includes("view:'tasks',kind:'task'")],
 ['pink order route',route.includes("view:'psSales',kind:'order'")],
 ['pink production route',route.includes("view:'psProduction',kind:'batch'")],
 ['pink supplier/import restore',route.includes("r.view==='psSuppliers'")&&route.includes("r.view==='psImports'")],
 ['back forward listeners',route.includes("addEventListener('popstate'")&&route.includes("addEventListener('hashchange'")],
 ['routing loaded last',index.includes('/v3693-persistent-routing.js?v=30.69.3')]
];
let fail=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)fail++}
console.log(`V30.69.3 QA: ${checks.length-fail}/${checks.length}`);if(fail)process.exit(1);
