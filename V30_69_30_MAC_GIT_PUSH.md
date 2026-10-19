# Mac Git push — V30.69.30

Download `Blue_Ocean_Market_V30_69_30_SINGLE_PAYMENT_EXCHANGE_RATE_GIT_READY.zip` to Downloads, then open Terminal. These commands create and push a release branch. Nothing has been pushed or deployed during preparation.

## 1. Extract

```bash
cd ~/Downloads
mkdir -p BlueOceanV306930
unzip Blue_Ocean_Market_V30_69_30_SINGLE_PAYMENT_EXCHANGE_RATE_GIT_READY.zip -d BlueOceanV306930
```

## 2. Fresh clone and update main

```bash
cd ~/Documents
git clone https://github.com/mamuzammil2021/Blue_Ocean_Market.git Blue_Ocean_Market_V306930
cd Blue_Ocean_Market_V306930
git switch main
git pull --ff-only origin main
git status --short
```

The last command must show nothing. If the destination folder exists, choose another new folder name. This build is based on V30.69.29; reconcile any newer protected source on GitHub before copying.

## 3. Create the release branch

```bash
git switch -c v30.69.30-single-payment-exchange-rate
```

## 4. Copy source

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
  ~/Downloads/BlueOceanV306930/Blue_Ocean_Market_V30_69_30/ ./
```

Do not add `--delete`.

## 5. Check, stage and inspect

```bash
git status --short
git diff --stat
git add -A
git diff --cached --stat
git diff --cached --name-only
```

Do not commit secrets, .env files, databases, data/, uploads/, backups or node_modules/. Unstage unexpected files with `git restore --staged -- path/to/file`.

## 6. Commit and push the branch

```bash
git commit -m "Fix Pink Salt duplicate payment rate and remove quote details"
git push -u origin v30.69.30-single-payment-exchange-rate
```

## 7. Test before merging

Check import costs and supplier payments: no quote-details section, one rate for each distinct pair, correct debit/KRW equivalent, no duplicate Finance movement, preserved invoice FX differences, corrections, EN/KR, and deep-link refresh. Smoke-test Excavator. Use isolated staging storage.

After acceptance, open a pull request or merge:

```bash
git switch main
git pull --ff-only origin main
git merge --no-ff v30.69.30-single-payment-exchange-rate
git push origin main
```

A Render service auto-deploys only from its configured branch; pushing that branch may immediately deploy. Keep the existing persistent disk and database. Never reset or replace them.
