# V7 — Full-stack rebuild/architecture correction

## Major changes
- Server-side business-unit isolation for non-CEO users.
- CEO consolidated dashboard plus active business-unit switcher.
- CEO unit selection is validated by the backend using `X-Business-Unit-ID`.
- Non-CEO users cannot override their assigned unit.
- Business-unit scoped products, sales, purchases, finance, tasks, CRM, approvals, KPIs, documents, meetings, reports, inventory and restaurant functions.
- MIMI Resturant is treated as an independent business unit; restaurant endpoints require MIMI scope.
- Desktop sidebar vertical scrolling and mobile horizontal navigation.
- UI header shows current unit scope.
- CEO sees All Business Units by default and can switch to a single unit.
- Added master acceptance document combining blueprint and compulsory user requirements.
- Static/reference data controls are standardized toward select/search-select usage in the existing UI.
- Audit and financial history remain protected through void/archive patterns where appropriate.

## Important
V7 is intended to be tested as a full-stack Node.js application. The source blueprint remains the authoritative baseline, with all recorded user recommendations treated as compulsory additions.
