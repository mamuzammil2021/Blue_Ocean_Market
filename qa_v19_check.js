const fs=require('fs');
const client=fs.readFileSync('public/client.js','utf8');
const index=fs.readFileSync('public/index.html','utf8');
const server=fs.readFileSync('server/server.js','utf8');
function count(name){return (client.match(new RegExp('function '+name+'\\b','g'))||[]).length}
const checks=[
 ['index loads current frontend', index.includes('/client.js?v=26.3.0')],
 ['single active excavator()', count('excavator')===1],
 ['single payment UI', count('excavatorPayments')===1],
 ['single payment form', count('excavatorPaymentForm')===1],
 ['single payment save', count('saveExcavatorPayment')===1],
 ['simple sale uses atomic endpoint', client.includes("/api/excavator/assets/'+id+'/complete-sale")],
 ['atomic sale backend exists', server.includes("/api/excavator/assets/:id/complete-sale")],
 ['V17 block removed', !client.includes('V17 Excavator Operations UI rebuild')],
];
for(const [n,ok] of checks)console.log((ok?'PASS':'FAIL')+' '+n);
if(checks.some(x=>!x[1]))process.exit(1);
