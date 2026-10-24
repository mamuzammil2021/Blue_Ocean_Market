# V30.69.45 migration, staging, rollback and Git

## Migration and staging

Use Node 22.x. Retain the existing database/upload paths, JWT secret and persistent disk configuration. Before deployment, take and restore-test a consistent SQLite database and upload/evidence backup. Do not copy a live SQLite database without accounting for its WAL files; use the SQLite backup API or a stopped-writer backup.

Startup creates the two V45 issue tables, indexes, immutable-estimate trigger and migration-ledger row. It preserves existing V44 receiving, supplier, Finance and Accounting data. No historical issues/tasks/holds are inferred automatically. The upgrade suite exercises V44 receipts, quarantine, credits, allocation and an actual refund, and compares original rows across 269 tables and two startups.

Install the complete release, not isolated frontend files. Package/lock/cache keys/frontend manifest all identify V30.69.45.

```bash
node --version
npm ci
npm run build:ui
npm run qa:current
npm start
```

The full QA gate additionally uses `npm run qa:current -- --browser --upgrade`. Set `BOM_BASELINE_DIR` to an extracted protected V44 source root with dependencies. Playwright Chromium or `BOM_CHROMIUM`, a configured Chrome PDF renderer/Korean fonts and Poppler `pdftotext` are required for browser/PDF checks. Never run fixtures against production data.

On staging, verify exact and partial Import/Packaging receiving, later/investigate/split, bags versus net weight, condition/inspection, task ownership/follow-up, invoice estimates, approvals, supplier credit, actual refund, linked deliveries, controlled measurement correction, stock/BOM costs, pending indicators and receiving-button removal. Check EN/KR, deep refresh, retry/recovery, supplier statements and restart persistence.

Existing CEO Receiving & Claims Policy mappings remain in effect. Review Approved-versus-Posted credit availability and cross-currency permissions before real financial claims. Existing important-only opt-in email behavior remains unchanged; verify delivery with your configured SMTP on the target host.

## Rollback

After V45 activity exists, V44 does not understand the new task/hold projections. Do not simply run V44 against an active V45 database or drop the new tables. Prefer a controlled forward correction. For a full rollback, stop writers and restore the matching pre-upgrade database, uploads and V44 source together, then reconcile real activity after the backup.

## Push a new branch only

Download `Blue_Ocean_Market_V30_69_45_SIMPLE_RECEIVING_GIT_READY.zip` to Downloads.

```bash
cd ~/Downloads
mkdir -p BlueOceanV306945
unzip Blue_Ocean_Market_V30_69_45_SIMPLE_RECEIVING_GIT_READY.zip -d BlueOceanV306945
cd ~/Documents
git clone https://github.com/mamuzammil2021/Blue_Ocean_Market.git Blue_Ocean_Market_V306945
cd Blue_Ocean_Market_V306945
git fetch origin
git status --short
git log -5 --oneline origin/main
git switch -c v30.69.45-simple-receiving origin/main
rsync -av \
  --exclude='.git/' --exclude='.env' --exclude='.env.*' \
  --exclude='node_modules/' --exclude='data/' --exclude='uploads/' --exclude='backups/' \
  --exclude='*.sqlite' --exclude='*.sqlite-*' --exclude='*.sqlite3' --exclude='*.db' \
  ~/Downloads/BlueOceanV306945/Blue_Ocean_Market_V30_69_45/ ./
node -p "require('./package.json').version"
git diff --check
git status --short
git diff --stat
git add -A
git diff --cached --name-only
git commit -m "Simplify receiving and linked investigation workflow V30.69.45"
git push -u origin v30.69.45-simple-receiving
```

Use a unique folder/branch suffix if these already exist. Review any newer unrelated work on remote main before copying this source; reconcile it on the feature branch. Do not force-push, reset main or delete runtime data. Review a PR and complete staging acceptance before merging/deploying. No remote push or deployment was performed during preparation.
