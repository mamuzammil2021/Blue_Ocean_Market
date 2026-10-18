# Reproduce V30.69.34 engineering acceptance

Use a separate checkout with Node 22. All fixture suites create disposable databases and synthetic users/evidence. Never configure QA to use a production database or upload path.

```bash
npm ci
node scripts/build-pink-fx-client.js
node scripts/build-packaging-client.js
node scripts/build-frontend-manifest.js
```

Install Playwright in an isolated sibling QA environment, or use an existing compatible installation. The acceptance host used the installed Playwright package recorded in the verification report; no browser package is required to start the business application itself.

```bash
npm install --prefix ../blue-ocean-qa playwright
export NODE_PATH="$(pwd)/../blue-ocean-qa/node_modules"
node ../blue-ocean-qa/node_modules/playwright/cli.js install chromium
export BOM_CHROMIUM="/absolute/path/to/chromium-or-chrome"
export CHROME_PATH="$BOM_CHROMIUM"
export BOM_PACKAGING_BASELINE_ZIP="/absolute/path/Blue_Ocean_Market_V30_69_33_PAYMENT_SETTLEMENT_APPROVALS_GIT_READY.zip"
npm run qa:release
```

The protected ZIP must have SHA256 `a15de0392ca38fe0f920796453e48dccc4781c77cfe8fb37b0d9e8e17d6fa0c3`. It is not nested inside this delivery.

The full gate checks JavaScript syntax, catalog/purchasing/stock/settlement workflows, delegated approvals/production/accounting/evidence, native-currency closure/reversal/tax/rounding, an actual .33 upgrade and repeat startup, authenticated browser workflows, 19 inherited regression suites, and real bilingual statement PDFs. Current aggregate: `qa/evidence/36934-release.json`. A failed command is a failed gate; old-numbered evidence is historical unless the current gate explicitly reran it.

Focused checks:

```bash
npm run qa:packaging
npm run qa:packaging:browser
node qa/qa_v36934_upgrade.js
node qa/qa_v36934_regressions.js
```

For PDF tests, install `pdftotext`, Chromium and Korean fonts. The actual acceptance host needed a test-only Playwright CLI adapter for its serverless browser; that environment limitation is recorded in `DEPLOYMENT_AND_LIMITATIONS.md`. A passing engineering gate does not certify the remaining business workflows listed there.
