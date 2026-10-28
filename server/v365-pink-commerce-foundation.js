const __async = require("./postgres/collections"); // Blue Ocean Market V30.65.0 — Pink Salt operational + channel-agnostic commerce foundation.
const VERSION = '30.65.0';
async function install({ app, db, auth, allow, currentUnit, enforceUnit, audit }) {
  const num = (v) => Number(v || 0),text = (v) => String(v ?? '').trim();
  const hasCol = async (t, c) => (await db.columns(t)).some((x) => x.name === c);
  const addCol = async (t, c, d) => {if (!(await hasCol(t, c))) void 0;};
  const pinkUnit = async () => (await db.prepare("SELECT id FROM business_units WHERE lower(name) ILIKE '%pink%salt%' AND status!='Archived' ORDER BY id LIMIT 1").get())?.id || null;
  async function guard(req, res) {const bu = Number((await pinkUnit()) || 0),selected = Number(currentUnit(req) || 0);if (!bu) {await res.status(409).json({ error: 'Pink Salt business unit is not available.' });return null;}if (!selected || selected !== bu || !enforceUnit(req, bu)) {await res.status(403).json({ error: "Select the Pink Salt business unit to use this workspace." });return null;}return bu;}

  // Extend, never replace, the proven Pink Salt product/order/customer model.
  await addCol('pink_salt_products', 'content_language', "TEXT DEFAULT NULL");
  await addCol('pink_salt_products', 'commerce_language', "TEXT DEFAULT 'auto'");
  await addCol('pink_salt_products', 'name_en', "TEXT DEFAULT ''");
  await addCol('pink_salt_products', 'name_ko', "TEXT DEFAULT ''");
  await addCol('pink_salt_products', 'product_family', "TEXT DEFAULT ''");
  await addCol('pink_salt_products', 'variant_label', "TEXT DEFAULT ''");
  await addCol('pink_salt_products', 'product_category', "TEXT DEFAULT 'Pink Salt'");
  await addCol('pink_salt_products', 'grind_mesh', "TEXT DEFAULT ''");
  await addCol('pink_salt_products', 'unit_of_measure', "TEXT DEFAULT 'unit'");
  await addCol('pink_salt_products', 'barcode', "TEXT DEFAULT ''");
  await addCol('pink_salt_products', 'sellable', 'INTEGER NOT NULL DEFAULT 1');
  await addCol('pink_salt_products', 'shelf_life_days', 'INTEGER NOT NULL DEFAULT 0');
  await addCol('pink_salt_products', 'origin_country', "TEXT DEFAULT ''");
  await addCol('pink_salt_products', 'ingredients_en', "TEXT DEFAULT ''");
  await addCol('pink_salt_products', 'ingredients_ko', "TEXT DEFAULT ''");
  await addCol('pink_salt_products', 'storage_instructions_en', "TEXT DEFAULT ''");
  await addCol('pink_salt_products', 'storage_instructions_ko', "TEXT DEFAULT ''");
  await addCol('pink_salt_products', 'website_ready', 'INTEGER NOT NULL DEFAULT 0');
  await addCol('pink_salt_production_batches', 'lot_no', "TEXT DEFAULT ''");
  await addCol('pink_salt_production_batches', 'best_before_date', 'TEXT');
  await addCol('pink_salt_orders', 'source_channel_id', 'INTEGER');
  await addCol('pink_salt_orders', 'external_order_id', "TEXT DEFAULT ''");
  await addCol('pink_salt_orders', 'fulfillment_status', "TEXT DEFAULT 'Unfulfilled'");
  await addCol('pink_salt_orders', 'external_payment_reference', "TEXT DEFAULT ''");
  await addCol('pink_salt_orders', 'external_shipment_reference', "TEXT DEFAULT ''");
  await addCol('pink_salt_orders', 'external_settlement_reference', "TEXT DEFAULT ''");

  void 0;
























































































































  const bu = Number((await pinkUnit()) || 0);
  if (bu) {
    await db.prepare("UPDATE pink_salt_products SET name_en=CASE WHEN trim(COALESCE(name_en,''))='' THEN name ELSE name_en END, product_category=CASE WHEN trim(COALESCE(product_category,''))='' THEN 'Pink Salt' ELSE product_category END WHERE business_unit_id=? AND COALESCE(content_language,'')<>'ko'").run(bu);
    const internal = await db.prepare("SELECT id FROM commerce_channels WHERE business_unit_id=? AND system_key='internal'").get(bu);
    if (!internal) await db.prepare("INSERT INTO commerce_channels(business_unit_id,name,channel_type,integration_mode,currency,active,system_key,notes) VALUES(?,?,'Internal','Manual','KRW',1,'internal',?)").run(bu, 'Internal Sales', 'Built-in Blue Ocean operational sales channel.');
    const retail = await db.prepare("SELECT id FROM commerce_price_lists WHERE business_unit_id=? AND name='Retail'").get(bu);
    if (!retail) await db.prepare("INSERT INTO commerce_price_lists(business_unit_id,name,currency,purpose,active) VALUES(?,'Retail','KRW','Default retail/channel pricing foundation',1)").run(bu);
  }

  async function stock(productId) {
    const on = num((await db.prepare("SELECT COALESCE(SUM(quantity_units),0) q FROM pink_salt_finished_stock_movements WHERE product_id=?").get(productId))?.q);
    const reserved = num((await db.prepare("SELECT COALESCE(SUM(oi.quantity_units),0) q FROM pink_salt_order_items oi JOIN pink_salt_orders o ON o.id=oi.order_id WHERE oi.product_id=? AND o.status='Reserved'").get(productId))?.q);
    return { on_hand_units: on, reserved_units: reserved, available_to_sell_units: Math.max(0, on - reserved) };
  }

  await app.get('/api/commerce/foundation-v365', auth, allow('sales', 'inventory', 'dashboard', 'purchases', 'finance'), async (req, res) => {
    const b = await guard(req, res);if (!b) return;
    const channels = await db.prepare("SELECT * FROM commerce_channels WHERE business_unit_id=? ORDER BY active DESC,name").all(b);
    const priceLists = await db.prepare("SELECT * FROM commerce_price_lists WHERE business_unit_id=? ORDER BY active DESC,name").all(b);
    const products = await __async.map(await db.prepare(`SELECT p.*,
      (SELECT COUNT(*) FROM commerce_product_channels pc WHERE pc.product_id=p.id AND pc.enabled=1) enabled_channels,
      (SELECT COUNT(*) FROM commerce_product_channels pc WHERE pc.product_id=p.id) configured_channels
      FROM pink_salt_products p WHERE p.business_unit_id=? ORDER BY p.active DESC,p.name,p.sku`).all(b), async (p) => ({ ...p, ...(await stock(p.id)), display_content: require('./product-content').resolveContent(p) }));
    const mappings = await db.prepare(`SELECT pc.*,c.name channel_name,c.channel_type,c.integration_mode,pl.name price_list_name
      FROM commerce_product_channels pc JOIN commerce_channels c ON c.id=pc.channel_id
      LEFT JOIN commerce_price_lists pl ON pl.id=pc.price_list_id
      WHERE pc.business_unit_id=? ORDER BY c.name,pc.product_id`).all(b);
    await res.json({ version: VERSION, channels, price_lists: priceLists, products, mappings });
  });

  await app.post('/api/commerce/channels-v365', auth, allow('sales', 'inventory'), async (req, res) => {
    const b = await guard(req, res);if (!b) return;const name = text(req.body.name);if (!name) return await res.status(400).json({ error: 'Channel name is required.' });
    const type = text(req.body.channel_type) || 'Other',mode = text(req.body.integration_mode) || 'Manual';
    if (!['Own Website', 'Marketplace', 'Social Commerce', 'B2B Portal', 'Internal', 'Other'].includes(type)) return await res.status(400).json({ error: 'Invalid channel type.' });
    if (!['Manual', 'API', 'File Import / Export', 'Webhook', 'Connector Pending'].includes(mode)) return await res.status(400).json({ error: 'Invalid integration mode.' });
    try {const r = await db.prepare("INSERT INTO commerce_channels(business_unit_id,name,channel_type,integration_mode,currency,active,notes,created_by) VALUES(?,?,?,?,?,?,?,?)").run(b, name, type, mode, text(req.body.currency) || 'KRW', req.body.active === false || String(req.body.active) === '0' ? 0 : 1, text(req.body.notes), req.user.id);await audit(req.user, 'commerce_channel', r.lastInsertRowid, 'create', JSON.stringify({ name, type, mode }));await res.json({ id: Number(r.lastInsertRowid) });} catch (e) {await res.status(409).json({ error: 'A commerce channel with this name already exists for Pink Salt.' });}
  });

  app.put('/api/commerce/channels-v365/:id', auth, allow('sales', 'inventory'), async (req, res) => {
    const b = await guard(req, res);if (!b) return;const x = await db.prepare("SELECT * FROM commerce_channels WHERE id=? AND business_unit_id=?").get(req.params.id, b);if (!x) return await res.status(404).json({ error: 'Commerce channel not found.' });if (x.system_key === 'internal' && req.body.active === false) return await res.status(409).json({ error: 'Internal Sales is a protected system channel.' });
    await db.prepare("UPDATE commerce_channels SET name=?,channel_type=?,integration_mode=?,currency=?,active=?,notes=?,updated_at=bom.utc_now() WHERE id=?").run(text(req.body.name) || x.name, text(req.body.channel_type) || x.channel_type, text(req.body.integration_mode) || x.integration_mode, text(req.body.currency) || x.currency, req.body.active === undefined ? x.active : req.body.active === false || String(req.body.active) === '0' ? 0 : 1, text(req.body.notes ?? x.notes), x.id);await audit(req.user, 'commerce_channel', x.id, "update", JSON.stringify(req.body));await res.json({ ok: true });
  });

  app.put('/api/commerce/products-v365/:productId/channel/:channelId', auth, allow('sales', 'inventory'), async (req, res) => {
    const b = await guard(req, res);if (!b) return;const p = await db.prepare("SELECT * FROM pink_salt_products WHERE id=? AND business_unit_id=?").get(req.params.productId, b),c = await db.prepare("SELECT * FROM commerce_channels WHERE id=? AND business_unit_id=?").get(req.params.channelId, b);if (!p || !c) return await res.status(404).json({ error: 'Product or channel not found.' });
    const enabled = req.body.enabled === true || String(req.body.enabled) === '1' || String(req.body.enabled).toLowerCase() === 'true';
    const mode = text(req.body.inventory_mode) || 'Shared';if (!['Shared', 'Allocated', 'Maximum Quantity'].includes(mode)) return await res.status(400).json({ error: 'Invalid inventory mode.' });
    const publication = enabled ? text(req.body.publication_status) || 'Ready' : 'Not Published';
    await db.prepare(`INSERT INTO commerce_product_channels(business_unit_id,product_id,channel_id,enabled,publication_status,external_product_id,external_variant_id,external_seller_sku,price_list_id,inventory_mode,allocated_units,safety_stock_units,max_sellable_units,sync_enabled,sync_status,created_by)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(product_id,channel_id) DO UPDATE SET enabled=excluded.enabled,publication_status=excluded.publication_status,external_product_id=excluded.external_product_id,external_variant_id=excluded.external_variant_id,external_seller_sku=excluded.external_seller_sku,price_list_id=excluded.price_list_id,inventory_mode=excluded.inventory_mode,allocated_units=excluded.allocated_units,safety_stock_units=excluded.safety_stock_units,max_sellable_units=excluded.max_sellable_units,sync_enabled=excluded.sync_enabled,sync_status=CASE WHEN excluded.sync_enabled=1 THEN 'Connector Pending' ELSE 'Manual' END,updated_at=bom.utc_now()`).
    run(b, p.id, c.id, enabled ? 1 : 0, publication, text(req.body.external_product_id), text(req.body.external_variant_id), text(req.body.external_seller_sku), num(req.body.price_list_id) || null, mode, Math.max(0, num(req.body.allocated_units)), Math.max(0, num(req.body.safety_stock_units)), req.body.max_sellable_units === '' || req.body.max_sellable_units == null ? null : Math.max(0, num(req.body.max_sellable_units)), req.body.sync_enabled ? 1 : 0, req.body.sync_enabled ? 'Connector Pending' : 'Manual', req.user.id);
    await db.prepare("UPDATE pink_salt_products SET website_ready=CASE WHEN EXISTS(SELECT 1 FROM commerce_product_channels pc JOIN commerce_channels cc ON cc.id=pc.channel_id WHERE pc.product_id=? AND pc.enabled=1 AND cc.channel_type='Own Website') THEN 1 ELSE 0 END,updated_at=bom.utc_now() WHERE id=?").run(p.id, p.id);
    await audit(req.user, 'commerce_product_channel', p.id, 'configure', JSON.stringify({ channel_id: c.id, channel: c.name, enabled, inventory_mode: mode }));await res.json({ ok: true, ...(await stock(p.id)) });
  });

  await app.get('/api/commerce/products-v365/:productId', auth, allow('sales', 'inventory', 'dashboard'), async (req, res) => {
    const b = await guard(req, res);if (!b) return;const p = await db.prepare("SELECT * FROM pink_salt_products WHERE id=? AND business_unit_id=?").get(req.params.productId, b);if (!p) return await res.status(404).json({ error: 'Product not found.' });const mappings = await db.prepare(`SELECT pc.*,c.name channel_name,c.channel_type,c.integration_mode,pl.name price_list_name FROM commerce_channels c LEFT JOIN commerce_product_channels pc ON pc.channel_id=c.id AND pc.product_id=? LEFT JOIN commerce_price_lists pl ON pl.id=pc.price_list_id WHERE c.business_unit_id=? ORDER BY c.active DESC,c.name`).all(p.id, b);await res.json({ product: { ...p, ...(await stock(p.id)), display_content: require('./product-content').resolveContent(p) }, mappings });
  });
}
module.exports = { install, VERSION };
