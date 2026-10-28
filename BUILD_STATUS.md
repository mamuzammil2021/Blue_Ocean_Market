# V30.70.0 — locally tested PostgreSQL build

The Supplier Profile receiving-summary query is fixed. All 31 local release suites pass, including 361 workflow assertions, 2,549 SQL plans, 296 JavaScript syntax checks, schema/import/connection tests, maintenance, PDFs and desktop/mobile EN/KR browser workflows. The final release gate uses Node 22.23.4 and PGlite’s PostgreSQL engine. Earlier native PostgreSQL evidence is retained separately; hosted Render acceptance has not been performed.

Use this tested ZIP instead of the earlier candidate. No Git push, pull or merge was performed.

External steps still require the actual consistent SQLite snapshot and matching uploads, plus Render staging access/deployment details. No live company database has been migrated or cut over. Read POSTGRES_MIGRATION_STATUS.md before migration.
