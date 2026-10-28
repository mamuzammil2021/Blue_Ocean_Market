const VERSION = '30.10.0';

async function install({ app, db, auth, allow, currentUnit, enforceUnit, audit, accounting }) {
  const ensureColumn = async (table, column, ddl) => {try {const cols = (await db.columns(table)).map((x) => x.name);if (!cols.includes(column)) void 0;} catch (e) {console.error('V30.2 migration', table, column, e.message);}};
  await ensureColumn('finance_entries', 'finance_role', "TEXT DEFAULT ''");
  await ensureColumn('finance_entries', 'cash_effect', 'INTEGER DEFAULT 0');
  await ensureColumn('finance_entries', 'source_key', "TEXT DEFAULT ''");
  await ensureColumn('pink_salt_import_payments', 'status', "TEXT DEFAULT 'Active'");
  await ensureColumn('pink_salt_import_payments', 'void_reason', "TEXT DEFAULT ''");
  await ensureColumn('pink_salt_import_payments', 'voided_by', 'INTEGER');
  await ensureColumn('pink_salt_import_payments', 'voided_at', 'TEXT');
  await ensureColumn('pink_salt_import_costs', 'status', "TEXT DEFAULT 'Active'");
  await ensureColumn('pink_salt_import_costs', 'void_reason', "TEXT DEFAULT ''");
  await ensureColumn('pink_salt_import_costs', 'voided_by', 'INTEGER');
  await ensureColumn('pink_salt_import_costs', 'voided_at', 'TEXT');
  await ensureColumn('pink_salt_packaging_movements', 'status', "TEXT DEFAULT 'Active'");
  await ensureColumn('pink_salt_packaging_movements', 'void_reason', "TEXT DEFAULT ''");
  await ensureColumn('pink_salt_packaging_movements', 'voided_by', 'INTEGER');
  await ensureColumn('pink_salt_packaging_movements', 'voided_at', 'TEXT');
  await ensureColumn('pink_salt_customer_payments', 'void_reason', "TEXT DEFAULT ''");
  await ensureColumn('pink_salt_customer_payments', 'voided_by', 'INTEGER');
  await ensureColumn('pink_salt_customer_payments', 'voided_at', 'TEXT');
  await ensureColumn('pink_salt_customer_refunds', 'void_reason', "TEXT DEFAULT ''");
  await ensureColumn('pink_salt_customer_refunds', 'voided_by', 'INTEGER');
  await ensureColumn('pink_salt_customer_refunds', 'voided_at', 'TEXT');

  function classify(row) {
    const st = String(row.source_type || ''),type = String(row.type || ''),cat = String(row.category || '');
    if (st === 'Pink Salt Supplier Advance') return { finance_role: 'Supplier Advance Payment', cash_effect: -1 };
    if (st === 'Pink Salt Supplier Advance Refund') return { finance_role: 'Supplier Advance Refund', cash_effect: 1 };
    if (st === 'Pink Salt Import Purchase') return { finance_role: 'Purchase / Payable', cash_effect: 0 };
    if (st === 'Pink Salt Import Payment') return { finance_role: 'Supplier Payment / Settlement', cash_effect: -1 };
    if (st === 'Pink Salt Import Cost') return { finance_role: 'Import Cost Payment', cash_effect: -1 };
    if (st === 'Pink Salt Packaging Purchase') return { finance_role: 'Packaging Purchase / Payable', cash_effect: 0 };
    if (st === 'Pink Salt Sale') return { finance_role: 'Sale / Revenue', cash_effect: 0 };
    if (st === 'Pink Salt Customer Payment') return { finance_role: 'Customer Receipt', cash_effect: 1 };
    if (st === 'Pink Salt Customer Refund') return { finance_role: 'Customer Refund', cash_effect: -1 };
    if (st === 'Pink Salt Platform Fee') return { finance_role: 'Marketplace Fee Payment', cash_effect: -1 };
    if (st === 'Pink Salt Waste') return { finance_role: 'Inventory Loss', cash_effect: 0 };
    if (st === 'Excavator Sale') return { finance_role: 'Sale / Revenue', cash_effect: 0 };
    if (st === 'Excavator Buyer Payment' || st === 'Buyer Payment') return { finance_role: 'Buyer Receipt', cash_effect: 1 };
    if (st === 'Excavator Buyer Refund') return { finance_role: 'Buyer Refund', cash_effect: -1 };
    if (st === 'Excavator Payment') return { finance_role: 'Machine Payment / Settlement', cash_effect: type === 'Revenue' ? 1 : -1 };
    if (st === 'Excavator Cost Transaction' && cat === 'Purchase') return { finance_role: 'Purchase / Payable', cash_effect: 0 };
    if (st.startsWith('Excavator ')) return { finance_role: type === 'Revenue' ? 'Revenue' : 'Machine Cost', cash_effect: type === 'Revenue' ? 0 : -1 };
    if (st === 'Purchase') return { finance_role: 'Purchase / Payable', cash_effect: 0 };
    if (st === 'Purchase Payment') return { finance_role: 'Supplier Payment / Settlement', cash_effect: -1 };
    if (st === 'Sale') return { finance_role: 'Sale / Revenue', cash_effect: 0 };
    if (st === 'Sale Payment' || st === 'MIMI Sale Payment') return { finance_role: 'Customer Receipt', cash_effect: 1 };
    if (st === 'Manual') return { finance_role: type === 'Revenue' ? 'Manual Income' : 'Manual Expense', cash_effect: type === 'Revenue' ? 1 : -1 };
    if (/payment|receipt|refund/i.test(st + ' ' + cat)) return { finance_role: /refund/i.test(st + ' ' + cat) ? 'Refund / Payment' : 'Payment / Settlement', cash_effect: /refund/i.test(st + ' ' + cat) ? -1 : type === 'Revenue' || type === 'Receipt' ? 1 : -1 };
    if (type === 'Revenue') return { finance_role: 'Revenue', cash_effect: 0 };
    if (type === 'Expense') return { finance_role: 'Expense', cash_effect: -1 };
    if (type === 'Inventory' || type === 'Inventory Cost') return { finance_role: 'Inventory / Cost', cash_effect: 0 };
    return { finance_role: type || 'Financial Record', cash_effect: 0 };
  }
  function keyFor(row) {return row?.source_type && row?.source_id != null && row.source_type !== 'Manual' ? `${Number(row.business_unit_id)}|${String(row.source_type)}|${Number(row.source_id)}` : '';}
  async function refreshClassifications() {
    const rows = await db.prepare("SELECT id,business_unit_id,type,category,payment_method,source_type,source_id FROM finance_entries WHERE status!='Voided'").all();
    const up = db.prepare("UPDATE finance_entries SET finance_role=?,cash_effect=?,source_key=? WHERE id=?");
    const tx = db.atomic(async () => {for (const r of rows) {const c = classify(r);await up.run(c.finance_role, c.cash_effect, keyFor(r), r.id);}});await tx();
  }
  async function consolidateDuplicates(unit = null) {
    const groups = await db.prepare("SELECT business_unit_id,source_type,source_id,COUNT(*) c FROM finance_entries WHERE status!='Voided' AND source_type IS NOT NULL AND source_type!='' AND source_type!='Manual' AND source_id IS NOT NULL AND (?::bigint IS NULL OR business_unit_id=?) GROUP BY business_unit_id,source_type,source_id HAVING COUNT(*)>1").all(unit, unit);
    // Detection only. Never consolidate or rewrite financial history at startup.
    return { groups: groups.length, voided: 0, review_required: groups.length > 0, duplicates: groups };
  }

  try {
    void 0;
    const startupKey = 'v30.39.2-v302-finance-integrity-bootstrap';
    if (!(await db.prepare("SELECT 1 FROM system_migrations WHERE migration_key=?").get(startupKey))) {
      const result = await consolidateDuplicates();await refreshClassifications();
      await db.prepare("INSERT INTO system_migrations(migration_key,applied_at,details) VALUES(?,bom.utc_now(),?) ON CONFLICT (migration_key) DO UPDATE SET applied_at=EXCLUDED.applied_at,details=EXCLUDED.details").run(startupKey, JSON.stringify(result));
    }
    void 0;
  } catch (e) {console.error('V30.2 finance integrity bootstrap:', e.message);}

  await app.get('/api/finance/integrity-v302', auth, allow('finance', 'dashboard'), async (req, res) => {
    let where = '1=1',args = [];const bu = currentUnit(req);if (bu) {where = 'business_unit_id=?';args = [Number(bu)];} else if (req.user.role !== 'CEO / Owner') {where = 'business_unit_id=?';args = [Number(req.user.business_unit_id || 0)];}
    const dup = (await db.prepare(`SELECT COUNT(*) c FROM (SELECT business_unit_id,source_type,source_id,COUNT(*) n FROM finance_entries WHERE ${where} AND status!='Voided' AND source_type!='Manual' AND source_id IS NOT NULL GROUP BY business_unit_id,source_type,source_id HAVING COUNT(*)>1)`).get(...args))?.c || 0;
    const manual = (await db.prepare(`SELECT COUNT(*) c FROM finance_entries WHERE ${where} AND status!='Voided' AND source_type='Manual'`).get(...args))?.c || 0;
    const paymentRows = (await db.prepare(`SELECT COUNT(*) c FROM finance_entries WHERE ${where} AND status!='Voided' AND cash_effect!=0`).get(...args))?.c || 0;
    const obligations = (await db.prepare(`SELECT COUNT(*) c FROM finance_entries WHERE ${where} AND status!='Voided' AND finance_role ILIKE '%Payable%'`).get(...args))?.c || 0;
    const suspected = (await db.prepare(`SELECT COUNT(*) c FROM (SELECT business_unit_id,bom.utc_date(COALESCE(transaction_date,created_at)) d,lower(trim(reference)) ref,ROUND(COALESCE(krw_amount,amount),2) amt,COUNT(*) n FROM finance_entries WHERE ${where} AND status!='Voided' AND cash_effect!=0 AND trim(COALESCE(reference,''))!='' GROUP BY business_unit_id,d,ref,amt HAVING COUNT(*)>1)`).get(...args))?.c || 0;
    await res.json({ ok: Number(dup) === 0, duplicate_active_sources: Number(dup), suspected_duplicate_payments: Number(suspected), manual_entries: Number(manual), cash_movement_rows: Number(paymentRows), obligation_rows: Number(obligations), version: VERSION });
  });
  await app.post('/api/finance/integrity-v302/repair', auth, allow('finance'), async (req, res) => {if (!['CEO / Owner', 'Finance / Admin'].includes(req.user.role)) return await res.status(403).json({ error: 'Only CEO or Finance can run Finance integrity repair.' });const unit = Number(currentUnit(req) || (req.user.role === 'CEO / Owner' ? 0 : req.user.business_unit_id)) || null,result = await consolidateDuplicates(unit);await audit(req.user, 'finance_integrity', 0, 'review-requested', JSON.stringify(result));await res.json({ ok: true, ...result });});
  console.info('Blue Ocean Market V30.7.0 Finance integrity backend loaded');
  return { VERSION, classify, refreshClassifications, consolidateDuplicates };
}
module.exports = { install, VERSION };
