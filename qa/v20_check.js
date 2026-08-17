const fs=require('fs');
const c=fs.readFileSync('public/client.js','utf8');
const h=fs.readFileSync('public/index.html','utf8');
const s=fs.readFileSync('server/server.js','utf8');
const d=fs.readFileSync('server/db.js','utf8');
const checks=[
 ['single excavator UI function',(c.match(/async function excavator\(/g)||[]).length===1],
 ['client version 20',h.includes('client.js?v=20')],
 ['diagnostic endpoint',s.includes('/api/excavator/diagnostics')],
 ['notification endpoint',s.includes("app.get('/api/notifications'")],
 ['metadata migration',d.includes("v20EnsureColumn('excavator_transactions','metadata'")],
 ['currency migration',d.includes("v20EnsureColumn('excavator_transactions','currency'")],
 ['notification migration',d.includes("v20EnsureColumn('notifications','read_at'")],
 ['frontend exists',fs.existsSync('public/client.js')]
];
for(const [name,ok] of checks){ console.log((ok?'PASS ':'FAIL ')+name); if(!ok) process.exitCode=1; }
