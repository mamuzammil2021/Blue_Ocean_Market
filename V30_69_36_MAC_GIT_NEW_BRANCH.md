# Push V30.69.36 as a new branch on your Mac

Use **Blue_Ocean_Market_V30_69_36_SIMPLE_PACKAGING_MATERIALS_GIT_READY.zip**. Download it to your Mac **Downloads** folder, then open Terminal.

## 1. Extract the build

```bash
cd ~/Downloads
mkdir -p BlueOceanV306936
unzip Blue_Ocean_Market_V30_69_36_SIMPLE_PACKAGING_MATERIALS_GIT_READY.zip \
  -d BlueOceanV306936
```

## 2. Clone a fresh copy of GitHub

```bash
cd ~/Documents
git clone https://github.com/mamuzammil2021/Blue_Ocean_Market.git Blue_Ocean_Market_V306936
cd Blue_Ocean_Market_V306936
```

## 3. Confirm and update main

```bash
git switch main
git pull --ff-only origin main
git status --short
node -p "require('./package.json').version"
```

`git status --short` should show nothing. This build was made from **30.69.33**. If GitHub `main` is newer or contains other work, use the patch alternative below instead of copying the entire .33-based source over it. The remote branch was not inspected or changed during this build.

## 4. Create a new branch

```bash
git switch -c v30.69.36-simple-packaging-materials
```

## 5. Copy the source — only when main matches the protected .33 baseline

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
  --exclude='*.db' \
  ~/Downloads/BlueOceanV306936/Blue_Ocean_Market_V30_69_36/ ./
```

The ZIP has one source folder, `Blue_Ocean_Market_V30_69_36`. Do not use `--delete`.

If main contains additional work, apply only the included changes on the new branch:

```bash
git apply --check \
  ~/Downloads/BlueOceanV306936/Blue_Ocean_Market_V30_69_36/V30_69_36_FROM_V30_69_33.patch

git apply \
  ~/Downloads/BlueOceanV306936/Blue_Ocean_Market_V30_69_36/V30_69_36_FROM_V30_69_33.patch
```

Run the second command only if `--check` succeeds. If it fails, reconcile the conflicting changes; do not discard newer development. Do not both copy the full build and apply its patch.

## 6. Check the changes

```bash
git status --short
git diff --stat
```

## 7. Stage and review

```bash
git add -A
git status --short
git diff --cached --stat
```

Make sure no secrets, `node_modules`, uploads, runtime data, backups, SQLite or database files are staged.

## 8. Commit

```bash
git commit -m "Add V30.69.36 simple packaging materials workflow"
```

## 9. Push the new branch

```bash
git push -u origin v30.69.36-simple-packaging-materials
```

Test this branch on your Render testing service first. Follow `V30_69_36_DEPLOYMENT_AND_MIGRATION.md`; preserve the persistent disk/database/uploads.

## 10. After testing and accepting the result, merge into main

```bash
git switch main
git pull --ff-only origin main
git merge v30.69.36-simple-packaging-materials
git push origin main
```

Only run this final step after testing and deciding to promote the build. No branch was pushed, merged or deployed for you.

Flow: Extract ZIP → Fresh clone → Check main → New branch → Copy or apply patch → Review → Commit → Push branch → Render test → Merge after acceptance.
