# Git and Render Release Checklist — V28.2.0

## 1. Back up the live service

Before copying or deploying V28.2.0, back up:

- `blue-ocean.sqlite`
- `blue-ocean.sqlite-wal` and `blue-ocean.sqlite-shm` when present
- the complete uploads/evidence directory
- the current Render environment-variable names and settings (never commit secret values)

Do not remove or replace the existing Render persistent disk.

## 2. Put V28.2.0 in the existing repository

From the repository that Render already deploys:

```bash
git switch main
git pull --ff-only origin main
git switch -c release/v28.2.0
```

Copy the **contents** of the V28.2.0 release folder into the repository root. Keep the existing `.git` directory. Do not copy `node_modules`, local database files, uploads, `.env`, or a previous release ZIP.

Confirm the layout:

```bash
test -f package.json
test -f server/server.js
test -f public/index.html
```

## 3. Verify before committing

Use Node.js 22.x:

```bash
node --version
npm ci --omit=dev
npm run qa:current
npm run qa:v282:runtime
npm start
```

Open `http://localhost:3000/api/health` and confirm `"version":"28.2.0"`.

Check ignored runtime data and secrets:

```bash
git status --short
git check-ignore .env data/blue-ocean.sqlite uploads/example node_modules/example
```

## 4. Commit and push

```bash
git add .
git status --short
git commit -m "Release V28.2.0 approval and finance integrity"
git push -u origin release/v28.2.0
```

Create a pull request into the branch Render deploys. For a separate live test, create a Render test service for `release/v28.2.0`; never connect the test service to the production database or uploads.

## 5. Render configuration

- Runtime: Node, or Docker with the included `Dockerfile`
- Build command: `npm ci --omit=dev`
- Start command: `npm start`
- Health check path: `/api/health`
- Node version: `22.x`
- Required secret: a random `JWT_SECRET` of at least 32 characters
- Initial administrator: `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 12 characters)
- Persistent disk mount: `/var/data`
- Database path: `DATA_DIR=/var/data/data`
- Evidence path: `UPLOAD_DIR=/var/data/uploads`

The server creates both subdirectories. Keeping both on one persistent disk ensures that SQLite data and uploaded evidence survive deployments and restarts.

## 6. Live acceptance checks

- `/api/health` reports V28.2.0.
- Korean is the default; switching to English changes every system label, dialog, validation, notification, and error. User-entered content remains unchanged.
- Desktop sidebar stays fixed, its menu scrolls independently, and the selected module remains visible; the mobile drawer and content are usable at phone widths.
- Clicking the active module refreshes it; every successful create/update/delete/workflow action refreshes data and counters.
- Badges appear only when the signed-in user has pending work and disappear when resolved.
- Notifications show all unread items first and newest items first in each group.
- Buy Machine succeeds without payment fields when token is zero; a positive token requires date, reference, and evidence.
- Finance reviewers see only Verify, Request Correction, and Request Void.
- A requester cannot approve their own request; dual approval requires Finance before CEO.
- A correction reaches only the original creator, exposes source-specific fields, retains history, and updates source and Finance together on resubmission.
- Approved large Finance requests create the entry once and retain evidence.
- Approved voids update supported linked records once and preserve the audit trail.
- Regular users see only Finance entries they created; Finance/CEO users see only their authorized scope.
- Correction reminders, Tasks, performance tracking, and action counters work and clear when resolved.

If an acceptance check fails, roll back the deployed commit. Restore the pre-deployment database/uploads backup if any live migration or write occurred.
