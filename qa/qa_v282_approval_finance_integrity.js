const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const client=read('public/client.js');
const mirror=read('client.js');
const server=read('server/server.js');
const db=read('server/db.js');
const html=read('public/index.html');
const ko=read('public/i18n-ko.js');
const env=read('.env.example');
const pkg=require('../package.json');
let failed=0;
function check(name,value){if(value)console.log('PASS',name);else{failed+=1;console.error('FAIL',name)}}

check('V28.2 version and browser cache identity',pkg.version==='28.2.0'&&server.includes("version:'28.2.0'")&&html.includes('/client.js?v=28.2.0')&&html.includes('/i18n-ko.js?v=28.2.0'));
check('Node 22 and Render persistent storage remain configured',pkg.engines.node==='22.x'&&db.includes('process.env.DATA_DIR')&&server.includes('process.env.UPLOAD_DIR')&&env.includes('DATA_DIR=/var/data/data')&&env.includes('UPLOAD_DIR=/var/data/uploads'));
check('root and public browser clients are identical',client===mirror);

check('Finance review exposes only verify and correction decisions',client.includes("financeDecision(${x.id},'verify')")&&client.includes("financeDecision(${x.id},'correction')")&&!client.includes("financeDecision(${x.id},'reject')")&&!client.includes('<option>Rejected</option>')&&server.includes("const valid=['Verified / Correct','Correction Required','Pending Verification','Resubmitted']"));
check('legacy Finance rejection is safely migrated to correction',server.includes('function normalizeLegacyFinanceRejections')&&server.includes("verification_status='Correction Required'")&&server.includes('openFinanceCorrection'));
check('Finance visibility is company-wide only for Finance and CEO',server.includes('function isFinanceReviewer')&&server.includes("if(!isFinanceReviewer(req.user)){q+=' AND f.created_by=?'")&&server.includes('Only authorized Finance users or CEO can view company Finance totals'));

check('approval decisions are simplified and self-approval is blocked',server.includes("!['Approved','Changes Required','Cancelled'].includes(decision)")&&server.includes('You cannot approve or return your own request')&&client.includes("approvalDecision(${x.id},'Approved')")&&client.includes("approvalDecision(${x.id},'Changes Required')")&&!client.includes("approvalDecision(${x.id},'Rejected')"));
check('dual approvals enforce Finance before CEO',server.includes("required===5")&&server.includes("action='Finance Approved'")&&server.includes('Finance approval is required before CEO approval')&&server.includes('Final CEO approval is required'));
check('approval correction belongs to original requester and creates a tracked task',server.includes('Only the original requester can correct and resubmit this request')&&server.includes("related_module,related_entity_type,related_entity_id")&&server.includes("'Corrected & Resubmitted'")&&server.includes("review_status='Approved'"));
check('approval snapshots, hashes, diffs, reminders and history persist',db.includes("['approvals','request_snapshot_json'")&&db.includes("['approvals','payload_hash'")&&db.includes("['approvals','changed_fields_json'")&&db.includes("['approvals','reminder_count'")&&server.includes('approvalPayloadHash')&&server.includes('approvalSnapshotDiff')&&server.includes("app.post('/api/approvals/:id/remind'"));
check('approved controlled voids automatically update linked records',server.includes('function executeApprovedAction')&&server.includes("a.action_key==='payment.void'")&&server.includes("UPDATE finance_entries SET status='Voided'")&&server.includes("UPDATE excavator_buyer_payment_allocations SET status='Reversed'")&&server.includes('markApprovalExecuted'));
check('approved large Finance entries execute automatically with retained evidence',server.includes("a.action_key==='finance.large_payment'")&&server.includes("action:'Finance entry created'")&&server.includes('It will be created automatically after final approval.')&&!server.includes('fs.unlinkSync(path.join(uploads,f.filename))'));
check('only requester can cancel and history is retained',server.includes('Only the original requester can cancel this request')&&server.includes("status='Cancelled'")&&server.includes("approvalHistory(a.id,a.business_unit_id,req.user.id,'Cancelled'"));

check('purchase token reference and evidence are conditional on positive token',client.includes('togglePurchaseTokenFields')&&client.includes('input.required=amount>0')&&server.includes('if(tokenAmount>0&&!(req.files||[]).length)')&&server.includes("if(tokenAmount>0&&!String(req.body.token_payment_reference||'').trim())"));
check('all Excavator payment entry routes retain evidence enforcement',[
  'Receipt / evidence is mandatory for every buyer payment.',
  'Receipt / evidence is mandatory for every Excavator payment.',
  'Receipt / evidence is mandatory for every payment-related Excavator entry.',
  'Receipt / evidence is mandatory for repair payments.',
  'Receipt / evidence is mandatory for logistics payments.',
  'Receipt / evidence is mandatory for parts-related payment entries.'
].every(message=>server.includes(message)));

check('notifications are unread-first and newest-first within groups',server.includes('ORDER BY CASE WHEN read_at IS NULL THEN 0 ELSE 1 END,created_at DESC,id DESC')&&client.includes("t('Unread Notifications')")&&client.includes("t('Earlier Notifications')")&&client.includes('notification-unread'));
check('sidebar remains fixed and action badges hide zero',html.includes('@media(min-width:901px)')&&html.includes('.main{height:100dvh')&&html.includes('.side .nav{flex:1 1 auto')&&client.includes("count>0?`<span class=\"nav-action-badge\"")&&client.includes('else existing?.remove()'));
check('mobile drawer and V28.2 approval/notification layouts are responsive',html.includes('v280-mobile-ui')&&html.includes('v282-approval-notification-ui')&&html.includes('@media(max-width:900px)')&&html.includes('.mobile-nav-open .side'));

const koreanCritical=['Simple Approval Workflow','My Pending Actions','Changes Required','Request Changes','Cancel Request','Submitted Request Snapshot','Complete Linked Source Record','Send Approval Reminder','Unread Notifications','Earlier Notifications','Token Payment Details','Token Payment Reference *'];
check('V28.2 critical UI text has Korean in both catalogs',koreanCritical.every(key=>client.includes(`'${key}':`)&&ko.includes(`'${key}':`)));
check('Korean remains default and runtime translation observes dynamic UI',html.includes('<html lang="ko"')&&client.includes("currentLanguage=localStorage.getItem('bo_language')||'ko'")&&client.includes('MutationObserver'));

if(failed){console.error(`V28.2 static QA failed: ${failed}`);process.exit(1)}
console.log('V28.2 approval, Finance integrity, payment and bilingual static QA PASS');
