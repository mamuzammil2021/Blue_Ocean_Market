// Read-only projection of existing source records. No settlement or posting is generated here.
'use strict';
async function timeline(db, imp) {
  const out = [],seen = new Set(),users = new Map((await db.prepare("SELECT id,name FROM users").all()).map((x) => [x.id, x.name]));
  const add = async (kind, row, action, at, actor, reason = '', link = null, extra = {}) => {const key = kind + ':' + row.id + ':' + action;if (await seen.has(key)) return;await seen.add(key);out.push({ id: key, action, created_at: at || row.created_at || '', user_id: actor || null, user_name: (await users.get(actor)) || (actor ? '#' + actor : 'Legacy / system record'), reason, link, ...extra });};
  const select = async (sql, ...args) => await db.prepare(sql).all(...args);
  const inIds = (ids) => ids.length ? ids.map(() => '?').join(',') : 'NULL';
  await add('import', imp, 'Created', imp.created_at, imp.created_by, imp.import_no, { view: 'psImports', kind: 'import', id: imp.id });
  const changes = await select("SELECT * FROM pink_salt_import_change_history WHERE business_unit_id=? AND (import_id=? OR import_no=?)", imp.business_unit_id, imp.id, imp.import_no);
  for (const h of changes) await add('change', h, h.action, h.created_at, h.user_id, h.reason, null, { before_json: h.before_json, after_json: h.after_json, approval_id: h.approval_id });
  const payments = await select("SELECT * FROM pink_salt_import_payments WHERE import_id=?", imp.id),costs = await select("SELECT * FROM pink_salt_import_costs WHERE import_id=?", imp.id),allocations = await select("SELECT * FROM pink_salt_supplier_advance_allocations WHERE import_id=?", imp.id);
  for (const [kind, rows] of [['payment', payments], ['cost', costs], ['allocation', allocations]]) for (const x of rows) {
    const amount = x.amount_krw ?? x.krw_amount,when = x.payment_date || x.cost_date || x.allocation_date,action = kind === 'allocation' ? 'Advance allocated' : kind === 'cost' ? 'Import cost recorded' : 'Supplier payment recorded';
    await add(kind, x, action, when, x.created_by, x.reference || '', null, { amount_krw: amount, status: x.status, advance_id: x.advance_id });
    if (x.voided_at || x.reversed_at) await add(kind, x, x.reversed_at ? 'Allocation reversed' : 'Voided', x.voided_at || x.reversed_at, x.voided_by || x.reversed_by, x.void_reason || x.reversal_reason, null, { amount_krw: amount, status: x.status });
  }
  const txs = await select("SELECT * FROM pink_fx_transactions WHERE business_unit_id=? AND record_id=? AND workflow IN ('import','import_cost')", imp.business_unit_id, imp.id),txids = txs.map((x) => x.id);
  // Link existing projections to their immutable transaction detail; avoid a second cash event.
  for (const tx of txs) {const projection = out.find((e) => e.id.startsWith((tx.workflow === 'import' ? 'payment' : 'cost') + ':' + tx.projection_id + ':'));if (projection) projection.link = { view: 'psImports', kind: 'fx', id: tx.id };else await add('fx', tx, tx.direction === 'NonCash' ? 'Advance settlement recorded' : 'Payment recorded', tx.payment_date, tx.created_by, tx.reference, { view: 'psImports', kind: 'fx', id: tx.id }, { amount_krw: Number(tx.allocation_krw || 0) + Number(tx.advance_krw || 0), status: tx.status });}
  const financeIds = new Set(txs.map((x) => x.finance_entry_id).filter(Boolean));
  for (const f of await select(`SELECT * FROM finance_entries WHERE business_unit_id=? AND ((source_type='Pink Salt Import Payment' AND source_id IN (${inIds(payments.map((x) => x.id))})) OR (source_type='Pink Salt Import Cost' AND source_id IN (${inIds(costs.map((x) => x.id))})) OR (source_type='Pink Salt Import Purchase' AND source_id=?))`, imp.business_unit_id, ...payments.map((x) => x.id), ...costs.map((x) => x.id), imp.id)) await financeIds.add(f.id);
  if (txids.length) for (const f of await select(`SELECT finance_entry_id id FROM pink_fx_fee_debits WHERE transaction_id IN (${inIds(txids)})`, ...txids)) if (f.id) await financeIds.add(f.id);
  const fids = [...financeIds];
  if (fids.length) for (const f of await select(`SELECT * FROM finance_entries WHERE business_unit_id=? AND id IN (${inIds(fids)})`, imp.business_unit_id, ...fids)) {
    const link = { view: 'finance', kind: 'record', id: f.id };
    await add('finance', f, 'Finance record created', f.created_at, f.created_by, f.reference, link, { amount_krw: f.krw_amount, status: f.status });
    if (f.verified_at) await add('finance', f, 'Finance verified', f.verified_at, f.verified_by, '', link, { status: f.verification_status });
    if (f.voided_at) await add('finance', f, 'Finance voided', f.voided_at, f.voided_by, f.void_reason, link, { status: f.status });
  }
  const allocationJids = allocations.map((x) => x.journal_entry_id).filter(Boolean);
  const journals = await select(`SELECT * FROM accounting_journal_entries WHERE business_unit_id=? AND ((source_type ILIKE 'Pink Salt Import%' AND source_id=?) OR (source_type='Finance Entry' AND source_id IN (${inIds(fids)})) OR id IN (${inIds(allocationJids)}))`, imp.business_unit_id, imp.id, ...fids, ...allocationJids);
  const jids = journals.map((x) => x.id);if (jids.length) journals.push(...(await select(`SELECT * FROM accounting_journal_entries WHERE reversal_of_id IN (${inIds(jids)})`, ...jids)));
  for (const j of journals) {const link = { view: 'accounting', kind: 'journal', id: j.id };await add('journal', j, j.reversal_of_id ? 'Accounting reversal requested' : 'Accounting proposal created', j.created_at, j.created_by, j.description, link, { status: j.status });if (j.posted_at) await add('journal', j, 'Accounting posted', j.posted_at, j.reviewed_by, j.review_note, link, { status: j.status });for (const h of await select("SELECT * FROM accounting_posting_history WHERE journal_entry_id=?", j.id)) await add('posting', h, h.action, h.created_at, h.user_id, h.note, link, { before_status: h.before_status, after_status: h.after_status });}
  const raw = await select("SELECT m.* FROM pink_salt_raw_stock_movements m JOIN pink_salt_import_items i ON i.id=m.import_item_id WHERE i.import_id=?", imp.id);for (const x of raw) await add('stock', x, 'Stock movement: ' + x.movement_type, x.created_at || x.movement_date, x.created_by, x.reference, null, { quantity_kg: x.quantity_kg });
  const approvals = await select(`SELECT * FROM approvals WHERE business_unit_id=? AND ((source_entity='pink_salt_import' AND source_id=?) OR (source_entity='finance_entry' AND source_id IN (${inIds(fids)})) OR (source_entity IN ('pink_fx_transaction','pink_fx_reversal') AND source_id IN (${inIds(txids)})) OR (source_entity='pink_fx_request' AND source_id IN (${inIds(txs.map((x) => x.request_id))})))`, imp.business_unit_id, imp.id, ...fids, ...txids, ...txs.map((x) => x.request_id));
  for (const x of approvals) {const link = { view: 'approvals', kind: 'approval', id: x.id };await add('approval', x, 'Approval requested', x.created_at, x.requested_by, x.reason, link, { status: x.status });if (x.decided_at || x.approved_at || x.executed_at) await add('approval', x, 'Approval: ' + x.status, x.decided_at || x.approved_at || x.executed_at, x.decided_by || x.approved_by, x.decision_note || x.reason, link, { status: x.status });}
  const entities = [['pink_salt_import', [imp.id]], ['pink_salt_import_payment', payments.map((x) => x.id)], ['pink_salt_import_cost', costs.map((x) => x.id)], ['pink_salt_supplier_advance_allocation', allocations.map((x) => x.id)], ['pink_fx_transaction', txids], ['finance', fids], ['accounting_journal', journals.map((x) => x.id)], ['approval', approvals.map((x) => x.id)]];
  for (const [entity, ids] of entities) if (ids.length) for (const x of await select(`SELECT * FROM audit_log WHERE entity=? AND entity_id IN (${inIds(ids)})`, entity, ...ids)) await add('audit', x, x.action, x.created_at, x.user_id, x.details, null, { entity: x.entity, details: x.details });
  return out.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)) || String(b.id).localeCompare(String(a.id)));
}
module.exports = { timeline };
