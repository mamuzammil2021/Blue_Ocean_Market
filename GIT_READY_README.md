# Git-ready package

Release baseline: **V30.26.3 Accounting-only Posting Control + Excavator Follow-up Integrity**.

This package is ready to extract into the root of the existing Blue Ocean Market Git repository and push to Render. It excludes runtime databases, uploaded company files, runtime reset backups, `node_modules`, `.env`, secrets and local caches.

Render persistence remains under `/var/data`:

- SQLite/database backups: `/var/data/data`
- Attachments/evidence/PDFs: `/var/data/uploads`
- Automatic development/test pre-reset snapshots: `/var/data/data/backups/pre-reset`

For the dedicated non-production development/testing Render service:

```env
APP_ENV=development
ALLOW_TEST_DATA_RESET=true
TEST_RESET_BACKUP_RETENTION=3
```

`APP_ENV=testing` is also accepted. Production must remain `APP_ENV=production` and `ALLOW_TEST_DATA_RESET=false`.

Git update example:

```bash
git status
git add -A
git commit -m "V30.26.3 posting control and Excavator UI integrity hotfix"
git push
```

See `RENDER_DEPLOYMENT.md`, `V30_26_2_IMPLEMENTATION_SUMMARY.md`, `V30_26_1_IMPLEMENTATION_SUMMARY.md` and `V30_26_IMPLEMENTATION_SUMMARY.md`.

V30.26.3 adds the protected reset-submission hotfix for Render development/testing while preserving the V30.26.2 business baseline.
