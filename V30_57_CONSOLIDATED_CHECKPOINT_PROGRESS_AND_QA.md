# V30.57 Accounting — consolidated development checkpoint, NOT a final release
Date: 26 September 2026. Internal source version: 30.57.2. Base: exact V30.57.1 professional Accounting UI package, with V30.56 financial engine retained.

## Implemented in this working checkpoint
- Professional Accounting navigation retained and extended with focused Fixed Assets and Accruals & Prepayments submenu screens. Existing Simple/Advanced, manual journals, COA, financing and Posting Control remain the underlying workflows.
- Actual posted General Ledger month-by-month Revenue vs Expenses grouped chart and net posted Cash & Bank movement trend on the Overview. Independent fetch after KPIs, scoped by selected BU, KRW, empty-state and EN/KR labels. No fabricated graph values or unverified Finance movement included.
- Fixed asset register linked to an EXISTING posted, unreversed non-Finance acquisition/opening journal. Explicit account IDs from current live COA. Controlled straight-line monthly depreciation proposals and zero-residual/fully-depreciated cash-neutral derecognition endpoint. These are pending proposals, never automatic official GL postings.
- Accrued expense recognition proposal (Expense / Liability), prepaid expense reclassification from an EXISTING posted expense journal (Prepaid Asset / Expense), and approved amortization proposals (Expense / Prepaid Asset). Duplicate invoice/prepaid source/period safeguards and authorized accounting adjustment gate.
- Additive SQLite tables only; no table reset, no draft COA account-code remapping, no new Finance cash records. New journal proposals use the existing postJournal/Posting Control, source references and audit calls.
- Added accounting_spec/V30_57_VERIFIED_COVERAGE.csv, new mock fixture and actual in-memory SQLite lifecycle test. The original V2 workbook, 138-row COA inventory, 61-rule inventory and 30-collision map remain included.

## This is NOT complete V30.57 and must NOT be deployed as production
Missing or limited: full 138 COA and 61 posting-rule row signoff, safe parent-child hierarchy mapping, complete fixed-asset lifecycle (fresh acquisition, improvements, transfers, impairment, partial/sale disposal), accrued expense settlement and advanced prepaid schedules, payroll and tax completeness, country-specific tax policies, complete Excavator/Pink Salt inventory lot/batch valuation, inter-BU elimination audit, full visual/role-based QA and updated green complete cross-module release suite. V30.58 reports/bank reconciliation/migration remain separate as agreed.

## Source/test distinction
PASS: qa/qa_v3572_real_sqlite.js actual in-memory SQLite fixed assets/accrual/prepaid lifecycle, duplicate constraints, pending posting, closed period; qa/qa_v3572_fixed_asset_fixture.js; qa/qa_v3572_consolidated.js (16 source/build checks); qa/qa_v357_coa_compatibility.js; qa/qa_v3562_financing_integration.js; qa/qa_v3566_financing_audit.js; qa/qa_v3568_lease_closure.js; qa/qa_v356_final_foreign.js.
NOT GREEN: inherited qa_v353_regressions.js, qa_v354_integrity.js and qa_v356_consolidated.js stop on hard-coded older release version assertions. They have NOT been rewritten to claim a pass; a proper release gate must separate old snapshot identity checks from current financial behavior checks. V30.57.1 inherited focused QA also expects the old exact cache string. No authenticated browser or Render database QA occurred.

## Required next work within V30.57, before final one-build release
1. Reconcile workbook row by row with current source and obtain policy decisions for 30 occupied COA codes and tax/costing classifications; never overwrite live codes.
2. Complete and test remaining operational accounting workflows, inventory subledgers, linked settlement, and COA hierarchy without duplicating cash or altering historical posted journals.
3. Run full Finance/Accounting/Excavator/Pink Salt regression against an isolated copy of the existing persistent database. Verify exact V30.54 sale settlement case (9000 advance + 500 new receipt on 9500 sale); no extra 9500 Finance entry.
4. Authenticated CEO/Finance/Accountant browser QA in EN/KR and real Render staging, preserve original database/disk and validate migrations before production approval.

## Handoff / use
This ZIP is a source checkpoint, not a production/Git deployment instruction. Continue directly from its working source, review its unfinished features, repair/update source-compatible QA without weakening behavior checks, and issue ONE final V30.57 Git-ready ZIP only after all agreed requirements and QA are satisfied. The assistant cannot autonomously open a future conversation; upload this ZIP and reference this progress document when continuing.
