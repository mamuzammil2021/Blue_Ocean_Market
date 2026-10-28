'use strict';
// Reuse the platform's account-scoped normalization. No record details are disclosed.
const DUPLICATE = 'This reference is already used. Please enter a different reference.';
const REQUIRED = 'Payment reference is required.';
async function create({ db, normalizePaymentReference, financeLogicalPaymentIds }) {
  await db.atomic(async () => {
    if (!(await db.columns("pink_fx_transactions")).some((x) => x.name === 'reference_normalized')) void 0;
    const update = db.prepare("UPDATE pink_fx_transactions SET reference_normalized=? WHERE id=?");
    for (const x of await db.prepare("SELECT id,reference FROM pink_fx_transactions WHERE reference_normalized='' AND reference!=''").all()) await update.run(normalizePaymentReference(x.reference), x.id);
    const wanted = "CREATE UNIQUE INDEX idx_pink_fx_reference ON pink_fx_transactions(company_account_id,lower(trim(reference))) WHERE length(trim(reference,char(9)||char(10)||char(13)||' '))>0 AND status='Active'";
    if ((await db.prepare("SELECT sql FROM bom._relations WHERE name='idx_pink_fx_reference'").get())?.sql !== wanted) {void 0;void 0;}
    void 0;
    void 0;
  })();
  async function linkedIds(tx) {
    if (!tx) return [];
    const ids = await financeLogicalPaymentIds(tx.finance_entry_id);
    const source = { 'pink_salt_import_costs': 'Pink Salt Import Cost', 'pink_salt_import_payments': 'Pink Salt Import Payment', 'pink_salt_supplier_advances': 'Pink Salt Supplier Advance', 'pink_salt_supplier_advance_refunds': 'Pink Salt Supplier Advance Refund', 'pink_salt_customer_payments': 'Pink Salt Customer Payment', 'pink_salt_customer_refunds': 'Pink Salt Customer Refund', 'pink_salt_customer_receipts': 'Pink Salt Customer Receipt' }[tx.projection_table];
    for (const x of await db.prepare("SELECT id FROM finance_entries WHERE business_unit_id=? AND ((source_type='Pink Salt FX Payment' AND source_id=?) OR (source_type=? AND source_id=?))").all(tx.business_unit_id, tx.id, source || '', tx.projection_id || 0)) ids.push(...(await financeLogicalPaymentIds(x.id)));
    return [...new Set(ids)];
  }
  async function check({ accountId, reference, required = false, original = null, excludeFeeIds = [] }) {
    const value = String(reference || '').trim(),norm = normalizePaymentReference(value);
    if (!value) return { valid: !required, code: required ? 'PAYMENT_REFERENCE_REQUIRED' : '', message: required ? REQUIRED : '' };
    const exclude = [...(await linkedIds(original)), ...excludeFeeIds],clause = exclude.length ? ` AND id NOT IN (${exclude.map(() => '?').join(',')})` : '';
    const finance = norm && ((await db.prepare(`SELECT 1 FROM finance_entries WHERE payment_account_id=? AND reference_normalized=? AND COALESCE(status,'')!='Voided'${clause} LIMIT 1`).get(Number(accountId), norm, ...exclude)) || (await db.prepare(`SELECT reference FROM finance_entries WHERE payment_account_id=? AND COALESCE(reference_normalized,'')='' AND reference!='' AND COALESCE(status,'')!='Voided'${clause}`).all(Number(accountId), ...exclude)).some((r) => normalizePaymentReference(r.reference) === norm));
    const fx = await db.prepare("SELECT 1 FROM pink_fx_transactions WHERE company_account_id=? AND status='Active' AND id!=? AND ((?!='' AND reference_normalized=?) OR lower(trim(reference))=lower(trim(?))) LIMIT 1").get(Number(accountId), original?.id || 0, norm, norm, value);
    return finance || fx ? { valid: false, code: 'DUPLICATE_PAYMENT_REFERENCE', message: DUPLICATE } : { valid: true, code: '', message: '' };
  }
  async function assert(input) {const r = await check(input);if (!r.valid) throw Object.assign(new Error(r.message), { status: 409, code: r.code });return String(input.reference || '').trim();}
  return { check, assert, normalize: normalizePaymentReference, linkedIds };
}
function safeError(error) {
  const m = String(error?.message || '');
  if (error?.code === 'DUPLICATE_PAYMENT_REFERENCE' || /idx_pink_fx_reference|finance_entries\..*reference_normalized|Payment reference .*already used/i.test(m)) return { message: DUPLICATE, code: 'DUPLICATE_PAYMENT_REFERENCE' };
  if (String(error?.code || '').startsWith('SQLITE') || /SQLITE|constraint failed|no such (?:table|column)|syntax error/i.test(m)) return { message: 'The payment could not be saved. Please retry or contact your administrator.', code: 'PAYMENT_SAVE_FAILED' };
  return { message: m, code: error?.code || 'FX_VALIDATION' };
}
// Registered directly at synchronous legacy money-writing routes, not layered over handlers.
// Buffer the HTTP reply until source, Finance, Accounting, audit and idempotency writes commit.
function atomicLegacy(db, handler) {return async function (req, res) {
    const fs = require('fs'),crypto = require('crypto'),json = res.json;let pending = null,replayed = false;
    const cleanup = () => {if (req.file?.path) try {fs.unlinkSync(req.file.path);} catch (_) {}};
    res.json = function (payload) {pending = { payload, status: this.statusCode };return this;};
    try {
      await db.atomic(async () => {
        const service = req.app.locals.bomPinkFX;if (!service?.legacyReference) throw Object.assign(new Error('Payment service is unavailable. Please retry.'), { status: 503 });
        const key = String(req.headers['x-idempotency-key'] || req.body.idempotency_key || '').trim(),route = req.method + ' ' + req.path,body = { ...req.body };delete body.idempotency_key;if (!/^[\w:.-]{8,200}$/.test(key)) throw Object.assign(new Error('A unique idempotency key is required.'), { status: 400 });
        const hash = crypto.createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.keys(body).sort().map((k) => [k, body[k]])))).update(req.file?.path ? fs.readFileSync(req.file.path) : '').digest('hex');
        const scope = await service.legacyScope(req),prior = key ? await db.prepare("SELECT * FROM pink_legacy_payment_requests WHERE business_unit_id=? AND created_by=? AND route=? AND request_key=?").get(scope, req.user.id, route, key) : null;
        if (prior) {if (prior.payload_hash !== hash) throw Object.assign(new Error('Idempotency key was already used for different payment details.'), { status: 409 });pending = { payload: JSON.parse(prior.response_json), status: prior.response_status };replayed = true;return;}
        const historical = await db.prepare("SELECT 1 FROM request_idempotency WHERE idempotency_key=? AND user_id=? AND method=? AND request_path IN (?,?) LIMIT 1").get(key, req.user.id, req.method, req.path, req.path.replace(/^\/api/, ''));if (historical) throw Object.assign(new Error('This payment key belongs to an earlier request. Open the original record before trying again.'), { status: 409 });
        await service.legacyReference(req);await handler(req, res);
        if (!pending) throw new Error('Payment response was not completed.');
        if (pending.status >= 400) throw Object.assign(new Error(pending.payload.error || 'Payment could not be saved.'), { status: pending.status, code: pending.payload.code });
        if (key) await db.prepare("INSERT INTO pink_legacy_payment_requests(business_unit_id,created_by,route,request_key,payload_hash,response_json,response_status) VALUES(?,?,?,?,?,?,?)").run(scope, req.user.id, route, key, hash, JSON.stringify(pending.payload), pending.status);
      })();
      res.json = json;if (replayed) cleanup();return await res.status(pending.status).json(pending.payload);
    } catch (e) {res.json = json;cleanup();const safe = safeError(e);return await res.status(e.status || 409).json({ error: require('./pink-fx-errors').translate(safe.message, req.headers['x-language'] || req.user?.preferred_language || 'en'), code: safe.code });}
  };};
module.exports = { create, safeError, atomicLegacy, DUPLICATE, REQUIRED };
