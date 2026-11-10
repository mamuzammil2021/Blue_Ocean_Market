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

module.exports = { backfillCosts, countDuplicateMirrors };
