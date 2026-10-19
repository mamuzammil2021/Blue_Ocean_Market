# V30.69.37 upgrade and rollback

Baseline: complete protected V30.69.36. Use Node 22 and the existing locked dependencies/service configuration. Keep the existing DATA_DIR, UPLOAD_DIR, database path, JWT/SMTP configuration and persistent disk.

There is **no new database schema migration** for .37. Existing startup migrations remain retry-safe. List statuses are derived from the existing ledgers, not new stored balances. Existing purchases are not auto-confirmed, reapproved, received or paid during upgrade. New UI purchases request confirmation within their create transaction; older/API draft workflows remain supported.

Before deploying, pause writes and back up the actual database and all uploads/evidence. The existing tools are included:

```bash
node scripts/backup-database.js \
  /absolute/current/blue-ocean.sqlite \
  /absolute/backups/before-v306937.sqlite

node scripts/packaging-reconcile.js \
  /absolute/current/blue-ocean.sqlite \
  > /absolute/backups/before-v306937.json
```

Use the existing testing-service deployment procedure. `npm ci`, then normal `npm start`; confirm `/api/health` reports `30.69.37`. While writes remain paused, take another read-only reconciliation snapshot and compare original-field hashes, quantities, supplier advances and foreign-key results. Only the generation timestamp should differ before new business activity.

Test Materials row actions, normal purchase creation without a separate confirmation/approval step, optional drafts, configured exception approvals, list payment/receipt statuses, partial receiving and Receive All. Check the supplier Pay Outstanding flow, financial controls, browser refresh/Back, Korean and a phone-sized viewport. Do not reset the Render persistent disk or database.

For QA on disposable fixtures:

```bash
npm run qa:release
npm run qa:packaging:refinement
```

Browser QA needs Playwright and Chromium in the QA environment:

```bash
npm install --no-save --package-lock=false playwright
BOM_CHROMIUM=/absolute/path/to/chromium npm run qa:packaging:browser
```

Upgrade QA uses a separate extracted original .36 source folder:

```bash
BOM_BASELINE_DIR=/absolute/path/to/Blue_Ocean_Market_V30_69_36 \
  npm run qa:packaging:upgrade
```

PDF regression checks use the existing CHROME_PATH runtime.

Rollback: stop writes and retain the entire current database/uploads for investigation. Before new business activity, the pre-upgrade database, uploads/configuration and .36 code form the verified rollback point. After new .37 activity, do not restore an older database and lose those records. Reconcile all subsequent transactions and prefer a forward correction. No destructive down-migration is needed or supplied.

Live Render deployment, production reconciliation and real SMTP delivery were not performed during this build.
