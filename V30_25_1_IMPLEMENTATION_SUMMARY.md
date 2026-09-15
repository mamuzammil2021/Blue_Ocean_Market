# Blue Ocean Market V30.25.1 Implementation Summary

**Release type:** Critical Integrity Hotfix  
**Baseline:** V30.25.0 Finance Integrity / Accounting / Statements + V30.24.3 Render persistent-disk baseline

V30.25.1 is intentionally narrow. It does not implement the broader system-audit backlog. Its purpose is to stabilize five already-used areas without redesigning unrelated modules.

## 1. Deterministic System Settings navigation

- `System Settings` is now a first-class base navigation item instead of depending on a late overlay/timed refresh.
- CEO / Owner always passes the base navigation authorization rule.
- Authorized System Administrators continue to use `sensitive.system_admin` permission.
- The broken late `renderNav()` refresh dependency was removed.

## 2. Finance Statement cash integrity

- Finance Statement now includes actual cash-effect rows only.
- Operational recognition bridge rows with `cash_effect=0` are excluded from Finance cash totals.
- Legacy/manual Finance rows retain a compatibility path so genuine manual cash entries remain visible.
- New manual Finance entries now explicitly store `finance_role` and `cash_effect`.

## 3. One authoritative P&L source

- Legacy `/api/pnl` no longer calculates profit from a separate mixture of operational sales and Finance Revenue/Expense rows.
- It now derives revenue, COGS, operating expense and net profit from the official posted Accounting ledger.
- The existing response shape is retained for older dashboard/business-unit consumers to minimize regression risk.

## 4. Cash reference rule completion

- Remaining Pink Salt supplier-advance edit and paid-order paths now require a reference only for non-cash payments.
- Cash still requires the other normal controls such as amount, account/evidence where applicable.
- Shared client behavior removes the visible required `*` from Reference when Cash is selected and restores it for non-cash methods.

## 5. Native Buyer/Supplier Statement actions

- Excavator Buyer Statement and Supplier Statement actions are now rendered directly in their native profile/detail headers.
- The delayed V30.25 DOM injection was removed.
- Existing statement endpoints, date filtering, PDFs and nested-dialog/context behavior remain unchanged.

## QA

- `npm run qa:current` — PASS
- `npm run qa:render` — PASS
- Source syntax checks — PASS
- ZIP integrity — performed when the final package is created
- Runtime smoke is not claimed until `npm ci && npm run qa:runtime` is run in the normal Node 22 environment.

## Deliberately not changed in this hotfix

The wider audit backlog—CRM navigation, AI Assistant implementation, MIMI advanced POS, meeting automation, staff-profile redesign, migration expansion, notification channels, full localization audit, SOP versioning and broader architectural refactoring—remains deferred. This is deliberate to protect the stable V30.25.0 workflows.
