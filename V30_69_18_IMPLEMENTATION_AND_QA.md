# V30.69.18 — Cross-Currency Reconciliation Hardening (INCOMPLETE CHECKPOINT)

Baseline: V30.69.17 preview checkpoint. Changes are restricted to `server/pink-cross-currency-contract.js` and a new regression test. No Excavator sources, database schema, payment posting, or Finance/Accounting handlers were modified.

## Verified change
- Preview now rejects a bank FX rate inconsistent with the actual source-account debit net of source-currency fee. Convention for supported one-leg conversions: 1 transfer currency unit costs `bank_fx_rate` source account currency units.
- Rejects mismatched transfer and recipient currency (requires explicit intermediary FX leg) and mismatched recipient/invoice currency (requires explicit invoice-settlement FX leg).
- Rejects unsupported currency codes, fees exceeding debits, and confirmed credits above expected without reconciliation.
- Same-currency and legacy payment pathways untouched; all cross-currency posting remains disabled.

## Tests in local environment
- `node qa/qa_v36918_fx_reconciliation.js`: 9 passed
- `node qa/qa_v36917_cross_currency_contract.js`: 16 passed
- `node qa/qa_v36913_payment_alignment.js`: 17 passed
- `node qa/qa_v36914_customer_payment_alignment.js`: 14 passed
- Syntax: `node --check server/pink-cross-currency-contract.js`: pass
- No authenticated end-to-end financial posting test. No full running server: dependencies not installed. No production deployment.

## Explicitly NOT complete
- Durable multi-leg cross-currency payment and FX evidence schema, migrations, idempotent atomic transaction endpoints.
- Debit/fee tracking and KRW conversion accounting recognition; variance, corrections and reversals.
- Full supplier/import/customer/refund UI migration, permissions and end-to-end browser test.
- Real finance and accounting posting acceptance and authenticated Excavator regression.

Do NOT enable cross-currency posting or merge to production based on this checkpoint.
