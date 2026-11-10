'use strict';

const sources = [
  { type: 'Repair', source: 'Excavator Repair', table: 'excavator_repairs', key: 'repair_id', category: 'Repair / Maintenance',
    amount: row => row.amount, description: row => 'repair: ' + (row.description || 'Repair') + (row.vendor ? ' · ' + row.vendor : '') },
  { type: 'Logistics', source: 'Excavator Logistics', table: 'excavator_logistics', key: 'logistics_id', category: 'Transport / Logistics',
    amount: row => row.amount, description: row => ['logistics:', row.provider, row.origin, '→', row.destination].filter(Boolean).join(' ') },
  { type: 'Part Purchase', source: 'Excavator Part', table: 'excavator_parts', key: 'part_id', category: 'Parts / Spare Parts',
    amount: row => Number(row.cost || 0) * Number(row.quantity || 1), description: row => 'parts: ' + row.part_name },
];

function metadata(transaction) {
  try { return JSON.parse(transaction.metadata || '{}') || {}; }
  catch (_) { return {}; }
}

async function resolveMirror(db, transaction) {
  const source = sources.find(item => item.type === transaction.type);
  const id = source && Number(metadata(transaction)[source.key]);
  if (!id) return null;
  const record = await db.prepare('SELECT * FROM ' + source.table + ' WHERE id=? AND asset_id=?').get(id, transaction.asset_id);
  return { ...source, id, record };
}

async function updateMirrorAmounts(db, sourceType, sourceId, assetId, amount, date) {
  const source = sources.find(item => item.source === sourceType);
  if (!source || !assetId) return;
  const rows = await db.prepare(`SELECT id,metadata FROM excavator_transactions
    WHERE asset_id=? AND type=? AND status NOT IN ('Voided','Cancelled')
      AND bom.json_text(metadata,?)=?`).all(assetId, source.type, '$.' + source.key, String(sourceId));
  for (const row of rows) {
    const meta = metadata(row);
    if (meta.original_amount != null) Object.assign(meta, { original_amount: amount, original_currency: 'KRW', fx_rate_to_krw: 1, krw_amount: amount });
    await db.prepare('UPDATE excavator_transactions SET amount=?,transaction_date=COALESCE(?,transaction_date),metadata=? WHERE id=?')
      .run(amount, date || null, JSON.stringify(meta), row.id);
  }
}

async function sourceFinance(db, unit, assetId, sourceType, sourceId) {
  const source = sources.find(item => item.source === sourceType);
  return db.prepare(`SELECT * FROM finance_entries WHERE business_unit_id=? AND status!='Voided'
    AND ((source_type=? AND source_id=?) OR (source_type='Excavator Cost Transaction' AND source_id IN
      (SELECT id FROM excavator_transactions WHERE asset_id=? AND type=? AND bom.json_text(metadata,?)=?))) ORDER BY id`)
    .all(unit, sourceType, sourceId, assetId, source.type, '$.' + source.key, String(sourceId));
}

async function transactionFinance(db, unit, transaction, mirror) {
  if (mirror) return sourceFinance(db, unit, transaction.asset_id, mirror.source, mirror.id);
  return db.prepare(`SELECT * FROM finance_entries WHERE business_unit_id=? AND status!='Voided'
    AND source_type='Excavator Cost Transaction' AND source_id=? ORDER BY id`).all(unit, transaction.id);
}

async function partFinance(db, unit, assetId, partId) {
  return sourceFinance(db, unit, assetId, 'Excavator Part', partId);
}

async function partReversal(db, finance) {
  let id = finance.source_id;
  if (finance.source_type === 'Excavator Cost Transaction') {
    const tx = await db.prepare('SELECT * FROM excavator_transactions WHERE id=?').get(id);
    if (tx?.type !== 'Part Purchase') return null;
    const mirror = await resolveMirror(db, tx);
    if (!mirror) return null;
    if (!mirror.record) return { error: 'The original parts cost could not be located.' };
    id = mirror.id;
  } else if (finance.source_type !== 'Excavator Part') return null;

  const part = await db.prepare(`SELECT p.*,a.asset_no,a.lifecycle_stage,a.status AS machine_status
    FROM excavator_parts p JOIN excavator_assets a ON a.id=p.asset_id
    WHERE p.id=? AND a.business_unit_id=?`).get(id, finance.business_unit_id);
  if (!part || part.status === 'Voided') return { error: 'The original parts cost is unavailable or already voided.' };
  const linkedSale = await db.prepare(`SELECT 1 FROM excavator_transactions
    WHERE asset_id=? AND type IN ('Local Sale','Export Sale') AND status NOT IN ('Cancelled','Voided') LIMIT 1`).get(part.asset_id);
  if (linkedSale || String(part.lifecycle_stage || '').startsWith('Sold') || part.machine_status === 'Sold'
      || Number(part.used_for_repair) || Number(part.sold_export) || ['used','sold','exported'].includes(String(part.status).trim().toLowerCase())) {
    return { error: 'This parts cost has downstream machine or parts activity. Review it with Finance before reversal.' };
  }
  const active = await partFinance(db, finance.business_unit_id, part.asset_id, part.id);
  if (active.length !== 1 || active[0].id !== finance.id) {
    return { error: 'This parts cost has conflicting Finance entries. Review them in System Integrity before reversal.' };
  }
  return { part };
}

