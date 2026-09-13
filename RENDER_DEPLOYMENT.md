# Blue Ocean Market — Git + Render Persistent Disk Deployment

This package is prepared for the existing paid Render web service and an attached persistent disk.

## Required Render disk
Use **one persistent disk** mounted at exactly:

`/var/data`

The application stores:
- SQLite database + WAL/SHM + in-app backups: `/var/data/data`
- Attachments, receipts, evidence and generated PDFs: `/var/data/uploads`

Only files below the disk mount survive Render restarts/redeploys. Do not store runtime data in `/app/data` or `/app/uploads` on Render.

## Existing Render service — recommended settings
Keep the existing paid service. In **Environment**, set:

- `RENDER_PERSISTENT_ROOT=/var/data`
- `DATA_DIR=/var/data/data`
- `UPLOAD_DIR=/var/data/uploads`
- `RENDER_REQUIRE_PERSISTENT_DISK=true`
- existing `JWT_SECRET`
- existing `APP_ENCRYPTION_KEY`
- existing `ADMIN_EMAIL`
- existing `ADMIN_PASSWORD`
- `LOCAL_TEST_MODE=false`
- `SEED_DEMO_USERS=false`
- `SEED_DEMO_DATA=false`

For a custom domain also set `APP_BASE_URL=https://your-domain`. For the normal Render URL, the app can use `RENDER_EXTERNAL_URL` automatically.

Set Render **Health Check Path** to `/api/health`.

## Important: preserve any current ephemeral test data BEFORE first disk-aware redeploy
If the current Render instance still has data you care about and the disk is already mounted at `/var/data`, open the current service **Shell** and copy it before pushing this release. A safe SQLite backup can be made with the running application's installed `better-sqlite3` package.

After this package is on the service, `npm run render:migrate-storage` can migrate from local `./data` and `./uploads` to `/var/data`, but an old instance's ephemeral filesystem is not available after it has already been replaced.

## Deployment verification
1. Push the repository branch connected to Render.
2. Confirm deploy logs include a `[storage]` line showing `/var/data`, `/var/data/data`, `/var/data/uploads`, `disk_mount_detected=true`, and `writable=true`.
3. Open `/api/health` and verify `persistent_storage:true`, `disk_mount_detected:true`, and `storage_writable:true`.
4. Add a harmless test record and attachment.
5. Trigger a manual redeploy.
6. Confirm the record and attachment remain.

## Git update workflow
This ZIP is intentionally repo-ready and contains no `.git` directory, database, uploads, node_modules, or secrets. Copy/extract its contents into the existing repository working tree, then:

```bash
git status
git add -A
git commit -m "V30.24.3 Render persistent storage ready"
git push
```

## Operational note
SQLite + a Render persistent disk is appropriate for the current single-instance testing/early-live setup. A Render service with a disk is single-instance storage and deploys have brief downtime. If Blue Ocean later needs horizontal scaling or multiple app instances, migrate the main database to managed Postgres and attachments to shared object storage.
