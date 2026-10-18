# V30.69.16 — Pink Salt payment safety follow-up / staging candidate

## Baseline
V30.69.15 payment integrity checkpoint. No Excavator files edited. Production database and Render persistent disk not accessed.

## New code correction
- `server/v305.js`: Supplier advance refund must select a validated active company receiving Cash/Bank account even for Cash refunds; a missing result is rejected **before** the refund record and Finance entry are created. Currency equality and receipt direction remain enforced.
- `qa/qa_v36916_refund_account_required.js`: Regression asserts receiving-account requirement, currency validation, pre-mutation check, preserved Finance sync, and unchanged outgoing supplier advances.

## Tests completed
- Node syntax check of `server/v305.js` — PASS.
- `qa_v36916_refund_account_required.js` — PASS.
- `qa_v36915_refund_direction.js` — PASS.
- `qa_v36913_payment_alignment.js` — 17 assertions PASS.
- `qa_v36914_customer_payment_alignment.js` — 14 assertions PASS.
- Four isolated Chromium test suites — PASS:
  - `browser_v36914_customer_accounts.py`
  - `browser_v36914_import_native.py`
  - `browser_v36911_native_supplier_payment.py`
  - `browser_v36913_payment_rules.py`

## NOT completed / blockers
- No authenticated application E2E test against running server/database or Render staging: required server dependencies and authenticated staging test accounts are unavailable in this environment.
- No actual Finance Verify / GL Posting / reversal execution on a disposable test database.
- Customer refunds, packaging suppliers, legacy expense flows, deep-link refresh and Excavator authenticated regression are **not certified**. Existing controls have not been comprehensively audited or migrated in this build.

## Required acceptance before production
Use separate Render staging with an isolated database copy and test users/permissions. Test Cash/Bank KRW/PKR supplier payments, advance-only/both/new import settlements, supplier refund, customer receipts/refunds, packaging payments, paid orders, duplicate submissions, void/corrections, FX mismatches, Finance verification, Accounting postings, and browser refresh/Back/Forward. Validate one actual Finance record per actual money movement; advance allocations never create another movement. Validate Excavator purchases/buyer/supplier payment/regression unchanged. No production-disk reset.

## Release decision
Staging-only. No assertion of all-work-complete or end-to-end success is warranted until the above tests pass.
