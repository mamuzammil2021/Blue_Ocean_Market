'use strict';
const fs = require('fs'),path = require('path'),crypto = require('crypto');
const { launch } = require('./fixture.cjs');
async function fixture() {
  const launched = await launch();
  const { root, temp, env, child, base, login, db, password } = launched;
  await db.prepare("UPDATE users SET name='Synthetic QA CEO' WHERE email=?").run(env.ADMIN_EMAIL);
  const pink = (await db.prepare("SELECT id FROM business_units WHERE name='Pink Salt'").get()).id,excavator = (await db.prepare("SELECT id FROM business_units WHERE name='Excavator'").get())?.id;
  const ins = async (t, d) => Number((await db.prepare(`INSERT INTO ${t}(${Object.keys(d).join(',')}) VALUES(${Object.keys(d).map(() => '?').join(',')})`).run(...Object.values(d))).lastInsertRowid);
  const supplier = await ins('pink_salt_suppliers', { business_unit_id: pink, name: 'QA FX Supplier', country: 'Pakistan' }),customer = await ins('pink_salt_customers', { business_unit_id: pink, name: 'QA Customer' });
  const ledger = (await db.prepare("SELECT id FROM accounting_accounts WHERE system_key='BANK_KRW'").get())?.id || (await db.prepare("SELECT id FROM accounting_accounts WHERE system_key='CASH_ON_HAND'").get()).id;
  const accounts = {};for (const [k, currency, type] of [['krw', 'KRW', 'Bank'], ['usd', 'USD', 'Bank'], ['pkr', 'PKR', 'Bank'], ['cash', 'KRW', 'Cash'], ['inactive', 'KRW', 'Bank']]) accounts[k] = await ins('accounting_payment_accounts', { business_unit_id: pink, name: 'QA ' + k, payment_type: type, financial_account_type: type, currency, account_country: 'South Korea', ledger_account_id: ledger, active: k === 'inactive' ? 0 : 1, status: k === 'inactive' ? 'Inactive' : 'Active' });
  const receivers = {};for (const currency of ['KRW', 'USD', 'PKR']) receivers[currency] = await ins('counterparty_payment_accounts', { business_unit_id: pink, entity_type: 'pink_salt_supplier', entity_id: supplier, label: 'QA ' + currency, method_type: 'Bank', currency, bank_name: 'QA Bank', account_holder: 'Supplier', account_number: 'QA-0001', account_country: 'Pakistan', active: 1 });
  const makeImport = async (currency = 'USD', amount = 1000, rate = 1300) => {const id = await ins('pink_salt_imports', { business_unit_id: pink, supplier_id: supplier, supplier_name: 'QA FX Supplier', import_no: 'QA-IMP-' + crypto.randomBytes(5).toString('hex'), invoice_currency: currency, status: 'Ordered' });await ins('pink_salt_import_items', { import_id: id, salt_grade: 'Fine', bag_size_kg: 25, bag_count: 10, total_weight_kg: 250, unit_price_original: amount / 10, line_amount_original: amount, fx_rate_to_krw: rate, line_amount_krw: amount * rate, landed_cost_krw: amount * rate });return id;};
  const imports = [await makeImport(), await makeImport('KRW', 100000, 1)];
  const order = await ins('pink_salt_orders', { business_unit_id: pink, customer_id: customer, customer_name: 'QA Customer', order_no: 'QA-ORDER', sales_channel: 'Direct', order_date: new Date().toISOString().slice(0, 10), status: 'Completed', total_krw: 100000, payment_status: 'Unpaid' });
  const product = await ins('pink_salt_products', { business_unit_id: pink, sku: 'QA-FX-PRODUCT', name: 'QA FX Product', salt_grade: 'Fine', pack_weight_g: 500, selling_price_krw: 1000, active: 1 });await ins('pink_salt_finished_stock_movements', { business_unit_id: pink, product_id: product, movement_date: new Date().toISOString().slice(0, 10), movement_type: 'Opening', quantity_units: 100, unit_cost_krw: 500, reference_type: 'QA Opening', reference: 'QA-STOCK-OPENING' });
  const h = { Authorization: 'Bearer ' + login.token, 'x-business-unit-id': String(pink) };
  const api = async (method, url, data, extra = {}) => {const headers = { ...h, ...(method === 'POST' && /^\/api\/pink-salt\/(?:imports\/\d+\/(?:payments|costs)|orders\/\d+\/(?:payments|refunds)|suppliers\/\d+\/(?:advances|advance-refunds)|customers\/\d+\/receipts-v313)$/.test(url) ? { 'x-idempotency-key': crypto.randomUUID() } : {}), ...extra };let body;if (data instanceof FormData) body = data;else if (data !== undefined) {headers['Content-Type'] = 'application/json';body = JSON.stringify(data);}const r = await fetch(base + url, { method, headers, body });let j;try {j = await r.json();} catch (_) {j = {};}return { status: r.status, ok: r.ok, j };};
  const payment = (o = {}) => ({ settlement_mode: 'new', payment_method: 'Bank', payment_account_id: String(accounts.krw), receiver_account_id: String(receivers.USD), invoice_currency: 'USD', invoice_rate_to_krw: '1300', source_account_currency: 'KRW', amount_entry: 'recipient', recipient_expected_amount: '100', recipient_confirmed_amount: '100', source_debit_amount: '141000', bank_fx_rate: '1400', fx_rate_pair: 'USD/KRW', bank_quote_reference: 'QA-BANK-QUOTE', quote_source: 'QA evidenced bank confirmation', quote_time: new Date().toISOString(), source_fee_amount: '1000', transfer_fee_amount: '0', fee_policy: 'added_to_debit', company_rate_to_krw: '1', payment_date: new Date().toISOString().slice(0, 10), reference: 'QA-' + crypto.randomBytes(7).toString('hex'), idempotency_key: crypto.randomUUID(), ...o });
  const fd = (b) => {const f = new FormData();for (const [k, v] of Object.entries(b)) f.set(k, String(v));f.set('receipt', new Blob(['%PDF-1.4 QA SYNTHETIC bank debit, FX quote and recipient confirmation evidence'], { type: 'application/pdf' }), 'qa-bank.pdf');return f;};

  const clearImport = async id => {
    const row = await db.prepare("SELECT i.invoice_currency, SUM(x.line_amount_original) amount, SUM(x.line_amount_krw) krw FROM pink_salt_imports i JOIN pink_salt_import_items x ON x.import_id=i.id WHERE i.id=? GROUP BY i.id").get(id);
    const currency=row.invoice_currency, account=accounts[currency.toLowerCase()], amount=Number(row.amount),rate=Number(row.krw)/amount;
    if(!account)throw Error('QA payment account missing for '+currency);
    const recorded=await api('POST', '/api/pink-salt/fx/import/'+id+'/record',fd(payment({payment_account_id:String(account),receiver_account_id:String(receivers[currency]),invoice_currency:currency,invoice_rate_to_krw:String(rate),source_account_currency:currency,company_rate_to_krw:String(rate),recipient_expected_amount:String(amount),recipient_confirmed_amount:String(amount),source_debit_amount:String(amount),source_fee_amount:'0',bank_fx_rate:'1',fx_rate_pair:currency+'/'+currency})),{'x-ceo-confirmed':'1','x-ceo-confirmation-note':'Synthetic cleared receiving prerequisite'});
    if(!recorded.ok)throw Error('QA prerequisite settlement failed: '+JSON.stringify(recorded));
    const fid=recorded.j.transaction.finance_entry_id;
    await require('../payment-approval-fixture').authorizePolicy({api},fid);
    const verified=await api('PUT','/api/finance/'+fid+'/verify',{verification_status:'Verified / Correct',verification_note:'Synthetic cleared receiving prerequisite'});
    if(!verified.ok)throw Error('QA prerequisite verification failed: '+JSON.stringify(verified));
  };

  return { clearImport, product, pink, excavator, supplier, customer, accounts, receivers, imports, order, ins, api, payment, fd, makeImport, root, temp, env, child, base, login, db, get routes(){return launched.routes}, logs: launched.logs, password, close: launched.close, restart: launched.restart };
}
module.exports = { fixture };
