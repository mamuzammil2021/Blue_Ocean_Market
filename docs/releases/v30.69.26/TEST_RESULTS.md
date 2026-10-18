# V30.69.26 — Acceptance results

Final isolated release gate: **PASS — 484 functional/server/browser checks across 25 suites**, plus 190 active JavaScript syntax checks and 105 canonical frontend integrity entries. Node v22.16.0. All database and browser transactions use disposable synthetic records. Production was not accessed or modified.

Authoritative aggregate: `qa/evidence/36926-release.json`. Reproduce with LOCAL_TESTING.md. The new suites cover typed recipients, no saved-list growth, exact Finance snapshots/debits, bank/cash, USD/KRW conversions, fees, blank FX entry and blur recalculation, required-field focus, EN/KR, Review & Confirm, Cancel, controlled correction/reversal, idempotency, invalid-input rollback and actual V30.69.25 database upgrade/restart. Historical registered costs with archived accounts can be corrected through the typed form. Account numbers display masked on read-only settlement detail.

The full inherited financial, permissions/approval, Excavator, migration, sales/receiving, statement/PDF, system-wide deep-routing, logout/session and October 14 QA acceptance suites were rerun against this source. The October 14 browser suite changes only its Import Cost input steps/assertions to the newly requested typed-recipient UX; its remaining acceptance coverage is retained.

During development, the FX browser fixture initially used a mismatched timezone; its quote timestamp now uses the browser's local offset. An extra historical correction case exposed a disappearing informational error banner that shifted Confirm during a click; guidance is now a stable note and stale errors clear while typing. An isolated Chromium startup crash was retried. The final gate passed on the final source; no financial protection was weakened to make these tests pass.

Excavator: existing financial regression passes. `server/server.js`, `public/client.js` and `public/runtime-v30392.js` are byte-identical to V30.69.25. Only the Pink Salt shared form/engine/errors, new recipient validation module and frontend integrity manifest changed in application code. See 36926-source-integrity.json.

Application source SHA256: `d5870bcbc9121beed5aa68373b0a0eec2080add9b24c670b2595c47e20100a6a`.

No claim is made for production deployment, real bank execution or external SMTP. Existing policy-dependent GL posting and received-inventory valuation boundaries remain; see KNOWN_LIMITATIONS.md.

| Suite | Result | Checks |
| --- | --- | --- |
| All active server and public JavaScript syntax | PASS | syntax |
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
