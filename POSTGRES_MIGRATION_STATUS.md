# Full migration to one PostgreSQL database

User-approved scope: migrate the entire system to **one PostgreSQL database** for all modules and business units, then test the completed application on a separate Render staging service. Preserve existing IDs, relationships, access boundaries, financial history, receiving facts, uploads and the EN/KR interface. Keep existing branches and the live SQLite deployment intact; do not pull or merge.

**Status: implementation started; full application migration is not complete.** This is a migration work branch, not a new deployable application release. The existing application runtime remains SQLite and rejects a configured PostgreSQL URL instead of silently writing to SQLite. No production data, service, database or Render configuration has been modified.

## Implemented and tested

- Catalog exported from the initialized V30.69.50 system: **271 application tables, 3,453 columns, one view**. SQLite's sequence/statistics tables are excluded. The catalog contains schema metadata, not company rows or secrets.
- Explicit, reproducible PostgreSQL schema migration for every catalogued table, primary/unique key, index, CHECK constraint and foreign key. Foreign keys support a deferred, atomic import across circular dependencies.
- Native PostgreSQL ledger triggers: receiving facts and investigation estimates stay protected; finance mutations queue accounting synchronization. A unique index also prevents concurrent duplicate buyer/machine resale shares.
- Exact NUMERIC columns for legacy REAL amounts and quantities; BIGINT for existing integer IDs, scaled quantities and cents. No global JavaScript numeric parser, rounding, historical ledger recalculation, JSON reserialization or silent cleanup. Date/snapshot text remains text to preserve existing representations during migration.
- An asynchronous `pg` connection layer with one required `DATABASE_URL`, bounded pooling, UTC sessions, parameterized queries, transaction context, nested savepoints, error rollback and connection release. All transaction statements use the same client. Overlapping sibling savepoints and queries that outlive their transaction are rejected.
- An offline SQLite snapshot importer for a dedicated **empty** PostgreSQL destination. It checks source integrity/schema/foreign keys, locks destination tables, imports every table atomically, restores identity high-water marks and verifies each table's row count and all column values through canonical SHA-256 fingerprints. Failed imports roll back rows, trigger changes and sequence restarts. Existing destinations are refused.
- Original business-event creation is suppressed only for the three named import-side-effect triggers during that owner transaction; immutable ledgers and constraints remain enforced. Normal Finance triggers are restored before commit.
- Source inventory identifies **91 runtime files** with legacy database calls. See `qa/evidence/postgres-runtime-conversion.json`; this is an inventory of conventional `db` calls, not proof of complete runtime acceptance.
- PostgreSQL 16/18 GitHub Actions configuration is included for native multi-session testing in a fresh database. Its execution status must be checked separately; the local PGlite results are not native-server or Render results.

Local validation on Node 22.23.4:

- `node --test qa/postgres/*.test.js`: **17 tests passed** using PGlite's PostgreSQL SQL engine plus connection-context unit tests.
- Full first synthetic import: **1,564 rows across all 271 application tables matched**; report in `qa/evidence/postgres-import-foundation.json`.
- Tests include Unicode, exact NUMERIC/BIGINT values, identity/FK protection, import rollback, nonempty-target rejection, changed-schema rejection, changed-migration rejection, immutable receiving facts, Finance queue triggers and deliberate reconciliation mismatch detection.
- Existing `qa/qa_v36950_quick_reset.js`: **8 regression groups passed** on the isolated SQLite baseline.
- Real multi-client contention tests are configured for `TEST_DATABASE_URL` but are not exercised by the local PGlite run. No complete application or Render PostgreSQL test has passed yet.

## Remaining work required for the requested complete build

The following work remains required, not optional. Adding a driver or successfully importing tables does not migrate the application runtime.

