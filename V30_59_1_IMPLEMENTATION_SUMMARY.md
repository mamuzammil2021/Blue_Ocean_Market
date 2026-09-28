# Blue Ocean Market V30.59.1 — Employees / Payroll / My Account Full-Page UX Hotfix

Baseline: V30.59.0 Employees, Payroll & My Account build.

## Completed

- Fixed the shared `statusBadge is not defined` browser runtime failure that blocked Employee Open/Profile and My Account by removing the V30.59.1 UI dependency on the runtime-local status helper.
- Replaced the old Employees & Payroll landing layout with a polished workspace containing Overview, Employees, Payroll Runs and Advances sections.
- Converted substantial Employee Profile content from a wide modal into a full-screen page with section navigation: Overview, Employment, Compensation, Advances, Payroll History, Accounts, Documents and Cost Allocation.
- Converted Payroll Run detail/review from a wide modal into a full-screen page. Small actions such as Review/Adjust, Give Advance, Edit Employee, Upload Documents and Pay/Link Finance remain focused modal actions.
- Added clear payroll-level and employee-level presentation of Advance Balance Before, Scheduled Recovery, Recovery This Payroll, Advance Balance After and Net Cash Payable.
- Improved payroll workspace summaries for Gross, Advance Recoveries, Net, Paid, Outstanding and status.
- Improved the Advances workspace so recovery method/value/start are visible without opening every employee. The employee list query now joins the active total-balance recovery terms in one query rather than introducing per-row API calls.
- Improved Employee Profile payment-account presentation and account-change request review while preserving the existing shared payee-account manager and immutable payment snapshots.
- Redesigned My Account / My Profile as a full-screen self-service workspace with left-side section navigation on desktop and responsive horizontal navigation on smaller screens.
- My Account sections: Overview/Profile, Security, My Employment, My Payroll, My Payslips, My Advances, My Payment Accounts, My Documents and My Access.
- Profile editing is now a small focused modal; substantial self-service information remains on the full page.
- Added modal lifecycle compatibility so save/link actions close their focused modal and return to the correct full-page Employee or Payroll section.
- Preserved the V30.59 accounting/finance architecture: one real cash movement remains one Finance record; payroll settlement links eligible Finance records rather than duplicating cash.

## Backend read-model refinements

- `/api/payroll/employees` now includes active recovery-term summary fields used by the Employees/Advances workspace.
- `/api/payroll/runs` now includes aggregate payroll advance recovery (`advance_total`) for clean list-level reporting.

## Version

V30.59.1
