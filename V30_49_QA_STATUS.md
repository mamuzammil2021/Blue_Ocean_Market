# Blue Ocean Market V30.49.0 — QA and Acceptance Status

## PASS — Source and fixture verification

- `npm run qa:v349`: dedicated source/regression checks for scoped Pink Salt pages, Accounting GL paging, legacy financial routes, 15 remaining protected served-runtime observer constructors, and release integration.
- `npm run qa:v349:sql`: Python SQLite fixture executes representative new SQL expressions against active, cancelled, voided and foreign-BU transactions; verifies page/full-summary consistency and cross-BU isolation.
- `npm run qa:v349:browser`: static Chromium with mocked signed-in API; checks Pink Salt Customers/Orders initial pages, search/page controls, full-dataset KPIs, General Ledger page controls and no unnecessary account-master request or uncaught browser errors.
- `npm run qa:v347:browser` and `npm run qa:v348:browser`: previous static browser fixtures, updated only for the current asset/version identity.
- `npm run qa:release`: V30.49 dedicated plus inherited V30.48/47/46/45/44/43, current JS/static and Render persistence checks.
- Syntax check of all JavaScript under `public`, `server` and `qa`; precompressed asset byte match, ZIP integrity and SHA-256 verification recorded during final packaging.

## NOT RUN — Critical live gates

- Native dependency-backed authenticated Express/better-sqlite3 integration: `npm ci` is unavailable in this offline source environment. No claim that actual login, permission, payment, refund, posting, archive or full multi-unit workflows passed natively here.
- Actual signed-in Render CEO/restricted-user EN/KO acceptance, production-shaped database and 1/3/5/10 concurrent-user benchmark, CPU/memory/SQLite write contention and page p50/p95: NOT RUN. Use `npm run bench:v349:staging` on an authorized staging service; it is read-only and not by itself a full interactive or write-load test.

## Protected production acceptance matrix

1. Pink Salt Customers/Orders: BU isolation, search/filter/pageSize/Prev/Next, full-data KPI totals and cancelled/voided accounting treatment. Test list → detail → return; new sale/payment/refund/credit/Finance/Accounting remain unchanged.
2. General Ledger: user BU scope, period filters, summary versus detail debit/credit, balance, period close, permission and manual journal/reversal controls. Explicit pagination, not infinite scroll.
3. Excavator purchase/sale/advance/void/PDF, account actions V30.44, feedback V30.45, Tasks/Approvals/Documents lazy V30.47, Notifications V30.48, bilingual messages, Render disk persistence.
4. Performance: compare representative data at 1/3/5/10 users; capture CPU/RAM, API p50/p95, SQL/response size, loop lag and write contention. Do not declare performance-program completion or production acceptance without this evidence.

**Release status:** Git/Render-ready source package after local QA, NOT fully production-verified. See `V30_49_REMAINING_PERFORMANCE_WORK.md` for the work still open.
