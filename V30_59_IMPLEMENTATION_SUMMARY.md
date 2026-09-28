# Blue Ocean Market V30.59.0 — Employees, Payroll & My Account

Baseline: V30.58.0 consolidated Accounting engineering build. This release is a focused Employees/Payroll and logged-in user self-service refinement; it does not replace the existing Finance/Accounting integrity architecture.

## Delivered

- Section-based Employee Profile: Overview, Employment, Compensation, Advances, Payroll History, Accounts, Documents and Cost Allocation.
- Employee receiving/payment accounts reuse the mature shared payee-account manager with multiple accounts, default account, archive/history and immutable Finance receiver snapshots.
- Employee-level advance recovery terms applied to the total outstanding advance balance: Manual, Full Balance, Fixed Amount, Fixed Payrolls and Percentage of Salary.
- Payroll draft snapshots advance balance before, scheduled recovery, applied recovery, after balance, method/value and exception/reason.
- Payroll supports Scheduled, Full, Skip and Custom recovery decisions; deviations require a reason. Stale advance balances block approval until refreshed/reviewed.
- Each new employee advance creates one real Finance Money Out source record with company Paid From, employee Paid To, reference/evidence and receiver snapshot. Accounting is derived through the Finance verification/posting pipeline as Dr Employee Advances / Cr Cash-Bank.
- Payroll advance recovery remains non-cash: it reduces Salary Payable and Employee Advances without fabricating a Finance receipt.
- Salary compensation changes require a reason and preserve effective-dated compensation history.
- Employee-visible document flag and employee self-service document view.
- Normal logged-in user area renamed/redesigned as My Account with Profile, Security, My Employment, My Payroll, My Payslips, My Advances, My Payment Accounts, My Documents and My Access.
- Employees can request a new/default payroll receiving account; authorized payroll users approve/reject the request before the default changes.
- Existing V30.57 payroll settlement control remains: approved payroll payment links an eligible Finance `Payroll Liability Settlement` record rather than creating duplicate cash.

## Integrity rules retained

- One real money movement = one Finance record.
- Finance verification remains the cash-posting eligibility gate.
- Accounting recognizes/settles liabilities separately from operational payroll preparation.
- Historical payroll/account/payment snapshots are not rewritten by later employee/account changes.
- Cost allocation remains 100% controlled and existing reversal/audit behavior is preserved.

## QA

`npm run qa:current` passes. `npm run qa:v359` is the focused source/integration gate for this release. Runtime smoke requires installed Node dependencies; the Git-ready ZIP intentionally excludes `node_modules`.
