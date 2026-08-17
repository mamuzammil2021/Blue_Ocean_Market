# Blue Ocean Market V26.1.0

## Validation and stability review
- Sell Machine no longer disables native browser form validation with `novalidate`.
- Sell Machine now uses browser UI validation (`required`, type/min constraints) before submission.
- Export destination country and Other Country requirements are toggled dynamically in the UI.
- Buyer payment form uses browser UI validation and shows a live KRW accounting preview.
- Buyer payment date defaults to today but remains editable and required.
- KRW payments lock the FX rate to 1; USD/PKR require an entered conversion rate.
- Buyer payment history preserves original currency, amount, FX rate and KRW value.
- Buyer payment receipt documents are removed with the payment record to avoid orphaned document records.
- Buyer detail view now exposes buyer documents/receipts.
- SQLite buyer payment schema no longer depends on NOT NULL form validation for payment date/reference; API validation remains defensive.
- Existing buyer payment data is migrated when an older V26 schema has NOT NULL constraints.
- Root `client.js` is synchronized with the served `public/client.js` to prevent stale frontend code during inspection/testing.
- Frontend cache version bumped to 26.1.0.

## Dependency review
- `package.json` dependencies are unchanged because the declared runtime dependencies are appropriate for the current Express + SQLite + upload stack.
- `node_modules` is intentionally not bundled. The verification environment could not complete `npm install` within the available time, so live runtime dependency execution was not falsely claimed.
