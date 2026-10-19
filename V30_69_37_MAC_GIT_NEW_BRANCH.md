# Push V30.69.37 as a new branch

Download `Blue_Ocean_Market_V30_69_37_PACKAGING_UI_REFINEMENT_GIT_READY.zip` to your Mac Downloads folder, then open Terminal.

## 1. Extract the build

```bash
cd ~/Downloads
mkdir -p BlueOceanV306937
unzip Blue_Ocean_Market_V30_69_37_PACKAGING_UI_REFINEMENT_GIT_READY.zip \
  -d BlueOceanV306937
```

## 2. Clone a fresh copy of GitHub

```bash
cd ~/Documents
git clone https://github.com/mamuzammil2021/Blue_Ocean_Market.git Blue_Ocean_Market_V306937
cd Blue_Ocean_Market_V306937
```

## 3. Update main and check the working tree

```bash
git switch main
git pull --ff-only origin main
git status --short
```

The working tree should be clean. These steps put the complete build on a new branch; they do not merge or push main.

## 4. Create the new branch

```bash
git switch -c v30.69.37-packaging-ui-refinement
```

## 5. Copy the complete source

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
  ~/Downloads/BlueOceanV306937/Blue_Ocean_Market_V30_69_37/ ./
```

This ZIP contains the full application, including the previous .36 functionality. Do not use `--delete`; review the changes before committing, particularly if the repository contains unrelated development. The optional .36→.37 patch is for review/applying to a matching .36 checkout, not an older main branch. Do not both copy the build and apply its patch.

## 6. Check version and changes

```bash
node -p "require('./package.json').version"
git status --short
git diff --stat
```

The version should be `30.69.37`.

## 7. Stage and review

```bash
git add -A
git status --short
git diff --cached --stat
```

Make sure no `.env`, runtime data, uploads, backups, dependencies or database files are staged. `.env.example` is safe.

## 8. Commit

```bash
git commit -m "Add V30.69.37 packaging UI and workflow refinement"
```

## 9. Push the new branch

```bash
git push -u origin v30.69.37-packaging-ui-refinement
```

Test this branch on the existing Render testing service first. Keep its persistent disk/database/uploads and follow `V30_69_37_DEPLOYMENT_NOTES.md`.

## 10. Merge only after testing and accepting the result

```bash
git switch main
git pull --ff-only origin main
git merge v30.69.37-packaging-ui-refinement
git push origin main
```

No Git branch was pushed, main merged or Render service deployed during this build.
