# V30.69.36 deployment and migration

## Prerequisites

Use the existing Node 22/Docker configuration and locked dependencies. The existing Dockerfile installs Chromium, CJK fonts and emoji fonts. Keep the service's current `DATA_DIR`, `UPLOAD_DIR`, database filename, JWT secret, mail configuration and persistent mount. Follow existing storage configuration; do not infer a different database path from this document.

`npm ci` installs dependencies. `npm start` uses the established startup/storage checks and automatically runs the additive packaging migration. There is no separate destructive reset or SQL import step.

## Before upgrading

1. Use a separate test service/database first. Pause application writes before taking the migration acceptance snapshot.
2. Record the deployed commit/version and preserve the original V30.69.33 source ZIP.
3. Back up SQLite **and the complete uploads/evidence directory**, environment configuration and persistent-disk configuration. Keep backups outside the source tree and retain a copy independent of the service disk.
4. Confirm the real database path from the current service configuration, then run:

```bash
node scripts/backup-database.js \
  /absolute/current/blue-ocean.sqlite \
  /absolute/backups/before-v306936.sqlite

node scripts/packaging-reconcile.js \
  /absolute/current/blue-ocean.sqlite \
  > /absolute/backups/before-v306936-reconciliation.json
```

The backup tool uses SQLite's online backup API and checks backup integrity. It refuses to overwrite an existing backup. The reconciliation tool opens the database read-only and reports original-field hashes, material quantities, advance balances and foreign-key errors. These tools were executed successfully against the original .33 test database.

## What migrates

`server/migrations/36936-packaging.sql` is installed by `server/packaging-materials.js` inside a database transaction. New tables hold purchases/lines, partial receipts/lines, supplier-material references, operation keys, action/history records and revisions of the existing BOM. Existing material and movement tables receive additive metadata and document links.

The existing `pink_salt_supplier_packaging_allocations` ledger is extended with an optional purchase reference. SQLite requires rebuilding that table to make its legacy movement reference nullable; every existing column, ID, row and explicit index is copied transactionally before the table is renamed back. Existing legacy allocation references remain unchanged. No second advances ledger is created.

Existing IDs, suppliers, legacy purchase receipts, inventory movements, payment references, Finance verification and posted Accounting records are retained. The old combined purchase/receipt documents are accessible under Purchases → Previous Purchase Receipts and from supplier records. No historical purchase or receipt is invented; no opening inventory or bank movement is generated. The .33 source uses the packaging movement ledger as its stock balance, so no new opening-balance event was needed.

Migration checks record before/after material counts, movement counts/quantities and Finance counts. Retry-safe table/column/index checks prevent duplicate migration effects. A configurable packaging purchase authorization rule initially reuses the business unit's existing purchase threshold and authority; it does not force every purchase through an additional approval.

## Upgrade and acceptance

Deploy the new feature branch to the testing service using its existing deployment procedure. Preserve storage and environment values. Start the application normally. Confirm `/api/health` reports `30.69.36`; inspect startup logs for migration/storage errors.

While writes remain paused, run the reconciliation command again to a different output file and compare its `tables`, `stock`, `advances` and `foreign_key_errors` sections with the before snapshot. Only `generated_at` should differ before any new business transaction. Investigate any other difference before reopening writes.

In the signed-in testing service, verify:

- Sidebar expansion and the three separate packaging screens.
- Create/edit/archive material and create a purchase with two materials and an eligible supplier.
- Supplier Pay Outstanding lists the purchase and links to the correct shared payment workflow.
- Your usual full-payment-before-receipt process; also a partial payment and an unpaid receipt.
- Receive 600 then 400 of a 1,000-unit purchase; reject over-receipt.
- Supplier statement/balance, actual source-account currency, required approvals, Finance verification and Posting Control.
- Imports, Excavator, Production, EN/KR, refresh/Back and a phone-sized view.

Run source QA on disposable fixtures, not by setting test flags on the production service. The supplied fixture suites create their own temporary databases.

## Rollback

Before any new .36 transactions, stop writes, preserve the failed upgraded database for investigation, and restore the verified pre-upgrade database and matching uploads/configuration together with the protected .33 code. Confirm integrity, balances and health before reopening the service.

After new .36 purchases, receipts or payments exist, **do not simply switch old code onto that database or restore an older backup and lose those transactions**. Pause writes and retain the entire current database/uploads. Prefer a forward correction; a rollback requires an explicit reconciliation and recovery plan for all post-upgrade records. Dropping the new tables or clearing migration records is not a supported rollback.

Do not reset or delete the Render persistent disk or production database. No live deployment or production migration was performed during this build.
