# Blue Ocean Market V30.39.1 — Progressive Loading & Live Performance Optimization

## Baseline
Built directly on V30.39.0. Existing business rules, permissions, Review & Confirm, idempotency, targeted refresh, stable parent context, EN/KR, SQLite data/uploads/backups and Render persistent disk are retained. No destructive migration/reset is introduced.

## Delivered
- Shared `BOMProgressive` browser layer with skeleton page/section states, independent error/retry states, parallel task helper, safe short-lived read caching, debounce reuse, visibility-based lazy loading and shared server-pager rendering.
- Generic `loadView()` now paints a progressive shell immediately instead of leaving the content area unchanged while a page waits on backend data.
- Boot/login independent context/access reads run concurrently; Business Unit + P&L reads run concurrently.
- Excavator Machines uses true server-side pagination/search/filter/sort and requests only 25/50/100 rows. Its summary and first machine page start concurrently.
- Excavator Buyers and Suppliers use true server-side pagination/search and SQL-side summary totals instead of downloading the complete master list.
- Buyer Detail opens before the network response, paints skeletons, loads the main profile first, and fetches receiver Accounts only when the Accounts section is selected.
- Supplier Profile opens before network completion. Overview machine/profile and statement reads run concurrently; Requirements and Accounts are deferred until selected. Each secondary section can fail/retry independently.
- Excavator overview no longer loads all transaction/repair/logistics/parts/payment tables into JavaScript and repeatedly filters them per machine. Cost/sale/payment values are calculated in SQL. Summary-only calls aggregate in SQL and do not return all assets.
- Normal machine-page queries return `COUNT(*) OVER()` with the requested page, avoiding a duplicate expensive snapshot count query in the common path.
- Buyer/Supplier requirement profile reads use persisted requirement-match counts rather than running matching algorithms for every requirement during every profile read.
- V30.39.1 rules are added to `REQUIREMENTS_MASTER.md` as permanent carry-forward requirements.
- Added the permanent **Smart Context-Aware Change & Impact-Control Standard**: future changes must be scoped by real business context/dependencies, preserve unrelated workflows and user context, and pass relevant dependent regression checks instead of using blind broad replacements.

## Scope note
The progressive/skeleton/request standard is system-wide and applies to all future work. V30.39.1 converts the highest-value Excavator list/profile paths to the new real paging/lazy pattern first instead of blindly rewriting every legacy module in one release. Any high-volume legacy list touched in future work must migrate to the shared server-paging contract.
