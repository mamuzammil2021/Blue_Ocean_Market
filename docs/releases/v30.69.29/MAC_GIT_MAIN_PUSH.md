# Mac Git main branch push for V30.69.29

Use only `Blue_Ocean_Market_V30_69_29_QA15_COST_LOCKS_SIMPLE_SUPPLIER_PAYMENTS_GIT_READY.zip`. Download it to your Mac Downloads folder and open Terminal. These instructions push to main as requested; no Git push or deployment was performed while preparing the build.

## 1. Extract

```bash
cd ~/Downloads
mkdir -p BlueOceanV306929
unzip Blue_Ocean_Market_V30_69_29_QA15_COST_LOCKS_SIMPLE_SUPPLIER_PAYMENTS_GIT_READY.zip -d BlueOceanV306929
```

## 2. Clone a fresh repository and update main

```bash
cd ~/Documents
git clone https://github.com/mamuzammil2021/Blue_Ocean_Market.git Blue_Ocean_Market_V306929
cd Blue_Ocean_Market_V306929
git switch main
git pull --ff-only origin main
git status --short
```

The last command must show nothing. If the destination folder already exists, choose another new folder name. If main contains newer protected work than V30.69.28, reconcile it before copying; do not overwrite a newer build blindly.

## 3. Copy the release source

```bash
rsync -av \
  --exclude='.git/' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='data/' \
  --exclude='uploads/' \
  --exclude='node_modules/' \
  --exclude='.qa-venv/' \
  --exclude='.venv/' \
  --exclude='__pycache__/' \
  --exclude='*.sqlite*' \
  --exclude='*.db*' \
  ~/Downloads/BlueOceanV306929/Blue_Ocean_Market_V30_69_29/ ./
```

Do not add `--delete`. Never copy a production database or uploads into Git.

## 4. Inspect and stage

```bash
git status --short
git diff --stat
git add -A
git diff --cached --stat
git diff --cached --name-only
```

Ensure no .env secrets, databases, data/, uploads/, backups or node_modules/ are staged. If necessary, unstage an unexpected file using `git restore --staged -- path/to/file` and inspect it.

## 5. Commit and push main

```bash
git commit -m "Add V30.69.29 QA15 cost locks and simpler supplier payments"
git push origin main
```

If the push is rejected because main changed, do not force-push. Fetch and reconcile the newer work first.

If Render automatically deploys main, this push may trigger deployment. Complete isolated staging checks first and follow `docs/releases/v30.69.29/RENDER_DEPLOYMENT_ROLLBACK.md`. Keep the existing persistent disk, database and uploads intact.
