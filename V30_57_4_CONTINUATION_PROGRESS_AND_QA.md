# V30.57 continuing source — NOT A FINAL RELEASE
Date: 26 September 2026. Source: V30.57.3 continuation checkpoint, inherited V30.57.2 package identity. The working package remains staging-only.

## Completed in this pass
- Corrected posted fixed-asset depreciation and prepaid amortization reporting: an unposted reversal no longer removes recognized amounts from official subledger balances. Only a posted reversal does so. Existing `posted()` eligibility still holds dependent new transactions while a reversal awaits review.
- Added in-memory SQLite regression covering both pending and posted reversal states for both ledgers.
- Added `qa/qa_v357_current_gate.js`, a non-destructive gate for the current source. Historical test assertions were not modified or falsely declared passed.
- Preserved the COA source codes, original V2 requirements workbook, read-only inter-BU reconciliation, and all prior V30.57 functionality. No Finance insertion, database reset, or persistent data edit.

## Verified in this pass
- `node qa/qa_v357_current_gate.js`: 10/10 checks pass (includes six suites and four integrity source checks).
- `node qa/qa_v3572_real_sqlite.js`: registration, duplication, depreciation, expense accrual, prepaid recognition/amortization, pending/posted reversals, closed periods pass.
- `node qa/qa_v3573_interbu_readonly.js`: posted-only as-of, privacy and no-write checks pass.
- `npm run qa:release`: FAIL at first historical release-identity assertion expecting V30.54.0. Older source-level suites likewise expect previous identities. This is NOT a green full release gate.
- Authenticated Render test, existing database compatibility, full end-to-end payment/inventory/BU scenarios: NOT PERFORMED.

## Still required before one final V30.57 release
1. Approve accounting-policy-dependent mappings. Thirty proposed draft account codes conflict with occupied existing codes; do not overwrite or renumber live COA. Complete row-level 138 COA/61 posting-rule approval matrix.
2. Finish full fixed-asset acquisition/improvement/transfer/partial disposal/sale/impairment lifecycle and control-to-subledger reconciliation.
3. Complete verified Finance settlement links for liabilities, accruals, and prepayments; policy-approved payroll and applicable taxes.
4. Verify Excavator machine-by-machine purchase/landed-cost/COGS and Pink Salt import/raw/packaging/WIP/finished/batch/loss values against operational source records.
5. Verify inter-BU transfer partner dimensions and consolidation elimination (read-only gross due-from/due-to check is not enough).
6. Complete relevant posted-data graphs and professional Accounting UI browser QA.
7. Modernize the full historical QA runner without disabling financial assertions, then run complete Finance/Accounting/Excavator/Pink Salt regression, including 9,000 allocated advance + 500 new receipt on a 9,500 sale.
8. Test authenticated CEO/Finance/Accountant permissions, EN/KR and a safe existing-DB staging copy on Render; preserve persistent disk.

## Delivery status
Working source ZIP only. Not pushed, not deployed, not production approved. The user explicitly requested a single final consolidated build; this checkpoint is provided solely to preserve progress rather than misrepresent completion.
