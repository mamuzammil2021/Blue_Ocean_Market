# Actual verification — V30.69.33

Protected source: V30.69.32. Current isolated acceptance: **PASS — 734 named checks / 47 groups**. Node 22.16.0, actual application servers, disposable SQLite data, authenticated Chromium/Playwright, Korean fonts and synthetic evidence. No production data, Render deployment, actual bank API or external SMTP recipient was used.

The full 47-group gate was executed. Final affected groups were explicitly rerun after receipt, localization, mobile layout, approval response durability and email-revision refinements. The aggregate identifies targeted reruns. Earlier failing/obsolete test expectations were corrected to require approval before verification; server safeguards were not relaxed. These are named checks, not 734 distinct production user journeys.

| Test group | Actual result | Named checks |
|---|---|---:|
| All active server and public JavaScript syntax | PASS | 0 |
| Protected source and Excavator financial-handler integrity | PASS | 5 |
| Protected .32 posted-history upgrade and restart | PASS | 4 |
| Payment approval task, native bank debit/credit and posting lifecycle | PASS | 17 |
| Authenticated approval task, verification and native account browser acceptance | PASS | 6 |
| October17 financial identity, native currencies, approval, operation rollback and downloads | PASS | 16 |
| Legacy supplier advance edit, evidence retries, rollback and audited void | PASS | 5 |
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
| Financial integrity E2E | PASS | 19 |
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

## Focused positive-path evidence

`36933-payment-approvals.json` exercises actual USD bank debit, a subsequent USD customer credit, native movement with a missing historical KRW valuation, exact selected bank ledger/entity, payable/FX-loss/bank posting, advance allocation without new cash, required individual/bulk verification guards, one staged task Finance → CEO, one resulting money movement, independent Finance review, unchanged authoritative amounts after resubmission, separate-debit fee approval from either linked record, targeted notification read state, and important email classification/deduplication/deep links.

The actual browser clicks the assigned review task, reviews the payment and receipt link, approves it, then performs a separate Finance verification. The bank detail restores through direct refresh and renders native values separately from KRW. No JavaScript errors were observed in this suite.

`36933-upgrade.json` records an actual protected .32 posted USD transaction, starts this source against that isolated database, compares all original Finance/settlement fields, posted lines and CoA IDs/codes unchanged, checks native reporting and repeats startup safely. The older posted-valuation repair/reversal regression also passes.

Current source-integrity checks retain the native Excavator mutation handlers, monetary Finance SQL/calculation, durable settlement/advance logic, existing migrations, routing, current cost identity and simplified single-rate forms. Reviewed shared changes are approval-link hooks, pre-verification/posting checks, native read projections, task/email handling, and deferral of approval HTTP output until transaction completion.

## Visual review

Actual generated synthetic account screenshots were inspected at 1360px desktop and 390px mobile, with automated 820px tablet coverage. Korean rendering was inspected with Noto CJK installed, matching the existing Docker font packages. Native labels/values stack legibly; the mobile Back bar does not cover the account heading; KRW values are labelled separately; no document-level horizontal overflow occurred. Receipt access is linked through the existing authenticated viewer. Screenshots remain internal review artifacts and are not private images redistributed in this archive.

## Email and operational boundaries

The real promotion/rendering/deduplication code was tested through an isolated delivery spy: retries of one event are deduplicated and a new approval revision can notify again. No real SMTP delivery is claimed. Enabled/configured SMTP, intended recipient delivery, live Render acceptance and bank-evidence review of affected production history remain operational follow-up. Unknown foreign opening balances are not invented; native movements are labelled as movements, not certified bank-available funds.

The .32 before/after performance results remain historical evidence for that build; no new production performance improvement is claimed here. This release adds no PostgreSQL migration or destructive disk/database operation.
