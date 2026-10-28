// Blue Ocean Market V30.67.0 — Pink Salt operational completion.
// True product-family/variant model, finished-lot FEFO traceability, customer/address completion,
// attention center, location balances and pricing hierarchy visibility. Additive/non-destructive.
const fs = require('fs'),path = require('path');
const storage = require('./runtime-storage');
const VERSION = '30.67.0';
async function install({ app, db, auth, allow, currentUnit, enforceUnit, audit, upload }) {
  const num = (v) => Number(v || 0),text = (v) => String(v ?? '').trim(),bool = (v) => v === true || v === 1 || ['true', '1', 'on', 'yes'].includes(String(v || '').toLowerCase());
  const hasCol = async (t, c) => (await db.columns(t)).some((x) => x.name === c);
  const addCol = async (t, c, d) => {if (!(await hasCol(t, c))) void 0;};
  const pinkUnit = async () => (await db.prepare("SELECT id FROM business_units WHERE lower(name) ILIKE '%pink%salt%' AND status!='Archived' ORDER BY id LIMIT 1").get())?.id || null;
  async function guard(req, res) {const bu = Number((await pinkUnit()) || 0),selected = Number(currentUnit(req) || 0);if (!bu) {await res.status(409).json({ error: 'Pink Salt business unit is not available.' });return null;}if (!selected || selected !== bu || !enforceUnit(req, bu)) {await res.status(403).json({ error: "Select the Pink Salt business unit to use this workspace." });return null;}return bu;}

  await addCol('pink_salt_products', 'family_id', 'INTEGER');
  await addCol('pink_salt_products', 'variant_code', "TEXT DEFAULT ''");
  await addCol('pink_salt_products', 'variant_sort_order', 'INTEGER NOT NULL DEFAULT 0');
  await addCol('pink_salt_customers', 'customer_kind', "TEXT DEFAULT 'Business'");
  await addCol('pink_salt_customer_addresses', 'label', "TEXT DEFAULT ''");
  await addCol('pink_salt_finished_stock_movements', 'lot_id', 'INTEGER');

  void 0;

































  async function ensureFamilies(bu) {
    const rows = await db.prepare("SELECT id,product_family,name_en,name,product_category FROM pink_salt_products WHERE business_unit_id=? AND trim(COALESCE(product_family,''))<>''").all(bu);
    const ins = db.prepare("INSERT INTO pink_salt_product_families(business_unit_id,name_en,category,active) VALUES(?,?,?,1) ON CONFLICT DO NOTHING");
    for (const p of rows) {await ins.run(bu, text(p.product_family), text(p.product_category) || 'Pink Salt');const f = await db.prepare("SELECT id FROM pink_salt_product_families WHERE business_unit_id=? AND name_en=?").get(bu, text(p.product_family));if (f) await db.prepare("UPDATE pink_salt_products SET family_id=? WHERE id=? AND family_id IS NULL").run(f.id, p.id);}
  }
  async function syncLots(bu) {
    const rows = await db.prepare(`SELECT o.product_id,o.production_batch_id,SUM(o.quantity_units) quantity_units,CASE WHEN SUM(o.quantity_units)>0 THEN SUM(o.quantity_units*o.unit_cost_krw)/SUM(o.quantity_units) ELSE 0 END unit_cost_krw,b.batch_no,b.lot_no,b.production_date,b.best_before_date,b.status,p.default_location_id
      FROM pink_salt_production_outputs o JOIN pink_salt_production_batches b ON b.id=o.production_batch_id JOIN pink_salt_products p ON p.id=o.product_id
      WHERE b.business_unit_id=? AND b.status='Completed' GROUP BY o.product_id,o.production_batch_id,b.id,p.id`).all(bu);
    const up = db.prepare(`INSERT INTO pink_salt_finished_lots(business_unit_id,product_id,production_batch_id,lot_no,production_date,best_before_date,produced_units,unit_cost_krw,location_id,quality_status,active)
      VALUES(?,?,?,?,?,?,?,?,?,'Released',1) ON CONFLICT(product_id,production_batch_id,lot_no) DO UPDATE SET production_date=excluded.production_date,best_before_date=excluded.best_before_date,produced_units=excluded.produced_units,unit_cost_krw=excluded.unit_cost_krw,location_id=COALESCE(pink_salt_finished_lots.location_id,excluded.location_id),updated_at=bom.utc_now()`);
    for (const r of rows) await up.run(bu, r.product_id, r.production_batch_id, text(r.lot_no) || text(r.batch_no) || `BATCH-${r.production_batch_id}`, r.production_date || null, r.best_before_date || null, num(r.quantity_units), num(r.unit_cost_krw), r.default_location_id || null);
  }
  async function lotAvailable(lotId, excludeOrder = 0) {const lot = await db.prepare("SELECT produced_units FROM pink_salt_finished_lots WHERE id=?").get(lotId);if (!lot) return 0;const used = await db.prepare("SELECT COALESCE(SUM(quantity_units),0) q FROM pink_salt_finished_lot_allocations WHERE lot_id=? AND order_id<>?").get(lotId, Number(excludeOrder || 0));return Math.max(0, num(lot.produced_units) - num(used?.q));}
  async function reconcileOrderLots(orderId) {
    const o = await db.prepare("SELECT * FROM pink_salt_orders WHERE id=?").get(Number(orderId));if (!o) return { ok: false };await syncLots(o.business_unit_id);
    await db.atomic(async () => {
      await db.prepare("DELETE FROM pink_salt_finished_lot_allocations WHERE order_id=?").run(o.id);
      if (o.status !== 'Completed') return;
      const items = await db.prepare("SELECT * FROM pink_salt_order_items WHERE order_id=? ORDER BY id").all(o.id);
      const ins = db.prepare("INSERT INTO pink_salt_finished_lot_allocations(business_unit_id,order_id,order_item_id,product_id,lot_id,quantity_units,allocation_method) VALUES(?,?,?,?,?,?,?)");
      for (const it of items) {let need = num(it.quantity_units);const lots = await db.prepare(`SELECT l.*,COALESCE((SELECT SUM(a.quantity_units) FROM pink_salt_finished_lot_allocations a WHERE a.lot_id=l.id),0) allocated FROM pink_salt_finished_lots l WHERE l.business_unit_id=? AND l.product_id=? AND l.active=1 AND l.quality_status='Released' ORDER BY CASE WHEN l.best_before_date IS NULL OR l.best_before_date='' THEN 1 ELSE 0 END,l.best_before_date,l.production_date,l.id`).all(o.business_unit_id, it.product_id);
        for (const l of lots) {const free = Math.max(0, num(l.produced_units) - num(l.allocated));if (free <= 0) continue;const take = Math.min(need, free);if (take > 0) {await ins.run(o.business_unit_id, o.id, it.id, it.product_id, l.id, take, 'FEFO');need -= take;}if (need <= 1e-6) break;}
        if (need > 1e-6) {const fallback = await db.prepare(`SELECT id,produced_units FROM pink_salt_finished_lots WHERE business_unit_id=? AND product_id=? AND lot_no=?`).get(o.business_unit_id, it.product_id, 'LEGACY-UNTRACKED');let lid = fallback?.id;if (!lid) lid = Number((await db.prepare(`INSERT INTO pink_salt_finished_lots(business_unit_id,product_id,lot_no,produced_units,quality_status,active) VALUES(?,?,?,?,?,1)`).run(o.business_unit_id, it.product_id, 'LEGACY-UNTRACKED', need, 'Legacy / Untracked')).lastInsertRowid);else {const already = num((await db.prepare("SELECT COALESCE(SUM(quantity_units),0) q FROM pink_salt_finished_lot_allocations WHERE lot_id=?").get(lid))?.q);if (num(fallback.produced_units) < already + need) await db.prepare("UPDATE pink_salt_finished_lots SET produced_units=?,updated_at=bom.utc_now() WHERE id=?").run(already + need, lid);}await ins.run(o.business_unit_id, o.id, it.id, it.product_id, lid, need, 'Legacy Fallback');}
      }
    })();return { ok: true };
  }
  const bu = Number((await pinkUnit()) || 0);if (bu) {await ensureFamilies(bu);await syncLots(bu);for (const o of await db.prepare("SELECT id FROM pink_salt_orders WHERE business_unit_id=? AND status='Completed' ORDER BY id").all(bu)) try {await reconcileOrderLots(o.id);} catch (_) {}}
  global.__bomV367PinkLots = { reconcileOrderLots, syncLots };

  // Optional server paging keeps legacy collection callers compatible.
  function pageQuery(req, alias, fields) {
    const paged = req.query.page !== undefined,page = Math.max(1, Math.floor(Number(req.query.page) || 1)),size = [25, 50, 100].includes(Number(req.query.pageSize)) ? Number(req.query.pageSize) : 25;
    const filters = [],args = [],search = text(req.query.search).slice(0, 100);
    if (search) {filters.push('(' + fields.map((f) => `COALESCE(${f},'') LIKE ?`).join(' OR ') + ')');args.push(...fields.map(() => '%' + search + '%'));}
    if (req.query.id) {filters.push(alias + '.id=?');args.push(Number(req.query.id));}
    return { paged, page, size, filters, args };
  }
  function pagedResult(rows, total, q) {const pages = Math.max(1, Math.ceil(total / q.size));return { rows, pagination: { page: q.page, pageSize: q.size, pages, total, from: total ? (q.page - 1) * q.size + 1 : 0, to: Math.min(q.page * q.size, total) } };}
  await app.get('/api/v367/pink-salt/families', auth, allow('inventory', 'sales', 'dashboard'), async (req, res) => {const b = await guard(req, res);if (!b) return;await ensureFamilies(b);
    const q = pageQuery(req, 'f', ['f.family_code', 'f.name_en', 'f.name_ko', 'f.category']);
    if (['Active', 'Archived'].includes(req.query.status)) {q.filters.push('f.active=?');q.args.push(req.query.status === 'Active' ? 1 : 0);}
    const where = 'f.business_unit_id=?' + q.filters.map((f) => ' AND ' + f).join(''),args = [b, ...q.args],total = (await db.prepare("SELECT COUNT(*) n FROM pink_salt_product_families f WHERE " + where).get(...args)).n;
    if (q.paged) q.page = Math.min(q.page, Math.max(1, Math.ceil(total / q.size)));
    const rows = await db.prepare(`SELECT f.*,(SELECT COUNT(*) FROM pink_salt_products p WHERE p.family_id=f.id AND p.active=1) variant_count,(SELECT COUNT(*) FROM pink_salt_products p WHERE p.family_id=f.id) dependency_count,(SELECT COUNT(*) FROM pink_salt_product_family_images i WHERE i.family_id=f.id) image_dependencies FROM pink_salt_product_families f WHERE ${where} ORDER BY f.active DESC,f.name_en,f.id${q.paged ? ' LIMIT ? OFFSET ?' : ''}`).all(...args, ...(q.paged ? [q.size, (q.page - 1) * q.size] : []));
    for (const f of rows) f.variants = await db.prepare("SELECT id,sku,name,name_en,name_ko,variant_label,variant_code,pack_weight_g,barcode,active FROM pink_salt_products WHERE family_id=? ORDER BY variant_sort_order,name,sku").all(f.id);
    await res.json(q.paged ? pagedResult(rows, total, q) : rows);
  });
  app.delete('/api/v367/pink-salt/families/:id', auth, allow('inventory', 'sales'), async (req, res) => {const b = await guard(req, res);if (!b) return;const f = await db.prepare("SELECT * FROM pink_salt_product_families WHERE id=? AND business_unit_id=?").get(req.params.id, b);if (!f) return await res.status(404).json({ error: 'Product family not found.' });
    try {await db.atomic(async () => {if ((await db.prepare("SELECT 1 FROM pink_salt_products WHERE family_id=? LIMIT 1").get(f.id)) || (await db.prepare("SELECT 1 FROM pink_salt_product_family_images WHERE family_id=? LIMIT 1").get(f.id))) throw new Error('This family has linked records. Archive it instead.');await db.prepare("DELETE FROM pink_salt_product_families WHERE id=?").run(f.id);await audit(req.user, 'pink_salt_product_family', f.id, "delete-unused-v36938", JSON.stringify(f));})();await res.json({ ok: true });} catch (e) {await res.status(409).json({ error: e.message });}
  });
  await app.post('/api/v367/pink-salt/families', auth, allow('inventory', 'sales'), async (req, res) => {const b = await guard(req, res);if (!b) return;const name = text(req.body.name_en);if (!name) return await res.status(400).json({ error: 'Product family English name is required.' });try {const r = await db.prepare("INSERT INTO pink_salt_product_families(business_unit_id,family_code,name_en,name_ko,category,short_description_en,short_description_ko,active,created_by) VALUES(?,?,?,?,?,?,?,?,?)").run(b, text(req.body.family_code), name, text(req.body.name_ko), text(req.body.category) || 'Pink Salt', text(req.body.short_description_en), text(req.body.short_description_ko), req.body.active === false ? 0 : 1, req.user.id);await audit(req.user, 'pink_salt_product_family', r.lastInsertRowid, 'create-v367', name);await res.json({ id: Number(r.lastInsertRowid) });} catch (e) {await res.status(409).json({ error: 'A product family with this name already exists.' });}});
  app.put('/api/v367/pink-salt/families/:id', auth, allow('inventory', 'sales'), async (req, res) => {const b = await guard(req, res);if (!b) return;const f = await db.prepare("SELECT * FROM pink_salt_product_families WHERE id=? AND business_unit_id=?").get(req.params.id, b);if (!f) return await res.status(404).json({ error: 'Product family not found.' });await db.prepare("UPDATE pink_salt_product_families SET family_code=?,name_en=?,name_ko=?,category=?,short_description_en=?,short_description_ko=?,active=?,updated_at=bom.utc_now() WHERE id=?").run(text(req.body.family_code ?? f.family_code), text(req.body.name_en) || f.name_en, text(req.body.name_ko ?? f.name_ko), text(req.body.category ?? f.category) || 'Pink Salt', text(req.body.short_description_en ?? f.short_description_en), text(req.body.short_description_ko ?? f.short_description_ko), req.body.active === undefined ? f.active : bool(req.body.active) ? 1 : 0, f.id);await audit(req.user, 'pink_salt_product_family', f.id, "update-v36938", JSON.stringify({ before: f, after: await db.prepare("SELECT * FROM pink_salt_product_families WHERE id=?").get(f.id) }));await res.json({ ok: true });});
  app.put('/api/v367/pink-salt/products/:id/variant', auth, allow('inventory', 'sales'), async (req, res) => {const b = await guard(req, res);if (!b) return;const p = await db.prepare("SELECT * FROM pink_salt_products WHERE id=? AND business_unit_id=?").get(req.params.id, b);if (!p) return await res.status(404).json({ error: 'Product variant not found.' });const fid = Number(req.body.family_id || 0) || null;if (fid && !(await db.prepare("SELECT id FROM pink_salt_product_families WHERE id=? AND business_unit_id=?").get(fid, b))) return await res.status(400).json({ error: 'Invalid product family.' });const familyName = fid ? (await db.prepare("SELECT name_en FROM pink_salt_product_families WHERE id=?").get(fid))?.name_en || '' : '';await db.prepare("UPDATE pink_salt_products SET family_id=?,product_family=?,variant_label=?,variant_code=?,variant_sort_order=?,updated_at=bom.utc_now() WHERE id=?").run(fid, familyName, text(req.body.variant_label), text(req.body.variant_code), Math.max(0, Math.trunc(num(req.body.variant_sort_order))), p.id);await audit(req.user, 'pink_salt_product', p.id, "variant-update-v367", JSON.stringify({ family_id: fid, variant_label: text(req.body.variant_label) }));await res.json({ ok: true });});

  await app.get('/api/v367/pink-salt/lots', auth, allow('inventory', 'sales', 'dashboard'), async (req, res) => {const b = await guard(req, res);if (!b) return;await syncLots(b);const q = pageQuery(req, 'l', ['p.sku', 'p.name', 'l.lot_no', 'p.variant_label']);
    if (['Released', 'Hold', 'Rejected', 'Legacy / Untracked'].includes(req.query.status)) {q.filters.push('l.quality_status=?');q.args.push(req.query.status);}
    if (req.query.product_id) {q.filters.push('l.product_id=?');q.args.push(Number(req.query.product_id));}
    const today = new Date().toISOString().slice(0, 10),soon = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
    if (req.query.filter === 'expired') {q.filters.push("l.best_before_date<>'' AND l.best_before_date<?");q.args.push(today);}
    if (req.query.filter === 'soon') {q.filters.push('l.best_before_date BETWEEN ? AND ?');q.args.push(today, soon);}
    const where = 'l.business_unit_id=? AND l.active=1' + q.filters.map((f) => ' AND ' + f).join(''),args = [b, ...q.args],join = " FROM pink_salt_finished_lots l JOIN pink_salt_products p ON p.id=l.product_id LEFT JOIN pink_salt_storage_locations sl ON sl.id=l.location_id",total = (await db.prepare("SELECT COUNT(*) n" + join + " WHERE " + where).get(...args)).n;
    if (q.paged) q.page = Math.min(q.page, Math.max(1, Math.ceil(total / q.size)));
    const rows = (await db.prepare(`SELECT l.*,p.sku,p.name,p.name_en,p.name_ko,p.variant_label,sl.warehouse,sl.zone,sl.rack_bin,pb.batch_no,COALESCE((SELECT SUM(a.quantity_units) FROM pink_salt_finished_lot_allocations a WHERE a.lot_id=l.id),0) allocated_units${join} LEFT JOIN pink_salt_production_batches pb ON pb.id=l.production_batch_id WHERE ${where} ORDER BY CASE WHEN l.best_before_date IS NULL OR l.best_before_date='' THEN 1 ELSE 0 END,l.best_before_date,l.production_date,l.id${q.paged ? ' LIMIT ? OFFSET ?' : ''}`).all(...args, ...(q.paged ? [q.size, (q.page - 1) * q.size] : []))).map((x) => ({ ...x, available_units: Math.max(0, num(x.produced_units) - num(x.allocated_units)) }));await res.json(q.paged ? pagedResult(rows, total, q) : rows);
  });
  app.put('/api/v367/pink-salt/lots/:id', auth, allow('inventory'), async (req, res) => {const b = await guard(req, res);if (!b) return;const l = await db.prepare("SELECT * FROM pink_salt_finished_lots WHERE id=? AND business_unit_id=?").get(req.params.id, b);if (!l) return await res.status(404).json({ error: 'Finished lot not found.' });const q = text(req.body.quality_status || l.quality_status);if (!['Released', 'Hold', 'Rejected', 'Legacy / Untracked'].includes(q)) return await res.status(400).json({ error: 'Invalid quality status.' });const loc = req.body.location_id === undefined ? l.location_id : Number(req.body.location_id) || null;if (loc && !(await db.prepare("SELECT 1 FROM pink_salt_storage_locations WHERE id=? AND business_unit_id=? AND active=1").get(loc, b))) return await res.status(400).json({ error: 'Invalid Pink Salt storage location.' });const expiry = req.body.best_before_date === undefined ? l.best_before_date : text(req.body.best_before_date) || null;if (expiry && !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) return await res.status(400).json({ error: 'Invalid best before date.' });await db.prepare("UPDATE pink_salt_finished_lots SET best_before_date=?,location_id=?,quality_status=?,updated_at=bom.utc_now() WHERE id=?").run(expiry, loc, q, l.id);await audit(req.user, 'pink_salt_finished_lot', l.id, "update-v367", JSON.stringify({ quality_status: q }));await res.json({ ok: true });});
  await app.post('/api/v367/pink-salt/orders/:id/reconcile-lots', auth, allow('sales', 'inventory'), async (req, res) => {const b = await guard(req, res);if (!b) return;const o = await db.prepare("SELECT id FROM pink_salt_orders WHERE id=? AND business_unit_id=?").get(req.params.id, b);if (!o) return await res.status(404).json({ error: 'Order not found.' });await res.json(await reconcileOrderLots(o.id));});
  await app.get('/api/v367/pink-salt/orders/:id/trace', auth, allow('sales', 'inventory', 'dashboard'), async (req, res) => {const b = await guard(req, res);if (!b) return;const o = await db.prepare("SELECT * FROM pink_salt_orders WHERE id=? AND business_unit_id=?").get(req.params.id, b);if (!o) return await res.status(404).json({ error: 'Order not found.' });await reconcileOrderLots(o.id);const rows = await db.prepare(`SELECT a.quantity_units,a.allocation_method,p.sku,p.name,p.variant_label,l.lot_no,l.production_date,l.best_before_date,l.quality_status,pb.batch_no,
      (SELECT STRING_AGG(DISTINCT (im.import_no||' / '||ii.salt_grade)::text,',') FROM pink_salt_production_inputs pi JOIN pink_salt_import_items ii ON ii.id=pi.import_item_id JOIN pink_salt_imports im ON im.id=ii.import_id WHERE pi.production_batch_id=l.production_batch_id) raw_sources
      FROM pink_salt_finished_lot_allocations a JOIN pink_salt_finished_lots l ON l.id=a.lot_id JOIN pink_salt_products p ON p.id=a.product_id LEFT JOIN pink_salt_production_batches pb ON pb.id=l.production_batch_id WHERE a.order_id=? ORDER BY p.sku,l.best_before_date,l.id`).all(o.id);await res.json({ order: o, lots: rows });});

  app.put('/api/v367/pink-salt/customers/:id/kind', auth, allow('sales'), async (req, res) => {const b = await guard(req, res);if (!b) return;const c = await db.prepare("SELECT * FROM pink_salt_customers WHERE id=? AND business_unit_id=?").get(req.params.id, b);if (!c) return await res.status(404).json({ error: 'Customer not found.' });const k = text(req.body.customer_kind) || 'Business';if (!['Individual', 'Store', 'Wholesale', 'Distributor', 'Business', 'Other'].includes(k)) return await res.status(400).json({ error: 'Invalid customer type.' });await db.prepare("UPDATE pink_salt_customers SET customer_kind=?,updated_at=bom.utc_now() WHERE id=?").run(k, c.id);await res.json({ ok: true });});
  app.put('/api/v367/pink-salt/customers/:customerId/addresses/:id', auth, allow('sales'), async (req, res) => {const b = await guard(req, res);if (!b) return;const a = await db.prepare(`SELECT a.* FROM pink_salt_customer_addresses a JOIN pink_salt_customers c ON c.id=a.customer_id WHERE a.id=? AND a.customer_id=? AND c.business_unit_id=?`).get(req.params.id, req.params.customerId, b);if (!a) return await res.status(404).json({ error: 'Customer address not found.' });const primary = bool(req.body.is_default);await db.atomic(async () => {if (primary) await db.prepare("UPDATE pink_salt_customer_addresses SET is_default=0 WHERE customer_id=?").run(a.customer_id);await db.prepare(`UPDATE pink_salt_customer_addresses SET address_type=?,label=?,recipient_name=?,phone=?,address_line1=?,address_line2=?,city=?,region=?,postal_code=?,country=?,is_default=?,updated_at=bom.utc_now() WHERE id=?`).run(text(req.body.address_type) || a.address_type, text(req.body.label), text(req.body.recipient_name), text(req.body.phone), text(req.body.address_line1), text(req.body.address_line2), text(req.body.city), text(req.body.region), text(req.body.postal_code), text(req.body.country), primary ? 1 : 0, a.id);})();await res.json({ ok: true });});
  await app.post('/api/v367/pink-salt/customers/:customerId/addresses/:id/default', auth, allow('sales'), async (req, res) => {const b = await guard(req, res);if (!b) return;const a = await db.prepare(`SELECT a.* FROM pink_salt_customer_addresses a JOIN pink_salt_customers c ON c.id=a.customer_id WHERE a.id=? AND a.customer_id=? AND c.business_unit_id=? AND a.active=1`).get(req.params.id, req.params.customerId, b);if (!a) return await res.status(404).json({ error: 'Customer address not found.' });await db.atomic(async () => {await db.prepare("UPDATE pink_salt_customer_addresses SET is_default=0 WHERE customer_id=?").run(a.customer_id);await db.prepare("UPDATE pink_salt_customer_addresses SET is_default=1,updated_at=bom.utc_now() WHERE id=?").run(a.id);})();await res.json({ ok: true });});

  await app.get('/api/v367/pink-salt/attention', auth, allow('dashboard', 'inventory', 'sales', 'purchases', 'finance'), async (req, res) => {const b = await guard(req, res);if (!b) return;await syncLots(b);const today = new Date().toISOString().slice(0, 10),soon = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);const lowProducts = await db.prepare(`SELECT p.id,p.sku,p.name,p.reorder_level_units,COALESCE(SUM(m.quantity_units),0) on_hand FROM pink_salt_products p LEFT JOIN pink_salt_finished_stock_movements m ON m.product_id=p.id WHERE p.business_unit_id=? AND p.active=1 GROUP BY p.id HAVING p.reorder_level_units>0 AND COALESCE(SUM(m.quantity_units),0)<=p.reorder_level_units ORDER BY on_hand`).all(b);const lowPackaging = await db.prepare(`SELECT p.id,p.sku,p.name,p.reorder_level,COALESCE(SUM(m.quantity),0) available FROM pink_salt_packaging_items p LEFT JOIN pink_salt_packaging_movements m ON m.packaging_item_id=p.id WHERE p.business_unit_id=? AND p.active=1 GROUP BY p.id HAVING p.reorder_level>0 AND COALESCE(SUM(m.quantity),0)<=p.reorder_level ORDER BY available`).all(b);const expiring = await db.prepare(`SELECT l.id,l.lot_no,l.best_before_date,p.sku,p.name,l.produced_units-COALESCE((SELECT SUM(a.quantity_units) FROM pink_salt_finished_lot_allocations a WHERE a.lot_id=l.id),0) available_units FROM pink_salt_finished_lots l JOIN pink_salt_products p ON p.id=l.product_id WHERE l.business_unit_id=? AND l.active=1 AND l.best_before_date IS NOT NULL AND l.best_before_date<>'' AND l.best_before_date<=? AND l.produced_units>COALESCE((SELECT SUM(a.quantity_units) FROM pink_salt_finished_lot_allocations a WHERE a.lot_id=l.id),0) ORDER BY l.best_before_date`).all(b, soon);const openOrders = (await db.prepare("SELECT COUNT(*) n FROM pink_salt_orders WHERE business_unit_id=? AND status='Reserved'").get(b)).n;const overdue = await db.prepare("SELECT COUNT(*) n,COALESCE(SUM(total_krw),0) gross FROM pink_salt_orders WHERE business_unit_id=? AND status='Completed' AND due_date<?").get(b, today);await res.json({ low_products: lowProducts, low_packaging: lowPackaging, expiring_lots: expiring, open_orders: Number(openOrders || 0), overdue_orders: Number(overdue?.n || 0), as_of: today });});
  await app.get('/api/v367/pink-salt/location-balances', auth, allow('inventory', 'dashboard'), async (req, res) => {const b = await guard(req, res);if (!b) return;await syncLots(b);const rows = await db.prepare(`SELECT l.location_id,sl.warehouse,sl.zone,sl.rack_bin,p.id product_id,p.sku,p.name,SUM(l.produced_units-COALESCE((SELECT SUM(a.quantity_units) FROM pink_salt_finished_lot_allocations a WHERE a.lot_id=l.id),0)) available_units FROM pink_salt_finished_lots l JOIN pink_salt_products p ON p.id=l.product_id LEFT JOIN pink_salt_storage_locations sl ON sl.id=l.location_id WHERE l.business_unit_id=? AND l.active=1 GROUP BY l.location_id,sl.id,p.id HAVING SUM(l.produced_units-COALESCE((SELECT SUM(a.quantity_units) FROM pink_salt_finished_lot_allocations a WHERE a.lot_id=l.id),0))>0 ORDER BY sl.warehouse,sl.zone,sl.rack_bin,p.sku`).all(b);await res.json(rows);});
  await app.get('/api/v367/pink-salt/pricing-hierarchy/:productId', auth, allow('sales', 'dashboard'), async (req, res) => {const b = await guard(req, res);if (!b) return;const p = await db.prepare("SELECT * FROM pink_salt_products WHERE id=? AND business_unit_id=?").get(req.params.productId, b);if (!p) return await res.status(404).json({ error: 'Product not found.' });const lists = await db.prepare(`SELECT pl.id,pl.name,pl.currency,i.unit_price,i.min_quantity,i.effective_from,i.effective_to FROM commerce_price_list_items i JOIN commerce_price_lists pl ON pl.id=i.price_list_id WHERE i.product_id=? AND i.active=1 AND pl.active=1 ORDER BY pl.name,i.min_quantity`).all(p.id);const customerPrices = await db.prepare(`SELECT cp.id,c.name customer,cp.unit_price_krw,cp.min_quantity,cp.effective_from,cp.effective_to FROM pink_salt_customer_prices cp JOIN pink_salt_customers c ON c.id=cp.customer_id WHERE cp.product_id=? AND cp.active=1 ORDER BY c.name,cp.min_quantity`).all(p.id);await res.json({ product: { id: p.id, sku: p.sku, name: p.name, default_price_krw: p.selling_price_krw }, price_lists: lists, customer_prices: customerPrices, hierarchy: ['Product Default', 'Price List / Tier', 'Customer-specific price', 'Manual override with required reason'] });});

  console.info('Blue Ocean Market V30.67.0 Pink Salt operational completion installed');
}
module.exports = { install };
