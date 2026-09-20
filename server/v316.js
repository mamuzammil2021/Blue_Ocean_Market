const crypto=require('crypto');

const ACTIONS=['view','create','edit','delete','void','approve','export','print','verify','correct','allocate'];
const MODULES=['dashboard','businesses','sales','purchases','inventory','finance','accounting','approvals','tasks','performance','reports','documents','meetings','restaurant','excavator','excavatorSuppliers','excavatorBuyers','notifications','users','audit','payroll'];
const SENSITIVE=['sensitive.user_management','sensitive.approval_rules','sensitive.accounting_adjustments','sensitive.payroll','sensitive.audit_logs','sensitive.system_admin','sensitive.smtp','sensitive.storage','sensitive.data_migration','sensitive.bank_accounts','sensitive.ai_settings','sensitive.accounting_configuration'];
const DELEGATED=['delegate.users','delegate.bu_users','delegate.finance_users','delegate.access'];
const LIMITS=['finance_payment_max','finance_expense_max','finance_approval_max','max_discount_pct','manual_price_override_max_pct'];
const FINANCE_MODULES=new Set(['dashboard','finance','accounting','approvals','reports','documents','notifications','users']);
const FINANCE_LIMITS=new Set(['finance_payment_max','finance_expense_max','finance_approval_max']);
const MODULE_ALIASES={staff:'users',crm:'sales',customers:'sales',kpi:'performance',pos:'sales'};
const FINANCE_PERMISSION_PREFIXES=['module.finance.','module.accounting.','module.approvals.','module.reports.','module.documents.','module.notifications.','module.users.','sensitive.accounting_adjustments','sensitive.audit_logs','delegate.finance_users'];

