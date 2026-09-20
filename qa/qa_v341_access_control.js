'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'..');
let pass=0,fail=0;
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const check=(name,ok)=>{if(ok){pass++;console.log('PASS '+name)}else{fail++;console.error('FAIL '+name)}};
const syntax=f=>{const r=cp.spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});check('syntax '+f,r.status===0);if(r.status!==0)console.error(r.stderr)};
const pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json'));
const server=read('server/server.js'),b316=read('server/v316.js'),b341=read('server/v341.js'),client=read('public/v341-client.js'),v340=read('public/v340-client.js'),runtime=read('public/runtime-v30392.js'),index=read('public/index.html'),reqs=read('REQUIREMENTS_MASTER.md');

check('V30.41 package release identity',pkg.version==='30.41.0'&&lock.version==='30.41.0'&&lock.packages?.['']?.version==='30.41.0');
check('V30.41 server release identity',server.includes("version:'30.41.0'")&&server.includes('Blue Ocean Market V30.41.0 running on port'));
check('V30.41 backend overlay installed',server.includes("require('./v341').install")&&server.includes('accessV316=require(\'./v341\').install'));
check('V30.41 browser overlay loads last',index.includes('/v340-client.js?v=30.41.0')&&index.includes('/v341-client.js?v=30.41.0')&&index.indexOf('/v340-client.js')<index.indexOf('/v341-client.js'));
check('all browser cache versions advanced',index.includes('/i18n-ko.js?v=30.41.0')&&index.includes('/client.js?v=30.41.0')&&index.includes('/runtime-v30392.js?v=30.41.0'));
check('V30.41 QA npm scripts registered',pkg.scripts?.['qa:v341']==='node qa/qa_v341_access_control.js'&&pkg.scripts?.['qa:v341:runtime']==='node qa/runtime_v341_access.js');

check('job title separated from system access role in database',b341.includes("ALTER TABLE users ADD COLUMN job_title")&&server.includes("COALESCE(u.job_title,'') job_title"));
check('user create API persists job title separately',b341.includes('job_title')&&b341.includes("INSERT INTO users(name,email,password_hash,role,business_unit_id,job_title"));
check('user identity update keeps access assignment separate',b341.includes("/api/access/users/:id/identity-v341")&&b341.includes('job_title=?')&&!b341.includes('DELETE FROM user_access_profiles WHERE user_id=?'));

check('Access Policy Set table exists',b341.includes('CREATE TABLE IF NOT EXISTS access_policy_sets')&&b341.includes("rules_json TEXT NOT NULL DEFAULT '[]'"));
check('Approval Level configuration table exists',b341.includes('CREATE TABLE IF NOT EXISTS access_approval_levels'));
check('L0 through L5 defaults are seeded',[0,1,2,3,4,5].every(n=>b341.includes(`[${n},'L${n}`)));
check('L5 is protected dual approval',b341.includes("[5,'L5 — Dual / Protected Approval'")&&b341.includes('level===5?0'));

check('Permission Groups support multiple permissions JSON',b341.includes('permissions_json')&&client.includes('One Permission Group can contain multiple permissions'));
check('Permission Group list endpoint exists',b341.includes("app.get('/api/access/permission-groups-v341'"));
check('Permission Group create endpoint exists',b341.includes("app.post('/api/access/permission-groups-v341'"));
check('Permission Group edit endpoint exists',b341.includes("app.put('/api/access/permission-groups-v341/:group_key'"));
check('Permission Group duplicate endpoint exists',b341.includes("/duplicate'"));
check('Permission Group archive protects assigned users',b341.includes('Remove those assignments before archiving'));
check('Permission Group mutations invalidate effective access cache',b341.includes('access.invalidateAccess()'));

check('Access Policies support multiple rules',b341.includes('normalizeRules')&&client.includes('collectPolicyRules341')&&client.includes('v341PolicyAddRule'));
check('policy rule types include deny and approval rules',b341.includes("'deny_action','require_approval_level','require_permission','require_permission_group','ceo_only'"));
check('policy rules validate modules and actions',b341.includes('Invalid policy module')&&b341.includes('Invalid policy action'));
check('policy set can be company-wide or BU scoped',b341.includes('business_unit_id INTEGER')&&client.includes('Company Wide'));
check('policy runtime wraps effective canAction enforcement',b341.includes('const originalCanAction=access.canAction.bind(access)')&&b341.includes('access.canAction=function'));
check('CEO Owner has policy bypass',b341.includes("if(user.role==='CEO / Owner')return {ok:true,bypass:'CEO / Owner'}"));
check('Access Policy CRUD plus duplicate and archive exist',b341.includes("app.post('/api/access/policies-v341'")&&b341.includes("app.put('/api/access/policies-v341/:policy_key'")&&b341.includes("/policies-v341/:policy_key/duplicate")&&b341.includes("/policies-v341/:policy_key/archive"));
check('policy cache invalidates after policy changes',b341.includes('invalidatePolicyCache()'));

check('shared Access Profile library remains reusable',b316.includes('CREATE TABLE IF NOT EXISTS access_role_templates')&&b316.includes("app.post('/api/access/profiles'"));
check('Access Profiles support multiple permissions',b316.includes('permissions_json')&&client.includes('permissionMatrix341'));
check('Access Profiles have clear reusable descriptions',b316.includes("description TEXT NOT NULL DEFAULT ''")&&b341.includes("ALTER TABLE access_role_templates ADD COLUMN description")&&client.includes('v341ProfileDescription'));
check('Access Profile creation configures permissions before first save',client.includes('v341ProfileModal')&&client.includes("isNew:true")&&client.includes("st.isNew?'POST':'PUT'"));
check('Access Profile archive is blocked while assigned',b341.includes('Reassign those users before archiving'));
check('CEO Owner Access Profile is protected',b341.includes("CEO / Owner is a protected Access Profile"));

