# Local automated gate

Use Node.js 22. From the extracted application root:

```bash
npm ci
python3 -m venv .qa-venv
source .qa-venv/bin/activate
pip install playwright
python -m playwright install chromium
export BOM_NODE="$(command -v node)"
export BOM_BASELINE_ZIP="$HOME/Downloads/Blue_Ocean_Market_V30_69_19_IMPORT_CURRENCY_GUARD_INCOMPLETE_STAGING.zip"
npm run qa:release
```

BOM_BASELINE_ZIP must point to the actual original V30.69.19 ZIP for baseline migration testing. The gate creates disposable temporary databases, starts isolated local servers and runs Chromium. Do not configure it to use production storage. If using a separately installed Chromium, set BOM_CHROMIUM to its executable. Current acceptance gate is qa/qa_v36922_release_gate.js; historical source assertions remain archival. Consult exact evidence and remaining acceptance scope before deployment.

