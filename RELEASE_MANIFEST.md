# Blue Ocean Market V30.53.0 — Financial & UX regression candidate

- Protected source: V30.52.0 exact recovered ZIP (baseline checksum recorded during source extraction).
- Ten consolidated new requirements; see `V30_53_IMPLEMENTATION_SUMMARY.md`.
- Inherited and dedicated QA must pass; browser and authenticated Render testing required before production.
- No DB reset, storage change or destructive migration.

---

# Blue Ocean Market V30.52.0 — QA / Stabilization Release Manifest

- Source: independently verified protected V30.51.0 ZIP; full historic code retained.
- Changes: 9 user QA points as recorded in V30_52_IMPLEMENTATION_SUMMARY.md.
- Additive migration: buyer payment allocations `created_at` and non-destructive backfill/trigger. Do not reset, replace or wipe production DB.
- Render persistent disk, startup scripts, permission checks and 15 sensitive observers retained; no new hosting cost/instance required.
- Verification: source syntax, inherited QA and V30.52 dedicated static suite passed. Offline runtime/Render acceptance outstanding due unavailable npm dependencies; stage and run the real workflow matrix before production rollout.

## V30.51.0 protected-source addendum

Latest source is the complete V30.51.0 archive, built from actual V30.50.0. Three independent Pink Salt read presentation modules are now lazily loaded on route; Accounting direct tab and the 15 sensitive observers are retained eagerly. Only client read-view scripts and QA/docs/version identifiers changed. No write API, DB migration, or persistent storage change. Dedicated and inherited source checks required on every future build. See V30_51_QA_STATUS.md.

# Blue Ocean Market V30.49.0 Release Manifest

- Direct protected source: verified V30.48.0 ZIP. Read-side performance changes only; existing financial mutations, posting, approvals and single-record validation preserved.
- Authenticated, BU- and permission-scoped SQL pages for Pink Salt Customers and Orders, with full-dataset authoritative KPIs and unchanged legacy array APIs for dependent workflows.
- Advanced Accounting General Ledger uses scoped, bounded journal pages with debit/credit totals over selected journal rows; existing detail and original journal APIs remain.
- Three audited idempotent observers migrated to shared hub; 15 protected constructors remain. No blind observer removal or broad BU split.
- Permanent regression gate, SQL financial fixture and mock Chromium page validation, plus opt-in staging benchmark tool. See `V30_49_QA_STATUS.md` and `V30_49_REMAINING_PERFORMANCE_WORK.md`.
- Persistent `/var/data` and existing DB/uploads/evidence/backups/secrets unchanged; no reset or destructive migration. Live authenticated acceptance and production-shaped multi-user Render benchmark are NOT RUN.

---

# Blue Ocean Market V30.48.0 Release Manifest

- Release: V30.48.0 — Selective Smart Loading & Pink Salt Bulk Read Optimization.
- Direct protected source: V30.47.0 ZIP, verified; inherits V30.39–V30.47 and V30.45 one-feedback rules.
- Notifications only: scoped SQL keyset card feed with predictive/manual 25-card batches, 250 rendered card limit then preserved paged alternative; bell preview bounded 25, authoritative full unread count. Audit/Finance/Accounting pager unchanged.
- Pink Salt customer/order LIST financials grouped in BU-scoped bulk reads; original single-record settlement checks and ledger mutations unchanged. Original list API shapes remain.
- Audit indexable date filter/read index, bounded opt-in performance percentiles, one safely audited account-label observer migration; 18 protected served-runtime observers remain.
- No destructive migration/reset. Do not change existing Render `/var/data`, DB, evidence, files or secrets.
- Dedicated/inherited/static browser/SQLite fixture QA in `V30_48_QA_STATUS.md`; live authenticated Node/Render multi-user tests NOT RUN. Backlog: `V30_48_REMAINING_PERFORMANCE_WORK.md`.

---

# Blue Ocean Market V30.47.0 Release Manifest

- Release: V30.47.0 — Paged Workspaces & Safe Runtime Consolidation.
- Direct protected source: V30.46.0; no destructive migration, no changes to Render disk path, do not reset /var/data.
- Added canonical SQL-paged Tasks/Approvals/Documents with original role/owner/BU and archive restrictions; legacy list APIs kept.
- Workspaces JS lazy on first visit with fallback; existing cross-module modules remain eager pending dependency verification.
- Five audited idempotent observer paths migrated to one hub; 19 historical sensitive/legacy constructors remain in served runtime.
- Batched KO mutation traversal, optional event-loop metrics and bounded first-useful-section metrics.
- Permanent regression QA: `npm run qa:release` and `npm run qa:v347:browser`; the latter uses mocked pages, not authenticated native API.
- QA: `V30_47_QA_STATUS.md`. Native Express/better-sqlite3, actual authenticated Render QA, and real multi-user load not executed here.

---

# Blue Ocean Market V30.46.0 Release Manifest

