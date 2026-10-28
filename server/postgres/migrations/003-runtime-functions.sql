SET LOCAL search_path TO bom,pg_catalog;

CREATE FUNCTION bom.utc_now() RETURNS text LANGUAGE sql STABLE
SET search_path TO pg_catalog AS $$
 SELECT to_char(CURRENT_TIMESTAMP AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS')
$$;

CREATE FUNCTION bom.utc_datetime(value text, modifier text DEFAULT NULL) RETURNS text
LANGUAGE sql STABLE SET search_path TO pg_catalog AS $$
 SELECT to_char((CASE WHEN value='now' THEN CURRENT_TIMESTAMP ELSE value::timestamptz END
   + COALESCE(modifier::interval,interval '0 seconds')) AT TIME ZONE 'UTC','YYYY-MM-DD HH24:MI:SS')
$$;

CREATE FUNCTION bom.julian_day(value text) RETURNS numeric LANGUAGE sql STABLE
SET search_path TO pg_catalog AS $$
 SELECT EXTRACT(EPOCH FROM CASE WHEN value='now' THEN CURRENT_TIMESTAMP ELSE value::timestamptz END)/86400+2440587.5
$$;

CREATE FUNCTION bom.json_text(value jsonb, path text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path TO pg_catalog AS $$
 SELECT CASE jsonb_typeof(v) WHEN 'boolean' THEN CASE WHEN v='true'::jsonb THEN '1' ELSE '0' END ELSE v#>>'{}' END
 FROM (SELECT jsonb_path_query_first(value,path::jsonpath) v) s
$$;
CREATE FUNCTION bom.json_text(value text, path text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path TO bom,pg_catalog AS $$
 SELECT bom.json_text(NULLIF(value,'')::jsonb,path)
$$;
CREATE FUNCTION bom.json_elements(document text) RETURNS TABLE(value text)
LANGUAGE sql IMMUTABLE SET search_path TO pg_catalog AS $$
 SELECT CASE jsonb_typeof(v) WHEN 'string' THEN v#>>'{}' ELSE v::text END
 FROM jsonb_array_elements(NULLIF(document,'')::jsonb) s(v)
$$;

-- Read-only application relation inventory. Schema ownership and mutation stay
-- in ordered migrations; route modules only inspect names/capabilities.
CREATE VIEW bom._relations AS
 SELECT c.relname::text AS name,
   CASE c.relkind WHEN 'r' THEN 'table' WHEN 'p' THEN 'table' WHEN 'v' THEN 'view' ELSE 'index' END AS type,
   c.relname::text AS tbl_name,NULL::text AS sql
 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='bom' AND c.relkind IN ('r','p','v','i') AND left(c.relname,1)<>'_';
