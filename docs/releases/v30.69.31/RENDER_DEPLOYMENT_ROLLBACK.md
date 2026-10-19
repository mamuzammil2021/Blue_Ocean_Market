# Render deployment and rollback

Keep the existing Render service, Node.js 22 configuration, environment variables, DATA_DIR, UPLOAD_DIR, production database, uploads and persistent disk. Do not reset, replace or delete persistent storage.

Before deployment, take a consistent SQLite backup through its backup API or while the service is stopped. Copying only a live main database can omit WAL changes. Back up uploads separately. Test this source on isolated staging storage before pushing to an auto-deployed main branch.

Startup adds a normalized-reference lookup column/index and repairs the FX partial reference index transactionally. It preserves all existing references, financial records and Chart of Accounts codes and is safe to rerun. Platform capability registration is additive. See actual V30.69.30 migration/restart evidence.

Staging checks: multiple categories at desktop/tablet/mobile widths; new/duplicate/missing/blank-cash references; original-reference Finance correction; cost locks and posted-cost permissions; one active Finance movement; balanced pending/posted proposals according to policy; cross-currency/same-currency/Advance Only/Both; EN/KR; slow concurrent refresh; browser refresh/Back/Forward/deep links; Excavator supplier/buyer payments and corrections.

After acceptance, follow V30_69_31_MAC_GIT_MAIN_PUSH.md. Pushing main may immediately trigger Render if it tracks main with auto-deploy enabled. No push/deployment was performed during preparation.

For code rollback, redeploy protected V30.69.30 with the same current storage and environment. Its migration uses CREATE INDEX IF NOT EXISTS, so it retains the repaired reference index; the additional normalized column is backward compatible. The old UI/reference-precheck/stale-render defects return. Preserve newer financial history and controlled corrections. Do not restore an older database over new financial activity without a reviewed reconciliation/recovery plan.

The release also creates pink_legacy_payment_requests for committed, payload-checked legacy payment retries. Do not remove it on rollback. V30.69.30 can read the financial records but does not implement this stronger controller; rolling code back restores its older retry/atomicity limitations. Never restore a pre-deployment database over financial activity recorded after deployment.
