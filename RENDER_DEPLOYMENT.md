# V30.39.2 Render Deployment

V30.39.2 is a core runtime/data-path optimization release built on V30.39.1. Preserve the existing database, uploaded files/evidence, backups, environment secrets and persistent disk. There is no destructive reset; changes are additive targeted indexes plus idempotent migration-ledger bookkeeping.

## Required runtime
- Node.js 22.x
- Existing Render Web Service
- Existing persistent disk mounted at `/var/data`
- Existing environment variables/secrets unchanged

Optional diagnostics remain:
```text
BOM_SLOW_REQUEST_MS=750
BOM_LARGE_RESPONSE_BYTES=1048576
BOM_SQL_PROFILE=false
BOM_SLOW_SQL_MS=250
BOM_ACCESS_CACHE_MS=5000
```
Keep SQL profiling off unless diagnosing performance because it adds diagnostic overhead.

## Before deploy
```bash
npm ci
npm run qa:v3392
npm run qa:v3392:browser   # optional where Chromium/Playwright are available
npm run qa:v3391
npm run qa:v339
npm run qa:v336:handlers
npm run qa:current
npm run qa:render
npm run qa:runtime
```

## Deploy
Deploy the Git branch containing V30.39.2 using **Manual Deploy → Deploy latest commit**. Do not delete/recreate the persistent disk and do not reset the database/uploads.

## Post-deploy acceptance
Confirm `/api/health` reports version `30.39.2`, then verify:
- existing operational data/evidence remain present and persistence health remains true;
- slow page opens show skeleton placeholders immediately instead of a blank/unchanged page;
- Excavator Machines/Buyers/Suppliers show 25/50/100 server paging and search/filter before paging;
- on Excavator Operations, machine rows may appear before KPI summary if the summary is slower; one section does not block the other;
- Buyer Detail opens before receiver Accounts are loaded; Accounts load only when selected;
- Supplier Overview opens immediately and core supplier/machine + statement reads progress independently; Requirements/Accounts load on demand;
- failed secondary sections show their own Retry state rather than blanking the whole page;
- normal Save/Payment/Update actions retain the V30.39 immediate processing feedback/idempotency protections;
- Finance Control Center shows real 25/50/100 server paging and filters/search before paging; transaction rows can appear before the independent correction queue finishes;
- repeated page reads no longer trigger Accounting queue drains or operational-alert generation;
- `/api/performance/v3392/health` (authorized) exposes event-loop lag, Accounting queue depth/age, access-cache TTL, migrations and memory;
- browser loads `runtime-v30392.js`, not the historical patch files separately.

## Test reset environment safety (retained)
For dedicated development/testing only: `APP_ENV=development` and `ALLOW_TEST_DATA_RESET=true`. Production must keep `APP_ENV=production` and `ALLOW_TEST_DATA_RESET=false`. Keep `TEST_RESET_BACKUP_RETENTION=3`.


## Persistent storage verification (retained)
After deployment, verify `/api/health` includes `persistent_storage:true` and that the disk is mounted/writable. Perform a **manual redeploy** and confirm previously entered test data and uploaded evidence are still present.

Reset safety is retained: production keeps `ALLOW_TEST_DATA_RESET=false`. Development/testing reset creates a **pre-reset** backup under the existing retention rule before destructive reset actions.
