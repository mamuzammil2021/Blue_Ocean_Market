-- Additive structures only. Existing balances, journals and accounts are preserved.
CREATE TABLE IF NOT EXISTS pink_salt_cost_payees(id INTEGER PRIMARY KEY AUTOINCREMENT,business_unit_id INTEGER NOT NULL REFERENCES business_units(id),name TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,created_by INTEGER REFERENCES users(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_ps_cost_payees_bu ON pink_salt_cost_payees(business_unit_id,active);
CREATE TABLE IF NOT EXISTS pink_fx_notification_events(transaction_id INTEGER NOT NULL REFERENCES pink_fx_transactions(id),event TEXT NOT NULL,user_id INTEGER NOT NULL REFERENCES users(id),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(transaction_id,event,user_id));
CREATE INDEX IF NOT EXISTS idx_ps_statement_import_payment ON pink_salt_import_payments(import_id,status,payment_date);
CREATE INDEX IF NOT EXISTS idx_ps_statement_advance ON pink_salt_supplier_advances(supplier_id,status,advance_date);