function json(v,fallback={}){try{return JSON.parse(v||'')||fallback}catch(_){return fallback}}
function uniqueNums(values){return [...new Set((values||[]).map(Number).filter(Number.isInteger).filter(x=>x>0))]}
function roleKey(role){return String(role||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')}
function normalizeModule(module){const m=String(module||'').trim();return MODULE_ALIASES[m]||m}
function permissionKey(module,action='view'){return `module.${normalizeModule(module)}.${action}`}
function allActions(mods){const out={};for(const m of mods)for(const a of ACTIONS)out[permissionKey(m,a)]=true;return out}
function viewOnly(mods){const out={};for(const m of mods)out[permissionKey(m,'view')]=true;return out}
function pickActions(mods,actions){const out={};for(const m of mods)for(const a of actions)out[permissionKey(m,a)]=true;return out}
function merge(...parts){return Object.assign({},...parts)}

function defaultTemplates(){
  const common=viewOnly(['dashboard','tasks','performance','reports','documents','meetings','notifications']);
  return [
    {role:'CEO / Owner',name:'CEO / Owner',permissions:merge(allActions(MODULES),Object.fromEntries(SENSITIVE.map(k=>[k,true])),Object.fromEntries(DELEGATED.map(k=>[k,true]))),limits:{}},
    {role:'System Administrator',name:'System Administrator',permissions:merge(viewOnly(['dashboard','reports','documents','notifications']),pickActions(['users'],['view','create','edit']),{'sensitive.system_admin':true,'sensitive.user_management':true,'sensitive.smtp':true,'sensitive.storage':true,'sensitive.data_migration':true,'sensitive.ai_settings':true,'delegate.users':true,'delegate.bu_users':true,'delegate.access':true}),limits:{finance_payment_max:0,finance_expense_max:0,finance_approval_max:0,max_discount_pct:0,manual_price_override_max_pct:0}},
    {role:'Business Unit Manager',name:'Business Unit Manager',permissions:merge(common,allActions(['sales','purchases','inventory','finance','approvals','tasks','performance','reports','documents','meetings','restaurant','excavator','excavatorSuppliers','excavatorBuyers']),pickActions(['users'],['view','create','edit']),{'delegate.users':true,'delegate.bu_users':true,'delegate.access':true,'sensitive.user_management':true,'sensitive.approval_rules':true}),limits:{finance_payment_max:100000000,finance_expense_max:100000000,finance_approval_max:100000000,max_discount_pct:25,manual_price_override_max_pct:25}},
    {role:'Operations Manager',name:'Operations Manager',permissions:merge(common,allActions(['sales','purchases','inventory','finance','approvals','tasks','performance','reports','documents','meetings','restaurant','excavator','excavatorSuppliers','excavatorBuyers']),pickActions(['users','audit'],['view']),{'sensitive.approval_rules':true,'sensitive.audit_logs':true}),limits:{finance_payment_max:50000000,finance_expense_max:50000000,finance_approval_max:50000000,max_discount_pct:20,manual_price_override_max_pct:20}},
    {role:'Finance Head',name:'Finance Head',permissions:merge(viewOnly(['dashboard','notifications']),allActions(['finance','accounting','approvals','reports','documents']),pickActions(['users'],['view','create','edit']),{'delegate.finance_users':true,'delegate.access':true,'sensitive.user_management':true,'sensitive.accounting_adjustments':true,'sensitive.audit_logs':true}),limits:{finance_payment_max:1000000000,finance_expense_max:1000000000,finance_approval_max:1000000000,max_discount_pct:0,manual_price_override_max_pct:0}},
    {role:'Finance User',name:'Finance User',permissions:merge(viewOnly(['dashboard','notifications']),pickActions(['finance','accounting','reports','documents'],['view','create','edit','export','print','verify','correct','allocate']),pickActions(['approvals'],['view'])),limits:{finance_payment_max:20000000,finance_expense_max:20000000,finance_approval_max:0,max_discount_pct:0,manual_price_override_max_pct:0}},
    {role:'Finance / Admin',name:'Finance / Admin (Legacy)',permissions:merge(viewOnly(['dashboard','notifications']),allActions(['finance','accounting','approvals','reports','documents','sales','purchases','inventory','payroll']),{'sensitive.accounting_adjustments':true,'sensitive.audit_logs':true,'sensitive.payroll':true}),limits:{finance_payment_max:100000000,finance_expense_max:100000000,finance_approval_max:100000000,max_discount_pct:10,manual_price_override_max_pct:10}},
    {role:'Sales / Business Development',name:'Sales / Business Development',permissions:merge(common,allActions(['sales','approvals','documents','excavator','excavatorSuppliers','excavatorBuyers']),pickActions(['finance'],['view'])),limits:{finance_payment_max:0,finance_expense_max:0,finance_approval_max:0,max_discount_pct:15,manual_price_override_max_pct:15}},
    {role:'Staff Member',name:'Staff Member',permissions:merge(viewOnly(['dashboard','tasks','performance','reports','documents','inventory','notifications']),pickActions(['tasks','reports','documents','inventory'],['create','edit'])),limits:{finance_payment_max:0,finance_expense_max:0,finance_approval_max:0,max_discount_pct:0,manual_price_override_max_pct:0}},
  ];
}

function defaultPermissionGroups(){
  return [
    {key:'account_management',name:'Account Management',description:'Manage receiver/payee and party payment accounts.',permissions:pickActions(['excavatorSuppliers','excavatorBuyers','finance'],['view','create','edit'])},
    {key:'finance_verification',name:'Finance Verification',description:'Review Finance evidence, verify eligible entries, and request corrections.',permissions:merge(pickActions(['finance'],['view','verify','correct']),viewOnly(['documents','notifications']))},
    {key:'accounting_posting',name:'Accounting Posting',description:'Review Accounting posting proposals and perform controlled posting actions.',permissions:merge(pickActions(['accounting'],['view','create','edit','approve','correct']),viewOnly(['finance','documents']))},
    {key:'documents',name:'Documents',description:'View, upload, edit, export and print documents.',permissions:pickActions(['documents'],['view','create','edit','export','print'])},
    {key:'refund_management',name:'Refund Management',description:'Work with controlled refund and advance-settlement workflows.',permissions:merge(pickActions(['finance'],['view','create','correct','allocate']),pickActions(['excavatorBuyers','excavatorSuppliers'],['view','edit','allocate']))},
    {key:'read_only_reports',name:'Read Only / Reporting',description:'Read-only dashboard, reports, documents and notifications.',permissions:viewOnly(['dashboard','reports','documents','notifications'])},
  ];
}

function installSchema(db){
  db.exec(`
    CREATE TABLE IF NOT EXISTS access_role_templates(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_key TEXT UNIQUE NOT NULL,
      role_name TEXT UNIQUE NOT NULL,
      permissions_json TEXT NOT NULL DEFAULT '{}',
      limits_json TEXT NOT NULL DEFAULT '{}',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_business_units(
      user_id INTEGER NOT NULL,
      business_unit_id INTEGER NOT NULL,
      is_primary INTEGER NOT NULL DEFAULT 0,
      assigned_by INTEGER,
      assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(user_id,business_unit_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(business_unit_id) REFERENCES business_units(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS user_access_overrides(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      business_unit_id INTEGER,
      permission_key TEXT NOT NULL,
      effect TEXT NOT NULL DEFAULT 'Inherit',
      updated_by INTEGER,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id,business_unit_id,permission_key),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS user_access_limits(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      business_unit_id INTEGER,
      limit_key TEXT NOT NULL,
      limit_value REAL,
      updated_by INTEGER,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id,business_unit_id,limit_key),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS access_change_history(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_user_id INTEGER NOT NULL,
      business_unit_id INTEGER,
      changed_by INTEGER,
      action TEXT NOT NULL,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(target_user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS user_access_profiles(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_key TEXT NOT NULL,
      business_unit_id INTEGER,
      is_primary INTEGER NOT NULL DEFAULT 0,
      assigned_by INTEGER,
      assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id,role_key,business_unit_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(business_unit_id) REFERENCES business_units(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS access_permission_groups(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_key TEXT UNIQUE NOT NULL,
      group_name TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      permissions_json TEXT NOT NULL DEFAULT '{}',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_permission_groups(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      group_key TEXT NOT NULL,
      business_unit_id INTEGER,
      assigned_by INTEGER,
      assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id,group_key,business_unit_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(business_unit_id) REFERENCES business_units(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS user_approval_authority(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      business_unit_id INTEGER,
      approval_level INTEGER NOT NULL DEFAULT 0,
      payment_limit REAL,
      expense_limit REAL,
      approval_limit REAL,
      updated_by INTEGER,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id,business_unit_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(business_unit_id) REFERENCES business_units(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_user_access_overrides_user ON user_access_overrides(user_id,business_unit_id);
    CREATE INDEX IF NOT EXISTS idx_user_access_limits_user ON user_access_limits(user_id,business_unit_id);
    CREATE INDEX IF NOT EXISTS idx_user_business_units_user ON user_business_units(user_id,is_primary);
    CREATE INDEX IF NOT EXISTS idx_access_history_target ON access_change_history(target_user_id,created_at);
    CREATE INDEX IF NOT EXISTS idx_user_access_profiles_user ON user_access_profiles(user_id,business_unit_id,is_primary);
    CREATE INDEX IF NOT EXISTS idx_user_permission_groups_user ON user_permission_groups(user_id,business_unit_id);
    CREATE INDEX IF NOT EXISTS idx_user_approval_authority_user ON user_approval_authority(user_id,business_unit_id);
  `);
  // V30.40 scope uniqueness hardening. SQLite UNIQUE treats NULL values as
  // distinct, so normalize any early-test duplicates first and then enforce one
  // global (NULL BU) row per logical profile/group/authority scope.
  db.exec(`
    DELETE FROM user_access_profiles WHERE id NOT IN (SELECT MIN(id) FROM user_access_profiles GROUP BY user_id,role_key,COALESCE(business_unit_id,0));
    DELETE FROM user_permission_groups WHERE id NOT IN (SELECT MIN(id) FROM user_permission_groups GROUP BY user_id,group_key,COALESCE(business_unit_id,0));
    DELETE FROM user_approval_authority WHERE id NOT IN (SELECT MAX(id) FROM user_approval_authority GROUP BY user_id,COALESCE(business_unit_id,0));
    CREATE UNIQUE INDEX IF NOT EXISTS ux_user_access_profiles_scope ON user_access_profiles(user_id,role_key,COALESCE(business_unit_id,0));
    CREATE UNIQUE INDEX IF NOT EXISTS ux_user_permission_groups_scope ON user_permission_groups(user_id,group_key,COALESCE(business_unit_id,0));
    CREATE UNIQUE INDEX IF NOT EXISTS ux_user_approval_authority_scope ON user_approval_authority(user_id,COALESCE(business_unit_id,0));
  `);
  const seedProfile=db.prepare(`INSERT OR IGNORE INTO access_role_templates(role_key,role_name,permissions_json,limits_json,active,updated_at)
    VALUES(?,?,?,?,1,CURRENT_TIMESTAMP)`);
  for(const t of defaultTemplates())seedProfile.run(roleKey(t.role),t.role,JSON.stringify(t.permissions),JSON.stringify(t.limits));
  const seedGroup=db.prepare(`INSERT OR IGNORE INTO access_permission_groups(group_key,group_name,description,permissions_json,active,updated_at) VALUES(?,?,?,?,1,CURRENT_TIMESTAMP)`);
  for(const g of defaultPermissionGroups())seedGroup.run(g.key,g.name,g.description,JSON.stringify(g.permissions));
  const users=db.prepare('SELECT id,business_unit_id,role FROM users').all();
  const ins=db.prepare('INSERT OR IGNORE INTO user_business_units(user_id,business_unit_id,is_primary,assigned_by) VALUES(?,?,1,NULL)');
  for(const u of users)if(u.business_unit_id)ins.run(u.id,u.business_unit_id);
  // Keep exactly one primary assignment per user when assignments exist.
  for(const u of users){
    const rows=db.prepare('SELECT business_unit_id,is_primary FROM user_business_units WHERE user_id=? ORDER BY is_primary DESC,business_unit_id').all(u.id);
    if(!rows.length)continue;
    const primary=rows.find(x=>x.is_primary)?.business_unit_id||u.business_unit_id||rows[0].business_unit_id;
    db.prepare('UPDATE user_business_units SET is_primary=CASE WHEN business_unit_id=? THEN 1 ELSE 0 END WHERE user_id=?').run(primary,u.id);
    if(Number(u.business_unit_id||0)!==Number(primary||0))db.prepare('UPDATE users SET business_unit_id=? WHERE id=?').run(primary,u.id);
  }
  // V30.40: lossless migration from one legacy role to one profile per assigned BU.
  // Existing users retain the same effective permissions before administrators begin
  // combining multiple Access Profiles.
  const profileExists=db.prepare('SELECT 1 FROM user_access_profiles WHERE user_id=? LIMIT 1');
  const profileKey=db.prepare('SELECT role_key FROM access_role_templates WHERE role_name=? AND active=1');
  const insertProfile=db.prepare('INSERT OR IGNORE INTO user_access_profiles(user_id,role_key,business_unit_id,is_primary,assigned_by) VALUES(?,?,?,?,NULL)');
  for(const u of users){
    if(u.role==='CEO / Owner'||profileExists.get(u.id))continue;
    const key=profileKey.get(u.role)?.role_key;if(!key)continue;
    const scopes=db.prepare('SELECT business_unit_id,is_primary FROM user_business_units WHERE user_id=? ORDER BY is_primary DESC,business_unit_id').all(u.id);
    if(scopes.length)for(const sc of scopes)insertProfile.run(u.id,key,sc.business_unit_id,sc.is_primary?1:0);
    else insertProfile.run(u.id,key,null,1);
  }
}

function install(ctx){
  const {app,db,auth,audit,notify}=ctx;
  installSchema(db);

  const ACCESS_CACHE_TTL_MS=Math.max(500,Math.min(Number(process.env.BOM_ACCESS_CACHE_MS||5000),30000));
  const effectiveCache=new Map(),assignedCache=new Map();
  function cacheFresh(x){return !!x&&x.expires>Date.now()}
  function invalidateAccess(userId=null){
    if(userId==null){effectiveCache.clear();assignedCache.clear();return}
    const prefix=String(Number(userId))+'|';for(const k of effectiveCache.keys())if(k.startsWith(prefix))effectiveCache.delete(k);assignedCache.delete(Number(userId));
  }
  function liveUser(id){return db.prepare("SELECT id,name,email,role,business_unit_id,active,COALESCE(preferred_language,'ko') preferred_language,COALESCE(auth_version,1) auth_version FROM users WHERE id=?").get(Number(id))}
  function assignedUnits(userId){const id=Number(userId),hit=assignedCache.get(id);if(cacheFresh(hit))return hit.value;const value=db.prepare(`SELECT b.id,b.name,b.status,ubu.is_primary FROM user_business_units ubu JOIN business_units b ON b.id=ubu.business_unit_id WHERE ubu.user_id=? AND b.status!='Archived' ORDER BY ubu.is_primary DESC,b.name`).all(id);assignedCache.set(id,{value,expires:Date.now()+ACCESS_CACHE_TTL_MS});return value}
  function isAssigned(userId,bu){return assignedUnits(userId).some(x=>Number(x.id)===Number(bu))}
  function normalizeTemplate(t){return t?{...t,permissions:json(t.permissions_json,{}),limits:json(t.limits_json,{})}:{role_key:'',role_name:'',permissions:{},limits:{}}}
  function templateForRole(role){return normalizeTemplate(db.prepare('SELECT * FROM access_role_templates WHERE role_name=? AND active=1').get(String(role||'')))}
  function templateForKey(key){return normalizeTemplate(db.prepare('SELECT * FROM access_role_templates WHERE role_key=? AND active=1').get(String(key||'')))}
  function assignedProfiles(userId,bu=null){
    const params=[Number(userId)];let where='uap.user_id=?';
    if(bu!=null){where+=' AND (uap.business_unit_id IS NULL OR uap.business_unit_id=?)';params.push(Number(bu))}
    return db.prepare(`SELECT uap.id,uap.role_key,uap.business_unit_id,uap.is_primary,uap.assigned_at,t.role_name,t.permissions_json,t.limits_json FROM user_access_profiles uap JOIN access_role_templates t ON t.role_key=uap.role_key AND t.active=1 WHERE ${where} ORDER BY uap.is_primary DESC,t.role_name,uap.id`).all(...params).map(x=>({...x,permissions:json(x.permissions_json,{}),limits:json(x.limits_json,{})}));
  }
  function assignedGroups(userId,bu=null){
    const params=[Number(userId)];let where='upg.user_id=?';if(bu!=null){where+=' AND (upg.business_unit_id IS NULL OR upg.business_unit_id=?)';params.push(Number(bu))}
    return db.prepare(`SELECT upg.id,upg.group_key,upg.business_unit_id,upg.assigned_at,g.group_name,g.description,g.permissions_json FROM user_permission_groups upg JOIN access_permission_groups g ON g.group_key=upg.group_key AND g.active=1 WHERE ${where} ORDER BY g.group_name,upg.id`).all(...params).map(x=>({...x,permissions:json(x.permissions_json,{})}));
  }
  function overrides(userId,bu){
    const rows=db.prepare(`SELECT business_unit_id,permission_key,effect FROM user_access_overrides WHERE user_id=? AND (business_unit_id IS NULL OR business_unit_id=?) ORDER BY CASE WHEN business_unit_id IS NULL THEN 0 ELSE 1 END,id`).all(Number(userId),Number(bu||0));
    return rows;
  }
  function limitRows(userId,bu){return db.prepare(`SELECT business_unit_id,limit_key,limit_value FROM user_access_limits WHERE user_id=? AND (business_unit_id IS NULL OR business_unit_id=?) ORDER BY CASE WHEN business_unit_id IS NULL THEN 0 ELSE 1 END,id`).all(Number(userId),Number(bu||0))}
  function effectiveAccess(userId,bu=null){
    const id=Number(userId),cacheKey=id+'|'+String(bu==null?'default':Number(bu)),hit=effectiveCache.get(cacheKey);if(cacheFresh(hit))return hit.value;
    const u=liveUser(id);if(!u||!u.active)return {user:null,business_unit_id:null,permissions:{},permissions_plain:{},limits:{},assigned_units:[],profiles:[],groups:[],permission_sources:{}};
    const units=assignedUnits(u.id),selected=bu?Number(bu):(u.business_unit_id||units.find(x=>x.is_primary)?.id||null),legacy=templateForRole(u.role);
    let value;
    if(u.role==='CEO / Owner'){
      value={user:u,business_unit_id:selected,permissions:new Proxy({}, {get:()=>true}),permissions_plain:Object.fromEntries([...MODULES.flatMap(m=>ACTIONS.map(a=>permissionKey(m,a))),...SENSITIVE,...DELEGATED].map(k=>[k,true])),limits:{},assigned_units:units,template:'CEO / Owner',profiles:[{role_key:'ceo_owner',role_name:'CEO / Owner',business_unit_id:null,is_primary:1}],groups:[],permission_sources:{}};
    }else{
      let profiles=assignedProfiles(u.id,selected);
      // Compatibility fallback protects legacy databases if profile migration was interrupted.
      if(!profiles.length&&legacy.role_name)profiles=[{role_key:legacy.role_key,role_name:legacy.role_name,business_unit_id:selected,is_primary:1,permissions:legacy.permissions,limits:legacy.limits,legacy_fallback:true}];
      const groups=assignedGroups(u.id,selected),permissions={},sources={},limits={};
      const grant=(key,source)=>{permissions[key]=true;(sources[key]||(sources[key]=[])).push(source)};
      for(const p of profiles){for(const [k,v] of Object.entries(p.permissions||{}))if(v===true)grant(k,{type:'profile',key:p.role_key,name:p.role_name,business_unit_id:p.business_unit_id});for(const [k,v] of Object.entries(p.limits||{})){const n=Number(v);if(Number.isFinite(n)&&(limits[k]==null||n>Number(limits[k])))limits[k]=n}}
      for(const g of groups)for(const [k,v] of Object.entries(g.permissions||{}))if(v===true)grant(k,{type:'group',key:g.group_key,name:g.group_name,business_unit_id:g.business_unit_id});
      for(const r of overrides(u.id,selected)){if(r.effect==='Allow'){permissions[r.permission_key]=true;sources[r.permission_key]=[{type:'override',effect:'Allow',business_unit_id:r.business_unit_id}]}else if(r.effect==='Deny'){permissions[r.permission_key]=false;sources[r.permission_key]=[{type:'override',effect:'Deny',business_unit_id:r.business_unit_id}]}}
      for(const r of limitRows(u.id,selected))limits[r.limit_key]=r.limit_value;
      value={user:u,business_unit_id:selected,permissions,permissions_plain:permissions,limits,assigned_units:units,template:profiles.find(x=>x.is_primary)?.role_name||profiles[0]?.role_name||legacy.role_name||u.role,profiles:profiles.map(({permissions,limits,...x})=>x),groups:groups.map(({permissions,...x})=>x),permission_sources:sources};
    }
    effectiveCache.set(cacheKey,{value,expires:Date.now()+ACCESS_CACHE_TTL_MS});return value;
  }
  function can(userId,key,bu=null){const e=effectiveAccess(userId,bu);if(!e.user||!e.user.active)return false;if(e.user.role==='CEO / Owner')return true;return e.permissions_plain[key]===true}
  function canModule(userId,module,bu=null){return can(userId,permissionKey(normalizeModule(module),'view'),bu)}
  function canAction(userId,module,action,bu=null){module=normalizeModule(module);return can(userId,permissionKey(module,action),bu)||canModule(userId,module,bu)&&action==='view'}
  function canAnyModule(userId,mods,bu=null){return (mods||[]).some(m=>canModule(userId,m,bu))}
  function getLimit(userId,key,bu=null){const e=effectiveAccess(userId,bu);const v=e.limits?.[key];return v==null||v===''?null:Number(v)}
  function history(target,by,action,details={},bu=null){db.prepare('INSERT INTO access_change_history(target_user_id,business_unit_id,changed_by,action,details_json) VALUES(?,?,?,?,?)').run(Number(target),bu?Number(bu):null,by?Number(by):null,action,JSON.stringify(details||{}));if(by)audit({id:by},'user_access',target,action,JSON.stringify(details||{}))}
  function actorUnits(req){if(req.user.role==='CEO / Owner')return db.prepare("SELECT id FROM business_units WHERE status!='Archived'").all().map(x=>x.id);return assignedUnits(req.user.id).map(x=>x.id)}
  function scopeTarget(req,target){if(req.user.role==='CEO / Owner')return true;const au=new Set(actorUnits(req));return assignedUnits(target.id).some(x=>au.has(x.id))||(!assignedUnits(target.id).length&&target.business_unit_id&&au.has(Number(target.business_unit_id)))}
  function templateSubset(actorId,role,bu){const actor=effectiveAccess(actorId,bu),desired=templateForRole(role);for(const [k,v] of Object.entries(desired.permissions||{}))if(v===true&&!actor.permissions_plain[k])return false;for(const [k,v] of Object.entries(desired.limits||{})){const requested=Number(v||0),own=actor.limits?.[k];if(requested>0&&(own==null||Number(own)<requested))return false}return true}
  function financePermissionKey(k){return FINANCE_PERMISSION_PREFIXES.some(p=>k===p||k.startsWith(p))}
  function financeOnlyAdmin(req,e,bu){if(req.user.role==='Finance Head')return true;const finance=!!e.permissions_plain['delegate.finance_users'],broad=!!(e.permissions_plain['delegate.users']||e.permissions_plain['delegate.bu_users']);return finance&&!broad}
  function validPermissionKey(key){if(SENSITIVE.includes(key)||DELEGATED.includes(key))return true;const m=String(key||'').match(/^module\.([^.]+)\.([^.]+)$/);return !!(m&&MODULES.includes(normalizeModule(m[1]))&&ACTIONS.includes(m[2]))}
  function validUnitIds(ids){const clean=uniqueNums(ids);if(!clean.length)return [];const ph=clean.map(()=>'?').join(',');return db.prepare(`SELECT id FROM business_units WHERE id IN (${ph}) AND status!='Archived'`).all(...clean).map(x=>Number(x.id))}
  function targetHasUnit(targetUserId,bu){if(!bu)return true;return assignedUnits(targetUserId).some(x=>Number(x.id)===Number(bu))}
  function canManageTarget(req,target,desiredRole=null,desiredUnits=null){
    if(!target)return {ok:false,error:'User not found'};
    if(Number(target.id)===Number(req.user.id))return {ok:false,error:'You cannot change your own role or access.'};
    if(target.role==='CEO / Owner'&&req.user.role!=='CEO / Owner')return {ok:false,error:'Only CEO / Owner can manage CEO accounts.'};
    if(req.user.role==='CEO / Owner')return {ok:true};
    const e=effectiveAccess(req.user.id,req.selected_business_unit_id||req.user.business_unit_id);
    if(!e.permissions_plain['sensitive.user_management'])return {ok:false,error:'User-management authority is not enabled for your account.'};
    const delegated=e.permissions_plain['delegate.users']||e.permissions_plain['delegate.bu_users']||e.permissions_plain['delegate.finance_users'];if(!delegated)return {ok:false,error:'Delegated user administration is not enabled for your account.'};
    if(!scopeTarget(req,target))return {ok:false,error:'You cannot manage users outside your assigned business units.'};
    const units=desiredUnits&&desiredUnits.length?desiredUnits:assignedUnits(target.id).map(x=>x.id);const allowedUnits=new Set(actorUnits(req));if(units.some(x=>!allowedUnits.has(Number(x))))return {ok:false,error:'You cannot assign a user outside your business-unit scope.'};
    if(financeOnlyAdmin(req,e,req.selected_business_unit_id||req.user.business_unit_id)){
      const r=desiredRole||target.role;if(!['Finance Head','Finance User'].includes(r))return {ok:false,error:'Finance delegated administration can manage only Finance Head / Finance User accounts.'};
    }
    {const bu=units[0]||req.selected_business_unit_id||req.user.business_unit_id,roleToCheck=desiredRole||target.role;if(roleToCheck&&!templateSubset(req.user.id,roleToCheck,bu))return {ok:false,error:'You cannot manage or assign a role template above your own effective authority.'};}
    return {ok:true};
  }
  function validateOverrides(req,targetUserId,rows){for(const r of rows||[]){const key=String(r.permission_key||'').trim(),effect=String(r.effect||'Inherit');if(req.user.role!=='CEO / Owner'&&!r.business_unit_id)return {ok:false,error:'Delegated administrators must edit access within a specific assigned business unit.'};const bu=Number(r.business_unit_id||req.selected_business_unit_id||req.user.business_unit_id||0)||null;if(!validPermissionKey(key))return {ok:false,error:`Unknown permission key: ${key}`};if(!['Allow','Deny','Inherit'].includes(effect))return {ok:false,error:`Invalid permission effect for ${key}.`};if(bu&&!targetHasUnit(targetUserId,bu))return {ok:false,error:'Access changes must use one of the target user’s assigned business units.'};if(req.user.role==='CEO / Owner')continue;const e=effectiveAccess(req.user.id,bu);if(financeOnlyAdmin(req,e,bu)&&!financePermissionKey(key))return {ok:false,error:'Finance delegated administration is restricted to Finance-related permissions.'};if(effect==='Allow'&&!can(req.user.id,key,bu))return {ok:false,error:`You cannot grant permission ${key} because you do not possess it.`};}return {ok:true}}
  function validateLimits(req,targetUserId,rows){for(const r of rows||[]){const key=String(r.limit_key||'');if(req.user.role!=='CEO / Owner'&&!r.business_unit_id)return {ok:false,error:'Delegated administrators must edit limits within a specific assigned business unit.'};const bu=Number(r.business_unit_id||req.selected_business_unit_id||req.user.business_unit_id||0)||null;if(!LIMITS.includes(key))return {ok:false,error:`Unknown access limit: ${key}`};if(bu&&!targetHasUnit(targetUserId,bu))return {ok:false,error:'Access limits must use one of the target user’s assigned business units.'};const requested=r.limit_value==null||r.limit_value===''?null:Number(r.limit_value);if(requested!=null&&(!Number.isFinite(requested)||requested<0))return {ok:false,error:`Limit ${key} must be zero or greater.`};if(req.user.role==='CEO / Owner')continue;const e=effectiveAccess(req.user.id,bu);if(financeOnlyAdmin(req,e,bu)&&!FINANCE_LIMITS.has(key))return {ok:false,error:'Finance delegated administration may change only Finance amount limits.'};const actor=getLimit(req.user.id,key,bu);if(requested!=null&&(actor==null||requested>actor))return {ok:false,error:`Limit ${key} cannot exceed your own effective limit.`}}return {ok:true}}
  function replaceAssignments(targetUserId,unitIds,primaryId,actorId){
    unitIds=uniqueNums(unitIds);primaryId=Number(primaryId||0);if(unitIds.length&&!primaryId)primaryId=unitIds[0];
    db.transaction(()=>{
      db.prepare('DELETE FROM user_business_units WHERE user_id=?').run(targetUserId);
      const ins=db.prepare('INSERT INTO user_business_units(user_id,business_unit_id,is_primary,assigned_by) VALUES(?,?,?,?)');
      for(const bu of unitIds)ins.run(targetUserId,bu,bu===primaryId?1:0,actorId||null);
      db.prepare('UPDATE users SET business_unit_id=? WHERE id=?').run(primaryId||null,targetUserId);
      // V30.40: BU removal must also remove scoped access objects for that BU.
      // Global assignments remain intact and the enclosing access-history snapshot
      // preserves the before/after audit trail.
      const scopedTables=['user_access_profiles','user_permission_groups','user_approval_authority','user_access_overrides','user_access_limits'];
      for(const table of scopedTables){
        if(unitIds.length){const marks=unitIds.map(()=>'?').join(',');db.prepare(`DELETE FROM ${table} WHERE user_id=? AND business_unit_id IS NOT NULL AND business_unit_id NOT IN (${marks})`).run(targetUserId,...unitIds)}
        else db.prepare(`DELETE FROM ${table} WHERE user_id=? AND business_unit_id IS NOT NULL`).run(targetUserId);
      }
    })();invalidateAccess(targetUserId);return {unit_ids:unitIds,primary_business_unit_id:primaryId||null};
  }
  function userSummary(u){const a=assignedUnits(u.id);return {...u,assigned_units:a,primary_business_unit_id:u.business_unit_id||a.find(x=>x.is_primary)?.id||null}}
  function ensureInitialProfile(userId,role,unitIds=[],primaryId=null,actorId=null){
    const t=templateForRole(role);if(!t.role_key||t.role_name==='CEO / Owner')return;const exists=db.prepare('SELECT 1 FROM user_access_profiles WHERE user_id=? LIMIT 1').get(Number(userId));if(exists)return;const scopes=uniqueNums(unitIds);const ins=db.prepare('INSERT OR IGNORE INTO user_access_profiles(user_id,role_key,business_unit_id,is_primary,assigned_by) VALUES(?,?,?,?,?)');if(scopes.length){for(const unit of scopes)ins.run(Number(userId),t.role_key,unit,Number(unit)===Number(primaryId||scopes[0])?1:0,actorId||null)}else ins.run(Number(userId),t.role_key,null,1,actorId||null);invalidateAccess(userId);
  }
  function approvalAuthority(userId,bu=null){return db.prepare(`SELECT business_unit_id,approval_level,payment_limit,expense_limit,approval_limit FROM user_approval_authority WHERE user_id=? AND (business_unit_id=? OR business_unit_id IS NULL) ORDER BY CASE WHEN business_unit_id=? THEN 0 ELSE 1 END LIMIT 1`).get(Number(userId),Number(bu||0),Number(bu||0))||null}
  function accessSnapshot(userId){const u=liveUser(userId);if(!u)return null;return {role:u.role,assigned_units:assignedUnits(userId).map(x=>({id:x.id,is_primary:!!x.is_primary})),profiles:assignedProfiles(userId).map(x=>({role_key:x.role_key,role_name:x.role_name,business_unit_id:x.business_unit_id,is_primary:!!x.is_primary})),groups:assignedGroups(userId).map(x=>({group_key:x.group_key,group_name:x.group_name,business_unit_id:x.business_unit_id})),approval_authority:db.prepare('SELECT business_unit_id,approval_level,payment_limit,expense_limit,approval_limit FROM user_approval_authority WHERE user_id=? ORDER BY business_unit_id').all(userId),overrides:db.prepare('SELECT business_unit_id,permission_key,effect FROM user_access_overrides WHERE user_id=? ORDER BY business_unit_id,permission_key').all(userId),limits:db.prepare('SELECT business_unit_id,limit_key,limit_value FROM user_access_limits WHERE user_id=? ORDER BY business_unit_id,limit_key').all(userId)}}
  function requireAccessDelegation(req,bu){if(req.user.role==='CEO / Owner')return true;return can(req.user.id,'delegate.access',bu||req.selected_business_unit_id||req.user.business_unit_id)}

  app.get('/api/access/catalog',auth,(req,res)=>res.json({modules:MODULES,actions:ACTIONS,sensitive:SENSITIVE,delegated:DELEGATED,limits:LIMITS,finance_modules:[...FINANCE_MODULES]}));
  app.get('/api/access/me',auth,(req,res)=>{const e=effectiveAccess(req.user.id,req.selected_business_unit_id||req.user.business_unit_id);res.json({...e,permissions:e.permissions_plain})});
  app.get('/api/access/templates',auth,(req,res)=>{if(!canModule(req.user.id,'users',req.selected_business_unit_id||req.user.business_unit_id))return res.status(403).json({error:'You do not have access to Users & Access.'});const rows=db.prepare('SELECT role_key,role_name,permissions_json,limits_json FROM access_role_templates WHERE active=1 ORDER BY role_name').all().map(x=>({...x,permissions:json(x.permissions_json,{}),limits:json(x.limits_json,{})}));res.json(rows)});
  app.get('/api/access/users/:id',auth,(req,res)=>{
    const u=liveUser(req.params.id);if(!u)return res.status(404).json({error:'User not found'});
    if(req.user.role!=='CEO / Owner'&&!scopeTarget(req,u)&&Number(u.id)!==Number(req.user.id))return res.status(403).json({error:'You cannot view this user access profile.'});
    const globalOverrides=db.prepare('SELECT * FROM user_access_overrides WHERE user_id=? ORDER BY business_unit_id,permission_key').all(u.id),limits=db.prepare('SELECT * FROM user_access_limits WHERE user_id=? ORDER BY business_unit_id,limit_key').all(u.id),hist=db.prepare(`SELECT h.*,u.name changed_by_name,b.name business_unit FROM access_change_history h LEFT JOIN users u ON u.id=h.changed_by LEFT JOIN business_units b ON b.id=h.business_unit_id WHERE h.target_user_id=? ORDER BY h.id DESC LIMIT 200`).all(u.id);
    const scope=Number(req.query.business_unit_id||req.selected_business_unit_id||u.business_unit_id||0)||null;
    if(u.role!=='CEO / Owner'&&scope&&!targetHasUnit(u.id,scope))return res.status(400).json({error:'Select one of this user’s assigned business units to review effective access.'});
    res.json({user:userSummary(u),profiles:assignedProfiles(u.id),groups:assignedGroups(u.id),approval_authority:db.prepare('SELECT business_unit_id,approval_level,payment_limit,expense_limit,approval_limit FROM user_approval_authority WHERE user_id=? ORDER BY business_unit_id').all(u.id),overrides:globalOverrides,limits,history:hist,effective:effectiveAccess(u.id,scope),can_manage:canManageTarget(req,u).ok});
  });
  app.get('/api/access/users/:id/effective',auth,(req,res)=>{
    const u=liveUser(req.params.id);if(!u)return res.status(404).json({error:'User not found'});
    if(req.user.role!=='CEO / Owner'&&!scopeTarget(req,u)&&Number(u.id)!==Number(req.user.id))return res.status(403).json({error:'You cannot view this user.'});
    const bu=Number(req.query.business_unit_id||u.business_unit_id||0)||null;if(u.role!=='CEO / Owner'&&bu&&!targetHasUnit(u.id,bu))return res.status(400).json({error:'Select one of this user’s assigned business units.'});
    const resolved=effectiveAccess(u.id,bu);res.json({...resolved,permissions:resolved.permissions_plain});
  });
  app.put('/api/access/users/:id/assignments',auth,(req,res)=>{
    const target=liveUser(req.params.id);if(!target)return res.status(404).json({error:'User not found'});
    const unitIds=uniqueNums(req.body.business_unit_ids),primary=Number(req.body.primary_business_unit_id||0)||null;
    if(req.user.role!=='CEO / Owner'&&!requireAccessDelegation(req,req.selected_business_unit_id||req.user.business_unit_id))return res.status(403).json({error:'Manage access permissions is not delegated to your account.'});
    if(validUnitIds(unitIds).length!==unitIds.length)return res.status(400).json({error:'One or more selected business units are invalid or archived.'});
    if(primary&&!unitIds.includes(primary))return res.status(400).json({error:'Primary business unit must also be assigned.'});
    const check=canManageTarget(req,target,null,unitIds);if(!check.ok)return res.status(403).json({error:check.error});
    if(!unitIds.length&&target.role!=='CEO / Owner')return res.status(400).json({error:'Non-CEO users must be assigned to at least one business unit.'});
    const before=accessSnapshot(target.id),result=replaceAssignments(target.id,unitIds,primary,req.user.id),after=accessSnapshot(target.id);history(target.id,req.user.id,'assignments_update',{before,after},primary);invalidateAccess(target.id);res.json({ok:true,...result});
  });
  app.put('/api/access/users/:id/overrides',auth,(req,res)=>{
    const target=liveUser(req.params.id);if(!target)return res.status(404).json({error:'User not found'});const scope=req.selected_business_unit_id||req.user.business_unit_id;
    if(req.user.role!=='CEO / Owner'&&!requireAccessDelegation(req,scope))return res.status(403).json({error:'Manage access permissions is not delegated to your account.'});
    const check=canManageTarget(req,target);if(!check.ok)return res.status(403).json({error:check.error});const rows=Array.isArray(req.body.overrides)?req.body.overrides:[],valid=validateOverrides(req,target.id,rows);if(!valid.ok)return res.status(403).json({error:valid.error});
    const before=accessSnapshot(target.id);db.transaction(()=>{for(const r of rows){const key=String(r.permission_key||'').trim(),effect=String(r.effect||'Inherit'),bu=r.business_unit_id?Number(r.business_unit_id):null;if(effect==='Inherit')db.prepare('DELETE FROM user_access_overrides WHERE user_id=? AND business_unit_id IS ? AND permission_key=?').run(target.id,bu,key);else db.prepare(`INSERT INTO user_access_overrides(user_id,business_unit_id,permission_key,effect,updated_by,updated_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id,business_unit_id,permission_key) DO UPDATE SET effect=excluded.effect,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP`).run(target.id,bu,key,effect,req.user.id)}})();const after=accessSnapshot(target.id);history(target.id,req.user.id,'permissions_update',{before,after,changed_keys:rows.map(x=>x.permission_key)});invalidateAccess(target.id);res.json({ok:true});
  });
  app.put('/api/access/users/:id/limits',auth,(req,res)=>{
    const target=liveUser(req.params.id);if(!target)return res.status(404).json({error:'User not found'});const scope=req.selected_business_unit_id||req.user.business_unit_id;
    if(req.user.role!=='CEO / Owner'&&!requireAccessDelegation(req,scope))return res.status(403).json({error:'Manage access permissions is not delegated to your account.'});
    const check=canManageTarget(req,target);if(!check.ok)return res.status(403).json({error:check.error});const rows=Array.isArray(req.body.limits)?req.body.limits:[],valid=validateLimits(req,target.id,rows);if(!valid.ok)return res.status(403).json({error:valid.error});
    const before=accessSnapshot(target.id);db.transaction(()=>{for(const r of rows){const key=String(r.limit_key||''),bu=r.business_unit_id?Number(r.business_unit_id):null;if(r.limit_value===null||r.limit_value==='')db.prepare('DELETE FROM user_access_limits WHERE user_id=? AND business_unit_id IS ? AND limit_key=?').run(target.id,bu,key);else db.prepare(`INSERT INTO user_access_limits(user_id,business_unit_id,limit_key,limit_value,updated_by,updated_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id,business_unit_id,limit_key) DO UPDATE SET limit_value=excluded.limit_value,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP`).run(target.id,bu,key,Number(r.limit_value),req.user.id)}})();const after=accessSnapshot(target.id);history(target.id,req.user.id,'limits_update',{before,after,changed_keys:rows.map(x=>x.limit_key)});invalidateAccess(target.id);res.json({ok:true});
  });
  app.post('/api/access/users/:id/apply-template',auth,(req,res)=>{
    const target=liveUser(req.params.id),role=String(req.body.role||'');if(!target)return res.status(404).json({error:'User not found'});const units=assignedUnits(target.id).map(x=>x.id),scope=req.selected_business_unit_id||target.business_unit_id;
    if(req.user.role!=='CEO / Owner'&&!requireAccessDelegation(req,scope))return res.status(403).json({error:'Manage access permissions is not delegated to your account.'});
    const check=canManageTarget(req,target,role,units);if(!check.ok)return res.status(403).json({error:check.error});const tmpl=templateForRole(role);if(!tmpl.role_name||tmpl.role_name==='CEO / Owner')return res.status(400).json({error:'Unknown or protected role template'});
    const before=accessSnapshot(target.id);db.transaction(()=>{db.prepare('UPDATE users SET role=? WHERE id=?').run(role,target.id);db.prepare('DELETE FROM user_access_profiles WHERE user_id=?').run(target.id);const ins=db.prepare('INSERT INTO user_access_profiles(user_id,role_key,business_unit_id,is_primary,assigned_by) VALUES(?,?,?,?,?)');if(units.length){const primary=target.business_unit_id||units[0];for(const bu of units)ins.run(target.id,tmpl.role_key,bu,Number(bu)===Number(primary)?1:0,req.user.id)}else ins.run(target.id,tmpl.role_key,null,1,req.user.id);if(req.body.clear_overrides===true){db.prepare('DELETE FROM user_access_overrides WHERE user_id=?').run(target.id);db.prepare('DELETE FROM user_access_limits WHERE user_id=?').run(target.id)}})();invalidateAccess(target.id);const after=accessSnapshot(target.id);history(target.id,req.user.id,'template_apply',{before,after,role,clear_overrides:!!req.body.clear_overrides});res.json({ok:true,role});
  });
  function cloneAccessSetup(target,source,copyBusinessUnits,actorId){
    if(source.role==='CEO / Owner')return {ok:false,error:'CEO / Owner access is protected and cannot be cloned.'};
    const sourceUnits=assignedUnits(source.id),targetUnits=assignedUnits(target.id),newUnits=copyBusinessUnits?sourceUnits:targetUnits,allowed=new Set(newUnits.map(x=>Number(x.id))),scopeOk=r=>r.business_unit_id==null||allowed.has(Number(r.business_unit_id));
    const profiles=assignedProfiles(source.id).filter(scopeOk),groups=assignedGroups(source.id).filter(scopeOk),authorities=db.prepare('SELECT business_unit_id,approval_level,payment_limit,expense_limit,approval_limit FROM user_approval_authority WHERE user_id=? ORDER BY id').all(source.id).filter(scopeOk),ov=db.prepare('SELECT business_unit_id,permission_key,effect FROM user_access_overrides WHERE user_id=? ORDER BY id').all(source.id).filter(scopeOk),lims=db.prepare('SELECT business_unit_id,limit_key,limit_value FROM user_access_limits WHERE user_id=? ORDER BY id').all(source.id).filter(scopeOk);
    if(!profiles.length)return {ok:false,error:'The source user has no Access Profile compatible with the target business-unit scope. Enable Copy Business Units or assign a compatible scope first.'};
    const sourcePrimary=profiles.find(x=>x.is_primary),primary=sourcePrimary||profiles[0];
    db.transaction(()=>{
      if(copyBusinessUnits){db.prepare('DELETE FROM user_business_units WHERE user_id=?').run(target.id);const iub=db.prepare('INSERT INTO user_business_units(user_id,business_unit_id,is_primary,assigned_by) VALUES(?,?,?,?)');for(const u of sourceUnits)iub.run(target.id,u.id,u.is_primary?1:0,actorId);const pbu=sourceUnits.find(x=>x.is_primary)?.id||sourceUnits[0]?.id||null;db.prepare('UPDATE users SET business_unit_id=? WHERE id=?').run(pbu,target.id)}
      for(const table of ['user_access_profiles','user_permission_groups','user_access_overrides','user_access_limits','user_approval_authority'])db.prepare(`DELETE FROM ${table} WHERE user_id=?`).run(target.id);
      const ip=db.prepare('INSERT INTO user_access_profiles(user_id,role_key,business_unit_id,is_primary,assigned_by) VALUES(?,?,?,?,?)');for(const r of profiles)ip.run(target.id,r.role_key,r.business_unit_id,Number(r.id)===Number(primary.id)?1:0,actorId);
      const ig=db.prepare('INSERT INTO user_permission_groups(user_id,group_key,business_unit_id,assigned_by) VALUES(?,?,?,?)');for(const r of groups)ig.run(target.id,r.group_key,r.business_unit_id,actorId);
      const ia=db.prepare('INSERT INTO user_approval_authority(user_id,business_unit_id,approval_level,payment_limit,expense_limit,approval_limit,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)');for(const r of authorities)ia.run(target.id,r.business_unit_id,r.approval_level,r.payment_limit,r.expense_limit,r.approval_limit,actorId);
      const io=db.prepare('INSERT INTO user_access_overrides(user_id,business_unit_id,permission_key,effect,updated_by,updated_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)');for(const r of ov)io.run(target.id,r.business_unit_id,r.permission_key,r.effect,actorId);
      const il=db.prepare('INSERT INTO user_access_limits(user_id,business_unit_id,limit_key,limit_value,updated_by,updated_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP)');for(const r of lims)il.run(target.id,r.business_unit_id,r.limit_key,r.limit_value,actorId);
      db.prepare('UPDATE users SET role=? WHERE id=?').run(primary.role_name,target.id);
    })();invalidateAccess(target.id);return {ok:true};
  }
  app.post('/api/access/users/:id/copy',auth,(req,res)=>{
    if(req.user.role!=='CEO / Owner')return res.status(403).json({error:'Only CEO / Owner can copy another user’s complete access profile.'});
    const target=liveUser(req.params.id),source=liveUser(req.body.source_user_id);if(!target||!source)return res.status(404).json({error:'Source or target user not found'});if(Number(target.id)===Number(source.id))return res.status(400).json({error:'Choose another source user.'});if(target.role==='CEO / Owner')return res.status(403).json({error:'CEO / Owner access is protected.'});const check=canManageTarget(req,target,source.role,req.body.copy_business_units?assignedUnits(source.id).map(x=>x.id):assignedUnits(target.id).map(x=>x.id));if(!check.ok)return res.status(403).json({error:check.error});
    const before=accessSnapshot(target.id),cloned=cloneAccessSetup(target,source,req.body.copy_business_units===true,req.user.id);if(!cloned.ok)return res.status(409).json({error:cloned.error});const after=accessSnapshot(target.id);history(target.id,req.user.id,'access_copy',{before,after,source_user_id:source.id,copy_business_units:!!req.body.copy_business_units});res.json({ok:true});
  });


  // V30.40 — simple, scalable multi-profile / permission-group access management.
  function accessAdminAllowed(req,target=null){
    const bu=req.selected_business_unit_id||req.user.business_unit_id;
    if(req.user.role==='CEO / Owner')return {ok:true};
    if(!requireAccessDelegation(req,bu))return {ok:false,error:'Manage access permissions is not delegated to your account.'};
    if(target){const c=canManageTarget(req,target);if(!c.ok)return c}
    return {ok:true};
  }
  // Shared profile definitions affect every assigned user, so only CEO / Owner
  // or a properly delegated System Administrator may mutate the library. BU and
  // Finance delegates may assign safe profiles, but cannot edit the global library.
  function canManageProfileLibrary(req){
    if(req.user.role==='CEO / Owner')return true;
    const bu=req.selected_business_unit_id||req.user.business_unit_id;
    const e=effectiveAccess(req.user.id,bu);
    return req.user.role==='System Administrator'&&e.permissions_plain['sensitive.system_admin']===true&&e.permissions_plain['delegate.access']===true;
  }
  function profileSubset(actorId,roleKey,bu){const actor=effectiveAccess(actorId,bu),desired=templateForKey(roleKey);if(!desired.role_name)return false;for(const [k,v] of Object.entries(desired.permissions||{}))if(v===true&&!actor.permissions_plain[k])return false;for(const [k,v] of Object.entries(desired.limits||{})){const requested=Number(v||0),own=actor.limits?.[k];if(requested>0&&(own==null||Number(own)<requested))return false}return true}
  app.get('/api/access/profiles',auth,(req,res)=>{
    if(!canModule(req.user.id,'users',req.selected_business_unit_id||req.user.business_unit_id))return res.status(403).json({error:'You do not have access to Users & Access.'});
    const rows=db.prepare(`SELECT t.role_key,t.role_name,t.permissions_json,t.limits_json,t.active,COUNT(DISTINCT uap.user_id) assigned_users FROM access_role_templates t LEFT JOIN user_access_profiles uap ON uap.role_key=t.role_key WHERE t.active=1 GROUP BY t.role_key ORDER BY CASE WHEN t.role_name='CEO / Owner' THEN 0 ELSE 1 END,t.role_name`).all().map(x=>({...x,permissions:json(x.permissions_json,{}),limits:json(x.limits_json,{})}));res.json(rows);
  });
  app.get('/api/access/permission-groups',auth,(req,res)=>{
    if(!canModule(req.user.id,'users',req.selected_business_unit_id||req.user.business_unit_id))return res.status(403).json({error:'You do not have access to Users & Access.'});
    res.json(db.prepare(`SELECT g.group_key,g.group_name,g.description,g.permissions_json,g.active,COUNT(DISTINCT upg.user_id) assigned_users FROM access_permission_groups g LEFT JOIN user_permission_groups upg ON upg.group_key=g.group_key WHERE g.active=1 GROUP BY g.group_key ORDER BY g.group_name`).all().map(x=>({...x,permissions:json(x.permissions_json,{})})));
  });
  app.post('/api/access/profiles',auth,(req,res)=>{
    if(!canManageProfileLibrary(req))return res.status(403).json({error:'Only CEO / Owner or an authorized System Administrator can manage the shared Access Profile library.'});
    const name=String(req.body.role_name||'').trim();if(!name)return res.status(400).json({error:'Profile name is required.'});if(name==='CEO / Owner')return res.status(400).json({error:'CEO / Owner is a protected profile.'});
    let key=roleKey(name);if(!key)return res.status(400).json({error:'Profile name is invalid.'});if(db.prepare('SELECT 1 FROM access_role_templates WHERE role_key=? OR role_name=?').get(key,name))return res.status(409).json({error:'An Access Profile with this name already exists.'});
    const permissions=req.body.permissions&&typeof req.body.permissions==='object'?req.body.permissions:{};const limits=req.body.limits&&typeof req.body.limits==='object'?req.body.limits:{};
    if(req.user.role!=='CEO / Owner'){for(const [k,v] of Object.entries(permissions)){if(v===true&&!validPermissionKey(k))return res.status(400).json({error:`Unknown permission key: ${k}`});if(v===true&&!can(req.user.id,k,req.selected_business_unit_id||req.user.business_unit_id))return res.status(403).json({error:`You cannot create a profile granting ${k} because you do not possess it.`})}for(const [k,v] of Object.entries(limits)){if(!LIMITS.includes(k))return res.status(400).json({error:`Unknown access limit: ${k}`});const n=Number(v||0),own=getLimit(req.user.id,k,req.selected_business_unit_id||req.user.business_unit_id);if(n>0&&(own==null||n>own))return res.status(403).json({error:`Limit ${k} cannot exceed your own effective limit.`})}}
    db.prepare('INSERT INTO access_role_templates(role_key,role_name,permissions_json,limits_json,active) VALUES(?,?,?,?,1)').run(key,name,JSON.stringify(permissions),JSON.stringify(limits));invalidateAccess();audit(req.user,'access_profile',key,'create-v340',JSON.stringify({role_name:name}));res.json({ok:true,role_key:key,role_name:name});
  });
  app.put('/api/access/profiles/:role_key',auth,(req,res)=>{
    if(!canManageProfileLibrary(req))return res.status(403).json({error:'Only CEO / Owner or an authorized System Administrator can manage the shared Access Profile library.'});const current=templateForKey(req.params.role_key);if(!current.role_name)return res.status(404).json({error:'Access Profile not found.'});if(current.role_name==='CEO / Owner')return res.status(403).json({error:'CEO / Owner is a protected profile.'});
    const name=String(req.body.role_name||current.role_name).trim();if(!name)return res.status(400).json({error:'Profile name is required.'});const permissions=req.body.permissions&&typeof req.body.permissions==='object'?req.body.permissions:current.permissions;const limits=req.body.limits&&typeof req.body.limits==='object'?req.body.limits:current.limits;
    const dup=db.prepare('SELECT role_key FROM access_role_templates WHERE role_name=? AND role_key<>?').get(name,current.role_key);if(dup)return res.status(409).json({error:'Another Access Profile already uses this name.'});
    for(const [k,v] of Object.entries(permissions)){if(v===true&&!validPermissionKey(k))return res.status(400).json({error:`Unknown permission key: ${k}`});if(req.user.role!=='CEO / Owner'&&v===true&&!can(req.user.id,k,req.selected_business_unit_id||req.user.business_unit_id))return res.status(403).json({error:`You cannot grant ${k} because you do not possess it.`})}
    for(const [k,v] of Object.entries(limits)){if(!LIMITS.includes(k))return res.status(400).json({error:`Unknown access limit: ${k}`});const n=Number(v||0);if(!Number.isFinite(n)||n<0)return res.status(400).json({error:`Limit ${k} must be zero or greater.`});if(req.user.role!=='CEO / Owner'){const own=getLimit(req.user.id,k,req.selected_business_unit_id||req.user.business_unit_id);if(n>0&&(own==null||n>own))return res.status(403).json({error:`Limit ${k} cannot exceed your own effective limit.`})}}
    const before={role_name:current.role_name,permissions:current.permissions,limits:current.limits},affected=Number(db.prepare('SELECT COUNT(DISTINCT user_id) n FROM user_access_profiles WHERE role_key=?').get(current.role_key)?.n||0);db.prepare('UPDATE access_role_templates SET role_name=?,permissions_json=?,limits_json=?,updated_at=CURRENT_TIMESTAMP WHERE role_key=?').run(name,JSON.stringify(permissions),JSON.stringify(limits),current.role_key);if(name!==current.role_name)db.prepare('UPDATE users SET role=? WHERE role=?').run(name,current.role_name);invalidateAccess();audit(req.user,'access_profile',current.role_key,'update-v340',JSON.stringify({before,after:{role_name:name,permissions,limits},affected_users:affected}));res.json({ok:true,role_key:current.role_key,role_name:name,affected_users:affected});
  });
  app.post('/api/access/users/bulk-profiles',auth,(req,res)=>{
    const ids=uniqueNums(req.body.user_ids),role=String(req.body.role_key||'').trim(),bu=req.body.business_unit_id==null?null:Number(req.body.business_unit_id),profile=templateForKey(role);if(!ids.length)return res.status(400).json({error:'Select at least one user.'});if(!profile.role_name||profile.role_name==='CEO / Owner')return res.status(400).json({error:'Invalid Access Profile.'});if(req.user.role!=='CEO / Owner'&&!profileSubset(req.user.id,role,bu||req.selected_business_unit_id||req.user.business_unit_id))return res.status(403).json({error:'This profile exceeds your effective authority.'});
    const targets=ids.map(liveUser);if(targets.some(x=>!x))return res.status(404).json({error:'One or more users were not found.'});for(const target of targets){const admin=accessAdminAllowed(req,target);if(!admin.ok)return res.status(403).json({error:admin.error});if(target.role==='CEO / Owner')return res.status(403).json({error:'CEO / Owner access cannot be bulk changed.'});if(bu!=null&&!assignedUnits(target.id).some(x=>Number(x.id)===bu))return res.status(400).json({error:`${target.name} is not assigned to the selected business unit.`})}
    db.transaction(()=>{for(const target of targets){const has=db.prepare('SELECT 1 FROM user_access_profiles WHERE user_id=? LIMIT 1').get(target.id),same=bu==null?db.prepare('SELECT 1 FROM user_access_profiles WHERE user_id=? AND role_key=? AND business_unit_id IS NULL').get(target.id,role):db.prepare('SELECT 1 FROM user_access_profiles WHERE user_id=? AND role_key=? AND business_unit_id=?').get(target.id,role,bu);if(!same)db.prepare('INSERT INTO user_access_profiles(user_id,role_key,business_unit_id,is_primary,assigned_by) VALUES(?,?,?,?,?)').run(target.id,role,bu,has?0:1,req.user.id);if(!has)db.prepare('UPDATE users SET role=? WHERE id=?').run(profile.role_name,target.id);history(target.id,req.user.id,'bulk_profile_add',{role_key:role,role_name:profile.role_name,business_unit_id:bu},bu);invalidateAccess(target.id)}})();res.json({ok:true,updated_users:targets.length});
  });
  app.put('/api/access/users/:id/profiles',auth,(req,res)=>{
    const target=liveUser(req.params.id);if(!target)return res.status(404).json({error:'User not found'});const admin=accessAdminAllowed(req,target);if(!admin.ok)return res.status(403).json({error:admin.error});
    if(target.role==='CEO / Owner'&&req.user.role!=='CEO / Owner')return res.status(403).json({error:'Only CEO / Owner can manage CEO accounts.'});
    const rows=Array.isArray(req.body.assignments)?req.body.assignments:[];if(target.role!=='CEO / Owner'&&!rows.length)return res.status(400).json({error:'Assign at least one Access Profile.'});
    const allowedUnits=new Set(assignedUnits(target.id).map(x=>Number(x.id))),clean=[];let primaryCount=0;
    for(const row of rows){const key=String(row.role_key||'').trim(),bu=row.business_unit_id==null?null:Number(row.business_unit_id),profile=templateForKey(key);if(!profile.role_name||profile.role_name==='CEO / Owner')return res.status(400).json({error:'Invalid Access Profile.'});if(bu!=null&&!allowedUnits.has(bu))return res.status(400).json({error:'Profile scope must be one of the user’s assigned business units.'});if(req.user.role!=='CEO / Owner'&&!profileSubset(req.user.id,key,bu||req.selected_business_unit_id||req.user.business_unit_id))return res.status(403).json({error:`You cannot assign ${profile.role_name} because it exceeds your effective authority.`});const primary=!!row.is_primary;if(primary)primaryCount++;clean.push({key,bu,primary,role_name:profile.role_name})}
    if(primaryCount>1)return res.status(400).json({error:'Only one Access Profile may be marked Primary.'});if(clean.length&&!primaryCount)clean[0].primary=true;const seenProfiles=new Set();for(const r of clean){const sig=r.key+'|'+String(r.bu??'global');if(seenProfiles.has(sig))return res.status(400).json({error:'The same Access Profile cannot be assigned twice in the same scope.'});seenProfiles.add(sig)}
    const before=accessSnapshot(target.id);db.transaction(()=>{db.prepare('DELETE FROM user_access_profiles WHERE user_id=?').run(target.id);const ins=db.prepare('INSERT INTO user_access_profiles(user_id,role_key,business_unit_id,is_primary,assigned_by) VALUES(?,?,?,?,?)');for(const r of clean)ins.run(target.id,r.key,r.bu,r.primary?1:0,req.user.id);const primary=clean.find(x=>x.primary)||clean[0];if(primary)db.prepare('UPDATE users SET role=? WHERE id=?').run(primary.role_name,target.id)})();invalidateAccess(target.id);const after=accessSnapshot(target.id);history(target.id,req.user.id,'profiles_update',{before,after},req.selected_business_unit_id||null);res.json({ok:true,profiles:after.profiles});
  });
  app.put('/api/access/users/:id/groups',auth,(req,res)=>{
    const target=liveUser(req.params.id);if(!target)return res.status(404).json({error:'User not found'});const admin=accessAdminAllowed(req,target);if(!admin.ok)return res.status(403).json({error:admin.error});const rows=Array.isArray(req.body.assignments)?req.body.assignments:[],allowedUnits=new Set(assignedUnits(target.id).map(x=>Number(x.id))),clean=[];
    for(const row of rows){const key=String(row.group_key||'').trim(),bu=row.business_unit_id==null?null:Number(row.business_unit_id),g=db.prepare('SELECT * FROM access_permission_groups WHERE group_key=? AND active=1').get(key);if(!g)return res.status(400).json({error:'Invalid Permission Group.'});if(bu!=null&&!allowedUnits.has(bu))return res.status(400).json({error:'Permission Group scope must be one of the user’s assigned business units.'});const perms=json(g.permissions_json,{});if(req.user.role!=='CEO / Owner')for(const [k,v] of Object.entries(perms))if(v===true&&!can(req.user.id,k,bu||req.selected_business_unit_id||req.user.business_unit_id))return res.status(403).json({error:`You cannot assign ${g.group_name} because it grants authority you do not possess.`});clean.push({key,bu})}
    const seenGroups=new Set();for(const r of clean){const sig=r.key+'|'+String(r.bu??'global');if(seenGroups.has(sig))return res.status(400).json({error:'The same Permission Group cannot be assigned twice in the same scope.'});seenGroups.add(sig)}
    const before=accessSnapshot(target.id);db.transaction(()=>{db.prepare('DELETE FROM user_permission_groups WHERE user_id=?').run(target.id);const ins=db.prepare('INSERT INTO user_permission_groups(user_id,group_key,business_unit_id,assigned_by) VALUES(?,?,?,?)');for(const r of clean)ins.run(target.id,r.key,r.bu,req.user.id)})();invalidateAccess(target.id);const after=accessSnapshot(target.id);history(target.id,req.user.id,'permission_groups_update',{before,after},req.selected_business_unit_id||null);res.json({ok:true,groups:after.groups});
  });
  app.put('/api/access/users/:id/approval-authority',auth,(req,res)=>{
    const target=liveUser(req.params.id);if(!target)return res.status(404).json({error:'User not found'});const admin=accessAdminAllowed(req,target);if(!admin.ok)return res.status(403).json({error:admin.error});const bu=req.body.business_unit_id==null?null:Number(req.body.business_unit_id);if(bu!=null&&!assignedUnits(target.id).some(x=>Number(x.id)===bu))return res.status(400).json({error:'Approval authority scope must be one of the user’s assigned business units.'});const level=Math.max(0,Math.min(4,Number(req.body.approval_level||0)));if(req.user.role!=='CEO / Owner'){const actorLevel=Number(approvalAuthority(req.user.id,bu)?.approval_level||0);if(level>actorLevel)return res.status(403).json({error:'You cannot assign an approval level above your own delegated approval authority.'})}const clean=v=>{if(v==null||v==='')return null;const x=Number(v);return Number.isFinite(x)?Math.max(0,x):null};const before=accessSnapshot(target.id);db.transaction(()=>{if(bu==null)db.prepare('DELETE FROM user_approval_authority WHERE user_id=? AND business_unit_id IS NULL').run(target.id);else db.prepare('DELETE FROM user_approval_authority WHERE user_id=? AND business_unit_id=?').run(target.id,bu);db.prepare('INSERT INTO user_approval_authority(user_id,business_unit_id,approval_level,payment_limit,expense_limit,approval_limit,updated_by,updated_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)').run(target.id,bu,level,clean(req.body.payment_limit),clean(req.body.expense_limit),clean(req.body.approval_limit),req.user.id)})();const after=accessSnapshot(target.id);history(target.id,req.user.id,'approval_authority_update',{before,after},bu);res.json({ok:true,authority:approvalAuthority(target.id,bu)});
  });
  app.post('/api/access/users/:id/copy-v340',auth,(req,res)=>{
    if(req.user.role!=='CEO / Owner')return res.status(403).json({error:'Only CEO / Owner can clone a complete access setup.'});const target=liveUser(req.params.id),source=liveUser(req.body.source_user_id);if(!target||!source)return res.status(404).json({error:'Source or target user not found'});if(Number(target.id)===Number(source.id))return res.status(400).json({error:'Choose another source user.'});if(target.role==='CEO / Owner')return res.status(403).json({error:'CEO / Owner access is protected.'});const before=accessSnapshot(target.id),cloned=cloneAccessSetup(target,source,req.body.copy_business_units===true,req.user.id);if(!cloned.ok)return res.status(409).json({error:cloned.error});const after=accessSnapshot(target.id);history(target.id,req.user.id,'access_clone_v340',{before,after,source_user_id:source.id,copy_business_units:!!req.body.copy_business_units});res.json({ok:true});
  });
  app.post('/api/access/profiles/:role_key/duplicate',auth,(req,res)=>{
    if(!canManageProfileLibrary(req))return res.status(403).json({error:'Only CEO / Owner or an authorized System Administrator can manage the shared Access Profile library.'});const src=templateForKey(req.params.role_key);if(!src.role_name)return res.status(404).json({error:'Access Profile not found'});const name=String(req.body.role_name||`${src.role_name} Copy`).trim();if(!name)return res.status(400).json({error:'Profile name is required.'});let key=roleKey(name),n=2;while(db.prepare('SELECT 1 FROM access_role_templates WHERE role_key=? OR role_name=?').get(key,name))key=roleKey(name+' '+n++);db.prepare('INSERT INTO access_role_templates(role_key,role_name,permissions_json,limits_json,active) VALUES(?,?,?,?,1)').run(key,name,JSON.stringify(src.permissions||{}),JSON.stringify(src.limits||{}));audit(req.user,'access_profile',key,'duplicate',JSON.stringify({source:src.role_key,name}));res.json({ok:true,role_key:key,role_name:name});
  });

  return {MODULES,ACTIONS,SENSITIVE,DELEGATED,LIMITS,liveUser,assignedUnits,isAssigned,effectiveAccess,can,canModule,canAction,canAnyModule,getLimit,canManageTarget,validateOverrides,validateLimits,replaceAssignments,userSummary,ensureInitialProfile,templateForRole,templateForKey,assignedProfiles,assignedGroups,approvalAuthority,history,scopeTarget,actorUnits,normalizeModule,accessSnapshot,validUnitIds,invalidateAccess,cache_ttl_ms:ACCESS_CACHE_TTL_MS};
}
module.exports={install,ACTIONS,MODULES,SENSITIVE,DELEGATED,LIMITS,permissionKey};
