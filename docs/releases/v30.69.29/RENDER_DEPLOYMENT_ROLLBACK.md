# V30.69.29 Render deployment and rollback

Keep the existing Render service, Node.js 22/start configuration, environment variables, DATA_DIR, UPLOAD_DIR, persistent disk, database and uploads. Do not reset, replace or delete persistent storage.

Before deployment, take a consistent SQLite backup using the backup API or a stopped service; copying only a live main database can omit its WAL. Back up uploads separately. Stage this source on an isolated service/storage first.

This release adds no database schema migration or data rewrite. Existing startup migrations remain idempotent; new capability registrations are additive. The actual V30.69.28 upgrade/restart suite verifies historical cost/transaction/Finance fields, recipient details and Chart of Accounts codes across restarts.

Staging smoke checks:

1. Open existing and new import costs before/after Finance verification. Check the lock, permitted Edit Cost, assigned correction and posted-cost action.
2. Make a same-currency Cash supplier payment with no supplier bank/reference, a bank payment with evidence/reference, a KRW-to-USD invoice payment, Advance Only and Both.
3. Check one active Finance movement per actual debit, zero new cash movement for advance allocation, and balanced controlled Accounting proposals.
4. Check top alerts, field focus, collapsed sections, footer, one protected root overlay and Cancel outside processing.
5. Refresh cost/import/supplier/employee/Accounting deep links; check selected sections, Back/Forward, EN/KR, ordinary logout/login and copied deep links.
6. Smoke-test Excavator buy token, supplier payment, buyer advance/refund and sale settlement.

After acceptance, use the main-branch Git guide. If Render auto-deploys main, the Git push may immediately trigger deployment. No push/deployment was performed in this engineering task.

For code rollback, redeploy protected V30.69.28 with the same current storage and environment. The prior UI/quote/lock-display defects return. No database downgrade is required. Keep all new amendment/correction history; an older UI may not label the new Amended audit event correctly, so review raw history/current release before further corrective work. Never restore an older database over newer financial activity without an independently reviewed reconciliation/recovery plan.
