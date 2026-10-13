# V30.69.14 — Pink Salt payment alignment continuation (STAGING ONLY)

Baseline: V30.69.13. This is a **partial integration**, not a completed migration/certified production build. No Excavator source modules modified, no database migrations, no historic payment reprocessing.

## Implemented in this candidate
- Pink Salt *customer receipt* native form now requires an explicit method/currency-matched company receiving account; account loading uses the existing company financial-account API with `direction=receipt`, business-unit scope, async race protection, clear account-loading errors and no arbitrary default.
- Pink Salt *Paid at Order Creation* native form exposes the same company receiving-account field when marked Paid (disabled for Unpaid); server validates selected account and KRW currency **before** inserting the order/stock movements to avoid leaving a paid order if account selection fails.
- Customer receipt backend requires explicit account for Cash and noncash; validates matched method, active/business-unit access, currency and GL mapping using the existing configuredPaymentAccount helper; uses receipt rather than payment direction.
- Pink Salt Import Payments native form uses one authoritative company source selector and conditional supplier receiving selector, avoiding a post-render location-dependent account move; removed a remaining country restriction and arbitrary first-account selection from older fallback code.
- Cash references remain optional; evidence remains required on customer receipts and paid orders. Existing payment-posting APIs retained.
- Client runtime bundle rebuilt for native V313 changes; asset cache key updated.

## Testing performed
- `node --check` on changed JS passed.
- `node qa/qa_v36913_payment_alignment.js`: 17/17 passed.
- `node qa/qa_v36914_customer_payment_alignment.js`: 14/14 passed.
- Isolated Chromium: `qa/browser_v36914_customer_accounts.py`, `qa/browser_v36914_import_native.py`, `qa/browser_v36911_native_supplier_payment.py`, `qa/browser_v36913_payment_rules.py`: passed.
- Older tests for V30.69, V30.69.1, V30.69.4 and `qa_current` still assert obsolete asset/build versions or former markup, so fail static checks even when runtime behavior changes intentionally. They need revision against current routes before they can form an acceptance gate.
- Full runtime smoke could not start in this isolated environment because Node dependencies are not installed. Attempt to install them did not complete. No authenticated Render end-to-end browser posting test was performed.

## Not yet verified or completed (DO NOT CLAIM FULL ALIGNMENT)
- Confirmed posted Finance/Accounting entries for supplier, import, packaging supplier, customer receipt, paid order, refunds and operational expenses against populated staging data.
- Review & Confirm/approval processing, idempotency and full protected overlays across every Pink Salt flow.
- All refunds and older order payment entry points still use legacy/other shared account flows; audit/standardization is pending, especially current v3382 refund wrappers.
- End-to-end account loader response and service authorization for live PKR/KRW and BU-scoped accounts.
- Full real-browser Excavator regression suite and permission-role matrix.

## Safety
Never reset Render persistent disk or database. Staging first, test user roles, Cash/Bank PKR/KRW account selections, Cash source vs Receipt destination, Finance posting direction and one-money-movement/one-Finance-record before production. Back up the existing database and keep V30.69.13 for rollback.
