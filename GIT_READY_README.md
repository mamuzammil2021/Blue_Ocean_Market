# Git / Render Ready — V30.52.0

Protected baseline V30.51.0, direct new QA/stability changes only. Copy source contents into your existing Git checkout; retain `.git`, `.env`, current SQLite DB, uploads/evidence, backups, and the existing Render persistent disk at `/var/data`. Do not execute a reset or change the disk mount. On Node 22 run `npm ci && npm run qa:release && npm run qa:v352:runtime` in a dedicated test environment, then stage on Render and verify `/api/health` reports `30.52.0`. Verify 9 QA points as real workflows in both English/Korean using both CEO and restricted users. Keep the verified V30.51.0 ZIP for rollback.

Local release source QA passed, but runtime smoke could not start in the offline builder because npm dependency installation did not complete (missing `express`); no live Render test or successful authenticated end-to-end claim. See `V30_52_QA_STATUS.md`.

# Git / Render Ready — V30.51.0

Deploy this V30.51.0 candidate on Node 22 using existing `/var/data`, without overwriting `.git`, secrets, SQLite, uploads, evidence, or backups. `npm ci && npm run qa:release && npm run qa:v351:browser`. Check version from `/api/health`, then perform actual CEO/scoped-user, EN/KO, finance, stock and multi-user staging acceptance. Roll back to V30.50.0 if needed. Native and live acceptance were not run in the offline build environment.

# Git / Render Ready — V30.50.0

Use actual protected V30.49.0 as source. Copy contents into current Git checkout without touching `.git`, `.env`, production SQLite, `/var/data`, evidence, uploads or backups. On Node 22: `npm ci`, `npm run qa:release`, `npm run qa:v350:sql`, `npm run qa:v350:stock-sql`, and browser fixtures in staging. Health should report 30.50.0. Validate Pink Salt import list → detail → payment/advance/receive, raw-stock totals/traceability, production/waste and restricted BU/EN/KO. No destructive migration/reset. Keep V30.49.0 rollback package. Live authenticated and multi-user staging acceptance is **not** claimed from source fixture results. See V30_50_QA_STATUS.md.

---

# Git / Render Ready — V30.49.0

Built on the verified V30.48.0 source. Copy release source into the current Git checkout without overwriting `.git`, `.env`, production SQLite, `/var/data`, uploads, backups or evidence. On Node 22 run `npm ci && npm run qa:release`, `npm run qa:v349:sql`, `npm run qa:v349:browser`, `npm run qa:v348:browser`, `npm run qa:v347:browser`, plus authenticated/native E2E as available. Deploy to the same Render service and persistent disk; do not reset data. Confirm `/api/health` reports 30.49.0 and validate signed-in CEO and restricted BU users, bilingual Pink Salt pagination/KPIs/payment state, and General Ledger navigation and totals. Only after live staging checks consider production promotion. `npm run bench:v349:staging` is opt-in read-only and requires a staging URL/token; it was NOT run in this source environment. Use `V30_49_QA_STATUS.md` as the acceptance gate and preserve the previous V30.48.0 archive for rollback.

---

# Git / Render Ready — V30.48.0

**Protected source:** actual V30.47.0 release, not V30.39.2. This is selective smart loading and bulk list-read optimization; it does not claim the entire historical performance backlog is finished. Copy the contents into an existing Git checkout preserving `.git`, `.env`, `/var/data`, SQLite, uploads and evidence. Node 22: `npm ci && npm run qa:release`; also run `npm run qa:v348:sql`, `npm run qa:v348:browser`, `npm run qa:v347:browser`, and applicable native tests. Deploy the existing Render service without resetting its persistent disk. Confirm `/api/health` identifies `30.48.0`; hard-refresh versioned browser assets. Perform the authenticated acceptance matrix in `V30_48_QA_STATUS.md` before promotion. If the new notification module fails, the original explicit pager is retained. Optional private diagnostics stay disabled unless `BOM_PERF_DETAILED=true` is deliberately enabled by authorized operators.

---

### V30.47.0 release gate and deployment

Starting from the actual V30.46.0 protected ZIP, run `npm ci`, `npm run qa:release`, `npm run qa:v347:browser`, and the applicable native runtime smoke/integration suites on Node 22. Preserve Render persistent storage (`/var/data`) and existing secrets/uploads. Verify signed-in EN/KO pages, approval permissions, document archive/restore, task actions, Payments, Finance and Accounting before production promotion. The static browser fixture is NOT a live authenticated application test. For detailed diagnostics, `BOM_PERF_DETAILED=true` is optional and must be used only in controlled sessions.

# Git / Render Ready — V30.45.0

Built from the V30.44.0 protected archive. Copy release code into your Git checkout without overwriting `.git`, `.env`, `/var/data`, SQLite, uploads, evidence or backups. Install with `npm ci` on Node 22, run `npm run qa:v345 && npm run qa:v344 && npm run qa:v343 && npm run qa:current && npm run qa:render`, deploy the existing Render service and confirm `/api/health` reports `30.45.0`. Hard-refresh to load the versioned `v345-client.js` after V30.44. No database migration/reset. Keep V30.39.x and V30.40–V30.44 functionality. Do not merge before real account/approval/payment/accounting acceptance on Render.

---

# Git / Render Ready — V30.44.0

Built directly on the supplied V30.43.0 source ZIP. This targeted release keeps the existing repository/persistent data and repairs the Cash & Bank account actions in both Simple and Advanced Accounting views. Both use the same V30.43 account details, statements, PDF and transfer workflow.

**Recommended:** create a new Git branch, copy these release files over the repository (do not overwrite `.git`, `.env`, persistent database, uploads or backups), run `npm ci && npm run qa:v344 && npm run qa:v343 && npm run qa:current && npm run qa:render`, then push and test the branch on Render before merging. No database reset.

# Git / Render Ready — V30.43.0

V30.43.0 is built directly on V30.42.0 and is intended to be copied into/cloned over the existing Git repository while preserving the repository's `.git` directory, environment secrets and persistent runtime data.

## Main release scope
- targeted Supplier/Buyer section refresh after child mutations;
- browser-refresh restoration of current child/detail workflow and selected section;
- Machine Cost direct Edit remains available until Finance actually acts;
- no duplicate Purchase Edit inside Costs; Sold / Completed Purchase is locked;
- sold-machine document Delete / Archive restricted to CEO / Owner;
- optional Buyer Sending Account on Buyer Payment and Sell Machine receipts;
- Accounting Cash & Bank account drill-down with balance/statement history;
- generated Account Statements and authenticated PDF download;
- controlled same-BU company-account transfers and preserved Inter-BU workflow;
- V30.42 actionable Tasks and Smart Access Control retained.

## Recommended local QA before push/deploy
```bash
npm ci
npm run qa:v343
npm run qa:current
npm run qa:render
npm run qa:v342:runtime
npm run qa:v341:runtime
npm run qa:runtime
```

The clean release ZIP does not include `node_modules`, `.env`, runtime database files, uploads or backups.

## Git workflow
Create a new branch from the current stable repository, copy the **contents** of this release into that clone without replacing `.git`, review `git status`, commit and push the branch. Test on Render before merging to the stable/main branch.


### V30.46.0 release gate
Run `npm ci`, then `npm run qa:release`, then applicable runtime suites. Deploy with existing Render persistent disk `/var/data`; verify authenticated workflows after deploy. Optional private diagnostics: `BOM_PERF_DETAILED=true`; endpoint `/api/v346/performance/diagnostics` requires dashboard/finance module permission. Do not enable detailed profiling without operational review on a small production instance.
