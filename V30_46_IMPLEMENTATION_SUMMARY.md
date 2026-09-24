# Blue Ocean Market V30.46.0 — Implementation Summary

## Source and release principle
Built directly on protected V30.45.0 (the actual verified ZIP), not V30.39.2. This is a **measured continuation** of the remaining performance program, not a claim that every historical screen is now optimized. The V30.45 shared action-feedback coordinator and all later protected business functionality remain in place.

## Implemented in this release
1. **Priority-aware request scheduler** (`public/v346-client.js`, wired in actual consolidated runtime): four global same-origin API GET/HEAD reads and no more than two heavy reads at once. Critical header/summary reads have queue priority. Aborted queued requests are discarded. Mutation calls, cross-origin calls, existing deduplication, and server transaction semantics are untouched.
2. **Safe DOM consolidation** (`public/bom-mutation-hub.js`): seven audited, idempotent DOM enhancement observers moved to one dispatcher. The actual served runtime has 24 remaining historical observer constructors. Sensitive sale-validation, permission, payment/account and modal observers are explicitly retained; no blanket observer monkeypatch.
3. **Server-side Notifications and Audit paging**: default 25, selectable 25/50/100, server-side filters before SQLite `LIMIT/OFFSET`, context preserved during normal targeted refresh. Authorization/BU rules mirror the previous views. Existing array APIs remain available for dependent modules.
4. **Pink Salt query cleanup**: supplier price-tier item loading uses one scoped bulk query and groups by tier while retaining ordering.
5. **Opt-in diagnostics**: request duration, response bytes, query counts/duration and bounded endpoint trends with SQL fingerprints instead of raw SQL or values. Endpoint is authenticated/permission-gated. `BOM_PERF_DETAILED=false` by default.
6. **Permanent QA documentation**: `REQUIREMENTS_MASTER.md` specifies affected-workflow + inherited regression tests and transparent PASS/FAIL/BLOCKED/NOT RUN evidence. Release gate `npm run qa:release` combines V30.46 dedicated, V30.45 feedback, V30.44 Cash/Bank account actions, V30.43 inherited, current full-source static, and Render persistent-storage checks.
7. Versioned browser assets, regenerated matching `.gz` compression, app and lockfile identity, health/release identity and Git/Render documentation.

## Explicitly remaining — do not silently treat as done
- Convert remaining 24 served-runtime observer constructors and other historical scripts **one protected workflow at a time**, build canonical frontend modules and truly lazy-load unrelated BU runtimes.
- Migrate remaining Accounting, Pink Salt, Approvals, Documents, Tasks, and other high-volume lists to true server paging and complete complex N+1/summary API work.
- Validate and improve startup/backfill tasks, repeated Korean translation traversals, sidebar counts, API/attachment payloads, fine-grained SQL query performance and full first-useful-view timing.
- Run dependency-backed authenticated end-to-end workflows, representative Render data sets and real concurrent multi-user load tests; tune concurrency based on actual host/database measurements.

## Deployment safety
No destructive migration or persistent-disk change; keep `/var/data` and secrets. Set `BOM_PERF_DETAILED=true` only in controlled diagnostics sessions and protect access. Run `npm ci`, `npm run qa:release` and the applicable runtime suites before production promotion; do a signed-in EN/KR browser regression for sale, purchase, Finance, Accounting, Notifications and Audit. Do not represent static browser-shell QA as authenticated acceptance.
