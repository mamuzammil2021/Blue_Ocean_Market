# V30.36.0 Render Deployment

V30.36.0 is an additive/no-schema browser-audit and UX-hardening release on the protected V30.35.0 baseline. Preserve the existing database, uploaded files, backups and persistent disk.

## Required runtime

- Node.js 22.x
- Existing Render Web Service
- Existing persistent disk mounted at `/var/data`
- Existing environment variables/secrets unchanged

## Before deploy

```bash
npm ci
npm run qa:current
npm run qa:v333
npm run qa:render
npm run qa:runtime
```

## Deploy

Point the Render service to the V30.33 Git branch and use **Manual Deploy → Deploy latest commit**. Do not delete/recreate the persistent disk and do not reset the database/uploads.

## Post-deploy acceptance

Confirm `/api/health` reports `30.34.0`, existing data remains present, and common Save/Update/Payment/Void actions show local section loading rather than repeated whole-screen refresh/flicker.

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

Open `/api/health` and confirm the Render service reports:

```text
persistent_storage:true
```

Also confirm `disk_mount_detected:true` and `storage_writable:true` where shown. Enter a harmless test record/upload in the testing environment, perform a **manual redeploy**, and confirm the record/upload is still present afterward. This verifies the service is actually using the persistent disk rather than ephemeral storage.
