# Push V30.69.33 on a new branch from Mac

Download `Blue_Ocean_Market_V30_69_33_PAYMENT_SETTLEMENT_APPROVALS_GIT_READY.zip` to Downloads and open Terminal. These commands create and push a new branch. They do not push main or deploy.

1. Extract:

```bash
cd ~/Downloads
mkdir -p BlueOceanV306933
unzip Blue_Ocean_Market_V30_69_33_PAYMENT_SETTLEMENT_APPROVALS_GIT_READY.zip \
  -d BlueOceanV306933
```

2. Clone a fresh working copy:

```bash
cd ~/Documents
git clone https://github.com/mamuzammil2021/Blue_Ocean_Market.git Blue_Ocean_Market_V306933
cd Blue_Ocean_Market_V306933
```

If this directory already exists, use a different fresh directory name.

3. Update main and confirm it is clean:

```bash
git switch main
git pull --ff-only origin main
git status --short
```

The last command should show nothing. If GitHub contains protected work newer than the verified V30.69.31 baseline, reconcile that work before copying this release.

4. Create the new version branch:

```bash
git switch -c v30.69.33-payment-settlement-approvals
```

5. Copy source without production storage:

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
  ~/Downloads/BlueOceanV306933/Blue_Ocean_Market_V30_69_33/ ./
```

Do not add --delete. Never copy production databases, uploads or secrets into Git.

6. Review and stage:

```bash
git status --short
git diff --stat
git add -A
git diff --cached --stat
git diff --cached --name-only
```

Ensure no .env secrets, actual databases/backups, data/, uploads/ or node_modules/ are staged.

7. Commit:

```bash
git commit -m "Add V30.69.33 October17 QA and all-currency payment integrity"
```

8. Push the new branch:

```bash
git push -u origin v30.69.33-payment-settlement-approvals
```

GitHub now contains the new branch. Open a pull request with base main and compare v30.69.33-payment-settlement-approvals. Review and test before approving any merge/deployment. Do not push directly to main. Branch pushes can still trigger services configured to deploy that branch, so check the existing Render service configuration.

Staging checks: supplier advance management/locks; stable cost correction and details; original reference and duplicate handling; CEO/independent import approval; lost-response status recovery; CSV/PDF statement downloads; USD/PKR/KRW and supported cross-currency payments; correct native/KRW display and posting blockers; controlled posted repair; receiving/retries; EN/KR/mobile; routing; Excavator.

Keep the existing Render persistent disk, database, uploads and environment. Read docs/releases/v30.69.33/DEPLOYMENT_AND_LIMITATIONS.md before deployment, including the approval-link compatibility and earlier stable-cost revision downgrade restrictions.
