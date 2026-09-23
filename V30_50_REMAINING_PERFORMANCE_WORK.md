# Blue Ocean Market — Remaining Performance Work after V30.50.0

Status is explicit: **source work has progressed, the full performance program is not signed off.** Build from the newest actual protected source, preserve financial/inventory behavior, and carry forward the permanent regression gate.

| Priority | Remaining work | Evidence required for closure |
|---|---|---|
| Critical | Authenticated native runtime acceptance | `npm ci` on Node 22 with native better-sqlite3; CEO + BU-restricted login, list/detail/mutation, EN/KO; payments/refunds/voids/GL/approvals/reconciliation and stock receiving/repacking/waste. Check balances, permissions and audit history. |
| Critical | Live Render 1/3/5/10-user representative benchmark | Authorized staging URL and user credentials/tokens, realistic dataset; request p50/p95, first-useful screen, SQLite query duration/write contention, event loop, CPU/RAM and payload sizes. Compare baseline and current. Existing opt-in `npm run bench:v349:staging` is read-only and does not replace write-load or visual acceptance. |
| High | Canonical BU lazy frontend and legacy observer retirement | 15 sensitive/legacy served-runtime observer constructors remain. Trace owner/dependencies; migrate one workflow at a time, test before removal. Do not mechanically remove sale/account/permission/modal protection; keep protected eager cross-BU logic until native parity. |
| High | Other large Accounting and Pink Salt history/stock/packaging views | Scope/filter/page in database only where useful to real screens; detail/forms need full data. Verify full-scope authoritative money and inventory totals, N+1 count and response bytes. |
| Medium | Startup/backfill, compact summary, badge and secondary payload work | Measure bottlenecks on live representative data, use safe invalidation and ensure no stale approvals, totals, receipts or account balance. Avoid speculative broad refactor. |
| Mandatory | QA/observability trend regression | Protected source QA + native/runtime + real browser + Render persistence + benchmark thresholds; report PASS/FAIL/BLOCKED/NOT RUN and never equate mocked fixture with production acceptance. |

No global virtualization/infinite scroll mandate: loading is chosen screen-by-screen for performance, UX, predictable reconciliation and accessibility.
