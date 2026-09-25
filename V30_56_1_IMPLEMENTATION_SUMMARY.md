# V30.56.1 — Accounting workspace continuation / financing register (staging)

Built on the user-supplied V30.56.0 source (which inherits V30.55 Cash & Banks). This is a **staging continuation, not the completed three-build Accounting program**.

## Delivered
- Preserved V30.56.0 Financial Workspace, balance summaries, per-account navigation, posted-vs-operational distinctions and Posting Control links.
- Added BU-scoped KRW Loans & Leasing agreement register (bank loan/equipment lease/other financing), lender, agreement reference, optional asset description, selected KRW company account, original/opening principal, annual rate, term and payment day.
- Read-only estimated equal-installment and equal-principal amortization schedules, including month-end dates and final installment rounding.
- Link ONE existing, verified, outgoing Finance payment from the agreement's designated company account to ONE financing agreement, with a principal/interest/fee split matching its full cash amount. Idempotent unique Finance ID and no extra Finance record or GL entry.
- Shows matched payment history, excludes voided or no-longer-verified payments from current principal totals, and flags that the financing subledger needs reconciliation against the official posted GL.
- Client Review & Confirm, scoped loading, bilingual labels and targeted workspace refresh.
- Safe add-only SQLite financing tables; no changes to existing operational/financial records or Render storage locations.

## Explicitly NOT delivered / release gates
- No automatic loan disbursement recognition, no new Accounting posting proposal for loan principal/interest/fees, no lease asset/right-of-use accounting, no multi-currency/FX financing, no lender contractual schedule amendments, no attachment workflow, no automated partial/early-repayment recast or bank statement import. Existing verified Finance payment is matched to the register **for operational reporting only**, and its existing GL classification must be independently reconciled by authorized Accounting.
- Unified six-section Accounting reorganization, complete transaction drill-down across every BU, bank-statement imports, COA workbook alignment, additional reports and opening-balance migration remain in the wider Accounting roadmap.
- No authenticated multi-user browser test, Render production/persistent-database test, or external bank reconciliation completed.
- QA: workspace static checks 10/10; financing isolated/static checks 10/10; inherited V30.54 SQL repeat-deploy fixture passes. The historical V30.53/V30.54 source QA scripts have version-specific assertions and fail unchanged on a later version, so do not present them as passing. Do not merge into production until dedicated staging verification and proper Finance/GL integration.
