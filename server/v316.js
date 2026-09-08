const crypto=require('crypto');

const ACTIONS=['view','create','edit','delete','void','approve','export','print','verify','correct','allocate'];
const MODULES=['dashboard','businesses','sales','purchases','inventory','finance','accounting','approvals','tasks','performance','reports','documents','meetings','restaurant','excavator','excavatorSuppliers','excavatorBuyers','notifications','users','audit','payroll'];
const SENSITIVE=['sensitive.user_management','sensitive.approval_rules','sensitive.accounting_adjustments','sensitive.payroll','sensitive.audit_logs','sensitive.system_admin'];
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
    {role:'Business Unit Manager',name:'Business Unit Manager',permissions:merge(common,allActions(['sales','purchases','inventory','finance','approvals','tasks','performance','reports','documents','meetings','restaurant','excavator','excavatorSuppliers','excavatorBuyers']),pickActions(['users'],['view','create','edit']),{'delegate.users':true,'delegate.bu_users':true,'delegate.access':true,'sensitive.user_management':true,'sensitive.approval_rules':true}),limits:{finance_payment_max:100000000,finance_expense_max:100000000,finance_approval_max:100000000,max_discount_pct:25,manual_price_override_max_pct:25}},
    {role:'Operations Manager',name:'Operations Manager',permissions:merge(common,allActions(['sales','purchases','inventory','finance','approvals','tasks','performance','reports','documents','meetings','restaurant','excavator','excavatorSuppliers','excavatorBuyers']),pickActions(['users','audit'],['view']),{'sensitive.approval_rules':true,'sensitive.audit_logs':true}),limits:{finance_payment_max:50000000,finance_expense_max:50000000,finance_approval_max:50000000,max_discount_pct:20,manual_price_override_max_pct:20}},
    {role:'Finance Head',name:'Finance Head',permissions:merge(viewOnly(['dashboard','notifications']),allActions(['finance','accounting','approvals','reports','documents']),pickActions(['users'],['view','create','edit']),{'delegate.finance_users':true,'delegate.access':true,'sensitive.user_management':true,'sensitive.accounting_adjustments':true,'sensitive.audit_logs':true}),limits:{finance_payment_max:1000000000,finance_expense_max:1000000000,finance_approval_max:1000000000,max_discount_pct:0,manual_price_override_max_pct:0}},
    {role:'Finance User',name:'Finance User',permissions:merge(viewOnly(['dashboard','notifications']),pickActions(['finance','accounting','reports','documents'],['view','create','edit','export','print','verify','correct','allocate']),pickActions(['approvals'],['view'])),limits:{finance_payment_max:20000000,finance_expense_max:20000000,finance_approval_max:0,max_discount_pct:0,manual_price_override_max_pct:0}},
    {role:'Finance / Admin',name:'Finance / Admin (Legacy)',permissions:merge(viewOnly(['dashboard','notifications']),allActions(['finance','accounting','approvals','reports','documents','sales','purchases','inventory','payroll']),{'sensitive.accounting_adjustments':true,'sensitive.audit_logs':true,'sensitive.payroll':true}),limits:{finance_payment_max:100000000,finance_expense_max:100000000,finance_approval_max:100000000,max_discount_pct:10,manual_price_override_max_pct:10}},
    {role:'Sales / Business Development',name:'Sales / Business Development',permissions:merge(common,allActions(['sales','approvals','documents','excavator','excavatorSuppliers','excavatorBuyers']),pickActions(['finance'],['view'])),limits:{finance_payment_max:0,finance_expense_max:0,finance_approval_max:0,max_discount_pct:15,manual_price_override_max_pct:15}},
    {role:'Staff Member',name:'Staff Member',permissions:merge(viewOnly(['dashboard','tasks','performance','reports','documents','inventory','notifications']),pickActions(['tasks','reports','documents','inventory'],['create','edit'])),limits:{finance_payment_max:0,finance_expense_max:0,finance_approval_max:0,max_discount_pct:0,manual_price_override_max_pct:0}},
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
    CREATE INDEX IF NOT EXISTS idx_user_access_overrides_user ON user_access_overrides(user_id,business_unit_id);
    CREATE INDEX IF NOT EXISTS idx_user_access_limits_user ON user_access_limits(user_id,business_unit_id);
    CREATE INDEX IF NOT EXISTS idx_user_business_units_user ON user_business_units(user_id,is_primary);
    CREATE INDEX IF NOT EXISTS idx_access_history_target ON access_change_history(target_user_id,created_at);
  `);
  const upsert=db.prepare(`INSERT INTO access_role_templates(role_key,role_name,permissions_json,limits_json,active,updated_at)
    VALUES(?,?,?,?,1,CURRENT_TIMESTAMP)
    ON CONFLICT(role_key) DO UPDATE SET role_name=excluded.role_name,permissions_json=excluded.permissions_json,limits_json=excluded.limits_json,active=1,updated_at=CURRENT_TIMESTAMP`);
  for(const t of defaultTemplates())upsert.run(roleKey(t.role),t.role,JSON.stringify(t.permissions),JSON.stringify(t.limits));
  const users=db.prepare('SELECT id,business_unit_id FROM users').all();
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
}

function install(ctx){
  const {app,db,auth,audit,notify}=ctx;
  installSchema(db);

  function liveUser(id){return db.prepare("SELECT id,name,email,role,business_unit_id,active,COALESCE(preferred_language,'ko') preferred_language FROM users WHERE id=?").get(Number(id))}
  function assignedUnits(userId){return db.prepare(`SELECT b.id,b.name,b.status,ubu.is_primary FROM user_business_units ubu JOIN business_units b ON b.id=ubu.business_unit_id WHERE ubu.user_id=? AND b.status!='Archived' ORDER BY ubu.is_primary DESC,b.name`).all(Number(userId))}
  function isAssigned(userId,bu){return !!db.prepare('SELECT 1 FROM user_business_units WHERE user_id=? AND business_unit_id=?').get(Number(userId),Number(bu))}
  function templateForRole(role){const t=db.prepare('SELECT * FROM access_role_templates WHERE role_name=? AND active=1').get(String(role||''));return t?{...t,permissions:json(t.permissions_json,{}),limits:json(t.limits_json,{})}:{role_name:'',permissions:{},limits:{}}}
  function overrides(userId,bu){
    const rows=db.prepare(`SELECT business_unit_id,permission_key,effect FROM user_access_overrides WHERE user_id=? AND (business_unit_id IS NULL OR business_unit_id=?) ORDER BY CASE WHEN business_unit_id IS NULL THEN 0 ELSE 1 END,id`).all(Number(userId),Number(bu||0));
    return rows;
  }
  function limitRows(userId,bu){return db.prepare(`SELECT business_unit_id,limit_key,limit_value FROM user_access_limits WHERE user_id=? AND (business_unit_id IS NULL OR business_unit_id=?) ORDER BY CASE WHEN business_unit_id IS NULL THEN 0 ELSE 1 END,id`).all(Number(userId),Number(bu||0))}
  function effectiveAccess(userId,bu=null){
    const u=liveUser(userId);if(!u||!u.active)return {user:null,business_unit_id:null,permissions:{},limits:{},assigned_units:[]};
    const units=assignedUnits(u.id),selected=bu?Number(bu):(u.business_unit_id||units.find(x=>x.is_primary)?.id||null),t=templateForRole(u.role);
    if(u.role==='CEO / Owner')return {user:u,business_unit_id:selected,permissions:new Proxy({}, {get:()=>true}),permissions_plain:Object.fromEntries([...MODULES.flatMap(m=>ACTIONS.map(a=>permissionKey(m,a))),...SENSITIVE,...DELEGATED].map(k=>[k,true])),limits:{},assigned_units:units,template:t.role_name};
    const permissions={...t.permissions};
    for(const r of overrides(u.id,selected)){if(r.effect==='Allow')permissions[r.permission_key]=true;else if(r.effect==='Deny')permissions[r.permission_key]=false;}
    const limits={...t.limits};for(const r of limitRows(u.id,selected))limits[r.limit_key]=r.limit_value;
    return {user:u,business_unit_id:selected,permissions,permissions_plain:permissions,limits,assigned_units:units,template:t.role_name};
  }
  function can(userId,key,bu=null){const u=liveUser(userId);if(!u||!u.active)return false;if(u.role==='CEO / Owner')return true;return effectiveAccess(userId,bu).permissions_plain[key]===true}
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
    db.transaction(()=>{db.prepare('DELETE FROM user_business_units WHERE user_id=?').run(targetUserId);const ins=db.prepare('INSERT INTO user_business_units(user_id,business_unit_id,is_primary,assigned_by) VALUES(?,?,?,?)');for(const bu of unitIds)ins.run(targetUserId,bu,bu===primaryId?1:0,actorId||null);db.prepare('UPDATE users SET business_unit_id=? WHERE id=?').run(primaryId||null,targetUserId)})();return {unit_ids:unitIds,primary_business_unit_id:primaryId||null};
  }
  function userSummary(u){const a=assignedUnits(u.id);return {...u,assigned_units:a,primary_business_unit_id:u.business_unit_id||a.find(x=>x.is_primary)?.id||null}}
  function accessSnapshot(userId){const u=liveUser(userId);if(!u)return null;return {role:u.role,assigned_units:assignedUnits(userId).map(x=>({id:x.id,is_primary:!!x.is_primary})),overrides:db.prepare('SELECT business_unit_id,permission_key,effect FROM user_access_overrides WHERE user_id=? ORDER BY business_unit_id,permission_key').all(userId),limits:db.prepare('SELECT business_unit_id,limit_key,limit_value FROM user_access_limits WHERE user_id=? ORDER BY business_unit_id,limit_key').all(userId)}}
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
    res.json({user:userSummary(u),overrides:globalOverrides,limits,history:hist,effective:effectiveAccess(u.id,scope),can_manage:canManageTarget(req,u).ok});
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
    const before=accessSnapshot(target.id),result=replaceAssignments(target.id,unitIds,primary,req.user.id),after=accessSnapshot(target.id);history(target.id,req.user.id,'assignments_update',{before,after},primary);res.json({ok:true,...result});
  });
  app.put('/api/access/users/:id/overrides',auth,(req,res)=>{
    const target=liveUser(req.params.id);if(!target)return res.status(404).json({error:'User not found'});const scope=req.selected_business_unit_id||req.user.business_unit_id;
    if(req.user.role!=='CEO / Owner'&&!requireAccessDelegation(req,scope))return res.status(403).json({error:'Manage access permissions is not delegated to your account.'});
    const check=canManageTarget(req,target);if(!check.ok)return res.status(403).json({error:check.error});const rows=Array.isArray(req.body.overrides)?req.body.overrides:[],valid=validateOverrides(req,target.id,rows);if(!valid.ok)return res.status(403).json({error:valid.error});
    const before=accessSnapshot(target.id);db.transaction(()=>{for(const r of rows){const key=String(r.permission_key||'').trim(),effect=String(r.effect||'Inherit'),bu=r.business_unit_id?Number(r.business_unit_id):null;if(effect==='Inherit')db.prepare('DELETE FROM user_access_overrides WHERE user_id=? AND business_unit_id IS ? AND permission_key=?').run(target.id,bu,key);else db.prepare(`INSERT INTO user_access_overrides(user_id,business_unit_id,permission_key,effect,updated_by,updated_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id,business_unit_id,permission_key) DO UPDATE SET effect=excluded.effect,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP`).run(target.id,bu,key,effect,req.user.id)}})();const after=accessSnapshot(target.id);history(target.id,req.user.id,'permissions_update',{before,after,changed_keys:rows.map(x=>x.permission_key)});res.json({ok:true});
  });
  app.put('/api/access/users/:id/limits',auth,(req,res)=>{
    const target=liveUser(req.params.id);if(!target)return res.status(404).json({error:'User not found'});const scope=req.selected_business_unit_id||req.user.business_unit_id;
    if(req.user.role!=='CEO / Owner'&&!requireAccessDelegation(req,scope))return res.status(403).json({error:'Manage access permissions is not delegated to your account.'});
    const check=canManageTarget(req,target);if(!check.ok)return res.status(403).json({error:check.error});const rows=Array.isArray(req.body.limits)?req.body.limits:[],valid=validateLimits(req,target.id,rows);if(!valid.ok)return res.status(403).json({error:valid.error});
    const before=accessSnapshot(target.id);db.transaction(()=>{for(const r of rows){const key=String(r.limit_key||''),bu=r.business_unit_id?Number(r.business_unit_id):null;if(r.limit_value===null||r.limit_value==='')db.prepare('DELETE FROM user_access_limits WHERE user_id=? AND business_unit_id IS ? AND limit_key=?').run(target.id,bu,key);else db.prepare(`INSERT INTO user_access_limits(user_id,business_unit_id,limit_key,limit_value,updated_by,updated_at) VALUES(?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id,business_unit_id,limit_key) DO UPDATE SET limit_value=excluded.limit_value,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP`).run(target.id,bu,key,Number(r.limit_value),req.user.id)}})();const after=accessSnapshot(target.id);history(target.id,req.user.id,'limits_update',{before,after,changed_keys:rows.map(x=>x.limit_key)});res.json({ok:true});
  });
  app.post('/api/access/users/:id/apply-template',auth,(req,res)=>{
    const target=liveUser(req.params.id),role=String(req.body.role||'');if(!target)return res.status(404).json({error:'User not found'});const units=assignedUnits(target.id).map(x=>x.id),scope=req.selected_business_unit_id||target.business_unit_id;
    if(req.user.role!=='CEO / Owner'&&!requireAccessDelegation(req,scope))return res.status(403).json({error:'Manage access permissions is not delegated to your account.'});
    const check=canManageTarget(req,target,role,units);if(!check.ok)return res.status(403).json({error:check.error});if(!templateForRole(role).role_name)return res.status(400).json({error:'Unknown role template'});
    const before=accessSnapshot(target.id);db.prepare('UPDATE users SET role=? WHERE id=?').run(role,target.id);if(req.body.clear_overrides===true){db.prepare('DELETE FROM user_access_overrides WHERE user_id=?').run(target.id);db.prepare('DELETE FROM user_access_limits WHERE user_id=?').run(target.id)}const after=accessSnapshot(target.id);history(target.id,req.user.id,'template_apply',{before,after,role,clear_overrides:!!req.body.clear_overrides});res.json({ok:true,role});
  });
  app.post('/api/access/users/:id/copy',auth,(req,res)=>{
    if(req.user.role!=='CEO / Owner')return res.status(403).json({error:'Only CEO / Owner can copy another user’s complete access profile.'});
    const target=liveUser(req.params.id),source=liveUser(req.body.source_user_id);if(!target||!source)return res.status(404).json({error:'Source or target user not found'});if(Number(target.id)===Number(source.id))return res.status(400).json({error:'Choose another source user.'});const check=canManageTarget(req,target,source.role,req.body.copy_business_units?assignedUnits(source.id).map(x=>x.id):assignedUnits(target.id).map(x=>x.id));if(!check.ok)return res.status(403).json({error:check.error});
    const before=accessSnapshot(target.id);db.transaction(()=>{db.prepare('UPDATE users SET role=? WHERE id=?').run(source.role,target.id);db.prepare('DELETE FROM user_access_overrides WHERE user_id=?').run(target.id);db.prepare(`INSERT INTO user_access_overrides(user_id,business_unit_id,permission_key,effect,updated_by,updated_at) SELECT ?,business_unit_id,permission_key,effect,?,CURRENT_TIMESTAMP FROM user_access_overrides WHERE user_id=?`).run(target.id,req.user.id,source.id);db.prepare('DELETE FROM user_access_limits WHERE user_id=?').run(target.id);db.prepare(`INSERT INTO user_access_limits(user_id,business_unit_id,limit_key,limit_value,updated_by,updated_at) SELECT ?,business_unit_id,limit_key,limit_value,?,CURRENT_TIMESTAMP FROM user_access_limits WHERE user_id=?`).run(target.id,req.user.id,source.id);if(req.body.copy_business_units===true){const su=assignedUnits(source.id),p=su.find(x=>x.is_primary)?.id||su[0]?.id||null;replaceAssignments(target.id,su.map(x=>x.id),p,req.user.id)}})();const after=accessSnapshot(target.id);history(target.id,req.user.id,'access_copy',{before,after,source_user_id:source.id,copy_business_units:!!req.body.copy_business_units});res.json({ok:true});
  });

  return {MODULES,ACTIONS,SENSITIVE,DELEGATED,LIMITS,liveUser,assignedUnits,isAssigned,effectiveAccess,can,canModule,canAction,canAnyModule,getLimit,canManageTarget,validateOverrides,validateLimits,replaceAssignments,userSummary,templateForRole,history,scopeTarget,actorUnits,normalizeModule,accessSnapshot,validUnitIds};
}
module.exports={install,ACTIONS,MODULES,SENSITIVE,DELEGATED,LIMITS,permissionKey};
