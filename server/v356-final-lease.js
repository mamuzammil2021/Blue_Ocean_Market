'use strict';
// Cash-neutral lease modification and termination proposals. Original Finance payments and posted source journals remain untouched.
const __async = require("./postgres/collections");async function install({ app, db, auth, allow, currentUnit, enforceUnit, audit, accounting, hasAccess }) {
  const round = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100,fail = (status, message) => Object.assign(new Error(message), { status });
  const iso = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')) && !Number.isNaN(Date.parse(s + 'T00:00:00Z')) ? s : null;
  const adjust = async (req) => req.user.role === 'CEO / Owner' || !!(await hasAccess?.(req.user.id, 'sensitive.accounting_adjustments', Number(currentUnit(req) || 0)));
  const agree = async (req) => {const a = await db.prepare("SELECT * FROM accounting_financing_v356 WHERE id=?").get(req.params.id);if (!a || !enforceUnit(req, a.business_unit_id)) throw fail(404, 'Agreement not found');if (a.financing_type !== 'Equipment Lease' || a.currency !== 'KRW') throw fail(409, 'KRW equipment lease required');return a;};
  const account = async (id, type) => {const a = await db.prepare("SELECT * FROM accounting_accounts WHERE id=? AND active=1").get(Number(id));if (!a || a.account_type !== type) throw fail(400, "Select active " + type + ' account');return a;};
  const reversed = async (id) => !!(await db.prepare("SELECT id FROM accounting_journal_entries WHERE reversal_of_id=? AND status IN ('Pending Review','Correction Required','Posted') LIMIT 1").get(id));
  const posted = async (x) => x?.status === 'Posted' && !(await reversed(x.id));
  const journal = async (type, id) => await db.prepare("SELECT * FROM accounting_journal_entries WHERE source_type=? AND source_id=? ORDER BY id DESC LIMIT 1").get(type, id);
  const guard = async (a, d) => {if (await accounting?.isPeriodClosed?.(a.business_unit_id, d)) throw fail(409, 'Accounting period closed');};
  const write = async (req, res, fn) => {try {if (!(await adjust(req))) throw fail(403, 'Accounting adjustment authority required');await res.status(201).json(await fn());} catch (e) {await res.status(e.status || (/UNIQUE|constraint/i.test(e.message) ? 409 : 500)).json({ error: e.message });}};
  void 0;










  async function leaseState(a) {
    const init = await journal('Financing Lease Commencement', a.id);if (!(await posted(init))) throw fail(409, 'Posted unreversed lease commencement required');
    const commencement = await db.prepare("SELECT * FROM accounting_financing_lease_events_v356 WHERE financing_id=? AND event_type='Commencement'").get(a.id);if (!commencement || Number(commencement.journal_entry_id) !== Number(init.id)) throw fail(409, 'Lease commencement source mismatch');
    const events = await db.prepare("SELECT * FROM accounting_financing_lease_events_v356 WHERE financing_id=? ORDER BY id").all(a.id),mods = await db.prepare("SELECT * FROM accounting_financing_lease_modifications_v356 WHERE financing_id=? ORDER BY effective_date,id").all(a.id);
    if (await __async.some([...events.map((x) => x.journal_entry_id), ...mods.map((x) => x.journal_id)], async (id) => !(await posted(await db.prepare("SELECT * FROM accounting_journal_entries WHERE id=?").get(id))))) throw fail(409, 'Post or resolve all existing lease journal proposals first');
    if ((await db.prepare("SELECT id FROM accounting_financing_lease_closure_v356 WHERE financing_id=?").get(a.id)) || (await db.prepare("SELECT id FROM accounting_financing_lease_terminations_v356 WHERE financing_id=?").get(a.id))) throw fail(409, 'Lease already has a closure or termination proposal');
    const dep = round(events.filter((e) => e.event_type === 'Depreciation').reduce((n, e) => n + Number(e.amount_krw), 0));
    const gross = round(Number(commencement.amount_krw) + mods.reduce((n, m) => n + Number(m.delta_krw), 0));
    const liability = round(Number(a.opening_principal) + mods.reduce((n, m) => n + Number(m.delta_krw), 0));
    const reps = await db.prepare("SELECT r.*,f.verification_status,f.status finance_status,f.cash_effect FROM accounting_financing_repayments_v356 r JOIN finance_entries f ON f.id=r.finance_entry_id WHERE r.financing_id=?").all(a.id);
    if (await __async.some(reps, async (r) => r.verification_status !== 'Verified / Correct' || r.finance_status === 'Voided' || Number(r.cash_effect) !== -1 || !(await posted(await journal('Financing Repayment Reclassification', r.id))))) throw fail(409, 'Resolve all repayments and their Accounting postings first');
    const principal = round(reps.reduce((n, r) => n + Number(r.principal_krw), 0));
    const outstanding = round(liability - principal),net = round(gross - dep);
    if (outstanding < -.005 || net < -.005) throw fail(409, 'Lease amounts require controlled correction; negative liability or asset carrying value');
    return { commencement, events, mods, gross, dep, net, liability, outstanding, principal, repayments: reps };
  }
  await app.get('/api/accounting/financing-v356/:id/lease-lifecycle', auth, allow('accounting'), async (req, res) => {try {const a = await agree(req);await res.json({ agreement_no: a.agreement_no, modifications: await db.prepare("SELECT * FROM accounting_financing_lease_modifications_v356 WHERE financing_id=? ORDER BY id").all(a.id), termination: (await db.prepare("SELECT * FROM accounting_financing_lease_terminations_v356 WHERE financing_id=?").get(a.id)) || null, review_basis: 'Modifications are cash-neutral journal proposals; accounting state updates only after posting.' });} catch (e) {await res.status(e.status || 500).json({ error: e.message });}});
  await app.post('/api/accounting/financing-v356/:id/modify-lease', auth, allow('accounting'), async (req, res) => await write(req, res, async () => {
    const a = await agree(req),s = await leaseState(a),b = req.body || {},d = iso(b.effective_date),newValue = Number(b.revised_liability_krw),ref = String(b.lender_reference || '').trim(),policy = String(b.approved_policy || '').trim(),reason = String(b.reason || '').trim();
    if (!d || d < a.start_date || !Number.isFinite(newValue) || newValue < 0 || ref.length < 4 || policy.length < 8 || reason.length < 8) throw fail(400, 'Date, lender-approved revised liability, accounting policy and reason required');await guard(a, d);
    const latest = s.mods.at(-1);if (latest && d <= latest.effective_date) throw fail(409, 'Lease changes must be chronological');if (d < new Date().toISOString().slice(0, 10) && !String(b.historical_approval || '').trim()) throw fail(409, 'Historical modification requires explicit correction authorization');
    const delta = round(newValue - s.outstanding);if (Math.abs(delta) < .005) throw fail(409, 'No liability adjustment needed');if (delta < 0 && -delta > s.net + .005) throw fail(409, 'Reduction exceeds remaining asset carrying value; requires approved gain/loss measurement instead of automatic modification');
    const asset = await account(b.asset_account_id, 'Asset'),liab = await account(b.liability_account_id, 'Liability');if (asset.id !== Number(s.commencement.asset_account_id) || liab.id !== Number(s.commencement.contra_account_id)) throw fail(409, 'Modification must use the originally recognized lease asset and liability accounts');
    const lines = delta > 0 ? [{ account_id: asset.id, debit_krw: delta, credit_krw: 0 }, { account_id: liab.id, debit_krw: 0, credit_krw: delta }] : [{ account_id: liab.id, debit_krw: -delta, credit_krw: 0 }, { account_id: asset.id, debit_krw: 0, credit_krw: -delta }];
    return await db.atomic(async () => {const id = (await db.prepare("INSERT INTO accounting_financing_lease_modifications_v356(financing_id,effective_date,previous_liability_krw,new_liability_krw,delta_krw,asset_account_id,liability_account_id,journal_id,lender_reference,policy_reference,reason,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").run(a.id, d, s.outstanding, round(newValue), delta, asset.id, liab.id, -1, ref.slice(0, 120), policy.slice(0, 250), reason.slice(0, 500), req.user.id)).lastInsertRowid;const jid = await accounting.postJournal({ businessUnitId: a.business_unit_id, transactionDate: d, sourceType: 'Financing Lease Modification', sourceId: Number(id), sourceLabel: a.agreement_no, description: 'Lender-approved cash-neutral lease remeasurement; review future installment schedule separately', createdBy: req.user.id, lines });await db.prepare("UPDATE accounting_financing_lease_modifications_v356 SET journal_id=? WHERE id=?").run(jid, Number(id));await audit(req.user, 'accounting_financing', a.id, 'lease-modification-proposal', JSON.stringify({ journal_id: jid, delta_krw: delta, no_cash: true }));return { ok: true, journal_id: jid, status: 'Pending Review', no_cash_movement: true, schedule_revision_required: true };})();
  }));
  await app.post('/api/accounting/financing-v356/:id/terminate-lease', auth, allow('accounting'), async (req, res) => await write(req, res, async () => {
    const a = await agree(req),s = await leaseState(a),b = req.body || {},d = iso(b.termination_date),ref = String(b.lender_reference || '').trim(),policy = String(b.approved_policy || '').trim();if (!d || d < a.start_date || ref.length < 4 || policy.length < 8) throw fail(400, 'Termination date, lender clearance and approved disposal policy required');await guard(a, d);
    if (Math.abs(s.outstanding) > .005) throw fail(409, 'Remaining liability must first be settled through verified original Finance and posted Accounting; never invent a settlement payment');
    if (await db.prepare("SELECT id FROM accounting_financing_lease_deposits_v356 WHERE financing_id=?").get(a.id)) throw fail(409, 'Linked refundable deposit must be separately reconciled and settled through existing Finance/Accounting');
    const asset = await account(b.asset_account_id, 'Asset'),contra = await account(b.accumulated_depreciation_account_id, 'Asset'),loss = s.net > .005 ? await account(b.disposal_loss_account_id, 'Expense') : null;if (asset.id !== Number(s.commencement.asset_account_id) || asset.id === contra.id) throw fail(400, 'Use original asset and distinct accumulated depreciation account');
    const lines = [];if (s.dep > .005) lines.push({ account_id: contra.id, debit_krw: s.dep, credit_krw: 0 });if (s.net > .005) lines.push({ account_id: loss.id, debit_krw: s.net, credit_krw: 0 });lines.push({ account_id: asset.id, debit_krw: 0, credit_krw: s.gross });if (Math.abs(round(lines.reduce((n, x) => n + Number(x.debit_krw) - Number(x.credit_krw), 0))) > .005) throw fail(409, 'Termination proposal unbalanced');
    return await db.atomic(async () => {const id = (await db.prepare("INSERT INTO accounting_financing_lease_terminations_v356(financing_id,termination_date,gross_asset_krw,accumulated_depreciation_krw,disposal_loss_krw,journal_id,lender_reference,policy_reference,created_by) VALUES(?,?,?,?,?,?,?,?,?)").run(a.id, d, s.gross, s.dep, s.net, -1, ref.slice(0, 120), policy.slice(0, 250), req.user.id)).lastInsertRowid;const jid = await accounting.postJournal({ businessUnitId: a.business_unit_id, transactionDate: d, sourceType: 'Financing Lease Termination', sourceId: Number(id), sourceLabel: a.agreement_no, description: 'Lender-confirmed termination; asset derecognition, no Finance/bank entry', createdBy: req.user.id, lines });await db.prepare("UPDATE accounting_financing_lease_terminations_v356 SET journal_id=? WHERE id=?").run(jid, Number(id));await audit(req.user, 'accounting_financing', a.id, 'lease-termination-proposal', JSON.stringify({ journal_id: jid, disposal_loss_krw: s.net, no_new_cash: true }));return { ok: true, journal_id: jid, status: 'Pending Review', no_cash_movement: true, closed_only_after_posting: true };})();
  }));
}
module.exports = { install };
