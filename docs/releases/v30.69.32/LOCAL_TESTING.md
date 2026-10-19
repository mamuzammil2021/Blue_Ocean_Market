# Reproduce local acceptance

Use Node 22, Python 3 with Playwright, Chromium/Chrome, Korean fonts and normal build tools for better-sqlite3. Run only in an isolated checkout. The QA fixture launches the actual server on a temporary port, generates test credentials and uses a disposable SQLite/database/uploads directory under the OS temp folder. It never needs a production DB. Do not set QA database paths to Render storage.

```bash
npm ci
python3 -m pip install playwright
python3 -m playwright install chromium
export BOM_NODE="$(command -v node)"
export BOM_CHROMIUM="/absolute/path/to/chromium-or-chrome"
export CHROME_PATH="$BOM_CHROMIUM"
node scripts/build-pink-fx-client.js
node scripts/build-frontend-manifest.js
```

For migration/source regression tests, separately obtain the original protected ZIPs and place them in `~/Downloads/BlueOceanProtected`. They are not nested inside this release. Exact names and environment variables:

```bash
export BOM_BASELINE_ZIP="$HOME/Downloads/BlueOceanProtected/Blue_Ocean_Market_V30_69_19_IMPORT_CURRENCY_GUARD_INCOMPLETE_STAGING.zip"
export BOM_PREVIOUS_RELEASE_ZIP="$HOME/Downloads/BlueOceanProtected/Blue_Ocean_Market_V30_69_25_QA14_CORRECTIONS_GIT_READY.zip"
export BOM_SUPPLIER_BASELINE_ZIP="$HOME/Downloads/BlueOceanProtected/Blue_Ocean_Market_V30_69_26_SIMPLE_IMPORT_COST_RECIPIENT_GIT_READY.zip"
export BOM_HYDRATION_BASELINE_ZIP="$HOME/Downloads/BlueOceanProtected/Blue_Ocean_Market_V30_69_27_SUPPLIER_ACCOUNTS_CASH_FIX_GIT_READY.zip"
export BOM_QA15_BASELINE_ZIP="$HOME/Downloads/BlueOceanProtected/Blue_Ocean_Market_V30_69_28_DIRECT_DEEP_ROUTE_HYDRATION_GIT_READY.zip"
export BOM_RATE_BASELINE_ZIP="$HOME/Downloads/BlueOceanProtected/Blue_Ocean_Market_V30_69_29_QA15_COST_LOCKS_SIMPLE_SUPPLIER_PAYMENTS_GIT_READY.zip"
export BOM_QA30_BASELINE_ZIP="$HOME/Downloads/BlueOceanProtected/Blue_Ocean_Market_V30_69_30_SINGLE_PAYMENT_EXCHANGE_RATE_GIT_READY.zip"
export BOM_QA31_BASELINE_ZIP="$HOME/Downloads/BlueOceanProtected/Blue_Ocean_Market_V30_69_31_PINK_SALT_QA_REFERENCES_COSTS_REFRESH_GIT_READY.zip"
npm run qa:release
```

The final aggregate is `qa/evidence/36932-release.json`. Individual suites also write JSON evidence. A failed command is not acceptance. Syntax-only checks do not substitute for the authenticated server/browser gate. The environment used for this release had Node 22.16.0, installed Python Playwright, local Chromium and Korean fonts. Historical reports retained from older builds are not independent evidence for current source; use the current aggregate.

Focused current suites:

```bash
node qa/qa_v36932_server.js
node qa/qa_v36932_legacy_advances.js
node qa/qa_v36932_upgrade.js
python3 qa/browser_v36932_qa.py
node qa/benchmark_v36932.js
```

Run Chromium suites sequentially to avoid contaminating performance measurements. The benchmark records a single local sample with synthetic USD 49,950 and a confirmed fixture valuation, not a market quote. For unchanged-baseline comparison, set `BOM_BENCH_SOURCE` to a separately extracted protected .31 source with dependencies installed; the script explicitly supplies the bad historical valuation to reproduce its arithmetic.

Read-only real-data review and repair requirements are documented separately. Never point mutation/fixture suites at production. Production repairs are not performed by this test gate.
