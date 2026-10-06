# Blue Ocean Market V30.69.1 — Pink Salt Import UX Hotfix

Built directly on V30.69.0. This is a focused QA correction release based on deployed Render screenshots.

## Completed

- **Single supplier selector on New/Edit Import**: preserves the existing shared V30.25 searchable `Search Supplier / Seller` control and hides the duplicate search/native select controls. The authorized underlying `supplier_id` select remains in the DOM for form submission and existing supplier/new-supplier behavior.
- **Sticky Import Actions column**: the last Imports/Purchase list column is labelled Actions and remains visible on horizontal scrolling, matching the Excavator table pattern.
- **Excavator-style import payment source choice**: Import Payments now begins with three choices: Supplier Advance Only, New Payment Only, or Advance + New Payment.
  - Advance Only shows only advance/allocation fields and summary. No Paid From/Paid To or fresh-payment evidence fields are shown because no new cash movement occurs.
  - New Payment Only shows only fresh-payment fields including payment date, currency/FX, method, reference, Paid From, Paid To, supplier account management, receipt/evidence, and amount.
  - Both shows both advance allocation and fresh-payment fields with a combined remaining-balance summary.
- Server settlement integrity is preserved: supplier advance allocation stays non-cash; only the fresh-payment portion creates Finance Money Out. Existing overpayment and available-advance validations remain enforced.
- Reuse marker now explicitly documents the **Excavator Buy Machine payment-source choice** as the shared reference pattern.

## QA

- `node --check public/v369-pink-shared-workflows.js` — PASS
- `node --check server/v369-pink-shared-workflows.js` — PASS
- `node qa/qa_v369_pink_shared_workflows.js` — 18/18 PASS
- `node qa/qa_v3691_pink_payment_choice.js` — 14/14 PASS

Older release-specific QA suites for V30.67/V30.64 contain hard-coded cache/version assertions for those historical releases and therefore report their expected version-marker failures when run against V30.69.x; their functional checks remained passing.

## Deployment safety

No database reset, persistent-disk reset, or destructive migration is included. Schema and server settlement routes remain backward compatible with V30.69.0.
