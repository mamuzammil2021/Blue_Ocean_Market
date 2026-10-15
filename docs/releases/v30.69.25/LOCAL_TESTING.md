# V30.69.25 — Reproduce automated acceptance

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
npm run qa:release
```

Install Poppler (`pdftotext`) for actual statement-PDF text verification; on Mac, `brew install poppler`. If a separate Chromium is installed, set BOM_CHROMIUM and CHROME_PATH to that executable. Korean PDF verification needs Korean fonts (Dockerfile installs fonts-noto-cjk). For a native Mac install, a system Korean font is sufficient.

The migration suite needs the actual original V30.69.19 ZIP. All fixtures create temporary databases/uploads and local authenticated servers with random test credentials. These tests must never be pointed at production databases or persistent uploads. The release gate uses the fixture's isolated configuration, not the production .env file.

Current gate: `qa/qa_v36925_release_gate.js`. Current aggregate: `qa/evidence/36925-release.json`. Older release reports and source assertions are historical, not acceptance of this source.

Statement benchmark: `node qa/statement_performance.js`. Set BOM_PERF_SOURCE to an extracted protected source folder for a comparable baseline; both runs generate the same 1,500 advances and 102 imports. Results separate first-generation PDF time from identical-snapshot reuse.
