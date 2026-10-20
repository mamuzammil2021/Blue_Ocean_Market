# V30.69.38 deployment and rollback

Use the complete source ZIP. Prerequisites: Node 22, locked dependencies (`npm ci`), current environment configuration, existing SQLite database path and persistent uploads. Keep all existing financial/SMTP/JWT settings. Do not change or reset the Render persistent disk.

1. Pause business writes and back up the actual database and uploads. Use the existing backup script, not a raw copy of an actively written SQLite database:

```bash
node scripts/backup-database.js /absolute/data/blue-ocean.sqlite /absolute/backups/before-v306938.sqlite
node scripts/packaging-reconcile.js /absolute/data/blue-ocean.sqlite > /absolute/backups/before-v306938.json
```

2. Deploy the new feature branch to your testing service. Keep the existing DATA_DIR, UPLOAD_DIR, database path, secrets, build/start commands and disk mount. Install with `npm ci`; run the existing `npm start` command.
3. Startup adds `content_language` and `commerce_language` to the existing product table if absent. This uses the established schema-check/ALTER mechanism; do not run a separate destructive migration. Restart is safe.
4. Confirm `/api/health` reports `30.69.38`. Before allowing writes, take another packaging reconciliation snapshot; compare quantities, supplier advances, original record-field hashes and foreign keys. The migration adds product preferences; it must not change money or stock balances.
5. Test the sidebar arrow/alignment; New Production Cancel/Back/Save; batch detail refresh and browser history; visible list actions; English/Korean/Both product creation and switching; preferred commerce fallback; Families/Lots list/detail/short edits, filters, paging and mobile/EN/KR behavior. Confirm existing supplier payments, Imports, receiving, Finance and Posting Control remain operational.

QA on disposable fixtures:

```bash
npm run qa:release
npm run qa:product:ux
```

Browser QA needs Playwright plus Chromium:

```bash
npm install --no-save --package-lock=false playwright
BOM_CHROMIUM=/absolute/path/to/chromium npm run qa:product:browser
BOM_CHROMIUM=/absolute/path/to/chromium npm run qa:packaging:browser
```

Upgrade QA needs the original complete .37 source in a separate folder:

```bash
BOM_BASELINE_DIR=/absolute/path/to/Blue_Ocean_Market_V30_69_37 npm run qa:upgrade
```

PDF regression QA uses the existing CHROME_PATH runtime. Browser QA is not part of the backend release gate and must be run separately.

Rollback: stop writes and preserve the current database/uploads first. Before any new business activity, the pre-upgrade database, uploads/configuration and .37 source are the verified rollback point. After new activity, do not restore an old backup and lose records; reconcile subsequent operations and prefer a forward correction. Leave the additive columns in place; no destructive down-migration is supplied. Running .37 code against the upgraded database can overwrite missing English content during its old startup backfill, so use the consistent pre-upgrade backup for a full rollback or an authorized forward fix.

No live Render deployment or production reconciliation was performed during development.
