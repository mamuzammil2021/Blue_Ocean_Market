# V30.69.24 — simpler Pink Salt payments

Built on the protected V30.69.23 refresh hotfix. The shared Pink Salt payment component now follows the Excavator payment pattern with conditional settlement choices and a compact form. Existing Excavator payment handlers and the durable settlement, Finance, approval, journal, correction and reversal engines are preserved.

## User behavior

- Invoice summary uses the invoice currency for original, previously settled and outstanding values. Available advance remains explicitly KRW where the existing ledger uses KRW.
- Advance Only, New Payment Only and Advance + New Payment show only relevant fields. Zero advance produces one contextual message. Advance Only retains the allocation date and generates no new Finance movement.
- Ordinary same-currency payments show one main payment amount, method, one authoritative company account, recipient account where needed, date/reference and evidence. Fees, notes and accounting detail are expandable.
- Supplier profiles distinguish Pay Outstanding (choose an existing invoice) from Record Supplier Advance (create available advance credit). They no longer label an advance-only entry point as a combined payment/advance action.
- Each new payment starts with empty applicable conversion/accounting rates. No default foreign rate or previous payment rate is reused. KRW-to-KRW and other identity conversions are hidden and remain internally 1. A KRW bank paying USD still needs its explicit USD/KRW bank rate.
- Bank conversion and KRW accounting rates have separate, direction-labelled fields. New supplier advances/costs require their own applicable payment recognition rate; historical invoice carrying rates remain protected. When a new obligation and account share the same foreign currency, one explicitly entered payment accounting rate supplies both meanings for that new payment, without overwriting a historical payable.
- Related fields recalculate on leaving an amount, FX, fee or advance field. The last amount edited remains the calculation basis. Advance changes also show the new payment needed to clear the invoice without forcing a full payment.
- Account, method and currency changes clear incompatible rate, quote, fee and confirmation values. Invalid input clears stale derived amounts and reuses one validation surface.
- Estimates are labelled and cannot settle an invoice. Users explicitly confirm that displayed amounts match bank/receipt evidence. Subsequent changes invalidate that confirmation. The server independently validates quote metadata, rates, actual debit, fees, accounts and allocation before recording.
- Correcting a payment retains its original accounts, rates and evidence for review, and requires renewed confirmation of the changed amounts. It does not behave like a fresh payment inheriting an old rate.
- Review & Confirm and the existing protected processing surface remain. Estimated calculations never auto-create Finance or Accounting records.

## Engineering

The existing BOMPinkFX shared component is reused and exposes discoverable capabilities for conditional forms, blur recalculation, explicit confirmation and empty conversion rates. No overlapping payment wrapper or Excavator replacement is introduced.

The shared calculation function has an explicit third-argument previewOnly mode for local arithmetic with unknown accounting values represented as null. It does not invent rates, quotes or recipient confirmation. All server financial routes retain the strict two-argument contract; a caller-provided previewOnly field cannot bypass it. The browser calculation asset is regenerated from this shared source.

All V30.69.23 protections remain: verified gzip delivery, frontend SHA-256 startup validation before database initialization, stable routing and versioned eager/lazy asset URLs. V30.69.24 adds no schema migration.

## Verification and limitations

See qa/evidence/36924-release.json for the final current-source automated gate, 36924-payment-ui.json for authenticated browser scenarios and reconciliation, 36924-calculation.json for strict API/preview isolation, and 36924-source-preservation.json for baseline comparison. Tests use real Node.js servers, authenticated Chromium and disposable databases.

This remains STAGING_CANDIDATE for broader acceptance. No production deployment or production-data test was performed. Exhaustive role/BU and historic entry-point permutations, complete Excavator browser mutations, EN/KR PDF rendering, Render backup/restore rehearsal and business accounting-policy approval remain as documented in the carried QA notes. Supported conversion routes and controlled pending posting proposals are unchanged. This release does not add multi-leg conversion or automatically approve accounting policy.

## Render and rollback

Use Node.js 22, npm ci and the existing npm start. Preserve database/uploads paths, environment secrets and persistent disk. Do not reset, delete, initialize or replace production data. First test on an isolated staging disk and take consistent backups before production deployment.

Copy the complete source and matching server/frontend-manifest.json. After intentional future frontend edits run npm run build:frontend-manifest and commit the reviewed manifest. Do not regenerate it simply to hide an unexplained incomplete copy. Stale .gz files can remain; the server ignores compressed representations that do not match current source.

Rollback to the recorded V30.69.23 commit with the same data and configuration. No database rollback is needed for this UI release; do not roll back to a build predating the FX engine after storing FX settlements without a reviewed compatibility plan.
