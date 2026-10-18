-- Reuses pink_salt_packaging_items, packaging_movements, supplier advances,
-- products/BOM, Finance and Accounting. No replacement supplier or cash ledger.
CREATE TABLE IF NOT EXISTS pink_pack_material_suppliers(
 id INTEGER PRIMARY KEY, material_id INTEGER NOT NULL REFERENCES pink_salt_packaging_items(id),supplier_id INTEGER NOT NULL REFERENCES pink_salt_suppliers(id),supplier_code TEXT DEFAULT '',preferred INTEGER DEFAULT 0,quoted_price REAL DEFAULT 0,currency TEXT DEFAULT 'KRW',purchase_unit TEXT DEFAULT 'pcs',conversion REAL NOT NULL DEFAULT 1,lead_days INTEGER DEFAULT 0,effective_date TEXT,UNIQUE(material_id,supplier_id));
CREATE TABLE IF NOT EXISTS pink_pack_purchases(
 id INTEGER PRIMARY KEY,business_unit_id INTEGER NOT NULL REFERENCES business_units(id),purchase_no TEXT NOT NULL UNIQUE,purchase_date TEXT NOT NULL,supplier_id INTEGER NOT NULL REFERENCES pink_salt_suppliers(id),supplier_snapshot TEXT NOT NULL,currency TEXT NOT NULL DEFAULT 'KRW',recognition_rate REAL NOT NULL DEFAULT 1,invoice_reference TEXT DEFAULT '',expected_date TEXT,destination TEXT DEFAULT '',payment_terms TEXT DEFAULT '',notes TEXT DEFAULT '',status TEXT NOT NULL DEFAULT 'Draft',revision INTEGER NOT NULL DEFAULT 1,approval_id INTEGER REFERENCES approvals(id),invoice_date TEXT,invoice_journal_id INTEGER REFERENCES accounting_journal_entries(id),subtotal REAL NOT NULL DEFAULT 0,tax_total REAL NOT NULL DEFAULT 0,total_amount REAL NOT NULL DEFAULT 0,total_krw REAL NOT NULL DEFAULT 0,inventory_krw REAL NOT NULL DEFAULT 0,costs_json TEXT NOT NULL DEFAULT '[]',created_by INTEGER REFERENCES users(id),created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_pack_purchases_bu ON pink_pack_purchases(business_unit_id,status,id);
CREATE INDEX IF NOT EXISTS idx_pack_purchases_supplier ON pink_pack_purchases(supplier_id,id);
CREATE TABLE IF NOT EXISTS pink_pack_purchase_lines(
 id INTEGER PRIMARY KEY,purchase_id INTEGER NOT NULL REFERENCES pink_pack_purchases(id),material_id INTEGER NOT NULL REFERENCES pink_salt_packaging_items(id),snapshot_json TEXT NOT NULL,quantity REAL NOT NULL,purchase_unit TEXT NOT NULL,conversion REAL NOT NULL,base_quantity REAL NOT NULL,unit_price REAL NOT NULL,discount REAL NOT NULL DEFAULT 0,tax_percent REAL NOT NULL DEFAULT 0,tax_treatment TEXT NOT NULL DEFAULT 'capitalizable',net_amount REAL NOT NULL,tax_amount REAL NOT NULL,total_amount REAL NOT NULL,inventory_krw REAL NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS idx_pack_lines_purchase ON pink_pack_purchase_lines(purchase_id,id);
CREATE TABLE IF NOT EXISTS pink_pack_receipts(
 id INTEGER PRIMARY KEY,business_unit_id INTEGER NOT NULL REFERENCES business_units(id),purchase_id INTEGER NOT NULL REFERENCES pink_pack_purchases(id),receipt_no TEXT NOT NULL UNIQUE,receipt_date TEXT NOT NULL,location_id INTEGER NOT NULL REFERENCES pink_salt_storage_locations(id),delivery_reference TEXT DEFAULT '',notes TEXT DEFAULT '',receipt_file TEXT DEFAULT '',created_by INTEGER NOT NULL REFERENCES users(id),created_at TEXT DEFAULT CURRENT_TIMESTAMP,journal_id INTEGER REFERENCES accounting_journal_entries(id));
CREATE TABLE IF NOT EXISTS pink_pack_receipt_lines(
 id INTEGER PRIMARY KEY,receipt_id INTEGER NOT NULL REFERENCES pink_pack_receipts(id),purchase_line_id INTEGER NOT NULL REFERENCES pink_pack_purchase_lines(id),received REAL NOT NULL,accepted REAL NOT NULL,rejected REAL NOT NULL,returned REAL NOT NULL DEFAULT 0,movement_id INTEGER REFERENCES pink_salt_packaging_movements(id),UNIQUE(receipt_id,purchase_line_id));
CREATE INDEX IF NOT EXISTS idx_pack_receipt_purchase ON pink_pack_receipts(purchase_id,id);
CREATE TABLE IF NOT EXISTS pink_pack_history(
 id INTEGER PRIMARY KEY,business_unit_id INTEGER NOT NULL,entity_type TEXT NOT NULL,entity_id INTEGER NOT NULL,action TEXT NOT NULL,before_json TEXT NOT NULL DEFAULT '{}',after_json TEXT NOT NULL DEFAULT '{}',user_id INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_pack_history_entity ON pink_pack_history(entity_type,entity_id,id);
CREATE TABLE IF NOT EXISTS pink_pack_operations(
 business_unit_id INTEGER NOT NULL,operation_key TEXT NOT NULL,payload_hash TEXT NOT NULL,result_json TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(business_unit_id,operation_key));
CREATE TABLE IF NOT EXISTS pink_pack_actions(
 id INTEGER PRIMARY KEY,business_unit_id INTEGER NOT NULL,purchase_id INTEGER,kind TEXT NOT NULL,body_json TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Pending',created_by INTEGER NOT NULL,approval_id INTEGER,result_json TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS pink_pack_bom_revisions(
 id INTEGER PRIMARY KEY,product_id INTEGER NOT NULL REFERENCES pink_salt_products(id),revision INTEGER NOT NULL,bom_json TEXT NOT NULL,reason TEXT NOT NULL,created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(product_id,revision));
CREATE TABLE IF NOT EXISTS pink_pack_migration_audit(
 migration_key TEXT PRIMARY KEY,before_json TEXT NOT NULL,after_json TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
