'use strict';
// Read-only paged Pink Salt list APIs; actual settlement/ledger handlers remain in v313.
const __async = require("./postgres/collections");const bulk = require('./v348-pink-salt-bulk');
const SIZES = [25, 50, 100];
function paging(query, total) {const size = SIZES.includes(Number(query.pageSize)) ? Number(query.pageSize) : 25;
  const pages = Math.max(1, Math.ceil(total / size)),page = Math.min(pages, Math.max(1, Math.trunc(Number(query.page) || 1)));
  return { page, pageSize: size, page_size: size, pages, total, from: total ? (page - 1) * size + 1 : 0, to: Math.min(total, page * size) };
}
function clean(query) {return { search: String(query.search || '').trim().slice(0, 100), status: ['', 'Completed', 'Reserved', 'Cancelled'].includes(query.status) ? query.status : '', channel: String(query.channel || '').trim().slice(0, 40), type: String(query.type || '').trim().slice(0, 40) };}
const FINANCIAL_CTE = `WITH legacy AS (SELECT p.order_id,SUM(p.krw_amount) amt FROM pink_salt_customer_payments p JOIN pink_salt_orders o ON o.id=p.order_id WHERE o.business_unit_id=? AND p.status='Active' GROUP BY p.order_id),
 allocations AS (SELECT a.order_id,SUM(a.amount_krw) amt FROM pink_salt_customer_receipt_allocations_all a JOIN pink_salt_customer_receipts r ON r.id=a.receipt_id JOIN pink_salt_orders o ON o.id=a.order_id WHERE o.business_unit_id=? AND a.status='Active' AND r.status='Active' GROUP BY a.order_id),
 refunds AS (SELECT p.order_id,SUM(p.krw_amount) amt FROM pink_salt_customer_refunds p JOIN pink_salt_orders o ON o.id=p.order_id WHERE o.business_unit_id=? AND p.status='Active' GROUP BY p.order_id),
 amounts AS (SELECT o.*, GREATEST(0,COALESCE(l.amt,0)+COALESCE(a.amt,0)-COALESCE(r.amt,0)) paid FROM pink_salt_orders o LEFT JOIN legacy l ON l.order_id=o.id LEFT JOIN allocations a ON a.order_id=o.id LEFT JOIN refunds r ON r.order_id=o.id WHERE o.business_unit_id=?)`;
async function orderSummary(db, bu, today) {return await db.prepare(`${FINANCIAL_CTE} SELECT COUNT(*) total_orders,
 COALESCE(SUM(CASE WHEN status='Reserved' THEN 1 ELSE 0 END),0) open_orders,
 COALESCE(SUM(CASE WHEN status='Completed' THEN total_krw ELSE 0 END),0) sales_krw,
 COALESCE(SUM(CASE WHEN status='Completed' THEN gross_profit_krw ELSE 0 END),0) gross_profit_krw,
 COALESCE(SUM(CASE WHEN status='Completed' THEN GREATEST(0,total_krw-paid) ELSE 0 END),0) receivable_krw,
 COALESCE(SUM(CASE WHEN status='Completed' AND due_date<? THEN GREATEST(0,total_krw-paid) ELSE 0 END),0) overdue_krw
 FROM amounts`).get(bu, bu, bu, bu, today);}
