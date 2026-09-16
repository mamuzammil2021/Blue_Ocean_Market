# Blue Ocean Market V30.29.0 Release Manifest

**Release:** V30.29.0  
**Package:** `Blue_Ocean_Market_V30_29_0_WORKFLOW_UX_FINANCE_VERIFICATION_RESALE_SETTLEMENT_GIT_READY_RENDER_PERSISTENT_DISK.zip`  
**Baseline:** V30.28.0 QA + Finance/Accounting Data Integrity

## V30.29.0 changed files

- `public/v329-client.js` — responsive Buyer/Supplier workspaces, Supplier Open workflow, compact searchable phone-country selector, combined sale settlement UX, Finance Verification financial-account traceability and Pakistan Resales action hard-deduplication.
- `public/v327-client.js` — Pakistan Resale Profit Payment checkbox allocation and protected Review & Confirm flow.
- `public/v326-client.js` — recognizes the combined Buyer Advance + New Payment settlement source.
- `public/v318-client.js` — Posting Queue Transaction Amount and sale/COGS/gross-profit/journal-total review breakdown.
- `public/v284-client.js` — in-place Buyer/Supplier Statement period refresh without modal stacking.
- `server/v326.js` — authoritative combined sale settlement using buyer advance allocation plus one real new Finance receipt, with excess credit handling.
- `server/v318.js` — exposes source/transaction amount separately from balanced journal debit/credit totals.
- `server/server.js` — Finance-only actionable sidebar badge scope, Finance Verification payment-account detail and V30.29.0 release identity.
- `public/index.html`, `package.json`, `package-lock.json`, `START_LOCAL_MAC.command`, `qa/runtime_smoke.js` — V30.29.0 identity/cache/runtime.
- `qa/qa_current.js` — V30.29 regression gates covering the latest workflow and integrity fixes.
- `README.md`, `CHANGELOG.md`, `REQUIREMENTS_MASTER.md`, `GIT_READY_README.md`, `RENDER_DEPLOYMENT.md`, `V30_29_IMPLEMENTATION_SUMMARY.md` — release documentation.

## Inherited behavior

All V30.28.0 Finance/Accounting data-integrity work and all V30.27.0 Pakistan Resales, country-scoped financial accounts, Pakistan→Korea transfer, Finance/Accounting integrity, protected development reset and Render persistent-disk safeguards remain in place.

## Schema / data handling

V30.29.0 is schema-preserving relative to V30.28.0. Keep the existing database and uploads; do not reset production/test data merely to install this release.

## Package exclusions

The Git-ready ZIP excludes runtime databases/WAL/SHM, runtime backups, uploaded business files, `.env`, secrets, `node_modules`, Git metadata, OS caches and temporary files.

## QA release gate

- `npm run qa:current` — **PASS**
- `npm run qa:render` — **PASS**
- `npm run qa:runtime` — run after `npm ci` in the target Node 22 environment.
