const __async = require("./postgres/collections"); // Blue Ocean Market V30.10.0 — Pink Salt import controls, filters and quantity integrity.
const VERSION = '30.10.0';

async function install({ app, db, auth, allow, currentUnit, enforceUnit, audit, notify, voidFinanceBySource, accounting, maybeCreateApproval, stopForApproval, markApprovalExecuted, getAccess }) {
  const num = (v) => Number(v || 0),text = (v) => String(v ?? '').trim(),today = () => new Date().toISOString().slice(0, 10);
  const columnExists = async (table, col) => (await db.columns(table)).some((x) => x.name === col);
  const ensureColumn = async (table, col, def) => {if (!(await columnExists(table, col))) void 0;};
  const pinkUnit = async () => (await db.prepare("SELECT id FROM business_units WHERE lower(name) ILIKE '%pink%salt%' ORDER BY id LIMIT 1").get())?.id;
  async function guard(req, res) {const bu = Number((await pinkUnit()) || 0),selected = Number(currentUnit(req) || 0);if (!bu) {await res.status(409).json({ error: 'Pink Salt business unit is not available.' });return null;}if (!selected || selected !== bu || !enforceUnit(req, bu)) {await res.status(403).json({ error: "Select the Pink Salt business unit to use this workspace." });return null;}return bu;}
  const whole = (v) => Number.isFinite(Number(v)) && Number(v) > 0 && Number.isInteger(Number(v));
  const parseJson = (v) => {try {return typeof v === 'string' ? JSON.parse(v) : v;} catch (_) {return null;}};

  await ensureColumn('pink_salt_imports', 'cancel_reason', "TEXT DEFAULT ''");
  await ensureColumn('pink_salt_imports', 'cancelled_by', 'INTEGER');
  await ensureColumn('pink_salt_imports', 'cancelled_at', 'TEXT');
  await ensureColumn('pink_salt_imports', 'void_reason', "TEXT DEFAULT ''");
  await ensureColumn('pink_salt_imports', 'voided_by', 'INTEGER');
  await ensureColumn('pink_salt_imports', 'voided_at', 'TEXT');
  void 0;
















  // Pink Salt-specific rules use the existing global approval engine. CEO/Owner still follows direct-confirmation bypass.
  const buSeed = Number((await pinkUnit()) || 0);
  if (buSeed) {
    const add = db.prepare(`INSERT INTO approval_rules(business_unit_id,action_key,action_name,condition_type,threshold_amount,approver_level,require_dual,active,notes) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING`);
    await add.run(buSeed, 'pink_salt.import_sensitive_edit', 'Sensitive Pink Salt Import Edit', 'Always', 0, 3, 0, 1, 'Finance approval for changes to an import after finance or stock activity exists.');
    await add.run(buSeed, 'pink_salt.import_cancel', 'Cancel Pink Salt Import', 'Always', 0, 3, 0, 1, 'Finance approval when cancelling an import that has financial activity.');
    await add.run(buSeed, 'pink_salt.import_void', 'Void Pink Salt Import', 'Always', 0, 5, 1, 1, 'Dual Finance + CEO approval before reversing an import with posted activity.');
  }

  async function importRow(id, bu) {return await db.prepare(`SELECT i.*,s.name supplier FROM pink_salt_imports i LEFT JOIN pink_salt_suppliers s ON s.id=i.supplier_id WHERE i.id=? AND i.business_unit_id=?`).get(Number(id), bu);}
  async function items(id) {return await db.prepare("SELECT * FROM pink_salt_import_items WHERE import_id=? ORDER BY id").all(Number(id));}
  async function purchaseKrw(id) {return num((await db.prepare("SELECT COALESCE(SUM(line_amount_krw),0) v FROM pink_salt_import_items WHERE import_id=?").get(Number(id)))?.v);}
  async function purchaseOriginal(id) {return num((await db.prepare("SELECT COALESCE(SUM(line_amount_original),0) v FROM pink_salt_import_items WHERE import_id=?").get(Number(id)))?.v);}
  async function activity(id) {
    const payments = num((await db.prepare("SELECT COUNT(*) c FROM pink_salt_import_payments WHERE import_id=? AND COALESCE(status,'Active')!='Voided'").get(id))?.c);
    const allocations = num((await db.prepare("SELECT COUNT(*) c FROM pink_salt_supplier_advance_allocations WHERE import_id=? AND COALESCE(status,'Active')='Active'").get(id))?.c);
    const costs = num((await db.prepare("SELECT COUNT(*) c FROM pink_salt_import_costs WHERE import_id=? AND COALESCE(status,'Active')!='Voided'").get(id))?.c);
    const rawMovements = num((await db.prepare("SELECT COUNT(*) c FROM pink_salt_raw_stock_movements m JOIN pink_salt_import_items x ON x.id=m.import_item_id WHERE x.import_id=?").get(id))?.c);
    const rawBalance = num((await db.prepare("SELECT COALESCE(SUM(m.quantity_kg),0) v FROM pink_salt_raw_stock_movements m JOIN pink_salt_import_items x ON x.id=m.import_item_id WHERE x.import_id=?").get(id))?.v);
    const receivedQty = num((await db.prepare("SELECT COALESCE(SUM(received_weight_kg),0) v FROM pink_salt_import_items WHERE import_id=?").get(id))?.v);
    const productionInputs = num((await db.prepare("SELECT COUNT(*) c FROM pink_salt_production_inputs p JOIN pink_salt_import_items x ON x.id=p.import_item_id JOIN pink_salt_production_batches b ON b.id=p.production_batch_id WHERE x.import_id=? AND b.status NOT IN ('Voided','Cancelled')").get(id))?.c);
    const attachments = num((await db.prepare("SELECT COUNT(*) c FROM pink_salt_attachments WHERE entity_type='Import' AND entity_id=?").get(id))?.c);
    return { payments, allocations, costs, raw_movements: rawMovements, raw_balance_kg: rawBalance, received_weight_kg: receivedQty, production_inputs: productionInputs, attachments, financial_history: !!(await db.prepare("SELECT 1 FROM pink_salt_import_payments WHERE import_id=? UNION ALL SELECT 1 FROM pink_salt_supplier_advance_allocations WHERE import_id=? UNION ALL SELECT 1 FROM pink_salt_import_costs WHERE import_id=? LIMIT 1").get(id, id, id)), financial_activity: payments + allocations + costs > 0, stock_activity: rawMovements > 0, downstream_activity: productionInputs > 0 };
  }
  async function capabilities(imp, a, req) {
    const terminal = ['Cancelled', 'Voided'].includes(imp.status),permission = await require('./import-policy43').policy(req, imp, a, getAccess?.());
    const unifiedLock = await app.locals.bomReceiving44?.hasDependencies('import', imp.id);const canDelete = !unifiedLock && !terminal && imp.status !== 'Received' && !a.financial_activity && !a.stock_activity && !a.downstream_activity && a.attachments === 0;
    const canCancel = !unifiedLock && !terminal && imp.status !== 'Received' && !a.financial_activity && !a.stock_activity && !a.downstream_activity;
    const rawConsumed = a.stock_activity && a.raw_balance_kg + 0.005 < a.received_weight_kg;
    const canVoid = !unifiedLock && !terminal && !a.downstream_activity && (!a.stock_activity || !rawConsumed) && (!a.stock_activity || Math.abs(a.raw_balance_kg - a.received_weight_kg) <= 0.005);
    return { can_edit: permission.edit, can_delete: canDelete && permission.void, can_cancel: canCancel && permission.void, can_void: canVoid && permission.void, restricted_to_ceo: permission.restricted_to_ceo, raw_consumed: rawConsumed, sensitive_edit_requires_approval: a.financial_activity || a.stock_activity };
  }
  async function history(importId, bu, importNo, action, reason, before, after, userId, approvalId = null) {
    await db.prepare("INSERT INTO pink_salt_import_change_history(import_id,business_unit_id,import_no,action,reason,before_json,after_json,approval_id,user_id) VALUES(?,?,?,?,?,?,?,?,?)").run(importId, bu, importNo, action, reason, JSON.stringify(before || {}), JSON.stringify(after || {}), approvalId, userId || null);
  }
  async function voidFingerprint(id) {
    const snapshot = { import: await db.prepare("SELECT * FROM pink_salt_imports WHERE id=?").get(id), items: await items(id), payments: await db.prepare("SELECT * FROM pink_salt_import_payments WHERE import_id=? ORDER BY id").all(id), costs: await db.prepare("SELECT * FROM pink_salt_import_costs WHERE import_id=? ORDER BY id").all(id), allocations: await db.prepare("SELECT * FROM pink_salt_supplier_advance_allocations WHERE import_id=? ORDER BY id").all(id), fx: await db.prepare("SELECT * FROM pink_fx_transactions WHERE record_id=? AND workflow IN ('import','import_cost') ORDER BY id").all(id), stock: await db.prepare("SELECT m.* FROM pink_salt_raw_stock_movements m JOIN pink_salt_import_items i ON i.id=m.import_item_id WHERE i.import_id=? ORDER BY m.id").all(id) };
    return require('crypto').createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
  }
  async function activeJournal(sourceType, sourceId) {return await db.prepare("SELECT * FROM accounting_journal_entries WHERE source_type=? AND source_id=? AND status IN ('Pending Review','Correction Required','Posted') ORDER BY id DESC LIMIT 1").get(sourceType, Number(sourceId));}
  async function reverseSourceJournal(sourceType, sourceId, reason, userId) {const j = await activeJournal(sourceType, sourceId);if (!j) return null;if (j.status === 'Posted' && (await accounting?.isPeriodClosed?.(j.business_unit_id, j.transaction_date))) throw new Error('The linked accounting period is closed. Reopen it before this correction.');return (await accounting?.reverseJournal?.(j, reason, userId)) || null;}
  async function voidImportFinance(source, id, reason, actor, bu) {
    for (const f of await db.prepare("SELECT * FROM finance_entries WHERE source_type=? AND source_id=? AND business_unit_id=? AND status!='Voided'").all(source, id, bu)) {
      if (await accounting.isPeriodClosed?.(bu, f.transaction_date)) throw new Error('The linked accounting period is closed. Reopen it before this correction.');
      await db.prepare("UPDATE finance_entries SET status='Voided',void_reason=?,voided_by=?,voided_at=bom.utc_now(),updated_at=bom.utc_now() WHERE id=?").run(reason, actor, f.id);
      await accounting.syncFinanceEntry(f.id);await audit({ id: actor }, 'finance', f.id, 'void-import-linked', JSON.stringify({ reason, before: f, import_source: source }));
    }
  }
  async function postCommitment(imp) {const total = await purchaseKrw(imp.id);if (total <= 0 || !accounting?.postJournal) return null;const existing = await activeJournal('Pink Salt Import Commitment', imp.id);if (existing) return existing.id;return await accounting.postJournal({ businessUnitId: imp.business_unit_id, transactionDate: imp.purchase_date || today(), sourceType: 'Pink Salt Import Commitment', sourceId: imp.id, sourceLabel: `Pink Salt Import Commitment · ${imp.import_no}`, description: 'Recognize Pink Salt purchase commitment and supplier payable without creating a Finance payment entry.', createdBy: imp.created_by, lines: [{ account_id: await accounting.accountId('PINK_SALT_IN_TRANSIT'), debit_krw: total, credit_krw: 0, original_amount: (await purchaseOriginal(imp.id)) || total, original_currency: imp.invoice_currency || 'KRW', fx_rate: num(imp.invoice_fx_rate_to_krw) || 1, entity_type: 'Pink Salt Import', entity_id: imp.id, memo: `Import commitment · ${imp.import_no}` }, { account_id: await accounting.accountId('ACCOUNTS_PAYABLE'), debit_krw: 0, credit_krw: total, original_amount: (await purchaseOriginal(imp.id)) || total, original_currency: imp.invoice_currency || 'KRW', fx_rate: num(imp.invoice_fx_rate_to_krw) || 1, entity_type: 'Pink Salt Supplier', entity_id: imp.supplier_id || null, memo: `Supplier payable · ${imp.supplier_name || ''}` }] });}
  async function recalcLanded(id) {const rows = await items(id),shared = num((await db.prepare("SELECT COALESCE(SUM(krw_amount),0) v FROM pink_salt_import_costs WHERE import_id=? AND COALESCE(status,'Active')!='Voided'").get(id))?.v),weight = rows.reduce((s, x) => s + num(x.total_weight_kg), 0),up = db.prepare("UPDATE pink_salt_import_items SET landed_cost_krw=? WHERE id=?");for (const x of rows) await up.run(num(x.line_amount_krw) + (weight ? shared * (num(x.total_weight_kg) / weight) : 0), x.id);}

  await app.get('/api/pink-salt/imports-list-v310', auth, allow('purchases', 'inventory', 'finance', 'dashboard'), async (req, res) => {
    const bu = await guard(req, res);if (!bu) return;
    const rows = await db.prepare(`SELECT i.*,COALESCE(s.name,i.supplier_name) supplier,
      (SELECT STRING_AGG(DISTINCT (x.salt_grade)::text,',') FROM pink_salt_import_items x WHERE x.import_id=i.id) salt_categories,
      (SELECT COALESCE(SUM(total_weight_kg),0) FROM pink_salt_import_items x WHERE x.import_id=i.id) total_weight_kg,
      (SELECT COALESCE(SUM(line_amount_original),0) FROM pink_salt_import_items x WHERE x.import_id=i.id) purchase_original,
      (SELECT COALESCE(SUM(line_amount_krw),0) FROM pink_salt_import_items x WHERE x.import_id=i.id) purchase_krw,
      (SELECT COALESCE(SUM(krw_amount),0) FROM pink_salt_import_payments p WHERE p.import_id=i.id AND COALESCE(p.status,'Active')!='Voided') cash_paid_krw,
      (SELECT COALESCE(SUM(amount_krw),0) FROM pink_salt_supplier_advance_allocations a WHERE a.import_id=i.id AND COALESCE(a.status,'Active')='Active') advance_allocated_krw
      FROM pink_salt_imports i LEFT JOIN pink_salt_suppliers s ON s.id=i.supplier_id WHERE i.business_unit_id=? ORDER BY i.id DESC`).all(bu);
    for (const x of rows) {x.paid_krw = num(x.cash_paid_krw) + num(x.advance_allocated_krw);const terminal = ['Cancelled', 'Voided'].includes(x.status);x.outstanding_krw = terminal ? 0 : Math.max(0, num(x.purchase_krw) - x.paid_krw);x.payment_status = terminal ? x.status : x.status === 'Received' && x.outstanding_krw <= 0.01 ? 'Fully Paid' : x.paid_krw <= 0 ? 'Unpaid' : x.outstanding_krw <= 0.01 ? 'Fully Paid / Ready to Receive' : 'Partially Paid';}
    await res.json(rows);
  });

  app.locals.bomPinkImportCapabilities = async (imp, req) => await capabilities(imp, await activity(imp.id), req);
  await app.get('/api/pink-salt/imports/:id/manage-v310', auth, allow('purchases', 'inventory', 'finance', 'dashboard'), async (req, res) => {
    const bu = await guard(req, res);if (!bu) return;const imp = await importRow(req.params.id, bu);if (!imp) return await res.status(404).json({ error: 'Import not found.' });const a = await activity(imp.id);await res.json({ import: imp, items: await items(imp.id), activity: a, capabilities: await capabilities(imp, a, req), purchase_krw: await purchaseKrw(imp.id), purchase_original: await purchaseOriginal(imp.id) });
  });
  await app.get('/api/pink-salt/imports/:id/history-v310', auth, allow('purchases', 'inventory', 'finance', 'dashboard'), async (req, res) => {
    const bu = await guard(req, res);if (!bu) return;const imp = await importRow(req.params.id, bu);if (!imp) return await res.status(404).json({ error: 'Import not found.' });const rows = await require('./import-history').timeline(db, imp);if (req.query.page) {const page = Math.max(1, Number(req.query.page) || 1),size = 25;return await res.json({ rows: rows.slice((page - 1) * size, page * size), total: rows.length, page, page_size: size, import_no: imp.import_no });}await res.json(rows);
  });

  async function applyImportEdit(req, res, trustedApproval = null, executor = null) {
    const bu = await guard(req, res);if (!bu) return;const imp = await importRow(req.params.id, bu);if (!imp) return await res.status(404).json({ error: 'Import not found.' });const a = await activity(imp.id),cap = await capabilities(imp, a, req);if (!(await require('./import-policy43').policy(req, imp, a, getAccess?.())).edit) return await res.status(403).json({ error: 'This import cannot be edited by this user. Received imports require CEO / Owner.' });
    const reason = text(req.body.reason);if (!reason) return await res.status(400).json({ error: 'Edit reason is required for import audit history.' });
    const supplierId = num(req.body.supplier_id || imp.supplier_id),supplier = await db.prepare("SELECT * FROM pink_salt_suppliers WHERE id=? AND business_unit_id=? AND active=1").get(supplierId, bu);if (!supplier) return await res.status(400).json({ error: 'Selected supplier is invalid.' });
    if ((a.payments || a.allocations) && supplierId !== num(imp.supplier_id)) return await res.status(409).json({ error: 'Supplier cannot be changed after supplier payment or advance-allocation activity. Reverse/correct the linked payments or allocations first.' });
    const currency = (text(req.body.invoice_currency || imp.invoice_currency) || 'KRW').toUpperCase(),rate = currency === 'KRW' ? 1 : num(req.body.invoice_fx_rate_to_krw ?? imp.invoice_fx_rate_to_krw);if (rate <= 0) return await res.status(400).json({ error: 'A valid import exchange rate to KRW is required.' });
    const status = text(req.body.status || imp.status);if (!['Draft', 'Ordered', 'In Transit', 'Customs / Clearance', 'Received'].includes(status) || status === 'Received' && imp.status !== 'Received') return await res.status(400).json({ error: 'Use Receive Shipment to mark an import as Received.' });if (imp.status === 'Received' && status !== 'Received') return await res.status(409).json({ error: 'A received import cannot be moved back to an earlier status. Use the controlled correction/reversal workflow.' });
    const incoming = Array.isArray(req.body.items) ? req.body.items : parseJson(req.body.items),storedItems = await items(imp.id),itemKey = (x) => JSON.stringify([text(x.salt_grade), num(x.bag_size_kg), num(x.bag_count), num(x.unit_price_original), text(x.specification), text(x.storage_location), text(x.notes)]);const replacing = Array.isArray(incoming) && JSON.stringify(incoming.map(itemKey)) !== JSON.stringify(storedItems.map(itemKey));
    if (replacing && (a.stock_activity || a.downstream_activity)) return await res.status(409).json({ error: 'Salt item composition is locked after receipt or downstream production. Use a controlled correction/reversal workflow.' });
    if (replacing) {if (!incoming.length) return await res.status(400).json({ error: 'Add at least one salt category to this import.' });for (const x of incoming) {if (!text(x.salt_grade) || num(x.bag_size_kg) <= 0 || !whole(x.bag_count) || num(x.unit_price_original) <= 0) return await res.status(400).json({ error: 'Each salt item requires category, bag size, whole-number bag count and unit price.' });}}
    const before = { import: imp, items: await items(imp.id) },next = { supplier_id: supplierId, supplier_name: supplier.name, supplier_invoice_no: text(req.body.supplier_invoice_no ?? imp.supplier_invoice_no), container_no: text(req.body.container_no ?? imp.container_no), bill_of_lading: text(req.body.bill_of_lading ?? imp.bill_of_lading), purchase_date: text(req.body.purchase_date || imp.purchase_date) || imp.purchase_date, expected_arrival: text(req.body.expected_arrival ?? imp.expected_arrival) || null, actual_arrival: imp.actual_arrival || null, status, invoice_currency: currency, invoice_fx_rate_to_krw: rate, notes: text(req.body.notes ?? imp.notes) };
    const financialMaterial = replacing || supplierId !== num(imp.supplier_id) || currency !== imp.invoice_currency || Math.abs(rate - num(imp.invoice_fx_rate_to_krw)) > 1e-9;
    const metadataSensitive = next.supplier_invoice_no !== text(imp.supplier_invoice_no) || next.container_no !== text(imp.container_no) || next.bill_of_lading !== text(imp.bill_of_lading) || text(next.purchase_date) !== text(imp.purchase_date) || text(next.expected_arrival) !== text(imp.expected_arrival) || text(next.actual_arrival) !== text(imp.actual_arrival) || next.status !== text(imp.status);
    const sensitive = financialMaterial || metadataSensitive;
    if ((a.stock_activity || (await app.locals.bomReceiving44?.hasDependencies('import', imp.id))) && financialMaterial) return await res.status(409).json({ error: 'Financial values and salt composition are locked after receipt. Use the controlled correction/reversal workflow.' });
    const settledKrw = num((await db.prepare("SELECT COALESCE(SUM(krw_amount),0) v FROM pink_salt_import_payments WHERE import_id=? AND COALESCE(status,'Active')!='Voided'").get(imp.id))?.v) + num((await db.prepare("SELECT COALESCE(SUM(amount_krw),0) v FROM pink_salt_supplier_advance_allocations WHERE import_id=? AND COALESCE(status,'Active')='Active'").get(imp.id))?.v);
    let prospectiveKrw = await purchaseKrw(imp.id);if (replacing) prospectiveKrw = incoming.reduce((sum, x) => {const bags = num(x.bag_count),lineOriginal = num(x.line_amount_original) || num(x.unit_price_original) * bags;return sum + lineOriginal * rate;}, 0);else if (currency !== imp.invoice_currency || Math.abs(rate - num(imp.invoice_fx_rate_to_krw)) > 1e-9) prospectiveKrw = (await purchaseOriginal(imp.id)) * rate;
    if (settledKrw > prospectiveKrw + 0.01) return await res.status(409).json({ error: 'This edit would reduce the import value below supplier payments or advance allocations already applied. Correct/reverse the linked settlement first.' });
    const approvalNeeded = (a.financial_activity || a.stock_activity) && sensitive;let ar = trustedApproval ? { approval: trustedApproval } : null;
    if (!trustedApproval && approvalNeeded && typeof maybeCreateApproval === 'function') {ar = await maybeCreateApproval({ req, businessUnitId: bu, actionKey: 'pink_salt.import_sensitive_edit', type: 'Sensitive Pink Salt Import Edit', amount: await purchaseKrw(imp.id), reason, sourceEntity: 'pink_salt_import', sourceId: imp.id, priority: 'High', snapshot: { body: req.body, import_id: imp.id, before } });if (typeof stopForApproval === 'function' && (await stopForApproval(res, ar, 'Import edit submitted for approval.', { source_id: imp.id }))) return;}
    try {
      const tx = db.atomic(async () => {
        if (financialMaterial) await reverseSourceJournal('Pink Salt Import Commitment', imp.id, 'Import edited: ' + reason, req.user.id);
        await db.prepare(`UPDATE pink_salt_imports SET supplier_id=?,supplier_name=?,supplier_invoice_no=?,container_no=?,bill_of_lading=?,purchase_date=?,expected_arrival=?,actual_arrival=?,status=?,invoice_currency=?,invoice_fx_rate_to_krw=?,notes=?,updated_at=bom.utc_now() WHERE id=?`).run(next.supplier_id, next.supplier_name, next.supplier_invoice_no, next.container_no, next.bill_of_lading, next.purchase_date, next.expected_arrival, next.actual_arrival, next.status, next.invoice_currency, next.invoice_fx_rate_to_krw, next.notes, imp.id);
        if (replacing) {await db.prepare("DELETE FROM pink_salt_import_items WHERE import_id=?").run(imp.id);const ins = db.prepare("INSERT INTO pink_salt_import_items(import_id,salt_grade,specification,bag_size_kg,bag_count,total_weight_kg,unit_price_original,line_amount_original,fx_rate_to_krw,line_amount_krw,storage_location,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)");for (const x of incoming) {const bags = num(x.bag_count),size = num(x.bag_size_kg),lineOriginal = num(x.line_amount_original) || num(x.unit_price_original) * bags;await ins.run(imp.id, text(x.salt_grade), text(x.specification), size, bags, size * bags, num(x.unit_price_original), lineOriginal, rate, lineOriginal * rate, text(x.storage_location), text(x.notes));}} else
        if (currency !== imp.invoice_currency || Math.abs(rate - num(imp.invoice_fx_rate_to_krw)) > 1e-9) {await db.prepare("UPDATE pink_salt_import_items SET fx_rate_to_krw=?,line_amount_krw=line_amount_original*? WHERE import_id=?").run(rate, rate, imp.id);}
        await recalcLanded(imp.id);if (financialMaterial) await postCommitment(await importRow(imp.id, bu));
        const after = { import: await importRow(imp.id, bu), items: await items(imp.id) };await history(imp.id, bu, imp.import_no, 'Edit', reason, before, after, req.user.id, ar?.approval?.id || null);await audit(req.user, 'pink_salt_import', imp.id, 'edit-v310', JSON.stringify({ reason, approval_id: ar?.approval?.id || null, financial_material: financialMaterial, sensitive }));
      });await tx();if (ar?.approval && typeof markApprovalExecuted === 'function') await markApprovalExecuted(ar.approval, executor || req.user, { import_id: imp.id, action: 'edit' });await res.json({ ok: true, id: imp.id });
    } catch (e) {await res.status(409).json({ error: e.message });}
  }
  app.put('/api/pink-salt/imports/:id/manage-v310', auth, allow('purchases', 'inventory', 'finance'), require('./pink-operation').wrap(db, applyImportEdit));

  app.locals.bomExecuteImportEdit = async (ap, user) => await db.atomic(async () => {
    if (ap.status !== 'Approved') throw new Error('Final approval is required.');const snap = JSON.parse(ap.request_snapshot_json || '{}'),original = await db.prepare("SELECT * FROM users WHERE id=? AND active=1").get(ap.requester_id);if (!original) throw new Error('Original requester is no longer active.');const access = getAccess?.();if (original.role !== 'CEO / Owner' && (!(await access?.isAssigned?.(original.id, ap.business_unit_id)) || !(await __async.some(['purchases', 'inventory', 'finance'], async (m) => await access?.canAction?.(original.id, m, 'edit', ap.business_unit_id))))) throw new Error('Original requester no longer has edit permission.');
    const before = await importRow(ap.source_id, ap.business_unit_id);if (!before) throw new Error('Import not found.');if (Object.entries(snap.before?.import || {}).some(([key, value]) => before[key] !== value) || (await items(ap.source_id)).length !== (snap.before?.items || []).length || (await __async.some(snap.before?.items || [], async (row, i) => await __async.some(Object.entries(row), async ([key, value]) => (await items(ap.source_id))[i]?.[key] !== value)))) throw new Error('Import changed since the approval request. Review and resubmit the edit.');
    const req = { user: original, selected_business_unit_id: ap.business_unit_id, params: { id: String(ap.source_id) }, body: snap.body, headers: {}, app };let outcome,status = 200;const res = { status(n) {status = n;return this;}, json(body) {outcome = body;return this;} };await applyImportEdit(req, res, ap, user);if (status >= 400 || !outcome?.ok) throw new Error(outcome?.error || 'Approved import edit did not complete.');return { executed: true, ...outcome };
  })();

  await app.post('/api/pink-salt/imports/:id/cancel-v310', auth, allow('purchases', 'inventory', 'finance'), async (req, res) => {
    const bu = await guard(req, res);if (!bu) return;const imp = await importRow(req.params.id, bu);if (!imp) return await res.status(404).json({ error: 'Import not found.' });if (await app.locals.bomReceiving44?.hasDependencies('import', imp.id)) return await res.status(409).json({ error: 'Resolve unified receipts, claims and credit allocations before voiding this import.' });const a = await activity(imp.id),cap = await capabilities(imp, a, req),reason = text(req.body.reason);if (!reason) return await res.status(400).json({ error: 'Cancellation reason is required.' });if (!cap.can_cancel) return await res.status(409).json({ error: a.financial_activity ? 'This import has payments, advance allocations, or costs. Use the approval-controlled Void workflow or reverse/correct those records first.' : 'This import can no longer be cancelled. Use Void or a controlled correction/reversal workflow.' });let ar = null;if (a.financial_activity && typeof maybeCreateApproval === 'function') {ar = await maybeCreateApproval({ req, businessUnitId: bu, actionKey: 'pink_salt.import_cancel', type: 'Cancel Pink Salt Import', amount: await purchaseKrw(imp.id), reason, sourceEntity: 'pink_salt_import', sourceId: imp.id, priority: 'High', snapshot: { body: req.body, import_id: imp.id, status: imp.status } });if (await stopForApproval?.(res, ar, 'Import cancellation submitted for approval.', { source_id: imp.id })) return;}
    try {await reverseSourceJournal('Pink Salt Import Commitment', imp.id, 'Import cancelled: ' + reason, req.user.id);await db.prepare("UPDATE pink_salt_imports SET status='Cancelled',cancel_reason=?,cancelled_by=?,cancelled_at=bom.utc_now(),updated_at=bom.utc_now() WHERE id=?").run(reason, req.user.id, imp.id);const after = await importRow(imp.id, bu);await history(imp.id, bu, imp.import_no, 'Cancel', reason, imp, after, req.user.id, ar?.approval?.id || null);await audit(req.user, 'pink_salt_import', imp.id, 'cancel-v310', reason);if (ar?.approval) await markApprovalExecuted?.(ar.approval, req.user, { import_id: imp.id, action: 'cancel' });await notify?.(req.user.id, 'warning', 'Pink Salt import cancelled', `${imp.import_no}: ${reason}`, bu, 'pink_salt_import', imp.id, 'psImports');await res.json({ ok: true, status: 'Cancelled' });} catch (e) {await res.status(409).json({ error: e.message });}
  });

  async function applyImportVoid(req, res, trustedApproval = null, executor = null) {
    const bu = await guard(req, res);if (!bu) return;const imp = await importRow(req.params.id, bu);if (!imp) return await res.status(404).json({ error: 'Import not found.' });if (await app.locals.bomReceiving44?.hasDependencies('import', imp.id)) return await res.status(409).json({ error: 'Resolve unified receipts, claims and credit allocations before voiding this import.' });const a = await activity(imp.id),cap = await capabilities(imp, a, req),reason = text(req.body.reason);if (!reason) return await res.status(400).json({ error: 'Void reason is required.' });if (!(await require('./import-policy43').policy(req, imp, a, getAccess?.())).void) return await res.status(403).json({ error: 'This user is not authorized to void this import. Received imports require CEO / Owner; financially active imports require an administrator.' });if (!cap.can_void) return await res.status(409).json({ error: a.downstream_activity ? 'Import cannot be voided because its raw salt has downstream production. Use a controlled correction/reversal workflow.' : 'Import stock no longer matches the received quantity. Review and correct downstream consumption or adjustments first.' });let ar = trustedApproval ? { approval: trustedApproval } : null;if (!trustedApproval && typeof maybeCreateApproval === 'function') {ar = await maybeCreateApproval({ req, businessUnitId: bu, actionKey: 'pink_salt.import_void', type: 'Void Pink Salt Import', amount: await purchaseKrw(imp.id), reason, sourceEntity: 'pink_salt_import', sourceId: imp.id, priority: 'Critical', snapshot: { body: req.body, import_id: imp.id, status: imp.status, activity: a, fingerprint: await voidFingerprint(imp.id) } });if (await stopForApproval?.(res, ar, 'Import void submitted for Finance + CEO approval.', { source_id: imp.id })) return;}
    try {const before = { import: imp, activity: a };const tx = db.atomic(async () => {
        await app.locals.bomPinkFX.reverseImportTransactions(req, imp.id, reason);
        await reverseSourceJournal('Pink Salt Import Receipt', imp.id, 'Import voided: ' + reason, req.user.id);await reverseSourceJournal('Pink Salt Import Commitment', imp.id, 'Import voided: ' + reason, req.user.id);
        const allocs = await db.prepare("SELECT * FROM pink_salt_supplier_advance_allocations WHERE import_id=? AND status='Active'").all(imp.id);for (const x of allocs) {if (x.journal_entry_id) {const j = await db.prepare("SELECT * FROM accounting_journal_entries WHERE id=?").get(x.journal_entry_id);if (j && !['Reversed', 'Cancelled'].includes(j.status)) {if (j.status === 'Posted' && (await accounting.isPeriodClosed?.(bu, today()))) throw new Error('The current accounting period is closed. Reopen it before creating the controlled reversal.');await accounting.reverseJournal(j, 'Import voided: ' + reason, req.user.id);}}await db.prepare("UPDATE pink_salt_supplier_advance_allocations SET status='Reversed',reversal_reason=?,reversed_by=?,reversed_at=bom.utc_now() WHERE id=?").run(reason, req.user.id, x.id);}
        for (const p of await db.prepare("SELECT id FROM pink_salt_import_payments WHERE import_id=? AND COALESCE(status,'Active')!='Voided'").all(imp.id)) {await db.prepare("UPDATE pink_salt_import_payments SET status='Voided',void_reason=?,voided_by=?,voided_at=bom.utc_now() WHERE id=?").run(reason, req.user.id, p.id);await voidImportFinance('Pink Salt Import Payment', p.id, reason, req.user.id, bu);}
        for (const c of await db.prepare("SELECT id FROM pink_salt_import_costs WHERE import_id=? AND COALESCE(status,'Active')!='Voided'").all(imp.id)) {await db.prepare("UPDATE pink_salt_import_costs SET status='Voided',void_reason=?,voided_by=?,voided_at=bom.utc_now() WHERE id=?").run(reason, req.user.id, c.id);await voidImportFinance('Pink Salt Import Cost', c.id, reason, req.user.id, bu);}
        const movement = db.prepare("INSERT INTO pink_salt_raw_stock_movements(business_unit_id,import_item_id,movement_date,movement_type,quantity_kg,reference_type,reference_id,reference,notes,created_by,location_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)");
        for (const x of await items(imp.id)) for (const stock of await db.prepare("SELECT location_id,COALESCE(SUM(quantity_kg),0) balance FROM pink_salt_raw_stock_movements WHERE import_item_id=? GROUP BY location_id").all(x.id)) {
          if (stock.balance < -0.000001) throw new Error('A warehouse has negative import stock. Correct it before voiding.');
          if (stock.balance > 0.000001) await movement.run(bu, x.id, today(), 'Import Void', -stock.balance, 'Import', imp.id, imp.import_no, 'Import void reversal: ' + reason, req.user.id, stock.location_id);
        }
        await db.prepare("UPDATE pink_salt_imports SET status='Voided',void_reason=?,voided_by=?,voided_at=bom.utc_now(),updated_at=bom.utc_now() WHERE id=?").run(reason, req.user.id, imp.id);await history(imp.id, bu, imp.import_no, 'Void', reason, before, { import: await importRow(imp.id, bu) }, req.user.id, ar?.approval?.id || null);await audit(req.user, 'pink_salt_import', imp.id, 'void-v310', reason);
      });await tx();accounting?.scheduleQueue?.(0);if (ar?.approval) await markApprovalExecuted?.(ar.approval, executor || req.user, { import_id: imp.id, action: 'void' });await res.json({ ok: true, status: 'Voided' });} catch (e) {await res.status(409).json({ error: e.message });}
  }
  await app.post('/api/pink-salt/imports/:id/void-v310', auth, allow('purchases', 'inventory', 'finance'), require('./pink-operation').wrap(db, applyImportVoid));
  app.locals.bomExecuteImportVoid = async (ap, user) => await db.atomic(async () => {
    const imp = await importRow(ap.source_id, ap.business_unit_id);if (!imp) throw new Error('Import not found.');
    if (imp.status === 'Voided' && ap.status === 'Executed') return { executed: true, already_voided: true };
    if (ap.status !== 'Approved') throw new Error('Final approval is required.');
    const maker = await db.prepare("SELECT * FROM users WHERE id=? AND active=1").get(ap.requester_id),snap = JSON.parse(ap.request_snapshot_json || '{}');
    if (!maker || !(await require('./import-policy43').policy({ user: maker }, imp, await activity(imp.id), getAccess?.())).void) throw new Error('Original requester is no longer authorized to void this import.');
    if (!snap.fingerprint || snap.fingerprint !== (await voidFingerprint(imp.id))) throw new Error('Import changed since the approval request. Review and resubmit the void.');
    const req = { user, selected_business_unit_id: ap.business_unit_id, params: { id: String(ap.source_id) }, body: snap.body, headers: {}, app };let status = 200,result;const res = { status(n) {status = n;return this;}, json(body) {result = body;return this;} };
    await applyImportVoid(req, res, ap, user);if (status >= 400 || !result?.ok) throw new Error(result?.error || 'Approved import void did not complete.');return { executed: true, ...result };
  })();

  app.delete("/api/pink-salt/imports/:id/delete-v310", auth, allow('purchases', 'inventory', 'finance'), async (req, res) => {
    const bu = await guard(req, res);if (!bu) return;const imp = await importRow(req.params.id, bu);if (!imp) return await res.status(404).json({ error: 'Import not found.' });const a = await activity(imp.id),cap = await capabilities(imp, a, req),reason = text(req.body?.reason);if (!reason) return await res.status(400).json({ error: "Delete reason is required." });if (!cap.can_delete) return await res.status(409).json({ error: "Delete is only allowed for an early import with no payments, advance allocations, costs, documents, stock movements or downstream production. Use Cancel/Void instead." });try {await reverseSourceJournal('Pink Salt Import Commitment', imp.id, 'Import deleted: ' + reason, req.user.id);await history(imp.id, bu, imp.import_no, "Delete", reason, { import: imp, items: await items(imp.id) }, { deleted: true }, req.user.id, null);await db.prepare("DELETE FROM pink_salt_imports WHERE id=?").run(imp.id);await audit(req.user, 'pink_salt_import', imp.id, "delete-v310", reason);await res.json({ ok: true, deleted: true });} catch (e) {await res.status(409).json({ error: e.message });}
  });

  console.info('Blue Ocean Market V30.10.0 import controls and quantity integrity backend loaded');
  return { VERSION };
}
module.exports = { install, VERSION };
