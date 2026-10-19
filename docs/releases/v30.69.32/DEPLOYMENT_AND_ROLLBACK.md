# Deployment and data-safe rollback

Use the existing Render service and SQLite persistent storage. Keep DATA_DIR, UPLOAD_DIR, JWT/security configuration, production database, documents and uploads. Do not reset, replace or delete the disk. No PostgreSQL migration is included.

Before deployment: obtain a consistent database backup plus uploads backup, test this build on isolated staging storage, review the current QA report and perform the existing-data valuation review. Verify the configured Chrome/Chromium executable and Korean fonts for PDF output. Do not change the persistent paths or copy a test database into production.

Node.js 22 is required. The application starts normally using npm start. The additive startup changes create operation receipts and operational revision tables and add optional valuation-basis/updated metadata. Existing raw transaction, Finance and posted journal fields and CoA codes are preserved. Migrations are safe to rerun. The .31-to-.32 upgrade/restart test includes actual historical posted synthetic data.

After staging acceptance, push a NEW branch using V30_69_32_MAC_GIT_NEW_BRANCH.md. Do not push main directly. Review the branch/PR and deploy only when explicitly authorized. Test advance management/locks, current cost identity/details, CEO and independent approval, status recovery, every statement format, same/cross-currency payments, posting reasons/reversal order, receiving, EN/KR/mobile, routing and Excavator.

Rollback decision:

- Before any new .32 financial corrections/revisions, a code rollback to the protected .31 source can retain the current database, but its valuation/authorization/processing defects return. Keep the additive tables/columns; do not run destructive schema downgrades. Review pending operations/approvals first.
- After .32 stable-projection corrections or advances exist, do not blindly redeploy .31 against the active database. Older code assumed separate operational projections for financial versions and may resolve an old Finance link. Pause financial writes and use a reviewed compatibility hotfix/roll-forward that retains the .32 current-version resolver and financial controls. Preserve all newer transactions and evidence.
- Restore a pre-deployment backup only under a reviewed recovery/reconciliation plan; never overwrite financial activity recorded after that backup. No automated destructive rollback command is supplied.

No push, merge, deployment, production repair or storage operation was performed when preparing this package.
