# Mac — push V30.69.28 to GitHub

Download `Blue_Ocean_Market_V30_69_28_DIRECT_DEEP_ROUTE_HYDRATION_GIT_READY.zip` into Downloads. Open Terminal. Use the ZIP delivered with this guide, not an earlier checkpoint.

## 1. Extract

```bash
cd ~/Downloads
mkdir -p BlueOceanV306928
unzip Blue_Ocean_Market_V30_69_28_DIRECT_DEEP_ROUTE_HYDRATION_GIT_READY.zip -d BlueOceanV306928
```

## 2. Clone a fresh repository

```bash
cd ~/Documents
git clone https://github.com/mamuzammil2021/Blue_Ocean_Market.git Blue_Ocean_Market_V306928
cd Blue_Ocean_Market_V306928
git switch main
git pull --ff-only origin main
git status --short
```

The last command should show nothing. If the destination folder already exists, choose a different new folder name.

## 3. Create the release branch

```bash
git switch -c v30.69.28-direct-deep-route-hydration
```

## 4. Copy source while protecting local storage

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
  --exclude='*.sqlite*' \
  --exclude='*.db*' \
  ~/Downloads/BlueOceanV306928/Blue_Ocean_Market_V30_69_28/ ./
```

Do not add `--delete`. This copies application source; it does not replace Render storage.

## 5. Review and stage

```bash
git status --short
git diff --stat
git add -A
git diff --cached --stat
git diff --cached --name-only
```

Inspect the staged filenames. Do not commit .env secrets, databases, data/, uploads/, backups or node_modules/. If any appear, unstage them with `git restore --staged -- path/to/file` and inspect before continuing.

## 6. Commit and push

```bash
git commit -m "Add V30.69.28 direct deep-route hydration and refresh stabilization"
git push -u origin v30.69.28-direct-deep-route-hydration
```

## 7. Stage on Render, then merge

Follow docs/releases/v30.69.28/RENDER_DEPLOYMENT_ROLLBACK.md. Use an isolated staging database first, then perform the live-service smoke checks with existing storage protected.

After acceptance:

```bash
git switch main
git pull --ff-only origin main
git merge --no-ff v30.69.28-direct-deep-route-hydration
git push origin main
```

If Git reports conflicts or an unexpected newer change, stop before overwriting it and reconcile the changes. Never reset or delete the Render disk or database to deploy this source.
