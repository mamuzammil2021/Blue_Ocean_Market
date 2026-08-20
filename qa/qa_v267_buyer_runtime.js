const fs=require('fs');
const server=fs.readFileSync('server/server.js','utf8');
const db=fs.readFileSync('server/db.js','utf8');
const client=fs.readFileSync('client.js','utf8');
const index=fs.readFileSync('public/index.html','utf8');
const checks=[
 ['version 26.7.0',server.includes("version:'26.7.0'")],
 ['buyer payment status created after buyer schema',db.indexOf("CREATE TABLE IF NOT EXISTS excavator_buyer_payments") < db.indexOf("ALTER TABLE excavator_buyer_payments ADD COLUMN status TEXT DEFAULT 'Active'")],
 ['buyer payment status backfilled',db.includes("UPDATE excavator_buyer_payments SET status='Active'")],
 ['buyer payment status indexed',db.includes('idx_buyer_payments_buyer_status')],
 ['buyers endpoint uses active payments',server.includes("p.buyer_id=x.id AND p.status='Active'" )],
 ['buyer allocations ignore voided payments',server.includes("JOIN excavator_buyer_payments ap ON ap.id=al.payment_id AND ap.status='Active'" )],
 ['buyer detail uses active payment status',server.includes("WHERE p.buyer_id=? AND p.status='Active'")],
 ['buyer void updates payment status',server.includes("UPDATE excavator_buyer_payments SET status='Voided'")],
 ['API has request timeout',client.includes('AbortController')&&client.includes('Request timed out')],
 ['buyers page has retry/error state',client.includes('Unable to load buyer records')&&client.includes('Retry')],
 ['client cache bust 26.7.0',index.includes('/client.js?v=26.7.0')],
];
let bad=0;for(const [n,ok] of checks){console.log((ok?'PASS':'FAIL')+' '+n);if(!ok)bad++;}process.exitCode=bad?1:0;
