# V30.69.9 — Pink Salt Payment Stabilization (STAGING CANDIDATE)

Source: V30.69.8 deep record refresh candidate. No SQL migrations, no database or uploaded data bundled.

## Scope
- Final-loaded payment UI adapter consolidates existing legacy payment account selectors into a single company source-account field and a supplier receiver account only for noncash payments.
- Account method/currency options are still sourced through existing QA-filtered selectors, avoiding two conflicting source account values.
- Import settlement modes: when zero supplier advance is available, disabled buttons now explain why; advance mode does not ask for new-money account details.
- Client validates company account for cash and noncash new payments; server import settlement and supplier advance endpoints now reject payment requests with no active validated company account.
- Preserves existing settlement endpoint and Finance/Accounting posting paths.

## Tests run
- `node --check` on modified JS files passed.
- `python qa/browser_v3699_payment_forms.py` passed (real headless Chromium browser, isolated mocked API context): zero-advance messaging/disabled options, account selector uniqueness, cash method switching, supplier receiver hiding, and payment account IDs in form submissions.

## Remaining / explicit limitations
- Not tested against an authenticated full application or actual Render database. Do not deploy to production without staging checks.
- Comprehensive audit/refactoring of all other Pink Salt payment flows (customer receipts/refunds, packaging payments, operational expenses) NOT completed in this candidate.
- Deep route restoration still carries V30.69.8 staging limitations.
- Existing `qa_v3696_system_routing.js` is known to have a stale version assertion and may fail independently; not a passing release certification.
- On staging test supplier bank/card flows with real receiver accounts, cash and FX currencies, repeated mode switching (including positive available advance), both settlement modes, and Finance verification/accounting one-movement-one-entry.
