const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const client=read('public/client.js');
const mirror=read('client.js');
const server=read('server/server.js');
const db=read('server/db.js');
const html=read('public/index.html');
const env=read('.env.example');
const pkg=require('../package.json');
let failed=0;
function check(name,value){if(value)console.log('PASS',name);else{failed++;console.error('FAIL',name)}}

check('V28.1 version and cache identity',pkg.version==='28.1.0'&&server.includes("version:'28.1.0'")&&html.includes('/client.js?v=28.1.0')&&html.includes('/i18n-ko.js?v=28.1.0'));
check('Node 22 compatible current SQLite driver',pkg.engines.node==='22.x'&&/^\^13\./.test(pkg.dependencies['better-sqlite3']||''));
check('Render persistent data and upload paths',db.includes('process.env.DATA_DIR')&&server.includes('process.env.UPLOAD_DIR')&&env.includes('DATA_DIR=/var/data/data')&&env.includes('UPLOAD_DIR=/var/data/uploads'));
check('startup migrations preserve historical business-unit data',!db.includes('Remove legacy/demo units')&&!db.includes('DROP TABLE excavator_buyer_payments')&&!db.includes("DELETE FROM finance_entries WHERE business_unit_id=?"));
check('root and public clients are identical',client===mirror);
check('selected sidebar tab refreshes current data',client.includes("if(v===view&&!opts.force)")&&client.includes('refreshCurrentView({preserve:true})'));
check('mutations schedule screen and counter refresh',client.includes("method!=='GET'&&method!=='HEAD'")&&client.includes('scheduleDataSync(90)')&&client.includes('refreshActionCounts()'));
check('sidebar counters render only above zero',client.includes("count>0?`<span class=\"nav-action-badge\"")&&client.includes('else existing?.remove()')&&server.includes("Object.entries(counts).filter(([,value])=>Number(value)>0)"));
check('server action counters cover action-oriented modules',server.includes("app.get('/api/action-counts'")&&['counts.finance','counts.tasks','counts.notifications','counts.meetings','counts.approvals','counts.documents','counts.performance','counts.excavatorBuyers','counts.excavatorSuppliers'].every(x=>server.includes(x)));
check('fixed desktop sidebar and internally scrolling navigation',html.includes('@media(min-width:901px)')&&html.includes('height:100dvh;min-height:0;overflow:hidden;display:flex')&&html.includes('.side .nav{flex:1 1 auto;min-height:0;overflow-y:auto')&&html.includes('.main{height:100dvh')&&client.includes('ensureActiveNavVisible'));
check('responsive mobile drawer remains supported',html.includes('@media(max-width:900px)')&&html.includes('.mobile-nav-open .side')&&html.includes('100dvh'));

const sharedRequirementFields=['machine_name','machine_type','make','model','min_year','max_year','condition_status','budget_min','budget_max','quantity','action_type','exchange_machine'];
check('buyer and supplier requirements use the same structured fields',sharedRequirementFields.every(field=>client.includes(`name="${field}"`))&&server.includes('excavator_buyer_requirements')&&server.includes('excavator_supplier_requirements'));
check('smart matching uses required fields and excludes location',server.includes('function smartMachineMatch')&&server.includes("text('machine_name'")&&server.includes("text('machine_type'")&&server.includes("text('make'")&&server.includes("text('model'")&&server.includes("text('condition_status'")&&server.includes("field:'year'")&&server.includes("field:'budget'")&&!server.slice(server.indexOf('function smartMachineMatch'),server.indexOf('function persistRequirementMatches')).includes('location'));
check('matches persist uniquely and notify relevant users',db.includes('UNIQUE(requirement_type,requirement_id,machine_source,machine_id)')&&server.includes("'Machine requirement match'")&&server.includes("actionView")&&server.includes('targetId'));
check('exchange proposal workflow is persisted and exposed',db.includes('CREATE TABLE IF NOT EXISTS excavator_exchange_proposals')&&server.includes("app.post('/api/excavator/exchange-proposals'")&&client.includes('excavatorExchangeForm')&&client.includes('balance_direction'));

check('Finance list is creator-scoped for non-reviewers',server.includes("if(!isFinanceReviewer(req.user)){q+=' AND f.created_by=?'")&&server.includes('Only authorized Finance users or CEO can view company Finance totals'));
check('Finance correction is assigned to original creator only',server.includes('const assignedTo=Number(finance.created_by||requestedBy)')&&server.includes('Only the original user assigned to this correction can modify and resubmit the transaction'));
check('source-specific correction forms cover linked records',server.includes('function financeCorrectionForm')&&['Excavator Buyer Payment','Excavator Payment','Excavator Repair','Excavator Logistics','Excavator Part','Excavator Cost Transaction','Purchase','Sale'].every(x=>server.includes(`source_type==='${x}`)||server.includes(`sourceType==='${x}`)));
check('correction updates source and Finance atomically',server.includes('function applyFinanceCorrection')&&server.includes("verification_status='Resubmitted'")&&server.includes('db.transaction'));
check('correction history, task, reminders and performance are tracked',db.includes('CREATE TABLE IF NOT EXISTS finance_correction_history')&&db.includes("finance_correction_requests','task_id'")&&server.includes("app.post('/api/finance/corrections/:id/remind'")&&server.includes('finance_corrections:{total:'));
check('generic Finance editing is locked behind active creator correction',server.includes('An active correction request is required before this record can be modified')&&client.includes('This Finance record is read-only. Only its original creator can change fields when a correction is assigned.'));

const koreanCritical=[
  'My Finance Entries & Actions','My Pending Corrections','Complete Source Record','Original Snapshot','Correction History','Changed Fields','Send Correction Reminder',
  'Smart Machine Requirement','Requirement / Purpose *','Budget Min (KRW)','Action Type','Exact Match','Close Match','Match Reasons','Create Exchange Proposal',
  'Location is intentionally excluded from matching.','Refreshing data…','Only counts above zero are shown.'
];
check('all V28.1 critical interface phrases have Korean translations',koreanCritical.every(key=>client.includes(`'${key}':`)));
check('Korean remains the default document and app language',html.includes('<html lang="ko"')&&client.includes("currentLanguage=localStorage.getItem('bo_language')||'ko'"));

if(failed){console.error(`V28.1 static QA failed: ${failed}`);process.exit(1)}
console.log('V28.1 action, matching, Finance and bilingual static QA PASS');
