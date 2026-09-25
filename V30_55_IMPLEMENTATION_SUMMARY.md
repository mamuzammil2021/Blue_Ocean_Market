# V30.55.0 — Cash & Banks Visibility and Account Details

Built directly from the user-supplied V30.54.0 source. No persistent DB reset or migration. Protected V30.54 Finance integrity routines remain unchanged.

## Implemented
- New **read-only, authenticated, business-unit-scoped** overview endpoint `/api/v355/accounting/payment-accounts/overview`. Uses the existing account event/statement source rather than introducing independent cash events.
- Simple Accounting: prominently displayed recorded balances, month-to-date Money In/Out, currency, masked number, status, reconciliation item count and persistent Open action.
- Advanced Accounting: Recorded Balance, posted GL (when uniquely mapped), account currency, month movements and reconciliation columns, preserving Add Account/Open.
- Account detail: recorded vs posted GL, account country/currency, period movement and running transaction history, selected-period trend with chronological transaction-date running balances, reconciliation preview and source journal links, PDF and CSV export.
- EN/KR labels; responsive layout, no new mutating transactions, no changes to posting or financial integrity workflows.

## Explicit balance semantics
- **Recorded account movement balance (KRW)** includes opening balance and real account-linked events; it is NOT bank-confirmed available funds and can include Finance movements not yet posted.
- **Posted GL balance (KRW)** is shown separately and only if the ledger mapping is unique among financial accounts. Shared GL is marked, rather than presenting combined balances as one bank account's posted balance.
- Reconciliation shows matched/unmatched statement-line status; a true external bank balance is not fabricated from those lines.
- Original currency is displayed separately; amounts shown here are the source system's KRW equivalents, not a newly calculated real-time FX rate.

## Carry-forward and remaining work
- Live staging tests with actual saved accounts, shared GL mappings, multi-currency accounts and business-unit access; verify V30.54 real-db Finance integrity and posting. Test Render persistent disk across restart. No production deployment claimed.
- Full user-controlled bank statement import and automated matching; genuine bank-confirmed balance from external statement/bank feeds; reconciliation closing difference; richer transaction-specific source/evidence links.
- Official full cash flow, receivables/payables/advances drill-down, opening balance migration, fixed assets, accruals, taxes, period reports, and broader Accounting navigation remain separate phases.
- Full authenticated browser QA, actual PDF export and Excel workbook QA are not represented by static checks; CSV is provided for spreadsheet use.
