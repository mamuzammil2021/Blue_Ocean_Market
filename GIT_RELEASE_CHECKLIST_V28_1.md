# Git and Render Release Checklist — V28.1.0

## 1. Back up the currently deployed service

Before copying or deploying V28.1.0, back up:

- `blue-ocean.sqlite`
- `blue-ocean.sqlite-wal` and `blue-ocean.sqlite-shm` when present
- the complete uploads/evidence directory
- the current Render environment-variable list (never commit secret values)

Do not remove or replace the existing Render persistent disk.

## 2. Put V28.1.0 into the existing repository

Open the existing repository that Render already deploys, update its stable branch locally, and create a release branch:

```bash
git switch main
git pull --ff-only origin main
git switch -c release/v28.1.0
```

Copy the **contents** of the V28.1.0 release folder into that repository root. Keep the repository's existing `.git` directory. Do not put the release folder itself one level below the repository root.

Confirm the project files are at the repository root:

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
npm run qa:v281:runtime
npm start
```

Open `http://localhost:3000/api/health` and confirm that it returns `"version":"28.1.0"`.

Check that secrets and runtime data are not staged:

```bash
git status --short
git check-ignore .env data/blue-ocean.sqlite uploads/example node_modules/example
```

## 4. Commit and push

```bash
git add .
git status --short
git commit -m "Release V28.1.0 action matching and finance controls"
git push -u origin release/v28.1.0
```

Create a pull request into the branch Render deploys. For a separate live test, configure a Render preview/test service for `release/v28.1.0`; do not point a test service at the production database or uploads.

## 5. Render configuration

- Runtime: Node, or Docker using the included `Dockerfile`
- Node build command: `npm ci --omit=dev`
- Start command: `npm start`
- Health check path: `/api/health`
- Node version: `22.x` (also pinned in `package.json`)
- Required secret: a long random `JWT_SECRET`
- Initial-admin variables: `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Recommended persistent-disk mount: `/var/data`
- Database path: `DATA_DIR=/var/data/data`
- Evidence/upload path: `UPLOAD_DIR=/var/data/uploads`

The server creates the two subdirectories automatically. Use one persistent disk mounted at `/var/data` so both SQLite and uploaded evidence survive restarts and deployments.

## 6. Live acceptance checks

- `/api/health` reports V28.1.0.
- Korean is the default and every tested screen, dialog, validation, notification and error changes completely when English is selected.
- Desktop sidebar stays fixed; its menu scrolls independently; the active item remains visible.
- Mobile drawer, forms, dialogs, cards and tables remain usable at phone widths.
- Clicking an already selected module refreshes it; create/update/delete refreshes screen data and counters.
- Sidebar badges appear only for relevant pending actions and disappear when resolved.
- Buyer and Supplier Requirements expose the same fields.
- Matching uses type/name, make, model, year/range, condition and budget—not location.
- Match notifications are not duplicated and exchange proposals save correctly.
- Every Excavator payment path rejects records without receipt/evidence.
- Regular users see only their own Finance entries; CEO/Finance reviewers see permitted unit data.
- Finance correction reaches only the original creator, exposes the correct source fields and updates both source and Finance records.
- Correction reminders, history, linked Tasks, verification resolution and People & Performance tracking work.

If any acceptance check fails, roll back the deployed commit and restore from the pre-deployment backup if data migration or writes occurred.
