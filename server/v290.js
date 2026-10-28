const __async = require("./postgres/collections");const crypto = require('crypto');
const { createIntegrityUpload } = require('./upload-integrity');
const numbering = require('./numbering-service');

const VERSION = '29.1.0';

async function install({ app, db, auth, allow, currentUnit, enforceUnit, isFinanceReviewer, audit, notify, uploads, hasAccess, upload: sharedUpload, financeSync, voidFinanceBySource }) {
  const upload = sharedUpload || createIntegrityUpload(uploads, { fileSize: 20 * 1024 * 1024 });
  const nowDate = () => new Date().toISOString().slice(0, 10);
  const num = (v) => Number(v || 0);
  const text = (v) => String(v ?? '').trim();
  const money = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const hash = (v) => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
  const dateOnly = (v) => String(v || '').slice(0, 10);
  const periodKey = (v) => dateOnly(v || nowDate()).slice(0, 7);
  const nextNo = async (prefix, table) => {void 0;const year = new Date().getFullYear(),key = `${table}:${prefix}`,baseline = Number((await db.prepare(`SELECT COUNT(*) c FROM ${table}`).get()).c || 0),row = await db.prepare(`INSERT INTO number_sequences(sequence_key,year,last_value,updated_at) VALUES(?,?,?+1,bom.utc_now()) ON CONFLICT(sequence_key,year) DO UPDATE SET last_value=number_sequences.last_value+1,updated_at=bom.utc_now() RETURNING last_value`).get(key, year, baseline);return `${prefix}-${year}-${String(Number(row?.last_value || baseline + 1)).padStart(6, '0')}`;};
  const columnExists = async (table, col) => (await db.columns(table)).some((x) => x.name === col);
  const ensureColumn = async (table, col, def) => {if (!(await columnExists(table, col))) {try {void 0;} catch (e) {console.error('V29 column', table, col, e.message);}}};

  // ---------------------------------------------------------------------------
  // Schema: one company accounting engine, business-unit dimensions, payroll.
  // ---------------------------------------------------------------------------
  void 0;




















































































































































































































































































































































































































  await ensureColumn('finance_entries', 'payment_account_id', 'INTEGER');
  await ensureColumn('finance_entries', 'accounting_status', "TEXT DEFAULT 'Pending'");
  await ensureColumn('finance_entries', 'accounting_journal_id', 'INTEGER');
  await ensureColumn('accounting_inter_unit_transfers', 'from_payment_account_id', 'INTEGER');
  await ensureColumn('accounting_inter_unit_transfers', 'to_payment_account_id', 'INTEGER');
  await ensureColumn('payroll_runs', 'total_paid_krw', 'REAL DEFAULT 0');
  await ensureColumn('payroll_runs', 'outstanding_krw', 'REAL DEFAULT 0');
  await ensureColumn('employee_advances', 'finance_entry_id', 'INTEGER');
  await ensureColumn('payroll_run_items', 'advance_balance_before_krw', 'REAL DEFAULT 0');
  await ensureColumn('payroll_run_items', 'scheduled_advance_recovery_krw', 'REAL DEFAULT 0');
  await ensureColumn('payroll_run_items', 'advance_balance_after_krw', 'REAL DEFAULT 0');
  await ensureColumn('payroll_run_items', 'advance_recovery_method_snapshot', "TEXT DEFAULT 'Manual'");
  await ensureColumn('payroll_run_items', 'advance_recovery_value_snapshot', 'REAL DEFAULT 0');
  await ensureColumn('payroll_run_items', 'advance_recovery_exception', "TEXT DEFAULT ''");
  await ensureColumn('payroll_run_items', 'advance_recovery_reason', "TEXT DEFAULT ''");
  void 0;

































  await ensureColumn('payroll_run_items', 'paid_krw', 'REAL DEFAULT 0');
  await ensureColumn('payroll_run_items', 'outstanding_krw', 'REAL DEFAULT 0');

  // Queue every finance mutation for accounting synchronization.
  try {void 0;








  } catch (e) {console.error('V29 finance triggers:', e.message);}

  const SYSTEM_ACCOUNTS = [
  ['1000', 'Cash / Bank Clearing', 'Asset', 'Cash & Bank', 'Debit', 'BANK_CLEARING', 1],
  ['1010', 'Cash on Hand', 'Asset', 'Cash & Bank', 'Debit', 'CASH_ON_HAND', 1],
  ['1020', 'Card / Payment Gateway Clearing', 'Asset', 'Cash & Bank', 'Debit', 'PAYMENT_GATEWAY_CLEARING', 1],
  ['1100', 'Accounts Receivable', 'Asset', 'Receivable', 'Debit', 'ACCOUNTS_RECEIVABLE', 0],
  ['1110', 'Pakistan Resale Profit Share Receivable', 'Asset', 'Pakistan Resale Receivable', 'Debit', 'PAKISTAN_RESALE_RECEIVABLE', 0],
  ['1200', 'Excavator Inventory', 'Asset', 'Inventory', 'Debit', 'EXCAVATOR_INVENTORY', 0],
  ['1250', 'General Inventory', 'Asset', 'Inventory', 'Debit', 'GENERAL_INVENTORY', 0],
  ['1260', 'Pink Salt Inventory in Transit', 'Asset', 'Inventory', 'Debit', 'PINK_SALT_IN_TRANSIT', 0],
  ['1270', 'Pink Salt Raw Salt Inventory', 'Asset', 'Inventory', 'Debit', 'PINK_SALT_RAW_INVENTORY', 0],
  ['1280', 'Pink Salt Packaging Inventory', 'Asset', 'Inventory', 'Debit', 'PINK_SALT_PACKAGING_INVENTORY', 0],
  ['1290', 'Pink Salt Finished Goods Inventory', 'Asset', 'Inventory', 'Debit', 'PINK_SALT_FINISHED_INVENTORY', 0],
  ['1300', 'Pink Salt Supplier Advances', 'Asset', 'Supplier Advance', 'Debit', 'PINK_SALT_SUPPLIER_ADVANCES', 0],
  ['1400', 'Employee Advances', 'Asset', 'Employee Receivable', 'Debit', 'EMPLOYEE_ADVANCES', 0],
  ['1500', 'Inter-Business-Unit Receivable', 'Asset', 'Inter-BU', 'Debit', 'INTER_BU_RECEIVABLE', 0],
  ['1990', 'Suspense / Unclassified Asset', 'Asset', 'Suspense', 'Debit', 'SUSPENSE_ASSET', 1],
  ['2000', 'Accounts Payable - Suppliers', 'Liability', 'Payable', 'Credit', 'ACCOUNTS_PAYABLE', 0],
  ['2100', 'Buyer / Customer Advances', 'Liability', 'Customer Advance', 'Credit', 'CUSTOMER_ADVANCES', 0],
  ['2110', 'Pakistan Resale Unallocated Credit', 'Liability', 'Pakistan Resale Credit', 'Credit', 'PAKISTAN_RESALE_CREDIT', 0],
  ['2200', 'Salary Payable', 'Liability', 'Payroll', 'Credit', 'SALARY_PAYABLE', 0],
  ['2210', 'Payroll Deductions Payable', 'Liability', 'Payroll', 'Credit', 'PAYROLL_DEDUCTIONS_PAYABLE', 0],
  ['2300', 'Inter-Business-Unit Payable', 'Liability', 'Inter-BU', 'Credit', 'INTER_BU_PAYABLE', 0],
  ['2990', 'Suspense / Unclassified Liability', 'Liability', 'Suspense', 'Credit', 'SUSPENSE_LIABILITY', 1],
  ['3000', 'Owner Equity / Retained Earnings', 'Equity', 'Equity', 'Credit', 'OWNER_EQUITY', 0],
  ['4000', 'Excavator Sales Revenue', 'Revenue', 'Sales', 'Credit', 'EXCAVATOR_SALES_REVENUE', 0],
  ['4050', 'Pakistan Resale Profit Share Income', 'Revenue', 'Pakistan Resale Profit Share', 'Credit', 'PAKISTAN_RESALE_REVENUE', 0],
  ['4100', 'General Sales Revenue', 'Revenue', 'Sales', 'Credit', 'GENERAL_SALES_REVENUE', 0],
  ['4200', 'Pink Salt Sales Revenue', 'Revenue', 'Sales', 'Credit', 'PINK_SALT_SALES_REVENUE', 0],
  ['4300', 'Foreign Exchange Gain', 'Revenue', 'FX Gain / Loss', 'Credit', 'FX_GAIN', 0],
  ['4190', 'Other Revenue', 'Revenue', 'Other Revenue', 'Credit', 'OTHER_REVENUE', 1],
  ['5000', 'Excavator Cost of Goods Sold', 'Expense', 'Cost of Goods Sold', 'Debit', 'EXCAVATOR_COGS', 0],
  ['5100', 'General Cost of Goods Sold', 'Expense', 'Cost of Goods Sold', 'Debit', 'GENERAL_COGS', 0],
  ['5200', 'Pink Salt Cost of Goods Sold', 'Expense', 'Cost of Goods Sold', 'Debit', 'PINK_SALT_COGS', 0],
  ['6000', 'Salary & Wages Expense', 'Expense', 'Payroll', 'Debit', 'SALARY_EXPENSE', 1],
  ['6100', 'Transport / Logistics Expense', 'Expense', 'Operating Expense', 'Debit', 'LOGISTICS_EXPENSE', 1],
  ['6200', 'Repair & Maintenance Expense', 'Expense', 'Operating Expense', 'Debit', 'REPAIR_EXPENSE', 1],
  ['6300', 'Parts / Spare Parts Expense', 'Expense', 'Operating Expense', 'Debit', 'PARTS_EXPENSE', 1],
  ['6400', 'General Operating Expense', 'Expense', 'Operating Expense', 'Debit', 'GENERAL_EXPENSE', 1],
  ['6500', 'Bank / Payment Fees', 'Expense', 'Operating Expense', 'Debit', 'BANK_FEES', 1],
  ['6510', 'Marketplace / Platform Fees', 'Expense', 'Selling Expense', 'Debit', 'PINK_SALT_PLATFORM_FEES', 1],
  ['6600', 'Foreign Exchange Loss', 'Expense', 'FX Gain / Loss', 'Debit', 'FX_LOSS', 1],
  ['6610', 'Pink Salt Waste / Stock Loss', 'Expense', 'Inventory Loss', 'Debit', 'PINK_SALT_WASTE_EXPENSE', 1],
  ['6900', 'Other Expense', 'Expense', 'Other Expense', 'Debit', 'OTHER_EXPENSE', 1]];

  const insAccount = db.prepare(`INSERT INTO accounting_accounts(code,name,account_type,subtype,normal_balance,system_key,allow_manual) VALUES(?,?,?,?,?,?,?) ON CONFLICT DO NOTHING`);
  for (const a of SYSTEM_ACCOUNTS) await insAccount.run(...a);
  async function account(key) {const r = await db.prepare("SELECT * FROM accounting_accounts WHERE system_key=?").get(key);if (!r) throw new Error('Missing system accounting account ' + key);return r;}
  async function accountId(key) {return Number((await account(key)).id);}

  // Default payment accounts are explicit so existing data can be reconciled later.
  async function ensureDefaultPayment(name, type, systemKey) {
    const ledger = await accountId(systemKey);
    if (!(await db.prepare("SELECT id FROM accounting_payment_accounts WHERE business_unit_id IS NULL AND name=?").get(name)))
    await db.prepare("INSERT INTO accounting_payment_accounts(business_unit_id,name,payment_type,currency,ledger_account_id,is_default,notes) VALUES(NULL,?,?,'KRW',?,1,?)").run(name, type, ledger, 'System default. Replace or map to the actual company account when ready.');
  }
  await ensureDefaultPayment('Unassigned KRW Bank', 'Bank', 'BANK_CLEARING');
  await ensureDefaultPayment('Cash on Hand', 'Cash', 'CASH_ON_HAND');
  await ensureDefaultPayment('Card / Gateway Clearing', 'Card', 'PAYMENT_GATEWAY_CLEARING');

  async function paymentLedgerAccount(finance, paymentAccountId = null) {
    const id = Number(paymentAccountId || finance?.payment_account_id || 0);
    if (id) {const p = await db.prepare("SELECT * FROM accounting_payment_accounts WHERE id=? AND active=1").get(id);if (p) return Number(p.ledger_account_id);}
    const method = text(finance?.payment_method).toLowerCase();
    if (method.includes('cash')) return await accountId('CASH_ON_HAND');
    if (method.includes('card') || method.includes('gateway')) return await accountId('PAYMENT_GATEWAY_CLEARING');
    return await accountId('BANK_CLEARING');
  }

  async function isPeriodClosed(businessUnitId, date) {
    const key = periodKey(date),bu = Number(businessUnitId || 0) || null;
    const exact = bu ? await db.prepare("SELECT status FROM accounting_periods WHERE business_unit_id=? AND period_key=?").get(bu, key) : null;
    if (exact?.status === 'Closed') return true;
    const company = await db.prepare("SELECT status FROM accounting_periods WHERE business_unit_id IS NULL AND period_key=?").get(key);
    return company?.status === 'Closed';
  }
  const PERIOD_RECON_CORE = [
  ['bank', 'Bank Reconciliation'], ['cash', 'Cash Count / Cash Book'], ['payroll', 'Payroll'], ['tax', 'Tax / WHT / Duties'],
  ['inter_bu', 'Inter-BU Clearing'], ['suspense', 'Suspense / Clearing'], ['corrections', 'Corrections / Voids'], ['trial_balance', 'Trial Balance'],
  ['fixed_assets', 'Fixed Asset & Depreciation Review'], ['loans_leases', 'Loan & Lease Liability Review'], ['historical_migration', 'Historical Opening Migration Review']];

  const PERIOD_RECON_EXCAVATOR = [
  ['exc_supplier_payables', 'Excavator Supplier Payables'], ['exc_supplier_credit', 'Excavator Supplier Credit'],
  ['exc_buyer_advances', 'Excavator Buyer Advances'], ['exc_inventory', 'Excavator Inventory'], ['exc_resale_share', 'Pakistan Resale Profit Share']];

  const PERIOD_RECON_PINK_SALT = [
  ['ps_supplier_payables', 'Pink Salt Supplier Payables'], ['ps_supplier_credit', 'Pink Salt Supplier Shared Credit'],
  ['ps_goods_in_transit', 'Pink Salt Goods in Transit'], ['ps_raw_inventory', 'Raw Salt Inventory'],
  ['ps_packaging_inventory', 'Packaging Inventory'], ['ps_wip', 'Work in Process'], ['ps_finished_goods', 'Finished Goods'],
  ['ps_customer_balances', 'Customer Receivables / Advances']];

  async function periodReconAreas(businessUnitId) {
    let rows = [...PERIOD_RECON_CORE];
    if (!businessUnitId) return [...rows, ['bu_close', 'Business Unit Close Completion']];
    const b = await db.prepare("SELECT name FROM business_units WHERE id=?").get(Number(businessUnitId)),name = text(b?.name).toLowerCase();
    if (name.includes('excavator')) rows = rows.concat(PERIOD_RECON_EXCAVATOR);
    if (name.includes('pink') && name.includes('salt') || name === 'pink salt') rows = rows.concat(PERIOD_RECON_PINK_SALT);
    if (!name.includes('excavator') && !(name.includes('pink') && name.includes('salt'))) rows.push(['operational_subledgers', 'Operational Subledgers / Inventory']);
    return rows;
  }
  async function ensurePeriodReconRows(businessUnitId, key) {
    const ins = db.prepare(`INSERT INTO accounting_period_reconciliations(business_unit_id,period_key,area_key,area_name,status) VALUES(?,?,?,?,'Open') ON CONFLICT DO NOTHING`);
    for (const [areaKey, areaName] of await periodReconAreas(businessUnitId)) await ins.run(businessUnitId || null, key, areaKey, areaName);
  }
  function periodJournalScope(businessUnitId, alias = 'j') {
    if (!businessUnitId) return { sql: '', args: [] };
    return { sql: ` AND (${alias}.business_unit_id=? OR EXISTS(SELECT 1 FROM accounting_journal_lines _pcu WHERE _pcu.journal_entry_id=${alias}.id AND _pcu.business_unit_id=?))`, args: [Number(businessUnitId), Number(businessUnitId)] };
  }
  async function periodCloseReadiness(businessUnitId, key) {
    const bu = Number(businessUnitId || 0) || null;await ensurePeriodReconRows(bu, key);const blockers = [],checks = [];
    const add = (key0, label, count, detail, hard = true) => {const n = Number(count || 0),ok = n === 0;checks.push({ key: key0, label, count: n, ok, detail: detail || '' });if (hard && !ok) blockers.push(`${label}: ${n}${detail ? ' · ' + detail : ''}`);};
    const js = periodJournalScope(bu, 'j');
    const pending = (await db.prepare(`SELECT COUNT(*) c FROM accounting_journal_entries j WHERE j.status IN ('Pending Review','Correction Required') AND substr(j.transaction_date,1,7)=?${js.sql}`).get(key, ...js.args)).c;
    add('posting_control', 'Posting Control proposals waiting', pending, 'finalize or correct before close');
    const sync = bu ? (await db.prepare("SELECT COUNT(*) c FROM accounting_sync_queue q JOIN finance_entries f ON f.id=q.finance_entry_id WHERE f.business_unit_id=? AND substr(COALESCE(f.transaction_date,f.created_at),1,7)=?").get(bu, key)).c : (await db.prepare("SELECT COUNT(*) c FROM accounting_sync_queue q JOIN finance_entries f ON f.id=q.finance_entry_id WHERE substr(COALESCE(f.transaction_date,f.created_at),1,7)=?").get(key)).c;
    add('sync_queue', 'Finance transactions waiting for accounting synchronization', sync, 'resolve synchronization before close');
    const exc = bu ? (await db.prepare("SELECT COUNT(*) c FROM accounting_exceptions WHERE status='Open' AND business_unit_id=?").get(bu)).c : (await db.prepare("SELECT COUNT(*) c FROM accounting_exceptions WHERE status='Open'").get()).c;
    add('exceptions', 'Open accounting exceptions', exc, 'resolve or formally clear exceptions');
    const unverified = bu ? (await db.prepare("SELECT COUNT(*) c FROM finance_entries WHERE business_unit_id=? AND status!='Voided' AND (COALESCE(cash_effect,0)<>0 OR source_type='Manual') AND substr(COALESCE(transaction_date,created_at),1,7)=? AND COALESCE(verification_status,'') NOT IN ('Verified','Verified / Correct')").get(bu, key)).c : (await db.prepare("SELECT COUNT(*) c FROM finance_entries WHERE status!='Voided' AND (COALESCE(cash_effect,0)<>0 OR source_type='Manual') AND substr(COALESCE(transaction_date,created_at),1,7)=? AND COALESCE(verification_status,'') NOT IN ('Verified','Verified / Correct')").get(key)).c;
    add('finance_verification', 'Unverified Finance transactions', unverified, 'verify or resolve corrections before close');
    const openCorrections = bu ? (await db.prepare("SELECT COUNT(*) c FROM finance_correction_requests c JOIN finance_entries f ON f.id=c.finance_entry_id WHERE c.business_unit_id=? AND c.status IN ('Open','Viewed','Resubmitted') AND substr(COALESCE(f.transaction_date,f.created_at),1,7)=?").get(bu, key)).c : (await db.prepare("SELECT COUNT(*) c FROM finance_correction_requests c JOIN finance_entries f ON f.id=c.finance_entry_id WHERE c.status IN ('Open','Viewed','Resubmitted') AND substr(COALESCE(f.transaction_date,f.created_at),1,7)=?").get(key)).c;
    add('finance_corrections', 'Open Finance correction requests', openCorrections, 'no unresolved correction may cross period close');
    const unreconciled = bu ? (await db.prepare("SELECT COUNT(*) c FROM accounting_bank_statement_lines s JOIN accounting_payment_accounts p ON p.id=s.payment_account_id WHERE s.status!='Reconciled' AND substr(s.statement_date,1,7)=? AND (p.business_unit_id=? OR p.business_unit_id IS NULL)").get(key, bu)).c : (await db.prepare("SELECT COUNT(*) c FROM accounting_bank_statement_lines s WHERE s.status!='Reconciled' AND substr(s.statement_date,1,7)=?").get(key)).c;
    add('bank_lines', 'Unreconciled bank statement lines', unreconciled, 'match or formally resolve all imported statement lines');
    const unbalanced = (await db.prepare(`SELECT COUNT(*) c FROM (SELECT j.id,ROUND(COALESCE(SUM(l.debit_krw),0)-COALESCE(SUM(l.credit_krw),0),2) diff FROM accounting_journal_entries j JOIN accounting_journal_lines l ON l.journal_entry_id=j.id WHERE j.status IN ('Posted','Reversed') AND substr(j.transaction_date,1,7)=?${js.sql} GROUP BY j.id HAVING ABS(ROUND(SUM(l.debit_krw-l.credit_krw),2))>0.01)`).get(key, ...js.args)).c;
    add('trial_balance', 'Unbalanced official journals', unbalanced, 'hard accounting integrity block');
    const suspenseArgs = [key],suspenseScope = bu ? ' AND l.business_unit_id=?' : '';if (bu) suspenseArgs.push(bu);
    const suspense = (await db.prepare(`SELECT COUNT(*) c FROM (SELECT a.id,ROUND(COALESCE(SUM(l.debit_krw-l.credit_krw),0),2) bal FROM accounting_accounts a JOIN accounting_journal_lines l ON l.account_id=a.id JOIN accounting_journal_entries j ON j.id=l.journal_entry_id WHERE j.status IN ('Posted','Reversed') AND substr(j.transaction_date,1,7)<=?${suspenseScope} AND (a.subtype='Suspense' OR a.system_key IN ('SUSPENSE_ASSET','SUSPENSE_LIABILITY')) GROUP BY a.id HAVING ABS(ROUND(COALESCE(SUM(l.debit_krw-l.credit_krw),0),2))>0.01)`).get(...suspenseArgs)).c;
    add('suspense', 'Suspense / temporary clearing balances', suspense, 'target zero before close');
    const inter = await db.prepare(`SELECT
      COALESCE(SUM(CASE WHEN a.system_key='INTER_BU_RECEIVABLE' THEN l.debit_krw-l.credit_krw ELSE 0 END),0) due_from,
      COALESCE(SUM(CASE WHEN a.system_key='INTER_BU_PAYABLE' THEN l.credit_krw-l.debit_krw ELSE 0 END),0) due_to
      FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id JOIN accounting_accounts a ON a.id=l.account_id
      WHERE j.status IN ('Posted','Reversed') AND substr(j.transaction_date,1,7)<=? AND a.system_key IN ('INTER_BU_RECEIVABLE','INTER_BU_PAYABLE')`).get(key);
    const interDiff = Math.abs(num(inter?.due_from) - num(inter?.due_to));checks.push({ key: 'inter_bu_balance', label: "Inter-BU Due From / Due To difference", count: interDiff, ok: interDiff <= 0.01, detail: `Due From ${num(inter?.due_from).toFixed(2)} · Due To ${num(inter?.due_to).toFixed(2)}` });if (interDiff > 0.01) blockers.push(`Inter-BU Clearing mismatch: ${interDiff.toFixed(2)} KRW`);
    if (!bu) {const openBus = (await db.prepare(`SELECT COUNT(*) c FROM business_units b LEFT JOIN accounting_periods p ON p.business_unit_id=b.id AND p.period_key=? AND p.status='Closed' WHERE b.status!='Archived' AND p.id IS NULL`).get(key)).c;add('business_units_closed', 'Business units not yet closed', openBus, 'close each active BU before company consolidation close');}
    const checklist = await db.prepare(`SELECT r.*,u.name completed_by_name FROM accounting_period_reconciliations r LEFT JOIN users u ON u.id=r.completed_by WHERE r.period_key=? AND COALESCE(r.business_unit_id,0)=COALESCE(?,0) ORDER BY r.id`).all(key, bu);
    const incomplete = checklist.filter((r) => !['Reconciled', 'Exception Approved', 'Not Applicable'].includes(r.status));
    add('reconciliation_signoff', 'Required reconciliation checklist items still Open', incomplete.length, 'Finance/Accounting sign-off is mandatory for each applicable V2 reconciliation area');
    return { ready: blockers.length === 0, business_unit_id: bu, period_key: key, checks, checklist, blockers };
  }

  async function addException(finance, code, message, severity = 'Warning') {
    try {await db.prepare("INSERT INTO accounting_exceptions(business_unit_id,finance_entry_id,code,severity,message,status) VALUES(?,?,?,?,?,'Open') ON CONFLICT DO NOTHING").run(finance?.business_unit_id || null, finance?.id || null, code, severity, message);} catch (_) {}
  }
  async function resolveException(financeId, code) {try {await db.prepare("UPDATE accounting_exceptions SET status='Resolved',resolved_at=bom.utc_now() WHERE finance_entry_id=? AND code=? AND status='Open'").run(financeId, code);} catch (_) {}}

  async function excavatorCostSnapshot(assetId) {
    const a = await db.prepare("SELECT * FROM excavator_assets WHERE id=?").get(assetId);if (!a) return null;
    const tx = await db.prepare("SELECT * FROM excavator_transactions WHERE asset_id=? AND status NOT IN ('Cancelled','Voided')").all(assetId),parse = (t) => {try {return t.metadata ? JSON.parse(t.metadata) : {};} catch (_) {return {};}},included = (t) => parse(t).include_in_machine_cost !== false,sum = (rows) => rows.reduce((n, x) => n + Number(x.amount || 0), 0),linked = (type, key, id) => tx.some((t) => t.type === type && Number(parse(t)[key] || 0) === Number(id));
    const purchaseTx = sum(tx.filter((t) => t.type === 'Purchase' && included(t))),purchase = purchaseTx || Number(a.purchase_price || 0);
    const logistics = sum(tx.filter((t) => t.type === 'Logistics' && included(t))) + (await db.prepare("SELECT * FROM excavator_logistics WHERE asset_id=?").all(assetId)).filter((x) => !linked('Logistics', 'logistics_id', x.id)).reduce((n, x) => n + Number(x.amount || 0), 0);
    const repair = sum(tx.filter((t) => t.type === 'Repair' && included(t))) + (await db.prepare("SELECT * FROM excavator_repairs WHERE asset_id=?").all(assetId)).filter((x) => !linked('Repair', 'repair_id', x.id)).reduce((n, x) => n + Number(x.amount || 0), 0);
    const partCost = sum(tx.filter((t) => t.type === 'Part Purchase' && included(t))) + (await db.prepare("SELECT * FROM excavator_parts WHERE asset_id=?").all(assetId)).filter((x) => !['Sold', 'Exported'].includes(x.status) && !linked('Part Purchase', 'part_id', x.id)).reduce((n, x) => n + Number(x.cost || 0) * Number(x.quantity || 1), 0);
    const other = sum(tx.filter((t) => ['Customs Duty', 'Tax / VAT', 'Shipping / Freight', 'Commission', 'Documentation / Clearance', 'Other Cost'].includes(t.type) && included(t)));
    return { purchase, logistics, repair, partCost, other, total: purchase + logistics + repair + partCost + other };
  }
  async function activeSale(assetId) {return await db.prepare("SELECT * FROM excavator_transactions WHERE asset_id=? AND type IN ('Local Sale','Export Sale') AND status!='Cancelled' ORDER BY id DESC LIMIT 1").get(assetId);}
  async function sourceAssetContext(finance) {
    const st = finance.source_type;let row = null,asset = null,sourceDate = finance.transaction_date || finance.created_at,sourceKind = '';
    if (st === 'Excavator Payment') {
      row = await db.prepare("SELECT p.*,a.business_unit_id,a.asset_no,a.lifecycle_stage FROM excavator_payments p JOIN excavator_assets a ON a.id=p.asset_id WHERE p.id=?").get(finance.source_id);if (row) {asset = row;sourceDate = row.paid_date || row.created_at;sourceKind = row.payment_type || '';}
    } else if (st === 'Excavator Cost Transaction') {
      row = await db.prepare("SELECT t.*,a.business_unit_id,a.asset_no,a.lifecycle_stage FROM excavator_transactions t JOIN excavator_assets a ON a.id=t.asset_id WHERE t.id=?").get(finance.source_id);if (row) {asset = row;sourceDate = row.transaction_date || row.created_at;sourceKind = row.type || '';}
    } else if (st === 'Excavator Repair') {
      row = await db.prepare("SELECT r.*,a.business_unit_id,a.asset_no,a.lifecycle_stage FROM excavator_repairs r JOIN excavator_assets a ON a.id=r.asset_id WHERE r.id=?").get(finance.source_id);if (row) {asset = row;sourceDate = row.repair_date || row.created_at;sourceKind = 'Repair';}
    } else if (st === 'Excavator Logistics') {
      row = await db.prepare("SELECT l.*,a.business_unit_id,a.asset_no,a.lifecycle_stage FROM excavator_logistics l JOIN excavator_assets a ON a.id=l.asset_id WHERE l.id=?").get(finance.source_id);if (row) {asset = row;sourceDate = row.logistics_date || row.ship_date || row.created_at;sourceKind = 'Logistics';}
    } else if (st === 'Excavator Part') {
      row = await db.prepare("SELECT p.*,a.business_unit_id,a.asset_no,a.lifecycle_stage FROM excavator_parts p JOIN excavator_assets a ON a.id=p.asset_id WHERE p.id=?").get(finance.source_id);if (row) {asset = row;sourceDate = row.purchase_date || row.created_at;sourceKind = 'Part Purchase';}
    } else if (st === 'Excavator Sale') {
      row = await db.prepare("SELECT t.*,a.business_unit_id,a.asset_no,a.lifecycle_stage,a.buyer_id FROM excavator_transactions t JOIN excavator_assets a ON a.id=t.asset_id WHERE t.id=?").get(finance.source_id);if (row) {asset = row;sourceDate = row.transaction_date || row.created_at;sourceKind = 'Sale';}
    }
    return { row, asset, sourceDate: dateOnly(sourceDate), sourceKind };
  }
  async function costIsBeforeSale(assetId, sourceDate) {const sale = await activeSale(assetId);if (!sale) return true;return !sourceDate || dateOnly(sourceDate) <= dateOnly(sale.transaction_date || sale.created_at);}

  async function buildFinancePosting(finance) {if (finance.source_type === 'Pink Claim Refund') return await require('./receiving/ledger').posting(db, finance);
    const amount = Math.abs(Number(finance.krw_amount ?? finance.amount ?? 0)),lines = [],ctx = { finance_id: finance.id, source_type: finance.source_type, source_id: finance.source_id };
    if (amount <= 0) return { skip: true, reason: 'Zero amount', lines: [], context: ctx };
    const cash = await paymentLedgerAccount(finance),debit = (acct, amt = amount, meta = {}) => lines.push({ account_id: acct, debit_krw: amt, credit_krw: 0, ...meta }),credit = (acct, amt = amount, meta = {}) => lines.push({ account_id: acct, debit_krw: 0, credit_krw: amt, ...meta });
    const source = await sourceAssetContext(finance),st = text(finance.source_type),category = text(finance.category),entityBase = { business_unit_id: finance.business_unit_id, original_amount: Number(finance.original_amount ?? amount), original_currency: finance.original_currency || 'KRW', fx_rate: Number(finance.fx_rate || 1) };

    if (['Pink Salt FX Payment', 'Pink Salt FX Fee'].includes(st)) return await require('./pink-fx-engine').posting(db, finance);
    if (st === 'Excavator Buyer Payment' || st === 'Buyer Payment') {
      const p = await db.prepare("SELECT p.*,b.name buyer_name FROM excavator_buyer_payments p LEFT JOIN excavator_buyers b ON b.id=p.buyer_id WHERE p.id=?").get(finance.source_id);
      if (!p) return { error: 'Linked Excavator buyer payment was not found.' };
      const saleSpecific = text(p.source_type) === 'Excavator Sale' || text(p.payment_type) === 'Sale Payment';
      debit(cash, amount, { ...entityBase, entity_type: 'Buyer', entity_id: p.buyer_id, memo: `Buyer payment · ${p.buyer_name || ''}` });
      if (saleSpecific) {
        // V30.26: a sale-time receipt can be larger than the sale outstanding. Only the amount
        // actively allocated to its originating sale clears A/R; the excess is a Buyer Advance.
        let saleAssetId = 0,directAllocated = 0;
        if (text(p.source_type) === 'Excavator Sale' && Number(p.source_id || 0)) {try {saleAssetId = Number((await db.prepare("SELECT asset_id FROM excavator_transactions WHERE id=?").get(Number(p.source_id)))?.asset_id || 0);} catch (_) {}}
        if (saleAssetId) {try {directAllocated = Number((await db.prepare(`SELECT COALESCE(SUM(amount_krw),0) v FROM excavator_buyer_payment_allocations WHERE payment_id=? AND asset_id=? AND COALESCE(status,'Active')='Active'`).get(p.id, saleAssetId))?.v || 0);} catch (_) {}}
        if (!saleAssetId) directAllocated = Math.min(amount, Math.max(0, Number(p.krw_amount || amount)));
        directAllocated = Math.min(amount, Math.max(0, directAllocated));const advanceCredit = Math.max(0, amount - directAllocated);
        if (directAllocated > 0.005) credit(await accountId('ACCOUNTS_RECEIVABLE'), directAllocated, { ...entityBase, entity_type: 'Buyer', entity_id: p.buyer_id, memo: 'Sale payment clearing' });
        if (advanceCredit > 0.005) credit(await accountId('CUSTOMER_ADVANCES'), advanceCredit, { ...entityBase, entity_type: 'Buyer', entity_id: p.buyer_id, memo: 'Excess buyer receipt / unallocated credit' });
        ctx.sale_allocation_krw = directAllocated;ctx.advance_credit_krw = advanceCredit;
      } else credit(await accountId('CUSTOMER_ADVANCES'), amount, { ...entityBase, entity_type: 'Buyer', entity_id: p.buyer_id, memo: 'Buyer advance liability' });
      ctx.payment_type = p.payment_type;ctx.buyer_id = p.buyer_id;
    } else if (st === 'Pakistan Resale Profit Payment') {
      // V30.27: Pakistan resale profit-share is a dedicated subledger and revenue stream.
      // One bank receipt may settle multiple machine resale obligations. Only the active
      // allocation portion is Pakistan resale income; any excess remains a distinct resale
      // credit liability and is never mixed with normal Buyer Advance / Korea machine profit.
      const p = await db.prepare(`SELECT p.*,b.name buyer_name FROM excavator_resale_profit_payments p LEFT JOIN excavator_buyers b ON b.id=p.buyer_id WHERE p.id=?`).get(finance.source_id);
      if (!p) return { error: 'Linked Pakistan resale-profit payment was not found.' };
      const allocated = Math.max(0, Number((await db.prepare("SELECT COALESCE(SUM(amount_krw),0) v FROM excavator_resale_profit_allocations WHERE payment_id=? AND status='Active'").get(p.id))?.v || 0));
      const applied = Math.min(amount, allocated),unallocated = Math.max(0, amount - applied);
      debit(cash, amount, { ...entityBase, entity_type: 'Pakistan Resale Buyer', entity_id: p.buyer_id, memo: `Pakistan resale-profit receipt · ${p.buyer_name || ''}` });
      if (applied > 0.005) credit(await accountId('PAKISTAN_RESALE_REVENUE'), applied, { ...entityBase, entity_type: 'Pakistan Resale Buyer', entity_id: p.buyer_id, memo: 'Pakistan resale profit-share income' });
      if (unallocated > 0.005) credit(await accountId('PAKISTAN_RESALE_CREDIT'), unallocated, { ...entityBase, entity_type: 'Pakistan Resale Buyer', entity_id: p.buyer_id, memo: 'Pakistan resale unallocated credit' });
      ctx.buyer_id = p.buyer_id;ctx.pakistan_resale_income_krw = applied;ctx.pakistan_resale_credit_krw = unallocated;
    } else if (st === 'Pakistan Resale Profit Refund') {
      const r = await db.prepare(`SELECT r.*,p.fx_rate_to_krw original_receipt_fx FROM excavator_resale_profit_refunds r JOIN excavator_resale_profit_payments p ON p.id=r.payment_id WHERE r.id=?`).get(finance.source_id);if (!r) return { error: 'Linked Pakistan resale-credit refund was not found.' };
      const carrying = Math.max(0, Number(r.amount_pkr || 0) * Number(r.original_receipt_fx || 1)),cashOut = amount,diff = cashOut - carrying;
      debit(await accountId('PAKISTAN_RESALE_CREDIT'), carrying, { ...entityBase, entity_type: 'Pakistan Resale Buyer', entity_id: r.buyer_id, memo: 'Release Pakistan resale unallocated credit' });
      credit(cash, cashOut, { ...entityBase, entity_type: 'Pakistan Resale Buyer', entity_id: r.buyer_id, memo: 'Pakistan resale-credit bank refund' });
      if (diff > 0.005) debit(await accountId('FX_LOSS'), diff, { ...entityBase, entity_type: 'Pakistan Resale Buyer', entity_id: r.buyer_id, memo: 'FX loss on resale-credit refund' });else
      if (diff < -.005) credit(await accountId('FX_GAIN'), Math.abs(diff), { ...entityBase, entity_type: 'Pakistan Resale Buyer', entity_id: r.buyer_id, memo: 'FX gain on resale-credit refund' });
      ctx.buyer_id = r.buyer_id;ctx.resale_refund_id = r.id;ctx.credit_carrying_krw = carrying;ctx.cash_refund_krw = cashOut;ctx.fx_difference_krw = diff;
    } else if (st === 'Pakistan Resale Bank Transfer') {
      // V30.27: this is a balance-sheet bank-to-bank movement. It must never create or
      // reclassify Pakistan resale income as Korea machine-trading income.
      const t = await db.prepare(`SELECT t.*,fp.ledger_account_id from_ledger,tp.ledger_account_id to_ledger,fp.name from_name,tp.name to_name FROM excavator_resale_bank_transfers t JOIN accounting_payment_accounts fp ON fp.id=t.from_payment_account_id JOIN accounting_payment_accounts tp ON tp.id=t.to_payment_account_id WHERE t.id=?`).get(finance.source_id);
      if (!t) return { error: 'Linked Pakistan-to-Korea bank transfer was not found.' };
      const fromLedger = Number(t.from_ledger || 0),toLedger = Number(t.to_ledger || 0);if (!fromLedger || !toLedger) return { error: 'Pakistan-to-Korea transfer accounts require valid GL mappings.' };
      const sourceKrw = Math.max(0, Number(t.source_krw_equivalent || amount)),destination = Math.max(0, Number(t.destination_amount_krw || 0)),fee = Math.max(0, Number(t.bank_fee_krw || 0)),diff = sourceKrw - destination - fee;
      credit(fromLedger, sourceKrw, { ...entityBase, entity_type: 'Company Bank Transfer', entity_id: t.id, memo: `Transfer out · ${t.from_name || 'Pakistan bank'}` });
      debit(toLedger, destination, { ...entityBase, entity_type: 'Company Bank Transfer', entity_id: t.id, memo: `Transfer in · ${t.to_name || 'Korea bank'}` });
      if (fee > 0.005) debit(await accountId('BANK_FEES'), fee, { ...entityBase, entity_type: 'Company Bank Transfer', entity_id: t.id, memo: 'Pakistan-to-Korea bank / remittance fee' });
      if (diff > 0.005) debit(await accountId('FX_LOSS'), diff, { ...entityBase, entity_type: 'Company Bank Transfer', entity_id: t.id, memo: 'FX loss on Pakistan-to-Korea transfer' });else
      if (diff < -.005) credit(await accountId('FX_GAIN'), Math.abs(diff), { ...entityBase, entity_type: 'Company Bank Transfer', entity_id: t.id, memo: 'FX gain on Pakistan-to-Korea transfer' });
      ctx.transfer_id = t.id;ctx.source_krw = sourceKrw;ctx.destination_krw = destination;ctx.bank_fee_krw = fee;ctx.fx_difference_krw = diff;
    } else if (st === 'Excavator Buyer Refund') {
      const r = await db.prepare("SELECT * FROM excavator_buyer_refunds WHERE id=?").get(finance.source_id);if (!r) return { error: 'Linked buyer advance refund was not found.' };
      debit(await accountId('CUSTOMER_ADVANCES'), amount, { ...entityBase, entity_type: 'Buyer', entity_id: r.buyer_id, memo: 'Buyer advance refunded' });credit(cash, amount, { ...entityBase, entity_type: 'Buyer', entity_id: r.buyer_id, memo: 'Cash / bank refund' });ctx.buyer_id = r.buyer_id;
    } else if (st === 'Excavator Sale') {
      const sale = source.row;if (!sale) return { error: 'Linked Excavator sale was not found.' };let meta = {};try {meta = sale.metadata ? JSON.parse(sale.metadata) : {};} catch (_) {}
      const buyerId = Number(meta.buyer_id || sale.buyer_id || 0) || null,paymentSource = text(meta.payment_source || finance.payment_method).toLowerCase();
      // V30.26: recognize the settlement by its actual active allocation sources. A sale may be
      // covered partly by an existing buyer advance and partly by a newly received payment.
      // Treating the whole mixed settlement as A/R leaves Customer Advances wrong.
      let settlement = { advance_krw: 0, direct_krw: 0 };
      try {settlement = (await db.prepare(`SELECT
        COALESCE(SUM(CASE WHEN COALESCE(p.source_type,'')='Excavator Sale' OR COALESCE(p.payment_type,'')='Sale Payment' THEN 0 ELSE al.amount_krw END),0) advance_krw,
        COALESCE(SUM(CASE WHEN COALESCE(p.source_type,'')='Excavator Sale' OR COALESCE(p.payment_type,'')='Sale Payment' THEN al.amount_krw ELSE 0 END),0) direct_krw
        FROM excavator_buyer_payment_allocations al
        JOIN excavator_buyer_payments p ON p.id=al.payment_id
        WHERE al.asset_id=? AND COALESCE(al.status,'Active')='Active' AND COALESCE(p.status,'Active')!='Voided'`).get(sale.asset_id)) || settlement;} catch (_) {}
      let advanceAllocated = Math.max(0, Number(settlement.advance_krw || 0)),directAllocated = Math.max(0, Number(settlement.direct_krw || 0));
      const activeAllocated = advanceAllocated + directAllocated;
      if (activeAllocated <= 0.005) {if (paymentSource.includes('advance')) advanceAllocated = amount;else directAllocated = amount;} else
      {
        const scale = activeAllocated > amount + 0.005 ? amount / activeAllocated : 1;advanceAllocated *= scale;directAllocated *= scale;
        const remainder = Math.max(0, amount - advanceAllocated - directAllocated);directAllocated += remainder;
      }
      if (advanceAllocated > 0.005) debit(await accountId('CUSTOMER_ADVANCES'), advanceAllocated, { ...entityBase, entity_type: 'Buyer', entity_id: buyerId, memo: 'Apply buyer advance to sale' });
      if (directAllocated > 0.005) debit(await accountId('ACCOUNTS_RECEIVABLE'), directAllocated, { ...entityBase, entity_type: 'Buyer', entity_id: buyerId, memo: 'Recognize sale receivable / direct settlement' });
      credit(await accountId('EXCAVATOR_SALES_REVENUE'), amount, { ...entityBase, entity_type: 'Machine', entity_id: sale.asset_id, memo: `Machine sale · ${sale.asset_no || ''}` });
      const cost = await excavatorCostSnapshot(sale.asset_id),cogs = Math.max(0, Number(cost?.total || 0));if (cogs > 0) {debit(await accountId('EXCAVATOR_COGS'), cogs, { business_unit_id: finance.business_unit_id, entity_type: 'Machine', entity_id: sale.asset_id, memo: 'Recognize machine cost on sale' });credit(await accountId('EXCAVATOR_INVENTORY'), cogs, { business_unit_id: finance.business_unit_id, entity_type: 'Machine', entity_id: sale.asset_id, memo: "Remove sold machine from inventory" });}ctx.asset_id = sale.asset_id;ctx.buyer_id = buyerId;ctx.cost = cogs;ctx.payment_source = paymentSource;ctx.advance_settlement_krw = advanceAllocated;ctx.direct_settlement_krw = directAllocated;
    } else if (st === 'Excavator Payment') {
      const p = source.row;if (!p) return { error: 'Linked Excavator payment was not found.' };
      if (text(p.payment_type) === 'Purchase') {debit(await accountId('ACCOUNTS_PAYABLE'), amount, { ...entityBase, entity_type: 'Machine', entity_id: p.asset_id, memo: 'Supplier payable settled' });credit(cash, amount, { ...entityBase, entity_type: 'Machine', entity_id: p.asset_id, memo: 'Purchase payment' });} else
      if (text(p.payment_type) === 'Sale') {debit(cash, amount, { ...entityBase, entity_type: 'Machine', entity_id: p.asset_id, memo: 'Sale payment received' });credit(await accountId('ACCOUNTS_RECEIVABLE'), amount, { ...entityBase, entity_type: 'Machine', entity_id: p.asset_id, memo: 'Sale receivable settled' });} else
      {debit(await accountId('OTHER_EXPENSE'), amount, { ...entityBase, entity_type: 'Machine', entity_id: p.asset_id, memo: 'Other machine payment' });credit(cash, amount, { ...entityBase, entity_type: 'Machine', entity_id: p.asset_id });}ctx.asset_id = p.asset_id;
    } else if (['Excavator Cost Transaction', 'Excavator Repair', 'Excavator Logistics', 'Excavator Part'].includes(st)) {
      const r = source.row;if (!r) return { error: 'Linked Excavator cost record was not found.' };const assetId = Number(r.asset_id || 0),kind = source.sourceKind || category;
      if (kind === 'Purchase') {
        debit(await accountId('EXCAVATOR_INVENTORY'), amount, { ...entityBase, entity_type: 'Machine', entity_id: assetId, memo: 'Machine purchase / inventory recognition' });credit(await accountId('ACCOUNTS_PAYABLE'), amount, { ...entityBase, entity_type: 'Machine', entity_id: assetId, memo: 'Supplier payable recognized' });
      } else {
        const capitalized = await costIsBeforeSale(assetId, source.sourceDate),expenseKey = kind === 'Logistics' ? 'LOGISTICS_EXPENSE' : kind === 'Repair' ? 'REPAIR_EXPENSE' : kind === 'Part Purchase' ? 'PARTS_EXPENSE' : 'OTHER_EXPENSE';
        debit(capitalized ? await accountId('EXCAVATOR_INVENTORY') : await accountId('EXCAVATOR_COGS'), amount, { ...entityBase, entity_type: 'Machine', entity_id: assetId, memo: capitalized ? `${kind} capitalized into machine cost` : `${kind} after sale` });
        credit(cash, amount, { ...entityBase, entity_type: 'Machine', entity_id: assetId, memo: `${kind} payment / cost` });
        ctx.capitalized = capitalized;
      }
      ctx.asset_id = assetId;ctx.cost_type = kind;
    } else if (st === 'Pink Salt Import Purchase') {
      const imp = await db.prepare(`SELECT i.*,COALESCE((SELECT SUM(x.line_amount_krw) FROM pink_salt_import_items x WHERE x.import_id=i.id),0) purchase_krw FROM pink_salt_imports i WHERE i.id=?`).get(finance.source_id);if (!imp) return { error: 'Linked Pink Salt import was not found.' };
      debit(await accountId('PINK_SALT_IN_TRANSIT'), amount, { ...entityBase, entity_type: 'Pink Salt Import', entity_id: imp.id, memo: `Raw salt purchase in transit · ${imp.import_no}` });
      credit(await accountId('ACCOUNTS_PAYABLE'), amount, { ...entityBase, entity_type: 'Pink Salt Supplier', entity_id: imp.supplier_id || null, memo: `Supplier payable · ${imp.supplier_name || ''}` });ctx.import_id = imp.id;ctx.supplier_id = imp.supplier_id || null;
    } else if (st === 'Pink Salt Import Payment') {
      const p = await db.prepare(`SELECT p.*,i.import_no,i.supplier_id,i.supplier_name FROM pink_salt_import_payments p JOIN pink_salt_imports i ON i.id=p.import_id WHERE p.id=?`).get(finance.source_id);if (!p) return { error: 'Linked Pink Salt import payment was not found.' };
      debit(await accountId('ACCOUNTS_PAYABLE'), amount, { ...entityBase, entity_type: 'Pink Salt Supplier', entity_id: p.supplier_id || null, memo: `Supplier payment · ${p.import_no}` });
      credit(cash, amount, { ...entityBase, entity_type: 'Pink Salt Import', entity_id: p.import_id, memo: `Import payment · ${p.reference || p.import_no}` });ctx.import_id = p.import_id;ctx.supplier_id = p.supplier_id || null;
    } else if (st === 'Employee Advance') {
      const a = await db.prepare("SELECT a.*,e.name employee_name FROM employee_advances a JOIN employees e ON e.id=a.employee_id WHERE a.id=?").get(finance.source_id);if (!a) return { error: 'Linked employee advance was not found.' };
      debit(await accountId('EMPLOYEE_ADVANCES'), amount, { ...entityBase, entity_type: 'Employee', entity_id: a.employee_id, memo: `Employee advance · ${a.reference || a.id}` });credit(cash, amount, { ...entityBase, entity_type: 'Employee', entity_id: a.employee_id, memo: `Advance paid to ${a.employee_name || 'employee'}` });ctx.employee_id = a.employee_id;ctx.employee_advance_id = a.id;
    } else if (st === 'Pink Salt Supplier Advance') {
      const p = await db.prepare("SELECT * FROM pink_salt_supplier_advances WHERE id=?").get(finance.source_id);if (!p) return { error: 'Linked Pink Salt supplier advance was not found.' };
      debit(await accountId('PINK_SALT_SUPPLIER_ADVANCES'), amount, { ...entityBase, entity_type: 'Pink Salt Supplier', entity_id: p.supplier_id, memo: `Supplier advance · ${p.reference || p.id}` });credit(cash, amount, { ...entityBase, entity_type: 'Pink Salt Supplier', entity_id: p.supplier_id, memo: 'Supplier advance paid' });ctx.supplier_id = p.supplier_id;
    } else if (st === 'Pink Salt Supplier Advance Refund') {
      const r = await db.prepare("SELECT * FROM pink_salt_supplier_advance_refunds WHERE id=?").get(finance.source_id);if (!r) return { error: 'Linked Pink Salt supplier advance refund was not found.' };
      debit(cash, amount, { ...entityBase, entity_type: 'Pink Salt Supplier', entity_id: r.supplier_id, memo: 'Supplier advance refund received' });credit(await accountId('PINK_SALT_SUPPLIER_ADVANCES'), amount, { ...entityBase, entity_type: 'Pink Salt Supplier', entity_id: r.supplier_id, memo: `Advance refund · ${r.reference || r.id}` });ctx.supplier_id = r.supplier_id;
    } else if (st === 'Pink Salt Import Cost') {
      const c = await db.prepare(`SELECT c.*,i.import_no,i.status import_status,i.received_at FROM pink_salt_import_costs c JOIN pink_salt_imports i ON i.id=c.import_id WHERE c.id=?`).get(finance.source_id);if (!c) return { error: 'Linked Pink Salt import cost was not found.' };
      const beforeReceipt = !c.received_at || String(c.created_at || '') <= String(c.received_at || '');
      debit(await accountId(beforeReceipt ? 'PINK_SALT_IN_TRANSIT' : 'PINK_SALT_RAW_INVENTORY'), amount, { ...entityBase, entity_type: 'Pink Salt Import', entity_id: c.import_id, memo: `${c.cost_type} · ${c.import_no}` });
      credit(cash, amount, { ...entityBase, entity_type: 'Pink Salt Import', entity_id: c.import_id, memo: `Import cost payment · ${c.reference || c.cost_type}` });ctx.import_id = c.import_id;ctx.cost_type = c.cost_type;ctx.capitalized = true;
    } else if (st === 'Pink Salt Packaging Purchase') {
      const m = await db.prepare(`SELECT m.*,p.sku,p.name FROM pink_salt_packaging_movements m JOIN pink_salt_packaging_items p ON p.id=m.packaging_item_id WHERE m.id=?`).get(finance.source_id);if (!m) return { error: 'Linked Pink Salt packaging purchase was not found.' };
      debit(await accountId('PINK_SALT_PACKAGING_INVENTORY'), amount, { ...entityBase, entity_type: 'Pink Salt Packaging', entity_id: m.packaging_item_id, memo: `Packaging purchase · ${m.sku}` });
      credit(await accountId('ACCOUNTS_PAYABLE'), amount, { ...entityBase, entity_type: 'Pink Salt Supplier', entity_id: m.supplier_id || null, memo: `Packaging supplier payable · ${m.reference || m.sku}` });ctx.packaging_item_id = m.packaging_item_id;ctx.supplier_id = m.supplier_id || null;
    } else if (st === 'Pink Salt Sale') {
      const o = await db.prepare("SELECT * FROM pink_salt_orders WHERE id=?").get(finance.source_id);if (!o) return { error: 'Linked Pink Salt order was not found.' };
      const prepaid = Math.max(0, Math.min(amount, Number(o.prepaid_applied_krw || 0))),receivable = Math.max(0, amount - prepaid);
      if (prepaid) debit(await accountId('CUSTOMER_ADVANCES'), prepaid, { ...entityBase, entity_type: 'Pink Salt Customer', entity_id: o.customer_id || null, memo: `Apply customer advance · ${o.order_no}` });
      if (receivable) debit(await accountId('ACCOUNTS_RECEIVABLE'), receivable, { ...entityBase, entity_type: 'Pink Salt Customer', entity_id: o.customer_id || null, memo: `Sales receivable · ${o.order_no}` });
      credit(await accountId('PINK_SALT_SALES_REVENUE'), amount, { ...entityBase, entity_type: 'Pink Salt Order', entity_id: o.id, memo: `Pink Salt sale · ${o.order_no}` });
      const cogs = Math.max(0, Number(o.cost_total_krw || 0));if (cogs) {debit(await accountId('PINK_SALT_COGS'), cogs, { business_unit_id: finance.business_unit_id, entity_type: 'Pink Salt Order', entity_id: o.id, memo: `Cost of goods sold · ${o.order_no}` });credit(await accountId('PINK_SALT_FINISHED_INVENTORY'), cogs, { business_unit_id: finance.business_unit_id, entity_type: 'Pink Salt Order', entity_id: o.id, memo: `Finished inventory released · ${o.order_no}` });}ctx.order_id = o.id;ctx.customer_id = o.customer_id || null;ctx.prepaid_applied_krw = prepaid;ctx.cogs_krw = cogs;
    } else if (st === 'Pink Salt Customer Receipt') {
      const r = await db.prepare("SELECT * FROM pink_salt_customer_receipts WHERE id=?").get(finance.source_id);if (!r) return { error: 'Linked Pink Salt customer receipt was not found.' };
      debit(cash, amount, { ...entityBase, entity_type: 'Pink Salt Customer', entity_id: r.customer_id || null, memo: `Customer receipt · ${r.reference || r.id}` });
      credit(await accountId('CUSTOMER_ADVANCES'), amount, { ...entityBase, entity_type: 'Pink Salt Customer', entity_id: r.customer_id || null, memo: `Customer credit available for allocation · ${r.reference || r.id}` });ctx.customer_id = r.customer_id || null;ctx.receipt_id = r.id;
    } else if (st === 'Pink Salt Marketplace Settlement Fee') {
      const r = await db.prepare("SELECT * FROM pink_salt_customer_receipts WHERE id=?").get(finance.source_id);if (!r) return { error: 'Linked Pink Salt marketplace settlement was not found.' };
      debit(await accountId('PINK_SALT_PLATFORM_FEES'), amount, { ...entityBase, entity_type: 'Pink Salt Customer', entity_id: r.customer_id || null, memo: `Marketplace / settlement fee withheld · ${r.reference || r.id}` });
      credit(await accountId('CUSTOMER_ADVANCES'), amount, { ...entityBase, entity_type: 'Pink Salt Customer', entity_id: r.customer_id || null, memo: `Marketplace gross settlement credit · ${r.reference || r.id}` });ctx.customer_id = r.customer_id || null;ctx.receipt_id = r.id;
    } else if (st === 'Pink Salt Customer Payment') {
      const p = await db.prepare(`SELECT p.*,o.order_no FROM pink_salt_customer_payments p JOIN pink_salt_orders o ON o.id=p.order_id WHERE p.id=?`).get(finance.source_id);if (!p) return { error: 'Linked Pink Salt customer payment was not found.' };
      debit(cash, amount, { ...entityBase, entity_type: 'Pink Salt Customer', entity_id: p.customer_id || null, memo: `Customer payment · ${p.order_no}` });
      credit(await accountId(p.payment_role === 'Advance' ? 'CUSTOMER_ADVANCES' : 'ACCOUNTS_RECEIVABLE'), amount, { ...entityBase, entity_type: 'Pink Salt Customer', entity_id: p.customer_id || null, memo: p.payment_role === 'Advance' ? `Customer advance · ${p.order_no}` : `Settle receivable · ${p.order_no}` });ctx.order_id = p.order_id;ctx.customer_id = p.customer_id || null;ctx.payment_role = p.payment_role;
    } else if (st === 'Pink Salt Customer Refund') {
      const r = await db.prepare(`SELECT r.*,o.order_no FROM pink_salt_customer_refunds r JOIN pink_salt_orders o ON o.id=r.order_id WHERE r.id=?`).get(finance.source_id);if (!r) return { error: 'Linked Pink Salt customer refund was not found.' };
      debit(await accountId('CUSTOMER_ADVANCES'), amount, { ...entityBase, entity_type: 'Pink Salt Customer', entity_id: r.customer_id || null, memo: `Refund customer credit · ${r.order_no}` });credit(cash, amount, { ...entityBase, entity_type: 'Pink Salt Customer', entity_id: r.customer_id || null, memo: `Customer refund · ${r.reference}` });ctx.order_id = r.order_id;ctx.customer_id = r.customer_id || null;
    } else if (st === 'Pink Salt Platform Fee') {
      const o = await db.prepare("SELECT * FROM pink_salt_orders WHERE id=?").get(finance.source_id);if (!o) return { error: 'Linked Pink Salt order for platform fee was not found.' };debit(await accountId('PINK_SALT_PLATFORM_FEES'), amount, { ...entityBase, entity_type: 'Pink Salt Order', entity_id: o.id, memo: `Platform / marketplace fee · ${o.order_no}` });credit(cash, amount, { ...entityBase, entity_type: 'Pink Salt Order', entity_id: o.id, memo: `Marketplace fee settlement · ${o.sales_channel || ''}` });ctx.order_id = o.id;
    } else if (st === 'Pink Salt Waste') {
      const w = await db.prepare("SELECT * FROM pink_salt_waste WHERE id=?").get(finance.source_id);if (!w) return { error: 'Linked Pink Salt waste record was not found.' };const inv = w.source_type === 'Raw Salt' ? 'PINK_SALT_RAW_INVENTORY' : w.source_type === 'Packaging' ? 'PINK_SALT_PACKAGING_INVENTORY' : 'PINK_SALT_FINISHED_INVENTORY';debit(await accountId('PINK_SALT_WASTE_EXPENSE'), amount, { ...entityBase, entity_type: 'Pink Salt Waste', entity_id: w.id, memo: `${w.waste_type} · ${w.reason}` });credit(await accountId(inv), amount, { ...entityBase, entity_type: w.source_type, entity_id: w.source_id, memo: `Inventory loss · ${w.reason}` });ctx.waste_id = w.id;ctx.waste_source = w.source_type;
    } else if (st === 'Sale') {
      // V30.25 operational recognition only. Cash settlement is a separate Sale Payment Finance event.
      const s = await db.prepare("SELECT * FROM sales WHERE id=?").get(finance.source_id);if (!s) return { error: 'Linked sale was not found.' };
      debit(await accountId('ACCOUNTS_RECEIVABLE'), amount, { ...entityBase, entity_type: 'Sale', entity_id: s.id, memo: 'Recognize customer receivable' });credit(await accountId('GENERAL_SALES_REVENUE'), amount, { ...entityBase, entity_type: 'Sale', entity_id: s.id, memo: 'Sales revenue' });const cost = Math.max(0, Number(s.cost_total || 0));if (cost) {debit(await accountId('GENERAL_COGS'), cost, { business_unit_id: finance.business_unit_id, entity_type: 'Sale', entity_id: s.id, memo: 'Cost of goods sold' });credit(await accountId('GENERAL_INVENTORY'), cost, { business_unit_id: finance.business_unit_id, entity_type: 'Sale', entity_id: s.id, memo: 'Inventory released' });}ctx.sale_id = s.id;
    } else if (st === 'Sale Payment' || st === 'MIMI Sale Payment') {
      const s = await db.prepare("SELECT * FROM sales WHERE id=?").get(finance.source_id);if (!s) return { error: 'Linked sale payment source was not found.' };debit(cash, amount, { ...entityBase, entity_type: 'Sale', entity_id: s.id, memo: 'Customer payment received' });credit(await accountId('ACCOUNTS_RECEIVABLE'), amount, { ...entityBase, entity_type: 'Sale', entity_id: s.id, memo: 'Settle sale receivable' });ctx.sale_id = s.id;
    } else if (st === 'Purchase') {
      // V30.25 operational purchase recognition only. Real payment is posted separately.
      debit(await accountId('GENERAL_INVENTORY'), amount, { ...entityBase, entity_type: 'Purchase', entity_id: finance.source_id, memo: 'Inventory purchase / cost recognition' });credit(await accountId('ACCOUNTS_PAYABLE'), amount, { ...entityBase, entity_type: 'Purchase', entity_id: finance.source_id, memo: 'Supplier payable recognized' });ctx.purchase_id = finance.source_id;
    } else if (st === 'Purchase Payment') {
      const p = await db.prepare("SELECT * FROM purchases WHERE id=?").get(finance.source_id);if (!p) return { error: 'Linked purchase payment source was not found.' };debit(await accountId('ACCOUNTS_PAYABLE'), amount, { ...entityBase, entity_type: 'Purchase', entity_id: p.id, memo: 'Settle supplier payable' });credit(cash, amount, { ...entityBase, entity_type: 'Purchase', entity_id: p.id, memo: 'Supplier payment' });ctx.purchase_id = p.id;
    } else {
      const isRevenue = text(finance.type).toLowerCase() === 'revenue';
      if (isRevenue) {debit(cash, amount, { ...entityBase, memo: 'Cash / bank receipt' });credit(await accountId('OTHER_REVENUE'), amount, { ...entityBase, memo: category || 'Other revenue' });} else
      {const low = category.toLowerCase();const exp = st === 'Manual' && category === 'Payroll Liability Settlement' ? await accountId('SALARY_PAYABLE') : low.includes('logistic') || low.includes('transport') ? await accountId('LOGISTICS_EXPENSE') : low.includes('repair') ? await accountId('REPAIR_EXPENSE') : low.includes('part') ? await accountId('PARTS_EXPENSE') : low.includes('bank') || low.includes('fee') ? await accountId('BANK_FEES') : await accountId('GENERAL_EXPENSE');debit(exp, amount, { ...entityBase, memo: category || 'Operating expense' });credit(cash, amount, { ...entityBase, memo: 'Cash / bank payment' });}
    }
    const dr = lines.reduce((n, l) => n + Number(l.debit_krw || 0), 0),cr = lines.reduce((n, l) => n + Number(l.credit_krw || 0), 0);
    if (Math.abs(dr - cr) > 0.005) return { error: `Unbalanced posting generated: debit ${dr}, credit ${cr}` };
    return { lines, context: ctx, source_hash: hash({ finance: { id: finance.id, type: finance.type, category: finance.category, amount, transaction_date: dateOnly(finance.transaction_date || finance.created_at), payment_method: finance.payment_method, reference: finance.reference, status: finance.status, source_type: finance.source_type, source_id: finance.source_id }, ctx, lines: lines.map((l) => ({ a: l.account_id, d: l.debit_krw, c: l.credit_krw, e: l.entity_id, m: l.memo })) }) };
  }

  async function reverseJournal(entry, reason = '', userId = null, explicitSourceAction = false) {
    if (!entry || entry.status === 'Reversed' || entry.status === 'Cancelled') return null;
    const actor = require('./financial-action-context').actor();
    if (!userId || !String(reason || '').trim() || !actor && !explicitSourceAction) throw new Error('User-initiated financial action and reason required.');
    userId = actor?.id || userId;
    // A proposal that has not reached the official ledger can be cancelled without
    // creating a financial reversal. Only a Posted journal has a ledger effect to reverse.
    if (['Pending Review', 'Correction Required'].includes(entry.status)) {await db.prepare("INSERT INTO audit_log(user_id,entity,entity_id,action,details) VALUES(?,'accounting_journal',?,'cancel-proposal',?)").run(userId, entry.id, JSON.stringify({ reason, before_status: entry.status, after_status: 'Cancelled' }));await db.prepare("UPDATE accounting_journal_entries SET status='Cancelled',finance_entry_id=NULL,description=COALESCE(description,'')||?,updated_at=bom.utc_now() WHERE id=?").run(` | Cancelled before posting: ${reason}`, entry.id);return null;}
    const priorReversal = await db.prepare("SELECT id FROM accounting_journal_entries WHERE reversal_of_id=? AND status IN ('Pending Review','Correction Required','Posted') ORDER BY id DESC LIMIT 1").get(entry.id);if (priorReversal) return priorReversal.id;
    const lines = await db.prepare("SELECT * FROM accounting_journal_lines WHERE journal_entry_id=? ORDER BY id").all(entry.id),jNo = await numbering.next('accounting.reversal', { businessUnitId: entry.business_unit_id });
    // V30.18: reversing an official Posted journal is itself a controlled accounting mutation.
    // Create a reversal proposal and keep the original Posted until an authorized reviewer
    // final-posts the reversal in Posting Control. This prevents silent GL changes.
    const r = await db.prepare(`INSERT INTO accounting_journal_entries(journal_no,business_unit_id,transaction_date,source_type,source_id,source_label,description,status,reversal_of_id,created_by) VALUES(?,?,?,?,?,?,?,'Pending Review',?,?)`).
    run(jNo, entry.business_unit_id, nowDate(), 'Accounting Reversal', entry.id, 'Controlled Reversal Proposal', reason, entry.id, userId || entry.created_by || null);
    const rid = Number(r.lastInsertRowid),ins = db.prepare(`INSERT INTO accounting_journal_lines(journal_entry_id,account_id,business_unit_id,debit_krw,credit_krw,original_amount,original_currency,fx_rate,entity_type,entity_id,dimension_json,memo) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`);
    for (const l of lines) await ins.run(rid, l.account_id, l.business_unit_id, l.credit_krw, l.debit_krw, l.original_amount, l.original_currency, l.fx_rate, l.entity_type, l.entity_id, l.dimension_json, `Reversal proposal · ${l.memo || ''}`);
    // Release the unique Finance link so a corrected Finance proposal can be prepared while
    // retaining the original source_id for traceability. The original remains Posted.
    await db.prepare("UPDATE accounting_journal_entries SET finance_entry_id=NULL,updated_at=bom.utc_now() WHERE id=?").run(entry.id);
    try {await db.prepare("UPDATE accounting_journal_entries SET submitted_for_review_at=bom.utc_now() WHERE id=?").run(rid);} catch (_) {}
    try {await db.prepare("INSERT INTO accounting_posting_history(journal_entry_id,business_unit_id,user_id,action,note,before_status,after_status) VALUES(?,?,?,?,?,'Posted','Pending Review')").run(rid, entry.business_unit_id || null, userId || entry.created_by || null, 'Reversal Submitted for Review', reason || 'Source changed or voided');} catch (_) {}
    await db.prepare("INSERT INTO audit_log(user_id,entity,entity_id,action,details) VALUES(?,'accounting_journal',?,'reversal-requested',?)").run(userId, entry.id, JSON.stringify({ reason, before_status: entry.status, after_status: entry.status, reversal_journal_id: rid, posting_required: true }));
    return rid;
  }
  async function resolvedFinanceCorrection(financeId) {
    try {return (await db.prepare("SELECT * FROM finance_correction_requests WHERE finance_entry_id=? AND status='Resolved' AND outcome='Verified / Correct' ORDER BY resolved_at DESC,id DESC LIMIT 1").get(Number(financeId))) || null;} catch (_) {return null;}
  }
  async function reversalRowsForOriginal(originalId) {return await db.prepare("SELECT * FROM accounting_journal_entries WHERE reversal_of_id=? AND source_type='Accounting Reversal' AND status IN ('Pending Review','Correction Required','Posted') ORDER BY id").all(Number(originalId));}
  async function postJournal({ businessUnitId, transactionDate, sourceType, sourceId, sourceLabel, description, financeEntryId = null, sourceHash = '', createdBy = null, lines, postingStatus = 'Pending Review' }) {
    const dr = lines.reduce((n, l) => n + Number(l.debit_krw || 0), 0),cr = lines.reduce((n, l) => n + Number(l.credit_krw || 0), 0);if (Math.abs(dr - cr) > 0.005) throw new Error(`Journal not balanced: debit ${dr} / credit ${cr}`);
    const status = postingStatus === 'Posted' ? 'Posted' : 'Pending Review';
    const jNo = await numbering.next('accounting.journal', { businessUnitId: businessUnitId }),r = await db.prepare(`INSERT INTO accounting_journal_entries(journal_no,business_unit_id,transaction_date,source_type,source_id,source_label,description,finance_entry_id,source_hash,status,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).
      run(jNo, businessUnitId || null, dateOnly(transactionDate) || nowDate(), sourceType, sourceId ?? null, sourceLabel || sourceType, description || '', financeEntryId, sourceHash || '', status, createdBy || null),jid = Number(r.lastInsertRowid),ins = db.prepare(`INSERT INTO accounting_journal_lines(journal_entry_id,account_id,business_unit_id,debit_krw,credit_krw,original_amount,original_currency,fx_rate,entity_type,entity_id,dimension_json,memo) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`);
    for (const l of lines) await ins.run(jid, l.account_id, l.business_unit_id ?? businessUnitId ?? null, Number(l.debit_krw || 0), Number(l.credit_krw || 0), Number(l.original_amount || 0), l.original_currency || 'KRW', Number(l.fx_rate || 1), l.entity_type || '', l.entity_id ?? null, JSON.stringify(l.dimension_json || {}), l.memo || '');
    if (status === 'Pending Review') {
      try {await db.prepare("UPDATE accounting_journal_entries SET submitted_for_review_at=bom.utc_now() WHERE id=?").run(jid);} catch (_) {}
      try {await db.prepare("INSERT INTO accounting_posting_history(journal_entry_id,business_unit_id,user_id,action,note,before_status,after_status) VALUES(?,?,?,?,?,'','Pending Review')").run(jid, businessUnitId || null, createdBy || null, 'Submitted for Posting Review', description || sourceLabel || sourceType);} catch (_) {}
    }
    return jid;
  }

  let processing = false,queueTimer = null;
  async function syncFinanceEntry(financeId) {
    const finance = await db.prepare("SELECT * FROM finance_entries WHERE id=?").get(financeId);if (!finance) {await db.prepare("DELETE FROM accounting_sync_queue WHERE finance_entry_id=?").run(financeId);return { skipped: true };}
    if (finance.source_type === 'Excavator Payment' && (await require('./v354-finance-integrity').isSaleSettlementMirror(db, finance.source_id)) && finance.status !== 'Voided') {
      await addException(finance, 'V354_SALE_SETTLEMENT_MIRROR', 'Sale settlement mirror is not a cash receipt. This historic Finance row is on integrity hold; posted journals require controlled reversal.', 'Critical');
      await db.prepare("DELETE FROM accounting_sync_queue WHERE finance_entry_id=?").run(finance.id);return { blocked: true, integrity_hold: true };
    }
    const correction = await resolvedFinanceCorrection(finance.id);
    let existing = await db.prepare("SELECT * FROM accounting_journal_entries WHERE finance_entry_id=? ORDER BY id DESC LIMIT 1").get(finance.id);
    if (text(finance.status) === 'Voided' && !existing) existing = await db.prepare("SELECT * FROM accounting_journal_entries WHERE source_type='Finance Entry' AND source_id=? ORDER BY id DESC LIMIT 1").get(finance.id);
    if (text(finance.status) === 'Voided') {
      if (!finance.voided_by || !String(finance.void_reason || '').trim()) {await addException(finance, 'VOID_REQUIRES_USER_REVIEW', 'Historical void has no recorded user/reason. Review explicitly; no automatic reversal.', 'Critical');await db.prepare("DELETE FROM accounting_sync_queue WHERE finance_entry_id=?").run(finance.id);return { blocked: true, review_required: true };}
      let reversalId = null;if (existing) {if (await isPeriodClosed(existing.business_unit_id, existing.transaction_date)) {await addException(finance, 'CLOSED_PERIOD_VOID', 'A Finance record was voided in a closed accounting period. Reopen the period or post an authorized adjustment.', 'Critical');return { blocked: true };}reversalId = await reverseJournal(existing, finance.void_reason, finance.voided_by, true);}
      if (reversalId) await db.prepare("UPDATE finance_entries SET accounting_status='Pending Review',accounting_journal_id=? WHERE id=?").run(reversalId, finance.id);else await db.prepare("UPDATE finance_entries SET accounting_status='Reversed',accounting_journal_id=NULL WHERE id=?").run(finance.id);
      await db.prepare("DELETE FROM accounting_sync_queue WHERE finance_entry_id=?").run(finance.id);return reversalId ? { reversal_pending: true, journal_id: reversalId } : { reversed: true };
    }
    const posting = await buildFinancePosting(finance);if (posting.skip) {await db.prepare("UPDATE finance_entries SET accounting_status='Skipped' WHERE id=?").run(finance.id);await db.prepare("DELETE FROM accounting_sync_queue WHERE finance_entry_id=?").run(finance.id);return posting;}if (posting.error) throw new Error(posting.error);
    const txDate = dateOnly(finance.transaction_date || finance.created_at) || nowDate();
    if (existing && existing.source_hash === posting.source_hash && existing.status === 'Posted') {await db.prepare("UPDATE finance_entries SET accounting_status='Posted',accounting_journal_id=? WHERE id=?").run(existing.id, finance.id);await db.prepare("DELETE FROM accounting_sync_queue WHERE finance_entry_id=?").run(finance.id);await resolveException(finance.id, 'ACCOUNTING_SYNC_ERROR');return { unchanged: true, journal_id: existing.id };}
    if (existing && existing.source_hash === posting.source_hash && ['Pending Review', 'Correction Required'].includes(existing.status)) {await db.prepare("UPDATE finance_entries SET accounting_status=? ,accounting_journal_id=? WHERE id=?").run(existing.status, existing.id, finance.id);await db.prepare("DELETE FROM accounting_sync_queue WHERE finance_entry_id=?").run(finance.id);await resolveException(finance.id, 'ACCOUNTING_SYNC_ERROR');return { unchanged: true, pending: true, journal_id: existing.id };}
    if (existing) {
      if (existing.status === 'Posted' && correction && ['Verified', 'Verified / Correct'].includes(text(finance.verification_status))) {
        const reversals = await reversalRowsForOriginal(existing.id);if (reversals.length > 1) {await addException(finance, 'DUPLICATE_CORRECTION_REVERSAL', 'Multiple effective reversal records exist for the original journal. Automatic posting is blocked.', 'Critical');return { blocked: true };}
        let rid = reversals[0]?.id || (await reverseJournal(existing, 'Verified Finance correction; previous posted journal superseded.', finance.verified_by, true));
        if (rid && (await db.prepare("SELECT status FROM accounting_journal_entries WHERE id=?").get(rid))?.status !== 'Posted') return { blocked: true, reversal_review_required: true, journal_id: rid };
      } else {
        if (existing.status === 'Posted' && (await isPeriodClosed(existing.business_unit_id, existing.transaction_date))) {await addException(finance, 'CLOSED_PERIOD_CHANGE', 'A source transaction changed after its accounting period was closed. Reopen the period or post an authorized adjustment.', 'Critical');return { blocked: true };}
        const actor = require('./financial-action-context').actor();
        if (!actor) {await addException(finance, 'SOURCE_CHANGE_REQUIRES_REVIEW', "Source differs from its accounting record. An authorized correction is required; no automatic cancellation or reversal.", 'Critical');await db.prepare("DELETE FROM accounting_sync_queue WHERE finance_entry_id=?").run(finance.id);return { blocked: true, review_required: true };}
        await reverseJournal(existing, 'User source amendment; previous accounting proposal superseded.', actor.id);
      }
    }
    if (await isPeriodClosed(finance.business_unit_id, txDate)) {await addException(finance, 'CLOSED_PERIOD_POST', 'This transaction belongs to a closed accounting period and cannot create a new accounting proposal until the period is reopened or an authorized adjustment is used.', 'Critical');return { blocked: true };}
    const jid = await postJournal({ businessUnitId: finance.business_unit_id, transactionDate: txDate, sourceType: 'Finance Entry', sourceId: finance.id, sourceLabel: finance.source_label || finance.source_type || 'Finance Entry', description: finance.description || finance.category, financeEntryId: finance.id, sourceHash: posting.source_hash, createdBy: finance.created_by, lines: posting.lines });
    await db.prepare("UPDATE finance_entries SET accounting_status='Pending Review',accounting_journal_id=? WHERE id=?").run(jid, finance.id);await db.prepare("DELETE FROM accounting_sync_queue WHERE finance_entry_id=?").run(finance.id);await resolveException(finance.id, 'ACCOUNTING_SYNC_ERROR');
    // A pre-sale cost change changes the machine COGS snapshot. Requeue the sale so its COGS lines stay synchronized.
    const assetId = posting.context?.asset_id;if (assetId && posting.context?.cost_type) {const sale = await activeSale(assetId);if (sale) {const sf = await db.prepare("SELECT id FROM finance_entries WHERE source_type='Excavator Sale' AND source_id=? AND status!='Voided' ORDER BY id DESC LIMIT 1").get(sale.id);if (sf) await db.prepare("INSERT INTO accounting_sync_queue(finance_entry_id,queued_at) VALUES(?,bom.utc_now()) ON CONFLICT(finance_entry_id) DO UPDATE SET queued_at=bom.utc_now()").run(sf.id);}}
    return { journal_id: jid };
  }
  // Accounting synchronization uses bounded slices and native PostgreSQL row claims.
  // Business mutations enqueue immediately; the worker processes committed jobs
  // under the shared business writer lock without monopolizing interactive work.
  async function processQueue(limit = 40, timeBudgetMs = 25) {if (processing) return { busy: true, processed: 0, remaining: Number((await db.prepare('SELECT COUNT(*) c FROM accounting_sync_queue').get()).c) };processing = true;let processed = 0;const started = Date.now(),hardLimit = Math.max(1, Math.min(Number(limit) || 40, 100));try {while (processed < hardLimit) {if (processed && Date.now() - started >= Math.max(5, Number(timeBudgetMs) || 25)) break;const claimed = await db.transaction(async () => {await db.query('SELECT pg_advisory_xact_lock_shared(1112493391,3)');await db.query("SELECT set_config('bom.internal_sync','on',true)");const q = await db.prepare('SELECT * FROM accounting_sync_queue WHERE attempts<5 ORDER BY queued_at,finance_entry_id FOR UPDATE SKIP LOCKED LIMIT 1').get();if (!q) return false;try {await db.transaction(async () => await syncFinanceEntry(q.finance_entry_id));} catch (e) {const f = await db.prepare('SELECT * FROM finance_entries WHERE id=?').get(q.finance_entry_id);if (f) {await db.prepare("UPDATE finance_entries SET accounting_status='Error' WHERE id=?").run(f.id);await addException(f, 'ACCOUNTING_SYNC_ERROR', String(e.message || e), 'Critical');}await db.prepare('UPDATE accounting_sync_queue SET attempts=attempts+1,last_error=?,queued_at=bom.utc_now() WHERE finance_entry_id=?').run(String(e.message || e).slice(0, 1000), q.finance_entry_id);}return true;}, { isolation: 'SERIALIZABLE', serializeWrites: true });if (!claimed) break;processed++;}} finally {processing = false;}return { busy: false, processed, remaining: Number((await db.prepare('SELECT COUNT(*) c FROM accounting_sync_queue WHERE attempts<5').get()).c), elapsed_ms: Date.now() - started };}
















  function scheduleQueue(delay = 250) {
    if (queueTimer) return;
    queueTimer = setTimeout(async () => {queueTimer = null;try {const r = await processQueue(40, 25);scheduleQueue(r?.remaining ? 100 : 750);} catch (e) {console.error('Accounting background sync:', e.message);scheduleQueue(1500);}}, Math.max(0, Number(delay) || 0));
    if (typeof queueTimer.unref === 'function') queueTimer.unref();
  }

  // Historic Finance backfill is a one-time migration, not work to repeat on every restart.
  void 0;
  const migrationKey = 'v30.39.2-accounting-initial-queue';
  if (!(await db.prepare("SELECT 1 FROM system_migrations WHERE migration_key=?").get(migrationKey))) {
    const r = await db.prepare("INSERT INTO accounting_sync_queue(finance_entry_id,queued_at) SELECT id,bom.utc_now() FROM finance_entries ON CONFLICT DO NOTHING").run();
    await db.prepare("INSERT INTO system_migrations(migration_key,applied_at,details) VALUES(?,bom.utc_now(),?) ON CONFLICT (migration_key) DO UPDATE SET applied_at=EXCLUDED.applied_at,details=EXCLUDED.details").run(migrationKey, `Queued ${Number(r.changes || 0)} historic Finance record(s) once.`);
  }
  scheduleQueue(150);

  function unitFilter(req, alias = 'j') {
    if (req.selected_business_unit_id) return { sql: ` AND ${alias}.business_unit_id=?`, args: [Number(req.selected_business_unit_id)] };
    if (req.user.role === 'CEO / Owner') return { sql: '', args: [] };
    if (req.user.business_unit_id) return { sql: ` AND ${alias}.business_unit_id=?`, args: [Number(req.user.business_unit_id)] };
    return { sql: ' AND 1=0', args: [] };
  }
  function lineUnitFilter(req, alias = 'l') {
    if (req.selected_business_unit_id) return { sql: ` AND ${alias}.business_unit_id=?`, args: [Number(req.selected_business_unit_id)] };
    if (req.user.role === 'CEO / Owner') return { sql: '', args: [] };
    if (req.user.business_unit_id) return { sql: ` AND ${alias}.business_unit_id=?`, args: [Number(req.user.business_unit_id)] };
    return { sql: ' AND 1=0', args: [] };
  }
  function journalUnitFilter(req, alias = 'j') {
    const bu = req.selected_business_unit_id ? Number(req.selected_business_unit_id) : req.user.role === 'CEO / Owner' ? null : Number(req.user.business_unit_id || 0);
    if (!bu) return req.user.role === 'CEO / Owner' ? { sql: '', args: [] } : { sql: ' AND 1=0', args: [] };
    return { sql: ` AND (${alias}.business_unit_id=? OR EXISTS(SELECT 1 FROM accounting_journal_lines _ul WHERE _ul.journal_entry_id=${alias}.id AND _ul.business_unit_id=?))`, args: [bu, bu] };
  }
  async function canSeeJournal(req, journalId, businessUnitId) {
    if (req.user.role === 'CEO / Owner' && !req.selected_business_unit_id) return true;
    const bu = Number(req.selected_business_unit_id || req.user.business_unit_id || 0);
    if (!bu) return false;
    if (Number(businessUnitId || 0) === bu) return true;
    return !!(await db.prepare("SELECT 1 FROM accounting_journal_lines WHERE journal_entry_id=? AND business_unit_id=? LIMIT 1").get(journalId, bu));
  }
  async function requireAccountingWrite(req, res, next) {const bu = currentUnit(req);if (req.user.role === 'CEO / Owner' || (await hasAccess?.(req.user.id, 'sensitive.accounting_adjustments', bu))) return next();return await res.status(403).json({ error: 'Accounting adjustment permission is required for this action.' });}
  async function requirePayroll(req, res, next) {const bu = currentUnit(req);if (req.user.role === 'CEO / Owner' || (await hasAccess?.(req.user.id, 'sensitive.payroll', bu))) return next();return await res.status(403).json({ error: 'Payroll access is not authorized for your account.' });}
  function writableBusinessUnit(req, body = {}) {const id = Number(body.business_unit_id || currentUnit(req) || 0);if (!id) throw new Error("Select a business unit for this transaction.");if (!enforceUnit(req, id)) throw new Error('You cannot post to another business unit.');return id;}

  // ---------------------------------------------------------------------------
  // Accounting APIs
  // ---------------------------------------------------------------------------
  await app.get('/api/accounting/overview', auth, allow('finance', 'dashboard'), async (req, res) => {
    const f = lineUnitFilter(req, 'l'),args = f.args;
    const totals = await db.prepare(`SELECT COALESCE(SUM(l.debit_krw),0) debit,COALESCE(SUM(l.credit_krw),0) credit FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id WHERE j.status IN ('Posted','Reversed')${f.sql}`).get(...args);
    const byType = await db.prepare(`SELECT a.account_type,COALESCE(SUM(l.debit_krw-l.credit_krw),0) net FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id JOIN accounting_accounts a ON a.id=l.account_id WHERE j.status IN ('Posted','Reversed')${f.sql} GROUP BY a.account_type`).all(...args);
    const map = Object.fromEntries(byType.map((x) => [x.account_type, Number(x.net || 0)]));
    const revenue = Math.abs(map.Revenue || 0),expense = Number(map.Expense || 0),assets = Number(map.Asset || 0),liabilities = Math.abs(map.Liability || 0),equity = Math.abs(map.Equity || 0);
    const exceptions = (await db.prepare(`SELECT COUNT(*) c FROM accounting_exceptions e WHERE e.status='Open'${req.selected_business_unit_id ? ' AND e.business_unit_id=?' : req.user.role === 'CEO / Owner' ? '' : req.user.business_unit_id ? ' AND e.business_unit_id=?' : ' AND 1=0'}`).get(...(req.selected_business_unit_id ? [req.selected_business_unit_id] : req.user.role === 'CEO / Owner' ? [] : req.user.business_unit_id ? [req.user.business_unit_id] : []))).c;
    const reconciliationScope = req.selected_business_unit_id ? ' AND (p.business_unit_id=? OR p.business_unit_id IS NULL)' : req.user.role === 'CEO / Owner' ? '' : req.user.business_unit_id ? ' AND (p.business_unit_id=? OR p.business_unit_id IS NULL)' : ' AND 1=0';
    const reconciliationArgs = req.selected_business_unit_id ? [req.selected_business_unit_id] : req.user.role === 'CEO / Owner' ? [] : req.user.business_unit_id ? [req.user.business_unit_id] : [];
    const unreconciled = (await db.prepare(`SELECT COUNT(*) c FROM accounting_bank_statement_lines s JOIN accounting_payment_accounts p ON p.id=s.payment_account_id WHERE s.status!='Reconciled'${reconciliationScope}`).get(...reconciliationArgs)).c;
    const queue = req.selected_business_unit_id ? (await db.prepare("SELECT COUNT(*) c FROM accounting_sync_queue q JOIN finance_entries f ON f.id=q.finance_entry_id WHERE f.business_unit_id=?").get(req.selected_business_unit_id)).c : req.user.role === 'CEO / Owner' ? (await db.prepare("SELECT COUNT(*) c FROM accounting_sync_queue").get()).c : (await db.prepare("SELECT COUNT(*) c FROM accounting_sync_queue q JOIN finance_entries f ON f.id=q.finance_entry_id WHERE f.business_unit_id=?").get(req.user.business_unit_id)).c;
    const buyerAdvanceLedger = Math.abs(Number((await db.prepare(`SELECT COALESCE(SUM(l.credit_krw-l.debit_krw),0) v FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id JOIN accounting_accounts a ON a.id=l.account_id WHERE j.status IN ('Posted','Reversed') AND a.system_key='CUSTOMER_ADVANCES'${f.sql}`).get(...args)).v || 0));
    const payable = Math.abs(Number((await db.prepare(`SELECT COALESCE(SUM(l.credit_krw-l.debit_krw),0) v FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id JOIN accounting_accounts a ON a.id=l.account_id WHERE j.status IN ('Posted','Reversed') AND a.system_key='ACCOUNTS_PAYABLE'${f.sql}`).get(...args)).v || 0));
    const excavatorInventoryLedger = Number((await db.prepare(`SELECT COALESCE(SUM(l.debit_krw-l.credit_krw),0) v FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id JOIN accounting_accounts a ON a.id=l.account_id WHERE j.status IN ('Posted','Reversed') AND a.system_key='EXCAVATOR_INVENTORY'${f.sql}`).get(...args)).v || 0);
    const pendingScope = lineUnitFilter(req, 'l'),pending = await db.prepare(`SELECT COUNT(DISTINCT j.id) c,COALESCE(SUM(l.debit_krw),0) value_krw FROM accounting_journal_entries j JOIN accounting_journal_lines l ON l.journal_entry_id=j.id WHERE j.status IN ('Pending Review','Correction Required')${pendingScope.sql}`).get(...pendingScope.args);
    const financeScope = req.selected_business_unit_id ? ' AND f.business_unit_id=?' : req.user.role === 'CEO / Owner' ? '' : req.user.business_unit_id ? ' AND f.business_unit_id=?' : ' AND 1=0',financeArgs = req.selected_business_unit_id ? [Number(req.selected_business_unit_id)] : req.user.role === 'CEO / Owner' ? [] : req.user.business_unit_id ? [Number(req.user.business_unit_id)] : [];
    const pendingFinance = await db.prepare(`SELECT COUNT(*) c,COALESCE(SUM(ABS(f.amount)),0) value_krw FROM finance_entries f WHERE f.status!='Voided' AND f.verification_status IN ('Pending Verification','Resubmitted')${financeScope}`).get(...financeArgs);
    const exBu = await db.prepare("SELECT id FROM business_units WHERE name='Excavator' AND status!='Archived' LIMIT 1").get(),requestedBu = req.selected_business_unit_id ? Number(req.selected_business_unit_id) : req.user.role === 'CEO / Owner' ? null : Number(req.user.business_unit_id || 0),includeExcavator = !!exBu && (!requestedBu || Number(exBu.id) === requestedBu);
    let operationalBuyerAdvances = 0,operationalSupplierPayable = 0,operationalMachineInventory = 0,operationalMachineCount = 0;
    let postedExcavatorBuyerAdvances = 0,postedExcavatorSupplierPayable = 0,postedExcavatorInventory = 0;
    if (includeExcavator) {
      operationalBuyerAdvances = Number((await db.prepare(`SELECT COALESCE(SUM(available_krw),0) v FROM (SELECT GREATEST(0,COALESCE((SELECT SUM(p.krw_amount) FROM excavator_buyer_payments p WHERE p.buyer_id=b.id AND COALESCE(p.status,'Paid')!='Voided'),0)-COALESCE((SELECT SUM(a.amount_krw) FROM excavator_buyer_payment_allocations a JOIN excavator_buyer_payments p2 ON p2.id=a.payment_id WHERE p2.buyer_id=b.id AND COALESCE(a.status,'Active')='Active'),0)-COALESCE((SELECT SUM(r.krw_amount) FROM excavator_buyer_refunds r WHERE r.buyer_id=b.id AND COALESCE(r.status,'Active')!='Voided'),0)) available_krw FROM excavator_buyers b WHERE b.business_unit_id=?)`).get(exBu.id)).v || 0);
      const supplierRows = await db.prepare(`SELECT a.id,a.purchase_price,COALESCE((SELECT SUM(p.amount) FROM excavator_payments p WHERE p.asset_id=a.id AND p.payment_type='Purchase' AND p.status='Paid'),0) paid FROM excavator_assets a WHERE a.business_unit_id=? AND COALESCE(a.lifecycle_stage,'')!='Cancelled'`).all(exBu.id);
      operationalSupplierPayable = supplierRows.reduce((n, x) => n + Math.max(0, Number(x.purchase_price || 0) - Number(x.paid || 0)), 0);
      const inventoryAssets = await db.prepare(`SELECT id FROM excavator_assets WHERE business_unit_id=? AND COALESCE(lifecycle_stage,'Purchased') NOT IN ('Sold / Completed','Cancelled')`).all(exBu.id);operationalMachineCount = inventoryAssets.length;operationalMachineInventory = await __async.reduce(inventoryAssets, async (n, x) => n + Number((await excavatorCostSnapshot(x.id))?.total || 0), 0);
      const scopedPosted = async (systemKey, normal = 'credit') => {const row = await db.prepare(`SELECT COALESCE(SUM(${normal === 'credit' ? 'l.credit_krw-l.debit_krw' : 'l.debit_krw-l.credit_krw'}),0) v FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id JOIN accounting_accounts a ON a.id=l.account_id WHERE j.status IN ('Posted','Reversed') AND a.system_key=? AND l.business_unit_id=?`).get(systemKey, exBu.id);return Math.max(0, Number(row?.v || 0));};
      postedExcavatorBuyerAdvances = await scopedPosted('CUSTOMER_ADVANCES', 'credit');
      postedExcavatorSupplierPayable = await scopedPosted('ACCOUNTS_PAYABLE', 'credit');
      postedExcavatorInventory = await scopedPosted('EXCAVATOR_INVENTORY', 'debit');
    }
    await res.json({ version: '30.28.0', debit: Number(totals.debit || 0), credit: Number(totals.credit || 0), revenue, expense, profit: revenue - expense, assets, liabilities, equity, buyer_advances: buyerAdvanceLedger, supplier_payable: payable, exceptions: Number(exceptions || 0), unreconciled: Number(unreconciled || 0), sync_queue: Number(queue || 0), posted: { buyer_advances: postedExcavatorBuyerAdvances, supplier_payable: postedExcavatorSupplierPayable, excavator_inventory: postedExcavatorInventory }, operational: { scope: 'Excavator', visible: includeExcavator, buyer_advances: operationalBuyerAdvances, supplier_payable: operationalSupplierPayable, machine_inventory: operationalMachineInventory, machine_count: operationalMachineCount }, pending: { accounting_count: Number(pending?.c || 0), accounting_value_krw: Number(pending?.value_krw || 0), finance_count: Number(pendingFinance?.c || 0), finance_value_krw: Number(pendingFinance?.value_krw || 0) } });
  });
  await app.get('/api/accounting/accounts', auth, allow('finance', 'dashboard'), async (req, res) => await res.json(await db.prepare("SELECT * FROM accounting_accounts ORDER BY code").all()));
  await app.post('/api/accounting/accounts', auth, requireAccountingWrite, async (req, res) => {const code = text(req.body.code),name = text(req.body.name),type = text(req.body.account_type);if (!code || !name || !['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].includes(type)) return await res.status(400).json({ error: 'Code, name and a valid account type are required.' });const normal = ['Liability', 'Equity', 'Revenue'].includes(type) ? 'Credit' : 'Debit';try {const r = await db.prepare("INSERT INTO accounting_accounts(code,name,account_type,subtype,normal_balance,currency,allow_manual,notes) VALUES(?,?,?,?,?,?,?,?)").run(code, name, type, text(req.body.subtype), normal, text(req.body.currency || 'KRW').toUpperCase(), req.body.allow_manual === false || req.body.allow_manual === '0' ? 0 : 1, text(req.body.notes));await audit(req.user, 'accounting_account', r.lastInsertRowid, 'create', JSON.stringify({ code, name, type }));await res.json({ id: r.lastInsertRowid });} catch (e) {await res.status(409).json({ error: 'Account code already exists or the account could not be created.' });}});
  app.put('/api/accounting/accounts/:id', auth, requireAccountingWrite, async (req, res) => {const a = await db.prepare("SELECT * FROM accounting_accounts WHERE id=?").get(req.params.id);if (!a) return await res.status(404).json({ error: 'Account not found' });if (a.system_key && req.body.active === '0') return await res.status(400).json({ error: 'System accounts cannot be deactivated.' });await db.prepare("UPDATE accounting_accounts SET name=?,subtype=?,currency=?,active=?,allow_manual=?,notes=?,updated_at=bom.utc_now() WHERE id=?").run(req.body.name ?? a.name, req.body.subtype ?? a.subtype, req.body.currency ?? a.currency, req.body.active === undefined ? a.active : Number(req.body.active ? 1 : 0), req.body.allow_manual === undefined ? a.allow_manual : Number(req.body.allow_manual ? 1 : 0), req.body.notes ?? a.notes, a.id);await audit(req.user, 'accounting_account', a.id, "update", a.code);await res.json({ ok: true });});
  await app.get('/api/accounting/payment-accounts', auth, allow('finance', 'dashboard'), async (req, res) => {const f = req.selected_business_unit_id ? " WHERE (p.business_unit_id IS NULL OR p.business_unit_id=?)" : req.user.role === 'CEO / Owner' ? '' : req.user.business_unit_id ? " WHERE (p.business_unit_id IS NULL OR p.business_unit_id=?)" : " WHERE 1=0",args = req.selected_business_unit_id ? [req.selected_business_unit_id] : req.user.role === 'CEO / Owner' ? [] : req.user.business_unit_id ? [req.user.business_unit_id] : [];await res.json(await db.prepare(`SELECT p.*,a.code ledger_code,a.name ledger_name,b.name business_unit FROM accounting_payment_accounts p JOIN accounting_accounts a ON a.id=p.ledger_account_id LEFT JOIN business_units b ON b.id=p.business_unit_id${f} ORDER BY p.active DESC,p.name`).all(...args));});
  await app.post('/api/accounting/payment-accounts', auth, requireAccountingWrite, async (req, res) => {let bu = req.body.business_unit_id ? Number(req.body.business_unit_id) : null;if (bu && !enforceUnit(req, bu)) return await res.status(403).json({ error: 'You cannot create an account for another business unit.' });const ledger = Number(req.body.ledger_account_id || 0);if (!(await db.prepare("SELECT id FROM accounting_accounts WHERE id=? AND account_type='Asset'").get(ledger))) return await res.status(400).json({ error: "Select an Asset ledger account for the payment account." });const name = text(req.body.name);if (!name) return await res.status(400).json({ error: 'Account name is required.' });const r = await db.prepare("INSERT INTO accounting_payment_accounts(business_unit_id,name,payment_type,currency,ledger_account_id,bank_name,account_last4,is_default,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)").run(bu, name, text(req.body.payment_type || 'Bank'), text(req.body.currency || 'KRW').toUpperCase(), ledger, text(req.body.bank_name), text(req.body.account_last4).slice(-4), req.body.is_default ? 1 : 0, text(req.body.notes), req.user.id);await audit(req.user, 'payment_account', r.lastInsertRowid, 'create', name);await res.json({ id: r.lastInsertRowid });});
  await app.get('/api/accounting/journal', auth, allow('finance', 'dashboard'), async (req, res) => {const f = journalUnitFilter(req, 'j'),from = text(req.query.from),to = text(req.query.to),accountIdQ = Number(req.query.account_id || 0);let q = `SELECT j.*,b.name business_unit,u.name created_by_name,(SELECT ROUND(SUM(debit_krw),2) FROM accounting_journal_lines WHERE journal_entry_id=j.id) total_debit,(SELECT ROUND(SUM(credit_krw),2) FROM accounting_journal_lines WHERE journal_entry_id=j.id) total_credit FROM accounting_journal_entries j LEFT JOIN business_units b ON b.id=j.business_unit_id LEFT JOIN users u ON u.id=j.created_by WHERE 1=1${f.sql}`,args = [...f.args];if (from) {q += " AND bom.utc_date(j.transaction_date)>=bom.utc_date(?)";args.push(from);}if (to) {q += " AND bom.utc_date(j.transaction_date)<=bom.utc_date(?)";args.push(to);}if (accountIdQ) {q += " AND EXISTS(SELECT 1 FROM accounting_journal_lines x WHERE x.journal_entry_id=j.id AND x.account_id=?)";args.push(accountIdQ);}q += " ORDER BY bom.utc_date(j.transaction_date) DESC,j.id DESC LIMIT 1000";await res.json(await db.prepare(q).all(...args));});
  // V30.49 deterministic GL paging: original /journal array and /journal/:id stay unchanged.
  await app.get('/api/v349/accounting/journal/page', auth, allow('finance', 'dashboard'), async (req, res) => {try {
      const f = journalUnitFilter(req, 'j'),from = text(req.query.from),to = text(req.query.to),search = text(req.query.search).slice(0, 100),accountId = Number(req.query.account_id || 0),size = [25, 50, 100].includes(Number(req.query.pageSize)) ? Number(req.query.pageSize) : 25;
      let where = '1=1' + f.sql,args = [...f.args];
      if (from) {where += " AND bom.utc_date(j.transaction_date)>=bom.utc_date(?)";args.push(from);}if (to) {where += " AND bom.utc_date(j.transaction_date)<=bom.utc_date(?)";args.push(to);}
      if (accountId > 0 && Number.isSafeInteger(accountId)) {where += " AND EXISTS(SELECT 1 FROM accounting_journal_lines x WHERE x.journal_entry_id=j.id AND x.account_id=?)";args.push(accountId);}
      if (search) {where += " AND (j.journal_no ILIKE ? OR j.source_label ILIKE ? OR j.description ILIKE ?)";args.push(...Array(3).fill('%' + search + '%'));}
      const total = (await db.prepare(`SELECT COUNT(*) n FROM accounting_journal_entries j WHERE ${where}`).get(...args)).n,pages = Math.max(1, Math.ceil(total / size)),page = Math.min(pages, Math.max(1, Math.trunc(Number(req.query.page) || 1)));
      const rows = await db.prepare(`WITH page AS (SELECT j.* FROM accounting_journal_entries j WHERE ${where} ORDER BY bom.utc_date(j.transaction_date) DESC,j.id DESC LIMIT ? OFFSET ?),
       amounts AS (SELECT l.journal_entry_id,ROUND(SUM(l.debit_krw),2) total_debit,ROUND(SUM(l.credit_krw),2) total_credit FROM accounting_journal_lines l JOIN page p ON p.id=l.journal_entry_id GROUP BY l.journal_entry_id)
       SELECT p.*,b.name business_unit,u.name created_by_name,a.total_debit,a.total_credit FROM page p LEFT JOIN business_units b ON b.id=p.business_unit_id LEFT JOIN users u ON u.id=p.created_by LEFT JOIN amounts a ON a.journal_entry_id=p.id ORDER BY bom.utc_date(p.transaction_date) DESC,p.id DESC`).all(...args, size, (page - 1) * size);
      await res.json({ rows, pagination: { page, pageSize: size, page_size: size, pages, total, from: total ? (page - 1) * size + 1 : 0, to: Math.min(total, page * size) } });
    } catch (e) {await res.status(500).json({ error: 'Could not load journal page.' });}});
  await app.get('/api/accounting/journal/:id', auth, allow('finance', 'dashboard'), async (req, res) => {const j = await db.prepare("SELECT j.*,b.name business_unit,u.name created_by_name FROM accounting_journal_entries j LEFT JOIN business_units b ON b.id=j.business_unit_id LEFT JOIN users u ON u.id=j.created_by WHERE j.id=?").get(req.params.id);if (!j || !(await canSeeJournal(req, j.id, j.business_unit_id))) return await res.status(404).json({ error: 'Journal entry not found' });const lines = await db.prepare("SELECT l.*,a.code,a.name account_name,a.account_type,b.name business_unit FROM accounting_journal_lines l JOIN accounting_accounts a ON a.id=l.account_id LEFT JOIN business_units b ON b.id=l.business_unit_id WHERE l.journal_entry_id=? ORDER BY l.id").all(j.id),documents = await db.prepare("SELECT * FROM accounting_journal_documents WHERE journal_entry_id=? ORDER BY id").all(j.id);await res.json({ journal: j, lines, documents });});
  await app.post('/api/accounting/journal', auth, requireAccountingWrite, upload.single('evidence'), async (req, res) => {
    const cleanup = () => {try {if (req.file?.path) require('fs').unlinkSync(req.file.path);} catch (_) {}};
    let bu;try {bu = writableBusinessUnit(req, req.body);} catch (e) {cleanup();return await res.status(400).json({ error: e.message });}
    const date = dateOnly(req.body.transaction_date);if (!date) {cleanup();return await res.status(400).json({ error: 'Transaction date is required.' });}if (await isPeriodClosed(bu, date)) {cleanup();return await res.status(409).json({ error: 'This accounting period is closed.' });}
    let lines = [];try {lines = Array.isArray(req.body.lines) ? req.body.lines : JSON.parse(req.body.lines_json || '[]');} catch (_) {cleanup();return await res.status(400).json({ error: 'Manual journal lines are invalid.' });}
    if (!Array.isArray(lines) || lines.length < 2) {cleanup();return await res.status(400).json({ error: 'At least two journal lines are required.' });}
    const normalized = [];for (const l of lines) {const a = await db.prepare("SELECT * FROM accounting_accounts WHERE id=? AND active=1").get(Number(l.account_id));if (!a || !a.allow_manual) {cleanup();return await res.status(400).json({ error: 'One or more selected accounts do not allow manual posting.' });}const debit = num(l.debit_krw),credit = num(l.credit_krw);if (debit < 0 || credit < 0 || debit > 0 && credit > 0 || !(debit > 0) && !(credit > 0)) {cleanup();return await res.status(400).json({ error: 'Each journal line must contain either a debit or a credit greater than zero, not both.' });}normalized.push({ account_id: a.id, business_unit_id: bu, debit_krw: debit, credit_krw: credit, memo: text(l.memo) });}
    const dr = normalized.reduce((n, l) => n + l.debit_krw, 0),cr = normalized.reduce((n, l) => n + l.credit_krw, 0);if (dr <= 0 || Math.abs(dr - cr) > 0.005) {cleanup();return await res.status(400).json({ error: 'Manual journal must have equal debit and credit totals.' });}
    const reason = text(req.body.reason || req.body.description);if (!reason) {cleanup();return await res.status(400).json({ error: 'A reason/description is required for a manual journal proposal.' });}if (!req.file) {cleanup();return await res.status(400).json({ error: 'Evidence / supporting document is required for a manual journal proposal.' });}
    try {const tx = db.atomic(async () => {const jid = await postJournal({ businessUnitId: bu, transactionDate: date, sourceType: 'Manual Journal', sourceId: null, sourceLabel: 'Manual Journal', description: reason, createdBy: req.user.id, lines: normalized });await db.prepare("INSERT INTO accounting_journal_documents(journal_entry_id,title,original_name,file_path,mime_type,size_bytes,uploaded_by) VALUES(?,?,?,?,?,?,?)").run(jid, 'Manual Journal Evidence', req.file.originalname, '/uploads/' + req.file.filename, req.file.mimetype, req.file.size, req.user.id);await audit(req.user, 'accounting_journal', jid, 'manual-submit-for-review', JSON.stringify({ debit: dr, credit: cr, reason, evidence: req.file.originalname }));return jid;});const jid = await tx();await res.json({ id: jid, status: 'Pending Review' });} catch (e) {cleanup();return await res.status(409).json({ error: e.message || 'Manual journal proposal could not be submitted.' });}
  });

  async function reportRows(req, kind) {
    const f = lineUnitFilter(req, 'l'),from = text(req.query.from),to = text(req.query.to),args = [...f.args];let dateSql = '';if (from) {dateSql += " AND bom.utc_date(j.transaction_date)>=bom.utc_date(?)";args.push(from);}if (to) {dateSql += " AND bom.utc_date(j.transaction_date)<=bom.utc_date(?)";args.push(to);}
    const rows = (await db.prepare(`SELECT a.id,a.code,a.name,a.account_type,a.normal_balance,a.system_key,ROUND(COALESCE(SUM(CASE WHEN j.id IS NOT NULL THEN l.debit_krw ELSE 0 END),0),2) debit,ROUND(COALESCE(SUM(CASE WHEN j.id IS NOT NULL THEN l.credit_krw ELSE 0 END),0),2) credit FROM accounting_accounts a LEFT JOIN accounting_journal_lines l ON l.account_id=a.id${f.sql} LEFT JOIN accounting_journal_entries j ON j.id=l.journal_entry_id AND j.status IN ('Posted','Reversed')${dateSql} WHERE a.active=1 GROUP BY a.id ORDER BY a.code`).all(...args)).map((r) => ({ ...r, balance: ['Liability', 'Equity', 'Revenue'].includes(r.account_type) ? Number(r.credit || 0) - Number(r.debit || 0) : Number(r.debit || 0) - Number(r.credit || 0) }));
    if (kind === 'pnl') return rows.filter((r) => ['Revenue', 'Expense'].includes(r.account_type));if (kind === 'balance') return rows.filter((r) => ['Asset', 'Liability', 'Equity'].includes(r.account_type));return rows;
  }
  await app.get('/api/accounting/trial-balance', auth, allow('finance', 'dashboard'), async (req, res) => {const rows = await reportRows(req, 'trial'),debit = rows.reduce((n, r) => n + Number(r.debit || 0), 0),credit = rows.reduce((n, r) => n + Number(r.credit || 0), 0);await res.json({ rows, debit, credit, difference: debit - credit });});
  await app.get('/api/accounting/pnl', auth, allow('finance', 'dashboard'), async (req, res) => {const rows = await reportRows(req, 'pnl'),revenue = rows.filter((r) => r.account_type === 'Revenue').reduce((n, r) => n + Number(r.balance || 0), 0),expense = rows.filter((r) => r.account_type === 'Expense').reduce((n, r) => n + Number(r.balance || 0), 0),byKey = (k) => Number(rows.find((r) => r.system_key === k)?.balance || 0),koreaRevenue = byKey('EXCAVATOR_SALES_REVENUE'),koreaCogs = byKey('EXCAVATOR_COGS'),pakistanResale = byKey('PAKISTAN_RESALE_REVENUE');await res.json({ rows, revenue, expense, profit: revenue - expense, korea_machine_revenue: koreaRevenue, korea_machine_cogs: koreaCogs, korea_machine_margin: koreaRevenue - koreaCogs, pakistan_resale_profit_share: pakistanResale, separate_profit_reporting: true });});
  await app.get('/api/accounting/balance-sheet', auth, allow('finance', 'dashboard'), async (req, res) => {const rows = await reportRows(req, 'balance'),assets = rows.filter((r) => r.account_type === 'Asset').reduce((n, r) => n + Number(r.balance || 0), 0),liabilities = rows.filter((r) => r.account_type === 'Liability').reduce((n, r) => n + Number(r.balance || 0), 0),equity = rows.filter((r) => r.account_type === 'Equity').reduce((n, r) => n + Number(r.balance || 0), 0);const pnl = await reportRows(req, 'pnl'),currentProfit = pnl.filter((r) => r.account_type === 'Revenue').reduce((n, r) => n + Number(r.balance || 0), 0) - pnl.filter((r) => r.account_type === 'Expense').reduce((n, r) => n + Number(r.balance || 0), 0);await res.json({ rows, assets, liabilities, equity, current_profit: currentProfit, equity_plus_profit: equity + currentProfit, difference: assets - (liabilities + equity + currentProfit) });});
  await app.get('/api/accounting/exceptions', auth, allow('finance', 'dashboard'), async (req, res) => {let q = "SELECT e.*,b.name business_unit,f.reference,f.source_type,f.source_id FROM accounting_exceptions e LEFT JOIN business_units b ON b.id=e.business_unit_id LEFT JOIN finance_entries f ON f.id=e.finance_entry_id WHERE e.status=?",args = [req.query.status || 'Open'];if (req.selected_business_unit_id) {q += ' AND e.business_unit_id=?';args.push(req.selected_business_unit_id);} else if (req.user.role !== 'CEO / Owner') {q += ' AND e.business_unit_id=?';args.push(req.user.business_unit_id);}q += ' ORDER BY e.created_at DESC';await res.json(await db.prepare(q).all(...args));});
  await app.post('/api/accounting/resync', auth, requireAccountingWrite, async (req, res) => {let q = "INSERT INTO accounting_sync_queue(finance_entry_id,queued_at) SELECT id,bom.utc_now() FROM finance_entries WHERE 1=1 ON CONFLICT DO NOTHING",args = [];if (req.selected_business_unit_id) {q += ' AND business_unit_id=?';args.push(req.selected_business_unit_id);} else if (req.user.role !== 'CEO / Owner') {q += ' AND business_unit_id=?';args.push(req.user.business_unit_id);}await db.prepare(q).run(...args);scheduleQueue(0);await res.json({ ok: true, queued: true, remaining: (await db.prepare("SELECT COUNT(*) c FROM accounting_sync_queue").get()).c });});

  await app.get('/api/accounting/periods', auth, allow('finance'), async (req, res) => {let q = "SELECT p.*,b.name business_unit,u.name closed_by_name FROM accounting_periods p LEFT JOIN business_units b ON b.id=p.business_unit_id LEFT JOIN users u ON u.id=p.closed_by WHERE 1=1",args = [];if (req.selected_business_unit_id) {q += ' AND (p.business_unit_id=? OR p.business_unit_id IS NULL)';args.push(req.selected_business_unit_id);} else if (req.user.role !== 'CEO / Owner') {q += ' AND p.business_unit_id=?';args.push(req.user.business_unit_id);}q += ' ORDER BY p.period_key DESC,p.business_unit_id';await res.json(await db.prepare(q).all(...args));});
  await app.get('/api/accounting/periods/close-readiness', auth, allow('finance'), async (req, res) => {
    const key = text(req.query.period_key);if (!/^\d{4}-\d{2}$/.test(key)) return await res.status(400).json({ error: 'Period must be YYYY-MM.' });
    const companyScope = String(req.query.company_scope || '') === '1';let bu = companyScope ? null : req.query.business_unit_id ? Number(req.query.business_unit_id) : currentUnit(req);
    if (req.user.role !== 'CEO / Owner' && !bu) bu = req.user.business_unit_id;if (companyScope && req.user.role !== 'CEO / Owner') return await res.status(403).json({ error: 'Only CEO / Owner can review consolidated company close readiness.' });if (bu && !enforceUnit(req, bu)) return await res.status(403).json({ error: 'You cannot review another business unit period.' });
    await res.json(await periodCloseReadiness(bu, key));
  });
  await app.post('/api/accounting/periods/reconciliation-status', auth, requireAccountingWrite, upload.single('evidence'), async (req, res) => {
    const cleanup = () => {try {if (req.file?.path) require('fs').unlinkSync(req.file.path);} catch (_) {}};const key = text(req.body.period_key),companyScope = String(req.body.company_scope || '') === '1';if (!/^\d{4}-\d{2}$/.test(key)) {cleanup();return await res.status(400).json({ error: 'Period must be YYYY-MM.' });}
    let bu = companyScope ? null : req.body.business_unit_id ? Number(req.body.business_unit_id) : currentUnit(req);if (req.user.role !== 'CEO / Owner' && !bu) bu = req.user.business_unit_id;if (companyScope && req.user.role !== 'CEO / Owner') {cleanup();return await res.status(403).json({ error: 'Only CEO / Owner can sign off consolidated reconciliation.' });}if (bu && !enforceUnit(req, bu)) {cleanup();return await res.status(403).json({ error: 'You cannot reconcile another business unit period.' });}
    if (await isPeriodClosed(bu, key + '-01')) {cleanup();return await res.status(409).json({ error: 'This period is already closed. Reopen it before changing reconciliation status.' });}
    await ensurePeriodReconRows(bu, key);const area = text(req.body.area_key),status = text(req.body.status),note = text(req.body.notes);if (!['Open', 'Reconciled', 'Exception Approved', 'Not Applicable'].includes(status)) {cleanup();return await res.status(400).json({ error: 'Invalid reconciliation status.' });}const row = await db.prepare("SELECT * FROM accounting_period_reconciliations WHERE period_key=? AND area_key=? AND COALESCE(business_unit_id,0)=COALESCE(?,0)").get(key, area, bu);if (!row) {cleanup();return await res.status(404).json({ error: 'Reconciliation checklist item not found.' });}if (['Exception Approved', 'Not Applicable'].includes(status) && !note) {cleanup();return await res.status(400).json({ error: 'A reason is required for Exception Approved or Not Applicable status.' });}
    const evidence = req.file ? '/uploads/' + req.file.filename : row.evidence_file || '';await db.prepare(`UPDATE accounting_period_reconciliations SET status=?,notes=?,evidence_file=?,completed_by=?,completed_at=CASE WHEN ?='Open' THEN NULL ELSE bom.utc_now() END,updated_at=bom.utc_now() WHERE id=?`).run(status, note, evidence, status === 'Open' ? null : req.user.id, status, row.id);await audit(req.user, 'accounting_period_reconciliation', row.id, 'status', JSON.stringify({ business_unit_id: bu, period: key, area_key: area, before: row.status, after: status, notes: note, evidence: !!evidence }));await res.json({ ok: true, readiness: await periodCloseReadiness(bu, key) });
  });
  await app.post('/api/accounting/periods/close', auth, requireAccountingWrite, async (req, res) => {
    const key = text(req.body.period_key);if (!/^\d{4}-\d{2}$/.test(key)) return await res.status(400).json({ error: 'Period must be YYYY-MM.' });const companyScope = String(req.body.company_scope || '') === '1';let bu = companyScope ? null : req.body.business_unit_id ? Number(req.body.business_unit_id) : currentUnit(req);if (req.user.role !== 'CEO / Owner' && !bu) bu = req.user.business_unit_id;if (companyScope && req.user.role !== 'CEO / Owner') return await res.status(403).json({ error: 'Only CEO / Owner can close the consolidated company period.' });if (bu && !enforceUnit(req, bu)) return await res.status(403).json({ error: 'You cannot close another business unit period.' });const note = text(req.body.notes);if (!note) return await res.status(400).json({ error: 'Period-close review note is required.' });
    const readiness = await periodCloseReadiness(bu, key);if (!readiness.ready) return await res.status(409).json({ error: 'Period close is blocked until reconciliation and accounting controls are complete.', blockers: readiness.blockers, readiness });
    const existingPeriod = await db.prepare("SELECT id FROM accounting_periods WHERE period_key=? AND COALESCE(business_unit_id,0)=COALESCE(?,0) ORDER BY id LIMIT 1").get(key, bu || null);if (existingPeriod) await db.prepare("UPDATE accounting_periods SET status='Closed',notes=?,closed_by=?,closed_at=bom.utc_now() WHERE id=?").run(note, req.user.id, existingPeriod.id);else await db.prepare("INSERT INTO accounting_periods(business_unit_id,period_key,status,notes,closed_by,closed_at) VALUES(?,?,'Closed',?,?,bom.utc_now())").run(bu || null, key, note, req.user.id);await audit(req.user, 'accounting_period', 0, 'close', JSON.stringify({ business_unit_id: bu || null, period: key, readiness_checks: readiness.checks, notes: note }));await res.json({ ok: true, readiness });
  });
  await app.post('/api/accounting/periods/reopen', auth, async (req, res) => {if (req.user.role !== 'CEO / Owner') return await res.status(403).json({ error: 'Only CEO / Owner can reopen a closed accounting period.' });const key = text(req.body.period_key),bu = req.body.business_unit_id ? Number(req.body.business_unit_id) : null,reason = text(req.body.reason);if (!/^\d{4}-\d{2}$/.test(key)) return await res.status(400).json({ error: 'Period must be YYYY-MM.' });if (!reason || req.body.confirm_reopen !== true) return await res.status(400).json({ error: 'A reason and Review & Confirm are required to reopen a closed accounting period.' });const r = await db.prepare("UPDATE accounting_periods SET status='Open',reopened_by=?,reopened_at=bom.utc_now(),notes=COALESCE(notes,'')||? WHERE period_key=? AND COALESCE(business_unit_id,0)=COALESCE(?,0)").run(req.user.id, ' | REOPEN: ' + reason, key, bu);if (!r.changes) return await res.status(404).json({ error: 'Closed accounting period not found.' });await db.prepare("UPDATE accounting_period_reconciliations SET status='Open',completed_by=NULL,completed_at=NULL,notes=CASE WHEN notes='' THEN 'Reopened period requires fresh reconciliation sign-off.' ELSE notes||' | Reopened period requires fresh reconciliation sign-off.' END,updated_at=bom.utc_now() WHERE period_key=? AND COALESCE(business_unit_id,0)=COALESCE(?,0)").run(key, bu);await audit(req.user, 'accounting_period', 0, 'reopen', JSON.stringify({ business_unit_id: bu, period: key, reason }));await res.json({ ok: true });});

  await app.get('/api/accounting/reconciliation', auth, allow('finance'), async (req, res) => {let q = `SELECT s.*,p.name payment_account,p.business_unit_id,p.ledger_account_id,j.journal_no FROM accounting_bank_statement_lines s JOIN accounting_payment_accounts p ON p.id=s.payment_account_id LEFT JOIN accounting_journal_entries j ON j.id=s.matched_journal_entry_id WHERE 1=1`,args = [];if (req.selected_business_unit_id) {q += ' AND (p.business_unit_id=? OR p.business_unit_id IS NULL)';args.push(req.selected_business_unit_id);} else if (req.user.role !== 'CEO / Owner') {q += ' AND (p.business_unit_id=? OR p.business_unit_id IS NULL)';args.push(req.user.business_unit_id);}q += ' ORDER BY s.statement_date DESC,s.id DESC LIMIT 1000';await res.json(await db.prepare(q).all(...args));});
  await app.post('/api/accounting/reconciliation/lines', auth, requireAccountingWrite, async (req, res) => {const pa = Number(req.body.payment_account_id || 0),date = dateOnly(req.body.statement_date),amount = num(req.body.amount_krw),account = await db.prepare("SELECT * FROM accounting_payment_accounts WHERE id=? AND active=1").get(pa);if (!account || !date || !amount) return await res.status(400).json({ error: 'Payment account, date and non-zero amount are required.' });if (account.business_unit_id && !enforceUnit(req, account.business_unit_id)) return await res.status(403).json({ error: 'You cannot add a statement line for another business unit account.' });const r = await db.prepare("INSERT INTO accounting_bank_statement_lines(payment_account_id,statement_date,description,reference,amount_krw,imported_by) VALUES(?,?,?,?,?,?)").run(pa, date, text(req.body.description), text(req.body.reference), amount, req.user.id);await audit(req.user, 'bank_reconciliation', r.lastInsertRowid, 'statement-line-create', JSON.stringify({ payment_account_id: pa, amount, date }));await res.json({ id: r.lastInsertRowid });});
  await app.post('/api/accounting/reconciliation/:id/match', auth, requireAccountingWrite, async (req, res) => {const line = await db.prepare(`SELECT s.*,p.ledger_account_id,p.business_unit_id FROM accounting_bank_statement_lines s JOIN accounting_payment_accounts p ON p.id=s.payment_account_id WHERE s.id=?`).get(req.params.id),j = await db.prepare("SELECT * FROM accounting_journal_entries WHERE id=? AND status='Posted'").get(Number(req.body.journal_entry_id || 0));if (!line || !j) return await res.status(404).json({ error: 'Statement line or posted journal entry not found.' });if (line.status === 'Reconciled') return await res.status(409).json({ error: 'This statement line is already reconciled.' });if (await isPeriodClosed(line.business_unit_id, line.statement_date)) return await res.status(409).json({ error: 'Reopen the closed period before matching a statement line.' });if (line.business_unit_id && !enforceUnit(req, line.business_unit_id)) return await res.status(403).json({ error: 'You cannot reconcile another business unit account.' });if (!(await canSeeJournal(req, j.id, j.business_unit_id))) return await res.status(403).json({ error: 'You cannot access the selected journal entry.' });const ledgerNet = Number((await db.prepare("SELECT COALESCE(SUM(debit_krw-credit_krw),0) v FROM accounting_journal_lines WHERE journal_entry_id=? AND account_id=?").get(j.id, line.ledger_account_id)).v || 0);if (Math.abs(ledgerNet - Number(line.amount_krw || 0)) > 0.01) return await res.status(409).json({ error: `Journal cash/bank movement ${ledgerNet.toFixed(2)} KRW does not match statement amount ${Number(line.amount_krw || 0).toFixed(2)} KRW.` });const used = await db.prepare("SELECT id FROM accounting_bank_statement_lines WHERE status='Reconciled' AND matched_journal_entry_id=? AND id<>? LIMIT 1").get(j.id, line.id);if (used) return await res.status(409).json({ error: 'This journal entry is already matched to another bank statement line.' });await db.prepare("UPDATE accounting_bank_statement_lines SET status='Reconciled',matched_journal_entry_id=? WHERE id=?").run(j.id, line.id);await audit(req.user, 'bank_reconciliation', line.id, 'match', JSON.stringify({ journal_id: j.id, amount: line.amount_krw }));await res.json({ ok: true });});
  await app.post('/api/accounting/reconciliation/:id/unmatch', auth, requireAccountingWrite, async (req, res) => {const line = await db.prepare(`SELECT s.*,p.business_unit_id FROM accounting_bank_statement_lines s JOIN accounting_payment_accounts p ON p.id=s.payment_account_id WHERE s.id=?`).get(req.params.id);if (!line) return await res.status(404).json({ error: 'Statement line not found.' });if (line.business_unit_id && !enforceUnit(req, line.business_unit_id)) return await res.status(403).json({ error: 'You cannot change another business unit account.' });if (line.status !== 'Reconciled') return await res.status(409).json({ error: 'Only a matched statement line can be unmatched.' });if (await isPeriodClosed(line.business_unit_id, line.statement_date)) return await res.status(409).json({ error: 'Reopen the closed period before changing reconciliation.' });const reason = text(req.body.reason);if (reason.length < 8) return await res.status(400).json({ error: 'A review reason is required to unmatch.' });await db.prepare("UPDATE accounting_bank_statement_lines SET status='Unreconciled',matched_journal_entry_id=NULL WHERE id=?").run(line.id);await audit(req.user, 'bank_reconciliation', line.id, 'unmatch', JSON.stringify({ reason, prior_journal_entry_id: line.matched_journal_entry_id }));await res.json({ ok: true });});

  await app.get('/api/accounting/budgets', auth, allow('finance'), async (req, res) => {let q = `SELECT b.*,a.code,a.name account_name,u.name business_unit FROM accounting_budgets b JOIN accounting_accounts a ON a.id=b.account_id LEFT JOIN business_units u ON u.id=b.business_unit_id WHERE 1=1`,args = [];if (req.selected_business_unit_id) {q += ' AND b.business_unit_id=?';args.push(req.selected_business_unit_id);} else if (req.user.role !== 'CEO / Owner') {q += ' AND b.business_unit_id=?';args.push(req.user.business_unit_id);}q += ' ORDER BY b.period_key DESC,a.code';await res.json(await db.prepare(q).all(...args));});
  await app.post('/api/accounting/budgets', auth, requireAccountingWrite, async (req, res) => {let bu;try {bu = writableBusinessUnit(req, req.body);} catch (e) {return await res.status(400).json({ error: e.message });}const aid = Number(req.body.account_id || 0),key = text(req.body.period_key),amount = num(req.body.budget_krw);if (!aid || !/^\d{4}-\d{2}$/.test(key) || amount < 0) return await res.status(400).json({ error: 'Account, period and valid budget are required.' });await db.prepare(`INSERT INTO accounting_budgets(business_unit_id,account_id,period_key,budget_krw,notes,created_by) VALUES(?,?,?,?,?,?) ON CONFLICT(business_unit_id,account_id,period_key) DO UPDATE SET budget_krw=excluded.budget_krw,notes=excluded.notes,updated_at=bom.utc_now()`).run(bu, aid, key, amount, text(req.body.notes), req.user.id);await res.json({ ok: true });});

  await app.get('/api/accounting/inter-unit-transfers', auth, allow('finance'), async (req, res) => {let q = `SELECT t.*,fb.name from_business_unit,tb.name to_business_unit,fp.name from_payment_account,tp.name to_payment_account,j.journal_no FROM accounting_inter_unit_transfers t LEFT JOIN business_units fb ON fb.id=t.from_business_unit_id LEFT JOIN business_units tb ON tb.id=t.to_business_unit_id LEFT JOIN accounting_payment_accounts fp ON fp.id=t.from_payment_account_id LEFT JOIN accounting_payment_accounts tp ON tp.id=t.to_payment_account_id LEFT JOIN accounting_journal_entries j ON j.id=t.journal_entry_id WHERE 1=1`,args = [];const bu = req.selected_business_unit_id ? Number(req.selected_business_unit_id) : req.user.role === 'CEO / Owner' ? null : Number(req.user.business_unit_id || 0);if (bu) {q += ' AND (t.from_business_unit_id=? OR t.to_business_unit_id=?)';args.push(bu, bu);}q += " ORDER BY bom.utc_date(t.transfer_date) DESC,t.id DESC LIMIT 500";await res.json(await db.prepare(q).all(...args));});

  await app.post('/api/accounting/inter-unit-transfers', auth, requireAccountingWrite, async (req, res) => {
    const from = Number(req.body.from_business_unit_id || 0),to = Number(req.body.to_business_unit_id || 0),amount = num(req.body.amount_krw),date = dateOnly(req.body.transfer_date),reference = text(req.body.reference),fromPa = Number(req.body.from_payment_account_id || 0),toPa = Number(req.body.to_payment_account_id || 0);
    if (!from || !to || from === to || amount <= 0 || !date || !reference || !fromPa || !toPa) return await res.status(400).json({ error: "From unit, To unit, source account, destination account, amount, date and reference are required." });
    if (req.user.role !== 'CEO / Owner' && Number(req.user.business_unit_id) !== from) return await res.status(403).json({ error: 'Only CEO or the authorized source-unit Finance user can create this transfer.' });
    const fp = await db.prepare("SELECT * FROM accounting_payment_accounts WHERE id=? AND active=1").get(fromPa),tp = await db.prepare("SELECT * FROM accounting_payment_accounts WHERE id=? AND active=1").get(toPa);
    if (!fp || !tp) return await res.status(400).json({ error: "Select valid active payment accounts." });
    if (fp.business_unit_id && Number(fp.business_unit_id) !== from) return await res.status(400).json({ error: 'Source payment account is not assigned to the selected source business unit.' });
    if (tp.business_unit_id && Number(tp.business_unit_id) !== to) return await res.status(400).json({ error: 'Destination payment account is not assigned to the selected destination business unit.' });
    if ((await isPeriodClosed(from, date)) || (await isPeriodClosed(to, date))) return await res.status(409).json({ error: 'The transfer date belongs to a closed accounting period for one of the business units.' });
    const lines = [
    { account_id: await accountId('INTER_BU_RECEIVABLE'), business_unit_id: from, debit_krw: amount, credit_krw: 0, memo: `Due from business unit ${to}` },
    { account_id: Number(fp.ledger_account_id), business_unit_id: from, debit_krw: 0, credit_krw: amount, memo: 'Funds transferred out' },
    { account_id: Number(tp.ledger_account_id), business_unit_id: to, debit_krw: amount, credit_krw: 0, memo: 'Funds received' },
    { account_id: await accountId('INTER_BU_PAYABLE'), business_unit_id: to, debit_krw: 0, credit_krw: amount, memo: `Due to business unit ${from}` }];

    const transferNo = await numbering.next('accounting.inter_unit_transfer', { businessUnitId: from });
    const jid = await postJournal({ businessUnitId: null, transactionDate: date, sourceType: 'Inter-BU Transfer', sourceId: null, sourceLabel: 'Inter-BU Transfer', description: text(req.body.description) || reference, createdBy: req.user.id, lines });
    const r = await db.prepare("INSERT INTO accounting_inter_unit_transfers(transfer_no,from_business_unit_id,to_business_unit_id,from_payment_account_id,to_payment_account_id,amount_krw,transfer_date,reference,description,journal_entry_id,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(transferNo, from, to, fromPa, toPa, amount, date, reference, text(req.body.description), jid, req.user.id);
    await db.prepare("UPDATE accounting_journal_entries SET source_id=? WHERE id=?").run(Number(r.lastInsertRowid), jid);
    await audit(req.user, 'inter_unit_transfer', r.lastInsertRowid, 'create', JSON.stringify({ from, to, amount, from_payment_account_id: fromPa, to_payment_account_id: toPa }));
    await res.json({ id: r.lastInsertRowid, transfer_no: transferNo, journal_id: jid });
  });

  // ---------------------------------------------------------------------------
  // Employees & Payroll
  // ---------------------------------------------------------------------------
  const PAYROLL_POSITIVE_COMPONENTS = ['Allowance', 'Bonus', 'Overtime', 'Reimbursement'];
  const PAYROLL_COMPONENT_TYPES = [...PAYROLL_POSITIVE_COMPONENTS, 'Deduction'];
  function employeeScope(req, alias = 'e') {
    if (req.selected_business_unit_id) return { sql: ` AND ${alias}.business_unit_id=?`, args: [Number(req.selected_business_unit_id)] };
    if (req.user.role === 'CEO / Owner') return { sql: '', args: [] };
    if (req.user.business_unit_id) return { sql: ` AND ${alias}.business_unit_id=?`, args: [Number(req.user.business_unit_id)] };
    return { sql: ' AND 1=0', args: [] };
  }
  async function validBusinessUnit(id) {return await db.prepare("SELECT id FROM business_units WHERE id=? AND status!='Archived'").get(Number(id || 0));}
  async function validateEmployeeUserLink(userId, employeeId = null) {
    if (!userId) return null;
    const u = await db.prepare("SELECT id,name,email,role,business_unit_id,active FROM users WHERE id=?").get(Number(userId));
    if (!u || !u.active) throw new Error('Selected user account is not active or does not exist.');
    const linked = await db.prepare("SELECT id,name FROM employees WHERE user_id=? AND id<>COALESCE(?,0) LIMIT 1").get(Number(userId), employeeId);
    if (linked) throw new Error(`This user account is already linked to employee ${linked.name}.`);
    return u;
  }
  async function validatePaymentAccountForBu(paymentAccountId, businessUnitId) {
    if (!paymentAccountId) return null;
    const p = await db.prepare("SELECT * FROM accounting_payment_accounts WHERE id=? AND active=1").get(Number(paymentAccountId));
    if (!p) throw new Error('Selected payment account is not active or does not exist.');
    if (p.business_unit_id && Number(p.business_unit_id) !== Number(businessUnitId)) throw new Error('Selected payment account belongs to another business unit.');
    return p;
  }
  async function getEmployeeAllocations(employeeId, primaryBu) {
    const rows = await db.prepare(`SELECT a.*,b.name business_unit FROM employee_cost_allocations a JOIN business_units b ON b.id=a.business_unit_id WHERE a.employee_id=? AND a.active=1 ORDER BY a.business_unit_id`).all(employeeId);
    if (!rows.length) return [{ employee_id: Number(employeeId), business_unit_id: Number(primaryBu), percentage: 100, business_unit: (await db.prepare("SELECT name FROM business_units WHERE id=?").get(primaryBu))?.name || '' }];
    return rows;
  }
  async function normalizeAllocations(employee, allocations) {
    const rows = (Array.isArray(allocations) ? allocations : []).map((x) => ({ business_unit_id: Number(x.business_unit_id || 0), percentage: Number(x.percentage || 0), notes: text(x.notes) })).filter((x) => x.business_unit_id && x.percentage > 0);
    if (!rows.length) return [{ business_unit_id: Number(employee.business_unit_id), percentage: 100, notes: 'Primary business unit' }];
    const seen = new Set();for (const r of rows) {if (await seen.has(r.business_unit_id)) throw new Error('A business unit can appear only once in an employee cost allocation.');await seen.add(r.business_unit_id);if (!(await validBusinessUnit(r.business_unit_id))) throw new Error('One or more allocation business units are invalid.');if (r.percentage <= 0 || r.percentage > 100) throw new Error('Allocation percentages must be greater than 0 and no more than 100.');}
    const total = rows.reduce((n, x) => n + x.percentage, 0);if (Math.abs(total - 100) > 0.01) throw new Error(`Employee cost allocations must total 100%. Current total: ${total.toFixed(2)}%.`);
    return rows;
  }
  function dateDaysInclusive(a, b) {const x = new Date(String(a) + 'T00:00:00Z'),y = new Date(String(b) + 'T00:00:00Z');return Math.max(0, Math.floor((y - x) / 86400000) + 1);}
  function employeeBaseKrwForPeriod(e, start, end) {
    const overlapStart = e.join_date && e.join_date > start ? e.join_date : start,overlapEnd = e.leave_date && e.leave_date < end ? e.leave_date : end;
    if (!overlapStart || !overlapEnd || overlapEnd < overlapStart) return 0;
    const days = dateDaysInclusive(overlapStart, overlapEnd),periodDays = Math.max(1, dateDaysInclusive(start, end)),rate = text(e.salary_currency).toUpperCase() === 'KRW' ? 1 : Number(e.salary_fx_rate || 1),base = Number(e.base_salary || 0) * rate;
    if (text(e.salary_type) === 'Daily') return Math.round(base * days * 100) / 100;
    if (text(e.salary_type) === 'Weekly') return Math.round(base * (days / 7) * 100) / 100;
    return Math.round(base * (days / periodDays) * 100) / 100;
  }
  async function rebuildPayrollItem(itemId) {
    const item = await db.prepare("SELECT * FROM payroll_run_items WHERE id=?").get(itemId);if (!item) return null;
    const comps = await db.prepare("SELECT * FROM payroll_run_item_components WHERE payroll_run_item_id=?").all(item.id),positive = comps.filter((c) => PAYROLL_POSITIVE_COMPONENTS.includes(c.component_type)).reduce((n, c) => n + num(c.amount_krw), 0),ded = comps.filter((c) => c.component_type === 'Deduction').reduce((n, c) => n + num(c.amount_krw), 0),gross = Math.max(0, num(item.base_salary_krw) + positive),net = Math.max(0, gross - ded - num(item.advance_deduction_krw)),paid = Math.min(num(item.paid_krw), net),outstanding = Math.max(0, net - paid);
    await db.prepare("UPDATE payroll_run_items SET allowances_krw=?,deductions_krw=?,gross_salary_krw=?,net_salary_krw=?,paid_krw=?,outstanding_krw=?,updated_at=bom.utc_now() WHERE id=?").run(positive, ded, gross, net, paid, outstanding, item.id);
    return await db.prepare("SELECT * FROM payroll_run_items WHERE id=?").get(item.id);
  }
  async function employeeAdvanceBalance(employeeId) {return Number((await db.prepare("SELECT COALESCE(SUM(outstanding_krw),0) v FROM employee_advances WHERE employee_id=? AND status='Active' AND outstanding_krw>0").get(employeeId))?.v || 0);}
  async function employeeRecoveryTerms(employeeId) {return (await db.prepare("SELECT * FROM employee_advance_recovery_terms WHERE employee_id=? AND active=1").get(employeeId)) || { employee_id: employeeId, recovery_method: 'Manual', recovery_value: 0, installments_total: 0, installments_remaining: 0, start_date: null, active: 1, notes: '' };}
  async function scheduledAdvanceRecovery(employeeId, availablePayable, periodEnd) {
    const balance = Math.max(0, await employeeAdvanceBalance(employeeId)),terms = await employeeRecoveryTerms(employeeId),method = text(terms.recovery_method || 'Manual'),value = Math.max(0, num(terms.recovery_value)),payable = Math.max(0, num(availablePayable));
    if (!balance || !Number(terms.active || 0) || terms.start_date && dateOnly(terms.start_date) > dateOnly(periodEnd)) return { balance, scheduled: 0, after: balance, method, value, terms };
    let scheduled = 0;if (method === 'Full Balance') scheduled = balance;else if (method === 'Fixed Amount') scheduled = value;else if (method === 'Percentage of Salary') scheduled = payable * (value / 100);else if (method === 'Fixed Payrolls') {const left = Math.max(1, Number(terms.installments_remaining || terms.installments_total || 1));scheduled = balance / left;} else scheduled = 0;
    scheduled = Math.round(Math.min(balance, payable, Math.max(0, scheduled)) * 100) / 100;return { balance, scheduled, after: Math.max(0, Math.round((balance - scheduled) * 100) / 100), method, value, terms };
  }
  async function applyScheduledAdvanceToItem(itemId, periodEnd) {const item = await rebuildPayrollItem(itemId);if (!item) return null;const payableBeforeAdvance = Math.max(0, num(item.gross_salary_krw) - num(item.deductions_krw)),plan = await scheduledAdvanceRecovery(item.employee_id, payableBeforeAdvance, periodEnd);await db.prepare(`UPDATE payroll_run_items SET advance_balance_before_krw=?,scheduled_advance_recovery_krw=?,advance_deduction_krw=?,advance_balance_after_krw=?,advance_recovery_method_snapshot=?,advance_recovery_value_snapshot=?,advance_recovery_exception='',advance_recovery_reason='',updated_at=bom.utc_now() WHERE id=?`).run(plan.balance, plan.scheduled, plan.scheduled, plan.after, plan.method, plan.value, itemId);return await rebuildPayrollItem(itemId);}

  async function refreshPayrollRunTotals(runId) {
    const t = await db.prepare("SELECT COALESCE(SUM(net_salary_krw),0) net,COALESCE(SUM(paid_krw),0) paid,COALESCE(SUM(outstanding_krw),0) outstanding FROM payroll_run_items WHERE payroll_run_id=?").get(runId),run = await db.prepare("SELECT * FROM payroll_runs WHERE id=?").get(runId);if (!run) return null;
    let status = run.status;if (['Approved', 'Partially Paid', 'Paid'].includes(status)) status = Number(t.outstanding || 0) <= 0.005 ? 'Paid' : Number(t.paid || 0) > 0 ? 'Partially Paid' : 'Approved';
    await db.prepare("UPDATE payroll_runs SET total_paid_krw=?,outstanding_krw=?,status=?,updated_at=bom.utc_now() WHERE id=?").run(Number(t.paid || 0), Number(t.outstanding || 0), status, runId);return { ...t, status };
  }

  await app.get('/api/payroll/users', auth, requirePayroll, async (req, res) => {let q = "SELECT u.id,u.name,u.email,u.role,u.business_unit_id,b.name business_unit,u.active,(SELECT e.id FROM employees e WHERE e.user_id=u.id LIMIT 1) employee_id FROM users u LEFT JOIN business_units b ON b.id=u.business_unit_id WHERE u.active=1",args = [];if (req.user.role !== 'CEO / Owner') {q += ' AND (u.business_unit_id=? OR u.id=?)';args.push(req.user.business_unit_id, req.user.id);}q += ' ORDER BY u.name';await res.json(await db.prepare(q).all(...args));});
  await app.get('/api/payroll/employees', auth, requirePayroll, async (req, res) => {const f = employeeScope(req, 'e');await res.json(await db.prepare(`SELECT e.*,b.name business_unit,u.email user_email,u.name user_name,(SELECT COALESCE(SUM(a.outstanding_krw),0) FROM employee_advances a WHERE a.employee_id=e.id AND a.status='Active') advance_outstanding_krw,COALESCE(rt.recovery_method,'Manual') recovery_method,COALESCE(rt.recovery_value,0) recovery_value,COALESCE(rt.installments_total,0) installments_total,COALESCE(rt.installments_remaining,0) installments_remaining,rt.start_date recovery_start_date FROM employees e LEFT JOIN business_units b ON b.id=e.business_unit_id LEFT JOIN users u ON u.id=e.user_id LEFT JOIN employee_advance_recovery_terms rt ON rt.employee_id=e.id AND rt.active=1 WHERE 1=1${f.sql} ORDER BY e.employment_status='Active' DESC,e.name`).all(...f.args));});
  await app.get('/api/payroll/employees/:id', auth, requirePayroll, async (req, res) => {const e = await db.prepare("SELECT e.*,b.name business_unit,u.email user_email,u.name user_name FROM employees e LEFT JOIN business_units b ON b.id=e.business_unit_id LEFT JOIN users u ON u.id=e.user_id WHERE e.id=?").get(req.params.id);if (!e || !enforceUnit(req, e.business_unit_id)) return await res.status(404).json({ error: 'Employee not found' });const components = await db.prepare("SELECT * FROM employee_salary_components WHERE employee_id=? ORDER BY active DESC,component_type,component_name").all(e.id),advances = await db.prepare(`SELECT a.*,f.verification_status finance_verification_status,f.accounting_status finance_accounting_status,f.status finance_status,f.accounting_journal_id finance_journal_id FROM employee_advances a LEFT JOIN finance_entries f ON f.id=a.finance_entry_id WHERE a.employee_id=? ORDER BY a.advance_date DESC,a.id DESC`).all(e.id),allocations = await getEmployeeAllocations(e.id, e.business_unit_id),documents = await db.prepare("SELECT * FROM payroll_documents WHERE employee_id=? ORDER BY created_at DESC,id DESC").all(e.id),payslips = await db.prepare(`SELECT i.id item_id,i.payslip_no,i.gross_salary_krw,i.net_salary_krw,i.paid_krw,i.outstanding_krw,i.status,r.id payroll_run_id,r.payroll_no,r.period_start,r.period_end,r.pay_date,r.status run_status FROM payroll_run_items i JOIN payroll_runs r ON r.id=i.payroll_run_id WHERE i.employee_id=? ORDER BY r.period_end DESC`).all(e.id),compensation_history = await db.prepare("SELECT * FROM employee_compensation_history WHERE employee_id=? ORDER BY COALESCE(effective_date,created_at) DESC,id DESC LIMIT 100").all(e.id);await res.json({ employee: e, components, advances, allocations, documents, payslips, compensation_history });});
  await app.post('/api/payroll/employees', auth, requirePayroll, async (req, res) => {let bu;try {bu = writableBusinessUnit(req, req.body);} catch (e) {return await res.status(400).json({ error: e.message });}const name = text(req.body.name);if (!name) return await res.status(400).json({ error: 'Employee name is required.' });const no = text(req.body.employee_no) || (await numbering.next('hr.employee', { businessUnitId: bu })),currency = text(req.body.salary_currency || 'KRW').toUpperCase(),rate = currency === 'KRW' ? 1 : num(req.body.salary_fx_rate || 1),userId = req.body.user_id ? Number(req.body.user_id) : null;if (rate <= 0) return await res.status(400).json({ error: 'Salary FX rate must be greater than zero.' });try {await validateEmployeeUserLink(userId);await validatePaymentAccountForBu(req.body.payment_account_id, bu);const r = await db.prepare(`INSERT INTO employees(employee_no,user_id,business_unit_id,name,job_title,department,employment_type,employment_status,join_date,salary_type,base_salary,salary_currency,salary_fx_rate,payment_method,payment_account_id,bank_details_masked,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(no, userId, bu, name, text(req.body.job_title), text(req.body.department), text(req.body.employment_type || 'Full-time'), text(req.body.employment_status || 'Active'), dateOnly(req.body.join_date) || null, text(req.body.salary_type || 'Monthly'), num(req.body.base_salary), currency, rate, text(req.body.payment_method || 'Bank'), req.body.payment_account_id ? Number(req.body.payment_account_id) : null, text(req.body.bank_details_masked), text(req.body.notes), req.user.id);const id = Number(r.lastInsertRowid);await db.prepare("INSERT INTO employee_cost_allocations(employee_id,business_unit_id,percentage,active,notes,created_by) VALUES(?,?,100,1,?,?) ON CONFLICT DO NOTHING").run(id, bu, 'Primary business unit', req.user.id);try {await db.prepare("INSERT INTO employee_compensation_history(employee_id,effective_date,salary_type,base_salary,salary_currency,salary_fx_rate,change_reason,changed_by) VALUES(?,?,?,?,?,?,?,?)").run(id, dateOnly(req.body.join_date) || nowDate(), text(req.body.salary_type || 'Monthly'), num(req.body.base_salary), currency, rate, 'Initial compensation', req.user.id);} catch (_) {}await audit(req.user, 'employee', id, 'create', JSON.stringify({ name, business_unit_id: bu, user_id: userId }));await res.json({ id });} catch (e) {await res.status(409).json({ error: e.message.includes('linked') || e.message.includes('payment account') ? e.message : 'Employee number or linked user already exists, or employee could not be created.' });}});
  app.put('/api/payroll/employees/:id', auth, requirePayroll, async (req, res) => {const e = await db.prepare("SELECT * FROM employees WHERE id=?").get(req.params.id);if (!e || !enforceUnit(req, e.business_unit_id)) return await res.status(404).json({ error: 'Employee not found' });const newBu = req.body.business_unit_id ? Number(req.body.business_unit_id) : Number(e.business_unit_id),currency = text(req.body.salary_currency ?? e.salary_currency).toUpperCase(),rate = currency === 'KRW' ? 1 : num(req.body.salary_fx_rate ?? e.salary_fx_rate),userId = req.body.user_id ? Number(req.body.user_id) : null;if (rate <= 0) return await res.status(400).json({ error: 'Salary FX rate must be greater than zero.' });if (!enforceUnit(req, newBu)) return await res.status(403).json({ error: 'You cannot move this employee to another business unit.' });try {await validateEmployeeUserLink(userId, e.id);await validatePaymentAccountForBu(req.body.payment_account_id, newBu);const oldAlloc = await db.prepare("SELECT * FROM employee_cost_allocations WHERE employee_id=? AND active=1").all(e.id),nextSalaryType = req.body.salary_type ?? e.salary_type,nextBase = num(req.body.base_salary ?? e.base_salary),compensationChanged = String(nextSalaryType) !== String(e.salary_type) || Math.abs(nextBase - num(e.base_salary)) > 0.0001 || String(currency) !== String(e.salary_currency) || Math.abs(rate - num(e.salary_fx_rate)) > 0.000001,compensationReason = text(req.body.compensation_change_reason);if (compensationChanged && !compensationReason) throw new Error('Compensation change reason is required when salary terms change.');await db.prepare(`UPDATE employees SET user_id=?,business_unit_id=?,name=?,job_title=?,department=?,employment_type=?,employment_status=?,join_date=?,leave_date=?,salary_type=?,base_salary=?,salary_currency=?,salary_fx_rate=?,payment_method=?,payment_account_id=?,bank_details_masked=?,notes=?,updated_at=bom.utc_now() WHERE id=?`).run(userId, newBu, req.body.name ?? e.name, req.body.job_title ?? e.job_title, req.body.department ?? e.department, req.body.employment_type ?? e.employment_type, req.body.employment_status ?? e.employment_status, req.body.join_date ?? e.join_date, req.body.leave_date ?? e.leave_date, nextSalaryType, nextBase, currency, rate, req.body.payment_method ?? e.payment_method, req.body.payment_account_id ? Number(req.body.payment_account_id) : null, req.body.bank_details_masked ?? e.bank_details_masked, req.body.notes ?? e.notes, e.id);if (compensationChanged) {await db.prepare("INSERT INTO employee_compensation_history(employee_id,effective_date,salary_type,base_salary,salary_currency,salary_fx_rate,change_reason,changed_by) VALUES(?,?,?,?,?,?,?,?)").run(e.id, dateOnly(req.body.compensation_effective_date) || nowDate(), nextSalaryType, nextBase, currency, rate, compensationReason, req.user.id);}if (newBu !== Number(e.business_unit_id) && oldAlloc.length === 1 && Number(oldAlloc[0].business_unit_id) === Number(e.business_unit_id) && Math.abs(Number(oldAlloc[0].percentage) - 100) < 0.01) {await db.prepare("UPDATE employee_cost_allocations SET business_unit_id=?,updated_at=bom.utc_now() WHERE id=?").run(newBu, oldAlloc[0].id);}await audit(req.user, 'employee', e.id, "update", JSON.stringify({ name: req.body.name ?? e.name, business_unit_id: newBu, user_id: userId }));await res.json({ ok: true });} catch (x) {await res.status(409).json({ error: x.message });}});
  await app.get('/api/payroll/employees/:id/allocations', auth, requirePayroll, async (req, res) => {const e = await db.prepare("SELECT * FROM employees WHERE id=?").get(req.params.id);if (!e || !enforceUnit(req, e.business_unit_id)) return await res.status(404).json({ error: 'Employee not found' });await res.json(await getEmployeeAllocations(e.id, e.business_unit_id));});
  app.put('/api/payroll/employees/:id/allocations', auth, requirePayroll, async (req, res) => {const e = await db.prepare("SELECT * FROM employees WHERE id=?").get(req.params.id);if (!e || !enforceUnit(req, e.business_unit_id)) return await res.status(404).json({ error: 'Employee not found' });let rows;try {rows = await normalizeAllocations(e, req.body.allocations);} catch (x) {return await res.status(400).json({ error: x.message });}if (req.user.role !== 'CEO / Owner' && rows.some((x) => Number(x.business_unit_id) !== Number(req.user.business_unit_id))) return await res.status(403).json({ error: 'Only CEO / Owner can allocate an employee salary across multiple business units.' });const tx = db.atomic(async () => {await db.prepare("UPDATE employee_cost_allocations SET active=0,updated_at=bom.utc_now() WHERE employee_id=?").run(e.id);const up = db.prepare(`INSERT INTO employee_cost_allocations(employee_id,business_unit_id,percentage,active,notes,created_by) VALUES(?,?,?,1,?,?) ON CONFLICT(employee_id,business_unit_id) DO UPDATE SET percentage=excluded.percentage,active=1,notes=excluded.notes,updated_at=bom.utc_now()`);for (const r of rows) await up.run(e.id, r.business_unit_id, r.percentage, r.notes, req.user.id);await audit(req.user, 'employee', e.id, "cost-allocation-update", JSON.stringify(rows));});await tx();await res.json({ ok: true, allocations: await getEmployeeAllocations(e.id, e.business_unit_id) });});
  await app.post('/api/payroll/employees/:id/documents', auth, requirePayroll, upload.array('attachments', 10), async (req, res) => {const e = await db.prepare("SELECT * FROM employees WHERE id=?").get(req.params.id);if (!e || !enforceUnit(req, e.business_unit_id)) return await res.status(404).json({ error: 'Employee not found' });const files = req.files || [];if (!files.length) return await res.status(400).json({ error: "Select at least one employee document." });const ins = db.prepare("INSERT INTO payroll_documents(employee_id,title,original_name,file_path,mime_type,size_bytes,employee_visible,uploaded_by) VALUES(?,?,?,?,?,?,?,?)"),ids = [],employeeVisible = req.body.employee_visible === '1' || req.body.employee_visible === true ? 1 : 0;for (const f of files) {const r = await ins.run(e.id, text(req.body.title) || 'Employee Document', f.originalname, '/uploads/' + f.filename, f.mimetype, f.size, employeeVisible, req.user.id);ids.push(Number(r.lastInsertRowid));}await audit(req.user, 'employee', e.id, 'document-upload', JSON.stringify({ count: ids.length }));await res.json({ ok: true, ids });});

  await app.post('/api/payroll/employees/:id/components', auth, requirePayroll, async (req, res) => {const e = await db.prepare("SELECT * FROM employees WHERE id=?").get(req.params.id);if (!e || !enforceUnit(req, e.business_unit_id)) return await res.status(404).json({ error: 'Employee not found' });const name = text(req.body.component_name),type = text(req.body.component_type);if (!name || !PAYROLL_COMPONENT_TYPES.includes(type)) return await res.status(400).json({ error: 'Component name and a valid component type are required.' });const currency = text(req.body.currency || 'KRW').toUpperCase(),rate = currency === 'KRW' ? 1 : num(req.body.fx_rate || 1),amount = num(req.body.amount);if (amount < 0 || rate <= 0) return await res.status(400).json({ error: 'Component amount and FX rate are invalid.' });const r = await db.prepare("INSERT INTO employee_salary_components(employee_id,component_name,component_type,amount,currency,fx_rate,recurring,active,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)").run(e.id, name, type, amount, currency, rate, req.body.recurring === false || req.body.recurring === '0' ? 0 : 1, 1, text(req.body.notes), req.user.id);await audit(req.user, 'salary_component', r.lastInsertRowid, 'create', JSON.stringify({ employee_id: e.id, type, name, amount, currency }));await res.json({ id: r.lastInsertRowid });});
  app.put('/api/payroll/components/:id', auth, requirePayroll, async (req, res) => {const c = await db.prepare("SELECT c.*,e.business_unit_id FROM employee_salary_components c JOIN employees e ON e.id=c.employee_id WHERE c.id=?").get(req.params.id);if (!c || !enforceUnit(req, c.business_unit_id)) return await res.status(404).json({ error: 'Salary component not found' });const type = req.body.component_type ?? c.component_type,currency = text(req.body.currency ?? c.currency).toUpperCase(),rate = currency === 'KRW' ? 1 : num(req.body.fx_rate ?? c.fx_rate);if (!PAYROLL_COMPONENT_TYPES.includes(type) || rate <= 0 || num(req.body.amount ?? c.amount) < 0) return await res.status(400).json({ error: 'Component type, amount or FX rate is invalid.' });await db.prepare("UPDATE employee_salary_components SET component_name=?,component_type=?,amount=?,currency=?,fx_rate=?,recurring=?,active=?,notes=?,updated_at=bom.utc_now() WHERE id=?").run(req.body.component_name ?? c.component_name, type, num(req.body.amount ?? c.amount), currency, rate, req.body.recurring === undefined ? c.recurring : Number(req.body.recurring ? 1 : 0), req.body.active === undefined ? c.active : Number(req.body.active ? 1 : 0), req.body.notes ?? c.notes, c.id);await audit(req.user, 'salary_component', c.id, "update", JSON.stringify({ employee_id: c.employee_id, type }));await res.json({ ok: true });});

  await app.post('/api/payroll/employees/:id/advances', auth, requirePayroll, upload.single('evidence'), async (req, res) => {
    const e = await db.prepare("SELECT * FROM employees WHERE id=?").get(req.params.id);if (!e || !enforceUnit(req, e.business_unit_id)) return await res.status(404).json({ error: 'Employee not found' });
    const original = num(req.body.original_amount),currency = text(req.body.currency || 'KRW').toUpperCase(),rate = currency === 'KRW' ? 1 : num(req.body.fx_rate),krw = Math.round(original * rate * 100) / 100,date = dateOnly(req.body.advance_date),reference = text(req.body.reference),method = text(req.body.payment_method || 'Bank');
    if (original <= 0 || rate <= 0 || !date || method.toLowerCase() !== 'cash' && !reference) return await res.status(400).json({ error: method.toLowerCase() === 'cash' ? 'Amount, date and a valid FX rate are required.' : 'Amount, date, reference and a valid FX rate are required for non-cash payments.' });
    if (!req.file) return await res.status(400).json({ error: 'Receipt / evidence is required for an employee advance.' });if (await isPeriodClosed(e.business_unit_id, date)) return await res.status(409).json({ error: 'The employee advance date belongs to a closed accounting period.' });
    try {await validatePaymentAccountForBu(req.body.payment_account_id, e.business_unit_id);} catch (x) {return await res.status(400).json({ error: x.message });}
    let receiver = null;try {const requested = Number(req.body.receiver_account_id || 0);if (requested) receiver = await db.prepare("SELECT * FROM counterparty_payment_accounts WHERE id=? AND active=1 AND business_unit_id=? AND entity_type='employee' AND entity_id=?").get(requested, e.business_unit_id, e.id);else receiver = await db.prepare("SELECT * FROM counterparty_payment_accounts WHERE active=1 AND business_unit_id=? AND entity_type='employee' AND entity_id=? ORDER BY is_default DESC,id LIMIT 1").get(e.business_unit_id, e.id);if (/bank|card|wallet|cheque|check/i.test(method) && !receiver) return await res.status(400).json({ error: "Select or add the employee receiving account (Paid To) before recording this advance." });} catch (x) {return await res.status(400).json({ error: x.message });}
    try {const result = await db.atomic(async () => {const r = await db.prepare("INSERT INTO employee_advances(employee_id,business_unit_id,original_amount,currency,fx_rate,krw_amount,advance_date,payment_method,payment_account_id,reference,receipt_file,notes,outstanding_krw,journal_entry_id,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,NULL,?)").run(e.id, e.business_unit_id, original, currency, rate, krw, date, method, req.body.payment_account_id ? Number(req.body.payment_account_id) : null, reference, req.file.filename, text(req.body.notes), krw, req.user.id),advId = Number(r.lastInsertRowid);
        const financeId = financeSync ? await financeSync({ businessUnitId: e.business_unit_id, type: 'Expense', category: 'Employee Advance', amount: krw, description: `Employee advance to ${e.name}`, paymentMethod: method, reference, paymentAccountId: req.body.payment_account_id ? Number(req.body.payment_account_id) : null, createdBy: req.user.id, sourceType: 'Employee Advance', sourceId: advId, receiptFile: req.file.filename, originalAmount: original, originalCurrency: currency, fxRate: rate, transactionDate: date, sourceLabel: 'Payroll → Employee Advance', sourceRecordId: advId, receiverAccountId: receiver?.id || null, receiverEntityType: 'employee', receiverEntityId: e.id, receiverName: e.name, receiverAccountLabel: receiver?.label || '', receiverBankName: receiver?.bank_name || '', receiverAccountCountry: receiver?.account_country || '', receiverCurrency: receiver?.currency || currency, receiverAccountNumber: receiver?.account_number || '', receiverMethod: receiver?.method_type || method }) : null;
        await db.prepare("UPDATE employee_advances SET finance_entry_id=? WHERE id=?").run(financeId, advId);await db.prepare("INSERT INTO payroll_documents(employee_id,title,original_name,file_path,mime_type,size_bytes,uploaded_by) VALUES(?,?,?,?,?,?,?)").run(e.id, 'Employee Advance Receipt / Evidence', req.file.originalname, '/uploads/' + req.file.filename, req.file.mimetype, req.file.size, req.user.id);await audit(req.user, 'employee_advance', advId, 'create', JSON.stringify({ employee_id: e.id, krw, finance_entry_id: financeId, accounting_after_finance_verification: true }));return { id: advId, finance_entry_id: financeId, finance_status: 'Pending Verification' };})();await res.json(result);} catch (x) {await res.status(x.status || 409).json({ error: x.message });}
  });
  await app.post('/api/payroll/advances/:id/reverse', auth, async (req, res) => {if (req.user.role !== 'CEO / Owner') return await res.status(403).json({ error: 'Only CEO / Owner can reverse an employee advance.' });const a = await db.prepare("SELECT a.*,e.name employee_name FROM employee_advances a JOIN employees e ON e.id=a.employee_id WHERE a.id=?").get(req.params.id);if (!a) return await res.status(404).json({ error: 'Employee advance not found' });if (a.status === 'Reversed') return await res.json({ ok: true, already_reversed: true });const applied = (await db.prepare("SELECT COUNT(*) c FROM payroll_advance_recoveries r JOIN payroll_run_items i ON i.id=r.payroll_run_item_id WHERE r.employee_advance_id=? AND r.status='Applied'").get(a.id)).c;if (applied) return await res.status(409).json({ error: 'Reverse the related payroll run first because this advance already has payroll recoveries.' });const reason = text(req.body.reason);if (!reason) return await res.status(400).json({ error: 'Reversal reason is required.' });let reversalJournalId = null,voidedFinance = 0;if (a.finance_entry_id && voidFinanceBySource) {voidedFinance = await voidFinanceBySource('Employee Advance', a.id, 'Employee advance reversed: ' + reason, req.user.id, a.business_unit_id);const j = await db.prepare("SELECT id FROM accounting_journal_entries WHERE reversal_of_id=? ORDER BY id DESC LIMIT 1").get(a.journal_entry_id);reversalJournalId = j?.id || null;} else if (a.journal_entry_id) {const j = await db.prepare("SELECT * FROM accounting_journal_entries WHERE id=?").get(a.journal_entry_id);reversalJournalId = j ? await reverseJournal(j, 'Employee advance reversed: ' + reason, req.user.id) : null;}await db.prepare("UPDATE employee_advances SET status='Reversed',outstanding_krw=0,notes=COALESCE(notes,'')||?,updated_at=bom.utc_now() WHERE id=?").run(' | REVERSED: ' + reason, a.id);await audit(req.user, 'employee_advance', a.id, 'reverse', JSON.stringify({ reason, reversal_journal_id: reversalJournalId, finance_voided: voidedFinance }));await res.json({ ok: true, reversal_journal_id: reversalJournalId, finance_voided: voidedFinance });});

  await app.get('/api/payroll/runs', auth, requirePayroll, async (req, res) => {const f = req.selected_business_unit_id ? ' AND r.business_unit_id=?' : req.user.role === 'CEO / Owner' ? '' : req.user.business_unit_id ? ' AND r.business_unit_id=?' : ' AND 1=0',args = req.selected_business_unit_id ? [req.selected_business_unit_id] : req.user.role === 'CEO / Owner' ? [] : req.user.business_unit_id ? [req.user.business_unit_id] : [];await res.json(await db.prepare(`SELECT r.*,b.name business_unit,u.name created_by_name,(SELECT COUNT(*) FROM payroll_run_items i WHERE i.payroll_run_id=r.id) employee_count,(SELECT COALESCE(SUM(i.gross_salary_krw),0) FROM payroll_run_items i WHERE i.payroll_run_id=r.id) gross_total,(SELECT COALESCE(SUM(i.advance_deduction_krw),0) FROM payroll_run_items i WHERE i.payroll_run_id=r.id) advance_total,(SELECT COALESCE(SUM(i.net_salary_krw),0) FROM payroll_run_items i WHERE i.payroll_run_id=r.id) net_total,(SELECT COALESCE(SUM(i.paid_krw),0) FROM payroll_run_items i WHERE i.payroll_run_id=r.id) paid_total,(SELECT COALESCE(SUM(i.outstanding_krw),0) FROM payroll_run_items i WHERE i.payroll_run_id=r.id) outstanding_total FROM payroll_runs r LEFT JOIN business_units b ON b.id=r.business_unit_id LEFT JOIN users u ON u.id=r.created_by WHERE 1=1${f} ORDER BY r.period_end DESC,r.id DESC`).all(...args));});
  await app.post('/api/payroll/runs', auth, requirePayroll, async (req, res) => {let bu;try {bu = writableBusinessUnit(req, req.body);} catch (e) {return await res.status(400).json({ error: e.message });}const start = dateOnly(req.body.period_start),end = dateOnly(req.body.period_end);if (!start || !end || end < start) return await res.status(400).json({ error: 'Valid payroll period start and end dates are required.' });const existing = await db.prepare("SELECT id FROM payroll_runs WHERE business_unit_id=? AND period_start=? AND period_end=? AND status!='Reversed'").get(bu, start, end);if (existing) return await res.status(409).json({ error: 'A payroll run already exists for this business unit and period.' });const emps = await db.prepare("SELECT * FROM employees WHERE business_unit_id=? AND employment_status='Active' AND (join_date IS NULL OR bom.utc_date(join_date)<=bom.utc_date(?)) AND (leave_date IS NULL OR bom.utc_date(leave_date)>=bom.utc_date(?)) ORDER BY name").all(bu, end, start);if (!emps.length) return await res.status(400).json({ error: 'No active employees are available for this business unit and payroll period.' });const tx = db.atomic(async () => {const r = await db.prepare("INSERT INTO payroll_runs(payroll_no,business_unit_id,period_start,period_end,pay_date,notes,created_by) VALUES(?,?,?,?,?,?,?)").run(await numbering.next('payroll.run', { businessUnitId: bu }), bu, start, end, dateOnly(req.body.pay_date) || null, text(req.body.notes), req.user.id),runId = Number(r.lastInsertRowid),insItem = db.prepare("INSERT INTO payroll_run_items(payroll_run_id,employee_id,base_salary_krw,payslip_no) VALUES(?,?,?,?)"),insComp = db.prepare("INSERT INTO payroll_run_item_components(payroll_run_item_id,component_name,component_type,amount_krw,source_component_id,notes) VALUES(?,?,?,?,?,?)");for (const e of emps) {const ir = await insItem.run(runId, e.id, employeeBaseKrwForPeriod(e, start, end), `${(await numbering.prefix('payroll.payslip', bu)) || 'PS'}-${runId}-${e.id}`),itemId = Number(ir.lastInsertRowid),cs = await db.prepare("SELECT * FROM employee_salary_components WHERE employee_id=? AND active=1 AND recurring=1").all(e.id);for (const c of cs) await insComp.run(itemId, c.component_name, c.component_type, num(c.amount) * (text(c.currency).toUpperCase() === 'KRW' ? 1 : num(c.fx_rate)), c.id, c.notes || '');await rebuildPayrollItem(itemId);await applyScheduledAdvanceToItem(itemId, end);}await refreshPayrollRunTotals(runId);await audit(req.user, 'payroll_run', runId, 'create', JSON.stringify({ business_unit_id: bu, period_start: start, period_end: end, employees: emps.length }));return { id: runId, employees: emps.length };});await res.json(await tx());});
  await app.get('/api/payroll/runs/:id', auth, requirePayroll, async (req, res) => {const r = await db.prepare("SELECT r.*,b.name business_unit FROM payroll_runs r LEFT JOIN business_units b ON b.id=r.business_unit_id WHERE r.id=?").get(req.params.id);if (!r || !enforceUnit(req, r.business_unit_id)) return await res.status(404).json({ error: 'Payroll run not found' });await refreshPayrollRunTotals(r.id);const run = await db.prepare("SELECT r.*,b.name business_unit FROM payroll_runs r LEFT JOIN business_units b ON b.id=r.business_unit_id WHERE r.id=?").get(r.id),items = await db.prepare(`SELECT i.*,e.employee_no,e.name,e.job_title,e.department,(SELECT COALESCE(SUM(outstanding_krw),0) FROM employee_advances a WHERE a.employee_id=e.id AND a.status='Active') current_advance_balance_krw FROM payroll_run_items i JOIN employees e ON e.id=i.employee_id WHERE i.payroll_run_id=? ORDER BY e.name`).all(r.id);for (const i of items) {i.advance_outstanding_krw = i.current_advance_balance_krw;i.advance_balance_changed = Math.abs(Number(i.current_advance_balance_krw || 0) - Number(i.advance_balance_before_krw || 0)) > 0.005;i.components = await db.prepare("SELECT * FROM payroll_run_item_components WHERE payroll_run_item_id=? ORDER BY component_type,component_name").all(i.id);i.cost_allocations = await getEmployeeAllocations(i.employee_id, run.business_unit_id);}const payments = await db.prepare(`SELECT p.*,a.name payment_account,j.journal_no FROM payroll_payments p LEFT JOIN accounting_payment_accounts a ON a.id=p.payment_account_id LEFT JOIN accounting_journal_entries j ON j.id=p.journal_entry_id WHERE p.payroll_run_id=? ORDER BY p.payment_date,p.id`).all(r.id),journals = await db.prepare(`SELECT x.*,j.journal_no,j.status journal_status FROM payroll_run_journals x JOIN accounting_journal_entries j ON j.id=x.journal_entry_id WHERE x.payroll_run_id=? ORDER BY x.id`).all(r.id);await res.json({ run, items, payments, journals });});
  app.put('/api/payroll/runs/:id/items/:itemId', auth, requirePayroll, async (req, res) => {const i = await db.prepare("SELECT i.*,r.status run_status,r.business_unit_id,r.period_end FROM payroll_run_items i JOIN payroll_runs r ON r.id=i.payroll_run_id WHERE i.id=? AND i.payroll_run_id=?").get(req.params.itemId, req.params.id);if (!i || !enforceUnit(req, i.business_unit_id)) return await res.status(404).json({ error: 'Payroll item not found' });if (i.run_status !== 'Draft') return await res.status(409).json({ error: 'Only Draft payroll can be edited.' });
    if (Array.isArray(req.body.one_time_components)) {await db.prepare("DELETE FROM payroll_run_item_components WHERE payroll_run_item_id=? AND source_component_id IS NULL").run(i.id);const ins = db.prepare("INSERT INTO payroll_run_item_components(payroll_run_item_id,component_name,component_type,amount_krw,notes) VALUES(?,?,?,?,?)");for (const c of req.body.one_time_components) {if (PAYROLL_COMPONENT_TYPES.includes(c.component_type) && num(c.amount_krw) > 0) await ins.run(i.id, text(c.component_name) || c.component_type, c.component_type, num(c.amount_krw), text(c.notes));}}
    await db.prepare("UPDATE payroll_run_items SET base_salary_krw=?,notes=?,updated_at=bom.utc_now() WHERE id=?").run(num(req.body.base_salary_krw ?? i.base_salary_krw), req.body.notes ?? i.notes, i.id);const before = await rebuildPayrollItem(i.id),available = await employeeAdvanceBalance(i.employee_id),preAdvancePayable = Math.max(0, num(before.gross_salary_krw) - num(before.deductions_krw)),plan = await scheduledAdvanceRecovery(i.employee_id, preAdvancePayable, i.period_end),mode = text(req.body.advance_recovery_mode || 'Custom'),requested = num(req.body.advance_deduction_krw ?? i.advance_deduction_krw),adv = mode === 'Scheduled' ? plan.scheduled : mode === 'Full' ? Math.min(available, preAdvancePayable) : mode === 'Skip' ? 0 : requested,reason = text(req.body.advance_recovery_reason || '');if (adv < 0 || adv > available + 0.005 || adv > preAdvancePayable + 0.005) return await res.status(400).json({ error: 'Advance recovery must be between zero and the lower of outstanding advance balance and payroll amount available for recovery.' });const differs = Math.abs(adv - plan.scheduled) > 0.005;if (differs && !reason) return await res.status(400).json({ error: "Enter a reason when advance recovery differs from the scheduled recovery terms." });const exception = !differs ? '' : mode === 'Skip' ? 'Skipped' : mode === 'Full' ? 'Full Recovery Override' : 'Custom Override';await db.prepare(`UPDATE payroll_run_items SET advance_balance_before_krw=?,scheduled_advance_recovery_krw=?,advance_deduction_krw=?,advance_balance_after_krw=?,advance_recovery_method_snapshot=?,advance_recovery_value_snapshot=?,advance_recovery_exception=?,advance_recovery_reason=?,updated_at=bom.utc_now() WHERE id=?`).run(available, plan.scheduled, adv, Math.max(0, available - adv), plan.method, plan.value, exception, reason, i.id);const row = await rebuildPayrollItem(i.id);await refreshPayrollRunTotals(req.params.id);await audit(req.user, 'payroll_run_item', i.id, 'advance-recovery-review', JSON.stringify({ scheduled: plan.scheduled, applied: adv, mode, reason, balance_before: available, balance_after: Math.max(0, available - adv) }));await res.json(row);});
  await app.post('/api/payroll/runs/:id/items/:itemId/refresh-advance', auth, requirePayroll, async (req, res) => {const i = await db.prepare("SELECT i.*,r.status run_status,r.business_unit_id,r.period_end FROM payroll_run_items i JOIN payroll_runs r ON r.id=i.payroll_run_id WHERE i.id=? AND i.payroll_run_id=?").get(req.params.itemId, req.params.id);if (!i || !enforceUnit(req, i.business_unit_id)) return await res.status(404).json({ error: 'Payroll item not found' });if (i.run_status !== 'Draft') return await res.status(409).json({ error: 'Only Draft payroll can refresh advance recovery.' });const row = await applyScheduledAdvanceToItem(i.id, i.period_end);await refreshPayrollRunTotals(req.params.id);await audit(req.user, 'payroll_run_item', i.id, 'advance-recovery-refresh', JSON.stringify({ scheduled: row.scheduled_advance_recovery_krw, balance_before: row.advance_balance_before_krw }));await res.json(row);});

  async function consumeEmployeeAdvance(employeeId, amount, payrollRunItemId) {let remaining = Math.max(0, num(amount));if (!remaining) return [];const rows = await db.prepare("SELECT * FROM employee_advances WHERE employee_id=? AND status='Active' AND outstanding_krw>0 ORDER BY advance_date,id").all(employeeId),used = [],ins = db.prepare("INSERT INTO payroll_advance_recoveries(payroll_run_item_id,employee_advance_id,amount_krw,status) VALUES(?,?,?,'Applied')");for (const a of rows) {if (remaining <= 0.005) break;const take = Math.min(remaining, num(a.outstanding_krw));await db.prepare("UPDATE employee_advances SET outstanding_krw=outstanding_krw-?,status=CASE WHEN outstanding_krw-?<=0.005 THEN 'Recovered' ELSE status END,updated_at=bom.utc_now() WHERE id=?").run(take, take, a.id);await ins.run(payrollRunItemId, a.id, take);used.push({ id: a.id, amount: take });remaining -= take;}if (remaining > 0.005) throw new Error('Advance deduction exceeds the employee outstanding advance balance.');return used;}
  async function restorePayrollAdvanceRecoveries(payrollRunItemId) {const rows = await db.prepare("SELECT * FROM payroll_advance_recoveries WHERE payroll_run_item_id=? AND status='Applied' ORDER BY id").all(payrollRunItemId);for (const r of rows) {await db.prepare("UPDATE employee_advances SET outstanding_krw=outstanding_krw+?,status='Active',updated_at=bom.utc_now() WHERE id=?").run(num(r.amount_krw), r.employee_advance_id);await db.prepare("UPDATE payroll_advance_recoveries SET status='Reversed',reversed_at=bom.utc_now() WHERE id=?").run(r.id);}}
  function splitAmount(total, allocations) {let remaining = Math.round(num(total) * 100) / 100;return allocations.map((a, idx) => {const amt = idx === allocations.length - 1 ? remaining : Math.round(num(total) * (num(a.percentage) / 100) * 100) / 100;remaining = Math.round((remaining - amt) * 100) / 100;return { ...a, amount_krw: amt };});}

  await app.post('/api/payroll/runs/:id/approve', auth, requirePayroll, async (req, res) => {const run = await db.prepare("SELECT * FROM payroll_runs WHERE id=?").get(req.params.id);if (!run || !enforceUnit(req, run.business_unit_id)) return await res.status(404).json({ error: 'Payroll run not found' });if (run.status !== 'Draft') return await res.status(409).json({ error: 'Only Draft payroll can be approved.' });const items = await db.prepare("SELECT * FROM payroll_run_items WHERE payroll_run_id=?").all(run.id);if (!items.length) return await res.status(400).json({ error: 'Payroll run has no employees.' });const itemAllocations = new Map(),grossByBu = new Map();for (const i of items) {const e = await db.prepare("SELECT * FROM employees WHERE id=?").get(i.employee_id),alloc = await normalizeAllocations(e, await getEmployeeAllocations(e.id, e.business_unit_id));itemAllocations.set(i.id, alloc);for (const x of splitAmount(i.gross_salary_krw, alloc)) grossByBu.set(x.business_unit_id, ((await grossByBu.get(x.business_unit_id)) || 0) + x.amount_krw);}for (const bu of grossByBu.keys()) if (await isPeriodClosed(bu, run.period_end)) return await res.status(409).json({ error: `Payroll cost allocation includes business unit ${bu} whose accounting period is closed.` });for (const i of items) {const current = await employeeAdvanceBalance(i.employee_id);if (Math.abs(current - num(i.advance_balance_before_krw)) > 0.005) return await res.status(409).json({ error: `Advance balance changed for employee #${i.employee_id} after this payroll draft was prepared. Refresh/review the employee advance recovery before approval.` });}const tx = db.atomic(async () => {let gross = 0,net = 0,advance = 0,otherDed = 0;for (const i of items) {gross += num(i.gross_salary_krw);net += num(i.net_salary_krw);advance += num(i.advance_deduction_krw);otherDed += num(i.deductions_krw);if (num(i.advance_deduction_krw) > 0) {await consumeEmployeeAdvance(i.employee_id, i.advance_deduction_krw, i.id);if (i.advance_recovery_method_snapshot === 'Fixed Payrolls' && !i.advance_recovery_exception) await db.prepare("UPDATE employee_advance_recovery_terms SET installments_remaining=GREATEST(0,installments_remaining-1),updated_at=bom.utc_now() WHERE employee_id=? AND active=1").run(i.employee_id);}}const primaryGross = Number((await grossByBu.get(Number(run.business_unit_id))) || 0),otherGross = Math.max(0, gross - primaryGross),primaryLines = [];if (primaryGross > 0) primaryLines.push({ account_id: await accountId('SALARY_EXPENSE'), business_unit_id: run.business_unit_id, debit_krw: primaryGross, credit_krw: 0, memo: `Payroll salary cost ${run.period_start} to ${run.period_end}` });if (otherGross > 0) primaryLines.push({ account_id: await accountId('INTER_BU_RECEIVABLE'), business_unit_id: run.business_unit_id, debit_krw: otherGross, credit_krw: 0, memo: "Payroll cost recoverable from other business units" });primaryLines.push({ account_id: await accountId('SALARY_PAYABLE'), business_unit_id: run.business_unit_id, debit_krw: 0, credit_krw: net, memo: 'Net salary payable' });if (advance > 0) primaryLines.push({ account_id: await accountId('EMPLOYEE_ADVANCES'), business_unit_id: run.business_unit_id, debit_krw: 0, credit_krw: advance, memo: 'Employee advances recovered through payroll' });if (otherDed > 0) primaryLines.push({ account_id: await accountId('PAYROLL_DEDUCTIONS_PAYABLE'), business_unit_id: run.business_unit_id, debit_krw: 0, credit_krw: otherDed, memo: 'Other payroll deductions payable' });const primaryJid = await postJournal({ businessUnitId: run.business_unit_id, transactionDate: run.period_end, sourceType: 'Payroll Accrual', sourceId: run.id, sourceLabel: 'Payroll → Salary Accrual', description: `Payroll ${run.payroll_no}`, createdBy: req.user.id, lines: primaryLines });const link = db.prepare("INSERT INTO payroll_run_journals(payroll_run_id,journal_entry_id,journal_type,business_unit_id,status) VALUES(?,?,?,?,'Active')");await link.run(run.id, primaryJid, 'Accrual', run.business_unit_id);const journalIds = [primaryJid];for (const [bu, amt0] of grossByBu) {const amt = Math.round(num(amt0) * 100) / 100;if (Number(bu) === Number(run.business_unit_id) || amt <= 0) continue;const jid = await postJournal({ businessUnitId: bu, transactionDate: run.period_end, sourceType: 'Payroll Cost Allocation', sourceId: run.id, sourceLabel: 'Payroll → BU Cost Allocation', description: `Allocated payroll cost from ${run.payroll_no}`, createdBy: req.user.id, lines: [{ account_id: await accountId('SALARY_EXPENSE'), business_unit_id: bu, debit_krw: amt, credit_krw: 0, memo: 'Allocated employee salary cost' }, { account_id: await accountId('INTER_BU_PAYABLE'), business_unit_id: bu, debit_krw: 0, credit_krw: amt, memo: `Payroll cost payable to business unit ${run.business_unit_id}` }] });await link.run(run.id, jid, 'Allocation', bu);journalIds.push(jid);}await db.prepare("UPDATE payroll_runs SET status='Approved',approval_journal_id=?,total_paid_krw=0,outstanding_krw=?,approved_by=?,approved_at=bom.utc_now(),updated_at=bom.utc_now() WHERE id=?").run(primaryJid, net, req.user.id, run.id);await db.prepare("UPDATE payroll_run_items SET status='Approved',paid_krw=0,outstanding_krw=net_salary_krw,updated_at=bom.utc_now() WHERE payroll_run_id=?").run(run.id);await audit(req.user, 'payroll_run', run.id, 'approve', JSON.stringify({ gross, net, advance, deductions: otherDed, journal_ids: journalIds, allocated_business_units: [...(await grossByBu.entries())] }));return { journal_id: primaryJid, journal_ids: journalIds, gross, net };});try {await res.json(await tx());} catch (x) {await res.status(409).json({ error: x.message });}});

  await require('./v357-payroll-link').install({ app, db, auth, requirePayroll, enforceUnit, isPeriodClosed, refreshPayrollRunTotals, audit });

  await app.post('/api/payroll/runs/:id/reverse', auth, async (req, res) => {if (req.user.role !== 'CEO / Owner') return await res.status(403).json({ error: 'Only CEO / Owner can reverse an approved or paid payroll run.' });const run = await db.prepare("SELECT * FROM payroll_runs WHERE id=?").get(req.params.id);if (!run) return await res.status(404).json({ error: 'Payroll run not found' });if (!['Approved', 'Partially Paid', 'Paid'].includes(run.status)) return await res.status(409).json({ error: 'Only Approved, Partially Paid or Paid payroll can be reversed.' });const reason = text(req.body.reason);if (!reason) return await res.status(400).json({ error: 'Reversal reason is required.' });if (await db.prepare("SELECT id FROM payroll_payments WHERE payroll_run_id=? AND finance_entry_id IS NOT NULL AND status='Active' LIMIT 1").get(run.id)) return await res.status(409).json({ error: 'This payroll has an existing posted Finance payment. Resolve that Finance payment through controlled correction before reversing the accrual.' });const links = await db.prepare("SELECT x.*,j.business_unit_id,j.status journal_status,j.transaction_date FROM payroll_run_journals x JOIN accounting_journal_entries j ON j.id=x.journal_entry_id WHERE x.payroll_run_id=? AND x.status='Active' ORDER BY CASE WHEN x.journal_type='Payment' THEN 0 ELSE 1 END,x.id DESC").all(run.id);for (const x of links) if (x.journal_status === 'Posted' && x.business_unit_id && (await isPeriodClosed(x.business_unit_id, nowDate()))) return await res.status(409).json({ error: 'The current accounting period is closed for one of the payroll business units. Reopen it before reversal.' });const tx = db.atomic(async () => {const reversalIds = [];for (const x of links) {const j = await db.prepare("SELECT * FROM accounting_journal_entries WHERE id=?").get(x.journal_entry_id);if (j && !['Reversed', 'Cancelled'].includes(j.status)) {const rid = await reverseJournal(j, 'Payroll reversed: ' + reason, req.user.id);if (rid) reversalIds.push(rid);}await db.prepare("UPDATE payroll_run_journals SET status='Reversed' WHERE id=?").run(x.id);}await db.prepare("UPDATE payroll_payments SET status='Reversed',reversed_by=?,reversed_at=bom.utc_now(),reversal_reason=? WHERE payroll_run_id=? AND status='Active'").run(req.user.id, reason, run.id);await db.prepare("UPDATE payroll_payment_allocations SET status='Reversed' WHERE payroll_payment_id IN (SELECT id FROM payroll_payments WHERE payroll_run_id=?)").run(run.id);const items = await db.prepare("SELECT * FROM payroll_run_items WHERE payroll_run_id=?").all(run.id);for (const i of items) {await restorePayrollAdvanceRecoveries(i.id);if (i.advance_recovery_method_snapshot === 'Fixed Payrolls' && num(i.advance_deduction_krw) > 0 && !i.advance_recovery_exception) await db.prepare("UPDATE employee_advance_recovery_terms SET installments_remaining=LEAST(CASE WHEN installments_total>0 THEN installments_total ELSE installments_remaining+1 END,installments_remaining+1),updated_at=bom.utc_now() WHERE employee_id=? AND active=1").run(i.employee_id);}await db.prepare("UPDATE payroll_runs SET status='Reversed',total_paid_krw=0,outstanding_krw=0,reversed_by=?,reversed_at=bom.utc_now(),reversal_reason=?,updated_at=bom.utc_now() WHERE id=?").run(req.user.id, reason, run.id);await db.prepare("UPDATE payroll_run_items SET status='Reversed',updated_at=bom.utc_now() WHERE payroll_run_id=?").run(run.id);await audit(req.user, 'payroll_run', run.id, 'reverse', JSON.stringify({ reason, reversal_journal_ids: reversalIds }));return { ok: true, reversal_journal_ids: reversalIds };});await res.json(await tx());});

  // Compact bilingual PDF generator for salary slips.
  const KO = {
    'Salary Slip': '급여 명세서', 'Employee': '직원', 'Employee No.': '직원 번호', 'Business Unit': '사업부', 'Role / Position': '직책', 'Payroll Period': '급여 기간', 'Payment Date': '지급일', 'Base Salary': '기본급', 'Allowances / Additions': '수당 / 추가 지급', 'Gross Salary': '총 급여', 'Deductions': '공제', 'Advance Deduction': '선급금 공제', 'Net Salary': '실수령액', 'Paid Amount': '지급액', 'Outstanding': '미지급액', 'Payment Status': '지급 상태', 'Payment Reference': '결제 참조', 'Generated': '생성일', 'Paid': '지급 완료', 'Partially Paid': '부분 지급', 'Approved': '승인됨', 'Draft': '초안', 'Reversed': '취소됨'
  };
  function pdfTr(v, lang) {const s = String(v ?? '');return lang === 'ko' ? KO[s] || s : s;}
  function pdfEsc(s) {return String(s ?? '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[\r\n]+/g, ' ');}
  function unicodeHex(s) {const le = Buffer.from('\uFEFF' + String(s ?? ''), 'utf16le');for (let i = 0; i < le.length; i += 2) {const x = le[i];le[i] = le[i + 1];le[i + 1] = x;}return '<' + le.toString('hex').toUpperCase() + '>';}
  function pdfToken(v, lang) {const s = pdfTr(v, lang);return /[^\x20-\x7e]/.test(s) ? unicodeHex(s) : `(${pdfEsc(s)})`;}
  function payslipPdf(data, lang = 'ko') {
    const W = 612,H = 792,lines = ['BT', '0.10 0.14 0.22 rg'];let y = 744;
    const txt = (x, val, size = 9, bold = false) => {const s = pdfTr(val, lang),uni = /[^\x20-\x7e]/.test(s),font = uni ? bold ? 'F4' : 'F3' : bold ? 'F2' : 'F1';lines.push(`/${font} ${size} Tf`, `1 0 0 1 ${x} ${y} Tm ${pdfToken(val, lang)} Tj`);};
    const row = (label, value) => {txt(40, label, 8, true);txt(205, String(value ?? ''), 8, false);y -= 15;};
    txt(40, 'BLUE OCEAN MARKET', 16, true);y -= 23;txt(40, 'Salary Slip', 13, true);y -= 25;
    row('Employee', data.employee.name);row('Employee No.', data.employee.employee_no);row('Business Unit', data.employee.business_unit || '');row('Role / Position', data.employee.job_title || '');row('Payroll Period', `${data.run.period_start} - ${data.run.period_end}`);row('Payment Date', data.run.pay_date || '—');
    y -= 10;row('Base Salary', 'KRW ' + money(data.item.base_salary_krw));row('Allowances / Additions', 'KRW ' + money(data.item.allowances_krw));row('Gross Salary', 'KRW ' + money(data.item.gross_salary_krw));row('Deductions', 'KRW ' + money(data.item.deductions_krw));row('Advance Deduction', 'KRW ' + money(data.item.advance_deduction_krw));
    y -= 5;txt(40, 'Net Salary', 10, true);txt(205, 'KRW ' + money(data.item.net_salary_krw), 10, true);y -= 20;
    row('Paid Amount', 'KRW ' + money(data.item.paid_krw));row('Outstanding', 'KRW ' + money(data.item.outstanding_krw));row('Payment Status', data.item.status || data.run.status);row('Payment Reference', data.run.payment_reference || '—');row('Generated', new Date().toISOString().slice(0, 16).replace('T', ' '));
    lines.push('ET');const stream = lines.join('\n'),objects = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>', '<< /Type /Font /Subtype /Type0 /BaseFont /HYSMyeongJo-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [7 0 R] >>', '<< /Type /Font /Subtype /Type0 /BaseFont /HYGoThic-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [8 0 R] >>', '<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYSMyeongJo-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> >>', '<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYGoThic-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> >>'];const contentId = objects.length + 1;objects.push(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`);const pageId = objects.length + 1;objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents ${contentId} 0 R >>`);objects[1] = `<< /Type /Pages /Count 1 /Kids [${pageId} 0 R] >>`;let out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n',offsets = [0];for (let i = 0; i < objects.length; i++) {offsets.push(Buffer.byteLength(out, 'binary'));out += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;}const xref = Buffer.byteLength(out, 'binary');out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;for (let i = 1; i < offsets.length; i++) out += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return Buffer.from(out, 'binary');
  }
  await app.get('/api/payroll/runs/:runId/items/:itemId/payslip.pdf', auth, requirePayroll, async (req, res) => {
    const row = await db.prepare(`SELECT i.*,r.payroll_no,r.business_unit_id,r.period_start,r.period_end,r.pay_date,r.status run_status,e.employee_no,e.name,e.job_title,b.name business_unit FROM payroll_run_items i JOIN payroll_runs r ON r.id=i.payroll_run_id JOIN employees e ON e.id=i.employee_id LEFT JOIN business_units b ON b.id=e.business_unit_id WHERE i.id=? AND i.payroll_run_id=?`).get(req.params.itemId, req.params.runId);
    if (!row || !enforceUnit(req, row.business_unit_id)) return await res.status(404).json({ error: 'Payslip not found' });
    const refs = (await db.prepare(`SELECT reference FROM payroll_payments p JOIN payroll_payment_allocations a ON a.payroll_payment_id=p.id WHERE p.payroll_run_id=? AND a.payroll_run_item_id=? AND p.status='Active' AND a.status='Active' ORDER BY p.payment_date,p.id`).all(req.params.runId, req.params.itemId)).map((x) => x.reference).filter(Boolean);
    const lang = text(req.query.lang || req.headers['x-language'] || 'ko').toLowerCase() === 'en' ? 'en' : 'ko';
    const buf = payslipPdf({ employee: { employee_no: row.employee_no, name: row.name, job_title: row.job_title, business_unit: row.business_unit }, run: { period_start: row.period_start, period_end: row.period_end, pay_date: row.pay_date, status: row.run_status, payment_reference: refs.join(', ') }, item: row }, lang);
    res.set('Content-Type', 'application/pdf');res.set('Content-Disposition', `attachment; filename="Payslip_${row.employee_no}_${row.period_end}.pdf"`);res.set('Cache-Control', 'no-store');res.send(buf);
  });

  await app.get('/api/payroll/summary', auth, requirePayroll, async (req, res) => {const f = employeeScope(req, 'e'),employees = Number((await db.prepare(`SELECT COUNT(*) c FROM employees e WHERE e.employment_status='Active'${f.sql}`).get(...f.args)).c || 0),salary = Number((await db.prepare(`SELECT COALESCE(SUM(e.base_salary*CASE WHEN e.salary_currency='KRW' THEN 1 ELSE e.salary_fx_rate END),0) v FROM employees e WHERE e.employment_status='Active'${f.sql}`).get(...f.args)).v || 0),advances = Number((await db.prepare(`SELECT COALESCE(SUM(a.outstanding_krw),0) v FROM employee_advances a JOIN employees e ON e.id=a.employee_id WHERE a.status='Active'${f.sql}`).get(...f.args)).v || 0),pending = Number((await db.prepare(`SELECT COUNT(*) c FROM payroll_runs r WHERE r.status IN ('Draft','Approved','Partially Paid')${req.selected_business_unit_id ? ' AND r.business_unit_id=?' : req.user.role === 'CEO / Owner' ? '' : req.user.business_unit_id ? ' AND r.business_unit_id=?' : ' AND 1=0'}`).get(...(req.selected_business_unit_id ? [req.selected_business_unit_id] : req.user.role === 'CEO / Owner' ? [] : req.user.business_unit_id ? [req.user.business_unit_id] : []))).c || 0);await res.json({ employees, monthly_base_salary_krw: salary, employee_advances_outstanding_krw: advances, pending_runs: pending });});

  // Lightweight integrity endpoint for the financial core.
  await app.get('/api/accounting/integrity', auth, allow('finance', 'dashboard'), async (req, res) => {const f = unitFilter(req, 'j'),unbalanced = (await db.prepare(`SELECT COUNT(*) c FROM (SELECT j.id,ROUND(SUM(l.debit_krw-l.credit_krw),2) diff FROM accounting_journal_entries j JOIN accounting_journal_lines l ON l.journal_entry_id=j.id WHERE j.status IN ('Posted','Reversed')${f.sql} GROUP BY j.id HAVING ABS(ROUND(SUM(l.debit_krw-l.credit_krw),2))>0.01)`).get(...f.args)).c,financeUnposted = req.selected_business_unit_id ? (await db.prepare("SELECT COUNT(*) c FROM finance_entries WHERE status!='Voided' AND accounting_status NOT IN ('Posted','Skipped','Reversed','Pending Review','Correction Required') AND business_unit_id=?").get(req.selected_business_unit_id)).c : req.user.role === 'CEO / Owner' ? (await db.prepare("SELECT COUNT(*) c FROM finance_entries WHERE status!='Voided' AND accounting_status NOT IN ('Posted','Skipped','Reversed','Pending Review','Correction Required')").get()).c : (await db.prepare("SELECT COUNT(*) c FROM finance_entries WHERE status!='Voided' AND accounting_status NOT IN ('Posted','Skipped','Reversed','Pending Review','Correction Required') AND business_unit_id=?").get(req.user.business_unit_id)).c,suspense = (await db.prepare(`SELECT ROUND(COALESCE(SUM(ABS(l.debit_krw-l.credit_krw)),0),2) v FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id JOIN accounting_accounts a ON a.id=l.account_id WHERE j.status IN ('Posted','Reversed') AND a.subtype='Suspense'${f.sql}`).get(...f.args)).v,exceptions = req.selected_business_unit_id ? (await db.prepare("SELECT COUNT(*) c FROM accounting_exceptions WHERE status='Open' AND business_unit_id=?").get(req.selected_business_unit_id)).c : req.user.role === 'CEO / Owner' ? (await db.prepare("SELECT COUNT(*) c FROM accounting_exceptions WHERE status='Open'").get()).c : (await db.prepare("SELECT COUNT(*) c FROM accounting_exceptions WHERE status='Open' AND business_unit_id=?").get(req.user.business_unit_id)).c;const pendingReview = req.selected_business_unit_id ? (await db.prepare("SELECT COUNT(*) c FROM accounting_journal_entries WHERE status IN ('Pending Review','Correction Required') AND business_unit_id=?").get(req.selected_business_unit_id)).c : req.user.role === 'CEO / Owner' ? (await db.prepare("SELECT COUNT(*) c FROM accounting_journal_entries WHERE status IN ('Pending Review','Correction Required')").get()).c : (await db.prepare("SELECT COUNT(*) c FROM accounting_journal_entries WHERE status IN ('Pending Review','Correction Required') AND business_unit_id=?").get(req.user.business_unit_id)).c;await res.json({ ok: !Number(unbalanced) && !Number(financeUnposted) && !Number(exceptions) && !Number(pendingReview), unbalanced_journals: Number(unbalanced || 0), finance_not_posted: Number(financeUnposted || 0), pending_posting_review: Number(pendingReview || 0), open_exceptions: Number(exceptions || 0), suspense_activity_krw: Number(suspense || 0), sync_queue: Number((await db.prepare("SELECT COUNT(*) c FROM accounting_sync_queue").get()).c || 0) });});

  return { version: VERSION, processQueue, scheduleQueue, syncFinanceEntry, postJournal, reverseJournal, accountId, isPeriodClosed };
}

module.exports = { install, VERSION };
