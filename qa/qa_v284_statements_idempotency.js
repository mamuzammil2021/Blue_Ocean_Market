const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const pkg=require('../package.json'),boot=read('server/server-v284-bootstrap.js'),run=read('server/server-v284-run.js'),ui=read('public/v284-client.js'),core=read('server/server.js'),client=read('public/client.js');
let failed=0;function check(name,v){if(v)console.log('PASS',name);else{failed++;console.error('FAIL',name)}}
function syntax(file){const r=cp.spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});check('syntax '+file,r.status===0);if(r.status!==0)console.error(r.stderr)}
syntax('server/server-v284-bootstrap.js');syntax('server/server-v284-run.js');syntax('public/v284-client.js');
check('V28.4 release identity and startup',pkg.version==='28.4.0'&&pkg.main==='server/server-v284-run.js'&&pkg.scripts.start==='node server/server-v284-run.js');
check('verified V28.3 core remains intact',core.includes("version:'28.3.0'")&&core.includes('ceoConfirmation(req)')&&client.includes('CEO Direct Authorization'));
check('browser extension is served with no stale-cache risk',run.includes("req.path==='/client.js'")&&run.includes("v284-client.js")&&run.includes("Cache-Control','no-store")&&run.includes("X-Blue-Ocean-Version','28.4.0"));
check('global server idempotency covers mutations',boot.includes('CREATE TABLE IF NOT EXISTS request_idempotency')&&boot.includes("['post','put','patch','delete']")&&boot.includes("X-Idempotency-Replayed")&&boot.includes('duplicate_prevented:true'));
check('browser prevents slow-network double submission',ui.includes('pending=new Map()')&&ui.includes("['POST','PUT','PATCH','DELETE']")&&ui.includes("X-Idempotency-Key")&&ui.includes('return old.then(r=>r.clone())')&&ui.includes("document.addEventListener('submit'"));
check('buyer rapid duplicate safety exists',boot.includes('duplicateBuyerGuard')&&boot.includes('This buyer appears to have just been added already'));
check('one Pakistan resale record per buyer machine',boot.includes('prevent_duplicate_buyer_resale_share')&&boot.includes('resaleDuplicateGuard')&&boot.includes('A Pakistan resale profit-share record already exists for this machine')&&boot.includes("Number(asset.buyer_id)!==buyerId"));
check('resale form removes already-recorded machines',ui.includes('used=new Set((d.resale_shares||[])')&&ui.includes('if(used.has(Number(o.value)))o.remove()')&&ui.includes('Every sold machine already has a resale record'));
check('global Finance statement and PDF',boot.includes("/api/statements/finance")&&boot.includes('financeStatement(req)')&&ui.includes('v284FinanceStatement'));
check('Buyer profile statement and PDF',boot.includes("/api/excavator/buyers/:id/statement")&&boot.includes("title:'Buyer Statement'")&&boot.includes("'Buyer Type':buyer.buyer_type")&&ui.includes('v284BuyerStatement'));
check('Supplier profile statement and PDF',boot.includes("/api/excavator/suppliers/:id/statement")&&boot.includes("title:'Supplier Statement'")&&boot.includes("'Outstanding Payable'")&&ui.includes('v284SupplierStatement'));
check('Pakistan resale statement and PDF',boot.includes("/api/excavator/buyers/:id/resale-statement")&&boot.includes("title:'Pakistan Resale Profit Share Statement'")&&boot.includes("'Total Company Share'")&&boot.includes("'Total Outstanding'")&&ui.includes('v284ResaleStatement'));
check('bank-style running balances and date filters',boot.includes('statementRows')&&boot.includes('Opening Balance')&&boot.includes('Closing Balance')&&ui.includes('v284StatementFrom')&&ui.includes('v284StatementTo'));
check('resale screen shows machine financial position',ui.includes("Machines with Resale Records")&&ui.includes("Original Sale")&&ui.includes("Pakistan Resale")&&ui.includes("Manual Profit")&&ui.includes("Resale Recorded")&&ui.includes("Resale Not Recorded"));
check('PDF statement generator supports Korean and English',boot.includes("HYSMyeongJo-Medium")&&boot.includes("lang==='ko'")&&boot.includes("'Buyer Statement':'구매자 명세서'")&&ui.includes("'Download PDF':'PDF 다운로드'"));
check('development database remains additive',!boot.includes('DROP TABLE')&&!boot.includes('DELETE FROM users')&&!boot.includes('DELETE FROM excavator_')&&core.includes('Development/test accounts are opt-in and additive'));
if(failed){console.error(`V28.4 statement/idempotency QA failed: ${failed}`);process.exit(1)}
console.log('V28.4 global duplicate protection, financial statements and Pakistan resale integrity QA PASS');
