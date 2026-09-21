const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
let failed=0;function check(name,ok){if(ok)console.log('PASS',name);else{console.error('FAIL',name);failed++}}
const pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json'));
const server=read('server/server.js'),v316=read('server/v316.js'),v331=read('server/v331.js'),v342=read('server/v342.js');
const client=read('public/client.js'),runtime=read('public/runtime-v30392.js'),v340=read('public/v340-client.js'),ui=read('public/v342-client.js'),index=read('public/index.html');
check('V30.42 release identity',pkg.version==='30.42.0'&&lock.version==='30.42.0'&&lock.packages?.['']?.version==='30.42.0'&&server.includes("version:'30.42.0'")&&server.includes('Blue Ocean Market V30.42.0 running on port'));
check('V30.42 browser overlay loaded last',index.includes('/v342-client.js?v=30.42.0')&&index.indexOf('/v341-client.js')<index.indexOf('/v342-client.js'));
check('system task workflow schema',v342.includes("addColumn(db,'tasks','system_managed'")&&v342.includes("addColumn(db,'tasks','workflow_state'")&&v342.includes("addColumn(db,'tasks','action_key'")&&v342.includes("addColumn(db,'tasks','workflow_chain_key'"));
check('finance correction is one reusable chain',server.includes('One correction chain + one task per Finance record')&&server.includes("SELECT * FROM finance_correction_requests WHERE finance_entry_id=? ORDER BY id DESC LIMIT 1")&&server.includes("workflow_state='Action Required'")&&server.includes("returned_count=COALESCE(returned_count,0)+1"));
check('finance correction notification deep-links exact task',server.includes("'Finance correction required'")&&server.includes("'task',correction.task_id,'tasks'")&&client.includes("(target==='tasks'||target==='task')&&id")&&client.includes('taskDetail(id)'));
check('finance correction task waits after resubmit',v331.includes("workflow_state='Awaiting Finance Verification'")&&v331.includes('action_enabled=0'));
check('finance verification auto-completes task',server.includes('function completeFinanceCorrectionWorkflow')&&server.includes("workflow_state='Completed',action_enabled=0")&&server.includes('completeFinanceCorrectionWorkflow(id,req.user.id'));
check('Finance verification has no direct correction edit CTA',client.includes('Open Correction Task')&&!client.match(/creatorAction=.*Correct\s*&\s*Resubmit/));
check('Finance correction list routes correction action to task',runtime.includes('Open Task')&&client.includes("financeCorrectionRespond(id,taskId=0)"));
check('dedicated correction workflow replaces generic edit',ui.includes('Correct & Resubmit Finance Entry')&&ui.includes('Original Transaction Context')&&ui.includes('Save & Resubmit')&&ui.includes('financeEditBefore342'));
check('user-facing correction metadata is filtered',server.includes('financePublicCorrectionRecord')&&server.includes('financeSafeCorrectionSnapshot')&&client.includes('metadata_json')&&ui.includes('excludes raw metadata/technical JSON'));
check('system-generated tasks cannot be manually completed/cancelled',server.includes('system-managed workflow task')&&server.includes('Complete the required business action from the task')&&server.includes('cannot be manually cancelled here'));
check('task detail exposes contextual workflow action',client.includes('Required Workflow Action')&&client.includes('taskPerformAction')&&client.includes('taskOpenRelated')&&client.includes('completes automatically'));
check('approval correction also reuses actionable task',server.includes("workflow_key='approval.correction'")&&server.includes("action_key='approval.correct_resubmit'")&&server.includes("'task',taskId,'tasks'"));
check('CEO effective access is full system and future-catalog aware',v316.includes("u.role==='CEO / Owner'")&&v316.includes("SELECT permission_key FROM access_permission_catalog_v342")&&v316.includes('full_system_access:true')&&v316.includes('return true'));
check('CEO UI does not show zero permissions/scope',v340.includes("isCEO?'All Business Units'")&&v340.includes("isCEO?'All Permissions'")&&v340.includes('CEO / Owner · Full System Access')&&v340.includes('System managed · protected from accidental permission or scope reduction'));
check('CEO ordinary access mutation is protected',v316.includes('CEO / Owner permissions are system-managed as Full System Access')&&v316.includes('Access Profile assignment is not required')&&v316.includes('Permission Group assignment is not required'));
check('future permission catalog is idempotent',v342.includes('INSERT OR IGNORE INTO access_permission_catalog_v342')&&v342.includes('PRIMARY KEY(target_type,target_key,permission_key)')&&v342.includes('newKeys'));
check('future permissions map into relevant default profiles/groups',v342.includes("hasTracked('profile'")&&v342.includes("hasTracked('group'")&&v342.includes("addPermission('access_role_templates'")&&v342.includes("addPermission('access_permission_groups'"));
check('admin removals are preserved across future upgrades',v342.includes('Bootstrap records current defaults without overwriting any administrator customization')&&v342.includes('!tracked'));
if(failed){console.error(`\nV30.42.0 QA FAILED: ${failed} check(s)`);process.exit(1)}
console.log('\nV30.42.0 QA PASS');
