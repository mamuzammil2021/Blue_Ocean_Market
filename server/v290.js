const crypto=require('crypto');
const multer=require('multer');

const VERSION='29.1.0';

function install({app,db,auth,allow,currentUnit,enforceUnit,isFinanceReviewer,audit,notify,uploads}){
  const upload=multer({dest:uploads,limits:{fileSize:20*1024*1024}});
  const nowDate=()=>new Date().toISOString().slice(0,10);
  const num=v=>Number(v||0);
  const text=v=>String(v??'').trim();
  const money=n=>Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
  const dateOnly=v=>String(v||'').slice(0,10);
  const periodKey=v=>dateOnly(v||nowDate()).slice(0,7);
  const nextNo=(prefix,table)=>`${prefix}-${new Date().getFullYear()}-${String(Number(db.prepare(`SELECT COUNT(*) c FROM ${table}`).get().c||0)+1).padStart(6,'0')}`;
  const columnExists=(table,col)=>db.prepare(`PRAGMA table_info(${table})`).all().some(x=>x.name===col);
  const ensureColumn=(table,col,def)=>{if(!columnExists(table,col)){try{db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`)}catch(e){console.error('V29 column',table,col,e.message)}}};

  // ---------------------------------------------------------------------------
  // Schema: one company accounting engine, business-unit dimensions, payroll.
  // ---------------------------------------------------------------------------
  db.exec(`
  CREATE TABLE IF NOT EXISTS accounting_accounts(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    subtype TEXT DEFAULT '',
    normal_balance TEXT NOT NULL DEFAULT 'Debit',
    system_key TEXT UNIQUE,
    currency TEXT NOT NULL DEFAULT 'KRW',
    active INTEGER NOT NULL DEFAULT 1,
    allow_manual INTEGER NOT NULL DEFAULT 1,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS accounting_payment_accounts(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER,
    name TEXT NOT NULL,
    payment_type TEXT NOT NULL DEFAULT 'Bank',
    currency TEXT NOT NULL DEFAULT 'KRW',
    ledger_account_id INTEGER NOT NULL,
    bank_name TEXT DEFAULT '',
    account_last4 TEXT DEFAULT '',
    is_default INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    notes TEXT DEFAULT '',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
    FOREIGN KEY(ledger_account_id) REFERENCES accounting_accounts(id)
  );
  CREATE TABLE IF NOT EXISTS accounting_journal_entries(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journal_no TEXT NOT NULL UNIQUE,
    business_unit_id INTEGER,
    transaction_date TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_id INTEGER,
    source_label TEXT DEFAULT '',
    description TEXT DEFAULT '',
    finance_entry_id INTEGER UNIQUE,
    source_hash TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Posted',
    reversal_of_id INTEGER,
    reversed_by_id INTEGER,
    created_by INTEGER,
    posted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
    FOREIGN KEY(reversal_of_id) REFERENCES accounting_journal_entries(id)
  );
  CREATE TABLE IF NOT EXISTS accounting_journal_lines(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journal_entry_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    business_unit_id INTEGER,
    debit_krw REAL NOT NULL DEFAULT 0,
    credit_krw REAL NOT NULL DEFAULT 0,
    original_amount REAL DEFAULT 0,
    original_currency TEXT DEFAULT 'KRW',
    fx_rate REAL DEFAULT 1,
    entity_type TEXT DEFAULT '',
    entity_id INTEGER,
    dimension_json TEXT DEFAULT '{}',
    memo TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(journal_entry_id) REFERENCES accounting_journal_entries(id) ON DELETE CASCADE,
    FOREIGN KEY(account_id) REFERENCES accounting_accounts(id),
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
  );
  CREATE TABLE IF NOT EXISTS accounting_sync_queue(
    finance_entry_id INTEGER PRIMARY KEY,
    queued_at TEXT DEFAULT CURRENT_TIMESTAMP,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS accounting_exceptions(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER,
    finance_entry_id INTEGER,
    code TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'Warning',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT,
    UNIQUE(finance_entry_id,code,status)
  );
  CREATE TABLE IF NOT EXISTS accounting_periods(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER,
    period_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open',
    notes TEXT DEFAULT '',
    closed_by INTEGER,
    closed_at TEXT,
    reopened_by INTEGER,
    reopened_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_unit_id,period_key)
  );
  CREATE TABLE IF NOT EXISTS accounting_bank_statement_lines(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_account_id INTEGER NOT NULL,
    statement_date TEXT NOT NULL,
    description TEXT DEFAULT '',
    reference TEXT DEFAULT '',
    amount_krw REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Unreconciled',
    matched_journal_entry_id INTEGER,
    imported_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(payment_account_id) REFERENCES accounting_payment_accounts(id),
    FOREIGN KEY(matched_journal_entry_id) REFERENCES accounting_journal_entries(id)
  );
  CREATE TABLE IF NOT EXISTS accounting_budgets(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER,
    account_id INTEGER NOT NULL,
    period_key TEXT NOT NULL,
    budget_krw REAL NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_unit_id,account_id,period_key),
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
    FOREIGN KEY(account_id) REFERENCES accounting_accounts(id)
  );
  CREATE TABLE IF NOT EXISTS accounting_inter_unit_transfers(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transfer_no TEXT NOT NULL UNIQUE,
    from_business_unit_id INTEGER,
    to_business_unit_id INTEGER,
    amount_krw REAL NOT NULL,
    transfer_date TEXT NOT NULL,
    reference TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Posted',
    journal_entry_id INTEGER,
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(from_business_unit_id) REFERENCES business_units(id),
    FOREIGN KEY(to_business_unit_id) REFERENCES business_units(id),
    FOREIGN KEY(journal_entry_id) REFERENCES accounting_journal_entries(id)
  );

  CREATE TABLE IF NOT EXISTS employees(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_no TEXT NOT NULL UNIQUE,
    user_id INTEGER,
    business_unit_id INTEGER,
    name TEXT NOT NULL,
    job_title TEXT DEFAULT '',
    department TEXT DEFAULT '',
    employment_type TEXT DEFAULT 'Full-time',
    employment_status TEXT DEFAULT 'Active',
    join_date TEXT,
    leave_date TEXT,
    salary_type TEXT DEFAULT 'Monthly',
    base_salary REAL NOT NULL DEFAULT 0,
    salary_currency TEXT NOT NULL DEFAULT 'KRW',
    salary_fx_rate REAL NOT NULL DEFAULT 1,
    payment_method TEXT DEFAULT 'Bank',
    payment_account_id INTEGER,
    bank_details_masked TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
    FOREIGN KEY(payment_account_id) REFERENCES accounting_payment_accounts(id)
  );
  CREATE TABLE IF NOT EXISTS employee_salary_components(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    component_name TEXT NOT NULL,
    component_type TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'KRW',
    fx_rate REAL NOT NULL DEFAULT 1,
    recurring INTEGER NOT NULL DEFAULT 1,
    active INTEGER NOT NULL DEFAULT 1,
    notes TEXT DEFAULT '',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS employee_advances(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    business_unit_id INTEGER,
    original_amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'KRW',
    fx_rate REAL NOT NULL DEFAULT 1,
    krw_amount REAL NOT NULL,
    advance_date TEXT NOT NULL,
    payment_method TEXT DEFAULT 'Bank',
    payment_account_id INTEGER,
    reference TEXT NOT NULL,
    receipt_file TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    outstanding_krw REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    journal_entry_id INTEGER,
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES employees(id),
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
    FOREIGN KEY(payment_account_id) REFERENCES accounting_payment_accounts(id),
    FOREIGN KEY(journal_entry_id) REFERENCES accounting_journal_entries(id)
  );
  CREATE TABLE IF NOT EXISTS payroll_runs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payroll_no TEXT NOT NULL UNIQUE,
    business_unit_id INTEGER,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    pay_date TEXT,
    status TEXT NOT NULL DEFAULT 'Draft',
    notes TEXT DEFAULT '',
    approval_journal_id INTEGER,
    payment_journal_id INTEGER,
    payment_method TEXT DEFAULT '',
    payment_account_id INTEGER,
    payment_reference TEXT DEFAULT '',
    payment_evidence_file TEXT DEFAULT '',
    created_by INTEGER,
    approved_by INTEGER,
    approved_at TEXT,
    paid_by INTEGER,
    paid_at TEXT,
    reversed_by INTEGER,
    reversed_at TEXT,
    reversal_reason TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
    FOREIGN KEY(payment_account_id) REFERENCES accounting_payment_accounts(id)
  );
  CREATE TABLE IF NOT EXISTS payroll_run_items(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payroll_run_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    base_salary_krw REAL NOT NULL DEFAULT 0,
    allowances_krw REAL NOT NULL DEFAULT 0,
    deductions_krw REAL NOT NULL DEFAULT 0,
    advance_deduction_krw REAL NOT NULL DEFAULT 0,
    gross_salary_krw REAL NOT NULL DEFAULT 0,
    net_salary_krw REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft',
    payslip_no TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(payroll_run_id,employee_id),
    FOREIGN KEY(payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
    FOREIGN KEY(employee_id) REFERENCES employees(id)
  );
  CREATE TABLE IF NOT EXISTS payroll_run_item_components(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payroll_run_item_id INTEGER NOT NULL,
    component_name TEXT NOT NULL,
    component_type TEXT NOT NULL,
    amount_krw REAL NOT NULL DEFAULT 0,
    source_component_id INTEGER,
    notes TEXT DEFAULT '',
    FOREIGN KEY(payroll_run_item_id) REFERENCES payroll_run_items(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS payroll_advance_recoveries(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payroll_run_item_id INTEGER NOT NULL,
    employee_advance_id INTEGER NOT NULL,
    amount_krw REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Applied',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    reversed_at TEXT,
    UNIQUE(payroll_run_item_id,employee_advance_id,status),
    FOREIGN KEY(payroll_run_item_id) REFERENCES payroll_run_items(id) ON DELETE CASCADE,
    FOREIGN KEY(employee_advance_id) REFERENCES employee_advances(id)
  );
  CREATE TABLE IF NOT EXISTS payroll_documents(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    payroll_run_id INTEGER,
    payroll_run_item_id INTEGER,
    title TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT DEFAULT '',
    size_bytes INTEGER DEFAULT 0,
    uploaded_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employee_id) REFERENCES employees(id),
    FOREIGN KEY(payroll_run_id) REFERENCES payroll_runs(id),
    FOREIGN KEY(payroll_run_item_id) REFERENCES payroll_run_items(id)
  );
  CREATE TABLE IF NOT EXISTS employee_cost_allocations(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    business_unit_id INTEGER NOT NULL,
    percentage REAL NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    notes TEXT DEFAULT '',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id,business_unit_id),
    FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
  );
  CREATE TABLE IF NOT EXISTS payroll_run_journals(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payroll_run_id INTEGER NOT NULL,
    journal_entry_id INTEGER NOT NULL UNIQUE,
    journal_type TEXT NOT NULL DEFAULT 'Accrual',
    business_unit_id INTEGER,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
    FOREIGN KEY(journal_entry_id) REFERENCES accounting_journal_entries(id),
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id)
  );
  CREATE TABLE IF NOT EXISTS payroll_payments(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payroll_run_id INTEGER NOT NULL,
    amount_krw REAL NOT NULL,
    payment_date TEXT NOT NULL,
    payment_method TEXT DEFAULT 'Bank',
    payment_account_id INTEGER,
    reference TEXT NOT NULL,
    evidence_file TEXT NOT NULL,
    journal_entry_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    created_by INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    reversed_by INTEGER,
    reversed_at TEXT,
    reversal_reason TEXT DEFAULT '',
    FOREIGN KEY(payroll_run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
    FOREIGN KEY(payment_account_id) REFERENCES accounting_payment_accounts(id),
    FOREIGN KEY(journal_entry_id) REFERENCES accounting_journal_entries(id)
  );
  CREATE TABLE IF NOT EXISTS payroll_payment_allocations(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payroll_payment_id INTEGER NOT NULL,
    payroll_run_item_id INTEGER NOT NULL,
    amount_krw REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(payroll_payment_id,payroll_run_item_id),
    FOREIGN KEY(payroll_payment_id) REFERENCES payroll_payments(id) ON DELETE CASCADE,
    FOREIGN KEY(payroll_run_item_id) REFERENCES payroll_run_items(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_ajournal_date ON accounting_journal_entries(transaction_date,business_unit_id,status);
  CREATE INDEX IF NOT EXISTS idx_alines_account ON accounting_journal_lines(account_id,business_unit_id);
  CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll_runs(period_start,period_end,business_unit_id,status);
  CREATE INDEX IF NOT EXISTS idx_employee_bu ON employees(business_unit_id,employment_status);
  CREATE INDEX IF NOT EXISTS idx_payroll_recovery_item ON payroll_advance_recoveries(payroll_run_item_id,status);
  CREATE INDEX IF NOT EXISTS idx_employee_allocations ON employee_cost_allocations(employee_id,active);
  CREATE INDEX IF NOT EXISTS idx_payroll_payments_run ON payroll_payments(payroll_run_id,status,payment_date);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_user_unique ON employees(user_id) WHERE user_id IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_period_scope_unique ON accounting_periods(COALESCE(business_unit_id,0),period_key);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_scope_unique ON accounting_budgets(COALESCE(business_unit_id,0),account_id,period_key);
  `);

  ensureColumn('finance_entries','payment_account_id','INTEGER');
  ensureColumn('finance_entries','accounting_status',"TEXT DEFAULT 'Pending'");
  ensureColumn('finance_entries','accounting_journal_id','INTEGER');
  ensureColumn('accounting_inter_unit_transfers','from_payment_account_id','INTEGER');
  ensureColumn('accounting_inter_unit_transfers','to_payment_account_id','INTEGER');
  ensureColumn('payroll_runs','total_paid_krw','REAL DEFAULT 0');
  ensureColumn('payroll_runs','outstanding_krw','REAL DEFAULT 0');
  ensureColumn('payroll_run_items','paid_krw','REAL DEFAULT 0');
  ensureColumn('payroll_run_items','outstanding_krw','REAL DEFAULT 0');

  // Queue every finance mutation for accounting synchronization.
  try{db.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_v290_finance_insert AFTER INSERT ON finance_entries BEGIN
      INSERT INTO accounting_sync_queue(finance_entry_id,queued_at,attempts,last_error) VALUES(NEW.id,CURRENT_TIMESTAMP,0,'')
      ON CONFLICT(finance_entry_id) DO UPDATE SET queued_at=CURRENT_TIMESTAMP,last_error='';
    END;
    CREATE TRIGGER IF NOT EXISTS trg_v290_finance_update AFTER UPDATE ON finance_entries BEGIN
      INSERT INTO accounting_sync_queue(finance_entry_id,queued_at,attempts,last_error) VALUES(NEW.id,CURRENT_TIMESTAMP,0,'')
      ON CONFLICT(finance_entry_id) DO UPDATE SET queued_at=CURRENT_TIMESTAMP,last_error='';
    END;
  `)}catch(e){console.error('V29 finance triggers:',e.message)}

  const SYSTEM_ACCOUNTS=[
    ['1000','Cash / Bank Clearing','Asset','Cash & Bank','Debit','BANK_CLEARING',1],
    ['1010','Cash on Hand','Asset','Cash & Bank','Debit','CASH_ON_HAND',1],
    ['1020','Card / Payment Gateway Clearing','Asset','Cash & Bank','Debit','PAYMENT_GATEWAY_CLEARING',1],
    ['1100','Accounts Receivable','Asset','Receivable','Debit','ACCOUNTS_RECEIVABLE',0],
    ['1200','Excavator Inventory','Asset','Inventory','Debit','EXCAVATOR_INVENTORY',0],
    ['1250','General Inventory','Asset','Inventory','Debit','GENERAL_INVENTORY',0],
    ['1260','Pink Salt Inventory in Transit','Asset','Inventory','Debit','PINK_SALT_IN_TRANSIT',0],
    ['1270','Pink Salt Raw Salt Inventory','Asset','Inventory','Debit','PINK_SALT_RAW_INVENTORY',0],
    ['1280','Pink Salt Packaging Inventory','Asset','Inventory','Debit','PINK_SALT_PACKAGING_INVENTORY',0],
    ['1290','Pink Salt Finished Goods Inventory','Asset','Inventory','Debit','PINK_SALT_FINISHED_INVENTORY',0],
    ['1300','Pink Salt Supplier Advances','Asset','Supplier Advance','Debit','PINK_SALT_SUPPLIER_ADVANCES',0],
    ['1400','Employee Advances','Asset','Employee Receivable','Debit','EMPLOYEE_ADVANCES',0],
    ['1500','Inter-Business-Unit Receivable','Asset','Inter-BU','Debit','INTER_BU_RECEIVABLE',0],
    ['1990','Suspense / Unclassified Asset','Asset','Suspense','Debit','SUSPENSE_ASSET',1],
    ['2000','Accounts Payable - Suppliers','Liability','Payable','Credit','ACCOUNTS_PAYABLE',0],
    ['2100','Buyer / Customer Advances','Liability','Customer Advance','Credit','CUSTOMER_ADVANCES',0],
    ['2200','Salary Payable','Liability','Payroll','Credit','SALARY_PAYABLE',0],
    ['2210','Payroll Deductions Payable','Liability','Payroll','Credit','PAYROLL_DEDUCTIONS_PAYABLE',0],
    ['2300','Inter-Business-Unit Payable','Liability','Inter-BU','Credit','INTER_BU_PAYABLE',0],
    ['2990','Suspense / Unclassified Liability','Liability','Suspense','Credit','SUSPENSE_LIABILITY',1],
    ['3000','Owner Equity / Retained Earnings','Equity','Equity','Credit','OWNER_EQUITY',0],
    ['4000','Excavator Sales Revenue','Revenue','Sales','Credit','EXCAVATOR_SALES_REVENUE',0],
    ['4100','General Sales Revenue','Revenue','Sales','Credit','GENERAL_SALES_REVENUE',0],
    ['4200','Pink Salt Sales Revenue','Revenue','Sales','Credit','PINK_SALT_SALES_REVENUE',0],
    ['4190','Other Revenue','Revenue','Other Revenue','Credit','OTHER_REVENUE',1],
    ['5000','Excavator Cost of Goods Sold','Expense','Cost of Goods Sold','Debit','EXCAVATOR_COGS',0],
    ['5100','General Cost of Goods Sold','Expense','Cost of Goods Sold','Debit','GENERAL_COGS',0],
    ['5200','Pink Salt Cost of Goods Sold','Expense','Cost of Goods Sold','Debit','PINK_SALT_COGS',0],
    ['6000','Salary & Wages Expense','Expense','Payroll','Debit','SALARY_EXPENSE',1],
    ['6100','Transport / Logistics Expense','Expense','Operating Expense','Debit','LOGISTICS_EXPENSE',1],
    ['6200','Repair & Maintenance Expense','Expense','Operating Expense','Debit','REPAIR_EXPENSE',1],
    ['6300','Parts / Spare Parts Expense','Expense','Operating Expense','Debit','PARTS_EXPENSE',1],
    ['6400','General Operating Expense','Expense','Operating Expense','Debit','GENERAL_EXPENSE',1],
    ['6500','Bank / Payment Fees','Expense','Operating Expense','Debit','BANK_FEES',1],
    ['6510','Marketplace / Platform Fees','Expense','Selling Expense','Debit','PINK_SALT_PLATFORM_FEES',1],
    ['6610','Pink Salt Waste / Stock Loss','Expense','Inventory Loss','Debit','PINK_SALT_WASTE_EXPENSE',1],
    ['6900','Other Expense','Expense','Other Expense','Debit','OTHER_EXPENSE',1]
  ];
  const insAccount=db.prepare(`INSERT OR IGNORE INTO accounting_accounts(code,name,account_type,subtype,normal_balance,system_key,allow_manual) VALUES(?,?,?,?,?,?,?)`);
  for(const a of SYSTEM_ACCOUNTS)insAccount.run(...a);
  function account(key){const r=db.prepare('SELECT * FROM accounting_accounts WHERE system_key=?').get(key);if(!r)throw new Error('Missing system accounting account '+key);return r}
  function accountId(key){return Number(account(key).id)}

  // Default payment accounts are explicit so existing data can be reconciled later.
  function ensureDefaultPayment(name,type,systemKey){
    const ledger=accountId(systemKey);
    if(!db.prepare('SELECT id FROM accounting_payment_accounts WHERE business_unit_id IS NULL AND name=?').get(name))
      db.prepare('INSERT INTO accounting_payment_accounts(business_unit_id,name,payment_type,currency,ledger_account_id,is_default,notes) VALUES(NULL,?,?,\'KRW\',?,1,?)').run(name,type,ledger,'System default. Replace or map to the actual company account when ready.');
  }
  ensureDefaultPayment('Unassigned KRW Bank','Bank','BANK_CLEARING');
  ensureDefaultPayment('Cash on Hand','Cash','CASH_ON_HAND');
  ensureDefaultPayment('Card / Gateway Clearing','Card','PAYMENT_GATEWAY_CLEARING');

  function paymentLedgerAccount(finance,paymentAccountId=null){
    const id=Number(paymentAccountId||finance?.payment_account_id||0);
    if(id){const p=db.prepare('SELECT * FROM accounting_payment_accounts WHERE id=? AND active=1').get(id);if(p)return Number(p.ledger_account_id)}
    const method=text(finance?.payment_method).toLowerCase();
    if(method.includes('cash'))return accountId('CASH_ON_HAND');
    if(method.includes('card')||method.includes('gateway'))return accountId('PAYMENT_GATEWAY_CLEARING');
    return accountId('BANK_CLEARING');
  }

  function isPeriodClosed(businessUnitId,date){
    const key=periodKey(date),bu=Number(businessUnitId||0)||null;
    const exact=bu?db.prepare("SELECT status FROM accounting_periods WHERE business_unit_id=? AND period_key=?").get(bu,key):null;
    if(exact?.status==='Closed')return true;
    const company=db.prepare("SELECT status FROM accounting_periods WHERE business_unit_id IS NULL AND period_key=?").get(key);
    return company?.status==='Closed';
  }
  function addException(finance,code,message,severity='Warning'){
    try{db.prepare("INSERT OR IGNORE INTO accounting_exceptions(business_unit_id,finance_entry_id,code,severity,message,status) VALUES(?,?,?,?,?,'Open')").run(finance?.business_unit_id||null,finance?.id||null,code,severity,message)}catch(_){}
  }
  function resolveException(financeId,code){try{db.prepare("UPDATE accounting_exceptions SET status='Resolved',resolved_at=CURRENT_TIMESTAMP WHERE finance_entry_id=? AND code=? AND status='Open'").run(financeId,code)}catch(_){}}

  function excavatorCostSnapshot(assetId){
    const a=db.prepare('SELECT * FROM excavator_assets WHERE id=?').get(assetId);if(!a)return null;
    const tx=db.prepare("SELECT * FROM excavator_transactions WHERE asset_id=? AND status!='Cancelled'").all(assetId),parse=t=>{try{return t.metadata?JSON.parse(t.metadata):{}}catch(_){return{}}},included=t=>parse(t).include_in_machine_cost!==false,sum=rows=>rows.reduce((n,x)=>n+Number(x.amount||0),0),linked=(type,key,id)=>tx.some(t=>t.type===type&&Number(parse(t)[key]||0)===Number(id));
    const purchaseTx=sum(tx.filter(t=>t.type==='Purchase'&&included(t))),purchase=purchaseTx||Number(a.purchase_price||0);
    const logistics=sum(tx.filter(t=>t.type==='Logistics'&&included(t)))+db.prepare('SELECT * FROM excavator_logistics WHERE asset_id=?').all(assetId).filter(x=>!linked('Logistics','logistics_id',x.id)).reduce((n,x)=>n+Number(x.amount||0),0);
    const repair=sum(tx.filter(t=>t.type==='Repair'&&included(t)))+db.prepare('SELECT * FROM excavator_repairs WHERE asset_id=?').all(assetId).filter(x=>!linked('Repair','repair_id',x.id)).reduce((n,x)=>n+Number(x.amount||0),0);
    const partCost=sum(tx.filter(t=>t.type==='Part Purchase'&&included(t)))+db.prepare('SELECT * FROM excavator_parts WHERE asset_id=?').all(assetId).filter(x=>!['Sold','Exported'].includes(x.status)&&!linked('Part Purchase','part_id',x.id)).reduce((n,x)=>n+Number(x.cost||0)*Number(x.quantity||1),0);
    const other=sum(tx.filter(t=>['Customs Duty','Tax / VAT','Shipping / Freight','Commission','Documentation / Clearance','Other Cost'].includes(t.type)&&included(t)));
    return {purchase,logistics,repair,partCost,other,total:purchase+logistics+repair+partCost+other};
  }
  function activeSale(assetId){return db.prepare("SELECT * FROM excavator_transactions WHERE asset_id=? AND type IN ('Local Sale','Export Sale') AND status!='Cancelled' ORDER BY id DESC LIMIT 1").get(assetId)}
  function sourceAssetContext(finance){
    const st=finance.source_type;let row=null,asset=null,sourceDate=finance.transaction_date||finance.created_at,sourceKind='';
    if(st==='Excavator Payment'){
      row=db.prepare('SELECT p.*,a.business_unit_id,a.asset_no,a.lifecycle_stage FROM excavator_payments p JOIN excavator_assets a ON a.id=p.asset_id WHERE p.id=?').get(finance.source_id);if(row){asset=row;sourceDate=row.paid_date||row.created_at;sourceKind=row.payment_type||''}
    }else if(st==='Excavator Cost Transaction'){
      row=db.prepare('SELECT t.*,a.business_unit_id,a.asset_no,a.lifecycle_stage FROM excavator_transactions t JOIN excavator_assets a ON a.id=t.asset_id WHERE t.id=?').get(finance.source_id);if(row){asset=row;sourceDate=row.transaction_date||row.created_at;sourceKind=row.type||''}
    }else if(st==='Excavator Repair'){
      row=db.prepare('SELECT r.*,a.business_unit_id,a.asset_no,a.lifecycle_stage FROM excavator_repairs r JOIN excavator_assets a ON a.id=r.asset_id WHERE r.id=?').get(finance.source_id);if(row){asset=row;sourceDate=row.repair_date||row.created_at;sourceKind='Repair'}
    }else if(st==='Excavator Logistics'){
      row=db.prepare('SELECT l.*,a.business_unit_id,a.asset_no,a.lifecycle_stage FROM excavator_logistics l JOIN excavator_assets a ON a.id=l.asset_id WHERE l.id=?').get(finance.source_id);if(row){asset=row;sourceDate=row.logistics_date||row.ship_date||row.created_at;sourceKind='Logistics'}
    }else if(st==='Excavator Part'){
      row=db.prepare('SELECT p.*,a.business_unit_id,a.asset_no,a.lifecycle_stage FROM excavator_parts p JOIN excavator_assets a ON a.id=p.asset_id WHERE p.id=?').get(finance.source_id);if(row){asset=row;sourceDate=row.purchase_date||row.created_at;sourceKind='Part Purchase'}
    }else if(st==='Excavator Sale'){
      row=db.prepare('SELECT t.*,a.business_unit_id,a.asset_no,a.lifecycle_stage,a.buyer_id FROM excavator_transactions t JOIN excavator_assets a ON a.id=t.asset_id WHERE t.id=?').get(finance.source_id);if(row){asset=row;sourceDate=row.transaction_date||row.created_at;sourceKind='Sale'}
    }
    return {row,asset,sourceDate:dateOnly(sourceDate),sourceKind};
  }
  function costIsBeforeSale(assetId,sourceDate){const sale=activeSale(assetId);if(!sale)return true;return !sourceDate||dateOnly(sourceDate)<=dateOnly(sale.transaction_date||sale.created_at)}

  function buildFinancePosting(finance){
    const amount=Math.abs(Number(finance.krw_amount ?? finance.amount ?? 0)),lines=[],ctx={finance_id:finance.id,source_type:finance.source_type,source_id:finance.source_id};
    if(amount<=0)return {skip:true,reason:'Zero amount',lines:[],context:ctx};
    const cash=paymentLedgerAccount(finance),debit=(acct,amt=amount,meta={})=>lines.push({account_id:acct,debit_krw:amt,credit_krw:0,...meta}),credit=(acct,amt=amount,meta={})=>lines.push({account_id:acct,debit_krw:0,credit_krw:amt,...meta});
    const source=sourceAssetContext(finance),st=text(finance.source_type),category=text(finance.category),entityBase={business_unit_id:finance.business_unit_id,original_amount:Number(finance.original_amount??amount),original_currency:finance.original_currency||'KRW',fx_rate:Number(finance.fx_rate||1)};

    if(st==='Excavator Buyer Payment'||st==='Buyer Payment'){
      const p=db.prepare('SELECT p.*,b.name buyer_name FROM excavator_buyer_payments p LEFT JOIN excavator_buyers b ON b.id=p.buyer_id WHERE p.id=?').get(finance.source_id);
      if(!p)return {error:'Linked Excavator buyer payment was not found.'};
      const saleSpecific=text(p.source_type)==='Excavator Sale'||text(p.payment_type)==='Sale Payment';
      debit(cash,amount,{...entityBase,entity_type:'Buyer',entity_id:p.buyer_id,memo:`Buyer payment · ${p.buyer_name||''}`});
      credit(saleSpecific?accountId('ACCOUNTS_RECEIVABLE'):accountId('CUSTOMER_ADVANCES'),amount,{...entityBase,entity_type:'Buyer',entity_id:p.buyer_id,memo:saleSpecific?'Sale payment clearing':'Buyer advance liability'});
      ctx.payment_type=p.payment_type;ctx.buyer_id=p.buyer_id;
    }else if(st==='Excavator Buyer Refund'){
      const r=db.prepare('SELECT * FROM excavator_buyer_refunds WHERE id=?').get(finance.source_id);if(!r)return {error:'Linked buyer advance refund was not found.'};
      debit(accountId('CUSTOMER_ADVANCES'),amount,{...entityBase,entity_type:'Buyer',entity_id:r.buyer_id,memo:'Buyer advance refunded'});credit(cash,amount,{...entityBase,entity_type:'Buyer',entity_id:r.buyer_id,memo:'Cash / bank refund'});ctx.buyer_id=r.buyer_id;
    }else if(st==='Excavator Sale'){
      const sale=source.row;if(!sale)return {error:'Linked Excavator sale was not found.'};let meta={};try{meta=sale.metadata?JSON.parse(sale.metadata):{}}catch(_){}
      const buyerId=Number(meta.buyer_id||sale.buyer_id||0)||null,paymentSource=text(meta.payment_source||finance.payment_method).toLowerCase();
      debit(paymentSource.includes('advance')?accountId('CUSTOMER_ADVANCES'):accountId('ACCOUNTS_RECEIVABLE'),amount,{...entityBase,entity_type:'Buyer',entity_id:buyerId,memo:paymentSource.includes('advance')?'Apply buyer advance to sale':'Recognize sale receivable'});
      credit(accountId('EXCAVATOR_SALES_REVENUE'),amount,{...entityBase,entity_type:'Machine',entity_id:sale.asset_id,memo:`Machine sale · ${sale.asset_no||''}`});
      const cost=excavatorCostSnapshot(sale.asset_id),cogs=Math.max(0,Number(cost?.total||0));if(cogs>0){debit(accountId('EXCAVATOR_COGS'),cogs,{business_unit_id:finance.business_unit_id,entity_type:'Machine',entity_id:sale.asset_id,memo:'Recognize machine cost on sale'});credit(accountId('EXCAVATOR_INVENTORY'),cogs,{business_unit_id:finance.business_unit_id,entity_type:'Machine',entity_id:sale.asset_id,memo:'Remove sold machine from inventory'});}ctx.asset_id=sale.asset_id;ctx.buyer_id=buyerId;ctx.cost=cogs;ctx.payment_source=paymentSource;
    }else if(st==='Excavator Payment'){
      const p=source.row;if(!p)return {error:'Linked Excavator payment was not found.'};
      if(text(p.payment_type)==='Purchase'){debit(accountId('ACCOUNTS_PAYABLE'),amount,{...entityBase,entity_type:'Machine',entity_id:p.asset_id,memo:'Supplier payable settled'});credit(cash,amount,{...entityBase,entity_type:'Machine',entity_id:p.asset_id,memo:'Purchase payment'});}
      else if(text(p.payment_type)==='Sale'){debit(cash,amount,{...entityBase,entity_type:'Machine',entity_id:p.asset_id,memo:'Sale payment received'});credit(accountId('ACCOUNTS_RECEIVABLE'),amount,{...entityBase,entity_type:'Machine',entity_id:p.asset_id,memo:'Sale receivable settled'});}
      else {debit(accountId('OTHER_EXPENSE'),amount,{...entityBase,entity_type:'Machine',entity_id:p.asset_id,memo:'Other machine payment'});credit(cash,amount,{...entityBase,entity_type:'Machine',entity_id:p.asset_id});}ctx.asset_id=p.asset_id;
    }else if(['Excavator Cost Transaction','Excavator Repair','Excavator Logistics','Excavator Part'].includes(st)){
      const r=source.row;if(!r)return {error:'Linked Excavator cost record was not found.'};const assetId=Number(r.asset_id||0),kind=source.sourceKind||category;
      if(kind==='Purchase'){
        debit(accountId('EXCAVATOR_INVENTORY'),amount,{...entityBase,entity_type:'Machine',entity_id:assetId,memo:'Machine purchase / inventory recognition'});credit(accountId('ACCOUNTS_PAYABLE'),amount,{...entityBase,entity_type:'Machine',entity_id:assetId,memo:'Supplier payable recognized'});
      }else{
        const capitalized=costIsBeforeSale(assetId,source.sourceDate),expenseKey=kind==='Logistics'?'LOGISTICS_EXPENSE':kind==='Repair'?'REPAIR_EXPENSE':kind==='Part Purchase'?'PARTS_EXPENSE':'OTHER_EXPENSE';
        debit(capitalized?accountId('EXCAVATOR_INVENTORY'):accountId('EXCAVATOR_COGS'),amount,{...entityBase,entity_type:'Machine',entity_id:assetId,memo:capitalized?`${kind} capitalized into machine cost`:`${kind} after sale`});
        credit(cash,amount,{...entityBase,entity_type:'Machine',entity_id:assetId,memo:`${kind} payment / cost`});
        ctx.capitalized=capitalized;
      }
      ctx.asset_id=assetId;ctx.cost_type=kind;
    }else if(st==='Pink Salt Import Purchase'){
      const imp=db.prepare(`SELECT i.*,COALESCE((SELECT SUM(x.line_amount_krw) FROM pink_salt_import_items x WHERE x.import_id=i.id),0) purchase_krw FROM pink_salt_imports i WHERE i.id=?`).get(finance.source_id);if(!imp)return {error:'Linked Pink Salt import was not found.'};
      debit(accountId('PINK_SALT_IN_TRANSIT'),amount,{...entityBase,entity_type:'Pink Salt Import',entity_id:imp.id,memo:`Raw salt purchase in transit · ${imp.import_no}`});
      credit(accountId('ACCOUNTS_PAYABLE'),amount,{...entityBase,entity_type:'Pink Salt Supplier',entity_id:imp.supplier_id||null,memo:`Supplier payable · ${imp.supplier_name||''}`});ctx.import_id=imp.id;ctx.supplier_id=imp.supplier_id||null;
    }else if(st==='Pink Salt Import Payment'){
      const p=db.prepare(`SELECT p.*,i.import_no,i.supplier_id,i.supplier_name FROM pink_salt_import_payments p JOIN pink_salt_imports i ON i.id=p.import_id WHERE p.id=?`).get(finance.source_id);if(!p)return {error:'Linked Pink Salt import payment was not found.'};
      debit(accountId('ACCOUNTS_PAYABLE'),amount,{...entityBase,entity_type:'Pink Salt Supplier',entity_id:p.supplier_id||null,memo:`Supplier payment · ${p.import_no}`});
      credit(cash,amount,{...entityBase,entity_type:'Pink Salt Import',entity_id:p.import_id,memo:`Import payment · ${p.reference||p.import_no}`});ctx.import_id=p.import_id;ctx.supplier_id=p.supplier_id||null;
    }else if(st==='Pink Salt Supplier Advance'){
      const p=db.prepare('SELECT * FROM pink_salt_supplier_advances WHERE id=?').get(finance.source_id);if(!p)return {error:'Linked Pink Salt supplier advance was not found.'};
      debit(accountId('PINK_SALT_SUPPLIER_ADVANCES'),amount,{...entityBase,entity_type:'Pink Salt Supplier',entity_id:p.supplier_id,memo:`Supplier advance · ${p.reference||p.id}`});credit(cash,amount,{...entityBase,entity_type:'Pink Salt Supplier',entity_id:p.supplier_id,memo:'Supplier advance paid'});ctx.supplier_id=p.supplier_id;
    }else if(st==='Pink Salt Supplier Advance Refund'){
      const r=db.prepare('SELECT * FROM pink_salt_supplier_advance_refunds WHERE id=?').get(finance.source_id);if(!r)return {error:'Linked Pink Salt supplier advance refund was not found.'};
      debit(cash,amount,{...entityBase,entity_type:'Pink Salt Supplier',entity_id:r.supplier_id,memo:'Supplier advance refund received'});credit(accountId('PINK_SALT_SUPPLIER_ADVANCES'),amount,{...entityBase,entity_type:'Pink Salt Supplier',entity_id:r.supplier_id,memo:`Advance refund · ${r.reference||r.id}`});ctx.supplier_id=r.supplier_id;
    }else if(st==='Pink Salt Import Cost'){
      const c=db.prepare(`SELECT c.*,i.import_no,i.status import_status,i.received_at FROM pink_salt_import_costs c JOIN pink_salt_imports i ON i.id=c.import_id WHERE c.id=?`).get(finance.source_id);if(!c)return {error:'Linked Pink Salt import cost was not found.'};
      const beforeReceipt=!c.received_at||String(c.created_at||'')<=String(c.received_at||'');
      debit(accountId(beforeReceipt?'PINK_SALT_IN_TRANSIT':'PINK_SALT_RAW_INVENTORY'),amount,{...entityBase,entity_type:'Pink Salt Import',entity_id:c.import_id,memo:`${c.cost_type} · ${c.import_no}`});
      credit(cash,amount,{...entityBase,entity_type:'Pink Salt Import',entity_id:c.import_id,memo:`Import cost payment · ${c.reference||c.cost_type}`});ctx.import_id=c.import_id;ctx.cost_type=c.cost_type;ctx.capitalized=true;
    }else if(st==='Pink Salt Packaging Purchase'){
      const m=db.prepare(`SELECT m.*,p.sku,p.name FROM pink_salt_packaging_movements m JOIN pink_salt_packaging_items p ON p.id=m.packaging_item_id WHERE m.id=?`).get(finance.source_id);if(!m)return {error:'Linked Pink Salt packaging purchase was not found.'};
      debit(accountId('PINK_SALT_PACKAGING_INVENTORY'),amount,{...entityBase,entity_type:'Pink Salt Packaging',entity_id:m.packaging_item_id,memo:`Packaging purchase · ${m.sku}`});
      credit(accountId('ACCOUNTS_PAYABLE'),amount,{...entityBase,entity_type:'Pink Salt Supplier',entity_id:m.supplier_id||null,memo:`Packaging supplier payable · ${m.reference||m.sku}`});ctx.packaging_item_id=m.packaging_item_id;ctx.supplier_id=m.supplier_id||null;
    }else if(st==='Pink Salt Sale'){
      const o=db.prepare('SELECT * FROM pink_salt_orders WHERE id=?').get(finance.source_id);if(!o)return {error:'Linked Pink Salt order was not found.'};
      const prepaid=Math.max(0,Math.min(amount,Number(o.prepaid_applied_krw||0))),receivable=Math.max(0,amount-prepaid);
      if(prepaid)debit(accountId('CUSTOMER_ADVANCES'),prepaid,{...entityBase,entity_type:'Pink Salt Customer',entity_id:o.customer_id||null,memo:`Apply customer advance · ${o.order_no}`});
      if(receivable)debit(accountId('ACCOUNTS_RECEIVABLE'),receivable,{...entityBase,entity_type:'Pink Salt Customer',entity_id:o.customer_id||null,memo:`Sales receivable · ${o.order_no}`});
      credit(accountId('PINK_SALT_SALES_REVENUE'),amount,{...entityBase,entity_type:'Pink Salt Order',entity_id:o.id,memo:`Pink Salt sale · ${o.order_no}`});
      const cogs=Math.max(0,Number(o.cost_total_krw||0));if(cogs){debit(accountId('PINK_SALT_COGS'),cogs,{business_unit_id:finance.business_unit_id,entity_type:'Pink Salt Order',entity_id:o.id,memo:`Cost of goods sold · ${o.order_no}`});credit(accountId('PINK_SALT_FINISHED_INVENTORY'),cogs,{business_unit_id:finance.business_unit_id,entity_type:'Pink Salt Order',entity_id:o.id,memo:`Finished inventory released · ${o.order_no}`});}ctx.order_id=o.id;ctx.customer_id=o.customer_id||null;ctx.prepaid_applied_krw=prepaid;ctx.cogs_krw=cogs;
    }else if(st==='Pink Salt Customer Receipt'){
      const r=db.prepare('SELECT * FROM pink_salt_customer_receipts WHERE id=?').get(finance.source_id);if(!r)return {error:'Linked Pink Salt customer receipt was not found.'};
      debit(cash,amount,{...entityBase,entity_type:'Pink Salt Customer',entity_id:r.customer_id||null,memo:`Customer receipt · ${r.reference||r.id}`});
      credit(accountId('CUSTOMER_ADVANCES'),amount,{...entityBase,entity_type:'Pink Salt Customer',entity_id:r.customer_id||null,memo:`Customer credit available for allocation · ${r.reference||r.id}`});ctx.customer_id=r.customer_id||null;ctx.receipt_id=r.id;
    }else if(st==='Pink Salt Marketplace Settlement Fee'){
      const r=db.prepare('SELECT * FROM pink_salt_customer_receipts WHERE id=?').get(finance.source_id);if(!r)return {error:'Linked Pink Salt marketplace settlement was not found.'};
      debit(accountId('PINK_SALT_PLATFORM_FEES'),amount,{...entityBase,entity_type:'Pink Salt Customer',entity_id:r.customer_id||null,memo:`Marketplace / settlement fee withheld · ${r.reference||r.id}`});
      credit(accountId('CUSTOMER_ADVANCES'),amount,{...entityBase,entity_type:'Pink Salt Customer',entity_id:r.customer_id||null,memo:`Marketplace gross settlement credit · ${r.reference||r.id}`});ctx.customer_id=r.customer_id||null;ctx.receipt_id=r.id;
    }else if(st==='Pink Salt Customer Payment'){
      const p=db.prepare(`SELECT p.*,o.order_no FROM pink_salt_customer_payments p JOIN pink_salt_orders o ON o.id=p.order_id WHERE p.id=?`).get(finance.source_id);if(!p)return {error:'Linked Pink Salt customer payment was not found.'};
      debit(cash,amount,{...entityBase,entity_type:'Pink Salt Customer',entity_id:p.customer_id||null,memo:`Customer payment · ${p.order_no}`});
      credit(accountId(p.payment_role==='Advance'?'CUSTOMER_ADVANCES':'ACCOUNTS_RECEIVABLE'),amount,{...entityBase,entity_type:'Pink Salt Customer',entity_id:p.customer_id||null,memo:p.payment_role==='Advance'?`Customer advance · ${p.order_no}`:`Settle receivable · ${p.order_no}`});ctx.order_id=p.order_id;ctx.customer_id=p.customer_id||null;ctx.payment_role=p.payment_role;
    }else if(st==='Pink Salt Customer Refund'){
      const r=db.prepare(`SELECT r.*,o.order_no FROM pink_salt_customer_refunds r JOIN pink_salt_orders o ON o.id=r.order_id WHERE r.id=?`).get(finance.source_id);if(!r)return {error:'Linked Pink Salt customer refund was not found.'};
      debit(accountId('CUSTOMER_ADVANCES'),amount,{...entityBase,entity_type:'Pink Salt Customer',entity_id:r.customer_id||null,memo:`Refund customer credit · ${r.order_no}`});credit(cash,amount,{...entityBase,entity_type:'Pink Salt Customer',entity_id:r.customer_id||null,memo:`Customer refund · ${r.reference}`});ctx.order_id=r.order_id;ctx.customer_id=r.customer_id||null;
    }else if(st==='Pink Salt Platform Fee'){
      const o=db.prepare('SELECT * FROM pink_salt_orders WHERE id=?').get(finance.source_id);if(!o)return {error:'Linked Pink Salt order for platform fee was not found.'};debit(accountId('PINK_SALT_PLATFORM_FEES'),amount,{...entityBase,entity_type:'Pink Salt Order',entity_id:o.id,memo:`Platform / marketplace fee · ${o.order_no}`});credit(cash,amount,{...entityBase,entity_type:'Pink Salt Order',entity_id:o.id,memo:`Marketplace fee settlement · ${o.sales_channel||''}`});ctx.order_id=o.id;
    }else if(st==='Pink Salt Waste'){
      const w=db.prepare('SELECT * FROM pink_salt_waste WHERE id=?').get(finance.source_id);if(!w)return {error:'Linked Pink Salt waste record was not found.'};const inv=w.source_type==='Raw Salt'?'PINK_SALT_RAW_INVENTORY':w.source_type==='Packaging'?'PINK_SALT_PACKAGING_INVENTORY':'PINK_SALT_FINISHED_INVENTORY';debit(accountId('PINK_SALT_WASTE_EXPENSE'),amount,{...entityBase,entity_type:'Pink Salt Waste',entity_id:w.id,memo:`${w.waste_type} · ${w.reason}`});credit(accountId(inv),amount,{...entityBase,entity_type:w.source_type,entity_id:w.source_id,memo:`Inventory loss · ${w.reason}`});ctx.waste_id=w.id;ctx.waste_source=w.source_type;
    }else if(st==='Sale'){
      const s=db.prepare('SELECT * FROM sales WHERE id=?').get(finance.source_id);debit(cash,amount,{...entityBase,entity_type:'Sale',entity_id:s?.id||finance.source_id,memo:'Sale receipt'});credit(accountId('GENERAL_SALES_REVENUE'),amount,{...entityBase,entity_type:'Sale',entity_id:s?.id||finance.source_id,memo:'Sales revenue'});const cost=Math.max(0,Number(s?.cost_total||0));if(cost){debit(accountId('GENERAL_COGS'),cost,{business_unit_id:finance.business_unit_id,entity_type:'Sale',entity_id:s.id,memo:'Cost of goods sold'});credit(accountId('GENERAL_INVENTORY'),cost,{business_unit_id:finance.business_unit_id,entity_type:'Sale',entity_id:s.id,memo:'Inventory released'});}
    }else if(st==='Purchase'){
      debit(accountId('GENERAL_INVENTORY'),amount,{...entityBase,entity_type:'Purchase',entity_id:finance.source_id,memo:'Inventory purchase'});credit(cash,amount,{...entityBase,entity_type:'Purchase',entity_id:finance.source_id,memo:'Purchase payment'});
    }else{
      const isRevenue=text(finance.type).toLowerCase()==='revenue';
      if(isRevenue){debit(cash,amount,{...entityBase,memo:'Cash / bank receipt'});credit(accountId('OTHER_REVENUE'),amount,{...entityBase,memo:category||'Other revenue'});}
      else {const low=category.toLowerCase();const exp=low.includes('logistic')||low.includes('transport')?accountId('LOGISTICS_EXPENSE'):low.includes('repair')?accountId('REPAIR_EXPENSE'):low.includes('part')?accountId('PARTS_EXPENSE'):low.includes('bank')||low.includes('fee')?accountId('BANK_FEES'):accountId('GENERAL_EXPENSE');debit(exp,amount,{...entityBase,memo:category||'Operating expense'});credit(cash,amount,{...entityBase,memo:'Cash / bank payment'});}
    }
    const dr=lines.reduce((n,l)=>n+Number(l.debit_krw||0),0),cr=lines.reduce((n,l)=>n+Number(l.credit_krw||0),0);
    if(Math.abs(dr-cr)>0.005)return {error:`Unbalanced posting generated: debit ${dr}, credit ${cr}`};
    return {lines,context:ctx,source_hash:hash({finance:{id:finance.id,type:finance.type,category:finance.category,amount,transaction_date:dateOnly(finance.transaction_date||finance.created_at),payment_method:finance.payment_method,reference:finance.reference,status:finance.status,source_type:finance.source_type,source_id:finance.source_id},ctx,lines:lines.map(l=>({a:l.account_id,d:l.debit_krw,c:l.credit_krw,e:l.entity_id,m:l.memo}))})};
  }

  function reverseJournal(entry,reason='Source changed or voided',userId=null){
    if(!entry||entry.status==='Reversed')return null;
    const lines=db.prepare('SELECT * FROM accounting_journal_lines WHERE journal_entry_id=? ORDER BY id').all(entry.id),jNo=nextNo('REV','accounting_journal_entries');
    const r=db.prepare(`INSERT INTO accounting_journal_entries(journal_no,business_unit_id,transaction_date,source_type,source_id,source_label,description,status,reversal_of_id,created_by) VALUES(?,?,?,?,?,?,?,'Posted',?,?)`)
      .run(jNo,entry.business_unit_id,nowDate(),'Accounting Reversal',entry.id,'Automatic Reversal',reason,entry.id,userId||entry.created_by||null);
    const rid=Number(r.lastInsertRowid),ins=db.prepare(`INSERT INTO accounting_journal_lines(journal_entry_id,account_id,business_unit_id,debit_krw,credit_krw,original_amount,original_currency,fx_rate,entity_type,entity_id,dimension_json,memo) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`);
    for(const l of lines)ins.run(rid,l.account_id,l.business_unit_id,l.credit_krw,l.debit_krw,l.original_amount,l.original_currency,l.fx_rate,l.entity_type,l.entity_id,l.dimension_json,`Reversal · ${l.memo||''}`);
    db.prepare("UPDATE accounting_journal_entries SET status='Reversed',reversed_by_id=?,finance_entry_id=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(rid,entry.id);
    return rid;
  }
  function postJournal({businessUnitId,transactionDate,sourceType,sourceId,sourceLabel,description,financeEntryId=null,sourceHash='',createdBy=null,lines}){
    const dr=lines.reduce((n,l)=>n+Number(l.debit_krw||0),0),cr=lines.reduce((n,l)=>n+Number(l.credit_krw||0),0);if(Math.abs(dr-cr)>0.005)throw new Error(`Journal not balanced: debit ${dr} / credit ${cr}`);
    const jNo=nextNo('JE','accounting_journal_entries'),r=db.prepare(`INSERT INTO accounting_journal_entries(journal_no,business_unit_id,transaction_date,source_type,source_id,source_label,description,finance_entry_id,source_hash,status,created_by) VALUES(?,?,?,?,?,?,?,?,?,'Posted',?)`)
      .run(jNo,businessUnitId||null,dateOnly(transactionDate)||nowDate(),sourceType,sourceId??null,sourceLabel||sourceType,description||'',financeEntryId,sourceHash||'',createdBy||null),jid=Number(r.lastInsertRowid),ins=db.prepare(`INSERT INTO accounting_journal_lines(journal_entry_id,account_id,business_unit_id,debit_krw,credit_krw,original_amount,original_currency,fx_rate,entity_type,entity_id,dimension_json,memo) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`);
    for(const l of lines)ins.run(jid,l.account_id,l.business_unit_id??businessUnitId??null,Number(l.debit_krw||0),Number(l.credit_krw||0),Number(l.original_amount||0),l.original_currency||'KRW',Number(l.fx_rate||1),l.entity_type||'',l.entity_id??null,JSON.stringify(l.dimension_json||{}),l.memo||'');
    return jid;
  }

  let processing=false;
  function syncFinanceEntry(financeId){
    const finance=db.prepare('SELECT * FROM finance_entries WHERE id=?').get(financeId);if(!finance){db.prepare('DELETE FROM accounting_sync_queue WHERE finance_entry_id=?').run(financeId);return {skipped:true}}
    const existing=db.prepare('SELECT * FROM accounting_journal_entries WHERE finance_entry_id=? ORDER BY id DESC LIMIT 1').get(finance.id);
    if(text(finance.status)==='Voided'){
      if(existing){if(isPeriodClosed(existing.business_unit_id,existing.transaction_date)){addException(finance,'CLOSED_PERIOD_VOID','A Finance record was voided in a closed accounting period. Reopen the period or post an authorized adjustment.','Critical');return {blocked:true}}reverseJournal(existing,finance.void_reason||'Finance source voided',finance.voided_by||finance.created_by)}
      db.prepare("UPDATE finance_entries SET accounting_status='Reversed',accounting_journal_id=NULL WHERE id=?").run(finance.id);db.prepare('DELETE FROM accounting_sync_queue WHERE finance_entry_id=?').run(finance.id);return {reversed:true};
    }
    const posting=buildFinancePosting(finance);if(posting.skip){db.prepare("UPDATE finance_entries SET accounting_status='Skipped' WHERE id=?").run(finance.id);db.prepare('DELETE FROM accounting_sync_queue WHERE finance_entry_id=?').run(finance.id);return posting}if(posting.error)throw new Error(posting.error);
    const txDate=dateOnly(finance.transaction_date||finance.created_at)||nowDate();
    if(existing&&existing.source_hash===posting.source_hash&&existing.status==='Posted'){db.prepare("UPDATE finance_entries SET accounting_status='Posted',accounting_journal_id=? WHERE id=?").run(existing.id,finance.id);db.prepare('DELETE FROM accounting_sync_queue WHERE finance_entry_id=?').run(finance.id);resolveException(finance.id,'ACCOUNTING_SYNC_ERROR');return {unchanged:true,journal_id:existing.id}}
    if(existing){if(isPeriodClosed(existing.business_unit_id,existing.transaction_date)){addException(finance,'CLOSED_PERIOD_CHANGE','A source transaction changed after its accounting period was closed. Reopen the period or post an authorized adjustment.','Critical');return {blocked:true}}reverseJournal(existing,'Source record changed; automatic reversal before repost.',finance.created_by)}
    if(isPeriodClosed(finance.business_unit_id,txDate)){addException(finance,'CLOSED_PERIOD_POST','This transaction belongs to a closed accounting period and cannot be posted automatically.','Critical');return {blocked:true}}
    const jid=postJournal({businessUnitId:finance.business_unit_id,transactionDate:txDate,sourceType:'Finance Entry',sourceId:finance.id,sourceLabel:finance.source_label||finance.source_type||'Finance Entry',description:finance.description||finance.category,financeEntryId:finance.id,sourceHash:posting.source_hash,createdBy:finance.created_by,lines:posting.lines});
    db.prepare("UPDATE finance_entries SET accounting_status='Posted',accounting_journal_id=? WHERE id=?").run(jid,finance.id);db.prepare('DELETE FROM accounting_sync_queue WHERE finance_entry_id=?').run(finance.id);resolveException(finance.id,'ACCOUNTING_SYNC_ERROR');
    // A pre-sale cost change changes the machine COGS snapshot. Requeue the sale so its COGS lines stay synchronized.
    const assetId=posting.context?.asset_id;if(assetId&&posting.context?.cost_type){const sale=activeSale(assetId);if(sale){const sf=db.prepare("SELECT id FROM finance_entries WHERE source_type='Excavator Sale' AND source_id=? AND status!='Voided' ORDER BY id DESC LIMIT 1").get(sale.id);if(sf)db.prepare("INSERT INTO accounting_sync_queue(finance_entry_id,queued_at) VALUES(?,CURRENT_TIMESTAMP) ON CONFLICT(finance_entry_id) DO UPDATE SET queued_at=CURRENT_TIMESTAMP").run(sf.id)}}
    return {journal_id:jid};
  }
  function processQueue(limit=200){if(processing)return;processing=true;try{const rows=db.prepare('SELECT * FROM accounting_sync_queue ORDER BY queued_at LIMIT ?').all(Number(limit)||200);for(const q of rows){try{syncFinanceEntry(q.finance_entry_id)}catch(e){db.prepare("UPDATE accounting_sync_queue SET attempts=attempts+1,last_error=?,queued_at=CURRENT_TIMESTAMP WHERE finance_entry_id=?").run(String(e.message||e).slice(0,1000),q.finance_entry_id);const f=db.prepare('SELECT * FROM finance_entries WHERE id=?').get(q.finance_entry_id);if(f){db.prepare("UPDATE finance_entries SET accounting_status='Error' WHERE id=?").run(f.id);addException(f,'ACCOUNTING_SYNC_ERROR',String(e.message||e),'Critical')}}}}finally{processing=false}}

  // Add all historic Finance entries once. This is additive; it does not modify source records.
  db.prepare("INSERT OR IGNORE INTO accounting_sync_queue(finance_entry_id,queued_at) SELECT id,CURRENT_TIMESTAMP FROM finance_entries").run();
  setTimeout(()=>processQueue(1000),100);
  setInterval(()=>processQueue(250),5000);

  function unitFilter(req,alias='j'){
    if(req.selected_business_unit_id)return {sql:` AND ${alias}.business_unit_id=?`,args:[Number(req.selected_business_unit_id)]};
    if(req.user.role==='CEO / Owner')return {sql:'',args:[]};
    if(req.user.business_unit_id)return {sql:` AND ${alias}.business_unit_id=?`,args:[Number(req.user.business_unit_id)]};
    return {sql:' AND 1=0',args:[]};
  }
  function lineUnitFilter(req,alias='l'){
    if(req.selected_business_unit_id)return {sql:` AND ${alias}.business_unit_id=?`,args:[Number(req.selected_business_unit_id)]};
    if(req.user.role==='CEO / Owner')return {sql:'',args:[]};
    if(req.user.business_unit_id)return {sql:` AND ${alias}.business_unit_id=?`,args:[Number(req.user.business_unit_id)]};
    return {sql:' AND 1=0',args:[]};
  }
  function journalUnitFilter(req,alias='j'){
    const bu=req.selected_business_unit_id?Number(req.selected_business_unit_id):(req.user.role==='CEO / Owner'?null:Number(req.user.business_unit_id||0));
    if(!bu)return req.user.role==='CEO / Owner'?{sql:'',args:[]}:{sql:' AND 1=0',args:[]};
    return {sql:` AND (${alias}.business_unit_id=? OR EXISTS(SELECT 1 FROM accounting_journal_lines _ul WHERE _ul.journal_entry_id=${alias}.id AND _ul.business_unit_id=?))`,args:[bu,bu]};
  }
  function canSeeJournal(req,journalId,businessUnitId){
    if(req.user.role==='CEO / Owner'&&!req.selected_business_unit_id)return true;
    const bu=Number(req.selected_business_unit_id||req.user.business_unit_id||0);
    if(!bu)return false;
    if(Number(businessUnitId||0)===bu)return true;
    return !!db.prepare('SELECT 1 FROM accounting_journal_lines WHERE journal_entry_id=? AND business_unit_id=? LIMIT 1').get(journalId,bu);
  }
  function requireAccountingWrite(req,res,next){if(['CEO / Owner','Finance / Admin'].includes(req.user.role))return next();return res.status(403).json({error:'CEO or Finance authority is required for this accounting action.'})}
  function requirePayroll(req,res,next){if(['CEO / Owner','Finance / Admin'].includes(req.user.role))return next();return res.status(403).json({error:'Payroll is restricted to CEO / Owner and Finance / Admin.'})}
  function writableBusinessUnit(req,body={}){const id=Number(body.business_unit_id||currentUnit(req)||0);if(!id)throw new Error('Select a business unit for this transaction.');if(!enforceUnit(req,id))throw new Error('You cannot post to another business unit.');return id}

  // ---------------------------------------------------------------------------
  // Accounting APIs
  // ---------------------------------------------------------------------------
  app.get('/api/accounting/overview',auth,allow('finance','dashboard'),(req,res)=>{
    processQueue(1000);const f=lineUnitFilter(req,'l'),args=f.args;
    const totals=db.prepare(`SELECT COALESCE(SUM(l.debit_krw),0) debit,COALESCE(SUM(l.credit_krw),0) credit FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id WHERE j.status='Posted'${f.sql}`).get(...args);
    const byType=db.prepare(`SELECT a.account_type,COALESCE(SUM(l.debit_krw-l.credit_krw),0) net FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id JOIN accounting_accounts a ON a.id=l.account_id WHERE j.status='Posted'${f.sql} GROUP BY a.account_type`).all(...args);
    const map=Object.fromEntries(byType.map(x=>[x.account_type,Number(x.net||0)]));
    const revenue=Math.abs(map.Revenue||0),expense=Number(map.Expense||0),assets=Number(map.Asset||0),liabilities=Math.abs(map.Liability||0),equity=Math.abs(map.Equity||0);
    const exceptions=db.prepare(`SELECT COUNT(*) c FROM accounting_exceptions e WHERE e.status='Open'${req.selected_business_unit_id?' AND e.business_unit_id=?':req.user.role==='CEO / Owner'?'':req.user.business_unit_id?' AND e.business_unit_id=?':' AND 1=0'}`).get(...(req.selected_business_unit_id?[req.selected_business_unit_id]:req.user.role==='CEO / Owner'?[]:req.user.business_unit_id?[req.user.business_unit_id]:[])).c;
    const reconciliationScope=req.selected_business_unit_id?' AND (p.business_unit_id=? OR p.business_unit_id IS NULL)':req.user.role==='CEO / Owner'?'':req.user.business_unit_id?' AND (p.business_unit_id=? OR p.business_unit_id IS NULL)':' AND 1=0';
    const reconciliationArgs=req.selected_business_unit_id?[req.selected_business_unit_id]:req.user.role==='CEO / Owner'?[]:req.user.business_unit_id?[req.user.business_unit_id]:[];
    const unreconciled=db.prepare(`SELECT COUNT(*) c FROM accounting_bank_statement_lines s JOIN accounting_payment_accounts p ON p.id=s.payment_account_id WHERE s.status!='Reconciled'${reconciliationScope}`).get(...reconciliationArgs).c;
    const queue=req.selected_business_unit_id?db.prepare('SELECT COUNT(*) c FROM accounting_sync_queue q JOIN finance_entries f ON f.id=q.finance_entry_id WHERE f.business_unit_id=?').get(req.selected_business_unit_id).c:req.user.role==='CEO / Owner'?db.prepare('SELECT COUNT(*) c FROM accounting_sync_queue').get().c:db.prepare('SELECT COUNT(*) c FROM accounting_sync_queue q JOIN finance_entries f ON f.id=q.finance_entry_id WHERE f.business_unit_id=?').get(req.user.business_unit_id).c;
    const buyerAdvanceLedger=Math.abs(Number(db.prepare(`SELECT COALESCE(SUM(l.credit_krw-l.debit_krw),0) v FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id JOIN accounting_accounts a ON a.id=l.account_id WHERE j.status='Posted' AND a.system_key='CUSTOMER_ADVANCES'${f.sql}`).get(...args).v||0));
    const payable=Math.abs(Number(db.prepare(`SELECT COALESCE(SUM(l.credit_krw-l.debit_krw),0) v FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id JOIN accounting_accounts a ON a.id=l.account_id WHERE j.status='Posted' AND a.system_key='ACCOUNTS_PAYABLE'${f.sql}`).get(...args).v||0));
    res.json({version:VERSION,debit:Number(totals.debit||0),credit:Number(totals.credit||0),revenue,expense,profit:revenue-expense,assets,liabilities,equity,buyer_advances:buyerAdvanceLedger,supplier_payable:payable,exceptions:Number(exceptions||0),unreconciled:Number(unreconciled||0),sync_queue:Number(queue||0)});
  });
  app.get('/api/accounting/accounts',auth,allow('finance','dashboard'),(req,res)=>res.json(db.prepare('SELECT * FROM accounting_accounts ORDER BY code').all()));
  app.post('/api/accounting/accounts',auth,requireAccountingWrite,(req,res)=>{const code=text(req.body.code),name=text(req.body.name),type=text(req.body.account_type);if(!code||!name||!['Asset','Liability','Equity','Revenue','Expense'].includes(type))return res.status(400).json({error:'Code, name and a valid account type are required.'});const normal=['Liability','Equity','Revenue'].includes(type)?'Credit':'Debit';try{const r=db.prepare('INSERT INTO accounting_accounts(code,name,account_type,subtype,normal_balance,currency,allow_manual,notes) VALUES(?,?,?,?,?,?,?,?)').run(code,name,type,text(req.body.subtype),normal,text(req.body.currency||'KRW').toUpperCase(),req.body.allow_manual===false||req.body.allow_manual==='0'?0:1,text(req.body.notes));audit(req.user,'accounting_account',r.lastInsertRowid,'create',JSON.stringify({code,name,type}));res.json({id:r.lastInsertRowid})}catch(e){res.status(409).json({error:'Account code already exists or the account could not be created.'})}});
  app.put('/api/accounting/accounts/:id',auth,requireAccountingWrite,(req,res)=>{const a=db.prepare('SELECT * FROM accounting_accounts WHERE id=?').get(req.params.id);if(!a)return res.status(404).json({error:'Account not found'});if(a.system_key&&req.body.active==='0')return res.status(400).json({error:'System accounts cannot be deactivated.'});db.prepare('UPDATE accounting_accounts SET name=?,subtype=?,currency=?,active=?,allow_manual=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.name??a.name,req.body.subtype??a.subtype,req.body.currency??a.currency,req.body.active===undefined?a.active:Number(req.body.active?1:0),req.body.allow_manual===undefined?a.allow_manual:Number(req.body.allow_manual?1:0),req.body.notes??a.notes,a.id);audit(req.user,'accounting_account',a.id,'update',a.code);res.json({ok:true})});
  app.get('/api/accounting/payment-accounts',auth,allow('finance','dashboard'),(req,res)=>{const f=req.selected_business_unit_id?' WHERE (p.business_unit_id IS NULL OR p.business_unit_id=?)':req.user.role==='CEO / Owner'?'':req.user.business_unit_id?' WHERE (p.business_unit_id IS NULL OR p.business_unit_id=?)':' WHERE 1=0',args=req.selected_business_unit_id?[req.selected_business_unit_id]:req.user.role==='CEO / Owner'?[]:req.user.business_unit_id?[req.user.business_unit_id]:[];res.json(db.prepare(`SELECT p.*,a.code ledger_code,a.name ledger_name,b.name business_unit FROM accounting_payment_accounts p JOIN accounting_accounts a ON a.id=p.ledger_account_id LEFT JOIN business_units b ON b.id=p.business_unit_id${f} ORDER BY p.active DESC,p.name`).all(...args))});
  app.post('/api/accounting/payment-accounts',auth,requireAccountingWrite,(req,res)=>{let bu=req.body.business_unit_id?Number(req.body.business_unit_id):null;if(bu&&!enforceUnit(req,bu))return res.status(403).json({error:'You cannot create an account for another business unit.'});const ledger=Number(req.body.ledger_account_id||0);if(!db.prepare("SELECT id FROM accounting_accounts WHERE id=? AND account_type='Asset'").get(ledger))return res.status(400).json({error:'Select an Asset ledger account for the payment account.'});const name=text(req.body.name);if(!name)return res.status(400).json({error:'Account name is required.'});const r=db.prepare('INSERT INTO accounting_payment_accounts(business_unit_id,name,payment_type,currency,ledger_account_id,bank_name,account_last4,is_default,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)').run(bu,name,text(req.body.payment_type||'Bank'),text(req.body.currency||'KRW').toUpperCase(),ledger,text(req.body.bank_name),text(req.body.account_last4).slice(-4),req.body.is_default?1:0,text(req.body.notes),req.user.id);audit(req.user,'payment_account',r.lastInsertRowid,'create',name);res.json({id:r.lastInsertRowid})});
  app.get('/api/accounting/journal',auth,allow('finance','dashboard'),(req,res)=>{processQueue(1000);const f=journalUnitFilter(req,'j'),from=text(req.query.from),to=text(req.query.to),accountIdQ=Number(req.query.account_id||0);let q=`SELECT j.*,b.name business_unit,u.name created_by_name,(SELECT ROUND(SUM(debit_krw),2) FROM accounting_journal_lines WHERE journal_entry_id=j.id) total_debit,(SELECT ROUND(SUM(credit_krw),2) FROM accounting_journal_lines WHERE journal_entry_id=j.id) total_credit FROM accounting_journal_entries j LEFT JOIN business_units b ON b.id=j.business_unit_id LEFT JOIN users u ON u.id=j.created_by WHERE 1=1${f.sql}`,args=[...f.args];if(from){q+=' AND date(j.transaction_date)>=date(?)';args.push(from)}if(to){q+=' AND date(j.transaction_date)<=date(?)';args.push(to)}if(accountIdQ){q+=' AND EXISTS(SELECT 1 FROM accounting_journal_lines x WHERE x.journal_entry_id=j.id AND x.account_id=?)';args.push(accountIdQ)}q+=' ORDER BY date(j.transaction_date) DESC,j.id DESC LIMIT 1000';res.json(db.prepare(q).all(...args))});
  app.get('/api/accounting/journal/:id',auth,allow('finance','dashboard'),(req,res)=>{const j=db.prepare('SELECT j.*,b.name business_unit,u.name created_by_name FROM accounting_journal_entries j LEFT JOIN business_units b ON b.id=j.business_unit_id LEFT JOIN users u ON u.id=j.created_by WHERE j.id=?').get(req.params.id);if(!j||!canSeeJournal(req,j.id,j.business_unit_id))return res.status(404).json({error:'Journal entry not found'});const lines=db.prepare('SELECT l.*,a.code,a.name account_name,a.account_type,b.name business_unit FROM accounting_journal_lines l JOIN accounting_accounts a ON a.id=l.account_id LEFT JOIN business_units b ON b.id=l.business_unit_id WHERE l.journal_entry_id=? ORDER BY l.id').all(j.id);res.json({journal:j,lines})});
  app.post('/api/accounting/journal',auth,requireAccountingWrite,(req,res)=>{let bu;try{bu=writableBusinessUnit(req,req.body)}catch(e){return res.status(400).json({error:e.message})}const date=dateOnly(req.body.transaction_date);if(!date)return res.status(400).json({error:'Transaction date is required.'});if(isPeriodClosed(bu,date))return res.status(409).json({error:'This accounting period is closed.'});const lines=Array.isArray(req.body.lines)?req.body.lines:[];if(lines.length<2)return res.status(400).json({error:'At least two journal lines are required.'});const normalized=[];for(const l of lines){const a=db.prepare('SELECT * FROM accounting_accounts WHERE id=? AND active=1').get(Number(l.account_id));if(!a||!a.allow_manual)return res.status(400).json({error:'One or more selected accounts do not allow manual posting.'});normalized.push({account_id:a.id,business_unit_id:bu,debit_krw:num(l.debit_krw),credit_krw:num(l.credit_krw),memo:text(l.memo)})}const dr=normalized.reduce((n,l)=>n+l.debit_krw,0),cr=normalized.reduce((n,l)=>n+l.credit_krw,0);if(dr<=0||Math.abs(dr-cr)>0.005)return res.status(400).json({error:'Manual journal must have equal debit and credit totals.'});const jid=postJournal({businessUnitId:bu,transactionDate:date,sourceType:'Manual Journal',sourceId:null,sourceLabel:'Manual Journal',description:text(req.body.description),createdBy:req.user.id,lines:normalized});audit(req.user,'accounting_journal',jid,'manual-post',JSON.stringify({debit:dr,credit:cr}));res.json({id:jid})});

  function reportRows(req,kind){
    processQueue(1000);const f=lineUnitFilter(req,'l'),from=text(req.query.from),to=text(req.query.to),args=[...f.args];let dateSql='';if(from){dateSql+=' AND date(j.transaction_date)>=date(?)';args.push(from)}if(to){dateSql+=' AND date(j.transaction_date)<=date(?)';args.push(to)}
    const rows=db.prepare(`SELECT a.id,a.code,a.name,a.account_type,a.normal_balance,ROUND(COALESCE(SUM(CASE WHEN j.id IS NOT NULL THEN l.debit_krw ELSE 0 END),0),2) debit,ROUND(COALESCE(SUM(CASE WHEN j.id IS NOT NULL THEN l.credit_krw ELSE 0 END),0),2) credit FROM accounting_accounts a LEFT JOIN accounting_journal_lines l ON l.account_id=a.id${f.sql} LEFT JOIN accounting_journal_entries j ON j.id=l.journal_entry_id AND j.status='Posted'${dateSql} WHERE a.active=1 GROUP BY a.id ORDER BY a.code`).all(...args).map(r=>({...r,balance:['Liability','Equity','Revenue'].includes(r.account_type)?Number(r.credit||0)-Number(r.debit||0):Number(r.debit||0)-Number(r.credit||0)}));
    if(kind==='pnl')return rows.filter(r=>['Revenue','Expense'].includes(r.account_type));if(kind==='balance')return rows.filter(r=>['Asset','Liability','Equity'].includes(r.account_type));return rows
  }
  app.get('/api/accounting/trial-balance',auth,allow('finance','dashboard'),(req,res)=>{const rows=reportRows(req,'trial'),debit=rows.reduce((n,r)=>n+Number(r.debit||0),0),credit=rows.reduce((n,r)=>n+Number(r.credit||0),0);res.json({rows,debit,credit,difference:debit-credit})});
  app.get('/api/accounting/pnl',auth,allow('finance','dashboard'),(req,res)=>{const rows=reportRows(req,'pnl'),revenue=rows.filter(r=>r.account_type==='Revenue').reduce((n,r)=>n+Number(r.balance||0),0),expense=rows.filter(r=>r.account_type==='Expense').reduce((n,r)=>n+Number(r.balance||0),0);res.json({rows,revenue,expense,profit:revenue-expense})});
  app.get('/api/accounting/balance-sheet',auth,allow('finance','dashboard'),(req,res)=>{const rows=reportRows(req,'balance'),assets=rows.filter(r=>r.account_type==='Asset').reduce((n,r)=>n+Number(r.balance||0),0),liabilities=rows.filter(r=>r.account_type==='Liability').reduce((n,r)=>n+Number(r.balance||0),0),equity=rows.filter(r=>r.account_type==='Equity').reduce((n,r)=>n+Number(r.balance||0),0);const pnl=reportRows(req,'pnl'),currentProfit=pnl.filter(r=>r.account_type==='Revenue').reduce((n,r)=>n+Number(r.balance||0),0)-pnl.filter(r=>r.account_type==='Expense').reduce((n,r)=>n+Number(r.balance||0),0);res.json({rows,assets,liabilities,equity,current_profit:currentProfit,equity_plus_profit:equity+currentProfit,difference:assets-(liabilities+equity+currentProfit)})});
  app.get('/api/accounting/exceptions',auth,allow('finance','dashboard'),(req,res)=>{let q='SELECT e.*,b.name business_unit,f.reference,f.source_type,f.source_id FROM accounting_exceptions e LEFT JOIN business_units b ON b.id=e.business_unit_id LEFT JOIN finance_entries f ON f.id=e.finance_entry_id WHERE e.status=?',args=[req.query.status||'Open'];if(req.selected_business_unit_id){q+=' AND e.business_unit_id=?';args.push(req.selected_business_unit_id)}else if(req.user.role!=='CEO / Owner'){q+=' AND e.business_unit_id=?';args.push(req.user.business_unit_id)}q+=' ORDER BY e.created_at DESC';res.json(db.prepare(q).all(...args))});
  app.post('/api/accounting/resync',auth,requireAccountingWrite,(req,res)=>{let q='INSERT OR IGNORE INTO accounting_sync_queue(finance_entry_id,queued_at) SELECT id,CURRENT_TIMESTAMP FROM finance_entries WHERE 1=1',args=[];if(req.selected_business_unit_id){q+=' AND business_unit_id=?';args.push(req.selected_business_unit_id)}else if(req.user.role!=='CEO / Owner'){q+=' AND business_unit_id=?';args.push(req.user.business_unit_id)}db.prepare(q).run(...args);processQueue(5000);res.json({ok:true,remaining:db.prepare('SELECT COUNT(*) c FROM accounting_sync_queue').get().c})});

  app.get('/api/accounting/periods',auth,allow('finance'),(req,res)=>{let q='SELECT p.*,b.name business_unit,u.name closed_by_name FROM accounting_periods p LEFT JOIN business_units b ON b.id=p.business_unit_id LEFT JOIN users u ON u.id=p.closed_by WHERE 1=1',args=[];if(req.selected_business_unit_id){q+=' AND (p.business_unit_id=? OR p.business_unit_id IS NULL)';args.push(req.selected_business_unit_id)}else if(req.user.role!=='CEO / Owner'){q+=' AND p.business_unit_id=?';args.push(req.user.business_unit_id)}q+=' ORDER BY p.period_key DESC,p.business_unit_id';res.json(db.prepare(q).all(...args))});
  app.post('/api/accounting/periods/close',auth,requireAccountingWrite,(req,res)=>{const key=text(req.body.period_key);if(!/^\d{4}-\d{2}$/.test(key))return res.status(400).json({error:'Period must be YYYY-MM.'});let bu=req.body.business_unit_id?Number(req.body.business_unit_id):currentUnit(req);if(req.user.role!=='CEO / Owner'&&!bu)bu=req.user.business_unit_id;if(bu&&!enforceUnit(req,bu))return res.status(403).json({error:'You cannot close another business unit period.'});processQueue(5000);const pending=bu?db.prepare("SELECT COUNT(*) c FROM accounting_sync_queue q JOIN finance_entries f ON f.id=q.finance_entry_id WHERE f.business_unit_id=? AND substr(COALESCE(f.transaction_date,f.created_at),1,7)=?").get(bu,key).c:db.prepare("SELECT COUNT(*) c FROM accounting_sync_queue q JOIN finance_entries f ON f.id=q.finance_entry_id WHERE substr(COALESCE(f.transaction_date,f.created_at),1,7)=?").get(key).c;if(pending)return res.status(409).json({error:`${pending} Finance transaction(s) are still waiting for accounting synchronization.`});const openExc=bu?db.prepare("SELECT COUNT(*) c FROM accounting_exceptions WHERE status='Open' AND business_unit_id=?").get(bu).c:db.prepare("SELECT COUNT(*) c FROM accounting_exceptions WHERE status='Open'").get().c;if(openExc)return res.status(409).json({error:`Resolve ${openExc} open accounting exception(s) before closing the period.`});const existingPeriod=db.prepare('SELECT id FROM accounting_periods WHERE period_key=? AND COALESCE(business_unit_id,0)=COALESCE(?,0) ORDER BY id LIMIT 1').get(key,bu||null);if(existingPeriod)db.prepare("UPDATE accounting_periods SET status='Closed',notes=?,closed_by=?,closed_at=CURRENT_TIMESTAMP WHERE id=?").run(text(req.body.notes),req.user.id,existingPeriod.id);else db.prepare("INSERT INTO accounting_periods(business_unit_id,period_key,status,notes,closed_by,closed_at) VALUES(?,?,'Closed',?,?,CURRENT_TIMESTAMP)").run(bu||null,key,text(req.body.notes),req.user.id);audit(req.user,'accounting_period',0,'close',JSON.stringify({business_unit_id:bu||null,period:key}));res.json({ok:true})});
  app.post('/api/accounting/periods/reopen',auth,(req,res)=>{if(req.user.role!=='CEO / Owner')return res.status(403).json({error:'Only CEO / Owner can reopen a closed accounting period.'});const key=text(req.body.period_key),bu=req.body.business_unit_id?Number(req.body.business_unit_id):null;db.prepare("UPDATE accounting_periods SET status='Open',reopened_by=?,reopened_at=CURRENT_TIMESTAMP,notes=COALESCE(notes,'')||? WHERE period_key=? AND COALESCE(business_unit_id,0)=COALESCE(?,0)").run(req.user.id,' | REOPEN: '+text(req.body.reason||'CEO authorized reopening'),key,bu);audit(req.user,'accounting_period',0,'reopen',JSON.stringify({business_unit_id:bu,period:key,reason:req.body.reason||''}));res.json({ok:true})});

  app.get('/api/accounting/reconciliation',auth,allow('finance'),(req,res)=>{let q=`SELECT s.*,p.name payment_account,p.business_unit_id,p.ledger_account_id,j.journal_no FROM accounting_bank_statement_lines s JOIN accounting_payment_accounts p ON p.id=s.payment_account_id LEFT JOIN accounting_journal_entries j ON j.id=s.matched_journal_entry_id WHERE 1=1`,args=[];if(req.selected_business_unit_id){q+=' AND (p.business_unit_id=? OR p.business_unit_id IS NULL)';args.push(req.selected_business_unit_id)}else if(req.user.role!=='CEO / Owner'){q+=' AND (p.business_unit_id=? OR p.business_unit_id IS NULL)';args.push(req.user.business_unit_id)}q+=' ORDER BY s.statement_date DESC,s.id DESC LIMIT 1000';res.json(db.prepare(q).all(...args))});
  app.post('/api/accounting/reconciliation/lines',auth,requireAccountingWrite,(req,res)=>{const pa=Number(req.body.payment_account_id||0),date=dateOnly(req.body.statement_date),amount=num(req.body.amount_krw),account=db.prepare('SELECT * FROM accounting_payment_accounts WHERE id=? AND active=1').get(pa);if(!account||!date||!amount)return res.status(400).json({error:'Payment account, date and non-zero amount are required.'});if(account.business_unit_id&&!enforceUnit(req,account.business_unit_id))return res.status(403).json({error:'You cannot add a statement line for another business unit account.'});const r=db.prepare('INSERT INTO accounting_bank_statement_lines(payment_account_id,statement_date,description,reference,amount_krw,imported_by) VALUES(?,?,?,?,?,?)').run(pa,date,text(req.body.description),text(req.body.reference),amount,req.user.id);audit(req.user,'bank_reconciliation',r.lastInsertRowid,'statement-line-create',JSON.stringify({payment_account_id:pa,amount,date}));res.json({id:r.lastInsertRowid})});
  app.post('/api/accounting/reconciliation/:id/match',auth,requireAccountingWrite,(req,res)=>{const line=db.prepare(`SELECT s.*,p.ledger_account_id,p.business_unit_id FROM accounting_bank_statement_lines s JOIN accounting_payment_accounts p ON p.id=s.payment_account_id WHERE s.id=?`).get(req.params.id),j=db.prepare("SELECT * FROM accounting_journal_entries WHERE id=? AND status='Posted'").get(Number(req.body.journal_entry_id||0));if(!line||!j)return res.status(404).json({error:'Statement line or posted journal entry not found.'});if(line.status==='Reconciled')return res.status(409).json({error:'This statement line is already reconciled.'});if(line.business_unit_id&&!enforceUnit(req,line.business_unit_id))return res.status(403).json({error:'You cannot reconcile another business unit account.'});if(!canSeeJournal(req,j.id,j.business_unit_id))return res.status(403).json({error:'You cannot access the selected journal entry.'});const ledgerNet=Number(db.prepare('SELECT COALESCE(SUM(debit_krw-credit_krw),0) v FROM accounting_journal_lines WHERE journal_entry_id=? AND account_id=?').get(j.id,line.ledger_account_id).v||0);if(Math.abs(ledgerNet-Number(line.amount_krw||0))>0.01)return res.status(409).json({error:`Journal cash/bank movement ${ledgerNet.toFixed(2)} KRW does not match statement amount ${Number(line.amount_krw||0).toFixed(2)} KRW.`});const used=db.prepare("SELECT id FROM accounting_bank_statement_lines WHERE status='Reconciled' AND matched_journal_entry_id=? AND id<>? LIMIT 1").get(j.id,line.id);if(used)return res.status(409).json({error:'This journal entry is already matched to another bank statement line.'});db.prepare("UPDATE accounting_bank_statement_lines SET status='Reconciled',matched_journal_entry_id=? WHERE id=?").run(j.id,line.id);audit(req.user,'bank_reconciliation',line.id,'match',JSON.stringify({journal_id:j.id,amount:line.amount_krw}));res.json({ok:true})});
  app.post('/api/accounting/reconciliation/:id/unmatch',auth,requireAccountingWrite,(req,res)=>{const line=db.prepare(`SELECT s.*,p.business_unit_id FROM accounting_bank_statement_lines s JOIN accounting_payment_accounts p ON p.id=s.payment_account_id WHERE s.id=?`).get(req.params.id);if(!line)return res.status(404).json({error:'Statement line not found.'});if(line.business_unit_id&&!enforceUnit(req,line.business_unit_id))return res.status(403).json({error:'You cannot change another business unit account.'});db.prepare("UPDATE accounting_bank_statement_lines SET status='Unreconciled',matched_journal_entry_id=NULL WHERE id=?").run(line.id);audit(req.user,'bank_reconciliation',line.id,'unmatch','Authorized reconciliation reset');res.json({ok:true})});

  app.get('/api/accounting/budgets',auth,allow('finance'),(req,res)=>{let q=`SELECT b.*,a.code,a.name account_name,u.name business_unit FROM accounting_budgets b JOIN accounting_accounts a ON a.id=b.account_id LEFT JOIN business_units u ON u.id=b.business_unit_id WHERE 1=1`,args=[];if(req.selected_business_unit_id){q+=' AND b.business_unit_id=?';args.push(req.selected_business_unit_id)}else if(req.user.role!=='CEO / Owner'){q+=' AND b.business_unit_id=?';args.push(req.user.business_unit_id)}q+=' ORDER BY b.period_key DESC,a.code';res.json(db.prepare(q).all(...args))});
  app.post('/api/accounting/budgets',auth,requireAccountingWrite,(req,res)=>{let bu;try{bu=writableBusinessUnit(req,req.body)}catch(e){return res.status(400).json({error:e.message})}const aid=Number(req.body.account_id||0),key=text(req.body.period_key),amount=num(req.body.budget_krw);if(!aid||!/^\d{4}-\d{2}$/.test(key)||amount<0)return res.status(400).json({error:'Account, period and valid budget are required.'});db.prepare(`INSERT INTO accounting_budgets(business_unit_id,account_id,period_key,budget_krw,notes,created_by) VALUES(?,?,?,?,?,?) ON CONFLICT(business_unit_id,account_id,period_key) DO UPDATE SET budget_krw=excluded.budget_krw,notes=excluded.notes,updated_at=CURRENT_TIMESTAMP`).run(bu,aid,key,amount,text(req.body.notes),req.user.id);res.json({ok:true})});

  app.get('/api/accounting/inter-unit-transfers',auth,allow('finance'),(req,res)=>{let q=`SELECT t.*,fb.name from_business_unit,tb.name to_business_unit,fp.name from_payment_account,tp.name to_payment_account,j.journal_no FROM accounting_inter_unit_transfers t LEFT JOIN business_units fb ON fb.id=t.from_business_unit_id LEFT JOIN business_units tb ON tb.id=t.to_business_unit_id LEFT JOIN accounting_payment_accounts fp ON fp.id=t.from_payment_account_id LEFT JOIN accounting_payment_accounts tp ON tp.id=t.to_payment_account_id LEFT JOIN accounting_journal_entries j ON j.id=t.journal_entry_id WHERE 1=1`,args=[];const bu=req.selected_business_unit_id?Number(req.selected_business_unit_id):(req.user.role==='CEO / Owner'?null:Number(req.user.business_unit_id||0));if(bu){q+=' AND (t.from_business_unit_id=? OR t.to_business_unit_id=?)';args.push(bu,bu)}q+=' ORDER BY date(t.transfer_date) DESC,t.id DESC LIMIT 500';res.json(db.prepare(q).all(...args))});

  app.post('/api/accounting/inter-unit-transfers',auth,requireAccountingWrite,(req,res)=>{
    const from=Number(req.body.from_business_unit_id||0),to=Number(req.body.to_business_unit_id||0),amount=num(req.body.amount_krw),date=dateOnly(req.body.transfer_date),reference=text(req.body.reference),fromPa=Number(req.body.from_payment_account_id||0),toPa=Number(req.body.to_payment_account_id||0);
    if(!from||!to||from===to||amount<=0||!date||!reference||!fromPa||!toPa)return res.status(400).json({error:'From unit, To unit, source account, destination account, amount, date and reference are required.'});
    if(req.user.role!=='CEO / Owner'&&Number(req.user.business_unit_id)!==from)return res.status(403).json({error:'Only CEO or the authorized source-unit Finance user can create this transfer.'});
    const fp=db.prepare('SELECT * FROM accounting_payment_accounts WHERE id=? AND active=1').get(fromPa),tp=db.prepare('SELECT * FROM accounting_payment_accounts WHERE id=? AND active=1').get(toPa);
    if(!fp||!tp)return res.status(400).json({error:'Select valid active payment accounts.'});
    if(fp.business_unit_id&&Number(fp.business_unit_id)!==from)return res.status(400).json({error:'Source payment account is not assigned to the selected source business unit.'});
    if(tp.business_unit_id&&Number(tp.business_unit_id)!==to)return res.status(400).json({error:'Destination payment account is not assigned to the selected destination business unit.'});
    if(isPeriodClosed(from,date)||isPeriodClosed(to,date))return res.status(409).json({error:'The transfer date belongs to a closed accounting period for one of the business units.'});
    const lines=[
      {account_id:accountId('INTER_BU_RECEIVABLE'),business_unit_id:from,debit_krw:amount,credit_krw:0,memo:`Due from business unit ${to}`},
      {account_id:Number(fp.ledger_account_id),business_unit_id:from,debit_krw:0,credit_krw:amount,memo:'Funds transferred out'},
      {account_id:Number(tp.ledger_account_id),business_unit_id:to,debit_krw:amount,credit_krw:0,memo:'Funds received'},
      {account_id:accountId('INTER_BU_PAYABLE'),business_unit_id:to,debit_krw:0,credit_krw:amount,memo:`Due to business unit ${from}`}
    ];
    const transferNo=nextNo('IBU','accounting_inter_unit_transfers');
    const jid=postJournal({businessUnitId:null,transactionDate:date,sourceType:'Inter-BU Transfer',sourceId:null,sourceLabel:'Inter-BU Transfer',description:text(req.body.description)||reference,createdBy:req.user.id,lines});
    const r=db.prepare('INSERT INTO accounting_inter_unit_transfers(transfer_no,from_business_unit_id,to_business_unit_id,from_payment_account_id,to_payment_account_id,amount_krw,transfer_date,reference,description,journal_entry_id,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(transferNo,from,to,fromPa,toPa,amount,date,reference,text(req.body.description),jid,req.user.id);
    db.prepare('UPDATE accounting_journal_entries SET source_id=? WHERE id=?').run(Number(r.lastInsertRowid),jid);
    audit(req.user,'inter_unit_transfer',r.lastInsertRowid,'create',JSON.stringify({from,to,amount,from_payment_account_id:fromPa,to_payment_account_id:toPa}));
    res.json({id:r.lastInsertRowid,transfer_no:transferNo,journal_id:jid});
  });

  // ---------------------------------------------------------------------------
  // Employees & Payroll
  // ---------------------------------------------------------------------------
  const PAYROLL_POSITIVE_COMPONENTS=['Allowance','Bonus','Overtime','Reimbursement'];
  const PAYROLL_COMPONENT_TYPES=[...PAYROLL_POSITIVE_COMPONENTS,'Deduction'];
  function employeeScope(req,alias='e'){
    if(req.selected_business_unit_id)return {sql:` AND ${alias}.business_unit_id=?`,args:[Number(req.selected_business_unit_id)]};
    if(req.user.role==='CEO / Owner')return {sql:'',args:[]};
    if(req.user.business_unit_id)return {sql:` AND ${alias}.business_unit_id=?`,args:[Number(req.user.business_unit_id)]};
    return {sql:' AND 1=0',args:[]};
  }
  function validBusinessUnit(id){return db.prepare("SELECT id FROM business_units WHERE id=? AND status!='Archived'").get(Number(id||0))}
  function validateEmployeeUserLink(userId,employeeId=null){
    if(!userId)return null;
    const u=db.prepare('SELECT id,name,email,role,business_unit_id,active FROM users WHERE id=?').get(Number(userId));
    if(!u||!u.active)throw new Error('Selected user account is not active or does not exist.');
    const linked=db.prepare('SELECT id,name FROM employees WHERE user_id=? AND id<>COALESCE(?,0) LIMIT 1').get(Number(userId),employeeId);
    if(linked)throw new Error(`This user account is already linked to employee ${linked.name}.`);
    return u;
  }
  function validatePaymentAccountForBu(paymentAccountId,businessUnitId){
    if(!paymentAccountId)return null;
    const p=db.prepare('SELECT * FROM accounting_payment_accounts WHERE id=? AND active=1').get(Number(paymentAccountId));
    if(!p)throw new Error('Selected payment account is not active or does not exist.');
    if(p.business_unit_id&&Number(p.business_unit_id)!==Number(businessUnitId))throw new Error('Selected payment account belongs to another business unit.');
    return p;
  }
  function getEmployeeAllocations(employeeId,primaryBu){
    const rows=db.prepare(`SELECT a.*,b.name business_unit FROM employee_cost_allocations a JOIN business_units b ON b.id=a.business_unit_id WHERE a.employee_id=? AND a.active=1 ORDER BY a.business_unit_id`).all(employeeId);
    if(!rows.length)return [{employee_id:Number(employeeId),business_unit_id:Number(primaryBu),percentage:100,business_unit:db.prepare('SELECT name FROM business_units WHERE id=?').get(primaryBu)?.name||''}];
    return rows;
  }
  function normalizeAllocations(employee,allocations){
    const rows=(Array.isArray(allocations)?allocations:[]).map(x=>({business_unit_id:Number(x.business_unit_id||0),percentage:Number(x.percentage||0),notes:text(x.notes)})).filter(x=>x.business_unit_id&&x.percentage>0);
    if(!rows.length)return [{business_unit_id:Number(employee.business_unit_id),percentage:100,notes:'Primary business unit'}];
    const seen=new Set();for(const r of rows){if(seen.has(r.business_unit_id))throw new Error('A business unit can appear only once in an employee cost allocation.');seen.add(r.business_unit_id);if(!validBusinessUnit(r.business_unit_id))throw new Error('One or more allocation business units are invalid.');if(r.percentage<=0||r.percentage>100)throw new Error('Allocation percentages must be greater than 0 and no more than 100.');}
    const total=rows.reduce((n,x)=>n+x.percentage,0);if(Math.abs(total-100)>0.01)throw new Error(`Employee cost allocations must total 100%. Current total: ${total.toFixed(2)}%.`);
    return rows;
  }
  function dateDaysInclusive(a,b){const x=new Date(String(a)+'T00:00:00Z'),y=new Date(String(b)+'T00:00:00Z');return Math.max(0,Math.floor((y-x)/86400000)+1)}
  function employeeBaseKrwForPeriod(e,start,end){
    const overlapStart=e.join_date&&e.join_date>start?e.join_date:start,overlapEnd=e.leave_date&&e.leave_date<end?e.leave_date:end;
    if(!overlapStart||!overlapEnd||overlapEnd<overlapStart)return 0;
    const days=dateDaysInclusive(overlapStart,overlapEnd),periodDays=Math.max(1,dateDaysInclusive(start,end)),rate=text(e.salary_currency).toUpperCase()==='KRW'?1:Number(e.salary_fx_rate||1),base=Number(e.base_salary||0)*rate;
    if(text(e.salary_type)==='Daily')return Math.round(base*days*100)/100;
    if(text(e.salary_type)==='Weekly')return Math.round(base*(days/7)*100)/100;
    return Math.round(base*(days/periodDays)*100)/100;
  }
  function rebuildPayrollItem(itemId){
    const item=db.prepare('SELECT * FROM payroll_run_items WHERE id=?').get(itemId);if(!item)return null;
    const comps=db.prepare('SELECT * FROM payroll_run_item_components WHERE payroll_run_item_id=?').all(item.id),positive=comps.filter(c=>PAYROLL_POSITIVE_COMPONENTS.includes(c.component_type)).reduce((n,c)=>n+num(c.amount_krw),0),ded=comps.filter(c=>c.component_type==='Deduction').reduce((n,c)=>n+num(c.amount_krw),0),gross=Math.max(0,num(item.base_salary_krw)+positive),net=Math.max(0,gross-ded-num(item.advance_deduction_krw)),paid=Math.min(num(item.paid_krw),net),outstanding=Math.max(0,net-paid);
    db.prepare('UPDATE payroll_run_items SET allowances_krw=?,deductions_krw=?,gross_salary_krw=?,net_salary_krw=?,paid_krw=?,outstanding_krw=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(positive,ded,gross,net,paid,outstanding,item.id);
    return db.prepare('SELECT * FROM payroll_run_items WHERE id=?').get(item.id)
  }
  function refreshPayrollRunTotals(runId){
    const t=db.prepare('SELECT COALESCE(SUM(net_salary_krw),0) net,COALESCE(SUM(paid_krw),0) paid,COALESCE(SUM(outstanding_krw),0) outstanding FROM payroll_run_items WHERE payroll_run_id=?').get(runId),run=db.prepare('SELECT * FROM payroll_runs WHERE id=?').get(runId);if(!run)return null;
    let status=run.status;if(['Approved','Partially Paid','Paid'].includes(status))status=Number(t.outstanding||0)<=0.005?'Paid':Number(t.paid||0)>0?'Partially Paid':'Approved';
    db.prepare('UPDATE payroll_runs SET total_paid_krw=?,outstanding_krw=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(Number(t.paid||0),Number(t.outstanding||0),status,runId);return {...t,status};
  }

  app.get('/api/payroll/users',auth,requirePayroll,(req,res)=>{let q='SELECT u.id,u.name,u.email,u.role,u.business_unit_id,b.name business_unit,u.active,(SELECT e.id FROM employees e WHERE e.user_id=u.id LIMIT 1) employee_id FROM users u LEFT JOIN business_units b ON b.id=u.business_unit_id WHERE u.active=1',args=[];if(req.user.role!=='CEO / Owner'){q+=' AND (u.business_unit_id=? OR u.id=?)';args.push(req.user.business_unit_id,req.user.id)}q+=' ORDER BY u.name';res.json(db.prepare(q).all(...args))});
  app.get('/api/payroll/employees',auth,requirePayroll,(req,res)=>{const f=employeeScope(req,'e');res.json(db.prepare(`SELECT e.*,b.name business_unit,u.email user_email,u.name user_name,(SELECT COALESCE(SUM(a.outstanding_krw),0) FROM employee_advances a WHERE a.employee_id=e.id AND a.status='Active') advance_outstanding_krw FROM employees e LEFT JOIN business_units b ON b.id=e.business_unit_id LEFT JOIN users u ON u.id=e.user_id WHERE 1=1${f.sql} ORDER BY e.employment_status='Active' DESC,e.name`).all(...f.args))});
  app.get('/api/payroll/employees/:id',auth,requirePayroll,(req,res)=>{const e=db.prepare('SELECT e.*,b.name business_unit,u.email user_email,u.name user_name FROM employees e LEFT JOIN business_units b ON b.id=e.business_unit_id LEFT JOIN users u ON u.id=e.user_id WHERE e.id=?').get(req.params.id);if(!e||!enforceUnit(req,e.business_unit_id))return res.status(404).json({error:'Employee not found'});const components=db.prepare('SELECT * FROM employee_salary_components WHERE employee_id=? ORDER BY active DESC,component_type,component_name').all(e.id),advances=db.prepare('SELECT * FROM employee_advances WHERE employee_id=? ORDER BY advance_date DESC,id DESC').all(e.id),allocations=getEmployeeAllocations(e.id,e.business_unit_id),documents=db.prepare('SELECT * FROM payroll_documents WHERE employee_id=? ORDER BY created_at DESC,id DESC').all(e.id),payslips=db.prepare(`SELECT i.id item_id,i.payslip_no,i.gross_salary_krw,i.net_salary_krw,i.paid_krw,i.outstanding_krw,i.status,r.id payroll_run_id,r.payroll_no,r.period_start,r.period_end,r.pay_date,r.status run_status FROM payroll_run_items i JOIN payroll_runs r ON r.id=i.payroll_run_id WHERE i.employee_id=? ORDER BY r.period_end DESC`).all(e.id);res.json({employee:e,components,advances,allocations,documents,payslips})});
  app.post('/api/payroll/employees',auth,requirePayroll,(req,res)=>{let bu;try{bu=writableBusinessUnit(req,req.body)}catch(e){return res.status(400).json({error:e.message})}const name=text(req.body.name);if(!name)return res.status(400).json({error:'Employee name is required.'});const no=text(req.body.employee_no)||nextNo('EMP','employees'),currency=text(req.body.salary_currency||'KRW').toUpperCase(),rate=currency==='KRW'?1:num(req.body.salary_fx_rate||1),userId=req.body.user_id?Number(req.body.user_id):null;if(rate<=0)return res.status(400).json({error:'Salary FX rate must be greater than zero.'});try{validateEmployeeUserLink(userId);validatePaymentAccountForBu(req.body.payment_account_id,bu);const r=db.prepare(`INSERT INTO employees(employee_no,user_id,business_unit_id,name,job_title,department,employment_type,employment_status,join_date,salary_type,base_salary,salary_currency,salary_fx_rate,payment_method,payment_account_id,bank_details_masked,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(no,userId,bu,name,text(req.body.job_title),text(req.body.department),text(req.body.employment_type||'Full-time'),text(req.body.employment_status||'Active'),dateOnly(req.body.join_date)||null,text(req.body.salary_type||'Monthly'),num(req.body.base_salary),currency,rate,text(req.body.payment_method||'Bank'),req.body.payment_account_id?Number(req.body.payment_account_id):null,text(req.body.bank_details_masked),text(req.body.notes),req.user.id);const id=Number(r.lastInsertRowid);db.prepare('INSERT OR IGNORE INTO employee_cost_allocations(employee_id,business_unit_id,percentage,active,notes,created_by) VALUES(?,?,100,1,?,?)').run(id,bu,'Primary business unit',req.user.id);audit(req.user,'employee',id,'create',JSON.stringify({name,business_unit_id:bu,user_id:userId}));res.json({id})}catch(e){res.status(409).json({error:e.message.includes('linked')||e.message.includes('payment account')?e.message:'Employee number or linked user already exists, or employee could not be created.'})}});
  app.put('/api/payroll/employees/:id',auth,requirePayroll,(req,res)=>{const e=db.prepare('SELECT * FROM employees WHERE id=?').get(req.params.id);if(!e||!enforceUnit(req,e.business_unit_id))return res.status(404).json({error:'Employee not found'});const newBu=req.body.business_unit_id?Number(req.body.business_unit_id):Number(e.business_unit_id),currency=text(req.body.salary_currency??e.salary_currency).toUpperCase(),rate=currency==='KRW'?1:num(req.body.salary_fx_rate??e.salary_fx_rate),userId=req.body.user_id?Number(req.body.user_id):null;if(rate<=0)return res.status(400).json({error:'Salary FX rate must be greater than zero.'});if(!enforceUnit(req,newBu))return res.status(403).json({error:'You cannot move this employee to another business unit.'});try{validateEmployeeUserLink(userId,e.id);validatePaymentAccountForBu(req.body.payment_account_id,newBu);const oldAlloc=db.prepare('SELECT * FROM employee_cost_allocations WHERE employee_id=? AND active=1').all(e.id);db.prepare(`UPDATE employees SET user_id=?,business_unit_id=?,name=?,job_title=?,department=?,employment_type=?,employment_status=?,join_date=?,leave_date=?,salary_type=?,base_salary=?,salary_currency=?,salary_fx_rate=?,payment_method=?,payment_account_id=?,bank_details_masked=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(userId,newBu,req.body.name??e.name,req.body.job_title??e.job_title,req.body.department??e.department,req.body.employment_type??e.employment_type,req.body.employment_status??e.employment_status,req.body.join_date??e.join_date,req.body.leave_date??e.leave_date,req.body.salary_type??e.salary_type,num(req.body.base_salary??e.base_salary),currency,rate,req.body.payment_method??e.payment_method,req.body.payment_account_id?Number(req.body.payment_account_id):null,req.body.bank_details_masked??e.bank_details_masked,req.body.notes??e.notes,e.id);if(newBu!==Number(e.business_unit_id)&&oldAlloc.length===1&&Number(oldAlloc[0].business_unit_id)===Number(e.business_unit_id)&&Math.abs(Number(oldAlloc[0].percentage)-100)<0.01){db.prepare('UPDATE employee_cost_allocations SET business_unit_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(newBu,oldAlloc[0].id)}audit(req.user,'employee',e.id,'update',JSON.stringify({name:req.body.name??e.name,business_unit_id:newBu,user_id:userId}));res.json({ok:true})}catch(x){res.status(409).json({error:x.message})}});
  app.get('/api/payroll/employees/:id/allocations',auth,requirePayroll,(req,res)=>{const e=db.prepare('SELECT * FROM employees WHERE id=?').get(req.params.id);if(!e||!enforceUnit(req,e.business_unit_id))return res.status(404).json({error:'Employee not found'});res.json(getEmployeeAllocations(e.id,e.business_unit_id))});
  app.put('/api/payroll/employees/:id/allocations',auth,requirePayroll,(req,res)=>{const e=db.prepare('SELECT * FROM employees WHERE id=?').get(req.params.id);if(!e||!enforceUnit(req,e.business_unit_id))return res.status(404).json({error:'Employee not found'});let rows;try{rows=normalizeAllocations(e,req.body.allocations)}catch(x){return res.status(400).json({error:x.message})}if(req.user.role!=='CEO / Owner'&&rows.some(x=>Number(x.business_unit_id)!==Number(req.user.business_unit_id)))return res.status(403).json({error:'Only CEO / Owner can allocate an employee salary across multiple business units.'});const tx=db.transaction(()=>{db.prepare('UPDATE employee_cost_allocations SET active=0,updated_at=CURRENT_TIMESTAMP WHERE employee_id=?').run(e.id);const up=db.prepare(`INSERT INTO employee_cost_allocations(employee_id,business_unit_id,percentage,active,notes,created_by) VALUES(?,?,?,1,?,?) ON CONFLICT(employee_id,business_unit_id) DO UPDATE SET percentage=excluded.percentage,active=1,notes=excluded.notes,updated_at=CURRENT_TIMESTAMP`);for(const r of rows)up.run(e.id,r.business_unit_id,r.percentage,r.notes,req.user.id);audit(req.user,'employee',e.id,'cost-allocation-update',JSON.stringify(rows))});tx();res.json({ok:true,allocations:getEmployeeAllocations(e.id,e.business_unit_id)})});
  app.post('/api/payroll/employees/:id/documents',auth,requirePayroll,upload.array('attachments',10),(req,res)=>{const e=db.prepare('SELECT * FROM employees WHERE id=?').get(req.params.id);if(!e||!enforceUnit(req,e.business_unit_id))return res.status(404).json({error:'Employee not found'});const files=req.files||[];if(!files.length)return res.status(400).json({error:'Select at least one employee document.'});const ins=db.prepare('INSERT INTO payroll_documents(employee_id,title,original_name,file_path,mime_type,size_bytes,uploaded_by) VALUES(?,?,?,?,?,?,?)'),ids=[];for(const f of files){const r=ins.run(e.id,text(req.body.title)||'Employee Document',f.originalname,'/uploads/'+f.filename,f.mimetype,f.size,req.user.id);ids.push(Number(r.lastInsertRowid))}audit(req.user,'employee',e.id,'document-upload',JSON.stringify({count:ids.length}));res.json({ok:true,ids})});

  app.post('/api/payroll/employees/:id/components',auth,requirePayroll,(req,res)=>{const e=db.prepare('SELECT * FROM employees WHERE id=?').get(req.params.id);if(!e||!enforceUnit(req,e.business_unit_id))return res.status(404).json({error:'Employee not found'});const name=text(req.body.component_name),type=text(req.body.component_type);if(!name||!PAYROLL_COMPONENT_TYPES.includes(type))return res.status(400).json({error:'Component name and a valid component type are required.'});const currency=text(req.body.currency||'KRW').toUpperCase(),rate=currency==='KRW'?1:num(req.body.fx_rate||1),amount=num(req.body.amount);if(amount<0||rate<=0)return res.status(400).json({error:'Component amount and FX rate are invalid.'});const r=db.prepare('INSERT INTO employee_salary_components(employee_id,component_name,component_type,amount,currency,fx_rate,recurring,active,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)').run(e.id,name,type,amount,currency,rate,req.body.recurring===false||req.body.recurring==='0'?0:1,1,text(req.body.notes),req.user.id);audit(req.user,'salary_component',r.lastInsertRowid,'create',JSON.stringify({employee_id:e.id,type,name,amount,currency}));res.json({id:r.lastInsertRowid})});
  app.put('/api/payroll/components/:id',auth,requirePayroll,(req,res)=>{const c=db.prepare('SELECT c.*,e.business_unit_id FROM employee_salary_components c JOIN employees e ON e.id=c.employee_id WHERE c.id=?').get(req.params.id);if(!c||!enforceUnit(req,c.business_unit_id))return res.status(404).json({error:'Salary component not found'});const type=req.body.component_type??c.component_type,currency=text(req.body.currency??c.currency).toUpperCase(),rate=currency==='KRW'?1:num(req.body.fx_rate??c.fx_rate);if(!PAYROLL_COMPONENT_TYPES.includes(type)||rate<=0||num(req.body.amount??c.amount)<0)return res.status(400).json({error:'Component type, amount or FX rate is invalid.'});db.prepare('UPDATE employee_salary_components SET component_name=?,component_type=?,amount=?,currency=?,fx_rate=?,recurring=?,active=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(req.body.component_name??c.component_name,type,num(req.body.amount??c.amount),currency,rate,req.body.recurring===undefined?c.recurring:Number(req.body.recurring?1:0),req.body.active===undefined?c.active:Number(req.body.active?1:0),req.body.notes??c.notes,c.id);audit(req.user,'salary_component',c.id,'update',JSON.stringify({employee_id:c.employee_id,type}));res.json({ok:true})});

  app.post('/api/payroll/employees/:id/advances',auth,requirePayroll,upload.single('evidence'),(req,res)=>{const e=db.prepare('SELECT * FROM employees WHERE id=?').get(req.params.id);if(!e||!enforceUnit(req,e.business_unit_id))return res.status(404).json({error:'Employee not found'});const original=num(req.body.original_amount),currency=text(req.body.currency||'KRW').toUpperCase(),rate=currency==='KRW'?1:num(req.body.fx_rate),krw=original*rate,date=dateOnly(req.body.advance_date),reference=text(req.body.reference);if(original<=0||rate<=0||!date||!reference)return res.status(400).json({error:'Amount, date, reference and a valid FX rate are required.'});if(!req.file)return res.status(400).json({error:'Receipt / evidence is required for an employee advance.'});if(isPeriodClosed(e.business_unit_id,date))return res.status(409).json({error:'The employee advance date belongs to a closed accounting period.'});try{validatePaymentAccountForBu(req.body.payment_account_id,e.business_unit_id)}catch(x){return res.status(400).json({error:x.message})}const cash=paymentLedgerAccount({payment_method:req.body.payment_method},req.body.payment_account_id),lines=[{account_id:accountId('EMPLOYEE_ADVANCES'),business_unit_id:e.business_unit_id,debit_krw:krw,credit_krw:0,entity_type:'Employee',entity_id:e.id,memo:'Employee salary/loan advance'},{account_id:cash,business_unit_id:e.business_unit_id,debit_krw:0,credit_krw:krw,entity_type:'Employee',entity_id:e.id,memo:'Advance paid'}],jid=postJournal({businessUnitId:e.business_unit_id,transactionDate:date,sourceType:'Employee Advance',sourceId:null,sourceLabel:'Payroll → Employee Advance',description:`Advance to ${e.name}`,createdBy:req.user.id,lines});const r=db.prepare('INSERT INTO employee_advances(employee_id,business_unit_id,original_amount,currency,fx_rate,krw_amount,advance_date,payment_method,payment_account_id,reference,receipt_file,notes,outstanding_krw,journal_entry_id,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(e.id,e.business_unit_id,original,currency,rate,krw,date,text(req.body.payment_method||'Bank'),req.body.payment_account_id?Number(req.body.payment_account_id):null,reference,req.file.filename,text(req.body.notes),krw,jid,req.user.id);const advId=Number(r.lastInsertRowid);db.prepare('UPDATE accounting_journal_entries SET source_id=? WHERE id=?').run(advId,jid);db.prepare('INSERT INTO payroll_documents(employee_id,title,original_name,file_path,mime_type,size_bytes,uploaded_by) VALUES(?,?,?,?,?,?,?)').run(e.id,'Employee Advance Receipt / Evidence',req.file.originalname,'/uploads/'+req.file.filename,req.file.mimetype,req.file.size,req.user.id);audit(req.user,'employee_advance',advId,'create',JSON.stringify({employee_id:e.id,krw}));res.json({id:advId,journal_id:jid})});
  app.post('/api/payroll/advances/:id/reverse',auth,(req,res)=>{if(req.user.role!=='CEO / Owner')return res.status(403).json({error:'Only CEO / Owner can reverse an employee advance.'});const a=db.prepare('SELECT a.*,e.name employee_name FROM employee_advances a JOIN employees e ON e.id=a.employee_id WHERE a.id=?').get(req.params.id);if(!a)return res.status(404).json({error:'Employee advance not found'});if(a.status==='Reversed')return res.json({ok:true,already_reversed:true});const applied=db.prepare("SELECT COUNT(*) c FROM payroll_advance_recoveries r JOIN payroll_run_items i ON i.id=r.payroll_run_item_id WHERE r.employee_advance_id=? AND r.status='Applied'").get(a.id).c;if(applied)return res.status(409).json({error:'Reverse the related payroll run first because this advance already has payroll recoveries.'});const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Reversal reason is required.'});const j=db.prepare('SELECT * FROM accounting_journal_entries WHERE id=?').get(a.journal_entry_id);const rid=j?reverseJournal(j,'Employee advance reversed: '+reason,req.user.id):null;db.prepare("UPDATE employee_advances SET status='Reversed',outstanding_krw=0,notes=COALESCE(notes,'')||?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(' | REVERSED: '+reason,a.id);audit(req.user,'employee_advance',a.id,'reverse',JSON.stringify({reason,reversal_journal_id:rid}));res.json({ok:true,reversal_journal_id:rid})});

  app.get('/api/payroll/runs',auth,requirePayroll,(req,res)=>{const f=req.selected_business_unit_id?' AND r.business_unit_id=?':req.user.role==='CEO / Owner'?'':req.user.business_unit_id?' AND r.business_unit_id=?':' AND 1=0',args=req.selected_business_unit_id?[req.selected_business_unit_id]:req.user.role==='CEO / Owner'?[]:req.user.business_unit_id?[req.user.business_unit_id]:[];res.json(db.prepare(`SELECT r.*,b.name business_unit,u.name created_by_name,(SELECT COUNT(*) FROM payroll_run_items i WHERE i.payroll_run_id=r.id) employee_count,(SELECT COALESCE(SUM(i.gross_salary_krw),0) FROM payroll_run_items i WHERE i.payroll_run_id=r.id) gross_total,(SELECT COALESCE(SUM(i.net_salary_krw),0) FROM payroll_run_items i WHERE i.payroll_run_id=r.id) net_total,(SELECT COALESCE(SUM(i.paid_krw),0) FROM payroll_run_items i WHERE i.payroll_run_id=r.id) paid_total,(SELECT COALESCE(SUM(i.outstanding_krw),0) FROM payroll_run_items i WHERE i.payroll_run_id=r.id) outstanding_total FROM payroll_runs r LEFT JOIN business_units b ON b.id=r.business_unit_id LEFT JOIN users u ON u.id=r.created_by WHERE 1=1${f} ORDER BY r.period_end DESC,r.id DESC`).all(...args))});
  app.post('/api/payroll/runs',auth,requirePayroll,(req,res)=>{let bu;try{bu=writableBusinessUnit(req,req.body)}catch(e){return res.status(400).json({error:e.message})}const start=dateOnly(req.body.period_start),end=dateOnly(req.body.period_end);if(!start||!end||end<start)return res.status(400).json({error:'Valid payroll period start and end dates are required.'});const existing=db.prepare("SELECT id FROM payroll_runs WHERE business_unit_id=? AND period_start=? AND period_end=? AND status!='Reversed'").get(bu,start,end);if(existing)return res.status(409).json({error:'A payroll run already exists for this business unit and period.'});const emps=db.prepare("SELECT * FROM employees WHERE business_unit_id=? AND employment_status='Active' AND (join_date IS NULL OR date(join_date)<=date(?)) AND (leave_date IS NULL OR date(leave_date)>=date(?)) ORDER BY name").all(bu,end,start);if(!emps.length)return res.status(400).json({error:'No active employees are available for this business unit and payroll period.'});const tx=db.transaction(()=>{const r=db.prepare('INSERT INTO payroll_runs(payroll_no,business_unit_id,period_start,period_end,pay_date,notes,created_by) VALUES(?,?,?,?,?,?,?)').run(nextNo('PAY','payroll_runs'),bu,start,end,dateOnly(req.body.pay_date)||null,text(req.body.notes),req.user.id),runId=Number(r.lastInsertRowid),insItem=db.prepare('INSERT INTO payroll_run_items(payroll_run_id,employee_id,base_salary_krw,payslip_no) VALUES(?,?,?,?)'),insComp=db.prepare('INSERT INTO payroll_run_item_components(payroll_run_item_id,component_name,component_type,amount_krw,source_component_id,notes) VALUES(?,?,?,?,?,?)');for(const e of emps){const ir=insItem.run(runId,e.id,employeeBaseKrwForPeriod(e,start,end),`PS-${runId}-${e.id}`),itemId=Number(ir.lastInsertRowid),cs=db.prepare('SELECT * FROM employee_salary_components WHERE employee_id=? AND active=1 AND recurring=1').all(e.id);for(const c of cs)insComp.run(itemId,c.component_name,c.component_type,num(c.amount)*(text(c.currency).toUpperCase()==='KRW'?1:num(c.fx_rate)),c.id,c.notes||'');rebuildPayrollItem(itemId)}refreshPayrollRunTotals(runId);audit(req.user,'payroll_run',runId,'create',JSON.stringify({business_unit_id:bu,period_start:start,period_end:end,employees:emps.length}));return {id:runId,employees:emps.length}});res.json(tx())});
  app.get('/api/payroll/runs/:id',auth,requirePayroll,(req,res)=>{const r=db.prepare('SELECT r.*,b.name business_unit FROM payroll_runs r LEFT JOIN business_units b ON b.id=r.business_unit_id WHERE r.id=?').get(req.params.id);if(!r||!enforceUnit(req,r.business_unit_id))return res.status(404).json({error:'Payroll run not found'});refreshPayrollRunTotals(r.id);const run=db.prepare('SELECT r.*,b.name business_unit FROM payroll_runs r LEFT JOIN business_units b ON b.id=r.business_unit_id WHERE r.id=?').get(r.id),items=db.prepare(`SELECT i.*,e.employee_no,e.name,e.job_title,e.department,(SELECT COALESCE(SUM(outstanding_krw),0) FROM employee_advances a WHERE a.employee_id=e.id AND a.status='Active') advance_outstanding_krw FROM payroll_run_items i JOIN employees e ON e.id=i.employee_id WHERE i.payroll_run_id=? ORDER BY e.name`).all(r.id);for(const i of items){i.components=db.prepare('SELECT * FROM payroll_run_item_components WHERE payroll_run_item_id=? ORDER BY component_type,component_name').all(i.id);i.cost_allocations=getEmployeeAllocations(i.employee_id,run.business_unit_id)}const payments=db.prepare(`SELECT p.*,a.name payment_account,j.journal_no FROM payroll_payments p LEFT JOIN accounting_payment_accounts a ON a.id=p.payment_account_id LEFT JOIN accounting_journal_entries j ON j.id=p.journal_entry_id WHERE p.payroll_run_id=? ORDER BY p.payment_date,p.id`).all(r.id),journals=db.prepare(`SELECT x.*,j.journal_no,j.status journal_status FROM payroll_run_journals x JOIN accounting_journal_entries j ON j.id=x.journal_entry_id WHERE x.payroll_run_id=? ORDER BY x.id`).all(r.id);res.json({run,items,payments,journals})});
  app.put('/api/payroll/runs/:id/items/:itemId',auth,requirePayroll,(req,res)=>{const i=db.prepare('SELECT i.*,r.status run_status,r.business_unit_id FROM payroll_run_items i JOIN payroll_runs r ON r.id=i.payroll_run_id WHERE i.id=? AND i.payroll_run_id=?').get(req.params.itemId,req.params.id);if(!i||!enforceUnit(req,i.business_unit_id))return res.status(404).json({error:'Payroll item not found'});if(i.run_status!=='Draft')return res.status(409).json({error:'Only Draft payroll can be edited.'});const adv=num(req.body.advance_deduction_krw??i.advance_deduction_krw),available=Number(db.prepare("SELECT COALESCE(SUM(outstanding_krw),0) v FROM employee_advances WHERE employee_id=? AND status='Active'").get(i.employee_id).v||0);if(adv<0||adv>available+0.005)return res.status(400).json({error:'Advance deduction cannot exceed the employee outstanding advance balance.'});db.prepare('UPDATE payroll_run_items SET base_salary_krw=?,advance_deduction_krw=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(num(req.body.base_salary_krw??i.base_salary_krw),adv,req.body.notes??i.notes,i.id);if(Array.isArray(req.body.one_time_components)){db.prepare("DELETE FROM payroll_run_item_components WHERE payroll_run_item_id=? AND source_component_id IS NULL").run(i.id);const ins=db.prepare('INSERT INTO payroll_run_item_components(payroll_run_item_id,component_name,component_type,amount_krw,notes) VALUES(?,?,?,?,?)');for(const c of req.body.one_time_components){if(PAYROLL_COMPONENT_TYPES.includes(c.component_type)&&num(c.amount_krw)>0)ins.run(i.id,text(c.component_name)||c.component_type,c.component_type,num(c.amount_krw),text(c.notes))}}const row=rebuildPayrollItem(i.id);refreshPayrollRunTotals(req.params.id);res.json(row)});

  function consumeEmployeeAdvance(employeeId,amount,payrollRunItemId){let remaining=Math.max(0,num(amount));if(!remaining)return [];const rows=db.prepare("SELECT * FROM employee_advances WHERE employee_id=? AND status='Active' AND outstanding_krw>0 ORDER BY advance_date,id").all(employeeId),used=[],ins=db.prepare("INSERT INTO payroll_advance_recoveries(payroll_run_item_id,employee_advance_id,amount_krw,status) VALUES(?,?,?,'Applied')");for(const a of rows){if(remaining<=0.005)break;const take=Math.min(remaining,num(a.outstanding_krw));db.prepare("UPDATE employee_advances SET outstanding_krw=outstanding_krw-?,status=CASE WHEN outstanding_krw-?<=0.005 THEN 'Recovered' ELSE status END,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(take,take,a.id);ins.run(payrollRunItemId,a.id,take);used.push({id:a.id,amount:take});remaining-=take}if(remaining>0.005)throw new Error('Advance deduction exceeds the employee outstanding advance balance.');return used}
  function restorePayrollAdvanceRecoveries(payrollRunItemId){const rows=db.prepare("SELECT * FROM payroll_advance_recoveries WHERE payroll_run_item_id=? AND status='Applied' ORDER BY id").all(payrollRunItemId);for(const r of rows){db.prepare("UPDATE employee_advances SET outstanding_krw=outstanding_krw+?,status='Active',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(num(r.amount_krw),r.employee_advance_id);db.prepare("UPDATE payroll_advance_recoveries SET status='Reversed',reversed_at=CURRENT_TIMESTAMP WHERE id=?").run(r.id)}}
  function splitAmount(total,allocations){let remaining=Math.round(num(total)*100)/100;return allocations.map((a,idx)=>{const amt=idx===allocations.length-1?remaining:Math.round(num(total)*(num(a.percentage)/100)*100)/100;remaining=Math.round((remaining-amt)*100)/100;return {...a,amount_krw:amt}})}

  app.post('/api/payroll/runs/:id/approve',auth,requirePayroll,(req,res)=>{const run=db.prepare('SELECT * FROM payroll_runs WHERE id=?').get(req.params.id);if(!run||!enforceUnit(req,run.business_unit_id))return res.status(404).json({error:'Payroll run not found'});if(run.status!=='Draft')return res.status(409).json({error:'Only Draft payroll can be approved.'});const items=db.prepare('SELECT * FROM payroll_run_items WHERE payroll_run_id=?').all(run.id);if(!items.length)return res.status(400).json({error:'Payroll run has no employees.'});const itemAllocations=new Map(),grossByBu=new Map();for(const i of items){const e=db.prepare('SELECT * FROM employees WHERE id=?').get(i.employee_id),alloc=normalizeAllocations(e,getEmployeeAllocations(e.id,e.business_unit_id));itemAllocations.set(i.id,alloc);for(const x of splitAmount(i.gross_salary_krw,alloc))grossByBu.set(x.business_unit_id,(grossByBu.get(x.business_unit_id)||0)+x.amount_krw)}for(const bu of grossByBu.keys())if(isPeriodClosed(bu,run.period_end))return res.status(409).json({error:`Payroll cost allocation includes business unit ${bu} whose accounting period is closed.`});const tx=db.transaction(()=>{let gross=0,net=0,advance=0,otherDed=0;for(const i of items){gross+=num(i.gross_salary_krw);net+=num(i.net_salary_krw);advance+=num(i.advance_deduction_krw);otherDed+=num(i.deductions_krw);if(num(i.advance_deduction_krw)>0)consumeEmployeeAdvance(i.employee_id,i.advance_deduction_krw,i.id)}const primaryGross=Number(grossByBu.get(Number(run.business_unit_id))||0),otherGross=Math.max(0,gross-primaryGross),primaryLines=[];if(primaryGross>0)primaryLines.push({account_id:accountId('SALARY_EXPENSE'),business_unit_id:run.business_unit_id,debit_krw:primaryGross,credit_krw:0,memo:`Payroll salary cost ${run.period_start} to ${run.period_end}`});if(otherGross>0)primaryLines.push({account_id:accountId('INTER_BU_RECEIVABLE'),business_unit_id:run.business_unit_id,debit_krw:otherGross,credit_krw:0,memo:'Payroll cost recoverable from other business units'});primaryLines.push({account_id:accountId('SALARY_PAYABLE'),business_unit_id:run.business_unit_id,debit_krw:0,credit_krw:net,memo:'Net salary payable'});if(advance>0)primaryLines.push({account_id:accountId('EMPLOYEE_ADVANCES'),business_unit_id:run.business_unit_id,debit_krw:0,credit_krw:advance,memo:'Employee advances recovered through payroll'});if(otherDed>0)primaryLines.push({account_id:accountId('PAYROLL_DEDUCTIONS_PAYABLE'),business_unit_id:run.business_unit_id,debit_krw:0,credit_krw:otherDed,memo:'Other payroll deductions payable'});const primaryJid=postJournal({businessUnitId:run.business_unit_id,transactionDate:run.period_end,sourceType:'Payroll Accrual',sourceId:run.id,sourceLabel:'Payroll → Salary Accrual',description:`Payroll ${run.payroll_no}`,createdBy:req.user.id,lines:primaryLines});const link=db.prepare("INSERT INTO payroll_run_journals(payroll_run_id,journal_entry_id,journal_type,business_unit_id,status) VALUES(?,?,?,?,'Active')");link.run(run.id,primaryJid,'Accrual',run.business_unit_id);const journalIds=[primaryJid];for(const [bu,amt0] of grossByBu){const amt=Math.round(num(amt0)*100)/100;if(Number(bu)===Number(run.business_unit_id)||amt<=0)continue;const jid=postJournal({businessUnitId:bu,transactionDate:run.period_end,sourceType:'Payroll Cost Allocation',sourceId:run.id,sourceLabel:'Payroll → BU Cost Allocation',description:`Allocated payroll cost from ${run.payroll_no}`,createdBy:req.user.id,lines:[{account_id:accountId('SALARY_EXPENSE'),business_unit_id:bu,debit_krw:amt,credit_krw:0,memo:'Allocated employee salary cost'},{account_id:accountId('INTER_BU_PAYABLE'),business_unit_id:bu,debit_krw:0,credit_krw:amt,memo:`Payroll cost payable to business unit ${run.business_unit_id}`} ]});link.run(run.id,jid,'Allocation',bu);journalIds.push(jid)}db.prepare("UPDATE payroll_runs SET status='Approved',approval_journal_id=?,total_paid_krw=0,outstanding_krw=?,approved_by=?,approved_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(primaryJid,net,req.user.id,run.id);db.prepare("UPDATE payroll_run_items SET status='Approved',paid_krw=0,outstanding_krw=net_salary_krw,updated_at=CURRENT_TIMESTAMP WHERE payroll_run_id=?").run(run.id);audit(req.user,'payroll_run',run.id,'approve',JSON.stringify({gross,net,advance,deductions:otherDed,journal_ids:journalIds,allocated_business_units:[...grossByBu.entries()]}));return {journal_id:primaryJid,journal_ids:journalIds,gross,net}});try{res.json(tx())}catch(x){res.status(409).json({error:x.message})}});

  app.post('/api/payroll/runs/:id/pay',auth,requirePayroll,upload.single('evidence'),(req,res)=>{const run=db.prepare('SELECT * FROM payroll_runs WHERE id=?').get(req.params.id);if(!run||!enforceUnit(req,run.business_unit_id))return res.status(404).json({error:'Payroll run not found'});if(!['Approved','Partially Paid'].includes(run.status))return res.status(409).json({error:'Payroll must be Approved or Partially Paid before another payment.'});const reference=text(req.body.reference),payDate=dateOnly(req.body.pay_date||run.pay_date||nowDate());if(!reference)return res.status(400).json({error:'Salary payment reference is required.'});if(!req.file)return res.status(400).json({error:'Salary payment evidence is required.'});if(isPeriodClosed(run.business_unit_id,payDate))return res.status(409).json({error:'The salary payment date belongs to a closed period.'});try{validatePaymentAccountForBu(req.body.payment_account_id,run.business_unit_id)}catch(x){return res.status(400).json({error:x.message})}const items=db.prepare('SELECT * FROM payroll_run_items WHERE payroll_run_id=? AND outstanding_krw>0.005 ORDER BY id').all(run.id),totalOutstanding=items.reduce((n,x)=>n+num(x.outstanding_krw),0),amount=req.body.amount_krw==null||text(req.body.amount_krw)===''?totalOutstanding:num(req.body.amount_krw);if(amount<=0||amount>totalOutstanding+0.005)return res.status(400).json({error:`Payment amount must be greater than zero and cannot exceed outstanding payroll ${totalOutstanding.toFixed(2)} KRW.`});const cash=paymentLedgerAccount({payment_method:req.body.payment_method||run.payment_method},req.body.payment_account_id||run.payment_account_id),lines=[{account_id:accountId('SALARY_PAYABLE'),business_unit_id:run.business_unit_id,debit_krw:amount,credit_krw:0,memo:'Salary payable settled'},{account_id:cash,business_unit_id:run.business_unit_id,debit_krw:0,credit_krw:amount,memo:'Payroll paid'}];const tx=db.transaction(()=>{const jid=postJournal({businessUnitId:run.business_unit_id,transactionDate:payDate,sourceType:'Payroll Payment',sourceId:run.id,sourceLabel:'Payroll → Salary Payment',description:`Pay ${run.payroll_no} · ${reference}`,createdBy:req.user.id,lines}),pr=db.prepare("INSERT INTO payroll_payments(payroll_run_id,amount_krw,payment_date,payment_method,payment_account_id,reference,evidence_file,journal_entry_id,status,created_by) VALUES(?,?,?,?,?,?,?,?,'Active',?)").run(run.id,amount,payDate,text(req.body.payment_method||'Bank'),req.body.payment_account_id?Number(req.body.payment_account_id):null,reference,req.file.filename,jid,req.user.id),paymentId=Number(pr.lastInsertRowid);db.prepare("INSERT INTO payroll_run_journals(payroll_run_id,journal_entry_id,journal_type,business_unit_id,status) VALUES(?,?,?,?,'Active')").run(run.id,jid,'Payment',run.business_unit_id);let remaining=Math.round(amount*100)/100;const allocIns=db.prepare("INSERT INTO payroll_payment_allocations(payroll_payment_id,payroll_run_item_id,amount_krw,status) VALUES(?,?,?,'Active')");for(let idx=0;idx<items.length;idx++){const i=items[idx],take=idx===items.length-1?remaining:Math.min(num(i.outstanding_krw),Math.round(amount*(num(i.outstanding_krw)/totalOutstanding)*100)/100),actual=Math.min(num(i.outstanding_krw),Math.max(0,take));if(actual<=0)continue;remaining=Math.round((remaining-actual)*100)/100;allocIns.run(paymentId,i.id,actual);db.prepare("UPDATE payroll_run_items SET paid_krw=paid_krw+?,outstanding_krw=MAX(0,outstanding_krw-?),status=CASE WHEN outstanding_krw-?<=0.005 THEN 'Paid' ELSE 'Partially Paid' END,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(actual,actual,actual,i.id)}if(remaining>0.005){const last=db.prepare('SELECT * FROM payroll_run_items WHERE payroll_run_id=? AND outstanding_krw>0.005 ORDER BY id DESC LIMIT 1').get(run.id);if(last){allocIns.run(paymentId,last.id,remaining);db.prepare("UPDATE payroll_run_items SET paid_krw=paid_krw+?,outstanding_krw=MAX(0,outstanding_krw-?),status=CASE WHEN outstanding_krw-?<=0.005 THEN 'Paid' ELSE 'Partially Paid' END,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(remaining,remaining,remaining,last.id);remaining=0}}const totals=refreshPayrollRunTotals(run.id);db.prepare("UPDATE payroll_runs SET pay_date=?,payment_journal_id=?,payment_method=?,payment_account_id=?,payment_reference=?,payment_evidence_file=?,paid_by=?,paid_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(payDate,jid,text(req.body.payment_method||'Bank'),req.body.payment_account_id?Number(req.body.payment_account_id):null,reference,req.file.filename,req.user.id,run.id);db.prepare('INSERT INTO payroll_documents(payroll_run_id,title,original_name,file_path,mime_type,size_bytes,uploaded_by) VALUES(?,?,?,?,?,?,?)').run(run.id,'Payroll Payment Evidence',req.file.originalname,'/uploads/'+req.file.filename,req.file.mimetype,req.file.size,req.user.id);audit(req.user,'payroll_run',run.id,'pay',JSON.stringify({amount,journal_id:jid,payment_id:paymentId,reference,status:totals.status}));return {ok:true,journal_id:jid,payment_id:paymentId,amount_paid:amount,status:totals.status,outstanding_krw:totals.outstanding}});res.json(tx())});

  app.post('/api/payroll/runs/:id/reverse',auth,(req,res)=>{if(req.user.role!=='CEO / Owner')return res.status(403).json({error:'Only CEO / Owner can reverse an approved or paid payroll run.'});const run=db.prepare('SELECT * FROM payroll_runs WHERE id=?').get(req.params.id);if(!run)return res.status(404).json({error:'Payroll run not found'});if(!['Approved','Partially Paid','Paid'].includes(run.status))return res.status(409).json({error:'Only Approved, Partially Paid or Paid payroll can be reversed.'});const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Reversal reason is required.'});const links=db.prepare("SELECT x.*,j.business_unit_id,j.status journal_status FROM payroll_run_journals x JOIN accounting_journal_entries j ON j.id=x.journal_entry_id WHERE x.payroll_run_id=? AND x.status='Active' ORDER BY CASE WHEN x.journal_type='Payment' THEN 0 ELSE 1 END,x.id DESC").all(run.id);for(const x of links)if(x.business_unit_id&&isPeriodClosed(x.business_unit_id,nowDate()))return res.status(409).json({error:'The current accounting period is closed for one of the payroll business units. Reopen it before reversal.'});const tx=db.transaction(()=>{const reversalIds=[];for(const x of links){const j=db.prepare('SELECT * FROM accounting_journal_entries WHERE id=?').get(x.journal_entry_id);if(j&&j.status==='Posted'){const rid=reverseJournal(j,'Payroll reversed: '+reason,req.user.id);if(rid)reversalIds.push(rid)}db.prepare("UPDATE payroll_run_journals SET status='Reversed' WHERE id=?").run(x.id)}db.prepare("UPDATE payroll_payments SET status='Reversed',reversed_by=?,reversed_at=CURRENT_TIMESTAMP,reversal_reason=? WHERE payroll_run_id=? AND status='Active'").run(req.user.id,reason,run.id);db.prepare("UPDATE payroll_payment_allocations SET status='Reversed' WHERE payroll_payment_id IN (SELECT id FROM payroll_payments WHERE payroll_run_id=?)").run(run.id);const items=db.prepare('SELECT * FROM payroll_run_items WHERE payroll_run_id=?').all(run.id);for(const i of items)restorePayrollAdvanceRecoveries(i.id);db.prepare("UPDATE payroll_runs SET status='Reversed',total_paid_krw=0,outstanding_krw=0,reversed_by=?,reversed_at=CURRENT_TIMESTAMP,reversal_reason=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(req.user.id,reason,run.id);db.prepare("UPDATE payroll_run_items SET status='Reversed',updated_at=CURRENT_TIMESTAMP WHERE payroll_run_id=?").run(run.id);audit(req.user,'payroll_run',run.id,'reverse',JSON.stringify({reason,reversal_journal_ids:reversalIds}));return {ok:true,reversal_journal_ids:reversalIds}});res.json(tx())});

  // Compact bilingual PDF generator for salary slips.
  const KO={
    'Salary Slip':'급여 명세서','Employee':'직원','Employee No.':'직원 번호','Business Unit':'사업부','Role / Position':'직책','Payroll Period':'급여 기간','Payment Date':'지급일','Base Salary':'기본급','Allowances / Additions':'수당 / 추가 지급','Gross Salary':'총 급여','Deductions':'공제','Advance Deduction':'선급금 공제','Net Salary':'실수령액','Paid Amount':'지급액','Outstanding':'미지급액','Payment Status':'지급 상태','Payment Reference':'결제 참조','Generated':'생성일','Paid':'지급 완료','Partially Paid':'부분 지급','Approved':'승인됨','Draft':'초안','Reversed':'취소됨'
  };
  function pdfTr(v,lang){const s=String(v??'');return lang==='ko'?(KO[s]||s):s}
  function pdfEsc(s){return String(s??'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' ')}
  function unicodeHex(s){const le=Buffer.from('\uFEFF'+String(s??''),'utf16le');for(let i=0;i<le.length;i+=2){const x=le[i];le[i]=le[i+1];le[i+1]=x}return '<'+le.toString('hex').toUpperCase()+'>'}
  function pdfToken(v,lang){const s=pdfTr(v,lang);return /[^\x20-\x7e]/.test(s)?unicodeHex(s):`(${pdfEsc(s)})`}
  function payslipPdf(data,lang='ko'){
    const W=612,H=792,lines=['BT','0.10 0.14 0.22 rg'];let y=744;
    const txt=(x,val,size=9,bold=false)=>{const s=pdfTr(val,lang),uni=/[^\x20-\x7e]/.test(s),font=uni?(bold?'F4':'F3'):(bold?'F2':'F1');lines.push(`/${font} ${size} Tf`,`1 0 0 1 ${x} ${y} Tm ${pdfToken(val,lang)} Tj`)};
    const row=(label,value)=>{txt(40,label,8,true);txt(205,String(value??''),8,false);y-=15};
    txt(40,'BLUE OCEAN MARKET',16,true);y-=23;txt(40,'Salary Slip',13,true);y-=25;
    row('Employee',data.employee.name);row('Employee No.',data.employee.employee_no);row('Business Unit',data.employee.business_unit||'');row('Role / Position',data.employee.job_title||'');row('Payroll Period',`${data.run.period_start} - ${data.run.period_end}`);row('Payment Date',data.run.pay_date||'—');
    y-=10;row('Base Salary','KRW '+money(data.item.base_salary_krw));row('Allowances / Additions','KRW '+money(data.item.allowances_krw));row('Gross Salary','KRW '+money(data.item.gross_salary_krw));row('Deductions','KRW '+money(data.item.deductions_krw));row('Advance Deduction','KRW '+money(data.item.advance_deduction_krw));
    y-=5;txt(40,'Net Salary',10,true);txt(205,'KRW '+money(data.item.net_salary_krw),10,true);y-=20;
    row('Paid Amount','KRW '+money(data.item.paid_krw));row('Outstanding','KRW '+money(data.item.outstanding_krw));row('Payment Status',data.item.status||data.run.status);row('Payment Reference',data.run.payment_reference||'—');row('Generated',new Date().toISOString().slice(0,16).replace('T',' '));
    lines.push('ET');const stream=lines.join('\n'),objects=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>','<< /Type /Font /Subtype /Type0 /BaseFont /HYSMyeongJo-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [7 0 R] >>','<< /Type /Font /Subtype /Type0 /BaseFont /HYGoThic-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [8 0 R] >>','<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYSMyeongJo-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> >>','<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYGoThic-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> >>'];const contentId=objects.length+1;objects.push(`<< /Length ${Buffer.byteLength(stream,'utf8')} >>\nstream\n${stream}\nendstream`);const pageId=objects.length+1;objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents ${contentId} 0 R >>`);objects[1]=`<< /Type /Pages /Count 1 /Kids [${pageId} 0 R] >>`;let out='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n',offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(out,'binary'));out+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`}const xref=Buffer.byteLength(out,'binary');out+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let i=1;i<offsets.length;i++)out+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';out+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return Buffer.from(out,'binary')
  }
  app.get('/api/payroll/runs/:runId/items/:itemId/payslip.pdf',auth,requirePayroll,(req,res)=>{
    const row=db.prepare(`SELECT i.*,r.payroll_no,r.business_unit_id,r.period_start,r.period_end,r.pay_date,r.status run_status,e.employee_no,e.name,e.job_title,b.name business_unit FROM payroll_run_items i JOIN payroll_runs r ON r.id=i.payroll_run_id JOIN employees e ON e.id=i.employee_id LEFT JOIN business_units b ON b.id=e.business_unit_id WHERE i.id=? AND i.payroll_run_id=?`).get(req.params.itemId,req.params.runId);
    if(!row||!enforceUnit(req,row.business_unit_id))return res.status(404).json({error:'Payslip not found'});
    const refs=db.prepare(`SELECT reference FROM payroll_payments p JOIN payroll_payment_allocations a ON a.payroll_payment_id=p.id WHERE p.payroll_run_id=? AND a.payroll_run_item_id=? AND p.status='Active' AND a.status='Active' ORDER BY p.payment_date,p.id`).all(req.params.runId,req.params.itemId).map(x=>x.reference).filter(Boolean);
    const lang=text(req.query.lang||req.headers['x-language']||'ko').toLowerCase()==='en'?'en':'ko';
    const buf=payslipPdf({employee:{employee_no:row.employee_no,name:row.name,job_title:row.job_title,business_unit:row.business_unit},run:{period_start:row.period_start,period_end:row.period_end,pay_date:row.pay_date,status:row.run_status,payment_reference:refs.join(', ')},item:row},lang);
    res.set('Content-Type','application/pdf');res.set('Content-Disposition',`attachment; filename="Payslip_${row.employee_no}_${row.period_end}.pdf"`);res.set('Cache-Control','no-store');res.send(buf)
  });

  app.get('/api/payroll/summary',auth,requirePayroll,(req,res)=>{const f=employeeScope(req,'e'),employees=Number(db.prepare(`SELECT COUNT(*) c FROM employees e WHERE e.employment_status='Active'${f.sql}`).get(...f.args).c||0),salary=Number(db.prepare(`SELECT COALESCE(SUM(e.base_salary*CASE WHEN e.salary_currency='KRW' THEN 1 ELSE e.salary_fx_rate END),0) v FROM employees e WHERE e.employment_status='Active'${f.sql}`).get(...f.args).v||0),advances=Number(db.prepare(`SELECT COALESCE(SUM(a.outstanding_krw),0) v FROM employee_advances a JOIN employees e ON e.id=a.employee_id WHERE a.status='Active'${f.sql}`).get(...f.args).v||0),pending=Number(db.prepare(`SELECT COUNT(*) c FROM payroll_runs r WHERE r.status IN ('Draft','Approved','Partially Paid')${req.selected_business_unit_id?' AND r.business_unit_id=?':req.user.role==='CEO / Owner'?'':req.user.business_unit_id?' AND r.business_unit_id=?':' AND 1=0'}`).get(...(req.selected_business_unit_id?[req.selected_business_unit_id]:req.user.role==='CEO / Owner'?[]:req.user.business_unit_id?[req.user.business_unit_id]:[])).c||0);res.json({employees,monthly_base_salary_krw:salary,employee_advances_outstanding_krw:advances,pending_runs:pending})});

  // Lightweight integrity endpoint for the financial core.
  app.get('/api/accounting/integrity',auth,allow('finance','dashboard'),(req,res)=>{processQueue(5000);const f=unitFilter(req,'j'),unbalanced=db.prepare(`SELECT COUNT(*) c FROM (SELECT j.id,ROUND(SUM(l.debit_krw-l.credit_krw),2) diff FROM accounting_journal_entries j JOIN accounting_journal_lines l ON l.journal_entry_id=j.id WHERE j.status='Posted'${f.sql} GROUP BY j.id HAVING ABS(diff)>0.01)`).get(...f.args).c,financeUnposted=req.selected_business_unit_id?db.prepare("SELECT COUNT(*) c FROM finance_entries WHERE status!='Voided' AND accounting_status!='Posted' AND business_unit_id=?").get(req.selected_business_unit_id).c:req.user.role==='CEO / Owner'?db.prepare("SELECT COUNT(*) c FROM finance_entries WHERE status!='Voided' AND accounting_status!='Posted'").get().c:db.prepare("SELECT COUNT(*) c FROM finance_entries WHERE status!='Voided' AND accounting_status!='Posted' AND business_unit_id=?").get(req.user.business_unit_id).c,suspense=db.prepare(`SELECT ROUND(COALESCE(SUM(ABS(l.debit_krw-l.credit_krw)),0),2) v FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id JOIN accounting_accounts a ON a.id=l.account_id WHERE j.status='Posted' AND a.subtype='Suspense'${f.sql}`).get(...f.args).v,exceptions=req.selected_business_unit_id?db.prepare("SELECT COUNT(*) c FROM accounting_exceptions WHERE status='Open' AND business_unit_id=?").get(req.selected_business_unit_id).c:req.user.role==='CEO / Owner'?db.prepare("SELECT COUNT(*) c FROM accounting_exceptions WHERE status='Open'").get().c:db.prepare("SELECT COUNT(*) c FROM accounting_exceptions WHERE status='Open' AND business_unit_id=?").get(req.user.business_unit_id).c;res.json({ok:!Number(unbalanced)&&!Number(financeUnposted)&&!Number(exceptions),unbalanced_journals:Number(unbalanced||0),finance_not_posted:Number(financeUnposted||0),open_exceptions:Number(exceptions||0),suspense_activity_krw:Number(suspense||0),sync_queue:Number(db.prepare('SELECT COUNT(*) c FROM accounting_sync_queue').get().c||0)})});

  return {version:VERSION,processQueue,syncFinanceEntry,postJournal,reverseJournal,accountId,isPeriodClosed};
}

module.exports={install,VERSION};
