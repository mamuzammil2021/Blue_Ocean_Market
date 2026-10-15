# Push V30.69.22 from Mac

Download Blue_Ocean_Market_V30_69_22_SYSTEM_WIDE_ROUTING_STAGING_CANDIDATE_GIT_READY.zip to Downloads. Open Terminal.

## 1. Extract
```bash
cd ~/Downloads
mkdir -p BlueOceanV306922
unzip Blue_Ocean_Market_V30_69_22_SYSTEM_WIDE_ROUTING_STAGING_CANDIDATE_GIT_READY.zip -d BlueOceanV306922
```

## 2. Fresh clone and branch
```bash
cd ~/Documents
git clone https://github.com/mamuzammil2021/Blue_Ocean_Market.git Blue_Ocean_Market_V306922
cd Blue_Ocean_Market_V306922
git switch main
git pull origin main
git status --short
git switch -c v30.69.22-system-wide-routing
```

Status should be empty before copying. If GitHub contains newer application changes than this candidate, reconcile them first instead of overwriting newer functionality.

## 3. Copy source
```bash
rsync -av \
  --exclude='.git/' --exclude='.env' --exclude='.env.*' \
  --exclude='data/' --exclude='uploads/' --exclude='node_modules/' \
  --exclude='*.sqlite*' --exclude='*.db*' --exclude='*.pem' --exclude='*.key' \
  ~/Downloads/BlueOceanV306922/Blue_Ocean_Market_V30_69_22/ ./
git status --short
git diff --stat
git add -A
git diff --cached --stat
git diff --cached --name-only
```

Review staged files: no credentials, environment secrets, databases, uploads or node_modules. rsync deliberately does not delete repository files; review obsolete files separately.

## 4. Commit and push
```bash
git commit -m "Add V30.69.22 shared routing and deep-link staging candidate"
git push -u origin v30.69.22-system-wide-routing
```

## 5. After staging acceptance, merge
Read QA_COVERAGE.md and test the candidate on an isolated Render staging disk first. Main may automatically deploy.

```bash
git switch main
git pull origin main
git merge v30.69.22-system-wide-routing
git push origin main
```

Do not reset or delete Render persistent storage. This guide does not claim a Git push, merge or deployment has already occurred.

