# V30.57.5 substantial continuation — SAVED CHECKPOINT, NOT THE FINAL RELEASE
Date: 26 September 2026. Derived directly from the user's V30.57.4 continuation ZIP (the project folder retains earlier internal release identity). This package contains the entire Git-ready project, not a patch-only download.

## Completed in this session
1. Added read-only Accounting Control → Accounting Integrity Review, with counts and contextual exception list for registered fixed assets, accruals and prepayments. Every record is filtered by BU permissions. Source-journal amount, posting/reversal status, depreciation/amortization limits and pending proposals are checked. It does not insert Finance records, journals or balancing adjustments and does not misrepresent shared GL account totals as the totals of this partial register.
2. Added the source-journal selection endpoint for new operating fixed assets. It returns eligible **posted, unreversed, unused, same-business-unit, non-Finance** acquisition debits for the selected asset account, capped at 50. UI now offers a journal selector instead of asking staff to type an internal journal ID. Existing exact backend amount/date/BU safeguards still apply.
3. Corrected prepaid-subledger display: proposed recognition is `pending_recognition_krw`; only a posted, unreversed recognition journal gives rise to `recognized_prepaid_krw` and `remaining_prepaid_krw`. An unposted proposal no longer appears as available recognized prepaid assets.
4. Reduced clutter in the new Fixed Assets and Accruals/Prepayments workspaces with collapsible create forms. Exposed the existing authorized, zero-residual/fully depreciated asset-disposal proposal from the detail UI. It remains cash-neutral and subject to Posting Control; it is not a general sale/disposal workflow.
5. Added focused in-memory SQLite tests covering eligible source selection, prevention of reused acquisition journals, proposed-vs-posted prepaid balances, posted and pending reversals, mismatched acquisition source, BU privacy and no invented Finance transactions. Added a consolidated V30.57.5 gate that also runs the historical ₩9,500 sale/₩500 genuine receipt regression fixture, syntax checks and compressed asset equivalence.
6. Preserved the V30.57.4 functionality, approved financial posting engine, original workbook, COA account IDs and Render/persistent-disk configuration. No new live cash workflow; no existing database reset or migration that overwrites existing business data.

## Tested
- `node qa/qa_v3575_consolidated_gate.js`: PASS, 7 focused suites + historical Finance mirror fixture, 5 syntax checks, 4 compressed assets and 6 current-source invariants.
- `node qa/qa_v357_current_gate.js`: PASS 10/10.
- `node qa/qa_v3575_integrity_review.js`: PASS all focused SQLite assertions.
- `python3 qa/sql_v354_integrity.py`: PASS historic purchase and sale mirror quarantine; actual ₩500 receipt remains.
- `npm run qa:release`: FAIL at first inherited V30.51 release-identity assertion. Individual inherited historical tests also contain hard-coded version numbers and previous HTML byte assertions. They are retained unchanged, not represented as passing.
- `npm run qa:runtime`: FAIL before server startup because Express/node_modules is unavailable in the execution environment. An offline `npm ci` failed due uncached `wrappy` package; online attempt failed with npm CLI exit-handler error. No authenticated browser QA performed.
- Render/live database compatibility: NOT tested. Do not deploy to the existing production DB on this evidence alone.

## Still required for final V30.57
- Approve policy-dependent 138 draft COA and 61 posting-rule mapping, resolving 30 collisions without renumbering occupied live accounts; implement and verify remaining mappings.
- Full fixed-asset lifecycle beyond source-backed acquisition, straight-line depreciation and **zero-residual fully depreciated cash-neutral disposal**: improvements, location/BU transfers, partial disposal, asset sales and impairment (must reconcile source GL and approved policy).
- Actual verified Finance settlement linkage for accrued/payable obligations and prepayments; payroll/tax policies and workflows with evidence and posting checks.
- Machine-by-machine Excavator landed-cost/COGS and Pink Salt import/raw/packaging/WIP/finished/batch/loss accounting with live operational fixtures.
- Inter-BU counterparty matching and approved consolidation elimination, beyond existing read-only Due From/Due To totals.
- All relevant scoped graph drill-down, full EN/KR browser QA, full inherited Finance/Accounting/Excavator/Pink Salt regressions, and staging copy of real Render persistent DB.

## Deployment and carry-forward
This is **one continuation checkpoint, not a production release or a new independently deployable release recommendation**. It is the exact next source to use; do not go back to V30.56 or V30.57.4 and discard these improvements. Source remains unreleased, not pushed to Git, not deployed to Render. The user-requested final consolidated V30.57 build remains the target.
