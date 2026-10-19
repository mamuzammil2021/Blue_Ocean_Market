# V30.69.28 — Actual test results

Current acceptance: **PASS — 579 functional checks across 32 suites**, plus syntax validation of active server/public JavaScript and the 105-entry frontend integrity manifest. The aggregate is `qa/evidence/36928-release.json`. All servers/database records were disposable and synthetic; no production disk, database, credentials or uploads were used.

## Render-level evidence

`36928-hydration-before.json` records 48 authenticated protected V30.69.27 refresh observations. `36928-hydration-browser.json` records 48 corresponding current-release refresh cases with strict assertions on connected DOM writes, animation-frame snapshots, requested sections, unchanged URL/history length, no startup pushState, and one destination trace. No unrelated parent heading is permitted before the final destination. The observer does not hide or suppress DOM rendering.

The full existing system-wide routing matrix passed 136 checks in the current gate. It covers record IDs/sections, list state, date filters, BU selection, access restrictions, copied URLs, Back/Forward, EN/KR, explicit logout and deep-link authentication. The additional lifecycle suite passed 15 checks, including held real API/context responses, one loading state, canceled obsolete requests, stable shell/profile heading identities, 503 Retry, missing records, invalid sections, unavailable BU and restricted users.

## Before/after observations

API counts include the actual browser's startup/context/notification reads. Timing is navigation-to-ready plus the observer's final frame, one sample each on equivalent local synthetic fixtures; it is not a production SLA. Fewer reads do not guarantee every sample is faster.

| Destination | API reads before → after | Observed ms before → after |
|---|---:|---:|
| psSuppliers/supplier | 12 → 10 | 208 → 181 |
| excavatorSuppliers/supplier | 10 → 8 | 167 → 126 |
| excavatorBuyers/buyer | 9 → 8 | 184 → 154 |
| payroll/employee | 14 → 10 | 173 → 149 |
| finance/record | 17 → 15 | 252 → 197 |
| accounting/account | 12 → 7 | 224 → 170 |

The baseline visibly committed module ancestors such as Excavator Suppliers/Supplier Management, Excavator Buyers/Buyer Management, Employees & Payroll, Finance Control Center and Accounts & Finance before the requested records. Current traces commit only the exact destination heading (with legitimate structural/nested components). See `36928-render-comparison.json` for exact headings and figures.

## Acceptance coverage

| Area | Evidence and result |
|---|---|
| Same URL, record and selected section | PASS: 48 strict refresh cases and 136 routing checks |
| No Dashboard/list/default profile section flash | PASS: actual connected DOM writes, frame snapshots and one startup destination trace |
| Slow authentication and record dependencies | PASS: real server responses held, visible loading inspected before release |
| No artificial history entries | PASS: same URL/history length and no startup pushState; Back/Forward matrix |
| Intentional deep links, expired session, ordinary new login | PASS: lifecycle and scoped two-tab auth suites |
| Permission/BU restriction, missing record, temporary outage | PASS: explicit states retain the requested URL; Retry succeeds |
| Shell and targeted section refresh | PASS: shell/header/content/profile-heading identity checks and inherited QA14 targeted-refresh tests |
| Pink Salt | PASS: suppliers/accounts, imports/FX, customer sections/orders, batches, products, lot/family/trace read workspaces and inherited payment/receiving/production tests |
| Excavator | PASS: machine, supplier/buyer sections, Pakistan sections and server-backed payment/advance/refund/sale regression |
| Finance/Accounting | PASS: record/correction, posting review/control, account/journal, asset/financing/foreign loan/ledger and nested reports/workspaces |
| Employees/other modules | PASS: employee sections/payroll run/My Account, restaurant workspaces, tasks, meetings, reports, approvals, documents, notifications, settings/access control |
| Persistent financial history | PASS: V30.69.27 upgrade/restart and inherited .26/.25/.19 migration tests; all protected server logic unchanged |

Navigation depth is semantic: shell → business unit → module → record → selected section, with deeper Accounting workspaces/report state in existing query fields. Temporary mutation forms are not new persistent destinations. See KNOWN_LIMITATIONS.md for non-exhaustive role/record combinations and production staging requirements.

## Reconciliation and reproducibility

The current gate reran all inherited financial suites: exact source-account debit and currency, single Finance movement, fees/FX, balanced journals/controlled proposals, noncash advance allocation, refunds/reversals, immutable corrections, permissions, idempotency and atomic rollback. The source protection check proves six native Excavator mutation handlers unchanged.

Use LOCAL_TESTING.md to reproduce. Before traces are observations of the protected baseline, not assertions that its intermediate rendering was correct. Current acceptance uses the strict non-baseline mode. Historical snapshots remain included for provenance; the current aggregate identifies rerun suites.