async function customerSummary(db, bu, today) {const orders = await orderSummary(db, bu, today),receipts = await db.prepare(`SELECT COALESCE(SUM(GREATEST(0,r.gross_settlement_krw-COALESCE(a.used,0)-COALESCE((SELECT SUM(fx.amount_krw) FROM pink_fx_customer_refund_allocations fx WHERE fx.receipt_id=r.id AND fx.status='Active'),0))),0) credit FROM pink_salt_customer_receipts r LEFT JOIN (SELECT a.receipt_id,SUM(a.amount_krw) used FROM pink_salt_customer_receipt_allocations_all a JOIN pink_salt_customer_receipts r2 ON r2.id=a.receipt_id WHERE r2.business_unit_id=? AND r2.status='Active' AND a.status='Active' GROUP BY a.receipt_id) a ON a.receipt_id=r.id WHERE r.business_unit_id=? AND r.status='Active'`).get(bu, bu),total = (await db.prepare("SELECT COUNT(*) n FROM pink_salt_customers WHERE business_unit_id=?").get(bu)).n;
  return { customers: total, completed_orders: (await db.prepare("SELECT COUNT(*) n FROM pink_salt_orders WHERE business_unit_id=? AND status='Completed'").get(bu)).n, lifetime_sales_krw: orders.sales_krw, outstanding_krw: orders.receivable_krw, overdue_krw: orders.overdue_krw, unallocated_credit_krw: receipts.credit };
}
async function install({ app, db, auth, allow, currentUnit, enforceUnit }) {
  const getUnit = async (req, res) => {const pink = (await db.prepare("SELECT id FROM business_units WHERE lower(name) ILIKE '%pink%salt%' AND status!='Archived' ORDER BY id LIMIT 1").get())?.id,selected = Number(currentUnit(req) || 0);if (!pink) return await res.status(409).json({ error: 'Pink Salt business unit is not available.' }), null;if (selected !== Number(pink) || !enforceUnit(req, pink)) return await res.status(403).json({ error: "Select the Pink Salt business unit to use this workspace." }), null;return Number(pink);};
  try {void 0;


  } catch (e) {console.warn('V30.49 read indexes:', e.message);}
  await app.get('/api/v349/pink-salt/customers/page', auth, allow('sales', 'finance', 'dashboard'), async (req, res) => {try {const bu = await getUnit(req, res);if (!bu) return;const q = clean(req.query),w = ['business_unit_id=?'],a = [bu];
      if (q.search) {w.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)');a.push(...Array(3).fill('%' + q.search + '%'));}
      if (q.channel) {w.push('sales_channel=?');a.push(q.channel);}if (q.type) {w.push('customer_type=?');a.push(q.type);}if (req.query.activity !== 'All') {w.push('active=?');a.push(req.query.activity === 'Archived' ? 0 : 1);}
      const where = w.join(' AND '),total = (await db.prepare(`SELECT COUNT(*) n FROM pink_salt_customers WHERE ${where}`).get(...a)).n,p = paging(req.query, total);
      const selected = await db.prepare(`SELECT * FROM pink_salt_customers WHERE ${where} ORDER BY active DESC,name ,id LIMIT ? OFFSET ?`).all(...a, p.pageSize, (p.page - 1) * p.pageSize);
      await res.json({ rows: await bulk.customersBulk(db, bu, new Date().toISOString().slice(0, 10), selected), pagination: p, summary: await customerSummary(db, bu, new Date().toISOString().slice(0, 10)) });
    } catch (e) {await res.status(500).json({ error: 'Could not load customer page.' });}});
  await app.get('/api/v349/pink-salt/orders/page', auth, allow('sales', 'finance', 'dashboard', 'inventory'), async (req, res) => {try {const bu = await getUnit(req, res);if (!bu) return;const q = clean(req.query),w = ['o.business_unit_id=?'],a = [bu];
      if (q.search) {w.push('(o.order_no LIKE ? OR o.customer_name LIKE ? OR c.name LIKE ? OR o.reference LIKE ?)');a.push(...Array(4).fill('%' + q.search + '%'));}
      if (['Unpaid', 'Partially Paid', 'Paid'].includes(req.query.payment)) {w.push('o.id IN (' + FINANCIAL_CTE + " SELECT id FROM amounts WHERE CASE WHEN paid>=total_krw AND total_krw>0 THEN 'Paid' WHEN paid>0 THEN 'Partially Paid' ELSE 'Unpaid' END=?)");a.push(bu, bu, bu, bu, req.query.payment);}if (q.status) {w.push('o.status=?');a.push(q.status);}if (q.channel) {w.push('o.sales_channel=?');a.push(q.channel);}
      const from = "FROM pink_salt_orders o LEFT JOIN pink_salt_customers c ON c.id=o.customer_id AND c.business_unit_id=o.business_unit_id",where = w.join(' AND '),total = (await db.prepare(`SELECT COUNT(*) n ${from} WHERE ${where}`).get(...a)).n,p = paging(req.query, total);
      const orders = await db.prepare(`SELECT o.*,COALESCE(c.name,o.customer_name) customer,c.customer_type,c.pricing_tier ${from} WHERE ${where} ORDER BY o.order_date DESC,o.id DESC LIMIT ? OFFSET ?`).all(...a, p.pageSize, (p.page - 1) * p.pageSize);
      const financial = await bulk.financialsBulk(db, bu, orders, new Date().toISOString().slice(0, 10));await res.json({ rows: await __async.map(orders, async (o) => ({ ...o, ...(await financial.get(Number(o.id))) })), pagination: p, summary: await orderSummary(db, bu, new Date().toISOString().slice(0, 10)) });
    } catch (e) {await res.status(500).json({ error: 'Could not load order page.' });}});
  return { orderSummary, customerSummary };
}
module.exports = { install, paging, clean, orderSummary, customerSummary };