async function voidPart(db, part, reason, actor) {
  const note = ' | VOIDED: ' + reason;
  await db.prepare("UPDATE excavator_parts SET status='Voided',notes=COALESCE(notes,'')||? WHERE id=?").run(note, part.id);
  await db.prepare(`UPDATE excavator_transactions SET status='Voided',notes=COALESCE(notes,'')||?,
    void_reason=?,voided_by=?,voided_at=bom.utc_now(),updated_by=?,updated_at=bom.utc_now()
    WHERE asset_id=? AND type='Part Purchase' AND bom.json_text(metadata,'$.part_id')=?
      AND status NOT IN ('Cancelled','Voided')`).run(note, reason, actor, actor, part.asset_id, String(part.id));
}

async function updateSourceAmount(db, mirror, amount, date) {
  const fields = {
    'Excavator Repair': ['amount', 'repair_date'],
    'Excavator Logistics': ['amount', 'logistics_date'],
    'Excavator Part': ['cost', 'purchase_date'],
  };
  const [amountColumn, dateColumn] = fields[mirror.source];
  const value = mirror.source === 'Excavator Part' ? amount / Number(mirror.record.quantity || 1) : amount;
  await db.prepare(`UPDATE ${mirror.table} SET ${amountColumn}=?,${dateColumn}=COALESCE(?,${dateColumn}) WHERE id=? AND asset_id=?`)
    .run(value, date || null, mirror.id, mirror.record.asset_id);
}

async function backfillCosts(db, asset, financeSync) {
  const transactions = await db.prepare(`SELECT * FROM excavator_transactions WHERE asset_id=?
    AND type IN ('Customs Duty','Tax / VAT','Shipping / Freight','Commission','Documentation / Clearance',
      'Other Cost','Purchase','Logistics','Repair','Part Purchase')`).all(asset.id);
  const mirrors = new Set();
  const recorded = async (type, id) => !!await db.prepare(`SELECT id FROM finance_entries
    WHERE business_unit_id=? AND source_type=? AND source_id=? LIMIT 1`).get(asset.business_unit_id, type, id);
  const sync = data => financeSync({ businessUnitId: asset.business_unit_id, ...data });
  for (const source of sources) {
    const rows = await db.prepare('SELECT * FROM ' + source.table + ' WHERE asset_id=?').all(asset.id);
    for (const row of rows) {
      if (source.source === 'Excavator Part' && row.status === 'Voided') continue;
      const linked = transactions.filter(tx => tx.type === source.type && Number(metadata(tx)[source.key]) === Number(row.id));
      linked.forEach(tx => mirrors.add(tx.id));
      // An existing Finance history, including a void, is authoritative. Some
      // historical records were linked to the mirror instead of the cost row.
      if (await recorded(source.source, row.id)) continue;
      let legacyLink = false;
      for (const tx of linked) {
        if (await recorded('Excavator Cost Transaction', tx.id)) { legacyLink = true; break; }
      }
      if (legacyLink) continue;
      await sync({ category: source.category, amount: source.amount(row), description: asset.asset_no + ' ' + source.description(row),
        createdBy: row.created_by, sourceType: source.source, sourceId: row.id, receiptFile: row.attachment_file });
    }
  }
  for (const tx of transactions) {
    const meta = metadata(tx);
    if (mirrors.has(tx.id) || ['Cancelled', 'Voided'].includes(tx.status) || meta.finance_sync === false) continue;
    if (tx.type === 'Purchase' && meta.purchase_token != null && meta.purchase_balance != null) continue;
    if (await recorded('Excavator Cost Transaction', tx.id)) continue;
    await sync({ category: tx.type, amount: tx.amount, description: asset.asset_no + ' ' + tx.type + (tx.counterparty ? ' · ' + tx.counterparty : ''),
      createdBy: tx.created_by, sourceType: 'Excavator Cost Transaction', sourceId: tx.id });
  }
}

async function countDuplicateMirrors(db, unit) {
  let count = 0;
  for (const source of sources) {
    const result = await db.prepare(`SELECT COUNT(*) c FROM finance_entries f
      JOIN excavator_transactions tx ON tx.id=f.source_id AND tx.type=?
      JOIN excavator_assets a ON a.id=tx.asset_id AND a.business_unit_id=f.business_unit_id
      JOIN ${source.table} x ON x.asset_id=a.id AND CAST(x.id AS TEXT)=bom.json_text(tx.metadata,?)
      WHERE f.source_type='Excavator Cost Transaction' AND f.status!='Voided'
        ${unit ? 'AND f.business_unit_id=?' : ''}
        AND EXISTS (SELECT 1 FROM finance_entries canonical WHERE canonical.business_unit_id=f.business_unit_id
          AND canonical.source_type=? AND canonical.source_id=x.id AND canonical.status!='Voided')`)
      .get(source.type, '$.' + source.key, ...(unit ? [unit] : []), source.source);
    count += Number(result.c || 0);
  }
  return count;
}

module.exports = { backfillCosts, countDuplicateMirrors, resolveMirror, transactionFinance, updateMirrorAmounts, updateSourceAmount, sourceFinance, partFinance, partReversal, voidPart };
