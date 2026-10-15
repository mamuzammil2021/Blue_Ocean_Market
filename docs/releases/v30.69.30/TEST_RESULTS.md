# V30.69.30 actual verification results

Status: PASS — 617 functional checks across 37 suites, including the JavaScript syntax suite.

Environment: Node.js 22.16.0, isolated synthetic SQLite databases, real application servers and authenticated headless Chromium via Python Playwright. No production storage or bank transfers.

Focused results:

- 11 server checks: shared/inverse/three-currency rates, fees, original invoice bases, historical correction, refund direction, atomic rejection, balanced proposals and exact Finance linkage.
- 9 authenticated browser checks: quote section absent across eight forms; one rate for KRW/foreign payments; same-currency and two-pair cases; blur calculation; stored debit and KRW value; cleared stale rates; historical read-only basis; EN/KR.
- 5 protected V30.69.29 upgrade/restart checks: successful startup and preserved historical transaction, cost, Finance, recipient and Chart of Accounts values.
- 3 source-integrity checks: only focused shared-rate server modules changed; cost-lock/server schemas, native Excavator handlers, routing, shell and Accounting/Payroll UI preserved.

The broader gate passed actual Excavator payments, advances/refunds, sale settlement, corrections, Finance verification and Accounting posting; Pink Salt advances/allocations/refunds/costs; permissions/approvals; atomicity/idempotency; cost locks; routing/deep links/slow hydration; ordinary and deep-link login; statements and PDF cache invalidation.

Two historical browser tests initially expected the removed duplicate rate input or a separately typed new-cost accounting basis. They were adapted to assert the shared rate, exact stored value and absence of the obsolete input. The failed suite and all remaining suites were then run; previous actual PASS results on the unchanged application were retained. No check was inferred from a source assertion alone.

| Executed suite | Result | Functional checks |
| --- | --- | --- |
| All active server and public JavaScript syntax | PASS | 0 |
| Protected source and Excavator financial-handler integrity | PASS | 3 |
| Single-entry shared exchange-rate server integrity | PASS | 11 |
| Single-entry rate authenticated browser acceptance | PASS | 9 |
| Protected V30.69.29 upgrade and repeat-start integrity | PASS | 5 |
| October15 focused cost locks, permissions and financial integrity | PASS | 20 |
| October15 authenticated cost and simplified supplier browser acceptance | PASS | 20 |
| Protected V30.69.28 upgrade and repeat-start integrity | PASS | 5 |
| Protected V30.69.27 upgrade and repeat-start integrity | PASS | 5 |
| Direct hydration DOM writes and painted destinations | PASS | 48 |
| Slow hydration, cancellation and authenticated lifecycle | PASS | 15 |
| Supplier saved account and Cash server integrity | PASS | 7 |
| Supplier saved account and Cash authenticated browser | PASS | 12 |
| Protected V30.69.26 upgrade and repeat-start integrity | PASS | 5 |
| Protected V30.69.25 upgrade and repeat-start integrity | PASS | 5 |
| Per-payment recipient financial integrity | PASS | 10 |
| Typed recipient authenticated browser acceptance | PASS | 15 |
| October14 financial correction, statement and logout server acceptance | PASS | 23 |
| October14 account, fee, notification and reversal financial matrix | PASS | 12 |
| Statement balances, date ranges, reversals and evidence integrity | PASS | 8 |
| Preview-only arithmetic and strict API contract | PASS | 7 |
| Encoded static asset release integrity | PASS | 12 |
| Application, Accounting and period-control runtime regression | PASS | 22 |
| Financial integrity E2E | PASS | 18 |
| Pink Salt workflow and reconciliation matrix | PASS | 25 |
| Permission and approval execution matrix | PASS | 7 |
| Excavator financial regression | PASS | 13 |
| Previous-version migration and restart | PASS | 5 |
| October QA server controls, inventory and order atomicity | PASS | 24 |
| October QA authenticated sales and receiving browser | PASS | 14 |
| Authenticated Chromium payment, correction and routing matrix | PASS | 16 |
| Approval detail read integrity and permission boundaries | PASS | 6 |
| Authenticated system-wide routing and deep-link browser matrix | PASS | 136 |
| Native navigation and stale-gzip refresh browser regression | PASS | 27 |
| Scoped logout, repeated login, delayed responses and two-tab deep links | PASS | 7 |
| Actual bilingual statement PDFs and cache invalidation | PASS | 4 |
| October14 authenticated 12-point browser acceptance | PASS | 36 |

Current aggregate: qa/evidence/36930-release.json. Focused details: 36930-shared-rate-server.json, 36930-shared-rate-browser.json, 36930-source-integrity.json and 36930-upgrade.json. Financial examples are in FINANCIAL_RECONCILIATION.md.

Operational limitation: live Render deployment and production validation remain to be performed after staging acceptance. No push or deployment was performed. Historical reports describe older sources; current aggregate lists checks actually run here.
