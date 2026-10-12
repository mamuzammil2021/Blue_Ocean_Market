# Blue Ocean Market V30.69.0 — Pink Salt QA / Shared Excavator Workflows

Built directly from protected V30.68.1 PASSWORD_RESET_HOTFIX baseline.

## Reused / generalized from Excavator
- Shared counterparty receiver/payee account master: add, edit, default, archive, history.
- Paid From company financial account + Paid To counterparty account transaction pattern.
- Payment-method/currency account compatibility and historical Finance receiver snapshots.
- Combined settlement mechanics: existing credit/advance + new money in one controlled flow.
- Finance verification / Accounting posting lock pattern for cost mutations.
- Profile section persistence, sticky action-column convention, targeted refresh/modal close behavior.

## Pink Salt-specific behavior retained
- Supplier advances and advance allocation pool.
- Import supplier payable/outstanding calculations.
- Import salt-category/item composition and landed-cost handling.
- Import lifecycle (ordered/in-transit/received/cancelled/voided).

## Main QA changes
1. New supplier saves back to Suppliers list; edits return to the supplier profile.
2. Supplier profile preserves the selected section after actions.
3. Supplier list now exposes Open / Edit / Archive with a sticky action cell.
4. New Import / Dashboard explanatory clutter is reduced.
5. New/Edit Import supplier selection receives search assistance; no second supplier selector is introduced.
6. Import costs can be edited/voided before Finance verification; verified/posted costs are locked.
7. Edit Import continues to use the full saved salt-category payload and closes after successful save.
8. Supplier payment accounts are available as a dedicated Accounts section and via the shared account manager.
9. Supplier advance payments require/show Paid From and Paid To for electronic payments.
10. Import settlement supports Supplier Advance only, New Payment only, or both together; partial settlement is allowed but overpayment is blocked.
11. Supplier advance allocation remains non-cash; only fresh payment creates a Finance cash-out record.
12. Paid To account is saved to the source payment and snapshotted into Finance.
13. Fully settled + received imports hide mutation actions while retaining historical/read-only access.
14. Shared modal/targeted refresh patterns are reused rather than adding a separate Pink Salt framework.

## Data safety
- Additive schema changes only (`receiver_account_id` and import-cost audit/void fields where missing).
- No database reset or destructive migration.
- Existing persistent Render disk/database remains compatible.

## QA
- `node qa/qa_v369_pink_shared_workflows.js` — PASS (18/18 source/integration gates).
- JavaScript syntax checks pass for all modified/new V30.69 files.
- Full runtime boot was not executed in the build container because the uploaded source does not bundle `node_modules`; Render/Git deployment will install dependencies from `package-lock.json` as usual.
