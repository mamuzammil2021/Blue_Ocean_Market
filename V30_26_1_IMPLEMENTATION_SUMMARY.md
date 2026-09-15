# Blue Ocean Market V30.26.1 Implementation Summary

V30.26.1 is a focused hotfix built on V30.26.0. It keeps the complete Excavator sale/payment lifecycle work from V30.26.0 and addresses the two QA regressions reported immediately afterward, while extending the already protected test-reset architecture to the dedicated **development** environment used for current Blue Ocean testing.

## 1. Buy Machine supplier dropdown

- Supplier results are now a floating autocomplete/listbox attached to the full-width Search Supplier field rather than a permanent result panel in document flow.
- Selecting an existing supplier or Other / New Supplier immediately hides and clears the result menu.
- The search input is blurred after selection to prevent an immediate focus-driven reopen.
- The selected supplier summary remains visible and Supplier Available Machine continues to load immediately.
- Escape and click-away close the supplier menu.

## 2. Sell Machine page-unresponsive regression

The V30.26 incoming-account label helper used a document-wide MutationObserver and rewrote the same observed label on every callback. That could continuously generate new child-list mutations once the Sell Machine workflow was rendered, causing Chrome to report **Page Unresponsive**.

V30.26.1 fixes this by:

- making the label update idempotent (`textContent` is changed only when the desired text is different);
- changing the observer callback to a queued `requestAnimationFrame` update rather than direct repeated mutation; and
- adding a single-flight guard around the shared Sell / Update Sale launcher so repeated clicks cannot create overlapping workflow launches.

Both Machines / Deals and Open Machine continue to call the same shared `excavatorSell()` workflow.

## 3. Development database / persistent-disk reset controls

The existing V30.25.2 protected reset workflow is retained and widened from testing-only to **development or testing**. It is enabled only when both conditions are true:

```env
APP_ENV=development   # or testing
ALLOW_TEST_DATA_RESET=true
```

Production remains intentionally blocked. Every destructive operation still requires the existing authorization, current password, reason, typed confirmation, Review & Confirm, audit and automatic pre-reset backup protections.

Available operations remain:

- **Quick Reset** — keeps users/access, BUs and selected core configuration while clearing operational development data, sequences and active uploads.
- **Full Clean Reset** — creates a DB + uploads snapshot, schedules restart, rebuilds the active SQLite DB and clears active uploads. The Render disk stays mounted and protected reset backups stay on disk.
- **Full Reset + Demo** — same as full reset plus configured demo seeding.
- **Restore Last Pre-Reset Backup** — safety-snapshots the current state and restores database + uploads together on restart.
- **Clear Uploads Only** — allowed only when no operational records would be orphaned.

The local Mac launcher now creates a development `.env` with the reset guard enabled for the local test instance. The Render Blueprint example still leaves `ALLOW_TEST_DATA_RESET=false` by default; the dedicated development/testing service must explicitly enable it.

## 4. Git / Render packaging

- Release identity updated to V30.26.1.
- Browser cache version updated so the corrected client files are not hidden behind V30.26.0 cache.
- Health/version identity updated to V30.26.1.
- `.env.example`, Render deployment notes and Blueprint example updated for development reset controls.
- Git-ready package continues to exclude runtime DB files, uploads, backups, `.env`, secrets, `node_modules`, Git metadata and local caches.

## 5. QA gates

`npm run qa:current` includes new checks for:

- supplier results being an overlay dropdown and closing after selection;
- idempotent/queued Sell Machine mutation handling and duplicate-launch protection;
- reset enablement in development/testing only;
- local development reset variables; and
- Render documentation preserving the production disable rule.

`npm run qa:render` verifies the same non-production reset guard together with the existing persistent-disk architecture.
