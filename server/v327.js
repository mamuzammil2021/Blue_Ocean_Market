// Blue Ocean Market V30.27.0 — Pakistan resale subledger, settlements, country-scoped accounts and Pakistan→Korea transfers.
'use strict';

const VERSION = '30.27.0';

async function install(ctx) {
  const { app, db, auth, allow, audit, upload, financeSync, voidFinanceBySource, excavatorGuard } = ctx;
  const num = (v) => Number(v || 0) || 0;
  const text = (v) => String(v ?? '').trim();
  const round2 = (v) => Math.round((Number(v || 0) + Number.EPSILON) * 100) / 100;
  const addColumn = async (table, col, def) => {try {const cols = (await db.columns(table)).map((x) => x.name);if (!cols.includes(col)) void 0;} catch (e) {console.error('V30.27 migration', table, col, e.message);}};
  const normCountry = (v) => {const s = text(v).toLowerCase();if (['pakistan', 'pk'].includes(s)) return 'Pakistan';if (['south korea', 'korea', 'republic of korea', 'kr'].includes(s)) return 'South Korea';return text(v);};

  await addColumn('excavator_buyer_resale_shares', 'resale_date', 'TEXT');
  await addColumn('excavator_buyer_resale_shares', 'resale_status', "TEXT DEFAULT 'Active'");
  await addColumn('excavator_buyer_resale_shares', 'resale_evidence_file', "TEXT DEFAULT ''");
  await addColumn('excavator_buyer_resale_shares', 'resale_evidence_document_id', 'INTEGER');

  void 0;

































































































  async function buyerGuard(req, res) {
    const bu = await excavatorGuard(req, res);if (!bu) return null;
    const buyer = await db.prepare("SELECT * FROM excavator_buyers WHERE id=? AND business_unit_id=? AND active=1").get(req.params.id, bu);
    if (!buyer) {await res.status(404).json({ error: 'Buyer not found' });return null;}
    if (normCountry(buyer.country) !== 'Pakistan') {await res.status(403).json({ error: 'Pakistan Resales are available only for Pakistani buyers.' });return null;}
    return { bu, buyer };
  }
  async function pakistanBankAccount(id, bu, { requirePkr = true } = {}) {
    const a = await db.prepare(`SELECT p.*,a.active ledger_active,a.account_type ledger_type FROM accounting_payment_accounts p LEFT JOIN accounting_accounts a ON a.id=p.ledger_account_id WHERE p.id=?`).get(Number(id || 0));
    if (!a || Number(a.active || 0) !== 1 || text(a.status || 'Active') !== 'Active') throw new Error("Select an active configured Pakistan company bank account.");
    if (a.business_unit_id && Number(a.business_unit_id) !== Number(bu)) throw new Error('The selected Pakistan account belongs to another business unit.');
    if (text(a.financial_account_type || a.payment_type || 'Bank') !== 'Bank') throw new Error('Pakistan resale-profit receipts must use a configured Company Bank Account.');
    if (normCountry(a.account_country) !== 'Pakistan') throw new Error('Pakistan resale-profit receipts can be received only into accounts configured with Bank Country = Pakistan.');
    if (requirePkr && text(a.currency).toUpperCase() !== 'PKR') throw new Error('Pakistan resale-profit receipts must use a Pakistan account configured in PKR.');
    if (!a.ledger_account_id || Number(a.ledger_active || 0) !== 1 || text(a.ledger_type) !== 'Asset') throw new Error('The selected Pakistan bank account needs an active Asset GL mapping.');
    return a;
  }
  async function koreaBankAccount(id, bu) {
    const a = await db.prepare(`SELECT p.*,a.active ledger_active,a.account_type ledger_type FROM accounting_payment_accounts p LEFT JOIN accounting_accounts a ON a.id=p.ledger_account_id WHERE p.id=?`).get(Number(id || 0));
    if (!a || Number(a.active || 0) !== 1 || text(a.status || 'Active') !== 'Active') throw new Error("Select an active configured Korea company bank account.");
    if (a.business_unit_id && Number(a.business_unit_id) !== Number(bu)) throw new Error('The selected Korea account belongs to another business unit.');
    if (text(a.financial_account_type || a.payment_type || 'Bank') !== 'Bank') throw new Error('Pakistan-to-Korea transfers require a configured Company Bank Account.');
    if (normCountry(a.account_country) !== 'South Korea') throw new Error('Destination account must be configured with Bank Country = South Korea.');
    if (text(a.currency).toUpperCase() !== 'KRW') throw new Error('Destination Korea account must be configured in KRW for this transfer workflow.');
    if (!a.ledger_account_id || Number(a.ledger_active || 0) !== 1 || text(a.ledger_type) !== 'Asset') throw new Error('The selected Korea bank account needs an active Asset GL mapping.');
    return a;
  }
  async function activeAllocatedPkr(resaleId, excludePaymentId = 0) {let q = "SELECT COALESCE(SUM(amount_pkr),0) v FROM excavator_resale_profit_allocations WHERE resale_share_id=? AND status='Active'",args = [Number(resaleId)];if (excludePaymentId) {q += ' AND payment_id<>?';args.push(Number(excludePaymentId));}return num((await db.prepare(q).get(...args))?.v);}
  async function paymentAllocatedPkr(paymentId) {return num((await db.prepare("SELECT COALESCE(SUM(amount_pkr),0) v FROM excavator_resale_profit_allocations WHERE payment_id=? AND status='Active'").get(Number(paymentId)))?.v);}
  async function paymentRefundedPkr(paymentId) {const legacy = num((await db.prepare("SELECT COALESCE(SUM(amount_pkr),0) v FROM excavator_resale_profit_refunds WHERE payment_id=? AND status='Completed'").get(Number(paymentId)))?.v);let pooled = 0;try {pooled = num((await db.prepare("SELECT COALESCE(SUM(s.amount_pkr),0) v FROM excavator_resale_credit_refund_sources s JOIN excavator_resale_credit_refunds r ON r.id=s.refund_id WHERE s.payment_id=? AND r.status='Completed'").get(Number(paymentId)))?.v);} catch (_) {}return round2(legacy + pooled);}
  async function syncShareSettlement(resaleId) {
    const r = await db.prepare("SELECT * FROM excavator_buyer_resale_shares WHERE id=?").get(Number(resaleId));if (!r) return;
    const allocated = await activeAllocatedPkr(r.id),outstanding = Math.max(0, num(r.our_share_pkr) - allocated),received = allocated > 0 && outstanding <= 0.005 ? 1 : 0;
    const last = await db.prepare(`SELECT p.payment_date FROM excavator_resale_profit_allocations al JOIN excavator_resale_profit_payments p ON p.id=al.payment_id WHERE al.resale_share_id=? AND al.status='Active' AND p.status!='Voided' ORDER BY bom.utc_date(p.payment_date) DESC,p.id DESC LIMIT 1`).get(r.id);
    await db.prepare(`UPDATE excavator_buyer_resale_shares SET amount_received_pkr=?,outstanding_pkr=?,received=?,received_date=? WHERE id=?`).run(round2(allocated), round2(outstanding), received, last?.payment_date || null, r.id);
  }
  function resaleStatus(r) {if (text(r.resale_status) === 'Voided') return 'Voided';const received = num(r.allocated_pkr ?? r.amount_received_pkr),share = num(r.our_share_pkr);if (share <= 0.005) return 'No Share Due';if (received <= 0.005) return 'Share Due';if (received + 0.005 < share) return 'Partially Received';return 'Settled';}
  async function addBuyerDocument({ buyerId, assetId = null, title, file, userId }) {if (!file) return null;const d = await db.prepare(`INSERT INTO excavator_buyer_documents(buyer_id,asset_id,title,original_name,file_path,mime_type,size_bytes,uploaded_by) VALUES(?,?,?,?,?,?,?,?)`).run(buyerId, assetId, title, file.originalname, '/uploads/' + file.filename, file.mimetype, file.size, userId);return Number(d.lastInsertRowid);}
  async function validateAllocationSet({ buyerId, paymentId = 0, amountAvailable, allocations }) {
    const seen = new Set(),clean = [];let total = 0;
    for (const raw of allocations || []) {const resaleId = Number(raw.resale_share_id || raw.resale_id || 0),amount = round2(raw.amount_pkr);if (!resaleId || amount <= 0) continue;if (await seen.has(resaleId)) throw new Error('The same resale record cannot be allocated twice in one payment.');await seen.add(resaleId);
      const r = await db.prepare(`SELECT r.*,a.asset_no,a.machine_name FROM excavator_buyer_resale_shares r JOIN excavator_assets a ON a.id=r.asset_id WHERE r.id=? AND r.buyer_id=?`).get(resaleId, buyerId);if (!r || text(r.resale_status) === 'Voided') throw new Error('One of the selected resale records is not active for this buyer.');
      const available = Math.max(0, num(r.our_share_pkr) - (await activeAllocatedPkr(resaleId, paymentId)));if (amount > available + 0.005) throw new Error(`${r.asset_no || 'Machine'} allocation exceeds its current outstanding PKR ${round2(available).toLocaleString()}.`);total += amount;clean.push({ resale_share_id: resaleId, amount_pkr: amount });
    }
    if (total > num(amountAvailable) + 0.005) throw new Error(`Total resale allocation PKR ${round2(total).toLocaleString()} exceeds the payment amount available for allocation PKR ${round2(amountAvailable).toLocaleString()}.`);
    return { allocations: clean, total: round2(total) };
  }
  async function syncResalePaymentFinance(paymentId, userId, resetVerification = false) {
    const p = await db.prepare(`SELECT p.*,b.name buyer_name FROM excavator_resale_profit_payments p JOIN excavator_buyers b ON b.id=p.buyer_id WHERE p.id=?`).get(Number(paymentId));if (!p || text(p.status) === 'Voided' || text(p.status) === 'Legacy') return null;
    return await financeSync({ businessUnitId: p.business_unit_id, type: 'Revenue', category: 'Pakistan Resale Profit Share', amount: num(p.krw_amount), description: `Pakistan resale profit receipt · ${p.buyer_name || p.buyer_id}`, paymentMethod: p.method || 'Bank', reference: p.reference || '', paymentAccountId: p.payment_account_id || null, createdBy: userId || p.created_by, sourceType: 'Pakistan Resale Profit Payment', sourceId: p.id, receiptFile: p.receipt_file || '', originalAmount: p.amount_pkr, originalCurrency: 'PKR', fxRate: p.fx_rate_to_krw, transactionDate: p.payment_date, sourceLabel: 'Excavator → Pakistan Resale Profit Payment', sourceRecordId: p.buyer_id, sourcePaymentId: p.id, resetVerification });
  }

  // Preserve legacy resale settlements without inventing a bank account or accounting entry.
  try {
    const legacy = await db.prepare(`SELECT * FROM excavator_buyer_resale_shares WHERE COALESCE(amount_received_pkr,0)>0`).all();
    const insP = db.prepare(`INSERT INTO excavator_resale_profit_payments(buyer_id,business_unit_id,amount_pkr,fx_rate_to_krw,krw_amount,payment_date,method,reference,receipt_file,receipt_document_id,notes,status,legacy_resale_share_id,created_by) SELECT ?,b.business_unit_id,?,0,0,?,'Legacy Migration',?,?,?,'Migrated from pre-V30.27 resale settlement fields','Legacy',?,? FROM excavator_buyers b WHERE b.id=? ON CONFLICT DO NOTHING`);
    for (const r of legacy) {if (await db.prepare("SELECT id FROM excavator_resale_profit_payments WHERE legacy_resale_share_id=?").get(r.id)) continue;const pr = await insP.run(r.buyer_id, num(r.amount_received_pkr), r.received_date || r.created_at, r.reference || '', r.receipt_file || '', r.receipt_document_id || null, r.id, r.created_by || null, r.buyer_id);const pid = Number(pr.lastInsertRowid || (await db.prepare("SELECT id FROM excavator_resale_profit_payments WHERE legacy_resale_share_id=?").get(r.id))?.id || 0);if (pid && !(await db.prepare("SELECT id FROM excavator_resale_profit_allocations WHERE payment_id=? AND resale_share_id=?").get(pid, r.id))) await db.prepare(`INSERT INTO excavator_resale_profit_allocations(payment_id,resale_share_id,buyer_id,amount_pkr,fx_rate_to_krw,amount_krw,allocation_date,notes,status,created_by) VALUES(?,?,?,?,0,0,?,'Legacy migrated settlement','Active',?)`).run(pid, r.id, r.buyer_id, num(r.amount_received_pkr), r.received_date || r.created_at, r.created_by || null);await syncShareSettlement(r.id);}
  } catch (e) {console.error('V30.27 legacy resale settlement migration', e.message);}

  async function packageBuyerResales(buyer, bu) {
    const resales = (await db.prepare(`SELECT r.*,a.asset_no,a.machine_name,a.make,a.model,a.selling_price,a.lifecycle_stage,
      COALESCE((SELECT SUM(al.amount_pkr) FROM excavator_resale_profit_allocations al JOIN excavator_resale_profit_payments p ON p.id=al.payment_id WHERE al.resale_share_id=r.id AND al.status='Active' AND p.status!='Voided'),0) allocated_pkr
      FROM excavator_buyer_resale_shares r JOIN excavator_assets a ON a.id=r.asset_id WHERE r.buyer_id=? AND a.business_unit_id=? ORDER BY COALESCE(r.resale_date,r.created_at) DESC,r.id DESC`).all(buyer.id, bu)).map((r) => ({ ...r, allocated_pkr: round2(r.allocated_pkr), outstanding_pkr: round2(Math.max(0, num(r.our_share_pkr) - num(r.allocated_pkr))), settlement_status: resaleStatus(r) }));
    const payments = (await db.prepare(`SELECT p.*,a.name payment_account_name,a.account_country,a.currency account_currency,
      COALESCE((SELECT SUM(x.amount_pkr) FROM excavator_resale_profit_allocations x WHERE x.payment_id=p.id AND x.status='Active'),0) allocated_pkr,
      COALESCE((SELECT SUM(x.amount_pkr) FROM excavator_resale_profit_refunds x WHERE x.payment_id=p.id AND x.status='Completed'),0)+COALESCE((SELECT SUM(s.amount_pkr) FROM excavator_resale_credit_refund_sources s JOIN excavator_resale_credit_refunds rr ON rr.id=s.refund_id WHERE s.payment_id=p.id AND rr.status='Completed'),0) refunded_pkr
      FROM excavator_resale_profit_payments p LEFT JOIN accounting_payment_accounts a ON a.id=p.payment_account_id WHERE p.buyer_id=? ORDER BY bom.utc_date(p.payment_date) DESC,p.id DESC`).all(buyer.id)).map((p) => ({ ...p, allocated_pkr: round2(p.allocated_pkr), refunded_pkr: round2(p.refunded_pkr), unallocated_pkr: round2(Math.max(0, num(p.amount_pkr) - num(p.allocated_pkr) - num(p.refunded_pkr))), receipt_url: p.receipt_file ? '/uploads/' + p.receipt_file : '' }));
    const allocations = await db.prepare(`SELECT al.*,r.asset_id,a.asset_no,a.machine_name,p.reference,p.payment_date FROM excavator_resale_profit_allocations al JOIN excavator_resale_profit_payments p ON p.id=al.payment_id JOIN excavator_buyer_resale_shares r ON r.id=al.resale_share_id JOIN excavator_assets a ON a.id=r.asset_id WHERE al.buyer_id=? ORDER BY al.id DESC`).all(buyer.id);
    const refunds = (await db.prepare(`SELECT r.*,a.name payment_account_name FROM excavator_resale_profit_refunds r LEFT JOIN accounting_payment_accounts a ON a.id=r.payment_account_id WHERE r.buyer_id=? ORDER BY bom.utc_date(r.refund_date) DESC,r.id DESC`).all(buyer.id)).map((r) => ({ ...r, receipt_url: r.receipt_file ? '/uploads/' + r.receipt_file : '' }));
    for (const p of payments) {p.allocation_rows = allocations.filter((a) => Number(a.payment_id) === Number(p.id) && text(a.status) === 'Active');p.reversed_allocation_count = allocations.filter((a) => Number(a.payment_id) === Number(p.id) && text(a.status) === 'Reversed').length;p.refund_rows = refunds.filter((r) => Number(r.payment_id) === Number(p.id));}
    const sold = await db.prepare(`SELECT id,asset_no,machine_name,make,model,selling_price,lifecycle_stage FROM excavator_assets WHERE business_unit_id=? AND buyer_id=? AND lifecycle_stage='Sold / Completed' AND COALESCE(archived,0)=0 ORDER BY id DESC`).all(bu, buyer.id);
    const transfers = (await db.prepare(`SELECT t.*,f.name from_account_name,f.account_country from_country,ta.name to_account_name,ta.account_country to_country FROM excavator_resale_bank_transfers t JOIN accounting_payment_accounts f ON f.id=t.from_payment_account_id JOIN accounting_payment_accounts ta ON ta.id=t.to_payment_account_id WHERE t.business_unit_id=? ORDER BY bom.utc_date(t.transfer_date) DESC,t.id DESC LIMIT 100`).all(bu)).map((t) => ({ ...t, evidence_url: t.evidence_file ? '/uploads/' + t.evidence_file : '' }));
    const totalShare = resales.filter((r) => r.settlement_status !== 'Voided').reduce((n, r) => n + num(r.our_share_pkr), 0),allocated = resales.filter((r) => r.settlement_status !== 'Voided').reduce((n, r) => n + num(r.allocated_pkr), 0),unallocated = payments.filter((p) => p.status !== 'Voided').reduce((n, p) => n + num(p.unallocated_pkr), 0);
    return { buyer, resales, payments, allocations, refunds, sold_machines: sold, transfers, summary: { total_share_due_pkr: round2(totalShare), received_allocated_pkr: round2(allocated), outstanding_pkr: round2(Math.max(0, totalShare - allocated)), unallocated_credit_pkr: round2(unallocated), resold_machines: resales.filter((r) => r.settlement_status !== 'Voided').length, settled_machines: resales.filter((r) => r.settlement_status === 'Settled').length, partially_received: resales.filter((r) => r.settlement_status === 'Partially Received').length } };
  }

  await app.get('/api/v327/excavator/buyers/:id/pakistan-resales', auth, allow('dashboard', 'sales', 'finance', 'purchases'), async (req, res) => {const g = await buyerGuard(req, res);if (!g) return;await res.json(await packageBuyerResales(g.buyer, g.bu));});

  await app.post('/api/v327/excavator/buyers/:id/resales', auth, allow('sales', 'finance'), upload.single('evidence'), async (req, res) => {const g = await buyerGuard(req, res);if (!g) return;try {const assetId = Number(req.body.asset_id || 0),date = text(req.body.resale_date),price = round2(req.body.resale_price_pkr),profit = round2(req.body.resale_profit_pkr),pct = round2(req.body.share_percent);if (!assetId) throw new Error('Sold Machine is required.');if (!date) throw new Error('Resale Date is required.');if (price <= 0) throw new Error('Machine Resale Price (PKR) must be greater than zero.');if (profit < 0) throw new Error('Resale Profit (PKR) cannot be negative.');if (pct < 0 || pct > 100) throw new Error('Our Share % must be between 0 and 100.');const asset = await db.prepare("SELECT * FROM excavator_assets WHERE id=? AND business_unit_id=? AND buyer_id=? AND lifecycle_stage='Sold / Completed'").get(assetId, g.bu, g.buyer.id);if (!asset) throw new Error("Select a sold machine that belongs to this buyer.");if (await db.prepare("SELECT id FROM excavator_buyer_resale_shares WHERE buyer_id=? AND asset_id=? AND COALESCE(resale_status,'Active')!='Voided'").get(g.buyer.id, assetId)) throw new Error('An active Pakistan resale record already exists for this machine.');const share = round2(profit * pct / 100);const r = await db.prepare(`INSERT INTO excavator_buyer_resale_shares(buyer_id,asset_id,resale_date,resale_price_pkr,resale_profit_pkr,share_percent,our_share_pkr,amount_received_pkr,outstanding_pkr,received,notes,resale_status,created_by,resale_evidence_file) VALUES(?,?,?,?,?,?,?,?,?,0,?,'Active',?,?)`).run(g.buyer.id, assetId, date, price, profit, pct, share, 0, share, text(req.body.notes), req.user.id, req.file?.filename || '');let docId = null;if (req.file) {docId = await addBuyerDocument({ buyerId: g.buyer.id, assetId, title: 'Pakistan Resale Evidence', file: req.file, userId: req.user.id });await db.prepare("UPDATE excavator_buyer_resale_shares SET resale_evidence_document_id=? WHERE id=?").run(docId, r.lastInsertRowid);}await audit(req.user, 'excavator_pakistan_resale', r.lastInsertRowid, 'create-v327', JSON.stringify({ buyer_id: g.buyer.id, asset_id: assetId, resale_date: date, resale_price_pkr: price, resale_profit_pkr: profit, share_percent: pct, our_share_pkr: share }));await res.json({ ok: true, id: Number(r.lastInsertRowid), our_share_pkr: share, evidence_document_id: docId });} catch (e) {await res.status(400).json({ error: e.message });}});

  app.put('/api/v327/excavator/buyers/:id/resales/:rid', auth, allow('sales', 'finance'), upload.single('evidence'), async (req, res) => {const g = await buyerGuard(req, res);if (!g) return;try {const old = await db.prepare("SELECT * FROM excavator_buyer_resale_shares WHERE id=? AND buyer_id=?").get(req.params.rid, g.buyer.id);if (!old) throw new Error('Pakistan resale record not found.');if (text(old.resale_status) === 'Voided') throw new Error('Voided resale records cannot be edited.');const date = text(req.body.resale_date || old.resale_date),price = round2(req.body.resale_price_pkr ?? old.resale_price_pkr),profit = round2(req.body.resale_profit_pkr ?? old.resale_profit_pkr),pct = round2(req.body.share_percent ?? old.share_percent),share = round2(profit * pct / 100);if (!date) throw new Error('Resale Date is required.');if (price <= 0) throw new Error('Machine Resale Price (PKR) must be greater than zero.');if (profit < 0) throw new Error('Resale Profit (PKR) cannot be negative.');if (pct < 0 || pct > 100) throw new Error('Our Share % must be between 0 and 100.');const allocated = await activeAllocatedPkr(old.id);if (share + 0.005 < allocated) throw new Error(`Our Share Amount cannot be reduced below already allocated payments (PKR ${round2(allocated).toLocaleString()}). Reallocate or reverse settlements first.`);await db.prepare(`UPDATE excavator_buyer_resale_shares SET resale_date=?,resale_price_pkr=?,resale_profit_pkr=?,share_percent=?,our_share_pkr=?,outstanding_pkr=?,notes=?,resale_evidence_file=CASE WHEN ?<>'' THEN ? ELSE resale_evidence_file END WHERE id=?`).run(date, price, profit, pct, share, Math.max(0, share - allocated), text(req.body.notes ?? old.notes), req.file?.filename || '', req.file?.filename || '', old.id);let docId = old.resale_evidence_document_id || null;if (req.file) {docId = await addBuyerDocument({ buyerId: g.buyer.id, assetId: old.asset_id, title: 'Pakistan Resale Evidence', file: req.file, userId: req.user.id });await db.prepare("UPDATE excavator_buyer_resale_shares SET resale_evidence_document_id=? WHERE id=?").run(docId, old.id);}await syncShareSettlement(old.id);await audit(req.user, 'excavator_pakistan_resale', old.id, "update-v327", JSON.stringify({ resale_date: date, resale_price_pkr: price, resale_profit_pkr: profit, share_percent: pct, our_share_pkr: share, evidence_uploaded: !!req.file }));await res.json({ ok: true, our_share_pkr: share, evidence_document_id: docId });} catch (e) {await res.status(400).json({ error: e.message });}});

  await app.post('/api/v327/excavator/buyers/:id/resales/:rid/void', auth, allow('sales', 'finance'), async (req, res) => {const g = await buyerGuard(req, res);if (!g) return;try {const r = await db.prepare("SELECT * FROM excavator_buyer_resale_shares WHERE id=? AND buyer_id=?").get(req.params.rid, g.buyer.id);if (!r) throw new Error('Pakistan resale record not found.');const allocated = await activeAllocatedPkr(r.id);if (allocated > 0.005) throw new Error('This resale record has active payment allocations. Reallocate or reverse those settlements before voiding the resale record.');const reason = text(req.body.reason);if (!reason) throw new Error('Void reason is required.');await db.prepare("UPDATE excavator_buyer_resale_shares SET resale_status='Voided',notes=COALESCE(notes,'')||? WHERE id=?").run(` | Voided: ${reason}`, r.id);await audit(req.user, 'excavator_pakistan_resale', r.id, 'void-v327', reason);await res.json({ ok: true });} catch (e) {await res.status(400).json({ error: e.message });}});

  function parseAllocations(raw) {if (Array.isArray(raw)) return raw;try {return JSON.parse(raw || '[]');} catch (_) {throw new Error('Payment allocations are invalid.');}}

  await app.post('/api/v327/excavator/buyers/:id/resale-payments', auth, allow('sales', 'finance'), upload.single('receipt'), async (req, res) => {
    const g = await buyerGuard(req, res);if (!g) return;
    try {
      const amount = round2(req.body.amount_pkr),fx = num(req.body.fx_rate_to_krw),date = text(req.body.payment_date),reference = text(req.body.reference),account = await pakistanBankAccount(req.body.payment_account_id, g.bu);
      if (amount <= 0) throw new Error('Payment Amount (PKR) must be greater than zero.');
      if (fx <= 0) throw new Error('FX Rate to KRW must be greater than zero.');
      if (!date) throw new Error('Payment Date is required.');
      if (!reference) throw new Error('Payment Reference is required for Pakistan bank receipts.');
      if (!req.file) throw new Error('Receipt / evidence is mandatory for Pakistan resale-profit payments.');
      const validated = await validateAllocationSet({ buyerId: g.buyer.id, amountAvailable: amount, allocations: parseAllocations(req.body.allocations) }),krw = round2(amount * fx);
      const out = await db.atomic(async () => {
        const p = await db.prepare(`INSERT INTO excavator_resale_profit_payments(buyer_id,business_unit_id,amount_pkr,fx_rate_to_krw,krw_amount,payment_date,method,reference,payment_account_id,receipt_file,notes,status,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,'Active',?)`).run(g.buyer.id, g.bu, amount, fx, krw, date, text(req.body.method || 'Bank') || 'Bank', reference, account.id, req.file.filename, text(req.body.notes), req.user.id),pid = Number(p.lastInsertRowid);
        const docId = await addBuyerDocument({ buyerId: g.buyer.id, title: 'Pakistan Resale Profit Payment Receipt / Evidence', file: req.file, userId: req.user.id });
        await db.prepare("UPDATE excavator_resale_profit_payments SET receipt_document_id=? WHERE id=?").run(docId, pid);
        const ins = db.prepare(`INSERT INTO excavator_resale_profit_allocations(payment_id,resale_share_id,buyer_id,amount_pkr,fx_rate_to_krw,amount_krw,allocation_date,notes,status,created_by) VALUES(?,?,?,?,?,?,?,'Initial resale-profit payment allocation','Active',?)`);
        for (const a of validated.allocations) await ins.run(pid, a.resale_share_id, g.buyer.id, a.amount_pkr, fx, round2(a.amount_pkr * fx), date, req.user.id);
        for (const a of validated.allocations) await syncShareSettlement(a.resale_share_id);
        // Keep operational receipt + Finance source atomic. A duplicate bank reference or Finance
        // validation error must not leave an orphan resale receipt that the user was told failed.
        const financeId = await syncResalePaymentFinance(pid, req.user.id, false);
        return { pid, docId, financeId };
      })();
      await audit(req.user, 'excavator_resale_profit_payment', out.pid, 'create-v327', JSON.stringify({ buyer_id: g.buyer.id, amount_pkr: amount, allocated_pkr: validated.total, unallocated_pkr: round2(amount - validated.total), payment_account_id: account.id, finance_id: out.financeId }));
      await res.json({ ok: true, payment_id: out.pid, finance_id: out.financeId, allocated_pkr: validated.total, unallocated_pkr: round2(amount - validated.total), receipt_document_id: out.docId });
    } catch (e) {await res.status(e.status || 400).json({ error: e.message, code: e.code });}
  });

  app.put('/api/v327/excavator/buyers/:id/resale-payments/:pid/allocations', auth, allow('sales', 'finance'), async (req, res) => {
    const g = await buyerGuard(req, res);if (!g) return;
    try {
      const pmt = await db.prepare("SELECT * FROM excavator_resale_profit_payments WHERE id=? AND buyer_id=?").get(req.params.pid, g.buyer.id);if (!pmt) throw new Error('Resale-profit payment not found.');if (text(pmt.status) !== 'Active') throw new Error('Only active resale-profit payments can be reallocated.');
      const reason = text(req.body.reason);if (!reason) throw new Error('Reallocation reason is required.');
      const refunded = await paymentRefundedPkr(pmt.id),capacity = Math.max(0, num(pmt.amount_pkr) - refunded),validated = await validateAllocationSet({ buyerId: g.buyer.id, paymentId: pmt.id, amountAvailable: capacity, allocations: parseAllocations(req.body.allocations) }),before = await db.prepare("SELECT * FROM excavator_resale_profit_allocations WHERE payment_id=? AND status='Active'").all(pmt.id),touched = new Set(before.map((x) => Number(x.resale_share_id)));
      const financeId = await db.atomic(async () => {
        await db.prepare("UPDATE excavator_resale_profit_allocations SET status='Reversed',void_reason=?,voided_by=?,voided_at=bom.utc_now() WHERE payment_id=? AND status='Active'").run(reason, req.user.id, pmt.id);
        const ins = db.prepare(`INSERT INTO excavator_resale_profit_allocations(payment_id,resale_share_id,buyer_id,amount_pkr,fx_rate_to_krw,amount_krw,allocation_date,notes,status,created_by) VALUES(?,?,?,?,?,?,?,?,'Active',?)`);
        for (const a of validated.allocations) {await ins.run(pmt.id, a.resale_share_id, g.buyer.id, a.amount_pkr, pmt.fx_rate_to_krw, round2(a.amount_pkr * num(pmt.fx_rate_to_krw)), new Date().toISOString().slice(0, 10), `Reallocated: ${reason}`, req.user.id);await touched.add(a.resale_share_id);}
        for (const id of touched) await syncShareSettlement(id);
        return await syncResalePaymentFinance(pmt.id, req.user.id, true);
      })();
      await audit(req.user, 'excavator_resale_profit_payment', pmt.id, 'reallocate-v327', JSON.stringify({ reason, before: before.map((x) => ({ resale_share_id: x.resale_share_id, amount_pkr: x.amount_pkr })), after: validated.allocations, finance_id: financeId }));
      await res.json({ ok: true, allocated_pkr: validated.total, unallocated_pkr: round2(capacity - validated.total), finance_id: financeId, finance_reverification_required: true });
    } catch (e) {await res.status(e.status || 400).json({ error: e.message, code: e.code });}
  });

  await app.post('/api/v327/excavator/buyers/:id/resale-payments/:pid/refund', auth, allow('finance'), upload.single('receipt'), async (req, res) => {
    const g = await buyerGuard(req, res);if (!g) return;
    try {
      const pmt = await db.prepare("SELECT * FROM excavator_resale_profit_payments WHERE id=? AND buyer_id=?").get(req.params.pid, g.buyer.id);if (!pmt || text(pmt.status) !== 'Active') throw new Error('Active resale-profit payment not found.');
      const available = Math.max(0, num(pmt.amount_pkr) - (await paymentAllocatedPkr(pmt.id)) - (await paymentRefundedPkr(pmt.id))),amount = round2(req.body.amount_pkr),fx = num(req.body.fx_rate_to_krw || pmt.fx_rate_to_krw),date = text(req.body.refund_date),reference = text(req.body.reference),reason = text(req.body.reason),account = await pakistanBankAccount(req.body.payment_account_id, g.bu);
      if (amount <= 0 || amount > available + 0.005) throw new Error(`Refund must be greater than zero and cannot exceed unallocated resale credit PKR ${round2(available).toLocaleString()}.`);
      if (fx <= 0) throw new Error('FX Rate to KRW must be greater than zero.');if (!date) throw new Error('Refund Date is required.');if (!reference) throw new Error('Refund Reference is required.');if (!reason) throw new Error('Refund reason is required.');if (!req.file) throw new Error('Refund evidence / receipt is required.');
      const krw = round2(amount * fx);
      const out = await db.atomic(async () => {
        const r = await db.prepare(`INSERT INTO excavator_resale_profit_refunds(payment_id,buyer_id,business_unit_id,amount_pkr,fx_rate_to_krw,krw_amount,refund_date,method,reference,payment_account_id,receipt_file,reason,status,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?, 'Completed',?)`).run(pmt.id, g.buyer.id, g.bu, amount, fx, krw, date, 'Bank', reference, account.id, req.file.filename, reason, req.user.id),rid = Number(r.lastInsertRowid);
        const financeId = await financeSync({ businessUnitId: g.bu, type: 'Expense', category: 'Pakistan Resale Profit Refund', amount: krw, description: `Refund Pakistan resale unallocated credit · ${g.buyer.name}`, paymentMethod: 'Bank', reference, paymentAccountId: account.id, createdBy: req.user.id, sourceType: 'Pakistan Resale Profit Refund', sourceId: rid, receiptFile: req.file.filename, originalAmount: amount, originalCurrency: 'PKR', fxRate: fx, transactionDate: date, sourceLabel: 'Excavator → Pakistan Resale Profit Refund', sourceRecordId: g.buyer.id, sourcePaymentId: pmt.id, receiverAccountId: Number(req.body.receiver_account_id || 0), receiverEntityType: 'excavator_buyer', receiverEntityId: g.buyer.id, receiverName: g.buyer.name });
        return { rid, financeId };
      })();
      await audit(req.user, 'excavator_resale_profit_refund', out.rid, 'create-v327', JSON.stringify({ payment_id: pmt.id, amount_pkr: amount, finance_id: out.financeId }));
      await res.json({ ok: true, refund_id: out.rid, finance_id: out.financeId, remaining_unallocated_pkr: round2(available - amount) });
    } catch (e) {await res.status(e.status || 400).json({ error: e.message, code: e.code });}
  });

  await app.post('/api/v327/excavator/buyers/:id/resale-payments/:pid/void', auth, allow('finance'), async (req, res) => {
    const g = await buyerGuard(req, res);if (!g) return;
    try {
      const pmt = await db.prepare("SELECT * FROM excavator_resale_profit_payments WHERE id=? AND buyer_id=?").get(req.params.pid, g.buyer.id);if (!pmt || text(pmt.status) !== 'Active') throw new Error('Active resale-profit payment not found.');if ((await paymentRefundedPkr(pmt.id)) > 0.005) throw new Error('This payment has completed refunds. Reverse/correct those refund records before voiding the original receipt.');
      const reason = text(req.body.reason);if (!reason) throw new Error('Void reason is required.');const touched = (await db.prepare("SELECT DISTINCT resale_share_id FROM excavator_resale_profit_allocations WHERE payment_id=? AND status='Active'").all(pmt.id)).map((x) => x.resale_share_id);
      await db.atomic(async () => {
        await db.prepare("UPDATE excavator_resale_profit_allocations SET status='Reversed',void_reason=?,voided_by=?,voided_at=bom.utc_now() WHERE payment_id=? AND status='Active'").run(reason, req.user.id, pmt.id);
        await db.prepare("UPDATE excavator_resale_profit_payments SET status='Voided',void_reason=?,voided_by=?,voided_at=bom.utc_now(),updated_at=bom.utc_now() WHERE id=?").run(reason, req.user.id, pmt.id);
        for (const id of touched) await syncShareSettlement(id);
        await voidFinanceBySource('Pakistan Resale Profit Payment', pmt.id, reason, req.user.id, g.bu);
      })();
      await audit(req.user, 'excavator_resale_profit_payment', pmt.id, 'void-v327', reason);await res.json({ ok: true, voided: true });
    } catch (e) {await res.status(e.status || 400).json({ error: e.message, code: e.code });}
  });

  await app.post('/api/v327/excavator/resale-bank-transfers', auth, allow('finance'), upload.single('evidence'), async (req, res) => {
    const bu = await excavatorGuard(req, res);if (!bu) return;
    try {
      const from = await pakistanBankAccount(req.body.from_payment_account_id, bu),to = await koreaBankAccount(req.body.to_payment_account_id, bu);if (Number(from.id) === Number(to.id)) throw new Error('Source and destination bank accounts must be different.');
      const source = round2(req.body.source_amount_pkr),fx = num(req.body.fx_rate_to_krw),destination = round2(req.body.destination_amount_krw),feePkr = round2(req.body.bank_fee_pkr),date = text(req.body.transfer_date),reference = text(req.body.reference);
      if (source <= 0) throw new Error('Source Amount (PKR) must be greater than zero.');if (fx <= 0) throw new Error('FX Rate to KRW must be greater than zero.');if (destination <= 0) throw new Error('Destination Amount (KRW) must be greater than zero.');if (feePkr < 0 || feePkr > source) throw new Error('Bank Fee (PKR) must be between zero and the source amount.');if (!date) throw new Error('Transfer Date is required.');if (!reference) throw new Error('Transfer Reference is required.');if (!req.file) throw new Error('Transfer evidence is required.');
      if (await db.prepare("SELECT id FROM excavator_resale_bank_transfers WHERE from_payment_account_id=? AND lower(trim(reference))=lower(trim(?)) AND status='Active' LIMIT 1").get(from.id, reference)) throw new Error('This transfer reference is already active on the selected Pakistan bank account.');
      const sourceKrw = round2(source * fx),feeKrw = round2(feePkr * fx);
      const out = await db.atomic(async () => {
        const r = await db.prepare(`INSERT INTO excavator_resale_bank_transfers(business_unit_id,from_payment_account_id,to_payment_account_id,source_amount_pkr,fx_rate_to_krw,source_krw_equivalent,destination_amount_krw,bank_fee_pkr,bank_fee_krw,transfer_date,reference,evidence_file,notes,status,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,'Active',?)`).run(bu, from.id, to.id, source, fx, sourceKrw, destination, feePkr, feeKrw, date, reference, req.file.filename, text(req.body.notes), req.user.id),tid = Number(r.lastInsertRowid);
        const financeId = await financeSync({ businessUnitId: bu, type: 'Transfer', category: 'Pakistan to Korea Bank Transfer', amount: sourceKrw, description: `Pakistan → Korea bank transfer · ${from.name} → ${to.name}`, paymentMethod: 'Bank Transfer', reference, paymentAccountId: from.id, createdBy: req.user.id, sourceType: 'Pakistan Resale Bank Transfer', sourceId: tid, receiptFile: req.file.filename, originalAmount: source, originalCurrency: 'PKR', fxRate: fx, transactionDate: date, sourceLabel: 'Finance → Pakistan to Korea Bank Transfer', sourceRecordId: tid, sourcePaymentId: tid });
        return { tid, financeId };
      })();
      await audit(req.user, 'pakistan_korea_bank_transfer', out.tid, 'create-v327', JSON.stringify({ from_account_id: from.id, to_account_id: to.id, source_amount_pkr: source, destination_amount_krw: destination, fee_pkr: feePkr, finance_id: out.financeId }));
      await res.json({ ok: true, transfer_id: out.tid, finance_id: out.financeId, source_krw_equivalent: sourceKrw, bank_fee_krw: feeKrw });
    } catch (e) {await res.status(e.status || 400).json({ error: e.message, code: e.code });}
  });

  await app.post('/api/v327/excavator/resale-bank-transfers/:tid/void', auth, allow('finance'), async (req, res) => {
    const bu = await excavatorGuard(req, res);if (!bu) return;
    try {
      const tr = await db.prepare("SELECT * FROM excavator_resale_bank_transfers WHERE id=? AND business_unit_id=? AND status='Active'").get(req.params.tid, bu);if (!tr) throw new Error('Active Pakistan-to-Korea transfer not found.');const reason = text(req.body.reason);if (!reason) throw new Error('Void reason is required.');
      await db.atomic(async () => {await db.prepare("UPDATE excavator_resale_bank_transfers SET status='Voided',void_reason=?,voided_by=?,voided_at=bom.utc_now() WHERE id=?").run(reason, req.user.id, tr.id);await voidFinanceBySource('Pakistan Resale Bank Transfer', tr.id, reason, req.user.id, bu);})();
      await audit(req.user, 'pakistan_korea_bank_transfer', tr.id, 'void-v327', reason);await res.json({ ok: true, voided: true });
    } catch (e) {await res.status(e.status || 400).json({ error: e.message, code: e.code });}
  });

  console.info('Blue Ocean Market V30.27.0 Pakistan resale subledger installed');
  return { VERSION, normCountry, syncShareSettlement };
}

module.exports = { install, VERSION };
