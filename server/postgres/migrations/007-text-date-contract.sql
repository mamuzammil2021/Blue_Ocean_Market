SET LOCAL search_path TO bom,pg_catalog;
-- Existing APIs expose ISO date/text fields. Keep that contract and preserve
-- nullable/empty historical dates without changing stored source values.
CREATE FUNCTION bom.utc_instant(value text) RETURNS timestamptz
LANGUAGE plpgsql STABLE SET search_path TO pg_catalog AS $fn$
BEGIN
 IF NULLIF(value,'') IS NULL THEN RETURN NULL; END IF;
 IF value='now' THEN RETURN CURRENT_TIMESTAMP; END IF;
 RETURN value::timestamptz;
EXCEPTION WHEN SQLSTATE '22007' OR SQLSTATE '22008' OR SQLSTATE '22P02' THEN RETURN NULL;
END
$fn$;
CREATE OR REPLACE FUNCTION bom.utc_datetime(value text, modifier text DEFAULT NULL) RETURNS text
LANGUAGE plpgsql STABLE SET search_path TO bom,pg_catalog AS $fn$
BEGIN
 RETURN to_char((bom.utc_instant(value)+COALESCE(modifier::interval,interval '0 seconds')) AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS');
EXCEPTION WHEN SQLSTATE '22007' OR SQLSTATE '22008' OR SQLSTATE '22015' OR SQLSTATE '22P02' THEN RETURN NULL;
END
$fn$;
CREATE FUNCTION bom.utc_date(value text, modifier text DEFAULT NULL) RETURNS text
LANGUAGE sql STABLE SET search_path TO bom,pg_catalog AS $$ SELECT left(bom.utc_datetime(value,modifier),10) $$;
CREATE OR REPLACE FUNCTION bom.julian_day(value text) RETURNS numeric
LANGUAGE sql STABLE SET search_path TO bom,pg_catalog AS $$ SELECT EXTRACT(EPOCH FROM bom.utc_instant(value))/86400+2440587.5 $$;
