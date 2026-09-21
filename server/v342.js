'use strict';

const VERSION='30.42.0';

function json(v,fallback={}){try{const x=JSON.parse(v||'');return x==null?fallback:x}catch(_){return fallback}}
function titleCase(v){return String(v||'').replace(/^module\./,'').replace(/^sensitive\./,'').replace(/^delegate\./,'').replace(/[._]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase())}
function tableExists(db,name){return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name)}
function addColumn(db,table,name,definition){const cols=db.prepare(`PRAGMA table_info(${table})`).all().map(x=>x.name);if(!cols.includes(name))db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`)}

function installTaskWorkflowSchema(db){
  addColumn(db,'tasks','system_managed','INTEGER NOT NULL DEFAULT 0');
  addColumn(db,'tasks','workflow_key',"TEXT NOT NULL DEFAULT ''");
  addColumn(db,'tasks','workflow_state',"TEXT NOT NULL DEFAULT ''");
  addColumn(db,'tasks','action_key',"TEXT NOT NULL DEFAULT ''");
  addColumn(db,'tasks','action_label',"TEXT NOT NULL DEFAULT ''");
  addColumn(db,'tasks','action_view',"TEXT NOT NULL DEFAULT ''");
  addColumn(db,'tasks','action_id','INTEGER');
  addColumn(db,'tasks','action_enabled','INTEGER NOT NULL DEFAULT 0');
  addColumn(db,'tasks','source_event',"TEXT NOT NULL DEFAULT ''");
  addColumn(db,'tasks','workflow_chain_key',"TEXT NOT NULL DEFAULT ''");
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_workflow_v342 ON tasks(system_managed,workflow_key,workflow_state,status);
    CREATE INDEX IF NOT EXISTS idx_tasks_workflow_chain_v342 ON tasks(workflow_chain_key);
  `);
  // Existing Finance/Approval workflow tasks become actionable without creating replacements.
  db.prepare(`UPDATE tasks SET
      system_managed=1,
      workflow_key='finance.correction',
      workflow_state=CASE WHEN status='Completed' THEN 'Completed' WHEN status='Cancelled' THEN 'Cancelled' WHEN status='Waiting' THEN 'Awaiting Finance Verification' ELSE 'Action Required' END,
      action_key='finance.correct_resubmit',action_label='Correct & Resubmit',action_view='financeCorrectionAction',action_id=related_entity_id,
      action_enabled=CASE WHEN status IN ('Completed','Cancelled','Waiting') THEN 0 ELSE 1 END,
      workflow_chain_key=CASE WHEN COALESCE(workflow_chain_key,'')='' THEN 'finance.correction:'||COALESCE(related_entity_id,id) ELSE workflow_chain_key END,
      source_event=CASE WHEN COALESCE(source_event,'')='' THEN 'Finance Correction Request' ELSE source_event END
    WHERE related_entity_type='finance_correction'`).run();
  db.prepare(`UPDATE tasks SET
      system_managed=1,
      workflow_key='approval.correction',
      workflow_state=CASE WHEN status='Completed' THEN 'Completed' WHEN status='Cancelled' THEN 'Cancelled' WHEN status='Waiting' THEN 'Awaiting Approval Review' ELSE 'Action Required' END,
      action_key='approval.correct_resubmit',action_label='Correct & Resubmit',action_view='approvalCorrectionAction',action_id=related_entity_id,
      action_enabled=CASE WHEN status IN ('Completed','Cancelled','Waiting') THEN 0 ELSE 1 END,
      workflow_chain_key=CASE WHEN COALESCE(workflow_chain_key,'')='' THEN 'approval.correction:'||COALESCE(related_entity_id,id) ELSE workflow_chain_key END,
      source_event=CASE WHEN COALESCE(source_event,'')='' THEN 'Approval Changes Required' ELSE source_event END
    WHERE related_entity_type='approval' AND title LIKE 'Approval changes required%'`).run();
}

function permissionDefinitions(access){
  const defs=[];
  for(const module of access.MODULES||[])for(const action of access.ACTIONS||[]){
    const key=`module.${module}.${action}`;
    defs.push({permission_key:key,permission_type:'module_action',module_key:module,action_key:action,label_en:`${titleCase(module)} — ${titleCase(action)}`,description:`${titleCase(action)} permission for ${titleCase(module)}.`});
  }
  for(const key of access.SENSITIVE||[])defs.push({permission_key:key,permission_type:'sensitive',module_key:'security',action_key:'sensitive',label_en:titleCase(key),description:'Sensitive protected permission.'});
  for(const key of access.DELEGATED||[])defs.push({permission_key:key,permission_type:'delegated',module_key:'users',action_key:'delegate',label_en:titleCase(key),description:'Delegated administration permission.'});
  return defs;
}

