# V30.69.25 — Render deployment and rollback

Use the existing Render service, Node.js 22, environment secrets, database filename, DATA_DIR, UPLOAD_DIR and persistent-disk mount. Do not initialize, replace, delete, reseed or reset production storage. No database or uploads are distributed with this source.

1. Record the deployed commit and existing storage paths. Run `npm run render:storage-check` against the existing configuration.
2. Take a consistent SQLite backup with the SQLite backup API (or while the application is stopped), plus a separate uploads backup. A copy of only a live `.sqlite` file can omit WAL transactions. Store backups outside Git.
3. Deploy the release branch to an isolated staging service/disk first. Use `npm ci` and `npm start`, or the supplied Dockerfile. The Dockerfile includes Chromium and Korean fonts; preserve CHROME_PATH on native deployments so statement and shipment PDFs work.
4. Startup applies additive migrations. `36925-qa14.sql` adds cost recipients, notification-event uniqueness and statement indexes. Startup also adds replacement-Finance and receipt-digest compatibility columns and a token-revocation table. Existing records and Chart of Accounts codes are retained; no destructive migration is required.
5. Check application startup, existing account/history records, received inventory, supplier statements, permissions, one real debit/one Finance movement, Finance verification, pending/postable journals, correction chains and deep links. Use synthetic staging records for destructive testing.
6. After acceptance, deploy the same commit to production with the same existing disk and configuration. Preserve the backup and prior commit identifier.

## Rollback

Before any V30.69.25 financial writes, restore the previously deployed V30.69.24 application commit with the same persistent data; the additional schema objects can remain. Never run DROP/DELETE migrations to undo this release.

After V30.69.25 writes, stop new financial mutations and assess compatibility before reverting code: older builds do not understand the new third-party cost recipients and replacement correction-chain links. Prefer a forward fix. Do not run an old build against open replacement chains or reverse new settlements merely to downgrade the application. A database restore is a separate, explicitly authorized recovery operation that can discard later transactions and must reconcile uploads, bank movements and accounting journals.

Do not delete the Render disk, change database paths, copy a development database over production, or run fixture/test scripts with production paths.
