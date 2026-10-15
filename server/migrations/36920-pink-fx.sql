-- Additive migration. Historical operational/Finance/GL rows are never rewritten.
CREATE TABLE IF NOT EXISTS pink_fx_requests(
 id INTEGER PRIMARY KEY, business_unit_id INTEGER NOT NULL REFERENCES business_units(id),
 created_by INTEGER NOT NULL REFERENCES users(id), idempotency_key TEXT NOT NULL,
 payload_hash TEXT NOT NULL, payload_json TEXT NOT NULL, receipt_file TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Pending Approval','Recorded','Reversed')),
 approval_id INTEGER REFERENCES approvals(id), transaction_id INTEGER,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(business_unit_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS pink_fx_transactions(
 id INTEGER PRIMARY KEY, request_id INTEGER NOT NULL UNIQUE REFERENCES pink_fx_requests(id),
 business_unit_id INTEGER NOT NULL REFERENCES business_units(id), workflow TEXT NOT NULL,
 record_id INTEGER NOT NULL, counterparty_type TEXT NOT NULL, counterparty_id INTEGER NOT NULL,
 invoice_currency TEXT NOT NULL, invoice_amount REAL NOT NULL CHECK(invoice_amount>=0),
 invoice_carrying_rate REAL NOT NULL CHECK(invoice_carrying_rate>0), allocation_krw REAL NOT NULL CHECK(allocation_krw>=0),
 advance_krw REAL NOT NULL DEFAULT 0 CHECK(advance_krw>=0),
 company_account_id INTEGER REFERENCES accounting_payment_accounts(id), company_currency TEXT,
 company_amount REAL NOT NULL DEFAULT 0 CHECK(company_amount>=0), direction TEXT NOT NULL CHECK(direction IN ('In','Out','NonCash')),
 company_rate_to_krw REAL NOT NULL DEFAULT 1 CHECK(company_rate_to_krw>0), bank_krw REAL NOT NULL DEFAULT 0,
 transfer_currency TEXT, transfer_amount REAL NOT NULL DEFAULT 0, recipient_expected REAL NOT NULL DEFAULT 0,
 recipient_confirmed REAL, receiver_account_id INTEGER REFERENCES counterparty_payment_accounts(id),
 bank_rate REAL NOT NULL DEFAULT 1 CHECK(bank_rate>0), rate_pair TEXT NOT NULL DEFAULT '',
 quote_reference TEXT NOT NULL DEFAULT '', quote_source TEXT NOT NULL DEFAULT '', quote_time TEXT NOT NULL DEFAULT '',
 fee_policy TEXT NOT NULL DEFAULT 'added_to_debit', source_fee REAL NOT NULL DEFAULT 0 CHECK(source_fee>=0),
 transfer_fee REAL NOT NULL DEFAULT 0 CHECK(transfer_fee>=0), fee_krw REAL NOT NULL DEFAULT 0,
 fx_difference_krw REAL NOT NULL DEFAULT 0,
 payment_date TEXT NOT NULL, reference TEXT NOT NULL DEFAULT '', receipt_file TEXT NOT NULL DEFAULT '',
 confirmation_status TEXT NOT NULL CHECK(confirmation_status IN ('Confirmed','Reconciled','NonCash')),
 status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','Reversed')),
 finance_entry_id INTEGER UNIQUE REFERENCES finance_entries(id), projection_table TEXT, projection_id INTEGER,
 proposal_json TEXT NOT NULL DEFAULT '[]', approval_id INTEGER REFERENCES approvals(id),
 correction_of_id INTEGER REFERENCES pink_fx_transactions(id), reversal_reason TEXT NOT NULL DEFAULT '',
 created_by INTEGER NOT NULL REFERENCES users(id), reversed_by INTEGER REFERENCES users(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, reversed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_pink_fx_record ON pink_fx_transactions(business_unit_id,workflow,record_id,status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pink_fx_reference ON pink_fx_transactions(company_account_id,lower(trim(reference))) WHERE reference!='' AND status='Active';
CREATE TABLE IF NOT EXISTS pink_fx_legs(
 id INTEGER PRIMARY KEY,transaction_id INTEGER NOT NULL REFERENCES pink_fx_transactions(id),
 leg_type TEXT NOT NULL, currency TEXT NOT NULL,amount REAL NOT NULL CHECK(amount>=0),
 account_id INTEGER REFERENCES accounting_payment_accounts(id),finance_entry_id INTEGER REFERENCES finance_entries(id),
 UNIQUE(transaction_id,leg_type)
);
CREATE TABLE IF NOT EXISTS pink_fx_history(
 id INTEGER PRIMARY KEY,transaction_id INTEGER REFERENCES pink_fx_transactions(id),request_id INTEGER REFERENCES pink_fx_requests(id),
 user_id INTEGER NOT NULL REFERENCES users(id),action TEXT NOT NULL,reason TEXT NOT NULL DEFAULT '',
 snapshot_json TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS pink_fx_policies(
 business_unit_id INTEGER PRIMARY KEY REFERENCES business_units(id),approved INTEGER NOT NULL DEFAULT 0,
 basis TEXT NOT NULL DEFAULT 'Invoice carrying value; explicit bank KRW carrying value; realized FX difference; expense evidenced bank fees',
 decision_note TEXT NOT NULL DEFAULT '',approved_by INTEGER REFERENCES users(id),approved_at TEXT
);
CREATE TABLE IF NOT EXISTS pink_fx_customer_refund_allocations(
 transaction_id INTEGER NOT NULL REFERENCES pink_fx_transactions(id),receipt_id INTEGER NOT NULL REFERENCES pink_salt_customer_receipts(id),
 amount_krw REAL NOT NULL CHECK(amount_krw>0),status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','Reversed')),
 PRIMARY KEY(transaction_id,receipt_id)
);
CREATE TABLE IF NOT EXISTS pink_fx_customer_allocations(
 id INTEGER PRIMARY KEY,transaction_id INTEGER NOT NULL REFERENCES pink_fx_transactions(id),
 receipt_id INTEGER NOT NULL REFERENCES pink_salt_customer_receipts(id),order_id INTEGER NOT NULL REFERENCES pink_salt_orders(id),
 amount_krw REAL NOT NULL CHECK(amount_krw>0),journal_entry_id INTEGER,
 status TEXT NOT NULL DEFAULT 'Active',created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 reversal_reason TEXT NOT NULL DEFAULT '',reversed_by INTEGER,reversed_at TEXT,
 UNIQUE(transaction_id,receipt_id)
);
-- Read compatibility view preserves original writes/constraints while exposing new
-- immutable allocation records to every legacy balance/report query.
CREATE VIEW IF NOT EXISTS pink_salt_customer_receipt_allocations_all AS
 SELECT id,receipt_id,order_id,amount_krw,status,created_by,created_at,reversed_by,reversed_at,reversal_reason,journal_entry_id FROM pink_salt_customer_receipt_allocations
 UNION ALL
 SELECT -id,receipt_id,order_id,amount_krw,status,created_by,created_at,reversed_by,reversed_at,reversal_reason,journal_entry_id FROM pink_fx_customer_allocations;
CREATE TABLE IF NOT EXISTS pink_fx_fee_debits(
 id INTEGER PRIMARY KEY,transaction_id INTEGER NOT NULL UNIQUE REFERENCES pink_fx_transactions(id),
 payment_account_id INTEGER NOT NULL REFERENCES accounting_payment_accounts(id),currency TEXT NOT NULL,
 original_amount REAL NOT NULL CHECK(original_amount>0),rate_to_krw REAL NOT NULL CHECK(rate_to_krw>0),
 amount_krw REAL NOT NULL CHECK(amount_krw>0),reference TEXT NOT NULL,finance_entry_id INTEGER UNIQUE REFERENCES finance_entries(id),
 proposal_json TEXT NOT NULL,payment_date TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Active',created_by INTEGER NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
