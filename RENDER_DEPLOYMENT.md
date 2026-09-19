# V30.39.0 Render Deployment

V30.39.0 is a performance-foundation release built on protected V30.38.2. Preserve the existing database, uploaded files/evidence, backups, environment secrets and persistent disk. There is no destructive data migration/reset; database changes are additive indexes plus safe runtime PRAGMA tuning.

## Required runtime

- Node.js 22.x
- Existing Render Web Service
- Existing persistent disk mounted at `/var/data`
- Existing environment variables/secrets unchanged

Optional diagnostics:

```text
BOM_SLOW_REQUEST_MS=750
BOM_LARGE_RESPONSE_BYTES=1048576
BOM_SQL_PROFILE=false
BOM_SLOW_SQL_MS=250
```

Keep SQL profiling off unless diagnosing performance because it adds diagnostic overhead.

## Before deploy

```bash
npm ci
npm run qa:v339
npm run qa:v336:handlers
npm run qa:current
npm run qa:render
npm run qa:runtime
```

## Deploy

Deploy the Git commit/branch containing V30.39.0 (or `main` after merge) using **Manual Deploy → Deploy latest commit**. Do not delete/recreate the persistent disk and do not reset the database/uploads.

## Post-deploy acceptance

Confirm `/api/health` reports version `30.39.0`, then verify:

- existing operational data and uploaded evidence remain present;
- `persistent_storage:true`, `disk_mount_detected:true` and `storage_writable:true` remain healthy;
- on a throttled/slow connection, Save/Payment/Update actions immediately show a busy/processing state instead of appearing dead;
- repeated clicks while an action is processing do not create duplicate submissions;
- successful child mutations preserve/refresh the intended parent context without broad page flashing;
- the browser loads the consolidated `runtime-v3039.js` rather than separate historical version patch scripts;
- gzip-capable requests receive compressed hot JS/API responses where applicable;
- ordinary operations remain responsive while PDF generation is running;
- `/api/v339/performance/health` is available only to an authorized user and shows request diagnostics.

## Test reset environment safety (retained)

For a dedicated development/testing service only:

```text
APP_ENV=development
ALLOW_TEST_DATA_RESET=true
```

For production keep reset disabled:

```text
APP_ENV=production
ALLOW_TEST_DATA_RESET=false
```

Do not enable development reset flags on production.

## Reset backup retention (retained)

Keep:

```text
TEST_RESET_BACKUP_RETENTION=3
```

The application hard-limits pre-reset retention to 2 or 3 snapshots. Production must keep `ALLOW_TEST_DATA_RESET=false`.

## Persistence verification after deploy

Open `/api/health` and confirm:

```text
persistent_storage:true
```

In the testing environment, enter a harmless test record/upload, perform a **manual redeploy**, and confirm the record/upload remains present afterward.