function installPermissionCatalog(db,access){
  db.exec(`
    CREATE TABLE IF NOT EXISTS access_permission_catalog_v342(
      permission_key TEXT PRIMARY KEY,
      permission_type TEXT NOT NULL,
      module_key TEXT NOT NULL DEFAULT '',
      action_key TEXT NOT NULL DEFAULT '',
      label_en TEXT NOT NULL DEFAULT '',
      label_ko TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      sensitive INTEGER NOT NULL DEFAULT 0,
      introduced_version TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS access_permission_default_assignments_v342(
      target_type TEXT NOT NULL,
      target_key TEXT NOT NULL,
      permission_key TEXT NOT NULL,
      source_version TEXT NOT NULL DEFAULT '',
      applied INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(target_type,target_key,permission_key)
    );
    CREATE INDEX IF NOT EXISTS idx_permission_catalog_module_v342 ON access_permission_catalog_v342(active,module_key,action_key);
  `);
  const before=Number(db.prepare('SELECT COUNT(*) c FROM access_permission_catalog_v342').get()?.c||0),bootstrap=before===0;
  const insert=db.prepare(`INSERT OR IGNORE INTO access_permission_catalog_v342(permission_key,permission_type,module_key,action_key,label_en,description,sensitive,introduced_version,active)
    VALUES(?,?,?,?,?,?,?,?,1)`);
  const newKeys=new Set();
  for(const d of permissionDefinitions(access)){
    const r=insert.run(d.permission_key,d.permission_type,d.module_key,d.action_key,d.label_en,d.description,d.permission_type==='sensitive'?1:0,VERSION);
    if(r.changes)newKeys.add(d.permission_key);
  }
  const profileDefaults=typeof access.defaultTemplates==='function'?access.defaultTemplates():[];
  const groupDefaults=typeof access.defaultPermissionGroups==='function'?access.defaultPermissionGroups():[];
  const seed=db.prepare('INSERT OR IGNORE INTO access_permission_default_assignments_v342(target_type,target_key,permission_key,source_version,applied) VALUES(?,?,?,?,?)');
  function hasTracked(type,key,permission){return !!db.prepare('SELECT 1 FROM access_permission_default_assignments_v342 WHERE target_type=? AND target_key=? AND permission_key=?').get(type,key,permission)}
  function addPermission(table,keyColumn,key,permission){
    const row=db.prepare(`SELECT permissions_json FROM ${table} WHERE ${keyColumn}=?`).get(key);if(!row)return false;
    const perms=json(row.permissions_json,{});if(perms[permission]===true)return true;perms[permission]=true;
    db.prepare(`UPDATE ${table} SET permissions_json=?,updated_at=CURRENT_TIMESTAMP WHERE ${keyColumn}=?`).run(JSON.stringify(perms),key);return true;
  }
  // Bootstrap records current defaults without overwriting any administrator customization.
  // On later upgrades only genuinely new permission keys are mapped once to their relevant default bundles.
  for(const p of profileDefaults){const target=(access.roleKey?access.roleKey(p.role):String(p.role||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''));for(const [permission,enabled] of Object.entries(p.permissions||{})){if(enabled!==true)continue;const tracked=hasTracked('profile',target,permission);if(bootstrap){const row=db.prepare('SELECT permissions_json FROM access_role_templates WHERE role_key=?').get(target),present=json(row?.permissions_json,{});seed.run('profile',target,permission,VERSION,present[permission]===true?1:0)}else if(newKeys.has(permission)&&!tracked){const applied=addPermission('access_role_templates','role_key',target,permission);seed.run('profile',target,permission,VERSION,applied?1:0)}}}
  for(const g of groupDefaults){for(const [permission,enabled] of Object.entries(g.permissions||{})){if(enabled!==true)continue;const tracked=hasTracked('group',g.key,permission);if(bootstrap){const row=db.prepare('SELECT permissions_json FROM access_permission_groups WHERE group_key=?').get(g.key),present=json(row?.permissions_json,{});seed.run('group',g.key,permission,VERSION,present[permission]===true?1:0)}else if(newKeys.has(permission)&&!tracked){const applied=addPermission('access_permission_groups','group_key',g.key,permission);seed.run('group',g.key,permission,VERSION,applied?1:0)}}}
  return {bootstrap,new_permissions:[...newKeys]};
}

function install(ctx){
  const {app,db,auth,access}=ctx;
  installTaskWorkflowSchema(db);
  const permissionSync=installPermissionCatalog(db,access||{});
  app.get('/api/tasks/:id/workflow-v342',auth,(req,res)=>{
    const t=db.prepare('SELECT id,owner_id,business_unit_id,status,system_managed,workflow_key,workflow_state,action_key,action_label,action_view,action_id,action_enabled,related_module,related_entity_type,related_entity_id,workflow_chain_key FROM tasks WHERE id=?').get(Number(req.params.id));
    if(!t)return res.status(404).json({error:'Task not found'});if(req.user.role!=='CEO / Owner'&&Number(t.owner_id)!==Number(req.user.id)&&Number(t.business_unit_id||0)!==Number(req.user.business_unit_id||0))return res.status(403).json({error:'You cannot access this task.'});res.json(t);
  });
  return {version:VERSION,permissionSync};
}

module.exports={install,VERSION,installTaskWorkflowSchema,installPermissionCatalog};
