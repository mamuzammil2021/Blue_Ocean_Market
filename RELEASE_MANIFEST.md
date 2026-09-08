# Blue Ocean Market V30.18.0 — Release Manifest

**Release:** V30.18.0 Finance & Accounting Posting Control Local Test  
**Baseline:** V30.17.0 Access Control Hardening (Access button locally confirmed working)  
**Accounting baseline:** Blue Ocean Accounting Requirements Draft V2 + later Finance Review / Posting Control decision  
**Database policy:** additive migrations; no intentional reset  
**Node:** 22.x

## Release focus

V30.18.0 separates operational Finance control from the official Accounting ledger while keeping both connected to one shared double-entry engine. Operational activity prepares accounting proposals; authorized Finance/Accounting reviewers inspect source evidence and dependencies in Posting Control; only final-posted proposals become official ledger activity.

## Key files

- `server/v318.js` — Posting Control schema, queue/detail/summary, permission-scoped review, source evidence, final posting, correction, manual proposal edit/cancel, reversal finalization and posting history.
- `server/v290.js` — shared accounting engine; proposals default to Pending Review; official-report status filtering; Finance accounting sync; controlled reversal proposals; manual journal evidence/validation; V2 Period Close Readiness, persistent reconciliation sign-off and close/reopen protections.
- `server/v300.js` — prevents duplicate active Pink Salt operational accounting proposals while an existing Pending/Correction/Posted proposal exists.
- `server/v310.js` — import commitment/reversal integration with active-proposal safeguards.
- `server/v313.js` — Pink Salt customer receipt allocation proposal deduplication.
- `server/server.js` — installs V30.18 with upload support and permission-aware Posting Control action counters.
- `public/v318-client.js` — Finance Posting Control UI, Accounting status banner, evidence display, final-post/correction actions, manual journal evidence and correction/cancel workflow.
- `public/v317-client.js` — preserved Users & Access UI/action wiring from the locally verified V30.17 baseline.
- `qa/qa_current.js` — consolidated current-release source/regression checks.
- `Dockerfile` — Render-compatible Node 22 build with native dependency prerequisites.

## Security and accounting integrity

- `.env`, `node_modules`, runtime databases and runtime uploads are intentionally excluded from the release ZIP.
- Normal operational users do not need debit/credit knowledge.
- Pending accounting proposals are not official GL activity.
- Final posting is business-unit scoped and requires effective Accounting approval authority.
- Manual accounting changes require sensitive Accounting-adjustment permission, reason, evidence and a balanced proposal.
- Posted records use controlled reversal/correction rather than destructive deletion.
- Period-close and Finance-verification dependencies are checked before final posting.
- Period close additionally enforces V2 reconciliation readiness: Posting Control, Finance verification/corrections, bank statement reconciliation, accounting exceptions, Trial Balance integrity, suspense/clearing, Inter-BU balance integrity and persistent BU-specific reconciliation sign-offs.
- English/Korean and Review & Confirm protections remain part of the regression baseline.

## Final validation status

- **Consolidated current-release QA:** PASS — 194 checks total.
- **JavaScript syntax:** PASS — all 36 shipped JavaScript files validated with `node --check`.
- **V30.18 accounting/posting-control regressions:** PASS — Finance/Accounting separation, Pending Review isolation, final-post authorization, evidence/manual-journal controls, reversal/correction handling, period close readiness, reconciliation sign-off and V30.17 Access-button regression are covered by the consolidated suite.
- **Package cleanup:** PASS — 50 release files; `.env`, `node_modules`, runtime databases, runtime uploads and historical release clutter are excluded.
- **ZIP integrity:** PASS — archive validates with no compressed-data errors.
- **Runtime smoke:** NOT CLAIMED in the build environment because dependencies could not be installed there (`npm ci` timed out). Run `npm ci`, `npm run qa:current`, then `npm run qa:runtime` locally before production deployment.

This release is therefore **finalized for local testing/source validation**. Production deployment should still include a successful runtime smoke test against the intended database/environment.
