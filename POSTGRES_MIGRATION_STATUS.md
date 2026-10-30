## V30.70.1 update

The October 28 QA release retains the PostgreSQL-only runtime. Additive migrations 008 and 009 introduce document archive metadata, warehouse transfer audit records and warehouse attribution for stock movements. The original frozen SQLite catalog remains unchanged; the importer recognizes the new native-only table, requires it to be empty, and disables the new movement triggers during exact historical import. See QA_OCT28_CHECKLIST.md. No live database was migrated or deployed during this work.

# V30.70.0 — one PostgreSQL database

All application modules and business units now use the same PostgreSQL database, configured by one `DATABASE_URL`. The server requires PostgreSQL and has no SQLite runtime fallback. SQLite support is retained only in the offline snapshot importer and historical test fixtures. Uploads and backup files remain on the persistent filesystem.

This build is prepared locally. No Git push, pull, merge, production data change or Render deployment has been performed. Native PostgreSQL acceptance evidence is in `qa/evidence/postgres-release.json` when the release gate succeeds. Render deployment and persistence verification remain a separate staging acceptance step.

## What changed

- Converted startup, database helpers, access checks, approvals, every server module and background accounting synchronization to asynchronous PostgreSQL queries. Schema changes run through seven ordered, checksum-protected migrations before the server listens.
- Migrated all 271 original application tables and 3,453 original columns, with additive runtime/maintenance metadata. Financial amounts use NUMERIC; IDs and scaled amounts use BIGINT. Historical text snapshots and date representations are preserved.
- Preserved receiving immutability, native Finance queue triggers, unique operation receipts, access boundaries and controlled reversals. Request responses wait for transaction commit. Rejected operations roll back their database changes.
- Business mutations and accounting workers share a PostgreSQL writer lock acquired before the SERIALIZABLE transaction snapshot. This preserves the original single-writer business assumptions across processes without automatically replaying external effects. Reads use the bounded connection pool concurrently. This deliberately limits write throughput; measure staging load before increasing service concurrency.
- Accounting jobs use row claims, nested rollback and bounded retries. Email promotion is deferred until the related transaction commits; duplicate event inserts use ON CONFLICT. Failed email delivery remains visible through the existing event history; this does not add guaranteed exactly-once SMTP delivery.
- Replaced SQLite backups and trigger-dropping reset logic with PostgreSQL logical data snapshots, exact row/upload checksums, sequence recovery, native constraints and a journaled upload swap. Quick Reset preserves users/access/configuration. Full Reset and restore invalidate old authentication sessions. Restart recovery settles interrupted upload swaps before accepting requests.
- Fixed PostgreSQL-specific report aggregates, text-date filters, stock paging, missing policy account IDs, payee-account usage inspection, named/numeric route collisions and receiving async wrappers. EN/KR UI and PDF values retain their existing behavior.

## Run a fresh installation

