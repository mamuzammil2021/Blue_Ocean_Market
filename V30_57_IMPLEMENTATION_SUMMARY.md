# V30.57.0 — Accounting Workspace UI & COA Compatibility (staging candidate)

Base: exact user-uploaded V30.56.0 finalized source. This is a focused UI implementation and requirements audit, not completion of the entire planned V30.57 real-world accounting scope.

## Implemented
- Single persistent six-group Accounting sidebar with expandable submenus and focused content area. Reuses original screens, authorized endpoints, and existing Simple/Advanced logic rather than duplicating financial engines.
- Overview reduced to headline posted figures and attention indicators. Cash/bank, advances and financing detail stay in dedicated pages. Removed unnecessary account/balance network reads from overview.
- Chart of Accounts displayed by actual account type; search, posting eligibility and status visible. No assumption that draft workbook codes equal production codes.
- Manual journal account selection grouped by actual account types, exact code and name, with inactive/non-manual accounts visible but disabled; search field and live debit/credit/difference review. Existing server validation, permissions and Posting Control preserved.
- Desktop sticky sidebar, responsive mobile layout, EN/KR labels, cache-busted assets and V30.57 package/health metadata.
- Original V2 accounting specification and initial audit/compatibility matrix carried from earlier checkpoint.

## Safety and non-changes
No new financial mutation endpoint, accounting table alteration, COA renumbering, posting-rule activation, or database reset. Existing finance source and journal posting code remain untouched. Live data and Render persistent disk are not present in this ZIP.

## Known limitations / remaining work
- Full parent/child COA hierarchy is NOT implemented: existing live schema exposes real account type and posting eligibility, but draft parent-code definitions conflict with active code/name meanings. Resolve via approved compatibility mapping, not automatic renumbering.
- Remaining V30.57 scope: fixed-asset register and depreciation; prepaid/accrued expenses, payroll/taxes; Excavator/Pink Salt cost/inventory alignment; inter-BU mapping; complete workbook-to-code rule implementation and cross-module business testing.
- V30.58 scope: statement/report completeness, bank reconciliation, period close, historical migration and bilingual PDF/Excel.
- Browser-level and authenticated Render testing remains pending. Release not production approved.
