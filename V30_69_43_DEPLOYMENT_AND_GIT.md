# Push V30.69.43 on a new branch, then test on Render

This full source release is based on the protected V30.69.42 ZIP identified in V30_69_43_QA_REPORT.md. It fixes the October 22 QA document. It changes import permissions/void execution and adds warehouse/PDF endpoints; it is not a UI-only server-identical build. There is no new database schema migration. The proposed import receiving/discrepancy/supplier-credit redesign is excluded.

No remote push, main change or deployment was performed during preparation. The ZIP omits `.git`; use your own fresh clone for repository history. Commands below push only a new feature branch. Do not force-push, reset main or delete the Render persistent disk/database.

## 1. Download and extract on your Mac

Download `Blue_Ocean_Market_V30_69_43_OCT22_QA_GIT_READY.zip` and `SHA256SUMS_V30_69_43.txt` to Downloads. Compare the ZIP hash with its line in the checksum file.

```bash
cd ~/Downloads
shasum -a 256 Blue_Ocean_Market_V30_69_43_OCT22_QA_GIT_READY.zip
mkdir -p BlueOceanV306943
unzip Blue_Ocean_Market_V30_69_43_OCT22_QA_GIT_READY.zip -d BlueOceanV306943
```

## 2. Fresh clone and inspect

```bash
cd ~/Documents
git clone https://github.com/mamuzammil2021/Blue_Ocean_Market.git Blue_Ocean_Market_V306943
cd Blue_Ocean_Market_V306943
git fetch origin
git status --short
git log -5 --oneline origin/main
node -p "require('./package.json').version"
```

Status must be empty. Compare any newer or unrelated work on origin/main with this V42-based delivery before copying it over. If there are additional changes, reconcile them on the feature branch rather than overwriting them. These instructions do not certify the current remote main version.

## 3. Create the feature branch

```bash
git switch -c feature/v30.69.43-oct22-qa origin/main
```

If it already exists, inspect it and choose a unique suffix. Do not reset an existing branch.

## 4. Copy the complete source

```bash
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
  ~/Downloads/BlueOceanV306943/Blue_Ocean_Market_V30_69_43/ ./
```

Do not use `rsync --delete`. One verified obsolete root file named `node_modules` was an inherited text placeholder. If that exact tracked file exists in your clone, remove only that placeholder before installing dependencies:

```bash
if [ -f node_modules ] && [ "$(cat node_modules)" = "../../work/node_modules" ]; then
  git rm -- node_modules
fi
```

A real dependency directory does not satisfy this condition and is not deleted. Other cleanup changes are within updated source files.

## 5. Validate the copied build

Use Node 22.x. Google Chrome or Chromium and Korean fonts must be available for invoice/PDF tests. On a Mac with Google Chrome installed:

```bash
node --version
node -p "require('./package.json').version"
npm ci
export CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
npm run build:ui
npm run qa:current
git diff --check
git status --short
git diff --stat
```

Version must be `30.69.43`. The standard gate includes actual invoice PDF generation and isolated API/financial tests. For the full browser gate, use Playwright Chromium (or set `BOM_CHROMIUM` to a compatible Chrome executable):

```bash
npx playwright install chromium
node qa/qa_v36943_release.js --browser
npm run qa:ui:destinations
```

For a separately retained untouched V42 source folder, `BOM_BASELINE_DIR` and `NODE_PATH="$PWD/node_modules"` enable `npm run qa:upgrade`. See the QA report for output environment variables, precise coverage and test-host limitations.

## 6. Stage, review and commit

```bash
git add -A
git diff --cached --check
git diff --cached --name-only
git diff --cached --stat
git status --short
git commit -m "Fix V30.69.43 October QA, import controls, invoices and warehouses"
```

Inspect staged filenames first. They must contain no private environment files, databases, data/uploads/backups, node_modules, browser/font caches or generated QA screenshots. `.gitignore` and archive exclusions are supplied, but inspect any files already tracked in your remote repository. Do not stage unrelated changes.

## 7. Push only the new branch

```bash
git push -u origin feature/v30.69.43-oct22-qa
```

If you chose a suffix, use that exact branch name. Open a PR for review after staging acceptance. Do not merge or push to main as part of these commands.

## 8. Render testing deployment

1. Back up the testing service database and attachments to a consistent point in time. Record its accepted commit, disk mount and environment configuration.
2. Select the new feature branch on the **testing** service. Keep the existing persistent disk, `DATA_DIR`, `UPLOAD_DIR`, authentication secrets and company configuration.
3. Use Node 22.x, `npm ci --omit=dev` and `npm start`, or the supplied Dockerfile. The Dockerfile installs Chromium and Korean fonts and sets `CHROME_PATH=/usr/bin/chromium`. A native Node service must provision a working browser and fonts separately; verify `CHROME_PATH` on that service. Precompiled frontend assets are included.
4. Deploy the whole matching source/compiled asset set. Frontend integrity rejects mixed releases. Confirm health/version 30.69.43, login and direct-link refresh.
5. Test the ten document requests with real staging roles and assigned BUs: supplier validation, placeholders, dialog scrolling, slow loaders, long Import Detail page, CEO/non-CEO controls, warehouse create/archive/refresh and EN/KR invoice generation/download.
6. In a disposable staging scenario, test a Finance/Admin-requested import void through CEO approval, received-import CEO-only enforcement, original/supplier/Finance/Accounting/stock histories, restored existing advance availability, posted-journal reversal review, closed-period rejection and consumed-stock rejection. A void is not a recorded bank refund. Do not void real company transactions solely to test.
7. Verify actual target-host EN/KR printing/fonts, normal settlement/receiving prerequisites, packing/production and existing payment workflows before requesting merge approval. The separate receiving redesign is not part of this build.

## Rollback

Redeploy the previously accepted commit and its matching compiled assets. This release adds no new schema migration to reverse. A code rollback does not undo transactions created during staging or operation; assess those records and use approved business correction workflows. If a database restore is required, stop writes and restore database plus attachments consistently, accounting for valid transactions since the backup. Never reset/delete the persistent disk or blindly discard newer records.
