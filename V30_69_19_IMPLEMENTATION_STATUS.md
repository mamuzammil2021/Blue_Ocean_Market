# V30.69.19 — Import Payment Currency Guard (INCOMPLETE STAGING CHECKPOINT)

Baseline: V30.69.18. Excavator sources unchanged.

## Implemented
- Legacy Pink Salt import payment endpoint now verifies selected company account currency matches the payment currency before entering the existing database transaction. This blocks a mismatch that could otherwise be misrepresented as a valid source-account debit.
- Existing cross-currency preview stays read-only and real posting remains disabled.
- Preserves the receipt, account selection, existing supplier allocations, and existing Finance sync behavior for compatible payments.

## Verification
- JavaScript syntax check for modified server module passed.
- `qa_v36919_import_currency_guard.js`: 5 checks passed.
- `qa_v36918_fx_reconciliation.js`: 9 checks passed.
- `qa_v36917_cross_currency_contract.js`: 16 checks passed.
- No database-backed or authenticated browser tests executed; full application dependencies and test account configuration not available here.

## NOT COMPLETE
This is not the requested finished multi-currency payment system. Still needed: additive persisted FX transaction schema; atomic and idempotent debit, fees, provider FX legs, supplier settlement, reconciliation, reversals; Finance and Accounting design and implementation; full UI and other Pink Salt payment/refund entry points; isolated database-backed integration and authenticated browser tests; Excavator regression suite.

Do NOT deploy to production or enable cross-currency payment posting. Preserve persistent Render data and protected V30.69.16 baseline. The package contains a safety guard, not the final cross-currency engine.
