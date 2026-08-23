const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const client=read('public/client.js'),server=read('server/server.js'),db=read('server/db.js'),html=read('public/index.html'),pkg=require('../package.json');
let failed=0;const check=(name,ok)=>{if(ok)console.log('PASS',name);else{failed++;console.error('FAIL',name)}};

check('V28+ version and browser cache identity',pkg.version==='28.3.0'&&server.includes("version:'28.3.0'")&&html.includes('/client.js?v=28.3.0')&&html.includes('/i18n-ko.js?v=28.3.0'));
check('mobile off-canvas sidebar and overlay',html.includes('v280-mobile-ui')&&html.includes('.mobile-nav-open .side')&&client.includes('toggleMobileSidebar')&&client.includes('sidebar-overlay'));
check('mobile cards forms tables and dialogs',html.includes('@media(max-width:900px)')&&html.includes('.modal .grid')&&html.includes('.table-wrap')&&html.includes('100dvh'));
check('trusted-input dirty tracking',client.includes("e.isTrusted&&e.target.closest('form')")&&client.includes('closeModalAfterSave')&&client.includes('multipartApi'));
check('no direct Excavator multipart fetch bypasses',!client.match(/await fetch\('\/api\/excavator/));
check('structured buyer requirement fields',db.includes("excavator_buyer_requirements','machine_name'")&&db.includes("excavator_buyer_requirements','serial_no'")&&server.includes('buyerRequirementMatches')&&client.includes('excavatorBuyerRequirementMatches'));
check('buyer requirement view edit delete and matches',client.includes('excavatorBuyerRequirementView')&&client.includes('excavatorBuyerRequirementForm')&&client.includes('deleteExcavatorBuyerRequirement')&&server.includes("requirements/:rid/matches"));
check('machine payment evidence mandatory',server.includes('Receipt / evidence is mandatory for every Excavator payment')&&client.includes('Receipt / evidence is mandatory for every Excavator payment'));
check('buyer payment evidence mandatory',server.includes('Receipt / evidence is mandatory for every buyer payment')&&client.includes('Payment Receipt / Evidence *'));
check('token sale cost repair logistics evidence',server.includes('purchase token payment')&&server.includes('buyer payment and machine sale')&&server.includes('payment-related Excavator entry')&&server.includes('repair payments')&&server.includes('logistics payments'));
check('evidence stored in Excavator documents and Finance',server.includes('Purchase Token Receipt / Evidence')&&server.includes('Machine Sale Payment Receipt / Evidence')&&server.includes('receiptFile:files[0]?.filename'));
check('Finance correction schema and indexes',db.includes('CREATE TABLE IF NOT EXISTS finance_correction_requests')&&db.includes('idx_finance_correction_assignee'));
check('Finance correction assignee notification and queue',server.includes('openFinanceCorrection')&&server.includes("/api/finance/corrections")&&server.includes('Finance correction resubmitted')&&client.includes('financeCorrectionPanel'));
check('Finance correction evidence resubmission',server.includes("response_note")&&server.includes("status='Resubmitted'")&&client.includes('Correction Response *'));
check('correction performance metrics and alerts',server.includes('finance_corrections')&&server.includes('avg_response_hours')&&server.includes('finance-correction-overdue')&&client.includes('Finance Correction Performance'));
check('Korean labels for all V28 workflows',client.includes("'Finance Correction Requests':'재무 수정 요청'")&&client.includes("'Matching Supplier Machines':'일치하는 공급업체 장비'")&&client.includes("'Sale Payment Receipt / Evidence':'판매 대금 영수증 / 증빙'"));

if(failed){console.error(`V28.0 QA failed: ${failed}`);process.exit(1)}
console.log('V28.0 mobile, evidence and Finance-correction QA PASS');
