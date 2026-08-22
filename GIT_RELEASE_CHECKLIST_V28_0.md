# Git and Render Release Checklist — V28.0.0

## Put V28.0.0 into the existing repository

1. Clone or open the existing Git repository that currently contains V26.4 or the latest tested release.
2. Create a release branch:

   ```bash
   git switch -c release/v28.0.0
   ```

3. Copy the **contents** of the V28.0.0 folder into the repository root. Keep the repository's `.git` directory; do not copy a parent folder around it.
4. Confirm that `.env`, `node_modules/`, `data/*.sqlite*` and `uploads/*` are not staged:

   ```bash
   git status --short
   git check-ignore .env data/blue-ocean.sqlite uploads/example node_modules/example
   ```

## Verify before committing

```bash
node --version        # must be v22.x
npm ci
npm run qa:current
npm start
```

Open `http://localhost:3000/api/health` and verify `"version":"28.0.0"`. Use a second terminal to run `npm run qa:v28:runtime` only against the local/dedicated test database.

Manually test Korean and English at desktop and mobile widths, especially the sidebar, Buyer Requirements, evidence validation, Finance Corrections, notifications and People & Performance.

## Commit and push

```bash
git add .
git status --short
git commit -m "Release V28.0.0 mobile evidence and finance corrections"
git push -u origin release/v28.0.0
```

Create a pull request into the branch used by the existing Render service, or temporarily configure Render to deploy `release/v28.0.0` for live testing.

## Render settings

- Runtime: Node, or Docker with the included Dockerfile.
- Build command for Node runtime: `npm ci`
- Start command: `npm start`
- Health check: `/api/health`
- Required secret: a long, random `JWT_SECRET`
- Recommended: set `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` before the first database startup.
- Node version: 22.x (also pinned in `package.json`).

SQLite and uploaded evidence use local files. Attach persistent storage for both `data/` and `uploads/`, or migrate them to managed persistent services. Never delete or replace an existing Render disk while testing an upgrade. Back up the database and uploads before deploying V28.0.0 over existing data.

## Live acceptance checks

- `/api/health` reports V28.0.0.
- Korean selection shows no English system text on tested screens and errors; English selection remains complete.
- Mobile sidebar opens, closes and scrolls without obscuring content.
- Buyer Requirement fields save and supplier matches open.
- Payment saves fail without evidence and succeed with evidence.
- Successful saves do not show a false Unsaved Changes dialog.
- Finance correction reaches the record creator, can be resubmitted with evidence and closes after verification.
- Correction activity appears in People & Performance.
