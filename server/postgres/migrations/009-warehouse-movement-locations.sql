-- Keep location balances accurate when existing operational writers omit a location.
-- The original movement remains the first row; split rows retain its source document.
CREATE FUNCTION bom.assign_raw_movement_location() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE bucket record; remaining numeric; take numeric;
BEGIN
 IF pg_trigger_depth()>1 OR NEW.location_id IS NOT NULL OR NEW.quantity_kg>=0 THEN RETURN NEW; END IF;
 PERFORM pg_advisory_xact_lock(701001,NEW.import_item_id::integer);
 remaining:=-NEW.quantity_kg;
 IF (SELECT COALESCE(SUM(quantity_kg),0) FROM bom.pink_salt_raw_stock_movements WHERE import_item_id=NEW.import_item_id AND business_unit_id=NEW.business_unit_id)<remaining THEN RAISE EXCEPTION 'Insufficient raw stock for movement'; END IF;
 FOR bucket IN SELECT location_id,SUM(quantity_kg) available FROM bom.pink_salt_raw_stock_movements WHERE import_item_id=NEW.import_item_id AND business_unit_id=NEW.business_unit_id GROUP BY location_id HAVING SUM(quantity_kg)>0 ORDER BY location_id IS NULL,location_id LOOP
  take:=LEAST(remaining,bucket.available);
  IF take=remaining THEN NEW.location_id:=bucket.location_id; NEW.quantity_kg:=-take; RETURN NEW; END IF;
  INSERT INTO bom.pink_salt_raw_stock_movements(business_unit_id,import_item_id,movement_date,movement_type,quantity_kg,reference_type,reference_id,reference,notes,created_by,location_id) VALUES(NEW.business_unit_id,NEW.import_item_id,NEW.movement_date,NEW.movement_type,-take,NEW.reference_type,NEW.reference_id,NEW.reference,NEW.notes,NEW.created_by,bucket.location_id);
  remaining:=remaining-take;
 END LOOP;
 RAISE EXCEPTION 'Raw stock location balance does not reconcile';
END $$;
CREATE TRIGGER raw_movement_location BEFORE INSERT ON bom.pink_salt_raw_stock_movements FOR EACH ROW EXECUTE FUNCTION bom.assign_raw_movement_location();
CREATE FUNCTION bom.assign_finished_movement_location() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE bucket record; remaining numeric; take numeric;
BEGIN
 IF pg_trigger_depth()>1 OR NEW.location_id IS NOT NULL THEN RETURN NEW; END IF;
 IF NEW.quantity_units>0 AND NEW.movement_type='Sale Cancellation' THEN
  remaining:=NEW.quantity_units;
  FOR bucket IN SELECT location_id,lot_id,production_batch_id,-SUM(quantity_units) available FROM bom.pink_salt_finished_stock_movements WHERE business_unit_id=NEW.business_unit_id AND product_id=NEW.product_id AND reference_type='Order' AND reference_id=NEW.reference_id GROUP BY location_id,lot_id,production_batch_id HAVING SUM(quantity_units)<0 ORDER BY location_id IS NULL,location_id LOOP
   take:=LEAST(remaining,bucket.available);
   IF take=remaining THEN NEW.location_id:=bucket.location_id; NEW.lot_id:=bucket.lot_id; NEW.production_batch_id:=bucket.production_batch_id; NEW.quantity_units:=take; RETURN NEW; END IF;
   INSERT INTO bom.pink_salt_finished_stock_movements(business_unit_id,product_id,production_batch_id,movement_date,movement_type,quantity_units,unit_cost_krw,reference_type,reference_id,reference,notes,created_by,location_id,lot_id) VALUES(NEW.business_unit_id,NEW.product_id,bucket.production_batch_id,NEW.movement_date,NEW.movement_type,take,NEW.unit_cost_krw,NEW.reference_type,NEW.reference_id,NEW.reference,NEW.notes,NEW.created_by,bucket.location_id,bucket.lot_id);
   remaining:=remaining-take;
  END LOOP;
  RAISE EXCEPTION 'Sale cancellation quantity exceeds original stock dispatch';
 END IF;
 IF NEW.quantity_units>=0 THEN
  IF NEW.movement_type='Production Output'  THEN SELECT default_location_id INTO NEW.location_id FROM bom.pink_salt_products WHERE id=NEW.product_id; END IF;
  RETURN NEW;
 END IF;
 PERFORM pg_advisory_xact_lock(701002,NEW.product_id::integer);
 remaining:=-NEW.quantity_units;
 IF (SELECT COALESCE(SUM(quantity_units),0) FROM bom.pink_salt_finished_stock_movements WHERE product_id=NEW.product_id AND business_unit_id=NEW.business_unit_id)<remaining THEN RAISE EXCEPTION 'Insufficient finished stock for movement'; END IF;
 FOR bucket IN SELECT m.location_id,m.lot_id,m.production_batch_id,SUM(m.quantity_units) available FROM bom.pink_salt_finished_stock_movements m LEFT JOIN bom.pink_salt_finished_lots fl ON fl.id=m.lot_id WHERE m.product_id=NEW.product_id AND m.business_unit_id=NEW.business_unit_id AND (NEW.production_batch_id IS NULL OR m.production_batch_id=NEW.production_batch_id) AND (NEW.lot_id IS NULL OR m.lot_id=NEW.lot_id) AND (NEW.movement_type<>'Sale' OR fl.id IS NULL OR (fl.active=1 AND fl.quality_status='Released')) GROUP BY m.location_id,m.lot_id,m.production_batch_id,fl.id HAVING SUM(m.quantity_units)>0 ORDER BY NULLIF(fl.best_before_date,'') NULLS LAST,fl.production_date NULLS LAST,fl.id NULLS LAST,m.location_id IS NULL,m.location_id LOOP
  take:=LEAST(remaining,bucket.available);
  IF take=remaining THEN NEW.location_id:=bucket.location_id; NEW.quantity_units:=-take; NEW.lot_id:=bucket.lot_id; NEW.production_batch_id:=bucket.production_batch_id; RETURN NEW; END IF;
  INSERT INTO bom.pink_salt_finished_stock_movements(business_unit_id,product_id,production_batch_id,movement_date,movement_type,quantity_units,unit_cost_krw,reference_type,reference_id,reference,notes,created_by,location_id,lot_id) VALUES(NEW.business_unit_id,NEW.product_id,bucket.production_batch_id,NEW.movement_date,NEW.movement_type,-take,NEW.unit_cost_krw,NEW.reference_type,NEW.reference_id,NEW.reference,NEW.notes,NEW.created_by,bucket.location_id,bucket.lot_id);
  remaining:=remaining-take;
 END LOOP;
 RAISE EXCEPTION 'Finished stock location balance does not reconcile';
END $$;
CREATE TRIGGER finished_movement_location BEFORE INSERT ON bom.pink_salt_finished_stock_movements FOR EACH ROW EXECUTE FUNCTION bom.assign_finished_movement_location();
