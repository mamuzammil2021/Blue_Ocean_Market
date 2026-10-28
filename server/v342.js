'use strict';

const VERSION = '30.42.0';

function json(v, fallback = {}) {try {const x = JSON.parse(v || '');return x == null ? fallback : x;} catch (_) {return fallback;}}
function titleCase(v) {return String(v || '').replace(/^module\./, '').replace(/^sensitive\./, '').replace(/^delegate\./, '').replace(/[._]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());}
async function tableExists(db, name) {return !!(await db.prepare("SELECT 1 FROM bom._relations WHERE type='table' AND name=?").get(name));}
async function addColumn(db, table, name, definition) {const cols = (await db.columns(table)).map((x) => x.name);if (!cols.includes(name)) void 0;}

async function installTaskWorkflowSchema(db) {
  await addColumn(db, 'tasks', 'system_managed', 'INTEGER NOT NULL DEFAULT 0');
  await addColumn(db, 'tasks', 'workflow_key', "TEXT NOT NULL DEFAULT ''");
  await addColumn(db, 'tasks', 'workflow_state', "TEXT NOT NULL DEFAULT ''");
  await addColumn(db, 'tasks', 'action_key', "TEXT NOT NULL DEFAULT ''");
  await addColumn(db, 'tasks', 'action_label', "TEXT NOT NULL DEFAULT ''");
  await addColumn(db, 'tasks', 'action_view', "TEXT NOT NULL DEFAULT ''");
  await addColumn(db, 'tasks', 'action_id', 'INTEGER');
  await addColumn(db, 'tasks', 'action_enabled', 'INTEGER NOT NULL DEFAULT 0');
  await addColumn(db, 'tasks', 'source_event', "TEXT NOT NULL DEFAULT ''");
  await addColumn(db, 'tasks', 'workflow_chain_key', "TEXT NOT NULL DEFAULT ''");
  void 0;



  // Existing Finance/Approval workflow tasks become actionable without creating replacements.
  await db.prepare(`UPDATE tasks SET
      system_managed=1,
      workflow_key='finance.correction',
      workflow_state=CASE WHEN status='Completed' THEN 'Completed' WHEN status='Cancelled' THEN 'Cancelled' WHEN status='Waiting' THEN 'Awaiting Finance Verification' ELSE 'Action Required' END,
      action_key='finance.correct_resubmit',action_label='Correct & Resubmit',action_view='financeCorrectionAction',action_id=related_entity_id,
      action_enabled=CASE WHEN status IN ('Completed','Cancelled','Waiting') THEN 0 ELSE 1 END,
      workflow_chain_key=CASE WHEN COALESCE(workflow_chain_key,'')='' THEN 'finance.correction:'||COALESCE(related_entity_id,id) ELSE workflow_chain_key END,
      source_event=CASE WHEN COALESCE(source_event,'')='' THEN 'Finance Correction Request' ELSE source_event END
    WHERE related_entity_type='finance_correction'`).run();
  await db.prepare(`UPDATE tasks SET
      system_managed=1,
      workflow_key='approval.correction',
      workflow_state=CASE WHEN status='Completed' THEN 'Completed' WHEN status='Cancelled' THEN 'Cancelled' WHEN status='Waiting' THEN 'Awaiting Approval Review' ELSE 'Action Required' END,
      action_key='approval.correct_resubmit',action_label='Correct & Resubmit',action_view='approvalCorrectionAction',action_id=related_entity_id,
      action_enabled=CASE WHEN status IN ('Completed','Cancelled','Waiting') THEN 0 ELSE 1 END,
      workflow_chain_key=CASE WHEN COALESCE(workflow_chain_key,'')='' THEN 'approval.correction:'||COALESCE(related_entity_id,id) ELSE workflow_chain_key END,
      source_event=CASE WHEN COALESCE(source_event,'')='' THEN 'Approval Changes Required' ELSE source_event END
    WHERE related_entity_type='approval' AND title ILIKE 'Approval changes required%'`).run();
}

function permissionDefinitions(access) {
  const defs = [];
  for (const module of access.MODULES || []) for (const action of access.ACTIONS || []) {
    const key = `module.${module}.${action}`;
    defs.push({ permission_key: key, permission_type: 'module_action', module_key: module, action_key: action, label_en: `${titleCase(module)} — ${titleCase(action)}`, description: `${titleCase(action)} permission for ${titleCase(module)}.` });
  }
  for (const key of access.SENSITIVE || []) defs.push({ permission_key: key, permission_type: 'sensitive', module_key: 'security', action_key: 'sensitive', label_en: titleCase(key), description: 'Sensitive protected permission.' });
  for (const key of access.DELEGATED || []) defs.push({ permission_key: key, permission_type: 'delegated', module_key: 'users', action_key: 'delegate', label_en: titleCase(key), description: 'Delegated administration permission.' });
  return defs;
}

