# V30.56.2 — Accounting workspace and financing journal continuation (STAGING)

Protected base: exact user-provided V30.56.1 source; preserves V30.55 Cash & Banks and V30.54 Finance integrity logic. This is a **staging candidate**, not full program completion.

## Added
- Practical six-section Accounting workspace shortcuts: Overview, Accounts & Ledgers, Money & Balances, Reports, Control and Setup. Existing Simple and Advanced views remain available; no financial-engine replacement.
- Existing account details, cash/bank cards, operational advances/payables/receivables, posting attention and financing register carried forward.
- Financing payment detail now links to the original Finance accounting journal and shows the reclassification proposal status.
- For a linked KRW verified Finance repayment whose original Finance journal is **already Posted** and has exactly one expense debit and one bank credit matching the payment, an authorized accountant can prepare a **cash-neutral Accounting reclassification proposal**. Debit liability (principal) + interest/fee expenses and credit the originally posted generic expense. It creates NO new Finance entry or second bank GL line; final posting stays in existing Accounting Posting Control with maker/checker and period control.
- Selected active liability/expense GL accounts are validated on server. Dedicated scoped selection API. Unique source index, existing-source check, verification, bank mapping, original posted journal/correction/reversal and Posting Control final eligibility checks. Finance evidence surfaced in the posting proposal detail.
- Isolated mock journal fixture demonstrates KRW 2,100 principal + 380 interest + 20 fees against one original 2,500 expense, with bank unchanged; duplicate and mismatched bank rejected.

## Not complete / important limitations
- Not a full automatic disbursement/loan-liability recognition system; new agreement registration remains operational only. Existing opening loans require official GL/migration reconciliation.
- Reclassification is deliberately blocked if original journal is complex, already split, already liability-classified, unposted, corrected, reversed or in a closed period. Such cases require authorized manual review, not automatic duplicate posting.
- No comprehensive lease right-of-use asset/lease liability accounting, variable-interest contract changes, lender-approved early settlement recast, multi-currency financing/FX, automated loan disbursement posting, bulk statement import, full report catalogue or historical opening-balance migration.
- Full app browser/runtime with actual Node dependencies and authenticated existing Render persistent database has NOT been run in this offline environment. Legacy static QA contains release-version assertions and is not represented as an unmodified passing suite.
- This release is staged for further acceptance; do not merge to production without backed-up live-data staging, verified transactions, period/reversal tests and financial reconciliation.
