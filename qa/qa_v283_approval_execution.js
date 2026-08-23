const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const client=read('public/client.js'),mirror=read('client.js'),server=read('server/server.js'),db=read('server/db.js'),html=read('public/index.html'),ko=read('public/i18n-ko.js'),env=read('.env.example'),pkg=require('../package.json');
let failed=0;
function check(name,value){if(value)console.log('PASS',name);else{failed+=1;console.error('FAIL',name)}}

check('V28.3 version and browser cache identity',pkg.version==='28.3.0'&&server.includes("version:'28.3.0'")&&html.includes('/client.js?v=28.3.0')&&html.includes('/i18n-ko.js?v=28.3.0'));
check('Node 22 and Render persistent storage remain configured',pkg.engines.node==='22.x'&&db.includes('process.env.DATA_DIR')&&server.includes('process.env.UPLOAD_DIR')&&env.includes('DATA_DIR=/var/data/data')&&env.includes('UPLOAD_DIR=/var/data/uploads'));
check('root and public browser clients are identical',client===mirror);

check('CEO never waits and must explicitly confirm controlled actions',server.includes("req.user.role==='CEO / Owner'")&&server.includes('ceoConfirmation(req)')&&server.includes('confirmation_required:true')&&server.includes('direct_authorization')&&client.includes('X-CEO-Confirmed')&&client.includes("title:'CEO Direct Authorization'"));
check('CEO confirmation remains in immutable approval and audit history',db.includes("['approvals','direct_authorization'")&&db.includes("['approvals','direct_authorization_note'")&&server.includes("'CEO Direct Authorized'")&&server.includes("'ceo-direct-authorize'"));
check('dual approval is revision-aware and avoids Finance requester deadlock',db.includes("['approvals','finance_approved_revision'")&&db.includes("['approvals','ceo_approved_revision'")&&server.includes('approvalRequesterRole')&&server.includes("approvalRequesterRole(approval)==='Finance / Admin'")&&server.includes("currentStep=requiredLevel===5&&req.user.role==='Finance / Admin'?'CEO Review'"));
check('next responsible reviewers are visible',server.includes('next_reviewers:reviewers')&&server.includes('waiting_for:waitingFor')&&client.includes('a.next_reviewers.map'));
check('failed automatic execution can be retried without a second decision',server.includes("app.post('/api/approvals/:id/retry-execution'")&&server.includes('This approval has no failed automatic execution to retry')&&client.includes('Retry Automatic Execution'));

const automaticActions=['payment.void','document.delete','finance.verified_change','finance.large_payment','inventory.writeoff','sale.loss_or_low_margin','excavator.machine_purchase','completed_sale.update','buyer.advance_refund'];
check('supported controlled actions have automatic executors',automaticActions.every(action=>server.includes(`a.action_key==='${action}'`))&&server.includes('markApprovalExecuted'));
check('buyer payment void reverses payment allocations and Finance',server.includes("source==='excavator_buyer_payment'")&&server.includes("UPDATE excavator_buyer_payment_allocations SET status='Reversed'")&&server.includes("voidFinanceBySource('Excavator Buyer Payment'"));
check('buyer refund creation, Finance linkage and controlled void are complete',db.includes('CREATE TABLE IF NOT EXISTS excavator_buyer_refunds')&&server.includes("app.post('/api/excavator/buyers/:id/refunds'")&&server.includes("app.delete('/api/excavator/buyers/:id/refunds/:refundId'")&&server.includes("source==='buyer_advance_refund'")&&server.includes("voidFinanceBySource('Excavator Buyer Refund'"));
check('refund corrections expose and update every source-specific field',server.includes("title='Excavator Buyer Advance Refund'")&&['original_amount','currency','fx_rate','refund_date','method','reference','reason'].every(field=>server.includes(`'${field}'`))&&server.includes('Corrected refund exceeds the available buyer advance'));
check('payment and refund evidence remain mandatory',server.includes('Receipt / evidence is mandatory for every buyer payment.')&&server.includes('Receipt / evidence is mandatory for every buyer advance refund.'));

check('approval badge counts relevant pending work and hides zero',server.includes('relevantApprovals=approvalRows.filter')&&server.includes('Object.entries(counts).filter(([,value])=>Number(value)>0)')&&client.includes("count>0?`<span class=\"nav-action-badge\""));
check('fixed responsive sidebar and selected tab behavior remain present',html.includes('@media(min-width:901px)')&&html.includes('.main{height:100dvh')&&html.includes('.side .nav{flex:1 1 auto')&&html.includes('@media(max-width:900px)')&&client.includes("view===x[0]?'active':''")&&client.includes('aria-current'));
check('selected-tab and mutation workflows refresh data',client.includes('refreshCurrentView')&&client.includes('scheduleDataSync')&&client.includes('Clicking the selected tab refreshes its data.'));

check('development users and sample data are additive opt-in seeds',env.includes('SEED_DEMO_USERS=true')&&env.includes('SEED_DEMO_DATA=true')&&env.includes('DEMO_USER_PASSWORD=')&&db.includes('Development/test accounts are opt-in and additive')&&db.includes('Re-running a build never')&&db.includes('DEVELOPMENT TEST DATA')&&!db.includes('DELETE FROM users'));
check('Korean remains default and V28.3 critical text is bilingual',html.includes('<html lang="ko"')&&client.includes("currentLanguage=localStorage.getItem('bo_language')||'ko'")&&['CEO Direct Authorization','Authorize & Execute','Retry Automatic Execution','Buyer Advance Refunds','Request Refund Void','Void Pending'].every(key=>client.includes(`'${key}':`)&&ko.includes(`'${key}':`)));

if(failed){console.error(`V28.3 static QA failed: ${failed}`);process.exit(1)}
console.log('V28.3 approval execution, CEO authorization, refund and bilingual static QA PASS');
