# Reproduce verification

Use Node.js 22, npm ci, Python Playwright, Chromium and a Korean-capable system PDF font. Tests create temporary fixture storage; do not point fixtures at production DATA_DIR/UPLOAD_DIR.

Focused commands:

- node qa/qa_v36931_reference.js
- python3 qa/browser_v36931_qa.py
- node qa/qa_v36931_upgrade.js
- python3 qa/qa_v36931_source_integrity.py

Full gate: npm run qa:release. Set BOM_NODE, BOM_CHROMIUM/CHROME_PATH and Python's Playwright environment as needed. Set these original protected ZIP inputs by absolute path: BOM_BASELINE_ZIP (.19), BOM_PREVIOUS_RELEASE_ZIP (.25), BOM_SUPPLIER_BASELINE_ZIP (.26), BOM_HYDRATION_BASELINE_ZIP (.27), BOM_QA15_BASELINE_ZIP (.28), BOM_RATE_BASELINE_ZIP (.29), BOM_QA30_BASELINE_ZIP (.30). The historical input ZIPs are not nested in this release.

Current aggregate: qa/evidence/36931-release.json. Focused financial, browser, source and upgrade reports are alongside it. Browser screenshots stay in a local temporary inspection directory controlled by BOM_VISUAL_DIR. Changed frontend sources require scripts/build-frontend-manifest.js before starting the server.
