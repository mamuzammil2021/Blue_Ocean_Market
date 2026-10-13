# V30.69.17 — Cross-Currency Contract Implementation Checkpoint

**Status:** Staging-only development checkpoint, NOT production ready. Based on V30.69.16 protected source. No Excavator files modified.

## Implemented
- Additive pure multi-currency preview contract (`server/pink-cross-currency-contract.js`). Distinct source debit, fee, transfer, recipient estimated/confirmed credit, invoice settlement, invoice accounting KRW and bank FX quotation with rate pair.
- Authenticated, permission- and business-unit-scoped **read-only** preview endpoint `POST /api/pink-salt/imports/:id/cross-currency-preview-v36917`, validating selected company account currency against claimed source currency, invoice currency, and KRW outstanding.
- Fail-closed guard on legacy import settlement endpoint to prevent new cross-currency contract fields accidentally being posted using legacy single-currency ledger handling.
- 16 dedicated pure contract/source checks passed; 17 existing payment contract checks passed; 14 customer payment checks passed. Syntax validation passed.

## Not implemented / not verified
- Cross-currency money posting is **intentionally disabled**. This package does not support saving KRW debits against foreign-currency supplier receipts through a new form.
- Additive durable transaction tables with constraints, idempotency and migration, signed bank quote, source/recipient settlement confirmation, accounting FX and fee journal legs, controlled reversal, refunds, advanced approvals and Finance reconciliation are outstanding.
- New interactive production payment form and account selection UI not integrated; full authenticated browser tests and live end-to-end transaction tests were not performed. No local installed Node dependencies.
- Same-currency historical flows remain unchanged. Do not use this build on production.

## Before enabling cross-currency posting
1. Build a genuine atomic source-debit / bank-FX / recipient-settlement / accounting write path with posting eligibility, reversal controls, and idempotency.
2. Verify controlled financial journal accounting for bank fee, original payable carrying value, settled amount, and realized FX differences.
3. Implement and test a native payment UI with source account selection independent of invoice currency, but method/permission restrictions.
4. Run authenticated end-to-end browser tests using separate staging database and transaction reconciliation for KRW→USD, USD→USD, USD→KRW, partial and mixed advances, fees, retries, refunds, voids and permissions.
5. Regression-test Excavator explicitly before merging.
