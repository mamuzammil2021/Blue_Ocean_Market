# V30.69.29 — Reproduce automated acceptance

Use Node.js 22 and Python 3. From this release's extracted application folder:

```bash
npm ci
python3 -m venv .qa-venv
source .qa-venv/bin/activate
pip install playwright
python -m playwright install chromium
export BOM_NODE="$(command -v node)"
export BOM_PYTHON="$(command -v python)"
export BOM_BASELINE_ZIP="$HOME/Downloads/Blue_Ocean_Market_V30_69_19_IMPORT_CURRENCY_GUARD_INCOMPLETE_STAGING.zip"
export CHROME_PATH="$(python -c 'from playwright.sync_api import sync_playwright; p=sync_playwright().start(); print(p.chromium.executable_path); p.stop()')"
export BOM_PREVIOUS_RELEASE_ZIP="$HOME/Downloads/Blue_Ocean_Market_V30_69_25_QA14_CORRECTIONS_GIT_READY.zip"
export BOM_SUPPLIER_BASELINE_ZIP="$HOME/Downloads/Blue_Ocean_Market_V30_69_26_SIMPLE_IMPORT_COST_RECIPIENT_GIT_READY.zip"
export BOM_HYDRATION_BASELINE_ZIP="$HOME/Downloads/Blue_Ocean_Market_V30_69_27_SUPPLIER_ACCOUNTS_CASH_FIX_GIT_READY.zip"
export BOM_QA15_BASELINE_ZIP="$HOME/Downloads/Blue_Ocean_Market_V30_69_28_DIRECT_DEEP_ROUTE_HYDRATION_GIT_READY.zip"
npm run qa:release
```

Install Poppler (`pdftotext`) for actual statement-PDF text verification; on Mac, `brew install poppler`. If a separate Chromium is installed, set BOM_CHROMIUM and CHROME_PATH to that executable. Korean PDF verification needs Korean fonts (Dockerfile installs fonts-noto-cjk). For a native Mac install, a system Korean font is sufficient.

The migration suite needs the actual original V30.69.19 ZIP. All fixtures create temporary databases/uploads and local authenticated servers with random test credentials. These tests must never be pointed at production databases or persistent uploads. The release gate uses the fixture's isolated configuration, not the production .env file.

Current gate: `qa/qa_v36929_release_gate.js`. Current aggregate: `qa/evidence/36929-release.json`. Older release reports and source assertions are historical, not acceptance of this source.

Statement benchmark: `node qa/statement_performance.js`. Set BOM_PERF_SOURCE to an extracted protected source folder for a comparable baseline; both runs generate the same 1,500 advances and 102 imports. Results separate first-generation PDF time from identical-snapshot reuse.

Focused render tests: `python qa/browser_v36928_hydration.py` and `python qa/browser_v36928_lifecycle.py`. These start their own isolated authenticated servers. Set BOM_CHROMIUM if Chromium is not in Playwright's default cache. The release gate also accepts BOM_PYTHON.

For before evidence, extract the protected V30.69.27 ZIP, install its dependencies, then set BOM_HYDRATION_SOURCE to its absolute application folder and run the current hydration test. Unset it and rerun for after evidence. The same observer records connected DOM writes, animation-frame states, HTTP reads and real browser-history calls. The first six cases form the published paired comparison.

Focused QA15: `node qa/qa_v36929_qa15.js` and `python qa/browser_v36929_qa15.py`. Both create isolated servers/databases; do not point fixtures at production. Current source-integrity and .28 upgrade tests require BOM_QA15_BASELINE_ZIP. The full gate also retains the .27/.26/.25/.19 baseline variables above.
