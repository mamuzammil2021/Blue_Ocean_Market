SET LOCAL search_path TO bom,pg_catalog;
CREATE TABLE bom._pg_auth_epoch(id INTEGER PRIMARY KEY CHECK(id=1),epoch UUID NOT NULL);
INSERT INTO bom._pg_auth_epoch VALUES(1,gen_random_uuid());
CREATE OR REPLACE VIEW bom._relations AS
 SELECT c.relname::text AS name,
   CASE c.relkind WHEN 'r' THEN 'table' WHEN 'p' THEN 'table' WHEN 'v' THEN 'view' ELSE 'index' END AS type,
   CASE WHEN c.relkind='i' THEN target.relname ELSE c.relname END::text AS tbl_name,
   CASE WHEN c.relkind='i' THEN pg_get_indexdef(c.oid) WHEN c.relkind='v' THEN pg_get_viewdef(c.oid) ELSE NULL END::text AS sql
 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
 LEFT JOIN pg_catalog.pg_index i ON i.indexrelid=c.oid
 LEFT JOIN pg_catalog.pg_class target ON target.oid=i.indrelid
 WHERE n.nspname='bom' AND c.relkind IN ('r','p','v','i') AND left(c.relname,1)<>'_';
