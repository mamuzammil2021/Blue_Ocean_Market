# Render deployment and rollback

Use Node.js 22 and the existing application start configuration (npm ci, npm start). Keep existing environment secrets, database path, DATA_DIR, UPLOAD_DIR and persistent disk mount unchanged. Do not delete, initialize, replace or reset the production database or disk.

First deploy the candidate branch to staging with an isolated database and disk. Run the automated gate and manual acceptance checklist. Confirm health/startup, bilingual deep links, financial balances and protected approvals.

Before production deployment, take a consistent SQLite backup using the SQLite backup API or a stopped application; copying only a live database file while ignoring WAL is unsafe. Back up uploads separately. Record the prior deployed commit and configuration.

V30.69.22 adds no schema migration. The consolidated source retains earlier V30.69.20/21 migrations; upgrading from older production versions therefore requires their migration review and isolated backup rehearsal. Never replace the database with a packaged file; no database is included.

Rollback V30.69.22 to the recorded V30.69.21 commit while retaining the same persistent data and configuration. Do not roll back to a version predating the FX schema/engine after recording FX settlements without a separately reviewed compatibility plan. Restore backups only under an explicit recovery procedure, since that discards later transactions.

