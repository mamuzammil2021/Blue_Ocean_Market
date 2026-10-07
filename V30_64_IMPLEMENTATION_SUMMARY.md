# Blue Ocean Market V30.64.0 — EN/KR Bilingual Integrity

Built directly on V30.63.0.

## Scope
- Added a supplemental Korean catalog for untranslated system UI introduced across newer Accounting, Employees/Payroll, Access Control, Meetings/Tasks, finance/account and shared workflow surfaces.
- Kept English as the source/fallback language; user-entered and externally sourced values are not translated.
- Added late-mutation translation coverage for placeholder/title/aria-label and text changes after initial rendering.
- Added a non-destructive runtime `boI18nAudit()` diagnostic to identify remaining system-looking Latin text while Korean is active.
- Added V30.64 regression QA and release identity.

## Permanent rule
Every new or modified user-facing feature must ship with both EN and KR strings and use the shared i18n layer. Missing translations/language leakage are regressions. When an existing area is touched, its affected UI should be audited and safely migrated into the shared catalog without disturbing stable behavior.

## Safety
- No database schema or historical financial data changes.
- No Finance/Accounting posting logic changes.
- No user-entered business values are automatically translated.
