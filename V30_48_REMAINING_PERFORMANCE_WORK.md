# Blue Ocean Market — Outstanding Performance Work after V30.48.0

This is the authoritative remaining-work register, not a claim that V30.48.0 finished every original performance goal. Keep the current protected release as source and always run inherited regression QA.

| Priority | Workstream | Remaining work and completion evidence |
| --- | --- | --- |
| Critical | Authenticated acceptance | Run signed-in real Express/better-sqlite3 tests with CEO and BU-restricted users, real evidence, Finance/Accounting/Pink Salt reconciliation; no unverified release promotion. |
| Critical | Render load | Benchmark realistic 1/3/5/10 concurrent users and representative record counts; record CPU, memory, page usable time, API p50/p95, total/slow SQL, loop lag and write contention; tune against measured bottlenecks. |
| High | Frontend canonical architecture | Audit and migrate actual responsibilities of 18 remaining served-runtime MutationObservers one workflow at a time; replace historical patch functions only after behavioral parity and rollback checks. Split genuinely independent BU modules with dependency-safe on-demand loading, retaining protected eager cross-module logic as long as required. |
| High | Accounting data/API | Complete high-volume server pagination, compact summaries and N+1 cleanup in still-unconverted Accounting transaction/history/report paths. Verify full-dataset totals, balances, permissions and postings. Keep deterministic explicit pager, not infinite scrolling. |
| High | Pink Salt data/API | Existing customers/orders list SQL aggregates are bulk now but still return full row arrays; implement incremental server-filtered paging where record volumes justify it, preserving all dependent consumers and financial totals. Review other supplier/import/stock/order history query paths and response sizes. |
| Medium | Shared API/startup | Further optimize sidebar badges/action counts, startup/backfill/migrations, secondary attachment/history payloads, compact endpoints and avoid duplicate Korean traversal after measuring actual bottlenecks. |
| Medium | UI rendering | Selectively consider bounded scroll/virtualization in other long card feeds only where visually and operationally beneficial, never as a global replacement for Finance/Accounting/Audit/work queues. Preserve focus, keyboard use and scroll/detail context. |
| Mandatory | Regression/observability | Expand real runtime permission/finance/inventory tests, SQL query count/response size budgets and benchmark trend thresholds. Explicit PASS/FAIL/BLOCKED/NOT RUN in every release report. |

Do not declare completion based on number of version releases or removal of every observer. The criterion is correctly preserved functionality and measured performance on real representative data.