check('multiple Access Profiles remain supported per user',b316.includes('CREATE TABLE IF NOT EXISTS user_access_profiles')&&client.includes('Add Another Profile')&&client.includes('collectCreateProfiles'));
check('multiple Permission Groups remain supported per user',b316.includes('CREATE TABLE IF NOT EXISTS user_permission_groups')&&client.includes('Add Another Group')&&client.includes('collectCreateGroups'));
check('per-profile BU scope is captured on create',client.includes('data-v341-profile-row')&&client.includes('business_unit_id')&&b341.includes('Access Profile scope must be one of the user’s assigned Business Units'));
check('per-group BU scope is captured on create',client.includes('data-v341-group-row')&&b341.includes('Permission Group scope must be one of the user’s assigned Business Units'));
check('only one primary Access Profile allowed',b341.includes('Only one Access Profile may be Primary'));
check('primary profile does not replace additive profiles',client.includes('all assigned profiles remain additive'));

check('user creation is assignment-first and atomic route exists',b341.includes("app.post('/api/access/users-v341'")&&client.includes("api('/api/access/users-v341'"));
check('user create requires at least one BU',b341.includes('Assign at least one Business Unit'));
check('user create requires at least one Access Profile',b341.includes('Assign at least one Access Profile'));
check('user create assigns multiple profiles and groups inside transaction',b341.includes("INSERT INTO user_access_profiles")&&b341.includes("INSERT INTO user_permission_groups")&&b341.includes('db.transaction'));
check('Approval Authority remains separate from Access Profiles',b341.includes('user_approval_authority')&&client.includes('Approval Authority is configured separately from feature access'));
check('new user cannot receive approval level above delegated admin',b341.includes('above your own delegated Approval Authority'));
check('delegated admins cannot create users outside BU scope',b341.includes('outside your delegated Business Unit scope'));
check('delegated assignment cannot exceed actor permissions',b341.includes('because it exceeds your effective authority'));

check('Effective Access preview API exists',b341.includes("app.post('/api/access/preview-v341'"));
check('Effective Access preview returns permission sources',b341.includes('permission_sources:sources')&&client.includes('Granted By'));
check('UI has explicit Preview Effective Access action',client.includes('Preview Effective Access')&&client.includes('v341PreviewCreateAccess'));
check('Advanced individual access remains available through existing access editor',client.includes('userAccessOpen')&&v340.includes('Advanced / Individual Exceptions'));

check('Users page no longer hosts shared profile configuration',client.includes('Access Profiles are created in System Settings and assigned here.')&&client.includes('Open Security & Access Settings'));
check('System Settings Access Control Center is installed',client.includes('Access Control Center')&&client.includes('window.v319SettingsSection'));
check('Access Control Center has Profile Group Policy Approval Audit sections',client.includes("['profiles','Access Profiles']")&&client.includes("['groups','Permission Groups']")&&client.includes("['policies','Access Policies']")&&client.includes("['approval','Approval Levels']")&&client.includes("['audit','Access Audit']"));
check('Security Defaults remain available separately',client.includes("['defaults','Security Defaults']"));
check('Access structure editing uses Review & Confirm',client.includes('v341ProfileSave')&&client.includes('v341GroupSave')&&client.includes('v341PolicySave')&&client.includes('confirmAction'));
check('profile/group screens show affected user impact',client.includes('Affected Users')&&client.includes('assigned_users'));
check('access audit endpoint includes structures and assignments',b341.includes("'access_profile','access_permission_group','access_policy','access_approval_level','user_access'"));
check('access audit UI exists',client.includes('renderAudit341'));

check('access archive operations map to edit not generic void permission',server.includes("p.startsWith('/access/')")&&server.includes("\\/archive(?:\\/|$)")&&server.indexOf("p.startsWith('/access/')")<server.indexOf("if(/void|cancel|archive"));
check('maker checker Finance safeguard retained',server.includes('Maker/checker control: you cannot review or verify your own Finance transaction.'));
check('maker checker Accounting safeguard retained',read('server/v318.js').includes('Maker/checker control: you cannot final-post an Accounting proposal you created.'));

check('Machine Cost correction is per individual row',client.includes('const beforeCost341=window.excavatorCostRowV319')&&client.includes('finance_verification_status'));
check('unverified machine cost restores normal Edit control',client.includes("if(!verified&&!voided&&lockedRe.test(html))")&&client.includes('excavatorAddCost'));
check('Finance Verified machine cost keeps normal Edit locked',client.includes("if(verified&&!voided&&!lockedRe.test(html))")&&client.includes('v3382-locked-edit'));
check('server still uses transaction row for machine cost edit lock',runtime.includes("rows.find(r=>Number(r.id)===Number(txid))"));

check('no destructive rewrite of legacy profile/group assignment tables',!b341.includes('DROP TABLE user_access_profiles')&&!b341.includes('DROP TABLE user_permission_groups'));
check('legacy V30.40 access model remains migration-compatible',b316.includes('ensureInitialProfile')&&b341.includes('V30.40 access service'));
check('current requirements include V30.41 access-control center',reqs.includes('V30.41')||reqs.includes('Access Control Center'));

['server/server.js','server/v341.js','public/v341-client.js','qa/qa_v341_access_control.js','qa/runtime_v341_access.js'].forEach(syntax);
console.log(`\nV30.41 QA: ${pass} passed, ${fail} failed`);
if(fail)process.exit(1);