| Area | Required conversion and acceptance |
| --- | --- |
| Application startup and schema lifecycle | Retire module-local SQLite DDL/PRAGMA migrations, run ordered PostgreSQL migrations, bootstrap initial configuration asynchronously, gate readiness on database/migration health and shut down pools cleanly. |
| Shared database calls | Convert and await all queries and their callers, including callbacks, helper factories, access checks, response construction and background jobs. Replace SQLite-specific SQL, insert IDs, schema introspection, upserts, JSON/date functions and permissive grouping with reviewed native PostgreSQL SQL. |
| Identity, access and approvals | Login/password reset, business-unit context, roles/groups/overrides, approval revisions, action snapshots, audit and permission-sensitive exports. Preserve denial behavior throughout asynchronous conversion. |
| Finance and Accounting | Verification/posting/corrections/reversals, journals, budgets/periods, statements, bank accounts/imports/transfers, opening migrations, fixed assets, obligations and payroll. Verify native-currency and KRW reconciliation and unchanged historical balances. |
| Accounting synchronization | Replace process-local job ownership with database-backed claims and idempotent posting. Test retries, concurrent workers, restart recovery and queue rollback with the associated business change. |
| Excavator | Suppliers, buyers, requirements, machines/assets, transactions, repairs/parts/logistics, sale payment linkage, advances/allocations/refunds, resale profit and credit settlements, financing and documents/PDFs. |
| Pink Salt | Suppliers/customers, imports, actual-weight receiving, investigations/claims, credits/refunds, advances, FX proposals/legs, fees, payments/allocations, sales/orders/shipments, commerce integrations and pricing. Preserve operation-receipt idempotency in the same transaction as its mutation. |
| Packaging and production | Materials, suppliers, purchases, credit coverage, receipts, measured quantities, purchase locks, BOM/recipes, repacking, raw/finished lots, FEFO allocations, stock valuation and immutable history. |
| MIMI and shared operations | Restaurant menus/tables/orders/stock/waste/closings; tasks, reports, KPI/performance, meetings, notifications, employee compensation, attachments and platform related-record registries. |
| Administration and storage | Replace SQLite file backups/restores and startup reset markers with PostgreSQL dump/restore and consistent upload snapshots. Redesign Quick/Full Reset with explicit table targets, restricted privileges, password/phrase/reason guards, automatic backup, retention, audit and rollback tests. Do not wire the SQLite reset helper to PostgreSQL. |
| Concurrency | Stock/advance/credit read-validation-write locks or conditional updates, unique operation keys, duplicate request replay, simultaneous approvals/receipts/payments/posting, worker claims, deadlock handling and bounded retries of whole safe transactions. |
| Full acceptance and Render | Native PostgreSQL test harness, fresh/install/import/restart/upgrade/backup/restore/reset tests, complete existing workflow regression suites, EN/KR desktop/mobile routing, PDFs, permissions and realistic Render latency/load. Stage with synthetic data first, then a controlled company-data copy if required. |

Current conventional-call inventory: 3,790 `db.prepare`, 176 `db.transaction`, 195 `db.exec`, 22 `db.pragma` calls, and the runtime SQLite driver import. These calls have **not** been converted by this foundation change. No synchronous PostgreSQL bridge or runtime SQL-dialect rewriting has been introduced.

## Run the implemented offline tools

Node 22.x and `npm ci` are required. These commands are for a new, disposable migration/test database; do not point them at the live application database.

```sh
npm run qa:postgres
npm run postgres:audit
npm run postgres:build-schema

# Inspect a private source snapshot without connecting to PostgreSQL.
npm run postgres:inspect -- /absolute/path/blue-ocean.sqlite /absolute/path/inspection.json

# DATABASE_URL must be supplied securely via the environment or private .env.
# Use the same one destination database for schema creation and the import.
npm run postgres:migrate
PG_IMPORT_EMPTY_DATABASE=true npm run postgres:import -- /absolute/path/blue-ocean.sqlite /absolute/path/import-report.json
```

Reports are created with private file permissions and an existing report path is refused. The importer creates its own consistent private SQLite backup, reads that snapshot, and removes the temporary copy afterwards. The importer never overwrites or cleans an existing PostgreSQL installation.

The import keeps historical JSON strings and dates byte-for-byte. Numeric fingerprints compare numeric value rather than textual trailing zeroes. Financial workflows and PDFs must still be validated after application conversion; successful table fingerprints alone do not establish application correctness. The reconciliation implementation currently keeps a table's row hashes in memory, so large production databases require memory profiling or an external sort before cutover.

To run against a **new empty disposable native PostgreSQL database**, set `TEST_DATABASE_URL` securely, then run `npm run qa:postgres`. This additionally exercises real concurrent sessions for conditional spending and duplicate operation keys. It deliberately refuses a database that already has a `bom` schema. Never use the live application's `DATABASE_URL` as the test target.

## Render and cutover requirements

The completed staging deployment will have one managed PostgreSQL instance and one web service in the same Render region, using Render's internal database connection URL. PostgreSQL holds all operational/configuration/access/audit data. Existing upload files still require persistent storage; keeping them on a web-service disk does not create a second database.

Use a dedicated staging web service, preserve its upload disk and encryption keys, disable real outbound notifications and control background jobs. Do not run a disk-dependent upload import during a Render pre-deploy command: that command cannot access the web service's persistent disk. Database-only schema migrations can run before startup; the full data/media import is a separate controlled maintenance operation.

No Render web application blueprint is marked ready on this branch because the runtime conversion and backup/reset work above are unfinished. Connecting the current `npm start` to `DATABASE_URL` fails explicitly. Do not remove that guard until all modules use PostgreSQL and the full acceptance gate passes.

Final cutover requires paused writes/jobs, consistent database and upload backups, a final atomic import, table/value and financial/stock reconciliation, explicit application acceptance and then activation of PostgreSQL writes. Keep the old SQLite database read-only. Once PostgreSQL receives new writes, rollback requires reconciliation/export of those writes; restarting the stale SQLite database would lose them.

Official technical references checked for this work:

- https://node-postgres.com/features/transactions
- https://node-postgres.com/features/pooling
- https://www.postgresql.org/docs/current/sql-createtable.html
- https://render.com/docs/postgresql-creating-connecting
- https://render.com/docs/disks
- https://render.com/docs/deploys
