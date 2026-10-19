# V30.69.26 — Render deployment and rollback

Use the existing Render environment, persistent disk, DATA_DIR and UPLOAD_DIR. Node.js 22, npm ci and the existing start command/Docker setup remain appropriate. Never reset, replace or delete the production database, disk or uploads. The ZIP contains source and synthetic test evidence, not runtime storage.

Before deployment, test the branch using an isolated database. Take a consistent SQLite backup with the SQLite backup API or during a properly stopped service; do not copy a live main database while omitting its WAL. Back up uploads separately. Keep secrets outside Git.

Startup adds `recipient_details_json TEXT NOT NULL DEFAULT '{}'` to `pink_fx_transactions` and `pink_salt_import_costs` only when absent. Existing rows, saved payees/accounts, journal entries, approval and audit history remain. Migration is idempotent. No Chart of Accounts codes change. The existing V30.69.25 migrations also remain.

Smoke-test typed bank/cash Import Costs, USD recipient from KRW account, evidence/fees, correction and Finance verification, prior registered cost history, Import Detail refresh, EN/KR, deep links and one Excavator payment. Confirm one real bank debit has one active Finance movement.

Before new V30.69.26 writes, a code rollback to protected V30.69.25 can retain the additive columns and existing storage. After typed-recipient writes, V30.69.25 does not understand their correction UI: freeze affected financial writes and prefer a forward fix. Do not blindly downgrade and attempt corrections in an older application. Never restore an earlier database over newer financial records without a separately reviewed recovery/reconciliation plan. Full inherited deployment requirements are in docs/releases/v30.69.25/RENDER_DEPLOYMENT_ROLLBACK.md.
