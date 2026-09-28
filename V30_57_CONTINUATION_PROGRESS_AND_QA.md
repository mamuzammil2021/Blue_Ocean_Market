# V30.57 continuation checkpoint — NOT FINAL, NOT FOR PRODUCTION

Date: 26 September 2026. Base: V30.57 consolidated checkpoint (internal 30.57.2), itself based on the V30.57.1 UI build and V30.56 protected financial engine. This is a source checkpoint, not a new completed release. Do not overwrite existing Render DB or disk.

## Completed in this continuation
- Added a read-only `/api/accounting/inter-bu-reconciliation-v357` endpoint. It compares posted/reversed GL Due From and Due To by BU and company as-of date, excludes pending journals, scopes unit rows, and restricts company totals to CEO/company scope. Does not create Finance entries or journals.
- Wired a dedicated Accounting Control → Inter-BU Reconciliation screen, responsive posted balance table and difference state, EN/KR labels, date filtering, no mutation buttons.
- Replaced date parser with exact ISO calendar round-trip check; rejects rollover dates such as February 30 in new accounting proposals and the reconciliation endpoint.
- Added `qa/qa_v3573_interbu_readonly.js` real in-memory SQLite fixture with five checks including no writes, period selection and privacy.
- Preserved original V2 workbook, existing COA codes, financial records and older source code. No migration/reset performed.

## Verified QA
- PASS new inter-BU real SQLite test (5 checks).
- PASS existing real SQLite fixed-asset/accrual/prepaid lifecycle test (9 checks).
- PASS inherited V30.57.2 source QA (16 checks) and 138/61/30 COA compatibility check.
- PASS selected financing/lease/FX source/integration tests.
- FAIL full `npm run qa:release`: first test (`qa_v351_hardening.js`) stops on hard-coded historical release identity (V30.51). This is NOT an overall green QA result; retain all functional assertions when modernizing the gate.
- NOT RUN: authenticated browser, existing Render data copy, actual production tax/inventory source events, end-to-end business-unit elimination.

## Remaining work required before a final V30.57 release
1. Obtain accountant-approved mappings for the 30 occupied draft COA codes and row-by-row signoff of all 138 accounts/61 posting rules; never renumber occupied live accounts.
2. Complete source-linked fixed asset acquisition/improvements/transfers/impairment/partial & sale disposal; real payable/Finance settlements and current journal/subledger reconciliation.
3. Complete accrued liability settlement, prepaid scheduling, payroll and tax workflows consistent with jurisdiction-specific approved policies.
4. Confirm machine-by-machine Excavator cost/COGS and Pink Salt import/raw/packaging/WIP/finished goods, normal/abnormal loss valuations with actual operational data.
5. Validate inter-BU counterparty dimensions, transfer/clearing elimination, and company & BU financial statements.
6. Implement remaining graphs only on relevant screens using actual authorized posted data, with clear pending/recorded distinction.
7. Modernize release gate version checks without mutating legacy behavior expectations; run full Finance/Accounting/Excavator/Pink Salt regression, including 9,000 advance + 500 receipt on a 9,500 sale (no fabricated 9,500 Finance movement).
8. Authenticated CEO/Finance/Accountant browser QA in EN/KR using isolated copy of existing persistent DB, verify actual Render staging before production approval.

## Continuation instruction
Continue from this exact folder/ZIP rather than from the original V30.56 ZIP, retaining previous V30.57 implementation and accounting_spec files. Issue ONE final consolidated Git-ready V30.57 ZIP only after the above are done and the complete release gate is green. The assistant cannot automatically start a future chat; the user can upload this checkpoint to resume.
