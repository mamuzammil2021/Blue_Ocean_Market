const VERSION = '30.61.0';

async function install({ app, db, auth, audit, access }) {
  void 0;




























































  const moduleRows = [
  ['meetings', 'Meetings', 1], ['tasks', 'Tasks', 1], ['documents', 'Documents', 1], ['approvals', 'Approvals', 1],
  ['notifications', 'Notifications', 1], ['audit', 'Audit', 1], ['accounting', 'Accounting', 1], ['finance', 'Finance', 1],
  ['excavator', 'Excavator', 1], ['pink_salt', 'Pink Salt', 1], ['restaurant', 'MIMI Restaurant', 1], ['payroll', 'Employees & Payroll', 1]];

  const insModule = db.prepare(`INSERT INTO platform_modules(module_key,module_name,business_unit_aware,source)
    VALUES(?,?,?,'v30.61') ON CONFLICT(module_key) DO UPDATE SET module_name=excluded.module_name,business_unit_aware=excluded.business_unit_aware,active=1,updated_at=bom.utc_now()`);
  for (const row of moduleRows) await insModule.run(...row);

  const entities = [
  ['meeting', 'meetings', 'Meeting', 'meetings', 'title', 'meetings', 'Standard'],
  ['task', 'tasks', 'Task', 'tasks', 'title', 'tasks', 'High Volume'],
  ['document', 'documents', 'Document', 'documents', 'title', 'documents', 'Standard'],
  ['approval', 'approvals', 'Approval', 'approvals', 'type', 'approvals', 'High Volume'],
  ['finance_transaction', 'finance', 'Finance Transaction', 'finance_entries', 'description', 'finance', 'High Volume'],
  ['employee', 'payroll', 'Employee', 'employees', 'name', 'payroll', 'Standard'],
  ['excavator_machine', 'excavator', 'Excavator Machine', 'excavator_assets', 'machine_name', 'excavator', 'Standard'],
  ['excavator_buyer', 'excavator', 'Excavator Buyer', 'excavator_buyers', 'name', 'excavatorBuyers', 'Standard'],
  ['excavator_supplier', 'excavator', 'Excavator Supplier', 'excavator_suppliers', 'name', 'excavatorSuppliers', 'Standard']];

  const insEntity = db.prepare(`INSERT INTO platform_entities(entity_type,module_key,entity_name,table_name,display_field,route_template,performance_class)
    VALUES(?,?,?,?,?,?,?) ON CONFLICT(entity_type) DO UPDATE SET module_key=excluded.module_key,entity_name=excluded.entity_name,table_name=excluded.table_name,display_field=excluded.display_field,route_template=excluded.route_template,performance_class=excluded.performance_class,active=1,updated_at=bom.utc_now()`);
  for (const row of entities) await insEntity.run(...row);

  const caps = ['related_records', 'tasks', 'meetings', 'documents', 'approvals', 'notifications', 'audit', 'search'];
  const capabilityMap = {
    meeting: ['related_records', 'tasks', 'documents', 'notifications', 'audit', 'search'],
    task: ['related_records', 'meetings', 'documents', 'notifications', 'audit', 'search'],
    document: ['related_records', 'tasks', 'meetings', 'approvals', 'notifications', 'audit', 'search'],
    approval: ['related_records', 'tasks', 'meetings', 'documents', 'notifications', 'audit', 'search'],
    finance_transaction: ['related_records', 'tasks', 'meetings', 'documents', 'approvals', 'notifications', 'audit', 'search'],
    employee: ['related_records', 'tasks', 'meetings', 'documents', 'approvals', 'notifications', 'audit', 'search'],
    excavator_machine: ['related_records', 'tasks', 'meetings', 'documents', 'approvals', 'notifications', 'audit', 'search'],
    excavator_buyer: ['related_records', 'tasks', 'meetings', 'documents', 'notifications', 'audit', 'search'],
    excavator_supplier: ['related_records', 'tasks', 'meetings', 'documents', 'notifications', 'audit', 'search']
  };
  const insCap = db.prepare("INSERT INTO platform_entity_capabilities(entity_type,capability_key,enabled) VALUES(?,?,1) ON CONFLICT (entity_type,capability_key) DO UPDATE SET enabled=EXCLUDED.enabled");
  for (const [entity, list] of Object.entries(capabilityMap)) for (const cap of list) if (caps.includes(cap)) await insCap.run(entity, cap);

  // Safe backfill only: existing single-BU records retain their current behavior and also become registry-scoped.
  await db.prepare(`INSERT INTO meeting_business_units(meeting_id,business_unit_id)
    SELECT id,business_unit_id FROM meetings WHERE business_unit_id IS NOT NULL ON CONFLICT DO NOTHING`).run();
  await db.prepare(`INSERT INTO task_business_units(task_id,business_unit_id)
    SELECT id,business_unit_id FROM tasks WHERE business_unit_id IS NOT NULL ON CONFLICT DO NOTHING`).run();

  async function allowedUnit(user, bu) {
    bu = Number(bu || 0);if (!bu) return false;
    if (user?.role === 'CEO / Owner') return true;
    return access?.isAssigned ? await access.isAssigned(user.id, bu) : Number(user?.business_unit_id) === bu;
  }
  async function entityExists(type, id) {
    const e = await db.prepare("SELECT * FROM platform_entities WHERE entity_type=? AND active=1").get(String(type || ''));
    if (!e || !e.table_name || !/^[_a-zA-Z0-9]+$/.test(e.table_name)) return null;
    try {return (await db.prepare(`SELECT * FROM ${e.table_name} WHERE id=?`).get(Number(id))) ? e : null;} catch (_) {return null;}
  }

  await app.get('/api/platform/registry', auth, async (req, res) => {
    const modules = await db.prepare("SELECT module_key,module_name,business_unit_aware,active FROM platform_modules WHERE active=1 ORDER BY module_name").all();
    const entities = (await db.prepare(`SELECT e.*,STRING_AGG((CASE WHEN c.enabled=1 THEN c.capability_key END)::text,',') capability_csv
      FROM platform_entities e LEFT JOIN platform_entity_capabilities c ON c.entity_type=e.entity_type
      WHERE e.active=1 GROUP BY e.entity_type ORDER BY e.module_key,e.entity_name`).all()).map((x) => ({ ...x, capabilities: String(x.capability_csv || '').split(',').filter(Boolean) }));
    await res.json({ version: VERSION, modules, entities });
  });

  await app.get('/api/platform/related/:entityType/:entityId', auth, async (req, res) => {
    const type = String(req.params.entityType || ''),id = Number(req.params.entityId || 0);if (!(await entityExists(type, id))) return await res.status(404).json({ error: 'Registered record not found' });
    const rows = await db.prepare(`SELECT r.*,pe.entity_name target_entity_name,pe.module_key target_module
      FROM platform_related_records r LEFT JOIN platform_entities pe ON pe.entity_type=r.target_entity_type
      WHERE r.source_entity_type=? AND r.source_entity_id=? ORDER BY r.created_at DESC,r.id DESC`).all(type, id);
    await res.json(rows);
  });

  await app.post('/api/platform/related', auth, async (req, res) => {
    const sourceType = String(req.body.source_entity_type || ''),targetType = String(req.body.target_entity_type || '');
    const sourceId = Number(req.body.source_entity_id || 0),targetId = Number(req.body.target_entity_id || 0),bu = req.body.business_unit_id ? Number(req.body.business_unit_id) : null;
    if (!(await entityExists(sourceType, sourceId)) || !(await entityExists(targetType, targetId))) return await res.status(400).json({ error: 'Both records must be registered platform entities' });
    if (bu && !(await allowedUnit(req.user, bu))) return await res.status(403).json({ error: 'You are not authorized for this business unit' });
    const rel = String(req.body.relationship_type || 'Related').trim().slice(0, 80) || 'Related';
    const r = await db.prepare(`INSERT INTO platform_related_records(source_entity_type,source_entity_id,target_entity_type,target_entity_id,relationship_type,business_unit_id,created_by)
      VALUES(?,?,?,?,?,?,?) ON CONFLICT DO NOTHING`).run(sourceType, sourceId, targetType, targetId, rel, bu, req.user.id);
    if (audit) await audit(req.user, 'platform_related_record', r.lastInsertRowid || null, 'link', JSON.stringify({ sourceType, sourceId, targetType, targetId, relationship_type: rel, business_unit_id: bu }));
    await res.json({ ok: true, id: Number(r.lastInsertRowid || 0) });
  });

  return { VERSION };
}

module.exports = { install, VERSION };
