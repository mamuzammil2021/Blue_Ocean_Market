# Git and Render Release Checklist — V28.3.0

## 1. Back up the current Render service

Back up `blue-ocean.sqlite`, its `-wal`/`-shm` files when present, and the complete uploads/evidence directory. Record environment-variable names without copying secret values. Do not remove or replace the existing persistent disk.

## 2. Copy V28.3 into the existing repository

```bash
git switch main
git pull --ff-only origin main
git switch -c release/v28.3.0
```

Copy the **contents** of the V28.3 release folder into the repository root, keeping the repository's `.git` directory. Do not copy `node_modules`, `data`, `uploads`, `.env`, or the release ZIP.

```bash
test -f package.json
test -f server/server.js
test -f public/index.html
```

## 3. Verify locally with Node 22

```bash
node --version
npm ci --omit=dev
npm run qa:current
npm run qa:v283:runtime
npm start
```

Confirm `http://localhost:3000/api/health` returns `"version":"28.3.0"`.

For development accounts/sample data, set unique values in your shell or Render test environment:

```bash
export SEED_DEMO_USERS=true
export DEMO_USER_PASSWORD='your unique test password with at least 12 characters'
export SEED_DEMO_DATA=true
```

Use single quotes around passwords containing `!` in Bash. These settings are additive and never wipe the database.

## 4. Commit and push

```bash
git status --short
git add .
git commit -m "Release V28.3.0 approval execution and CEO direct control"
git push -u origin release/v28.3.0
```

Open a pull request into the branch Render deploys. A separate Render test service should use its own disk/database/uploads, not production storage.

## 5. Render settings

- Build command: `npm ci --omit=dev`
- Start command: `npm start`
- Health check: `/api/health`
- Runtime/Node: `22.x`
- `JWT_SECRET`: random value of at least 32 characters
- `ADMIN_EMAIL`: your administrator email
- `ADMIN_PASSWORD`: unique value of at least 12 characters
- Persistent disk mount: `/var/data`
- `DATA_DIR=/var/data/data`
- `UPLOAD_DIR=/var/data/uploads`

For the current development/test phase, also configure the three demo variables above. Disable the seed flags for a later production/final release; disabling does not delete existing test data.

## 6. Live acceptance

- Health reports V28.3.0 and Korean is default; English switching is complete.
- CEO controlled actions show a confirmation, require a note, execute immediately, and appear in history.
- Delegated buyer-payment void moves Finance→CEO and automatically reverses payment, allocation, and Finance.
- Finance-originated dual requests go directly to CEO and cannot be self-reviewed.
- Verified Finance changes require approval, then create a visible task for the original creator with source-specific editable fields.
- Material buyer refunds require evidence, follow approval, post to Finance, and can be voided with balance restoration.
- Approval/Finance/Tasks badges appear only for relevant pending work and disappear when resolved.
- Regular users see only their Finance entries; Finance/CEO see permitted company scope.
- Desktop sidebar is fixed; mobile drawer, tables, forms, and dialogs are usable.
- Clicking the active module and every successful mutation refreshes data/counters.

If acceptance fails, roll back the deployed commit. Restore the backup if the failed deployment performed live writes or migrations.