Use Node 22 and PostgreSQL 16 or 18. `npm ci` installs the locked dependencies. Set secrets through a private environment file or the hosting environment:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/blue_ocean_market
PG_POOL_MAX=5
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
APP_ENCRYPTION_KEY=REPLACE_WITH_THE_EXISTING_KEY_OR_A_NEW_SECRET_FOR_A_FRESH_INSTALL
ADMIN_EMAIL=YOUR_ADMIN_EMAIL
ADMIN_PASSWORD=REPLACE_WITH_A_STRONG_PASSWORD_OF_AT_LEAST_12_CHARACTERS
APP_ENV=development
ALLOW_TEST_DATA_RESET=false
LOCAL_TEST_MODE=false
SEED_DEMO_USERS=false
SEED_DEMO_DATA=false
DATA_DIR=/var/data/data
UPLOAD_DIR=/var/data/uploads
```

Use the application's existing encryption key when migrating encrypted configuration. Never commit private environment values. Set local writable DATA_DIR/UPLOAD_DIR paths for local development. `npm start` migrates the schema, recovers maintenance state, seeds missing configuration and then listens. `/api/health` checks database readiness. Chrome/Chromium with CJK fonts is required for PDF generation; the Dockerfile includes these.

## Migrate an existing V30.69.50 installation

1. Stop writes in the old application. Take a consistent SQLite backup using its backup API, plus the matching uploads and existing secrets. Retain the original installation for rollback. Do not copy a live SQLite main file while omitting its WAL.
2. Create one empty PostgreSQL database. Run `npm run postgres:migrate` with its DATABASE_URL. Do not start the web application yet: bootstrapping fills configuration tables, and the importer intentionally refuses a nonempty destination.
3. Inspect the consistent snapshot: `npm run postgres:inspect -- source.sqlite source-inspection.json`. Inspect reports are private operational artifacts.
4. Set `PG_IMPORT_EMPTY_DATABASE=true` and run `npm run postgres:import -- source.sqlite reconciliation.json`. The importer locks the destination, checks the V30.69.50 source schema/integrity/FKs, copies every table atomically, restores identities, then compares all imported values. It refuses an occupied destination and rolls back a mismatch. Resolve a source-version mismatch explicitly; never bypass the schema guard.
5. Copy matching uploads into the new UPLOAD_DIR before starting. Use fresh destination directories and verify byte counts/checksums; do not merge unrelated upload sets. Keep the old APP_ENCRYPTION_KEY and other required integration secrets.
6. Start this application. Check users, roles, every BU, supplier/customer statements, native account balances, posted journals, stock and attachments against the frozen source. The supplied automated tests use synthetic data; no customer database has been imported during this work.
7. Keep writes frozen until staging acceptance and final reconciliation pass. At cutover use only PostgreSQL. If rollback is needed after new writes, reconcile those writes explicitly before returning to the old deployment; do not run both databases as live writers.

## Test

`npm run qa:current` runs Node/version/manifest/syntax checks, schema/import and connection tests, SQL planning, the API route audit, maintenance rollback/restore/full-reset tests and all PostgreSQL workflow regressions including actual PDFs and browser checks.

For native multi-session acceptance, set `PG_TEST_SERVER_URL` to a dedicated disposable PostgreSQL server/database whose test role can CREATE/DROP databases. The gate creates separate random databases and removes them afterward. Never point it at production or reuse the application's DATABASE_URL. Without PG_TEST_SERVER_URL the gate uses PGlite's SQL engine, which is useful locally but does not establish native multi-session acceptance. `CHROME_PATH` must point at the installed Chromium executable.

`npm run qa:postgres` is the smaller schema/import/connection gate. Its optional TEST_DATABASE_URL must name a new empty disposable database; it refuses an existing bom schema. Earlier `qa:v...` commands and older release documents are historical SQLite regression material, not the current deployment gate.

Native local acceptance uses PostgreSQL 18.0. This sandbox maps only UID 0, so its private test binary relaxes three startup root guards with a test-only environment flag and disables unsupported Unix sockets. SQL/locking/constraints/transaction code is unchanged; the application uses the real pg network driver over local TCP. These binaries and test flags are excluded from the source deliverable. Render must use standard managed PostgreSQL.

## Render staging

The Dockerfile and `render.yaml.example` describe one web service, one managed PostgreSQL database and a persistent disk for uploads/backups. The database URL is wired through Render's private `fromDatabase.connectionString`; automatic deployment and test reset are disabled. Choose the intended region and paid disk/service capacity in Render before provisioning. Keep staging separate from the live deployment, use staging secrets, and disable outbound integrations until their intended staging settings are configured.

After deployment verify login and BU isolation, representative create/edit/approval/posting workflows, concurrent duplicate operations, EN/KR desktop/mobile pages, PDFs, upload downloads, backups/restores and a service restart/redeploy that preserves data and attachments. Render's managed backup policy and a restore exercise should be checked before production cutover.

Render Blueprint reference: https://render.com/docs/blueprint-spec (checked 28 October 2026). No Render account operation or hosted test has been performed in this build.

## Latest local release result

The Supplier Profile query now groups the receipt source ID explicitly, and the browser regression waits for initial route readiness before testing tab preservation. The complete Node 22.23.4 local release gate passed: 31 suites, 361 workflow assertions, 2,549 SQL plans and 296 syntax checks. This final run uses PGlite; native PostgreSQL evidence from the earlier implementation run is retained separately. Actual Render acceptance and live-data reconciliation remain unperformed pending staging access and a consistent source snapshot/uploads.
