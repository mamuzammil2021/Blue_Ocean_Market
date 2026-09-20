'use strict';

const bcrypt=require('bcryptjs');

function json(v,fallback){try{const x=JSON.parse(v||'');return x==null?fallback:x}catch(_){return fallback}}
function roleKey(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')}
function policyKey(v){return roleKey(v)}
function uniqueNums(values){return [...new Set((values||[]).map(Number).filter(Number.isInteger).filter(x=>x>0))]}
function cleanText(v,max=500){return String(v??'').trim().slice(0,max)}
function bool(v){return v===true||v===1||v==='1'||String(v).toLowerCase()==='true'}

const POLICY_RULE_TYPES=['deny_action','require_approval_level','require_permission','require_permission_group','ceo_only'];
const POLICY_ACTIONS=['view','create','edit','delete','void','approve','export','print','verify','correct','allocate'];

function installSchema(db){
  const cols=db.prepare('PRAGMA table_info(users)').all().map(x=>x.name);
  if(!cols.includes('job_title'))db.exec("ALTER TABLE users ADD COLUMN job_title TEXT NOT NULL DEFAULT ''");
  const profileCols=db.prepare('PRAGMA table_info(access_role_templates)').all().map(x=>x.name);
  if(!profileCols.includes('description'))db.exec("ALTER TABLE access_role_templates ADD COLUMN description TEXT NOT NULL DEFAULT ''");
  db.exec(`
    CREATE TABLE IF NOT EXISTS access_policy_sets(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_key TEXT UNIQUE NOT NULL,
      policy_name TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      business_unit_id INTEGER,
      rules_json TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_access_policy_scope_v341 ON access_policy_sets(active,business_unit_id,policy_name);
    CREATE TABLE IF NOT EXISTS access_approval_levels(
      level INTEGER PRIMARY KEY,
      level_name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      payment_limit REAL,
      expense_limit REAL,
      approval_limit REAL,
      single_user_allowed INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      updated_by INTEGER,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const seed=db.prepare(`INSERT OR IGNORE INTO access_approval_levels(level,level_name,description,payment_limit,expense_limit,approval_limit,single_user_allowed,active)
                         VALUES(?,?,?,?,?,?,?,1)`);
  const defaults=[
    [0,'L0 — No Approval','No independent approval authority.',0,0,0,1],
    [1,'L1 — Basic Approval','Entry-level delegated approval authority.',1000000,1000000,1000000,1],
    [2,'L2 — Operational Approval','Operational approval authority for normal business activity.',5000000,5000000,5000000,1],
    [3,'L3 — Senior Approval','Senior delegated approval authority.',20000000,20000000,20000000,1],
    [4,'L4 — Executive Approval','High-value single-user approval authority below protected dual approval.',100000000,100000000,100000000,1],
    [5,'L5 — Dual / Protected Approval','Protected dual-approval level. It is not assigned to one user as ordinary authority.',null,null,null,0],
  ];
  for(const d of defaults)seed.run(...d);
  const profileDescriptions={
    'CEO / Owner':'Full protected company authority with audited owner-level bypass where explicitly defined.',
    'System Administrator':'Manages system configuration, users and approved shared access structures within delegated authority.',
    'Business Unit Manager':'Manages operational work and delegated users within assigned Business Units.',
    'Operations Manager':'Manages day-to-day operational workflows within assigned Business Units.',
    'Operations User':'Performs assigned operational work without broad administrative authority.',
    'Finance Head':'Leads Finance workflows, verification and delegated Finance-user administration.',
    'Finance User':'Performs normal Finance transactions and evidence workflows within assigned scope.',
    'Accountant':'Works with Accounting records and permitted posting/review workflows.',
    'Accounting Reviewer':'Reviews Accounting proposals and permitted posting-control work.',
    'Read Only / Auditor':'Read-oriented access for review and audit without normal mutation authority.'
  };
  const setDescription=db.prepare("UPDATE access_role_templates SET description=? WHERE role_name=? AND COALESCE(description,'')=''");
  for(const [name,description] of Object.entries(profileDescriptions))setDescription.run(description,name);
}

function normalizeRules(raw,{catalog,groups}={}){
  const modules=new Set(catalog?.modules||[]),actions=new Set(catalog?.actions||POLICY_ACTIONS),groupKeys=new Set((groups||[]).map(x=>x.group_key));
  const rows=Array.isArray(raw)?raw:[];const clean=[];
  for(const r of rows){
    const type=cleanText(r?.type,64);if(!POLICY_RULE_TYPES.includes(type))throw Object.assign(new Error(`Unsupported access policy rule: ${type||'blank'}`),{status:400});
    const module=cleanText(r?.module,80),action=cleanText(r?.action,40);if(!modules.has(module))throw Object.assign(new Error(`Invalid policy module: ${module}`),{status:400});if(!actions.has(action))throw Object.assign(new Error(`Invalid policy action: ${action}`),{status:400});
    const base={type,module,action,message:cleanText(r?.message,300)};
    if(type==='require_approval_level'){const level=Number(r?.min_level);if(!Number.isInteger(level)||level<0||level>4)throw Object.assign(new Error('Policy approval level must be L0–L4.'),{status:400});base.min_level=level}
    if(type==='require_permission'){const key=cleanText(r?.permission_key,160);if(!key)throw Object.assign(new Error('Require Permission policy rule needs a permission key.'),{status:400});base.permission_key=key}
    if(type==='require_permission_group'){const key=cleanText(r?.group_key,120);if(!groupKeys.has(key))throw Object.assign(new Error(`Unknown Permission Group in policy: ${key}`),{status:400});base.group_key=key}
    clean.push(base);
  }
  return clean;
}

function install(ctx){
  const {app,db,auth,audit,notify,access,passwordPolicyError}=ctx;
  if(!access)throw new Error('V30.41 requires the V30.40 access service.');
  installSchema(db);

  const catalog=()=>({modules:access.MODULES||[],actions:access.ACTIONS||POLICY_ACTIONS,sensitive:access.SENSITIVE||[],delegated:access.DELEGATED||[],limits:access.LIMITS||[]});
  const canManageLibrary=req=>req.user?.role==='CEO / Owner'||(req.user?.role==='System Administrator'&&access.can(req.user.id,'sensitive.system_admin',req.selected_business_unit_id||req.user.business_unit_id)&&access.can(req.user.id,'delegate.access',req.selected_business_unit_id||req.user.business_unit_id));
  const requireLibrary=(req,res)=>{if(canManageLibrary(req))return true;res.status(403).json({error:'Only CEO / Owner or an authorized System Administrator can manage shared access-control structures.'});return false};
  const groupRows=()=>db.prepare(`SELECT g.*,COUNT(DISTINCT upg.user_id) assigned_users FROM access_permission_groups g LEFT JOIN user_permission_groups upg ON upg.group_key=g.group_key WHERE g.active=1 GROUP BY g.group_key ORDER BY g.group_name`).all().map(x=>({...x,permissions:json(x.permissions_json,{})}));
  const policyRows=(includeInactive=false)=>db.prepare(`SELECT p.*,b.name business_unit,CASE WHEN p.business_unit_id IS NULL THEN (SELECT COUNT(*) FROM users WHERE active=1) ELSE (SELECT COUNT(DISTINCT ubu.user_id) FROM user_business_units ubu JOIN users u ON u.id=ubu.user_id AND u.active=1 WHERE ubu.business_unit_id=p.business_unit_id) END affected_users FROM access_policy_sets p LEFT JOIN business_units b ON b.id=p.business_unit_id ${includeInactive?'':'WHERE p.active=1'} ORDER BY p.active DESC,p.policy_name`).all().map(x=>({...x,rules:json(x.rules_json,[])}));
  const levelRows=()=>db.prepare('SELECT * FROM access_approval_levels WHERE active=1 ORDER BY level').all();
  let policyCache={expires:0,rows:[]};
  function invalidatePolicyCache(){policyCache={expires:0,rows:[]}}
  function activePolicies(bu){if(policyCache.expires<Date.now())policyCache={expires:Date.now()+5000,rows:policyRows(false)};return policyCache.rows.filter(p=>p.business_unit_id==null||Number(p.business_unit_id)===Number(bu||0))}
  function policyDecision(userId,module,action,bu){
    const user=access.liveUser(userId);if(!user||!user.active)return {ok:false,reason:'Inactive user'};if(user.role==='CEO / Owner')return {ok:true,bypass:'CEO / Owner'};
    const policies=activePolicies(bu),profiles=access.assignedProfiles(userId,bu),groups=access.assignedGroups(userId,bu),groupSet=new Set(groups.map(x=>x.group_key));
    for(const p of policies){for(const r of p.rules||[]){if(r.module!==module||r.action!==action)continue;let ok=true;
      if(r.type==='deny_action')ok=false;
      else if(r.type==='ceo_only')ok=false;
      else if(r.type==='require_approval_level')ok=Number(access.approvalAuthority(userId,bu)?.approval_level||0)>=Number(r.min_level||0);
      else if(r.type==='require_permission')ok=access.can(userId,r.permission_key,bu);
      else if(r.type==='require_permission_group')ok=groupSet.has(r.group_key);
      if(!ok)return {ok:false,policy_key:p.policy_key,policy_name:p.policy_name,rule:r,reason:r.message||`Blocked by access policy ${p.policy_name}.`};
    }}
    return {ok:true};
  }
  const originalCanAction=access.canAction.bind(access);
  access.canAction=function(userId,module,action,bu=null){if(!originalCanAction(userId,module,action,bu))return false;return policyDecision(userId,module,action,bu).ok};
  access.policyDecision=policyDecision;
  access.activePolicies=activePolicies;
  access.invalidatePolicyCache=invalidatePolicyCache;

  function profileByKey(key){return access.templateForKey(String(key||''))}
  function groupByKey(key){const r=db.prepare('SELECT * FROM access_permission_groups WHERE group_key=? AND active=1').get(String(key||''));return r?{...r,permissions:json(r.permissions_json,{})}:null}
  function validateAssignablePermissions(req,permissions,bu){if(req.user.role==='CEO / Owner')return;for(const [k,v] of Object.entries(permissions||{}))if(v===true&&!access.can(req.user.id,k,bu||req.selected_business_unit_id||req.user.business_unit_id))throw Object.assign(new Error(`You cannot assign permission ${k} because it exceeds your effective authority.`),{status:403})}
  function validateProfileAssignment(req,p,bu){if(!p?.role_name||p.role_name==='CEO / Owner')throw Object.assign(new Error('Invalid Access Profile.'),{status:400});validateAssignablePermissions(req,p.permissions,bu);if(req.user.role!=='CEO / Owner')for(const [k,v] of Object.entries(p.limits||{})){const wanted=Number(v||0),own=access.getLimit(req.user.id,k,bu);if(wanted>0&&(own==null||wanted>own))throw Object.assign(new Error(`Profile limit ${k} exceeds your effective authority.`),{status:403})}}
  function validateGroupAssignment(req,g,bu){if(!g)throw Object.assign(new Error('Invalid Permission Group.'),{status:400});validateAssignablePermissions(req,g.permissions,bu)}
  function cleanProfileAssignments(req,rows,allowedUnits){
    const clean=[];let primaries=0;const seen=new Set();for(const row of Array.isArray(rows)?rows:[]){const key=cleanText(row.role_key,120),bu=row.business_unit_id==null||row.business_unit_id===''?null:Number(row.business_unit_id),p=profileByKey(key);if(bu!=null&&!allowedUnits.has(bu))throw Object.assign(new Error('Access Profile scope must be one of the user’s assigned Business Units.'),{status:400});validateProfileAssignment(req,p,bu);const sig=key+'|'+String(bu??'global');if(seen.has(sig))throw Object.assign(new Error('The same Access Profile cannot be assigned twice in the same scope.'),{status:400});seen.add(sig);const primary=bool(row.is_primary);if(primary)primaries++;clean.push({role_key:key,business_unit_id:bu,is_primary:primary,role_name:p.role_name})}
    if(!clean.length)throw Object.assign(new Error('Assign at least one Access Profile.'),{status:400});if(primaries>1)throw Object.assign(new Error('Only one Access Profile may be Primary.'),{status:400});if(!primaries)clean[0].is_primary=true;return clean;
  }
  function cleanGroupAssignments(req,rows,allowedUnits){const clean=[],seen=new Set();for(const row of Array.isArray(rows)?rows:[]){const key=cleanText(row.group_key,120),bu=row.business_unit_id==null||row.business_unit_id===''?null:Number(row.business_unit_id),g=groupByKey(key);if(bu!=null&&!allowedUnits.has(bu))throw Object.assign(new Error('Permission Group scope must be one of the user’s assigned Business Units.'),{status:400});validateGroupAssignment(req,g,bu);const sig=key+'|'+String(bu??'global');if(seen.has(sig))throw Object.assign(new Error('The same Permission Group cannot be assigned twice in the same scope.'),{status:400});seen.add(sig);clean.push({group_key:key,business_unit_id:bu,group_name:g.group_name})}return clean}
  function effectivePreview(req,profiles,groups,bu){const permissions={},sources={};const grant=(k,s)=>{permissions[k]=true;(sources[k]||(sources[k]=[])).push(s)};for(const x of profiles){if(x.business_unit_id!=null&&Number(x.business_unit_id)!==Number(bu||0))continue;const p=profileByKey(x.role_key);validateProfileAssignment(req,p,x.business_unit_id);for(const [k,v] of Object.entries(p.permissions||{}))if(v===true)grant(k,{type:'profile',key:p.role_key,name:p.role_name})}for(const x of groups){if(x.business_unit_id!=null&&Number(x.business_unit_id)!==Number(bu||0))continue;const g=groupByKey(x.group_key);validateGroupAssignment(req,g,x.business_unit_id);for(const [k,v] of Object.entries(g.permissions||{}))if(v===true)grant(k,{type:'group',key:g.group_key,name:g.group_name})}return {business_unit_id:bu||null,permissions,permission_sources:sources,count:Object.values(permissions).filter(Boolean).length}}

  app.get('/api/access/admin-v341/overview',auth,(req,res)=>{
    if(!access.canModule(req.user.id,'users',req.selected_business_unit_id||req.user.business_unit_id)&&req.user.role!=='CEO / Owner')return res.status(403).json({error:'Users & Access permission is required.'});
    const counts={users:Number(db.prepare('SELECT COUNT(*) n FROM users WHERE active=1').get().n||0),profiles:Number(db.prepare('SELECT COUNT(*) n FROM access_role_templates WHERE active=1').get().n||0),groups:Number(db.prepare('SELECT COUNT(*) n FROM access_permission_groups WHERE active=1').get().n||0),policies:Number(db.prepare('SELECT COUNT(*) n FROM access_policy_sets WHERE active=1').get().n||0)};
    res.json({counts,can_manage_library:canManageLibrary(req),approval_levels:levelRows()});
  });

  app.get('/api/access/permission-groups-v341',auth,(req,res)=>res.json(groupRows()));
  app.post('/api/access/permission-groups-v341',auth,(req,res)=>{try{if(!requireLibrary(req,res))return;const name=cleanText(req.body.group_name,120),description=cleanText(req.body.description,500),permissions=req.body.permissions&&typeof req.body.permissions==='object'?req.body.permissions:{};if(!name)return res.status(400).json({error:'Permission Group name is required.'});validateAssignablePermissions(req,permissions,req.selected_business_unit_id||req.user.business_unit_id);let key=policyKey(req.body.group_key||name);if(!key)return res.status(400).json({error:'Permission Group name is invalid.'});if(db.prepare('SELECT 1 FROM access_permission_groups WHERE group_key=? OR group_name=?').get(key,name))return res.status(409).json({error:'A Permission Group with this name already exists.'});db.prepare('INSERT INTO access_permission_groups(group_key,group_name,description,permissions_json,active,updated_at) VALUES(?,?,?,?,1,CURRENT_TIMESTAMP)').run(key,name,description,JSON.stringify(permissions));access.invalidateAccess();audit(req.user,'access_permission_group',key,'create-v341',JSON.stringify({name,permission_count:Object.values(permissions).filter(Boolean).length}));res.json({ok:true,group_key:key})}catch(e){res.status(e.status||400).json({error:e.message})}});
  app.put('/api/access/permission-groups-v341/:group_key',auth,(req,res)=>{try{if(!requireLibrary(req,res))return;const old=groupByKey(req.params.group_key);if(!old)return res.status(404).json({error:'Permission Group not found.'});const name=cleanText(req.body.group_name||old.group_name,120),description=cleanText(req.body.description??old.description,500),permissions=req.body.permissions&&typeof req.body.permissions==='object'?req.body.permissions:old.permissions;validateAssignablePermissions(req,permissions,req.selected_business_unit_id||req.user.business_unit_id);const dup=db.prepare('SELECT group_key FROM access_permission_groups WHERE group_name=? AND group_key<>?').get(name,old.group_key);if(dup)return res.status(409).json({error:'Another Permission Group already uses this name.'});const affected=Number(db.prepare('SELECT COUNT(DISTINCT user_id) n FROM user_permission_groups WHERE group_key=?').get(old.group_key).n||0);db.prepare('UPDATE access_permission_groups SET group_name=?,description=?,permissions_json=?,updated_at=CURRENT_TIMESTAMP WHERE group_key=?').run(name,description,JSON.stringify(permissions),old.group_key);access.invalidateAccess();audit(req.user,'access_permission_group',old.group_key,'update-v341',JSON.stringify({before:{name:old.group_name,description:old.description,permissions:old.permissions},after:{name,description,permissions},affected_users:affected}));res.json({ok:true,affected_users:affected})}catch(e){res.status(e.status||400).json({error:e.message})}});
  app.post('/api/access/permission-groups-v341/:group_key/duplicate',auth,(req,res)=>{if(!requireLibrary(req,res))return;const old=groupByKey(req.params.group_key);if(!old)return res.status(404).json({error:'Permission Group not found.'});const name=cleanText(req.body.group_name||`${old.group_name} Copy`,120);let key=policyKey(name),i=2;while(db.prepare('SELECT 1 FROM access_permission_groups WHERE group_key=? OR group_name=?').get(key,name))key=policyKey(name+' '+i++);db.prepare('INSERT INTO access_permission_groups(group_key,group_name,description,permissions_json,active,updated_at) VALUES(?,?,?,?,1,CURRENT_TIMESTAMP)').run(key,name,old.description,JSON.stringify(old.permissions));audit(req.user,'access_permission_group',key,'duplicate-v341',JSON.stringify({source:old.group_key,name}));res.json({ok:true,group_key:key})});
  app.post('/api/access/permission-groups-v341/:group_key/archive',auth,(req,res)=>{if(!requireLibrary(req,res))return;const old=groupByKey(req.params.group_key);if(!old)return res.status(404).json({error:'Permission Group not found.'});const affected=Number(db.prepare('SELECT COUNT(DISTINCT user_id) n FROM user_permission_groups WHERE group_key=?').get(old.group_key).n||0);if(affected)return res.status(409).json({error:`This Permission Group is assigned to ${affected} user(s). Remove those assignments before archiving.`});db.prepare('UPDATE access_permission_groups SET active=0,updated_at=CURRENT_TIMESTAMP WHERE group_key=?').run(old.group_key);access.invalidateAccess();audit(req.user,'access_permission_group',old.group_key,'archive-v341',JSON.stringify({name:old.group_name}));res.json({ok:true})});

  app.post('/api/access/profiles/:role_key/archive-v341',auth,(req,res)=>{if(!requireLibrary(req,res))return;const p=profileByKey(req.params.role_key);if(!p.role_name)return res.status(404).json({error:'Access Profile not found.'});if(p.role_name==='CEO / Owner')return res.status(403).json({error:'CEO / Owner is a protected Access Profile.'});const affected=Number(db.prepare('SELECT COUNT(DISTINCT user_id) n FROM user_access_profiles WHERE role_key=?').get(p.role_key).n||0);if(affected)return res.status(409).json({error:`This Access Profile is assigned to ${affected} user(s). Reassign those users before archiving.`});db.prepare('UPDATE access_role_templates SET active=0,updated_at=CURRENT_TIMESTAMP WHERE role_key=?').run(p.role_key);access.invalidateAccess();audit(req.user,'access_profile',p.role_key,'archive-v341',JSON.stringify({name:p.role_name}));res.json({ok:true})});

  app.get('/api/access/policies-v341',auth,(req,res)=>res.json(policyRows(true)));
  app.post('/api/access/policies-v341',auth,(req,res)=>{try{if(!requireLibrary(req,res))return;const name=cleanText(req.body.policy_name,140),description=cleanText(req.body.description,800),bu=req.body.business_unit_id==null||req.body.business_unit_id===''?null:Number(req.body.business_unit_id);if(!name)return res.status(400).json({error:'Access Policy name is required.'});if(bu!=null&&access.validUnitIds([bu]).length!==1)return res.status(400).json({error:'Invalid Business Unit policy scope.'});const rules=normalizeRules(req.body.rules,{catalog:catalog(),groups:groupRows()});let key=policyKey(req.body.policy_key||name);if(db.prepare('SELECT 1 FROM access_policy_sets WHERE policy_key=? OR policy_name=?').get(key,name))return res.status(409).json({error:'An Access Policy with this name already exists.'});db.prepare('INSERT INTO access_policy_sets(policy_key,policy_name,description,business_unit_id,rules_json,active,created_by,updated_by) VALUES(?,?,?,?,?,1,?,?)').run(key,name,description,bu,JSON.stringify(rules),req.user.id,req.user.id);invalidatePolicyCache();audit(req.user,'access_policy',key,'create-v341',JSON.stringify({name,business_unit_id:bu,rule_count:rules.length}));res.json({ok:true,policy_key:key})}catch(e){res.status(e.status||400).json({error:e.message})}});
  app.put('/api/access/policies-v341/:policy_key',auth,(req,res)=>{try{if(!requireLibrary(req,res))return;const old=db.prepare('SELECT * FROM access_policy_sets WHERE policy_key=?').get(req.params.policy_key);if(!old)return res.status(404).json({error:'Access Policy not found.'});const name=cleanText(req.body.policy_name||old.policy_name,140),description=cleanText(req.body.description??old.description,800),bu=req.body.business_unit_id==null||req.body.business_unit_id===''?null:Number(req.body.business_unit_id);if(bu!=null&&access.validUnitIds([bu]).length!==1)return res.status(400).json({error:'Invalid Business Unit policy scope.'});const rules=normalizeRules(req.body.rules,{catalog:catalog(),groups:groupRows()}),active=req.body.active===undefined?Number(old.active):bool(req.body.active)?1:0,dup=db.prepare('SELECT policy_key FROM access_policy_sets WHERE policy_name=? AND policy_key<>?').get(name,old.policy_key);if(dup)return res.status(409).json({error:'Another Access Policy already uses this name.'});db.prepare('UPDATE access_policy_sets SET policy_name=?,description=?,business_unit_id=?,rules_json=?,active=?,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE policy_key=?').run(name,description,bu,JSON.stringify(rules),active,req.user.id,old.policy_key);invalidatePolicyCache();audit(req.user,'access_policy',old.policy_key,'update-v341',JSON.stringify({before:{policy_name:old.policy_name,business_unit_id:old.business_unit_id,rules:json(old.rules_json,[]),active:old.active},after:{policy_name:name,business_unit_id:bu,rules,active}}));res.json({ok:true})}catch(e){res.status(e.status||400).json({error:e.message})}});
  app.post('/api/access/policies-v341/:policy_key/duplicate',auth,(req,res)=>{if(!requireLibrary(req,res))return;const old=db.prepare('SELECT * FROM access_policy_sets WHERE policy_key=?').get(req.params.policy_key);if(!old)return res.status(404).json({error:'Access Policy not found.'});const name=cleanText(req.body.policy_name||`${old.policy_name} Copy`,140);let key=policyKey(name),i=2;while(db.prepare('SELECT 1 FROM access_policy_sets WHERE policy_key=? OR policy_name=?').get(key,name))key=policyKey(name+' '+i++);db.prepare('INSERT INTO access_policy_sets(policy_key,policy_name,description,business_unit_id,rules_json,active,created_by,updated_by) VALUES(?,?,?,?,?,1,?,?)').run(key,name,old.description,old.business_unit_id,old.rules_json,req.user.id,req.user.id);invalidatePolicyCache();audit(req.user,'access_policy',key,'duplicate-v341',JSON.stringify({source:old.policy_key,name}));res.json({ok:true,policy_key:key})});
  app.post('/api/access/policies-v341/:policy_key/archive',auth,(req,res)=>{if(!requireLibrary(req,res))return;const old=db.prepare('SELECT * FROM access_policy_sets WHERE policy_key=?').get(req.params.policy_key);if(!old)return res.status(404).json({error:'Access Policy not found.'});db.prepare('UPDATE access_policy_sets SET active=0,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE policy_key=?').run(req.user.id,old.policy_key);invalidatePolicyCache();audit(req.user,'access_policy',old.policy_key,'archive-v341',JSON.stringify({name:old.policy_name}));res.json({ok:true})});

  app.get('/api/access/approval-levels-v341',auth,(req,res)=>res.json(levelRows()));
  app.put('/api/access/approval-levels-v341/:level',auth,(req,res)=>{if(!requireLibrary(req,res))return;const level=Number(req.params.level);if(!Number.isInteger(level)||level<0||level>5)return res.status(400).json({error:'Approval level must be L0–L5.'});const old=db.prepare('SELECT * FROM access_approval_levels WHERE level=?').get(level);if(!old)return res.status(404).json({error:'Approval level not found.'});const name=cleanText(req.body.level_name||old.level_name,140),description=cleanText(req.body.description??old.description,800),num=v=>v==null||v===''?null:Math.max(0,Number(v));const payment=num(req.body.payment_limit),expense=num(req.body.expense_limit),approval=num(req.body.approval_limit),single=level===5?0:bool(req.body.single_user_allowed??old.single_user_allowed)?1:0;db.prepare('UPDATE access_approval_levels SET level_name=?,description=?,payment_limit=?,expense_limit=?,approval_limit=?,single_user_allowed=?,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE level=?').run(name,description,payment,expense,approval,single,req.user.id,level);audit(req.user,'access_approval_level',String(level),'update-v341',JSON.stringify({before:old,after:{level_name:name,description,payment_limit:payment,expense_limit:expense,approval_limit:approval,single_user_allowed:single}}));res.json({ok:true})});

  app.get('/api/access/audit-v341',auth,(req,res)=>{if(req.user.role!=='CEO / Owner'&&!access.can(req.user.id,'sensitive.audit_logs',req.selected_business_unit_id||req.user.business_unit_id)&&!access.can(req.user.id,'sensitive.system_admin',req.selected_business_unit_id||req.user.business_unit_id))return res.status(403).json({error:'Access Audit is not authorized for your account.'});const limit=Math.max(20,Math.min(Number(req.query.limit||200),500));const a=db.prepare(`SELECT a.created_at at,u.name actor,a.entity,a.entity_id,a.action,a.details FROM audit_log a LEFT JOIN users u ON u.id=a.user_id WHERE a.entity IN ('access_profile','access_permission_group','access_policy','access_approval_level','user_access') ORDER BY a.id DESC LIMIT ?`).all(limit);const h=db.prepare(`SELECT h.created_at at,u.name actor,'user_access' entity,CAST(h.target_user_id AS TEXT) entity_id,h.action,h.details_json details FROM access_change_history h LEFT JOIN users u ON u.id=h.changed_by ORDER BY h.id DESC LIMIT ?`).all(limit);res.json([...a,...h].sort((x,y)=>String(y.at||'').localeCompare(String(x.at||''))).slice(0,limit))});

  app.post('/api/access/preview-v341',auth,(req,res)=>{try{const units=new Set(uniqueNums(req.body.business_unit_ids||[])),profiles=cleanProfileAssignments(req,req.body.profiles,units),groups=cleanGroupAssignments(req,req.body.groups||[],units),bu=Number(req.body.business_unit_id||req.body.primary_business_unit_id||[...units][0]||0)||null;res.json(effectivePreview(req,profiles,groups,bu))}catch(e){res.status(e.status||400).json({error:e.message})}});

  app.post('/api/access/users/bulk-groups-v341',auth,(req,res)=>{try{
    const ids=uniqueNums(req.body.user_ids),groupKey=cleanText(req.body.group_key,120),bu=req.body.business_unit_id==null||req.body.business_unit_id===''?null:Number(req.body.business_unit_id),g=groupByKey(groupKey);
    if(!ids.length)return res.status(400).json({error:'Select at least one user.'});if(!g)return res.status(400).json({error:'Invalid Permission Group.'});if(req.user.role!=='CEO / Owner'&&bu==null)return res.status(400).json({error:'Delegated administrators must select a specific Business Unit for bulk Permission Group assignment.'});if(bu!=null&&access.validUnitIds([bu]).length!==1)return res.status(400).json({error:'Invalid Business Unit scope.'});validateGroupAssignment(req,g,bu);
    const targets=ids.map(id=>access.liveUser(id));if(targets.some(x=>!x))return res.status(404).json({error:'One or more selected users were not found.'});for(const target of targets){if(target.role==='CEO / Owner')return res.status(403).json({error:'CEO / Owner access cannot be bulk changed.'});const units=access.assignedUnits(target.id).map(x=>x.id),manage=access.canManageTarget(req,target,null,units);if(!manage.ok)return res.status(403).json({error:manage.error});if(bu!=null&&!units.some(x=>Number(x)===bu))return res.status(400).json({error:`${target.name} is not assigned to the selected Business Unit.`})}
    db.transaction(()=>{for(const target of targets){if(bu==null)db.prepare('INSERT OR IGNORE INTO user_permission_groups(user_id,group_key,business_unit_id,assigned_by) VALUES(?,?,NULL,?)').run(target.id,groupKey,req.user.id);else db.prepare('INSERT OR IGNORE INTO user_permission_groups(user_id,group_key,business_unit_id,assigned_by) VALUES(?,?,?,?)').run(target.id,groupKey,bu,req.user.id);access.history(target.id,req.user.id,'bulk_group_add_v341',{group_key:groupKey,group_name:g.group_name,business_unit_id:bu},bu);access.invalidateAccess(target.id)}})();res.json({ok:true,updated_users:targets.length})
  }catch(e){res.status(e.status||400).json({error:e.message})}});

  app.post('/api/access/users-v341',auth,(req,res)=>{try{
    const name=cleanText(req.body.name,160),email=cleanText(req.body.email,240).toLowerCase(),password=String(req.body.password||''),jobTitle=cleanText(req.body.job_title,160),unitIds=uniqueNums(req.body.business_unit_ids),primary=Number(req.body.primary_business_unit_id||unitIds[0]||0)||null;
    if(!name||!email||!password)return res.status(400).json({error:'Name, email and temporary password are required.'});if(!unitIds.length)return res.status(400).json({error:'Assign at least one Business Unit.'});if(!primary||!unitIds.includes(primary))return res.status(400).json({error:'Primary Business Unit must be one of the assigned Business Units.'});if(access.validUnitIds(unitIds).length!==unitIds.length)return res.status(400).json({error:'One or more selected Business Units are invalid or archived.'});if(req.user.role!=='CEO / Owner'){const actor=new Set(access.actorUnits(req).map(Number));if(unitIds.some(x=>!actor.has(x)))return res.status(403).json({error:'You cannot create a user outside your delegated Business Unit scope.'});if(!access.can(req.user.id,'delegate.users',primary)&&!access.can(req.user.id,'delegate.bu_users',primary)&&!access.can(req.user.id,'delegate.finance_users',primary))return res.status(403).json({error:'Delegated user administration is not enabled for your account.'})}
    const allowedUnits=new Set(unitIds),profiles=cleanProfileAssignments(req,req.body.profiles,allowedUnits),groups=cleanGroupAssignments(req,req.body.groups||[],allowedUnits),primaryProfile=profiles.find(x=>x.is_primary)||profiles[0];const pseudo={id:-1,role:primaryProfile.role_name,business_unit_id:primary,active:1};const manage=access.canManageTarget(req,pseudo,primaryProfile.role_name,unitIds);if(!manage.ok)return res.status(403).json({error:manage.error});
    const pErr=typeof passwordPolicyError==='function'?passwordPolicyError(password,null,primary):(password.length<12?'Password must be at least 12 characters.':'');if(pErr)return res.status(400).json({error:pErr});if(db.prepare('SELECT 1 FROM users WHERE lower(email)=lower(?)').get(email))return res.status(409).json({error:'Email already exists'});
    const level=Math.max(0,Math.min(4,Number(req.body.approval_level||0))),levelCfg=db.prepare('SELECT * FROM access_approval_levels WHERE level=? AND active=1').get(level),num=(v,fallback)=>v==null||v===''?(fallback==null?null:Number(fallback)):Math.max(0,Number(v));if(req.user.role!=='CEO / Owner'){const own=Number(access.approvalAuthority(req.user.id,primary)?.approval_level||0);if(level>own)return res.status(403).json({error:'You cannot assign an approval level above your own delegated Approval Authority.'})}
    let id;db.transaction(()=>{const r=db.prepare("INSERT INTO users(name,email,password_hash,role,business_unit_id,job_title,preferred_language,language_explicit) VALUES(?,?,?,?,?,?,'ko',0)").run(name,email,bcrypt.hashSync(password,12),primaryProfile.role_name,primary,jobTitle);id=Number(r.lastInsertRowid);const ibu=db.prepare('INSERT INTO user_business_units(user_id,business_unit_id,is_primary,assigned_by) VALUES(?,?,?,?)');for(const bu of unitIds)ibu.run(id,bu,bu===primary?1:0,req.user.id);const ip=db.prepare('INSERT INTO user_access_profiles(user_id,role_key,business_unit_id,is_primary,assigned_by) VALUES(?,?,?,?,?)');for(const p of profiles)ip.run(id,p.role_key,p.business_unit_id,p.is_primary?1:0,req.user.id);const ig=db.prepare('INSERT INTO user_permission_groups(user_id,group_key,business_unit_id,assigned_by) VALUES(?,?,?,?)');for(const g of groups)ig.run(id,g.group_key,g.business_unit_id,req.user.id);db.prepare('INSERT INTO user_approval_authority(user_id,business_unit_id,approval_level,payment_limit,expense_limit,approval_limit,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)').run(id,primary,level,num(req.body.payment_limit,levelCfg?.payment_limit),num(req.body.expense_limit,levelCfg?.expense_limit),num(req.body.approval_limit,levelCfg?.approval_limit),req.user.id)})();access.invalidateAccess(id);audit(req.user,'user',id,'create-v341',JSON.stringify({email,job_title:jobTitle,profiles:profiles.map(x=>x.role_key),groups:groups.map(x=>x.group_key),business_unit_ids:unitIds,approval_level:level}));access.history(id,req.user.id,'user_create_v341',{after:access.accessSnapshot(id),job_title:jobTitle},primary);try{notify(id,'info','Welcome to Blue Ocean','Your account has been created.')}catch(_){}res.json({ok:true,id})
  }catch(e){res.status(e.status||400).json({error:String(e.message||'').includes('UNIQUE')?'Email already exists':e.message})}});

  app.put('/api/access/users/:id/identity-v341',auth,(req,res)=>{try{const u=access.liveUser(req.params.id);if(!u)return res.status(404).json({error:'User not found'});const check=access.canManageTarget(req,u,null,access.assignedUnits(u.id).map(x=>x.id));if(!check.ok)return res.status(403).json({error:check.error});const current=db.prepare('SELECT * FROM users WHERE id=?').get(u.id),name=cleanText(req.body.name??current.name,160),email=cleanText(req.body.email??current.email,240).toLowerCase(),jobTitle=cleanText(req.body.job_title??current.job_title,160),password=String(req.body.password||'');if(!name||!email)return res.status(400).json({error:'Name and email are required.'});if(password){const err=typeof passwordPolicyError==='function'?passwordPolicyError(password,u.id,current.business_unit_id):(password.length<12?'Password must be at least 12 characters.':'');if(err)return res.status(400).json({error:err})}const dup=db.prepare('SELECT id FROM users WHERE lower(email)=lower(?) AND id<>?').get(email,u.id);if(dup)return res.status(409).json({error:'Email already exists'});db.transaction(()=>{db.prepare('UPDATE users SET name=?,email=?,job_title=?,auth_version=COALESCE(auth_version,1)+? WHERE id=?').run(name,email,jobTitle,password?1:0,u.id);if(password)db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(password,12),u.id)})();audit(req.user,'user',u.id,'identity-update-v341',JSON.stringify({email,job_title:jobTitle,sessions_revoked:!!password}));access.history(u.id,req.user.id,'identity_update_v341',{name,email,job_title:jobTitle,password_changed:!!password},current.business_unit_id||null);res.json({ok:true})}catch(e){res.status(e.status||400).json({error:e.message})}});

  access.POLICY_RULE_TYPES=POLICY_RULE_TYPES;
  access.v341={groupRows,policyRows,levelRows,canManageLibrary,policyDecision};
  return access;
}

module.exports={install,POLICY_RULE_TYPES};
