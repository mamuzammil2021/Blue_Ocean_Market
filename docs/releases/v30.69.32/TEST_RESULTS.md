# Actual verification — V30.69.32

Verified protected baseline V30.69.31 → V30.69.32. Local Linux, Node 22.16.0, SQLite through the real application, authenticated Chromium/Playwright; disposable synthetic data only. QA DOCX complete text and all ten screenshots inspected. No production/Render connection, live bank confirmation, push or deployment.

Current aggregate: `qa/evidence/36932-release.json`. **706 named checks / 44 groups passed**, including syntax/startup integrity. These are named assertions/scenarios, not a count of distinct production user journeys. The complete gate was run, followed by focused reruns for final affected server/browser/static modules; the aggregate identifies those reruns. No mock-only acceptance. Historical source-string tests are not substituted for current runtime checks.

| Current test group | Result | Named checks |
|---|---|---:|
| All active server and public JavaScript syntax | PASS | 0 |
| Protected source and Excavator financial-handler integrity | PASS | 5 |
| October17 financial identity, native currencies, approval, operation rollback and downloads | PASS | 16 |
| October17 authenticated browser acceptance and response recovery | PASS | 12 |
| Protected .31 posted valuation migration, audited repair and repeat-start | PASS | 6 |
| Pink Salt reference normalization, corrections, concurrency and rollback | PASS | 24 |
| Pink Salt category, cost state, runtime reference and stale-read browser acceptance | PASS | 17 |
| Protected V30.69.30 defect reproduction, migration and restart | PASS | 7 |
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
| Legacy supplier advance edit, evidence retries, rollback and audited void | PASS | 5 |

## Before/after measurements

One local sample per operation, same synthetic supplier with three invoices and one USD 49,950 payment, four statement rows; same local Chrome runtime. .31 explicitly supplied valuation 1 reproduces the reported arithmetic; .32 uses independently confirmed synthetic valuation 1,000. No real rate is inferred. Enhanced statement descriptions mean output bytes differ. Measurements include response body consumption. They are observations, not statistically significant performance claims or Render SLAs.

| Operation | Baseline .31 ms | New .32 ms |
|---|---:|---:|
| supplier_statement_json | 15.51 | 11.70 |
| supplier_statement_csv | 4.58 | 4.30 |
| supplier_statement_pdf | 170.64 | 174.16 |
| import_metadata_save | 7.32 | 7.35 |

The local statement stall was **not reproduced**. Both versions already download quickly locally; PDF execution isolation/deadlines and download error handling address confirmed reliability risks. There is no claim of a measured production speedup.

The unchanged .31 browser's CEO reason input could not receive a click because processing covered it during the 4,003.71 ms observation. That is a blocked interaction, not a measured completion duration. Current authenticated browser results:

| Browser operation | Measured ms |
|---|---:|
| sensitive_import_save_including_human_confirmation | 407.20 |
| browser_statement_csv | 67.46 |
| browser_statement_pdf | 206.39 |
| browser_receive_confirmation_to_result | 132.16 |

Receiving now completes after the essential stock/status/Accounting transaction, without waiting for an automatic PDF. Explicit receiving-PDF actions remain available. CEO timing includes scripted review/confirmation, not human decision latency. Failure injection, operation-status recovery, concurrent same-key retry and repeated receiving are also tested; raw results in `36932-server.json`.

## Visual and navigation review

Actual generated cost-detail screenshots inspected at 1360×950 desktop, 820×1100 tablet and 390×844 mobile. The cost-specific mobile toolbar remains in normal flow so it cannot cover the title; the browser asserts title/toolbar separation and no horizontal overflow. Evidence links, supporting documents from earlier financial versions, correction reason, current amount, account snapshots, KRW context and expandable revision history were inspected. Screenshots use synthetic data and are local review artifacts, not private QA images shipped in the archive. Korean cost detail and actual bilingual PDF checks pass; existing browser suites cover forms, sticky actions, top alerts, processing, permissions and navigation.

Before screenshots are the provided QA images plus an actual baseline CEO obstruction reproduction. No additional unrecorded before-state screenshot or deployment check is claimed.

## Boundaries

Read `KNOWN_LIMITATIONS.md` and `EXISTING_DATA_REVIEW_AND_REPAIR.md`. Local engineering acceptance passed; live Render acceptance and review/repair of actual historical records remain deployment activities. Existing legacy/manual transactions outside the durable FX model require individual evidence review. No automatic bulk repair or new advance-denomination policy is introduced.
