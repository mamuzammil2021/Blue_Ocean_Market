# V30.69.27 — Acceptance results

Final release gate: **PASS — 508 functional/server/browser checks across 28 suites**, plus 190 active JavaScript syntax checks and 105 canonical frontend integrity entries. Node v22.16.0. All financial records and browser sessions are synthetic and isolated.

Authoritative report: `qa/evidence/36927-release.json`. Reproduce using LOCAL_TESTING.md. New targeted acceptance includes 7 server checks, 12 authenticated browser checks and 5 real V30.69.26 database-upgrade/restart checks. A separate browser run against protected V30.69.26 reproduces the saved active USD account disappearing under default KRW currency and a historical Bank Transfer label; see 36927-supplier-before.json.

Verified: all eligible active saved supplier banks load independently of company-source loading; legacy method/currency formats work; selecting a different supported receiver currency updates an editable advance/payment currency and clears applicable rates; fixed-invoice incompatible routes are visible but disabled; repeated Bank/Cash switching clears selections and validation; Cash hides/disables recipient accounts and records successfully without one; missing company source still fails; Add/Archive updates are authoritative; EN/KR guidance is consistent; exact receiver/source IDs and one Finance movement are stored.

The entire inherited gate was rerun: Excavator financial workflows (named Excavator in the reports), supplier/customer/Import Cost and FX settlement, corrections/reversals, permissions/approvals, previous-version migrations, Finance/Accounting, statement/PDF integrity, routing/deep links, session/logout and October 14 browser acceptance. The Excavator native handlers and application/authentication runtime files are byte-identical to V30.69.26. Current source changes are limited to Pink Salt form/engine, manifest and release metadata/tests/docs.

Application source SHA256: `2b414ee58f939b8056d5e6e2303a5ddcb487662bf87fe7df7cbdde59ea77dda1`.

No production deployment, actual bank transfer or external email delivery is claimed. Unsupported recipient/intermediary conversions remain blocked. The separately noted ancestor-page flash on deep refresh is outside this correction; existing routing regression remains passed.

| Suite | Result | Checks |
| --- | --- | --- |
| All active server and public JavaScript syntax | PASS | syntax |
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
| Simplified Pink Salt payment and blur FX browser matrix | PASS | 32 |
| Scoped logout, repeated login, delayed responses and two-tab deep links | PASS | 7 |
| Actual bilingual statement PDFs and cache invalidation | PASS | 4 |
| October14 authenticated 12-point browser acceptance | PASS | 36 |
