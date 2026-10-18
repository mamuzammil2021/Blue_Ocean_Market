# V30.69.29 actual verification results

**PASS: 592 functional checks across 34 suites**, plus syntax validation of active server/public JavaScript and the 105-entry frontend manifest. All financial records, accounts, attachments and login sessions were synthetic and isolated. The current aggregate is `qa/evidence/36929-release.json`.

## October 15 acceptance matrix

| Requirement | Actual verification | Result |
|---|---|---|
| Exact protected baseline | Materialized exact V30.69.28 ZIP; version and SHA256 matched the protected delivered release | PASS |
| Full QA document and screenshots | Read both pages and extracted/visually inspected all four embedded PNGs | PASS |
| Finance cost locks | Shared lookup follows FX Finance linkage and legacy sources; existing empty projection-link records tested | PASS |
| Editing before verification | Legacy ordinary edit and FX immutable amendment tested through actual endpoints/browser | PASS |
| Verified edit and ordinary void blocked | Direct API attempts rejected; original transaction and Finance fields compared unchanged | PASS |
| Lock visibility | Newly verified cost shows translated lock in import list and cost detail | PASS |
| Cost-specific detail page | Category, amount, date/method, notes, import, source/payee, reference, evidence, Finance/Accounting and audit information checked | PASS |
| State-aware correction actions | No unsolicited correction; actual assigned request enables it; resubmission remains pending Finance acceptance | PASS |
| Original-user authorization | A different CEO cannot correct/resubmit; actual original-user correction succeeds | PASS |
| Posted costs | Original authorized CEO uses explicit posted correction; original journal retained and controlled reversal proposed; replacement posting held | PASS |
| Top form alerts | Alert precedes form; invalid cash/currency alert persists and clears correctly through repeated method switching | PASS |
| First invalid field | Inline markers, focus and scroll checked; a closed fee section opens; values survive validation | PASS |
| Simpler supplier form | Quote reference/source/time controls absent; redundant checkbox absent; one source selector and one Review & Confirm remain | PASS |
| Backend quote requirements removed | Actual KRW-to-USD invoice payment records without those fields; historical metadata remains stored | PASS |
| Same and cross currency | KRW Cash, KRW-to-USD bank, USD-to-USD with explicit KRW rate, fees and source-debit reconciliation | PASS |
| Settlement choices | Zero advance, Advance Only, New Payment, Both; noncash settlement creates zero new Finance movements | PASS |
| Financial integrity | Exact account/debit, one active movement, idempotency, rollback, balanced proposals and controlled correction/reversal history | PASS |
| Evidence/reference controls | Missing bank reference/evidence rejected; Cash reference and supplier bank remain optional | PASS |
| Processing and footer | Actual recording request held; one root overlay, disabled controls, blocked Cancel and visible sticky footer inspected | PASS |
| Navigation | Cost refresh and Back/Forward, preserved import origin; 48 strict direct-render refresh cases and 136 routing checks rerun | PASS |
| EN/KR | Changed labels/alerts/cost details and field validation; actual statement PDF bilingual regression | PASS |
| Existing-record compatibility | Real V30.69.28 disposable database upgraded/restarted with historical fields and COA codes compared | PASS |
| Excavator protection | All six native money-mutation definitions and native UI unchanged; actual financial/browser regression rerun | PASS |

The focused suites each passed 20 checks: `36929-qa15-server.json` and `36929-qa15-browser.json`. `36929-upgrade.json` records actual V30.69.28 upgrade/restart checks. `36929-source-integrity.json` records unchanged protected routing/Excavator files and the scoped changed files.

## Financial and regression checks

The current aggregate includes runtime startup, account/fee/notification/reversal matrices, statement reconciliation, inventory/order atomicity, approvals/permissions, financial posting gates, bank account/currency selection, typed recipients, refunds, corrections, historical migrations, sales/receiving, payroll/access record routing, EN/KR, stale-asset refresh and scoped two-tab logout/login.

Older supplier tests were adapted for the intentionally removed quote controls/checkbox. The old strict-API test now checks that a caller-provided preview flag cannot bypass exact debit reconciliation. The obsolete mandatory-quote UI suite is superseded by the focused current supplier browser suite. Other workflows retain their quote controls. The aggregate records the full run and final targeted reruns of affected suites after expectation updates and amendment-notification refinement; no skipped suite is marked as passed.

## Operational boundaries

No production database, Render disk, real bank movement, external email delivery, Git push or deployment was performed. Production staging and live-role smoke checks remain operational acceptance tasks. See KNOWN_LIMITATIONS.md and RENDER_DEPLOYMENT_ROLLBACK.md.
