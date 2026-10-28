SET LOCAL search_path TO bom,pg_catalog;
-- The legacy supplier-machine bulk-import route writes an update timestamp,
-- but that column was absent from the initialized SQLite baseline.
ALTER TABLE bom.excavator_supplier_machines ADD COLUMN updated_at TEXT;
