# Blue Ocean Market V30.34.0 — Stable UI Chrome & Slow-Connection Integrity

V30.34.0 builds on V30.33.0 targeted refresh and fixes remaining visible re-render/flicker of persistent controls.

## Main changes
- Accounting Simple View tabs now update only `accountingSimpleBodyV291`; the page title and Open Finance / Open Advanced Accounting / Posting Control controls remain mounted.
- Added a defensive stable-action layer so historical overlays cannot unnecessarily replace equivalent Accounting action controls.
- Full-screen workflow refreshes with the same heading reuse the existing workflow shell instead of rebuilding the toolbar.
- Buyer Detail reuses the existing Buyer Statement / Pakistan Resales / Payment Accounts action DOM when semantics are unchanged.
- Duplicate in-flight Buyer Detail refreshes are coalesced to prevent 2–3 visible redraws from linked handlers.
- Stable action regions suppress unnecessary animation/transition during data revalidation.
- Added `window.BlueOceanStableUI` helper and a standing Stable UI Chrome / Slow-Connection Rendering architecture rule for future work.

## Data / schema
No database schema changes. Existing database, uploads, and Render persistent disk must be preserved.

## QA
Run `npm run qa:v334`, `npm run qa:current`, `npm run qa:v333`, `npm run qa:v332`, and `npm run qa:render`. Run `npm ci` + `npm run qa:runtime` on the target Node 22 environment before production acceptance.
