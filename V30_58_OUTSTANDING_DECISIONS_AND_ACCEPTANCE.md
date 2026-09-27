# V30.58 outstanding accounting decisions and acceptance

The exact 30 occupied draft codes and existing meanings are listed in `accounting_spec/V30_57_COA_COLLISION_BY_COLLISION.md`; the full 138-row compatibility proposal is `accounting_spec/COA_COMPATIBILITY.csv`. None is approved to replace live codes. The decisions below need an authorized accountant, with owner acceptance where business policy is involved.

| Decision needed | Treatment until approval |
|---|---|
| COA collisions, draft-only codes, account restrictions and live-data-specific mapping | Keep current codes/IDs and historical journals. Do not activate draft replacements. |
| Fixed-asset capitalization thresholds, categories, lives, method, residuals, disposal and impairment | Keep existing protected workflows; new policy-sensitive intents are inactive. |
| Accrual/prepaid eligibility and schedule/account treatment | Keep existing guarded workflows; no inferred allocation. |
| Payroll jurisdiction, statutory withholding, employer contributions and payable accounts | Existing salary liability and verified settlement only; draft rules inactive. |
| Tax types, rates, jurisdiction, effective dates and receivable/payable mappings | No new statutory posting activated. |
| Excavator landed-cost eligibility, Pakistan share timing and FX | Source and posted GL comparison; keep profit categories separate. |
| Pink Salt lot/SKU costing, eligible landed cost, normal/abnormal loss | Source trail and exceptions only; do not fabricate posted valuations. |
| Shared supplier-credit eligibility and reversal priority | Existing pooled credit behavior; reconcile actual records. |
| Inter-BU clearing pairs, elimination and consolidated adjustments | Read-only elimination; do not create consolidation postings. |
| FX rate source/date, revaluation and realized/unrealized treatment | Preserve original currency and FX evidence; no new revaluation posting. |
| Cash-flow classification of mixed-account journals and historical opening cutover date | Flag unclassified; accountant reviews source context and balances before posting. |

## Production acceptance still required

1. Authorized, consistent copy of existing Render SQLite database **and representative uploads**; test on an isolated environment and compare account IDs/codes, balances, posted/reversed journals, source links, migration keys and evidence hashes before/after. Preserve the original copy and production disk. Run `qa/staging_v358_existing_data.js` on the authorized backup and inspect its JSON report, including derived supplier category metadata and any retained-row differences.
2. Test actual bank statements and historical opening source records in staging, including duplicate attempts, BU/role denials, linked entities, FX and rollback/correction. The source migration proposal should remain Pending Review until balances and policies are signed off.
3. Authenticated desktop/mobile EN/KR browser review for CEO/Owner, BU Manager, Finance and Accountant; verify all six Accounting sections, source drill-downs and restricted actions.
4. Accountant signoff on the table above and live COA mapping, owner business acceptance, verified backup/restore and explicit owner authorization before push, merge or deployment.

Engineering outstanding: invoice-linked aging outside supported Pink Salt customer orders and supplier import/packaging obligations, official SKU/lot profitability, quantitative GL-to-operational comparison for other subledgers, historical cutoffs and correction queues, year-end adjustment workflow, and linked historical subledger import coverage. The 499-row matrix records these as partial or deferred; no policy-sensitive posting was enabled.
