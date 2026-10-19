# Push V30.69.24 on Mac

Download Blue_Ocean_Market_V30_69_24_SIMPLE_PINK_SALT_PAYMENTS_STAGING_CANDIDATE_GIT_READY.zip to Downloads. Open Terminal.

```bash
cd ~/Downloads
mkdir -p BlueOceanV306924
unzip Blue_Ocean_Market_V30_69_24_SIMPLE_PINK_SALT_PAYMENTS_STAGING_CANDIDATE_GIT_READY.zip -d BlueOceanV306924
cd ~/Documents
git clone https://github.com/mamuzammil2021/Blue_Ocean_Market.git Blue_Ocean_Market_V306924
cd Blue_Ocean_Market_V306924
git switch main
git pull origin main
git status --short
```

Status must be empty before copying. Reconcile newer GitHub changes first, if any.

```bash
git switch -c v30.69.24-simple-pink-salt-payments
rsync -av \
  --exclude='.git/' --exclude='.env' --exclude='.env.*' \
  --exclude='data/' --exclude='uploads/' --exclude='node_modules/' \
  --exclude='*.sqlite*' --exclude='*.db*' --exclude='*.pem' --exclude='*.key' \
  ~/Downloads/BlueOceanV306924/Blue_Ocean_Market_V30_69_24/ ./
git status --short
git diff --stat
git add -A
git diff --cached --stat
git diff --cached --name-only
```

Do not stage credentials, .env, databases, uploads or node_modules. Copy the matching frontend manifest. Old .gz files are safely ignored when stale; do not use rsync --delete against persistent storage.

```bash
git commit -m "Simplify Pink Salt payment forms and per-payment FX recalculation"
git push -u origin v30.69.24-simple-pink-salt-payments
```

After isolated staging tests, merge:

```bash
git switch main
git pull origin main
git merge v30.69.24-simple-pink-salt-payments
git push origin main
```

Main may auto-deploy Render. Wait for deployment, then check actual payment forms, all three choices, empty applicable rates, recalculation on Tab/clicking outside, fees, explicit confirmation, account switching, EN/KR and refresh. Preserve the existing Render database, uploads, secrets and persistent disk. No push, merge or deployment has already been performed by this build.
