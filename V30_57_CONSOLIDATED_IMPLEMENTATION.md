# V30.57 consolidated engineering build (30.57.7)

Baseline: the protected V30.57.6 Node 22 verified source ZIP. This is one development build; no repository push, merge, production deploy, Render disk operation, or accountant policy activation was performed.

## Implemented in this build

| Area | Concrete behavior | Activation boundary |
|---|---|---|
| COA | 138-row draft-to-existing proposal, 30 occupied-code decisions retaining their current meanings; CEO runtime read view joins actual account IDs, names, system keys, journal reference counts, and seed differences. | No live account creation, renumbering, journal migration, or draft mapping activation. Actual Render copy review pending. |
| Payroll | Existing verified, evidenced, posted Finance liability payment can be linked atomically to an approved posted payroll run and allocated among employees. Manual Finance category `Payroll Liability Settlement` debits existing salary payable when posted. Duplicate use, overpayment, mismatched BU, reversal hold, and closed payment period blocked. Legacy direct payment route was replaced, and reverse on an active linked payment is held for controlled Finance correction. | Payroll tax/deduction and withholding policy remains inactive. Historical direct payment rows are flagged, not changed. |
| Tax and payroll policy | CEO drafts carry jurisdiction, effective dates, optional rate/account, evidence and audit. | Draft table status is constrained to `Awaiting Accountant Approval`; no activation/post endpoint. |
| Fixed assets | Existing acquisition/depreciation/disposal controls retained. New transfer, partial disposal, sale and impairment intents validate source posted state, outstanding carrying value, period, BU and evidence, and audit the review draft. | Intents do not mutate asset ownership, Finance, GL or cost until policy signoff. |
| Accrued/prepaid | Protected V30.57.6 source-linked existing-Finance settlement and separate pending/posted views retained. | New recognition/account policies remain subject to approval. |
| Inventory | Source-to-posted GL review extends machine/import/raw lot/batch to packaging SKU, WIP batch, finished SKU and gift-box BOM; SKU/WIP posted cost stays unknown where journal dimensions cannot support it. Excavator and Pakistan resale results remain separate. | New costing, landed-cost eligibility and loss absorption are not activated. |
| Supplier and inter-BU | Shared advance source pool versus posted supplier GL review; read-only company external balance view excludes internal Due From/To and flags unmatched internal balances. Existing supplier allocation and inter-BU controls remain. | Cross-category eligibility, clearing pairs and elimination journal policy await approval. |
| UI | Accounting submenus expose read-only COA, supplier, payroll, consolidated and inventory review plus clearly inactive policy/asset drafts. Payroll action selects an existing eligible Finance payment. EN/KR labels were added for new views. | Authenticated multi-role browser acceptance still requires staging. |

The 499-row matrix in `accounting_spec/V30_57_CONSOLIDATED_499_ROW_MATRIX.json` retains the original inventory status and adds separate engineering, policy, code, test, evidence, blocker, owner and next-action fields. An isolated fixture is never labeled live-data acceptance. The 30-row collision table is `accounting_spec/V30_57_COA_COLLISION_BY_COLLISION.md`; the full proposed mapping is JSON in the same directory.

## Migration and deployment status

Additive schema changes create two inactive draft tables and add an optional indexed `finance_entry_id` to `payroll_payments`. Source IDs and posted journals are not migrated. A copy made from the protected source with a synthetic posted journal and upload was started on this build and restarted: account IDs/codes/meanings, users, journal/lines and upload hash were unchanged. This does **not** replace migration testing against an isolated copy of the existing Render SQLite database and representative uploads. The live database/persistent disk were not accessed.

Deployment status: **not accepted for production**. Obtain accountant signoff on the mapping and policy decisions, run actual existing-data and authenticated browser staging, verify backups/rollback, then obtain explicit owner merge/deploy authorization.
