# V30.69.20 — Cross-currency payment staging candidate

This is a consolidated implementation, not a validation-only checkpoint. It is based on the supplied protected V30.69.19 archive; the available project files contained no newer protected version. It has not been deployed to production. Production records and disks were never used or modified.

## Implemented behavior

Pink Salt now has a durable, atomic settlement engine for supplier advances/refunds, import settlement (advance/new/combined), packaging payables, customer advances/refunds, order receipts/refunds, import costs and operational expenses. One real bank movement has one authoritative Finance entry. Invoice allocation, recipient receipt, advances and conversion legs link to it; non-cash advance allocation creates no additional money movement. A separately debited bank charge has its own actual Finance movement.

Additive SQLite migration preserves legacy tables, records, Chart of Accounts and approval controls. Unique idempotency requests, strict account/BU/method validation, immutable audit/history, approval execution, correction, reversal and reconciliation are implemented. Late transaction failures roll back payment projections, allocations, Finance and journals together. Incoming customer receipts use actual company-account credit.

The shared native modal exposes all active authorized method-compatible accounts, a single authoritative company selector, explicit quote direction, fees, expected/confirmed receipt, actual account amount, KRW carrying allocation and a review screen. Estimated amounts cannot be recorded as confirmed. Cash cross-currency and unrepresentable multi-hop transfers are blocked. Supported configured currencies: KRW, USD, PKR, EUR, JPY and CNY. This application records evidenced bank conversions; it does not obtain live bank quotes or execute bank transfers.

FX and fee proposals are balanced but remain controlled pending proposals until a CEO approves the explicit posting policy, Finance verifies the actual movement and Accounting Posting Control authorizes posting. The disposable QA policy approval is not approval of the business's real accounting policy. Historical obligations without a trustworthy carrying basis require approved remediation rather than an invented exchange rate.

Native deep links, targeted refresh, EN/KR labels, paid-order continuation into payment, correction evidence reuse and processing protection are included. Original Excavator core financial handlers are unchanged; hashes are in the source-preservation evidence. Shared changes concern render recovery, processing exclusions and asynchronous routing. Missing renderer/breadcrumb functions in the supplied baseline were recovered from V30.64; the newer boot and commerce behavior were retained.

## Evidence and acceptance boundary

`qa/evidence/36920-release.json` is the machine-readable consolidated gate result. Individual evidence files cover real authenticated HTTP transactions, SQLite values, Finance counts/direction/accounts, balanced GL proposals/posting controls, rollback, approval permissions, all engine workflows, migration/restart from the actual supplied archive, and authenticated Chromium payment/correction/reconciliation/navigation interactions. All fixtures are disposable and use synthetic data. No production database is bundled.

This package is deliberately labeled STAGING_CANDIDATE. The automated gate does not establish the entire requested acceptance scope: the complete Excavator browser interaction matrix, bilingual PDF rendering, every historical operational payment entry point, all loading/no-account/processing UI states, and real Render persistent-disk deployment/restoration have not been independently exercised end to end. Excavator regression is real server-backed financial testing, not a complete browser matrix. Review the final evidence rather than treating all historical QA scripts as current acceptance. Historical source-string gates remain under `qa:legacy-source`; they contain obsolete fixed-version assertions.

Before protected promotion, run those remaining browser/PDF and Render staging checks, validate historical payable carrying bases against a sanitized production-like snapshot, and obtain the real accounting-policy decision. No production deployment or automatic policy posting is authorized by this build.

## Financial reconciliation example

QA paid USD 100 against an original payable carrying rate of KRW 1,300/USD. The bank quote was KRW 1,400/USD and charged KRW 1,000 separately within the same debit: actual debit KRW 141,000; settled payable KRW 130,000; FX loss KRW 10,000; fee KRW 1,000. The proposal debits payable 130,000, FX loss 10,000 and fee 1,000, and credits bank 141,000. The recipient receives USD 100. Exactly one Finance expense exists. Advance-only settlement consumes existing credit and has no new bank entry. Separate fee debits are explicitly tested as two real movements, with both reversed together under control.

## Running and reproducing QA

Use Node 22, `npm ci`, then `npm start` with the existing environment configuration. Keep a long `JWT_SECRET` outside Git. Automatic startup runs the additive migration. Use a disposable DATA_DIR and UPLOAD_DIR for any testing; never set test paths to Render production storage.

```bash
npm ci
python3 -m pip install playwright
python3 -m playwright install chromium
export BOM_BASELINE_ZIP=/absolute/path/Blue_Ocean_Market_V30_69_19_IMPORT_CURRENCY_GUARD_INCOMPLETE_STAGING.zip
npm run qa:release
```

Optional `BOM_CHROMIUM` selects a Chromium executable; `BOM_PYTHON` selects Python. The constrained build runtime used Chromium headless shell with no-sandbox/single-process; QA is local only. `npm run qa:fx`, `npm run qa:fx:browser`, `npm run qa:fx:excavator`, and `npm run qa:fx:migration` run individual suites. `npm run build:fx` regenerates the browser calculation mirror after changes to the shared calculation source. Do not edit that mirror independently.

## Render deployment and rollback

1. Create an isolated staging service/disk with synthetic or properly sanitized data. Use Node 22 and `npm ci`; preserve the established persistent DATA_DIR, UPLOAD_DIR and secrets. Do not recreate or detach the production disk.
2. Before upgrading production, pause financial writes and take a consistent SQLite Online Backup API snapshot plus matching uploads. Verify backup readability and perform a restore rehearsal on a separate disk. Do not copy a live SQLite main file while ignoring WAL state.
3. Deploy source only; startup adds tables/view without resetting existing records. Check startup, schema, account permissions, historical totals, FX balances and Finance/Posting Control. Have the CEO approve the actual policy only after Accounting review. Resume writes after staging acceptance and controlled production checks.
4. After new FX transactions exist, a blind downgrade to V30.69.19 is unsafe: its legacy backfill does not understand linked FX projections and could create duplicate money records. Prefer a forward fix. Any full rollback must pause writes and restore an approved matching pre-upgrade database AND upload snapshot, with an explicit decision about post-upgrade transactions. Never run automatic deletion/reset scripts or simply deploy old code over a live migrated FX database.

## Mac Git push

Use a clean clone of the real repository. Substitute the actual URL and extracted folder; keep `.git`, secrets and runtime directories intact. Review all changes before pushing.

```bash
git clone YOUR_REPOSITORY_URL Blue-Ocean-Market
cd Blue-Ocean-Market
git switch main
git pull --ff-only
rsync -av --exclude='.git' --exclude='.env' --exclude='node_modules' --exclude='data' --exclude='uploads' --exclude='backups' /path/to/Blue_Ocean_Market_V30_69_20/ ./
git status --short
git diff --stat
npm ci
# Run the staging acceptance described above before deployment.
git add .
git diff --cached --check
git commit -m "Implement Pink Salt cross-currency settlement engine"
git push origin main
```

There is no `--delete` in the copy command. Configure a staging branch instead if main automatically deploys production. This ZIP contains source, migration, automated tests and results; no credentials, actual databases, uploads or node_modules.
