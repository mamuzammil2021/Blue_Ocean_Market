# Blue Ocean Market V30.20.0 — Git / GitHub Deployment Guide

This folder is source-control ready. It intentionally excludes `.env`, `node_modules`, live `data/`, live `uploads/`, SQLite databases and ZIP archives.

## Recommended branch

`v30.20-smart-payments-settings-ux`

## Push into the existing repository

From Terminal on macOS, go to your existing Blue Ocean Market repository and update `main` first:

```bash
git checkout main
git pull origin main
```

Create/switch to the release branch:

```bash
git checkout -B v30.20-smart-payments-settings-ux
```

Copy the **contents** of this Git-ready folder into the repository root. Do not copy the outer folder itself. Do not copy any `.env`, `data`, `uploads`, or `node_modules` from an old local installation.

Then review and push:

```bash
git status
git add -A
git status
git commit -m "Blue Ocean Market V30.20.0 - Smart Payments and System Settings UX"
git push -u origin v30.20-smart-payments-settings-ux
```

Open a pull request from `v30.20-smart-payments-settings-ux` into `main` on GitHub.

## Before production deployment

Configure production environment variables outside Git: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NODE_ENV=production`, `LOCAL_TEST_MODE=false`, `DATA_DIR`, and `UPLOAD_DIR`. Use persistent storage for both data and uploads.

For a Render persistent disk mounted at `/var/data`, typical values are:

```text
DATA_DIR=/var/data/data
UPLOAD_DIR=/var/data/uploads
```

The included Dockerfile installs the build dependencies required by `better-sqlite3` before `npm ci`.

Recommended validation after cloning/pulling:

```bash
npm ci
npm run qa:current
npm run qa:runtime
```

Do not deploy SQLite or uploaded business documents to an ephemeral filesystem.
