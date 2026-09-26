# V30.57.0 — In-progress source checkpoint, NOT completed release

Protected base: provided V30.56.0 ZIP, extracted without replacing existing database or uploads.

## Completed at this checkpoint
- Recovered actual September 7 V2 workbook from Library and parsed its 14 worksheets into accounting_spec/original_v2_reference.json.
- Generated line-level COA_COMPATIBILITY.csv (138 rows), POSTING_RULE_COVERAGE.csv (61 rows), and WORKBOOK_COVERAGE.csv, with no false claims of end-to-end posting coverage.
- Audited existing V30.56 v290 system account seeds and found **30 exact-code / differing-name conflicts** with the proposed workbook. Examples: live 1000=Cash / Bank Clearing vs draft 1000=Assets header; live 1100=Accounts Receivable vs draft 1100=Cash & Bank; live 1200=Excavator Inventory vs draft 1200=Receivables. Existing codes and journals are preserved.
- Added qa/qa_v357_coa_compatibility.js safety gate. Draft accounts are not auto-imported. No Finance events, journals, GL balances, permissions, or UI were modified.

## Still required to complete V30.57
- Map each workbook rule to an actual operational source and posting flow; verify existing code, choose compatible unmapped codes, and obtain accounting-policy review for pending decisions.
- Implement fixed-assets register/depreciation/disposals and real-world expense, prepayment, accrual and tax flows through existing authorization/Posting Control.
- Validate machine/Pink Salt perpetual inventory, WIP and landed-cost postings, inter-BU clearing/consolidation, source-to-journal drill-down and English/Korean UI.
- Run current-release and cross-module regression suite and isolated staging tests, including existing Render DB copy. No production approval until these pass.

## Deployment status
NOT deployed, NOT production-ready. This ZIP is a source/mapping checkpoint only. Never reset or overwrite the existing persistent disk. Do not treat mapped draft rows as activated COA accounts.

## Tests executed on this checkpoint
- `node qa/qa_v357_coa_compatibility.js`: PASS (138 COA rows, 61 rules, 30 differing code/name conflicts identified; original seeds preserved).
- `node qa/qa_v356_consolidated.js`: PASS (V30.56 consolidated source QA: metadata, targeted financing tests and syntax).
- `node --check server/v290.js` and `node --check qa/qa_v357_coa_compatibility.js`: PASS.
- Authenticated browser / copied Render persistent database / actual posting & reversal / real PDF: NOT TESTED.
