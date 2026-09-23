# Blue Ocean Market — Remaining Work after V30.51.0

Do not repeatedly declare the full performance program finished based on static tests or version number. Source-protected V30.51.0 includes selective route lazy loading and prior data paging, but the following evidence-based work is open:

| Priority | Work | Completion evidence |
| --- | --- | --- |
| Critical | Native authenticated functional regression on a staging DB | `npm ci` in Node 22; CEO/restricted user and BU cross-access, EN/KO; purchase, sale, payment, refund, advance allocation, Finance verification, GL posting/reversal, account drill-down, Pink Salt stock/production/waste; totals and evidence reconcile. |
| Critical | Live Render performance and concurrency | 1/3/5/10 simultaneous users with representative data and authorized accounts; compare baseline, p50/p95, first useful section, request count/payload, SQL time, event-loop lag, CPU/RAM and write contention. |
| High | Canonical cross-BU frontend architecture and protected observers | Actual consolidated runtime remains large, 15 sensitive observer constructors remain. Trace each workflow, migrate/test one by one only when native parity can be executed; do not remove protection simply to reduce the counter. |
| High | Remaining Accounting/Pink Salt history and data paths | Selective server-backed paging/aggregation based on measured hot endpoints; preserve full authoritative totals, constrained scope and complete data for transaction forms. |
| Medium | Startup, badge, compact summary and attachment payload costs | Prioritize only after real diagnostics identify repeated work and include safe invalidation/permission and rollback tests. |
| Mandatory | Continuous QA/benchmark trend gate | Define measurements from real staging; keep dedicated/inherited QA PASS/FAIL/BLOCKED/NOT RUN and regression test each reported defect. |

Select loading pattern by screen: card feeds can use bounded scroll; Finance, Accounting and Audit retain predictable pagers. Protected financial writes must not be queued behind read requests.
