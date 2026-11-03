-- A stable cost transaction may have several audited amendments.
-- Request idempotency remains enforced by pink_fx_requests; no history is deleted.
ALTER TABLE bom.pink_operational_revisions
  DROP CONSTRAINT pink_operational_revisions_current_transaction_id_key;
CREATE INDEX pink_revision_current_transaction
  ON bom.pink_operational_revisions(current_transaction_id,id);
