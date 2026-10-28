// Blue Ocean Market V30.24.3 — BU-scoped central Numbering & References registry.
'use strict';const __async = require("./postgres/collections");
const numbering = require('./numbering-service');
const VERSION = '30.24.3';

async function install({ app, db, auth, enforceUnit, access, audit }) {
  await numbering.ensure();
  const text = (v) => String(v ?? '').trim();
  const unitGroup = (name) => {const n = text(name).toLowerCase();if (n.includes('pink') && n.includes('salt')) return 'pink_salt';if (n.includes('mimi') || n.includes('restaurant') || n.includes('resturant')) return 'restaurant';if (n.includes('excavator')) return 'excavator';if (n.includes('mango')) return 'mango';return 'generic';};
  const isCeo = (req) => req.user?.role === 'CEO / Owner';
  const canSystemAdmin = async (req, bu) => isCeo(req) || !!(await access?.can?.(req.user.id, 'sensitive.system_admin', bu || req.selected_business_unit_id || req.user.business_unit_id));
  const canSeeUnit = async (req, bu) => isCeo(req) || (await canSystemAdmin(req, bu));
  const canEditUnit = async (req, bu) => isCeo(req) || (await canSeeUnit(req, bu));
  const allUnits = async () => await db.prepare("SELECT id,name,status FROM business_units WHERE status!='Archived' ORDER BY name").all();
  const accessibleUnits = async (req) => (await __async.filter(await allUnits(), async (u) => await canSeeUnit(req, Number(u.id)))).map((u) => ({ ...u, numbering_group: unitGroup(u.name) }));
  const refsFor = async (scope, bu) => {
    const defs = await numbering.listDefinitions();
    let filtered = [];
    if (scope === 'company') filtered = defs.filter((d) => d.display_group === 'shared' || d.display_group === 'generic');else
    {
      const u = (await allUnits()).find((x) => Number(x.id) === Number(bu));if (!u) return [];
      const group = unitGroup(u.name);
      filtered = defs.filter((d) => d.display_group === group || group === 'mango' && d.display_group === 'generic');
      // General sale/purchase references can apply to ordinary non-dedicated BUs.
      if (group === 'generic') filtered = defs.filter((d) => d.display_group === 'generic');
    }
    const scopeBu = scope === 'company' ? 0 : Number(bu || 0);
    const rows = await __async.map(filtered, async (d) => {const e = await numbering.effective(d.reference_key, scopeBu);return { ...e, preview: numbering.formatPreview(e), current_sequence: await numbering.currentSequence(e), scope_business_unit_id: scopeBu };});
    const prefixCount = {};for (const r of rows) {const p = text(r.prefix).toUpperCase();if (p) prefixCount[p] = (prefixCount[p] || 0) + 1;}
    return rows.map((r) => ({ ...r, prefix_conflict: (prefixCount[text(r.prefix).toUpperCase()] || 0) > 1 }));
  };
  const auditSafe = async (req, type, id, action, detail) => {try {await audit?.(req.user, type, id, action, typeof detail === 'string' ? detail : JSON.stringify(detail || {}));} catch (_) {}};

  try {await db.prepare("INSERT INTO schema_migrations(id,release_version,notes) VALUES('v30.24.3.numbering-registry',?,?) ON CONFLICT DO NOTHING").run(VERSION, 'Central Numbering & References registry with Business Unit presentation, audited overrides and automatic feature registration.');} catch (_) {}

  await app.get('/api/v3243/version', auth, async (req, res) => await res.json({ version: VERSION, features: ['central-numbering-registry', 'business-unit-numbering-tabs', 'automatic-prefix-registration', 'numbering-audit-history'] }));
  await app.get('/api/v3243/numbering/catalog', auth, async (req, res) => {
    const units = await accessibleUnits(req);if (!isCeo(req) && !units.length) return await res.status(403).json({ error: 'System Administrator access is required.' });
    const requestedScope = text(req.query.scope) === 'company' ? 'company' : 'business_unit',requestedBu = Number(req.query.business_unit_id || 0);
    let scope = requestedScope,bu = requestedBu;
    if (scope === 'company' && !isCeo(req)) {scope = 'business_unit';bu = Number(req.selected_business_unit_id || req.user.business_unit_id || units[0]?.id || 0);}
    if (scope === 'business_unit') {if (!bu) bu = Number(req.selected_business_unit_id || req.user.business_unit_id || units[0]?.id || 0);if (!(await canSeeUnit(req, bu))) return await res.status(403).json({ error: 'You cannot view numbering for another business unit.' });}
    await res.json({ version: VERSION, scope, business_unit_id: scope === 'company' ? 0 : bu, can_view_company: isCeo(req), can_edit: scope === 'company' ? isCeo(req) : await canEditUnit(req, bu), units, references: await refsFor(scope, bu), policy: { historical_references_immutable: true, new_feature_auto_registration: true, precedence: 'BU Override → Company Override → System Default' } });
  });
  app.put('/api/v3243/numbering/:key', auth, async (req, res) => {
    const key = text(req.params.key),scope = text(req.body.scope) === 'company' ? 'company' : 'business_unit',bu = scope === 'company' ? 0 : Number(req.body.business_unit_id || 0),reason = text(req.body.reason);
    if (scope === 'company' && !isCeo(req)) return await res.status(403).json({ error: 'Only CEO / Owner can change Company / Shared numbering.' });
    if (scope === 'business_unit' && (!bu || !(await canEditUnit(req, bu)))) return await res.status(403).json({ error: 'You cannot change numbering for this business unit.' });
    if (reason.length < 3) return await res.status(400).json({ error: 'Enter a change reason.' });
    const before = await numbering.effective(key, bu);if (!before) return await res.status(404).json({ error: 'Numbering reference type not found.' });
    const p = numbering.normalizePrefix(req.body.prefix || before.prefix);if (!p) return await res.status(400).json({ error: 'Enter a valid prefix.' });
    const siblings = (await refsFor(scope, bu)).filter((x) => x.reference_key !== key && String(x.prefix || '').toUpperCase() === p.toUpperCase());
    if (p !== String(before.prefix || '').toUpperCase() && siblings.length) return await res.status(409).json({ error: `Prefix ${p} is already used by ${siblings.map((x) => x.label).join(', ')} in this scope. Choose a unique prefix.` });
    try {
      const after = await numbering.setOverride(key, bu, { prefix: p, padding: req.body.padding, include_year: req.body.include_year, reset_yearly: req.body.reset_yearly, enabled: req.body.enabled }, { userId: req.user.id, reason });
      await auditSafe(req, 'numbering_reference', key, "update", { scope, business_unit_id: bu, before: { prefix: before.prefix, padding: before.padding, include_year: before.include_year, reset_yearly: before.reset_yearly }, after: { prefix: after.prefix, padding: after.padding, include_year: after.include_year, reset_yearly: after.reset_yearly }, reason });
      await res.json({ ...after, preview: numbering.formatPreview(after), current_sequence: await numbering.currentSequence(after) });
    } catch (e) {await res.status(400).json({ error: e.message });}
  });
  await app.get('/api/v3243/numbering/:key/history', auth, async (req, res) => {
    const scope = text(req.query.scope) === 'company' ? 'company' : 'business_unit',bu = scope === 'company' ? 0 : Number(req.query.business_unit_id || 0);
    if (scope === 'company' && !isCeo(req)) return await res.status(403).json({ error: 'Only CEO / Owner can view Company / Shared numbering history.' });
    if (scope === 'business_unit' && (!bu || !(await canSeeUnit(req, bu)))) return await res.status(403).json({ error: 'You cannot view this numbering history.' });
    const rows = (await db.prepare(`SELECT h.*,u.name changed_by_name FROM numbering_reference_history h LEFT JOIN users u ON u.id=h.changed_by WHERE h.reference_key=? AND h.business_unit_id=? ORDER BY h.id DESC LIMIT 200`).all(text(req.params.key), bu)).map((r) => {let before = {},after = {};try {before = JSON.parse(r.before_json || '{}');} catch (_) {}try {after = JSON.parse(r.after_json || '{}');} catch (_) {}return { ...r, before, after };});await res.json(rows);
  });
  return { VERSION, numbering };
}
module.exports = { install, VERSION };