async function installPermissionCatalog(db, access) {
  void 0;

























  const before = Number((await db.prepare("SELECT COUNT(*) c FROM access_permission_catalog_v342").get())?.c || 0),bootstrap = before === 0;
  const insert = db.prepare(`INSERT INTO access_permission_catalog_v342(permission_key,permission_type,module_key,action_key,label_en,description,sensitive,introduced_version,active)
    VALUES(?,?,?,?,?,?,?,?,1) ON CONFLICT DO NOTHING`);
  const newKeys = new Set();
  for (const d of permissionDefinitions(access)) {
    const r = await insert.run(d.permission_key, d.permission_type, d.module_key, d.action_key, d.label_en, d.description, d.permission_type === 'sensitive' ? 1 : 0, VERSION);
    if (r.changes) await newKeys.add(d.permission_key);
  }
  const profileDefaults = typeof access.defaultTemplates === 'function' ? access.defaultTemplates() : [];
  const groupDefaults = typeof access.defaultPermissionGroups === 'function' ? access.defaultPermissionGroups() : [];
  const seed = db.prepare("INSERT INTO access_permission_default_assignments_v342(target_type,target_key,permission_key,source_version,applied) VALUES(?,?,?,?,?) ON CONFLICT DO NOTHING");
  async function hasTracked(type, key, permission) {return !!(await db.prepare("SELECT 1 FROM access_permission_default_assignments_v342 WHERE target_type=? AND target_key=? AND permission_key=?").get(type, key, permission));}
  async function addPermission(table, keyColumn, key, permission) {
    const row = await db.prepare(`SELECT permissions_json FROM ${table} WHERE ${keyColumn}=?`).get(key);if (!row) return false;
    const perms = json(row.permissions_json, {});if (perms[permission] === true) return true;perms[permission] = true;
    await db.prepare(`UPDATE ${table} SET permissions_json=?,updated_at=bom.utc_now() WHERE ${keyColumn}=?`).run(JSON.stringify(perms), key);return true;
  }
  // Bootstrap records current defaults without overwriting any administrator customization.
  // On later upgrades only genuinely new permission keys are mapped once to their relevant default bundles.
  for (const p of profileDefaults) {const target = access.roleKey ? access.roleKey(p.role) : String(p.role || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');for (const [permission, enabled] of Object.entries(p.permissions || {})) {if (enabled !== true) continue;const tracked = await hasTracked('profile', target, permission);if (bootstrap) {const row = await db.prepare("SELECT permissions_json FROM access_role_templates WHERE role_key=?").get(target),present = json(row?.permissions_json, {});await seed.run('profile', target, permission, VERSION, present[permission] === true ? 1 : 0);} else if ((await newKeys.has(permission)) && !tracked) {const applied = await addPermission('access_role_templates', 'role_key', target, permission);await seed.run('profile', target, permission, VERSION, applied ? 1 : 0);}}}
  for (const g of groupDefaults) {for (const [permission, enabled] of Object.entries(g.permissions || {})) {if (enabled !== true) continue;const tracked = await hasTracked('group', g.key, permission);if (bootstrap) {const row = await db.prepare("SELECT permissions_json FROM access_permission_groups WHERE group_key=?").get(g.key),present = json(row?.permissions_json, {});await seed.run('group', g.key, permission, VERSION, present[permission] === true ? 1 : 0);} else if ((await newKeys.has(permission)) && !tracked) {const applied = await addPermission('access_permission_groups', 'group_key', g.key, permission);await seed.run('group', g.key, permission, VERSION, applied ? 1 : 0);}}}
  return { bootstrap, new_permissions: [...newKeys] };
}

async function install(ctx) {
  const { app, db, auth, access } = ctx;
  await installTaskWorkflowSchema(db);
  const permissionSync = await installPermissionCatalog(db, access || {});
  await app.get('/api/tasks/:id/workflow-v342', auth, async (req, res) => {
    const t = await db.prepare("SELECT id,owner_id,business_unit_id,status,system_managed,workflow_key,workflow_state,action_key,action_label,action_view,action_id,action_enabled,related_module,related_entity_type,related_entity_id,workflow_chain_key FROM tasks WHERE id=?").get(Number(req.params.id));
    if (!t) return await res.status(404).json({ error: 'Task not found' });if (req.user.role !== 'CEO / Owner' && Number(t.owner_id) !== Number(req.user.id) && Number(t.business_unit_id || 0) !== Number(req.user.business_unit_id || 0)) return await res.status(403).json({ error: 'You cannot access this task.' });await res.json(t);
  });
  return { version: VERSION, permissionSync };
}

module.exports = { install, VERSION, installTaskWorkflowSchema, installPermissionCatalog };
