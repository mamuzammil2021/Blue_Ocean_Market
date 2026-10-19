# V30.69.27 — Supplier saved accounts and Cash

Built on protected V30.69.26. Reproduced a saved active USD supplier bank disappearing under a default KRW supplier-advance currency and a historical Bank Transfer method label. The prior form also populated recipients only after company-account loading succeeded.

- Populate saved supplier accounts independently of company-account loading. Company-source failures still block recording; they no longer erase the supplier list.
- Normalize saved currency whitespace/case and historical method labels consistently with the shared server payee resolver. Keep account IDs and historical records unchanged.
- Show active method-compatible saved accounts with currency and bank details. For advances/other editable-payment-currency flows, choosing another supported recipient currency sets the payment currency, retains an eligible company source and clears the applicable FX/accounting rates for explicit entry.
- For fixed-currency invoices, show incompatible recipient currencies as disabled choices with a localized explanation. Do not permit unsupported intermediary conversions.
- Fetch fresh context/account lists for each payment opening or shared account refresh. New accounts appear and archived accounts disappear immediately.
- Cash hides, clears and disables the supplier account selector and its required-field marker. Cash recording does not resolve or store a supplier bank account, even if a stale receiver ID is submitted. The exact authorized company Cash source and evidence remain mandatory; cash reference remains optional.
- Preserve shared Review & Confirm, targeted supplier refresh, Finance snapshots, approvals, audit, fees, FX evidence, idempotency and correction/reversal controls. New Finance receiver-currency snapshots are normalized without rewriting old snapshots.
- Register supplier_account_currency_choices on the existing Pink Salt settlement capability. Excavator native/shared runtime handlers remain byte-identical to V30.69.26.

No schema migration is introduced. Existing additive startup migrations and registry registration remain idempotent. The separate previously noted ancestor-page flash during deep refresh is outside this supplier-account correction.
