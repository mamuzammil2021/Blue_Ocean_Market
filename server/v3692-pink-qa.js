'use strict';const __async = require("./postgres/collections");
const VERSION = '30.69.2';
async function install({ app, db, auth, allow, currentUnit, enforceUnit, audit }) {
  const num = (v) => Number(v || 0),text = (v) => String(v ?? '').trim();
  async function pinkBu() {return Number((await db.prepare("SELECT id FROM business_units WHERE name='Pink Salt' AND status!='Archived'").get())?.id || 0);}
  async function guard(req, res) {const bu = await pinkBu(),selected = Number(currentUnit(req) || 0);if (!bu) return await res.status(409).json({ error: 'Pink Salt business unit is not available.' });if (!selected || selected !== bu || !enforceUnit(req, bu)) {await res.status(403).json({ error: "Select the Pink Salt business unit to use this workspace." });return null;}return bu;}
  async function costLock(costId) {const c = await db.prepare("SELECT * FROM pink_salt_import_costs WHERE id=?").get(costId);if (!c) return null;const state = await require('./cost-lock').costState(db, c);return state.locked ? state : null;}

  await app.post('/api/pink-salt/suppliers/:id/restore-v3692', auth, allow('purchases', 'finance'), async (req, res) => {
    const bu = await guard(req, res);if (!bu) return;const s = await db.prepare("SELECT * FROM pink_salt_suppliers WHERE id=? AND business_unit_id=?").get(Number(req.params.id), bu);if (!s) return await res.status(404).json({ error: 'Supplier not found.' });if (num(s.active)) return await res.json({ ok: true, already_active: true });await db.prepare("UPDATE pink_salt_suppliers SET active=1,updated_at=bom.utc_now() WHERE id=?").run(s.id);await audit(req.user, 'pink_salt_supplier', s.id, 'restore-v3692', "Restored from archived supplier list");await res.json({ ok: true });
  });

  await app.get('/api/pink-salt/imports/:id/cost-locks-v3692', auth, allow('purchases', 'inventory', 'finance', 'dashboard'), async (req, res) => {
    const bu = await guard(req, res);if (!bu) return;const imp = await db.prepare("SELECT id,status,received_at FROM pink_salt_imports WHERE id=? AND business_unit_id=?").get(Number(req.params.id), bu);if (!imp) return await res.status(404).json({ error: 'Import not found.' });const received = text(imp.status) === 'Received' || !!imp.received_at;const costs = await __async.map(await db.prepare("SELECT * FROM pink_salt_import_costs WHERE import_id=? ORDER BY cost_date,id").all(imp.id), async (c) => {const state = await require('./cost-lock').costState(db, c, { received });return { id: c.id, status: c.status, fx_transaction_id: c.fx_transaction_id || state.transaction_id || null, locked: state.locked, lock_reason: state.lock_reason, finance_entry_id: state.finance_entry_id, verification_status: state.verification_status, accounting_status: state.accounting_status };});await res.json({ import_received: text(imp.status) === 'Received' || !!imp.received_at, costs });
  });

  console.info(`Blue Ocean Market V${VERSION} Pink Salt QA server refinements loaded`);
  return { VERSION };
}
module.exports = { install, VERSION };
