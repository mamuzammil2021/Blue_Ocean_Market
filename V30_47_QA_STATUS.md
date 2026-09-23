# Blue Ocean Market V30.47.0 — QA Status

## PASS in the build environment
- Dedicated `npm run qa:v347` includes release/cached assets, permission and legacy API retention, scoped SQL counts/limits, approval reviewer batching, observer/sensitive-workflow integrity, module load deduplication and fail-safe fallback. New browser regression verifies preserved headings/filters when old navigation passes a DOM element.
- `npm run qa:release`: inherited V30.46 scheduler/diagnostics, V30.45 unified feedback, V30.44 account actions, V30.43 workflow guards, comprehensive JavaScript static/source checks and Render persistent-disk checks.
- `npm run qa:v347:browser`: Chromium static fixture with mocked API, lazy module not loaded at login, first-load Tasks/Approvals/Documents and visible document tabs, original navigator binding, and no uncaught page errors. **This is not an authenticated native backend test.**
- JavaScript syntax, gzip/source match and ZIP integrity must be confirmed in packaging step.

## NOT RUN / ACCEPTANCE LIMITS
- `npm ci` could not complete from the offline cache (`wrappy` tarball missing), and the network-based attempt could not retrieve dependencies. Native `better-sqlite3`/Express authenticated integration is **NOT RUN**; no claim of live SQL performance/authorization equivalence is made from static fixture tests.
- Authenticated production/staging Render EN/KO, task/approval/document mutation/permission tests and Finance/Accounting full workflow regression: NOT RUN here.
- Real concurrent multi-user Render load testing, baseline comparisons and measured latency/memory thresholds: NOT RUN here.

## Required signed-in acceptance before production promotion
1. CEO/all BU and restricted user: Tasks owner/BU filter, search, status, 25/50/100 paging, actionable task/detail and after-save targeted refresh.
2. Approvals: Pending/Resubmitted/Changes Required, maker-checker, dual Finance/CEO, reminders, revisions, execution, role and scoped review permissions, and original detail/actions.
3. Documents: active/final/archived, no unauthorized archived disclosures, upload/preview/archive/restore/history and permissions.
4. Lazy loading when first opening each view, hard refresh, reselect, module failure fallback; EN/KO and slow browser behavior.
5. Purchase/Sale/void/refund, Finance, Accounting account drilldown, evidence, ledger allocations and posting gates; no duplicate action feedback.
6. Verify real response payload/SQL/event-loop diagnostics with representative Render persistent data, concurrent users and rollback readiness. Do not enable detailed diagnostics without appropriate authorization.
