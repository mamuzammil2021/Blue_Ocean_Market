# Blue Ocean Market V30.25.2 Implementation Summary

## Purpose

V30.25.2 solves repeated testing resets without manually deleting/recreating the Render disk. It is a narrow maintenance release on top of V30.25.1 and does not change normal business workflows.

## Test Environment Reset Center

Location: **System Settings → Backup / Storage / Maintenance → Test Environment Reset**.

### Guard conditions

The backend refuses destructive reset/restore unless:

1. `APP_ENV=testing`
2. `ALLOW_TEST_DATA_RESET=true`
3. User is CEO/Owner or an authorized System Administrator with Storage permission
4. Current account password is correct
5. A reason is supplied
6. Exact destructive confirmation text is supplied

Reset phrase: `RESET TEST DATA`  
Restore phrase: `RESTORE TEST BACKUP`

### Quick Reset

Preserves configuration/authentication layers including users/access, Business Units, System Settings/secrets, approval rules, Accounting COA/company financial accounts, numbering definitions/overrides and selected rule configuration. Operational/test data, sequences and uploads are cleared. The current authenticated CEO/System Admin can remain signed in.

### Full Clean Reset

Creates an automatic pre-reset snapshot, queues a reset marker and restarts the service. Before SQLite opens on the next startup, the server removes `blue-ocean.sqlite` plus WAL/SHM, clears uploads, then normal database bootstrap/migrations build a fresh database. `ADMIN_EMAIL` and `ADMIN_PASSWORD` must be configured so the CEO account can be recreated.

### Full Reset + Demo

Same as Full Clean Reset, with the existing `SEED_DEMO_USERS` and `SEED_DEMO_DATA` behavior enabled for that startup. `DEMO_USER_PASSWORD` must be configured with at least 12 characters.

### Restore Last Pre-Reset Backup

Resolves the latest valid pre-reset snapshot, creates a safety snapshot of the current state, queues restore and restarts. Startup validates that the requested source is inside the authorized pre-reset backup directory, restores the SQLite file and replaces uploads with that snapshot.

### Clear Uploads Only

This action is refused if key operational tables still contain records. This prevents creating database records whose evidence files were intentionally deleted. Use Quick Reset or Full Reset when operational data exists.

## Automatic pre-reset backup design

Each snapshot is stored under:

`<DATA_DIR>/backups/pre-reset/<timestamp-operation>/`

and contains:

- `blue-ocean.sqlite`
- `uploads/` snapshot
- `manifest.json` with action, actor, date, reason, DB size and upload statistics

`TEST_RESET_BACKUP_RETENTION` defaults to **3** and is hard-clamped to **2–3**, so even a mistaken larger environment value cannot accumulate unlimited reset snapshots.

The persistent disk itself is never formatted or detached. Full resets clear only the active database files and active uploads; automatic pre-reset snapshots remain under the data backup directory.

## Environment examples

Dedicated test/staging service:

```env
APP_ENV=testing
ALLOW_TEST_DATA_RESET=true
TEST_RESET_BACKUP_RETENTION=3
```

Production:

```env
APP_ENV=production
ALLOW_TEST_DATA_RESET=false
```

## Acceptance

Source/static and Render persistence QA are release gates. Runtime smoke still requires a normal Node 22 installation with dependencies (`npm ci && npm run qa:runtime`). A real test reset should first be exercised on the dedicated Render test service, never on Production.
