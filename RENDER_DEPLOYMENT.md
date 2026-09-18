# V30.38.1 Render Deployment

V30.38.1 is a focused no-schema point release on protected V30.38.0. Preserve the existing database, uploaded files, backups, environment secrets and persistent disk.

## Required runtime

- Node.js 22.x
- Existing Render Web Service
- Existing persistent disk mounted at `/var/data`
- Existing environment variables/secrets unchanged

## Before deploy

```bash
npm ci
npm run qa:v3381
npm run qa:current
npm run qa:render
npm run qa:runtime
```

## Deploy

Deploy the Git commit/branch containing V30.38.1 (or `main` after its pull request is merged) using **Manual Deploy → Deploy latest commit**. Do not delete/recreate the persistent disk and do not reset the database/uploads.

## Post-deploy acceptance

Confirm `/api/health` reports version `30.38.1`, then verify:

- existing operational data and uploaded evidence remain present;
- Buy Machine → Token Payment shows usable Pay From and Paid To selectors;
- Add / Manage Accounts opens the shared Supplier Accounts manager and returns to Buy Machine;
- Sell Machine corrected valid fields clear stale red validation immediately;
- `/api/health` continues to report persistent storage mounted/writable.

## Test reset environment safety (retained)

For the dedicated development/testing service only, the guarded test reset can be enabled with:

```text
APP_ENV=development
ALLOW_TEST_DATA_RESET=true
```

For production, keep reset disabled:

```text
APP_ENV=production
ALLOW_TEST_DATA_RESET=false
```

Do not enable the development reset flags on the production service.

## Reset backup retention (retained)

Keep:

```text
TEST_RESET_BACKUP_RETENTION=3
```

The application hard-limits pre-reset retention to 2 or 3 snapshots. Production must keep `ALLOW_TEST_DATA_RESET=false`; any pre-reset workflow is development/testing only.

## Persistence verification after deploy

Open `/api/health` and confirm:

```text
persistent_storage:true
```

Also confirm `disk_mount_detected:true` and `storage_writable:true` where shown. In the testing environment, enter a harmless test record/upload, perform a manual redeploy, and confirm the record/upload remains present afterward.
