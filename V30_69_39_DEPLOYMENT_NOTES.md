# V30.69.39 deployment, migration and rollback

Use Node 22 and the complete .39 source. Keep the existing DATA_DIR, UPLOAD_DIR, SQLite filename, persistent disk mount, JWT/SMTP settings and all financial settings. The existing Dockerfile includes Chromium and Korean fonts. Do not reset or delete the Render disk, database or uploads.

1. Pause business writes. In the existing application environment, back up the actual SQLite database using its backup API and preserve the corresponding uploads/configuration securely. Use absolute paths matching your deployment:

```bash
node scripts/backup-database.js /absolute/data/blue-ocean.sqlite /absolute/backups/before-v306939.sqlite
node scripts/packaging-reconcile.js /absolute/data/blue-ocean.sqlite > /absolute/backups/before-v306939.json
```

Back up uploads with your existing backup process while writes remain paused. Keep backups outside the source repository. Do not copy an actively written SQLite file without handling its WAL.

2. Deploy the new Git branch to a Render testing service, preferably using a backed-up database copy. Preserve the configured disk paths. For a native Node service, install with `npm ci` and use the existing `npm start`; for Docker, keep the existing Docker deployment. No new secret or payment-policy value is required.
3. Normal startup applies existing additive schema checks. There is no separate destructive .39 migration command. .39 changes legacy integrity handling to detection/review; it must not silently void or reverse financial records. Restart is safe, as tested against .38 fixtures.
4. Confirm `/api/health` reports `30.69.39`. Before allowing new writes, capture and compare another reconciliation snapshot:

```bash
node scripts/packaging-reconcile.js /absolute/data/blue-ocean.sqlite > /absolute/backups/after-v306939.json
```

Compare material stock, movements, receipt counts, supplier outstanding/advances, Finance totals/statuses, journal totals/statuses, source IDs and foreign keys. Investigate any change before permitting writes. Inspect existing Finance integrity cases rather than using an automatic bulk repair.
5. Test: material dropdown/custom values and unused deletion parent; cart add/edit/remove/refresh/save/back; one-supplier multi-line purchase; separate partial receiving and payment; advance-only import Supplier Payments and full History; supplier allocations/Pay Outstanding; Finance approval/verification and controlled Accounting reversal; Raw Salt search; Production/Product/Families/Lots navigation and visible actions; EN/KR and mobile. Test staging SMTP separately.

## Reproduce QA

```bash
npm ci
npm run qa:release
```

The financial/PDF regression suite needs Chrome/Chromium. Set `CHROME_PATH` if it is not in a standard location. To run the same browser and upgrade gate, provide Playwright and Chromium and the extracted protected .38 source:

```bash
npm install --no-save --package-lock=false playwright@1.62.1
CHROME_PATH=/absolute/path/to/chromium \
BOM_CHROMIUM=/absolute/path/to/chromium \
BOM_BASELINE_DIR=/absolute/path/to/Blue_Ocean_Market_V30_69_38 \
node qa/qa_v36939_release.js --browser --upgrade
```

Use a browser version compatible with the installed Playwright; this build was verified with Chromium headless shell 136.0.7103.25. Tests create disposable databases; do not point test fixture configuration at production. Current results are in `qa/evidence/36939-*.json`; older version-specific tests/evidence remain for historical reference.

## Rollback

Stop writes and preserve the current database/uploads before any rollback. Before new business activity, restore the consistent pre-upgrade .38 database/uploads/configuration and deploy the protected .38 source. After new activity, an old backup would discard new records: reconcile those operations and prefer a forward fix. Do not drop tables/columns or delete journal/payment rows. .38 contains the former automatic integrity routines; avoid restarting it against unresolved legacy cases without reviewing that behavior. No destructive down-migration is supplied.

No branch has been pushed and no Render service has been changed by this delivery.
