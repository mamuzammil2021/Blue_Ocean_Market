# Blue Ocean Market V30.69.4 — Pink Salt QA 07 Oct Completion

Built on V30.69.3. This release completes the nine QA points from the 07 Oct QA document and hardens repeatedly reported regressions.

## Completed
1. Pink Salt Cash payments now query/select only compatible company Cash accounts; stale Bank selections are cleared before reload. Country filtering is not blindly applied to Cash-on-Hand accounts.
2. Cash payment validation is prevented at UI level while existing server validation remains as defense-in-depth.
3. Pink Salt supplier receiver/payee account Save/Archive/Close triggers targeted refresh of the supplier Accounts section.
4. Pink Salt supplier/import deep links get a retrying hard-refresh restore path on top of the V30.69.3 routing foundation.
5. Edit Import salt-category remove controls are constrained to their own category rows and stray remove controls outside the category list are removed.
6. Import settlement mode selection (Advance only / New payment only / Both) is deterministic, disables hidden fields, recalculates, and refreshes accounts only when fresh money is involved.
7. Removed the redundant Import Detail close/X action; Back remains the page navigation control.
8. Received imports expose View Shipment PDF and Download Shipment PDF actions using the existing received-PDF engine.
9. Received imports now report Payment Status = Fully Paid and ready_to_receive=false, avoiding “Fully Paid / Ready to Receive” after receipt. A client fallback also corrects legacy-rendered rows.

## Reuse / shared-platform alignment
Reuses the Excavator-style payment-method/account compatibility, targeted profile refresh, payment-source choice, and persistent record-route patterns rather than creating isolated Pink Salt alternatives.

## Data safety
No destructive database migration. No persistent-disk reset. Existing Finance/Accounting validation, audit, evidence, and historical records are preserved.
