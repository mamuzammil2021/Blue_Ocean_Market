'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const ui=read('public/v3592-payroll-ui.js'), server=read('server/v359-payroll.js'), runtime=read('public/runtime-v3039.js'), index=read('public/index.html');
const checks=[
 ['V30.60.0 UI loaded',index.includes('/v3592-payroll-ui.js?v=30.60.0')],
 ['Employee profile horizontal tabs',ui.includes('v3592-tabs')&&ui.includes('employeeSectionV3592')],
 ['Employee targeted section host',ui.includes('v3592EmployeeSection')&&ui.includes('Loading section…')],
 ['My Account horizontal tabs',ui.includes('setMyAccountSectionV3592')&&ui.includes('v3592MySection')],
 ['Pending account badge',ui.includes('Pending Account Approval')&&ui.includes('Account Approval Pending')],
 ['Workspace pending summary API used',ui.includes('/api/payroll/account-change-summary')],
 ['Backend pending summary endpoint',server.includes("/api/payroll/account-change-summary")],
 ['Self-service account request notifies approvers',server.includes('Employee payment account approval required')&&server.includes("entity_type='employee_payment_account_request'")],
 ['Notification deep-link target payroll',server.includes("'employee_payment_account_request',requestId,'payroll',e.id")],
 ['Stable workflow header removes default Full-screen workflow',!runtime.includes("options.context||'Full-screen workflow'")],
 ['Protected processing Escape lock',ui.includes("document.querySelector('.bom314-processing')")],
 ['Version cache bust 30.60.0',index.includes('v=30.60.0')]
];
let fail=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)fail++}console.log(`V30.60.0 profile/approval QA: ${checks.length-fail}/${checks.length} PASS`);process.exitCode=fail?1:0;
