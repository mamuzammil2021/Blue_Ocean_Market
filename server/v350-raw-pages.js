'use strict';
// Read-side only: inventory list paging must never replace full-stock production/waste validation APIs.
const { paging } = require('./v349-pink-pages');
const STOCK_SCOPE = `FROM pink_salt_import_items x JOIN pink_salt_imports i ON i.id=x.import_id WHERE i.business_unit_id=? AND i.status='Received'`;
const STOCK_SUMMARY_SQL = `WITH balances AS (SELECT x.id,x.salt_grade,COALESCE(SUM(m.quantity_kg),0) available_kg
 FROM pink_salt_import_items x JOIN pink_salt_imports i ON i.id=x.import_id LEFT JOIN pink_salt_raw_stock_movements m ON m.import_item_id=x.id
 WHERE i.business_unit_id=? AND i.status='Received' GROUP BY x.id)
 SELECT COALESCE(SUM(available_kg),0) total_kg,COUNT(CASE WHEN available_kg>0 THEN 1 END) active_batches,
 COALESCE(SUM(CASE WHEN lower(salt_grade) ILIKE '%mesh%' THEN available_kg ELSE 0 END),0) mesh_kg,
 COALESCE(SUM(CASE WHEN STRPOS(salt_grade,'2-3')>0 OR STRPOS(salt_grade,'2–3')>0 THEN available_kg ELSE 0 END),0) mm_2_3_kg,
 COALESCE(SUM(CASE WHEN STRPOS(salt_grade,'3-5')>0 OR STRPOS(salt_grade,'3–5')>0 THEN available_kg ELSE 0 END),0) mm_3_5_kg FROM balances`;
const STOCK_PAGE_SQL = `WITH chosen AS MATERIALIZED (SELECT x.id,x.salt_grade,x.specification,x.bag_size_kg,x.bag_count,x.total_weight_kg,x.received_weight_kg,x.storage_location,x.landed_cost_krw,x.receiving_unit_cost_krw,
 i.id import_id,i.import_no,i.container_no,i.actual_arrival,i.invoice_currency,s.name supplier FROM pink_salt_import_items x
 JOIN pink_salt_imports i ON i.id=x.import_id LEFT JOIN pink_salt_suppliers s ON s.id=i.supplier_id AND s.business_unit_id=i.business_unit_id
 WHERE %WHERE% ORDER BY i.id DESC,x.id LIMIT ? OFFSET ?)
 SELECT c.*,COALESCE((SELECT SUM(m.quantity_kg) FROM pink_salt_raw_stock_movements m WHERE m.import_item_id=c.id),0) available_kg,
 COALESCE(c.receiving_unit_cost_krw,CASE WHEN c.received_weight_kg>0 THEN c.landed_cost_krw/c.received_weight_kg ELSE 0 END) landed_cost_per_kg
 FROM chosen c ORDER BY c.import_id DESC,c.id`;
async function stockPage(db, bu, query = {}) {const search = String(query.search || '').trim().slice(0, 100),where = ["i.business_unit_id=?", "i.status='Received'"],a = [bu];
  if (search) {where.push('(x.salt_grade LIKE ? OR x.specification LIKE ? OR x.storage_location LIKE ? OR i.import_no LIKE ? OR i.container_no LIKE ?)');a.push(...Array(5).fill('%' + search + '%'));}
  const w = where.join(' AND '),total = (await db.prepare(`SELECT COUNT(*) n FROM pink_salt_import_items x JOIN pink_salt_imports i ON i.id=x.import_id WHERE ${w}`).get(...a)).n,pagination = paging(query, total);
  return { rows: await db.prepare(STOCK_PAGE_SQL.replace("%WHERE%", w)).all(...a, pagination.pageSize, (pagination.page - 1) * pagination.pageSize), pagination, summary: await db.prepare(STOCK_SUMMARY_SQL).get(bu) };
}
async function install({ app, db, auth, allow, currentUnit, enforceUnit }) {
  const getUnit = async (req, res) => {const pink = (await db.prepare("SELECT id FROM business_units WHERE lower(name) ILIKE '%pink%salt%' AND status!='Archived' ORDER BY id LIMIT 1").get())?.id;
    if (!pink) {await res.status(409).json({ error: 'Pink Salt business unit is not available.' });return null;}
    if (Number(currentUnit(req) || 0) !== Number(pink) || !enforceUnit(req, pink)) {await res.status(403).json({ error: "Select the Pink Salt business unit to use this workspace." });return null;}return Number(pink);};
  try {void 0;} catch (e) {console.warn('V30.50 stock read index:', e.message);}
  await app.get('/api/v350/pink-salt/raw-stock/page', auth, allow('inventory', 'purchases', 'dashboard', 'finance'), async (req, res) => {try {const bu = await getUnit(req, res);if (!bu) return;await res.json(await stockPage(db, bu, req.query));} catch (e) {console.warn('V30.50 raw stock page:', e.message);await res.status(500).json({ error: 'Could not load raw stock page.' });}});
}
module.exports = { install, stockPage, STOCK_SUMMARY_SQL, STOCK_PAGE_SQL };
