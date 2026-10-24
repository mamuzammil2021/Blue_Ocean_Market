# V30.69.42 — Mac Git push, staging and rollback

This recovered source is based on saved V30.69.42 checkpoint `c5e71737d2c217cf8072984fb2fed5562bc7e062dd038ed47dd2d5a80c8b3b5b`, with fresh recovery QA. All 98 server JavaScript files match protected V30.69.39. The prior final ZIP and its execution evidence were unavailable; their acceptance claims are not reused here. Use Node 22.x. Source branch: `feature/v30.69.42-tabler-recovery`. Main and remote services were not modified.

## Download and extract

Save `Blue_Ocean_Market_V30_69_42_TABLER_MIGRATION_GIT_READY.zip` in Downloads. Verify against SHA256SUMS, then:

```bash
cd ~/Downloads
shasum -a 256 Blue_Ocean_Market_V30_69_42_TABLER_MIGRATION_GIT_READY.zip
mkdir -p BlueOceanV306942
unzip Blue_Ocean_Market_V30_69_42_TABLER_MIGRATION_GIT_READY.zip -d BlueOceanV306942
```

## Clone and inspect

```bash
cd ~/Documents
git clone https://github.com/mamuzammil2021/Blue_Ocean_Market.git Blue_Ocean_Market_V306942
cd Blue_Ocean_Market_V306942
git fetch origin
git status --short
git log -5 --oneline origin/main
node -p "require('./package.json').version"
```

Status should be empty. Inspect origin/main for any newer or unrelated changes beyond protected V30.69.39 and prior UI builds. Reconcile those before copying this full source tree; do not overwrite newer business work. The following branch command reads origin/main and creates only a feature branch.

## New branch and copy

```bash
git switch -c feature/v30.69.42-tabler-recovery origin/main
rsync -av \
  --exclude='.git/' \
  --exclude='.env' \
  --include='.env.example' \
  --exclude='.env.*' \
  --exclude='data/' \
  --exclude='uploads/' \
  --exclude='backups/' \
  --exclude='node_modules/' \
  --exclude='*.sqlite*' \
  --exclude='*.db*' \
  ~/Downloads/BlueOceanV306942/Blue_Ocean_Market_V30_69_42/ ./
```

If the branch already exists, inspect it and use a unique suffix; do not reset or force-push. No application source file was deleted in this migration; duplicate function removals are within updated files. The removed checkpoint-only `diagnose42.cjs` is a disposable QA probe, not application code. Do not use rsync --delete on runtime directories.

## Validate and commit

```bash
node --version
node -p "require('./package.json').version"
npm ci
npm run build:ui
npm run qa:current
git diff --check
git status --short
git diff --stat
git add -A
git diff --cached --check
git diff --cached --name-only
git diff --cached --stat
git commit -m "Recover V30.69.42 Tabler workflow migration and verified QA"
git push -u origin feature/v30.69.42-tabler-recovery
```

Node must be 22.x; application version must be 30.69.42. Before committing, verify staged files contain no private .env, runtime data, uploads, backups, node_modules or databases. `qa:current` is the automated non-browser release gate. Full browser commands/environment and acceptance results are documented in QA_RESULTS_AND_SCREENSHOT_INDEX.md. The ZIP omits `.git`; your clone supplies repository history. No command above pushes or modifies main.

## Render testing deployment

Select the new feature branch on the Render TESTING service. Back up its current database and attachments before deployment. Use existing secrets/configuration and existing persistent disk mount; retain DATA_DIR/UPLOAD_DIR. Install with `npm ci --omit=dev`; start via `npm start`; precompiled UI assets are supplied. Keep Node 22.x. Verify authenticated application version and frontend-integrity/health checks, direct URLs and all required roles/BU scopes. Never delete/reset the persistent disk or database.

Perform staging acceptance with realistic business data: KRW/USD/PKR/cross-currency settlements, approval-before-verification, Finance/Accounting postings and corrections, supplier/customer statements, packaging receipt/production/FEFO, EN/KR exports/PDFs/native printing, target-host fonts and real keyboard/assistive-technology use. This recovery adds no schema migration or server-policy change. The browser/PDF QA host used a Playwright Chromium PDF CLI adapter; native Render Chromium printing remains a target-host acceptance check.

## Rollback

Restore the prior accepted service commit/branch and its compiled assets. Stop writes before any database restore. If only reverting this UI release, no new migration needs undoing. If staging operations have created records, assess them before restoring a backup; coordinate database and attachments to the same point in time. Do not erase valid post-backup transactions or revert business migrations blindly. Production deployment and merging require separate acceptance.
