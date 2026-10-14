# V30.69.15 — Pink Salt payment integrity checkpoint (NOT final production acceptance)

Baseline: V30.69.14. One narrowly scoped new server fix: supplier advance refunds receive money **into** the company's selected compatible financial account, so `configuredPaymentAccount` is called with `direction:'receipt'`. The refund account error now says Receive Into. Supplier outgoing payments and all Excavator code remain unchanged.

## Checks run locally
- `node --check server/v305.js` — passed.
- `node qa/qa_v36915_refund_direction.js` — passed.
- `node qa/qa_v36913_payment_alignment.js` — 17/17 passed.
- `node qa/qa_v36914_customer_payment_alignment.js` — 14/14 passed.
- Isolated Chromium tests: `browser_v36914_customer_accounts.py`, `browser_v36914_import_native.py`, `browser_v36911_native_supplier_payment.py`, `browser_v36913_payment_rules.py` — passed.

## NOT verified / remaining acceptance work
- A full application E2E payment test was NOT run: the base source archive did not have complete dependencies; `npm ci --offline` failed due to a missing cached package, and online installation timed out. It would be inaccurate to assert end-to-end passes.
- No authenticated Render staging session, populated test database, protected financial account fixtures, or staging credentials supplied. Therefore actual POST transactions, Finance verification, GL posting, refunds, permissions, approvals, idempotency and rollback remain unverified.
- Remaining Pink Salt workflows and legacy wrappers still require integration-level acceptance, including supplier refunds, customer refunds, packaging supplier, existing/import advances, expense forms and older order routes. Browser harness tests only isolated DOM and simulated API responses.
- Need real browser testing of Excavator buyer/supplier/payments to certify no regressions despite no Excavator source changes.

## Staging test required before production
Use a disposable staging database copy with no real money movements and explicit test accounts in KRW and PKR, Cash and Bank, BU-specific and company-wide. For each transaction type: record, view Finance movement, verify exactly one receipt/payment and direction, Finance Verify, inspect posting proposal (do not post to official production), verify account IDs and balances, check correction/reversal and duplicates. Include browser hard-refresh of deep details and roles. Never reset or overwrite Render production disk/DB. Archive is staging only.
