# Reproduce checks

Use Node.js 22, npm ci, Python Playwright and Chromium. All fixtures create disposable temporary databases; do not point them at production storage.

Run `node qa/qa_v36930_shared_rate.js` for focused server checks and `python3 qa/browser_v36930_shared_rate.py` for authenticated browser transactions. Set BOM_NODE to Node 22, BOM_CHROMIUM/CHROME_PATH to Chromium, and install the Python Playwright module first.

The consolidated command is `npm run qa:release`. Set the following absolute archive paths for historical compatibility tests:

- BOM_BASELINE_ZIP: protected V30.69.19
- BOM_PREVIOUS_RELEASE_ZIP: V30.69.25
- BOM_SUPPLIER_BASELINE_ZIP: V30.69.26
- BOM_HYDRATION_BASELINE_ZIP: V30.69.27
- BOM_QA15_BASELINE_ZIP: V30.69.28
- BOM_RATE_BASELINE_ZIP: V30.69.29

These original protected archives are separate test inputs, not nested in this release. Use a Korean-capable system font for bilingual PDF checks. The current gate writes qa/evidence/36930-release.json and individual suite evidence; historical reports remain for provenance.
