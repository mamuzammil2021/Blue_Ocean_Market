# V30.57.6 consolidated Accounting source handoff

Date: 26 September 2026. Exact base: supplied V30.57.5 protected checkpoint. This is the complete Git-ready source tree for the work that can be safely implemented from the current draft. **It is a staging candidate, not an approved production release.** No Git push, merge, Render deployment or live database mutation was performed.

## Delivered

- Fixed asset register links an existing posted acquisition, capitalized improvements and revised remaining-life depreciation. Physical location history is audited and cash neutral. Fully depreciated zero-residual disposal derecognizes posted cost after Posting Control. Proposed and posted amounts remain separate; reversal holds dependent actions. Ownership transfer, partial sale/disposal and impairment are gated until policy approval.
- Accrual proposals are noncash and require an invoice reference, documented policy and accounting adjustment authority. A posted accrued liability can be allocated to an **existing** verified, evidenced, posted Finance payment with a same-unit liability debit. Allocation is capped by the outstanding obligation and available liability debit across obligations. The link creates no Finance entry or journal. Prepaid reclassification and amortization similarly require an existing posted source and Posting Control.
- Machine, Pink Salt import, raw import-item lot and production-batch source records have a read-only, unit-scoped inventory and cost review against posted/reversed GL. Import review reconciles operational purchase, active supplier-advance allocations, payments and landed costs, with over-allocation flags. Raw lot review compares receipt weight, signed movement stock, completed-batch use and posted item-scoped issue, flagging negative stock and cost differences. Import-level receipt GL is not allocated to individual items. Korea machine trading profit is shown separately; Pakistan resale profit remains a separate policy-gated item. Packaging, WIP and finished lot valuation still require policy and source work.
- Company-wide inter-BU Due From/Due To reconciliation and a CEO-only elimination **preview** match actual posted transfer pairs; pending/reversed/mismatched amounts are exceptions. No cash or consolidation journal is fabricated. Payroll cross-unit allocation is not eligible for the preview.
- Accounting navigation includes dedicated fixed asset, accrual/prepaid, integrity, inter-BU and inventory/cost work areas, manual-journal exact-account selection and EN/KR labels. Updated static assets have matching compressed copies.
- `accounting_spec/V30_57_6_WORKBOOK_TO_CODE_MATRIX.json` covers 499 workbook rows. The 138 proposed COA rows and 61 draft rules remain reference material; 30 occupied live code meanings are preserved. The matrix records partial source evidence and retains accountant signoff and V30.58 deferrals.

## QA evidence

| Command | Result |
| --- | --- |
| `npm run qa:release` | PASS, including inherited regression assertions and current source gate. Output: `qa/V30_57_6_RELEASE_QA_RESULTS.txt`. |
| `node qa/qa_v3576_full_audit.js` | 17/17 independent scripts PASS, 0 failed. JSON and text results in `qa/V30_57_6_FULL_AUDIT_RESULTS.*`. |
| `node qa/qa_v3575_consolidated_gate.js` | 11 focused SQLite/source suites, historic Finance duplicate-record mirror, 8 syntax checks, 6 compressed assets, 7 invariants PASS. |
| `node qa/qa_v3577_inventory_review.js` | PASS: machine profit, import receipt, batch conversion/loss, pending exclusion, BU scope, overlapping import/item IDs and no financial insert. |
| `node qa/qa_v3577_accrual_settlement.js` | PASS: Finance verification/evidence/BU/posting, allocation capacity and reversal guards, no new Finance/journal. |
| Node 22.23.3 dependency install | PASS with manually unpacked Node headers to bypass workspace `fchown EINVAL`. Production `better-sqlite3` loads and runs. The workaround is local to QA and is not shipped. |
| `npm run qa:runtime` on Node 22 | PASS on a fresh isolated SQLite database: health, CEO login, V30.57 read APIs, financial account, manual proposal, posting, official trial balance, correction/cancellation and period controls. Output: `qa/V30_57_6_RUNTIME_SMOKE_RESULTS.txt`. |

The source-level `qa:render` script inside the release command checks persistence wiring; it does not connect to Render. Focused SQLite fixtures use built-in `node:sqlite`; the runtime smoke uses production `better-sqlite3`. The early Finance payment-account migration was corrected so its reference index is created on a fresh database.

## Remaining decisions and acceptance gates

1. Accountant approval of COA/rules and each occupied code collision, plus inventory costing, landed-cost allocation, normal versus abnormal loss, Pakistan resale share, tax jurisdiction/rates and payroll liabilities. The draft's `Review` entries are not posting authority. Do not auto-import its account numbers.
2. Policy-approved ownership transfer, partial disposal, sale proceeds and impairment; source-linked payroll and tax settlement; complete Pink Salt packaging/WIP/finished lot and valuation reconciliation; inter-BU payroll pairing and consolidation posting. Existing read-only views make gaps visible without guessing treatment.
3. Run authenticated CEO/BU/Finance/Accountant browser QA (EN/KR, desktop/mobile) against a **copy** of the existing Render database. Verify migrations, roles, posting/reversal and persistent disk/uploads without reset. The isolated fresh-database smoke is not existing-data acceptance. Request merge/deployment review after those results.

V30.58 retains comprehensive reports, bank reconciliation, period close and historical migration. Proposed branch: `feature/v30.57-accounting-completion` from this exact source tree; do not replace production or historical archives until the gates above pass.
