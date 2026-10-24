# V30.69.44 migration, deployment and new-branch Git instructions

## Before startup

Use Node 22.x. Keep the existing production environment variables, JWT secret, database path, upload directory and persistent disk. Read the existing `RENDER_DEPLOYMENT.md` storage guidance. V44 now has additive database changes; older statements saying no schema change apply only to earlier releases.

Stop writers for a consistent backup. Retain the entire SQLite database together with its upload/evidence directory, and record the previous source/version. If using SQLite online backup, use its backup API or VACUUM INTO; do not copy a live database without considering WAL files. Restore-test the backup on staging.

On first V44 startup, additive receiving tables, indexes, immutable-history triggers and the import receiving-cost column are installed transactionally. The migration version is recorded. Startup adds the controlled receiving approval rule through the existing authority configuration. It creates no historical discrepancy cases, credits, refunds or stock movements. Historic IDs and payments remain valid. Legacy receiving writes are interlocked once the source enters unified receiving; existing historic read/report paths remain available.

## Staging acceptance

1. Install the full matching source, then `npm ci` under Node 22. Never copy only selected frontend assets: startup verifies the frontend manifest.
2. Start with a staging copy of the database and uploads using existing `DATA_DIR` / `UPLOAD_DIR` configuration. Run `npm run render:storage-check` on Render and inspect the existing storage guidance before relying on disk persistence.
3. As CEO, open Settings → Receiving & Claims Policy (also linked from Receiving). Select approved accounts and document the treatment. Review availability after Approved versus final Posted, and whether evidence-backed cross-currency credit/refund is allowed. Leave unsupported policy inactive.
4. Check Import and Packaging partial receiving, quarantine/release, responsibility agreement, credit-only payment, actual refund, required approvals, Finance verification and Accounting Posting Control with authorized staging users.
5. Compare pre/post supplier statements, stock by material/location, open quantities, Finance cash counts and ledger balances. Test EN/KR PDFs with the actual host PDF renderer and Korean fonts.
6. Restart and verify the same routes, balances, evidence and persistent files remain. Qualifying email uses the existing important-only opt-in SMTP policy; verify delivery on your configured host.
7. Deploy only after reviewing staging results. No production deployment or remote push was performed while preparing this source.

## Automated checks

```bash
node --version
npm ci
npm run build:ui
npm run qa:current
npm run qa:current -- --browser --upgrade
```

For the upgrade check, set `BOM_BASELINE_DIR` to an extracted protected V30.69.43 source root with installed dependencies. Browser checks need Playwright's Chromium or `BOM_CHROMIUM`. PDF checks need `CHROME_PATH`/`GOOGLE_CHROME_BIN`, Korean fonts and Poppler `pdftotext`. Keep dependencies local; they are not included in source.

The upgrade suite uses disposable synthetic databases. Never point automated fixtures at production data.

## Rollback

Before any V44 writes, a source rollback may retain the additive schema, but test it on staging. After V44 receipts/claims/allocations/refunds exist, old source does not understand all new financial and stock facts: do not simply run V43 against that active database. Prefer a controlled forward correction. For a full rollback, stop the app and restore the matching pre-upgrade database, uploads and source backup together, then reconcile any real-world activity that occurred after backup. Do not drop new tables or delete posted history.

## Push only a new branch

Use a clean clone of your own repository. If remote main has newer unrelated work, reconcile it on the new feature branch before copying this source. Do not overwrite it blindly, force-push, reset main or delete your disk/database.

```bash
cd ~/Documents
git clone https://github.com/mamuzammil2021/Blue_Ocean_Market.git Blue_Ocean_Market_V306944
cd Blue_Ocean_Market_V306944
git fetch origin
git status --short
git log -5 --oneline origin/main
git switch -c feature/v30.69.44-receiving-completion origin/main
```

Extract `Blue_Ocean_Market_V30_69_44_RECEIVING_SETTLEMENT_GIT_READY.zip` in Downloads. Copy its complete source root into the fresh feature checkout. Preserve local runtime files and repository history:

```bash
rsync -av \
  --exclude='.git/' \
  --exclude='.env' \
  --exclude='node_modules/' \
  --exclude='data/' \
  --exclude='uploads/' \
  ~/Downloads/Blue_Ocean_Market_V30_69_44/ ./
node -p "require('./package.json').version"
npm ci
npm run qa:current
git diff --check
git status --short
git diff --stat
git add .
git commit -m "Complete shared receiving and supplier claim settlements V30.69.44"
git push -u origin feature/v30.69.44-receiving-completion
```

If this branch name already exists, choose a unique suffix; do not reset it. Open a PR into main and review it after staging acceptance. The ZIP contains no `.git`, credentials, production database, runtime uploads or dependencies.
