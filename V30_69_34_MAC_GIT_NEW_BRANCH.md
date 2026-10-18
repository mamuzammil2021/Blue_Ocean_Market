# V30.69.34 — new feature branch from current main

This ZIP is a reviewable engineering candidate, not authorization to push/merge/deploy to main. Read the implementation report and limitations first. Source baseline is exactly V30.69.33. If your current main includes newer work, merge/reconcile that work rather than overwriting it with this complete source folder.

## 1. Prepare your repository

In Terminal, replace the example repository path with your existing clone:

```bash
cd /absolute/path/to/your/blue-ocean-repository
git status --short
```

Keep unrelated work: commit it on its own branch before continuing. Do not use a hard reset or discard changes. Once the working tree is clean:

```bash
git switch main
git pull --ff-only origin main
node -p "require('./package.json').version"
git switch -c feature/v30.69.34-packaging-materials
```

The expected unmodified source version is `30.69.33`. If it is newer or has project changes not present in this baseline, stop the bulk copy and reconcile the source differences on this feature branch.

## 2. Extract and copy the delivered source

Extract the ZIP outside the repository. The source folder inside it is `Blue_Ocean_Market_V30_69_34`.

```bash
unzip "$HOME/Downloads/Blue_Ocean_Market_V30_69_34_PACKAGING_MATERIALS_ENGINEERING_CANDIDATE_GIT_READY.zip" \
  -d "$HOME/Downloads/BlueOcean-v30.69.34-review"
rsync -av \
  --exclude='.git/' --exclude='node_modules/' \
  --exclude='.env' --exclude='.env.*' \
  --exclude='data/' --exclude='uploads/' --exclude='backups/' \
  "$HOME/Downloads/BlueOcean-v30.69.34-review/Blue_Ocean_Market_V30_69_34/" ./
git diff --stat
git diff --check
```

There is deliberately no `--delete`: unrelated repository files are not removed. Preserve existing runtime secrets, database and upload directories.

## 3. Verify locally

Use Node 22 and follow `docs/releases/v30.69.34/LOCAL_TESTING.md` for the browser and protected ZIP prerequisites:

```bash
node --version
npm ci
npm run qa:release
git status --short
```

Review source changes and actual QA outcomes, including the remaining acceptance gaps. Never run fixture suites against production.

## 4. Commit and push the feature branch

```bash
git add -A
git commit -m "Redesign Pink Salt Packaging Materials (V30.69.34 candidate)"
git push -u origin feature/v30.69.34-packaging-materials
```

Open a pull request from this branch to main and keep it in review until business gaps and staging acceptance are resolved. These instructions do not push main, merge the PR, or deploy the application.
