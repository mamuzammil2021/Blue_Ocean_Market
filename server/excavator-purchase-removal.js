'use strict';

const { createHash } = require('node:crypto');

function install({ app, db, auth, excavatorGuard, accounting, voidFinanceBySource, audit }) {
  const route = '/api/excavator/assets/:id';

  async function context(req, res) {
    if (req.user.role !== 'CEO / Owner') {
      await res.status(403).json({ error: 'Only CEO can delete an Excavator purchase.' });
      return null;
    }
    const unit = await excavatorGuard(req, res);
    if (!unit) return null;
    const asset = await db.prepare('SELECT * FROM excavator_assets WHERE id=? AND business_unit_id=?')
      .get(req.params.id, unit);
    if (!asset) {
      await res.status(404).json({ error: 'Excavator asset not found' });
      return null;
    }
    return asset;
  }

  async function plan(asset) {
    const { id, business_unit_id: unit } = asset;
    if (asset.lifecycle_stage !== 'Purchased' || Number(asset.selling_price) > 0 || asset.buyer_id || asset.customer_id) {
      return { blocked: 'Only an unsold purchase can be deleted here. Resolve the machine’s later activity first.' };
    }
    const dependentTables = [
      'excavator_repairs', 'excavator_logistics', 'excavator_parts',
      'excavator_buyer_payments', 'excavator_buyer_payment_allocations', 'excavator_buyer_resale_shares',
    ];
    for (const table of dependentTables) {
      if (await db.prepare('SELECT id FROM ' + table + ' WHERE asset_id=? LIMIT 1').get(id)) {
        return { blocked: 'The machine has linked activity beyond the purchase. Resolve that activity before deleting it.' };
      }
    }
    if (await db.prepare("SELECT id FROM excavator_transactions WHERE asset_id=? AND type!='Purchase' LIMIT 1").get(id)
      || await db.prepare(`SELECT id FROM excavator_exchange_proposals WHERE business_unit_id=? AND
        ((requested_machine_source='Company Asset' AND requested_machine_id=?) OR
         (offered_machine_source='Company Asset' AND offered_machine_id=?)) LIMIT 1`).get(unit, id, id)) {
      return { blocked: 'The machine has linked activity beyond the purchase. Resolve that activity before deleting it.' };
    }
    const payments = await db.prepare('SELECT * FROM excavator_payments WHERE asset_id=? ORDER BY id').all(id);
    const finance = [];
    for (const payment of payments) {
      const linked = await db.prepare(`SELECT id, amount, category, status, verification_status, accounting_status,
          updated_at, reference FROM finance_entries
        WHERE business_unit_id=? AND source_type='Excavator Payment' AND source_id=? ORDER BY id`).all(unit, payment.id);
      const token = payment.payment_type === 'Purchase' && (
        String(payment.notes || '').startsWith('Purchase token payment')
        || linked.some(entry => entry.category === 'Excavator Purchase Token')
      );
      if (!token) return { blocked: 'The machine has a payment beyond the purchase token. Resolve that payment before deleting it.' };
      for (const entry of linked.filter(row => row.status !== 'Voided')) {
        const journals = await db.prepare(`SELECT id, status, transaction_date FROM accounting_journal_entries
          WHERE business_unit_id=? AND (finance_entry_id=? OR (source_type='Finance Entry' AND source_id=?))
            AND status IN ('Posted','Pending Review','Correction Required') ORDER BY id`).all(unit, entry.id, entry.id);
        if (journals.length > 1) return { blocked: 'The token has multiple active journals. Review them in Accounting before deletion.' };
        const journal = journals[0] || null;
        if (journal && await accounting.isPeriodClosed(unit, journal.transaction_date)) {
          return { blocked: 'The token belongs to a closed Accounting period. Resolve it in Accounting before deleting the purchase.' };
        }
        if (!journal && entry.accounting_status === 'Posted') {
          return { blocked: 'The posted token journal could not be located. Review it in Accounting before deletion.' };
        }
        const action = journal?.status === 'Posted' ? 'reverse-posted'
          : journal || entry.verification_status === 'Verified / Correct' ? 'cancel-verified' : 'void-unverified';
        finance.push({ ...entry, payment_id: payment.id, journal, action });
      }
    }
    const otherFinance = await db.prepare(`SELECT f.id FROM finance_entries f
      JOIN excavator_transactions x ON x.id=f.source_id
      WHERE f.business_unit_id=? AND x.asset_id=? AND f.source_type='Excavator Cost Transaction'
        AND f.status!='Voided' LIMIT 1`).get(unit, id);
    if (otherFinance) {
      return { blocked: 'The machine has other linked Finance activity. Resolve it before deleting the purchase.' };
    }
    const fingerprint = createHash('sha256').update(JSON.stringify({ asset, payments, finance })).digest('hex');
    return { asset_no: asset.asset_no, payments, finance, fingerprint };
  }

  app.get(route + '/deletion-preview', auth, async (req, res) => {
    const asset = await context(req, res);
    if (!asset) return;
    const review = await plan(asset);
    if (review.blocked) return res.status(409).json({ error: review.blocked });
    await res.json({ asset_no: review.asset_no, finance: review.finance, fingerprint: review.fingerprint });
  });

  // The request boundary holds the response until the serialized write commits.
  app.delete(route, auth, async (req, res) => {
    const asset = await context(req, res);
    if (!asset) return;
    const review = await plan(asset);
    if (review.blocked) return res.status(409).json({ error: review.blocked });
    if ((review.finance.length || req.body?.fingerprint) && review.fingerprint !== req.body?.fingerprint) {
      return res.status(409).json({ error: 'The purchase or its Finance status changed. Open the deletion review again.' });
    }
    const reason = 'Machine purchase deleted: ' + asset.asset_no;
    const results = [];
    for (const paymentId of new Set(review.finance.map(entry => entry.payment_id))) {
      results.push(...await voidFinanceBySource('Excavator Payment', paymentId, reason, req.user.id,
        asset.business_unit_id, { strict: true }));
    }
    await db.prepare("DELETE FROM excavator_requirement_matches WHERE business_unit_id=? AND machine_source='Company Asset' AND machine_id=?")
      .run(asset.business_unit_id, asset.id);
    await db.prepare('DELETE FROM excavator_assets WHERE id=? AND business_unit_id=?').run(asset.id, asset.business_unit_id);
    if (asset.supplier_machine_id) {
      await db.prepare(`UPDATE excavator_supplier_machines SET status='Available' WHERE id=? AND supplier_id=?
        AND status='Purchased' AND NOT EXISTS (SELECT id FROM excavator_assets WHERE supplier_machine_id=?)`)
        .run(asset.supplier_machine_id, asset.supplier_id, asset.supplier_machine_id);
    }
    await audit(req.user, 'excavator_asset', asset.id, 'delete', JSON.stringify({
      reason, before: asset, token_payments: review.payments, finance: review.finance, results,
    }));
    await res.json({ ok: true, finance: results, reversal_pending: results.some(row => row.reversal_pending) });
  });
}

module.exports = { install };
