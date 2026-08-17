const fs=require('fs');const cp=require('child_process');
const path=require('path');
const root=path.resolve(__dirname,'..');
const files=['server/server.js','server/db.js','client.js'];
for(const f of files){const r=cp.spawnSync(process.execPath,['--check',root+'/'+f],{encoding:'utf8'});if(r.status!==0){console.error('SYNTAX FAIL',f,r.stderr);process.exit(1)}console.log('syntax ok',f)}
const server=fs.readFileSync(root+'/server/server.js','utf8');const client=fs.readFileSync(root+'/client.js','utf8');
const checks=[
 ['CEO context endpoint',server.includes("app.get('/api/context'")],
 ['business-unit header',server.includes("x-business-unit-id")],
 ['MIMI menu',server.includes("/api/restaurant/menu")&&client.includes('MIMI Menu Management')],
 ['menu stock update',server.includes('/api/restaurant/menu/:id/stock')&&client.includes('Update Stock')],
 ['recipe management',server.includes('/api/restaurant/menu/:id/recipe')&&client.includes('Ingredients / Recipe')],
 ['weekly menu',server.includes('/api/restaurant/weekly-menu')&&client.includes('Weekly Menu')],
 ['buffet',server.includes('/api/restaurant/buffets')&&client.includes('Buffet')],
 ['open order save',server.includes('/api/restaurant/orders/:id/save')&&client.includes('Save Open Order')],
 ['open order cancel',server.includes('/api/restaurant/orders/:id/cancel')&&client.includes('Cancel / Delete')],
 ['available dine-in tables',server.includes('Selected table is not available')&&client.includes('Select available table')],
 ['receipt printing',client.includes('printReceipt')],
 ['sidebar scrolling',fs.readFileSync(root+'/public/index.html','utf8').includes('overflow-y:auto')]
];
let bad=0;for(const [n,ok] of checks){console.log((ok?'PASS ':'FAIL ')+n);if(!ok)bad++}if(bad)process.exit(2);console.log('All static QA checks passed.');
