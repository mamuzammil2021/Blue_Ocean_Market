# V30.70.2 — Customer / Sales / Settlement release

Implements the approved Pink Salt customer/sales redesign, payment-at-sale choices, grouped receipts, provider payouts and integration foundation. Existing commerce and financial engines are reused. See RELEASE_NOTES.md and QA_CUSTOMER_SALES_702.md.

Final results are recorded in qa/evidence/v30_70_2-release.json. Validation uses Node 22, disposable PGlite PostgreSQL-engine data and real Chromium. No hosted acceptance, production concurrency certification or external platform connection is claimed.

Git and Render were not changed for this build.
