-- Schema reference for the idempotent startup runner server/pink-qa21.js.
-- Run application startup, not this reference directly against a live database.
-- The runner adds only absent columns, retaining all historical rows:
-- pink_salt_orders: submission_key TEXT, submission_hash TEXT.
-- pink_salt_production_batches: archived INTEGER NOT NULL DEFAULT 0,
-- void_reason TEXT DEFAULT '', voided_by INTEGER, voided_at TEXT,
-- replaces_batch_id INTEGER REFERENCES pink_salt_production_batches(id).
CREATE TABLE IF NOT EXISTS pink_qa21_actions(
 id INTEGER PRIMARY KEY,entity_type TEXT NOT NULL,entity_id INTEGER NOT NULL,
 action TEXT NOT NULL,reason TEXT NOT NULL,before_json TEXT,after_json TEXT,
 created_by INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
-- Created after the guarded column additions:
CREATE UNIQUE INDEX IF NOT EXISTS idx_ps_order_submission
 ON pink_salt_orders(business_unit_id,submission_key) WHERE submission_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ps_production_replacement
 ON pink_salt_production_batches(replaces_batch_id) WHERE replaces_batch_id IS NOT NULL;
