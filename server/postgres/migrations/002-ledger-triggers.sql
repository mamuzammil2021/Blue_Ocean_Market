SET LOCAL search_path TO bom,pg_catalog;

-- A UNIQUE constraint replaces the SQLite read-before-insert duplicate trigger
-- and also prevents simultaneous duplicate resale records on different clients.
CREATE UNIQUE INDEX excavator_buyer_resale_share_one_per_asset
  ON bom.excavator_buyer_resale_shares(buyer_id,asset_id);

CREATE FUNCTION bom.set_allocation_entry_time() RETURNS trigger
LANGUAGE plpgsql SET search_path TO bom,pg_catalog AS $fn$
BEGIN
  IF NEW.created_at IS NULL THEN
    NEW.created_at := to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS.MS');
  END IF;
  RETURN NEW;
END
$fn$;
CREATE TRIGGER set_excavator_allocation_entry_time_v352
  BEFORE INSERT ON bom.excavator_buyer_payment_allocations
  FOR EACH ROW EXECUTE FUNCTION bom.set_allocation_entry_time();

CREATE FUNCTION bom.queue_finance_sync() RETURNS trigger
LANGUAGE plpgsql SET search_path TO bom,pg_catalog AS $fn$
BEGIN
  INSERT INTO bom.accounting_sync_queue(finance_entry_id,queued_at,attempts,last_error)
  VALUES(NEW.id,to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS'),0,'')
  ON CONFLICT(finance_entry_id) DO UPDATE SET queued_at=EXCLUDED.queued_at,last_error='';
  RETURN NEW;
END
$fn$;
CREATE TRIGGER trg_v290_finance_insert AFTER INSERT ON bom.finance_entries
  FOR EACH ROW EXECUTE FUNCTION bom.queue_finance_sync();
CREATE TRIGGER trg_v290_finance_update AFTER UPDATE ON bom.finance_entries
  FOR EACH ROW EXECUTE FUNCTION bom.queue_finance_sync();

CREATE FUNCTION bom.reject_receiving_fact_mutation() RETURNS trigger
LANGUAGE plpgsql SET search_path TO bom,pg_catalog AS $fn$
BEGIN
  RAISE EXCEPTION 'Receiving facts are immutable; use controlled compensating events'
    USING ERRCODE='23514';
END
$fn$;
CREATE TRIGGER pink_receiving_lines_immutable_update_delete
  BEFORE UPDATE OR DELETE ON bom.pink_receiving_lines
  FOR EACH ROW EXECUTE FUNCTION bom.reject_receiving_fact_mutation();
CREATE TRIGGER pink_receiving_events_immutable_update_delete
  BEFORE UPDATE OR DELETE ON bom.pink_receiving_events
  FOR EACH ROW EXECUTE FUNCTION bom.reject_receiving_fact_mutation();
CREATE TRIGGER pink_receiving_history_immutable_update_delete
  BEFORE UPDATE OR DELETE ON bom.pink_receiving_history
  FOR EACH ROW EXECUTE FUNCTION bom.reject_receiving_fact_mutation();

CREATE FUNCTION bom.reject_investigation_fact_mutation() RETURNS trigger
LANGUAGE plpgsql SET search_path TO bom,pg_catalog AS $fn$
BEGIN
  IF NEW.estimate_json IS DISTINCT FROM OLD.estimate_json
    OR NEW.missing_q IS DISTINCT FROM OLD.missing_q
    OR NEW.case_id IS DISTINCT FROM OLD.case_id
    OR NEW.issue_id IS DISTINCT FROM OLD.issue_id
    OR NEW.source_line_id IS DISTINCT FROM OLD.source_line_id THEN
    RAISE EXCEPTION 'Original investigation facts are immutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END
$fn$;
CREATE TRIGGER receiving_issue_estimate_immutable BEFORE UPDATE ON bom.pink_receiving_issue_lines
  FOR EACH ROW EXECUTE FUNCTION bom.reject_investigation_fact_mutation();
