# V30.69.27 — Render deployment and rollback

Use the existing Render environment, persistent disk, DATA_DIR, UPLOAD_DIR, Node.js 22 and current start command/Docker setup. Never reset, delete or replace the production database, disk or uploads. This source ZIP contains no runtime database or private uploads.

Before deploying, take a consistent SQLite backup using its backup API or a properly stopped service, and back up uploads separately. Do not copy only a live main database while ignoring its WAL. Stage this branch against isolated storage first.

This release introduces no new schema changes. Existing startup migrations and the new shared capability registration are additive/idempotent. Existing supplier accounts, IDs, posted entries, approvals and audit history are preserved. Protected V30.69.26 upgrade/restart acceptance checks every existing cost/transaction/Finance field and Chart of Accounts codes.

Smoke-test saved supplier banks, USD receiving from KRW source with evidenced FX, Bank/Cash switching, Cash with no supplier account, newly added/archived accounts, a fixed USD invoice with an incompatible bank disabled, supplier KPIs/Finance links, EN/KR, and one Excavator payment. A real debit must retain exactly one authoritative Finance movement.

A code rollback from this focused release to protected V30.69.26 can retain the same existing storage and additive registry entry; the account-loading defect will return. Do not downgrade farther across typed-recipient records without the compatibility controls documented in docs/releases/v30.69.26/RENDER_DEPLOYMENT_ROLLBACK.md. Never restore an older database over newer financial records without a separately reviewed recovery/reconciliation plan.
