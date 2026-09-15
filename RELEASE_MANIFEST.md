# Blue Ocean Market V30.26.4 Release Manifest

**Release:** V30.26.4  
## V30.26.4 changed files
- `public/v319-client.js` — direct runtime reset-button + form-submit binding; explicit initialization failure message.
- `public/index.html`, `server/server.js`, `package.json`, `package-lock.json`, `qa/runtime_smoke.js`, `START_LOCAL_MAC.command` — V30.26.4 release/cache/runtime identity.
- `qa/qa_current.js` — direct reset event-binding regression gate.
- `README.md`, `CHANGELOG.md`, `REQUIREMENTS_MASTER.md`, `RENDER_DEPLOYMENT.md`, `GIT_READY_README.md`, `V30_26_4_IMPLEMENTATION_SUMMARY.md` — release documentation.

**Package:** `Blue_Ocean_Market_V30_26_4_DIRECT_RESET_BUTTON_HOTFIX_GIT_READY_RENDER_PERSISTENT_DISK.zip`  
**Baseline:** V30.26.3 Protected Reset Submission Hotfix

## V30.26.3 changed files

- `public/v318-client.js` — Posting Control is Accounting-only; Finance injection removed; Back to Accounting and contextual View Finance Record added.
- `public/v325-client.js` — legacy supplier search enhancer no longer wraps the canonical Buy Machine supplier autocomplete.
- `public/v326-client.js` — Current Sale Settlement shows only active sale allocations; historical/unallocated buyer receipts remain outside the current settlement list.
- `server/server.js`, `public/index.html`, `package.json`, `package-lock.json`, `qa/runtime_smoke.js` — V30.26.3 release/cache/runtime identity.
- `qa/qa_current.js` — regression gates for Accounting-only Posting Control, single supplier dropdown and current-settlement filtering.
- `README.md`, `CHANGELOG.md`, `GIT_READY_README.md`, `RENDER_DEPLOYMENT.md`, `REQUIREMENTS_MASTER.md`, `V30_26_2_IMPLEMENTATION_SUMMARY.md` — release documentation.

## Inherited behavior

All V30.26.0 sale/payment lifecycle controls and V30.26.1 development/testing reset safeguards remain in place, including Sell Machine freeze protection, guarded DB/uploads reset, Render persistent-disk paths, buyer payment correction/reversal, excess buyer credit, sold-machine lifecycle controls and authenticated PDFs.

## Package exclusions

The Git-ready ZIP excludes runtime databases, SQLite WAL/SHM files, runtime backups, uploaded business files, `.env`, secrets, `node_modules`, Git metadata, OS caches and temporary files. Runtime directories retain `.gitkeep` placeholders where required.

## QA release gate

- `npm run qa:current`
- `npm run qa:render`
- `npm run qa:runtime` on the target Node 22 environment after `npm ci`
