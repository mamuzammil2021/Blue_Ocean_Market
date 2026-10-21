# Push V30.69.39 on a new branch

Download `Blue_Ocean_Market_V30_69_39_OCT20_QA_PURCHASE_CART_GIT_READY.zip` to your Mac Downloads folder. Open Terminal.

## 1. Extract

```bash
cd ~/Downloads
mkdir -p BlueOceanV306939
unzip Blue_Ocean_Market_V30_69_39_OCT20_QA_PURCHASE_CART_GIT_READY.zip \
  -d BlueOceanV306939
```

## 2. Fresh clone

```bash
cd ~/Documents
git clone https://github.com/mamuzammil2021/Blue_Ocean_Market.git Blue_Ocean_Market_V306939
cd Blue_Ocean_Market_V306939
```

## 3. Update main and inspect

```bash
git switch main
git pull --ff-only origin main
git status --short
node -p "require('./package.json').version"
```

Status should be empty. This delivery is based on protected .38. If main contains a newer build or unrelated changes beyond .38, compare those changes before copying this build over them.

## 4. New branch

```bash
git switch -c v30.69.39-oct20-qa-purchase-cart
```

## 5. Copy source

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
  ~/Downloads/BlueOceanV306939/Blue_Ocean_Market_V30_69_39/ ./
```

## 6. Check version and changes

```bash
node -p "require('./package.json').version"
git status --short
git diff --stat
git diff --check
```

Version must print **30.69.39**. Check that no .env, data, uploads, database, backups or node_modules files are staged.

## 7. Stage and commit

```bash
git add -A
git status --short
git diff --cached --stat
git commit -m "Add V30.69.39 QA fixes and packaging purchase cart"
```

## 8. Push the new branch

```bash
git push -u origin v30.69.39-oct20-qa-purchase-cart
```

Select this branch on your Render testing service. Follow `V30_69_39_DEPLOYMENT_NOTES.md`, back up first and test before merging. These steps do not push to main. Do not reset or delete the Render persistent disk/database.