- Release: V30.46.0 — Performance Continuation (bounded reads / diagnostics / safe observer consolidation / selective paging)
- Protected direct baseline: V30.45.0 Unified Action Feedback; preserves V30.40–V30.44 Access, Tasks, Finance and Accounting work.
- Shared read scheduling: same-origin API GET/HEAD only, 4 total concurrent and 2 heavy reads; prioritize critical summaries, abort queued requests. Mutating requests never enter this queue.
- DOM: seven audited, idempotent enhancers now use one shared child-node dispatcher; sensitive sale/account/permissions observers remain.
- Canonical Notifications and Audit views: server-filtered SQLite pagination 25/50/100; legacy read-array APIs preserved for dependent callers.
- Pink Salt: supplier price-tier item retrieval changed from per-tier N+1 to BU-scoped bulk query.
- Diagnostics: optional request-level timing, response bytes and SQL measurement with bounded, redacted authorized view (`BOM_PERF_DETAILED=true`). Disabled by default; native dependency-backed instrumentation remains an acceptance check.
- No destructive database migration, data wipe or persistent-storage change. Do not reset the Render `/var/data` disk.
- Permanent regression requirement added to `REQUIREMENTS_MASTER.md`; `npm run qa:release` is the offline/static release gate, NOT a live-authenticated acceptance substitute.
- QA report: `V30_46_QA_STATUS.md`. Implementation summary: `V30_46_IMPLEMENTATION_SUMMARY.md`.
- Not complete: fully canonical BU-lazy frontend, remaining observer migrations, remaining pagination/N+1/summary APIs/startup and translation work, live authenticated Render load and multi-user testing. See QA status.

---

# Blue Ocean Market V30.45.0 Release Manifest

- Release: V30.45.0 — Unified Action Feedback
- Direct protected baseline: V30.44.0; all later access, Tasks, Finance and Accounting work retained
- Changed runtime presentation hooks: served consolidated `runtime-v30392.js` (V30.14, V30.38.2, V30.39 paths)
- New shared client: `v345-client.js`, loaded after protected `v344-client.js`
- Server API/database schema/data migration: none; Render persistent disk and uploads unchanged
- QA: `qa:v345`, inherited `qa:v344`, `qa:v343`, `qa:current`, `qa:render`
- Deployment: update Git/Render service in place; do not reset persistent database or mount
- Manual signed-in production acceptance: still required

---

# Blue Ocean Market V30.44.0 Release Manifest

- Release: V30.44.0 — Persistent Cash & Bank Account Actions
- Direct protected baseline: V30.43.0 (all V30.43 features preserved)
- Scope: persistent Simple/Advanced account Open buttons; shared V30.43 account detail; preserve mode on Back
- Database/API changes: none (existing V30.43 API reused)
- Existing SQLite/uploads/backup/Render disk: unchanged; no destructive reset
- Live browser: versioned V30.44.0 scripts through `public/v344-client.js` last
- Precompressed changed assets: runtime-v30392.js.gz, v343-client.js.gz, v344-client.js.gz
- QA: qa:v344, qa:v343, qa:current, qa:render
- Reports: `V30_44_IMPLEMENTATION_SUMMARY.md`, `V30_44_QA_STATUS.md`
- Before production: `npm ci` and dependency-backed runtime/real authenticated browser tests

---

## Prior release reference
# Blue Ocean Market Release Manifest

- Release: **V30.43.0 — Workflow Context, Buyer Sender Accounts & Accounting Statements**
- Direct baseline: **V30.42.0 — Actionable Tasks & Smart Access Control**
- Protected lineage: **V30.39.2 performance/data-path + V30.40–V30.42 access/task/Finance correction safeguards retained**
- Release type: **QA workflow refinements + optional buyer sender accounts + Accounting account drill-down/statements/transfers**
- Destructive migration/reset: **None**
- Database changes: **additive `excavator_buyer_payments.buyer_sender_account_id` + `accounting_account_transfers_v343` table/indexes**
- Existing users/profiles/groups/policies/approval/task configuration: **Preserved / compatible**
- Existing SQLite data/uploads/evidence/backups/Render persistent disk: **Preserved / compatible**
- Live browser delivery: **7 scripts (`i18n-ko.js`, `client.js`, `runtime-v30392.js`, `v340-client.js`, `v341-client.js`, `v342-client.js`, `v343-client.js`)**
- Precompressed V30.43 browser asset: **`public/v343-client.js.gz` included**
- Implementation summary: `V30_43_IMPLEMENTATION_SUMMARY.md`
- QA status: `V30_43_QA_STATUS.md`
- Dedicated V30.43 QA: `npm run qa:v343` — **PASS in build environment**
- Current/inherited regression QA: `npm run qa:current` — **PASS in build environment**
- Render persistence QA: `npm run qa:render` — **PASS in build environment**
- Dependency-backed runtime suites: **packaged; run after `npm ci` in a normal Node 22 environment**

## V30.43 acceptance focus
- Supplier Available Machines and Buyer Payments refresh immediately after successful child mutations.
- Refreshing a Supplier/Buyer/Machine/etc. child workflow restores the same child context instead of returning to the parent list.
- Untouched/unverified Finance-linked machine costs remain directly editable; Finance action/Accounting posting locks normal Edit.
- Purchase does not expose duplicate Edit in Costs; Sold / Completed Purchase is locked in UI and backend.
- Sold-machine document Delete / Archive is CEO / Owner-only in UI and backend.
- Buyer Sending Account is optional, reusable and separate from the company Receive Into account.
- Accounting company financial accounts open to balance/statement detail.
- Account statement supports selected period, opening/in/out/running/closing balances and authenticated PDF download.
- Same-BU account transfer creates balanced Accounting entries; cross-BU uses the established Inter-BU workflow.
- V30.42 actionable Tasks, Finance correction task chain, notification deep-links, CEO Full System Access and smart permission evolution remain active.

## Deployment note
Do not reset the database or persistent disk. Deploy normally and let additive schema initialization run on startup. Verify `/api/health` reports `30.43.0`. Run dependency-backed runtime/API gates after `npm ci` before production promotion.
