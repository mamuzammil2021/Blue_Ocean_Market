# Actual verification — V30.69.31

Final result: **PASS — 40 suites/check groups, 665 named functional checks**, plus JavaScript syntax checks across active server/public files. Aggregate: qa/evidence/36931-release.json. Runtime: v22.16.0; Node.js application servers, isolated SQLite databases, and authenticated Chromium/Playwright browser sessions. Production data used: false.

The final gate was rerun after the legacy atomic/idempotency controller and read-only feedback fixes. It includes the current reference/cost/browser tests and protected earlier functional suites on this exact source. An older filename is a suite's original version, not evidence that it ran only on old code. Historical before-reports and release aggregates are retained solely for provenance.

## Focused verification

- 24 server checks: friendly normalized reference errors, missing bank reference, empty/space/tab/newline/Unicode optional cash references, account-scoped uniqueness, concurrent same-key and different-key submissions, original/changed-reference correction, own linked representations, original-user/assigned-request authorization, Korean errors, authoritative cost state, legacy details, separate-fee field errors and late failure rollback/retry.
- 16 authenticated browser checks: category add/remove/button position/focus/value preservation; actual Customs save; reference entry/clear/obsolete-response behavior; correction context/prefill/resubmission; visible verified locks; responsive cost amounts/statuses/actions; exact URLs/refresh/Back/Forward; delayed record/BU responses; invalidated cache ownership; an old held snapshot arriving after a newer confirmed Finance correction; Korean/legacy detail behavior. Browser console errors: 0.
- 7 protected .30 reproduction/upgrade checks: original defect reproduced without editing baseline; existing transaction/cost/Finance values and CoA codes preserved; historical recipient snapshots retained; repeated startup/restart safe; new blank cash references accepted without changing historical raw references.
- Actual Excavator supplier/buyer payment, advance, sale, correction, refund, Finance verification and Accounting posting regressions, plus native-handler source integrity.
- Existing single-rate, quote-free payment, advance-only and combined settlement, all eligible accounts, FX/fee calculations, notification, approval, posting-control, statement and routing suites rerun.

## Visual review

Desktop, tablet and mobile category/cost captures were generated and inspected. Cost cards stack appropriately, retain readable amounts/statuses/actions, group transaction currencies and label KRW equivalents separately. Bounded lists and collapsed replaced/voided history keep active totals accessible. Automated browser assertions supplement visual review for correction reasons, focused invalid fields, scroll and absence of horizontal cost overflow. Captures are local inspection artifacts and are not bundled as new user-facing files.

## Executed suite results

| Suite | Result | Named checks | Local elapsed |
|---|---|---:|---:|
| All active server and public JavaScript syntax | PASS | 0 | — |
| Protected source and Excavator financial-handler integrity | PASS | 4 | 0.34 s |
| Pink Salt reference normalization, corrections, concurrency and rollback | PASS | 24 | 2.52 s |
| Pink Salt category, cost state, runtime reference and stale-read browser acceptance | PASS | 16 | 10.38 s |
| Protected V30.69.30 defect reproduction, migration and restart | PASS | 7 | 3.83 s |
| Single-entry shared exchange-rate server integrity | PASS | 11 | 2.28 s |
| Single-entry rate authenticated browser acceptance | PASS | 9 | 5.84 s |
| Protected V30.69.29 upgrade and repeat-start integrity | PASS | 5 | 3.72 s |
| October15 focused cost locks, permissions and financial integrity | PASS | 20 | 2.63 s |
| October15 authenticated cost and simplified supplier browser acceptance | PASS | 20 | 7.88 s |
| Protected V30.69.28 upgrade and repeat-start integrity | PASS | 5 | 4.47 s |
| Protected V30.69.27 upgrade and repeat-start integrity | PASS | 5 | 4.05 s |
| Direct hydration DOM writes and painted destinations | PASS | 48 | 14.71 s |
| Slow hydration, cancellation and authenticated lifecycle | PASS | 15 | 7.61 s |
| Supplier saved account and Cash server integrity | PASS | 7 | 2.22 s |
| Supplier saved account and Cash authenticated browser | PASS | 12 | 5.12 s |
| Protected V30.69.26 upgrade and repeat-start integrity | PASS | 5 | 3.82 s |
| Protected V30.69.25 upgrade and repeat-start integrity | PASS | 5 | 3.58 s |
| Per-payment recipient financial integrity | PASS | 10 | 2.24 s |
| Typed recipient authenticated browser acceptance | PASS | 15 | 6.43 s |
| October14 financial correction, statement and logout server acceptance | PASS | 23 | 2.52 s |
| October14 account, fee, notification and reversal financial matrix | PASS | 12 | 2.31 s |
| Statement balances, date ranges, reversals and evidence integrity | PASS | 8 | 2.07 s |
| Preview-only arithmetic and strict API contract | PASS | 7 | 2.16 s |
| Encoded static asset release integrity | PASS | 12 | 0.14 s |
| Application, Accounting and period-control runtime regression | PASS | 22 | 2.49 s |
| Financial integrity E2E | PASS | 18 | 2.18 s |
| Pink Salt workflow and reconciliation matrix | PASS | 25 | 2.39 s |
| Permission and approval execution matrix | PASS | 7 | 2.75 s |
| Excavator financial regression | PASS | 13 | 2.6 s |
| Previous-version migration and restart | PASS | 5 | 3.23 s |
| October QA server controls, inventory and order atomicity | PASS | 24 | 2.28 s |
| October QA authenticated sales and receiving browser | PASS | 14 | 11.26 s |
| Authenticated Chromium payment, correction and routing matrix | PASS | 16 | 12.59 s |
| Approval detail read integrity and permission boundaries | PASS | 6 | 2.33 s |
| Authenticated system-wide routing and deep-link browser matrix | PASS | 136 | 32.29 s |
| Native navigation and stale-gzip refresh browser regression | PASS | 27 | 11.18 s |
| Scoped logout, repeated login, delayed responses and two-tab deep links | PASS | 7 | 8.18 s |
| Actual bilingual statement PDFs and cache invalidation | PASS | 4 | 2.71 s |
| October14 authenticated 12-point browser acceptance | PASS | 36 | 15.23 s |

Elapsed values describe this local synthetic run, not a promise about live Render latency. No before/after production performance benchmark or real-bank transaction was performed. The stale-response checks deliberately hold and release server responses; success means a superseded response cannot replace the current record/state.

## Limits

Live Render deployment/acceptance, real banks and production records were not accessed. The reported PS-IMP-2026-00001 method/amount/reference are unknown; the isolated reproduction does not identify those missing production inputs. Existing policy-dependent Accounting proposals remain pending under the protected controls. External callers of the legacy cash APIs must provide a stable idempotency key. See KNOWN_LIMITATIONS.md and FINANCIAL_RECONCILIATION.md.
