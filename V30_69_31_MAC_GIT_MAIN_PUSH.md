> Historical V30.69.31 instructions. Current releases use a NEW branch: see V30_69_32_MAC_GIT_NEW_BRANCH.md. Do not follow this older main-only guide for V30.69.32.

# Push V30.69.31 on main — Mac

Use Blue_Ocean_Market_V30_69_31_PINK_SALT_QA_REFERENCES_COSTS_REFRESH_GIT_READY.zip. Download to Downloads and open Terminal. These steps use main without creating a branch. No push/deployment was performed while preparing this build.

1. Extract:

```bash
cd ~/Downloads
mkdir -p BlueOceanV306931
unzip Blue_Ocean_Market_V30_69_31_PINK_SALT_QA_REFERENCES_COSTS_REFRESH_GIT_READY.zip -d BlueOceanV306931
```

2. Clone a fresh repository and update main:

```bash
cd ~/Documents
git clone https://github.com/mamuzammil2021/Blue_Ocean_Market.git Blue_Ocean_Market_V306931
cd Blue_Ocean_Market_V306931
git switch main
git pull --ff-only origin main
git status --short
```

The last command must show nothing. If that folder already exists, choose another fresh folder. If main contains protected development newer than V30.69.30, reconcile it before copying this release.

3. Copy source:

```bash
rsync -av \
  --exclude='.git/' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='data/' \
  --exclude='uploads/' \
  --exclude='node_modules/' \
  --exclude='.venv/' \
  --exclude='.qa-venv/' \
  --exclude='__pycache__/' \
  --exclude='*.sqlite*' \
  --exclude='*.db*' \
  ~/Downloads/BlueOceanV306931/Blue_Ocean_Market_V30_69_31/ ./
```

Do not add --delete. Never copy production databases, uploads or secrets into Git.

4. Review and test on isolated staging/local storage before pushing an auto-deployed main branch:

```bash
git status --short
git diff --stat
```

Check categories, duplicate/missing/blank-cash references, original-reference Finance correction, cost locks/statuses/totals, FX/advance flows, EN/KR, mobile layout, deep-link refresh and Excavator payments. Review the included test report and deployment/rollback guide.

5. Stage and inspect:

```bash
git add -A
git diff --cached --stat
git diff --cached --name-only
```

Ensure no .env secrets, actual databases, uploads/, data/, backups or node_modules/ are staged. Unstage an unexpected file with git restore --staged -- path/to/file and inspect it.

6. Commit and push main after acceptance:

```bash
git commit -m "Fix Pink Salt references, import categories, cost states and stale refresh"
git push origin main
```

If Render tracks main with auto-deploy enabled, this push may immediately deploy. Keep the existing service environment, persistent disk, database and uploads. Do not reset, replace or delete production storage.
