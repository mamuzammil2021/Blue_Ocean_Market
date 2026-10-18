# V30.69.28 — Render deployment and rollback

1. Keep the existing Render service, Node.js 22/Docker configuration, start command, environment variables, persistent disk, DATA_DIR and UPLOAD_DIR.
2. Take a consistent SQLite backup using its backup API (or stop the service before copying). Back up uploads separately. A copy of only the live main database may omit WAL changes.
3. Test the release branch on an isolated staging service and isolated storage. Never point automated fixtures at production. Check the frontend startup integrity check succeeds.
4. Test a copied Supplier Accounts URL, Excavator Buyer Accounts, Import Detail, Employee Accounts, Finance verification and an Accounting nested report. Refresh under slow responses: one loading state, then the exact destination. Check Back/Forward, denied/missing records, Retry, EN/KR, logout/ordinary login, and intentional deep-link login.
5. Smoke-test the existing supplier Bank/Cash payment paths and Finance/Accounting review. A real debit must still create one authoritative Finance record.
6. After staging acceptance, merge the reviewed branch into main using the included Git guide and deploy through the existing Render workflow. Preserve the production disk and database.

This release adds no database schema migration or financial-data rewrite. Existing migrations remain intact and startup remains idempotent. The isolated upgrade test starts the protected V30.69.27 app, creates financial history, then starts this release twice against that same disposable storage and compares fields and COA codes.

For code rollback, redeploy the protected V30.69.27 commit while retaining the current persistent disk/database/uploads and environment. Its intermediate-render defect returns. Do not overwrite newer records with an older database backup. Downgrades below the typed-recipient releases have separate compatibility limitations documented in the V30.69.26 notes.

No deployment or production acceptance is claimed by the isolated test evidence.
