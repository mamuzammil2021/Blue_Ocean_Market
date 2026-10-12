# Blue Ocean Market V30.69.6 — System-Wide Refresh / Persistent Routing Hardening

Built directly on V30.69.5.

## Root issue fixed
Many full-screen views stored only the view name in temporary JavaScript state and relied on the last locally selected business unit. During a browser hard refresh, bootstrap could run before the correct business-unit context was restored; Pink Salt routing in particular could then see the wrong unit and intentionally replace the requested view with Dashboard.

## V30.69.6 changes
- Added a canonical route core in `public/client.js` that parses the browser hash before first render and restores the requested view.
- Every normal `go(...)` navigation now writes the current business-unit scope into the URL (`unit=<id>`; CEO all-unit scope uses `unit=all`).
- `switchUnit(...)` writes the new scope into the URL immediately.
- On login/boot, copied/deep URLs restore their business-unit context before rendering.
- Backward compatibility: old URLs such as `#psProduction` that do not yet contain `unit=` infer the required Pink Salt / Excavator / MIMI business unit when possible, then canonicalize the URL.
- Pink Salt's render layer no longer blindly drops a valid Pink Salt route to Dashboard merely because the unit had not been restored yet; it first resolves the Pink Salt business unit.
- Existing record routes (machines, buyers, suppliers, employees, Finance records/corrections, tasks, meetings, reports, Pink Salt suppliers/imports/orders/production batches) now carry unit context and restore that context before reopening the record.
- Browser Back/Forward and hash changes now re-render the correct top-level shell and then restore the registered record/detail route.
- Updated browser asset cache versions to V30.69.6 so Render/Chrome do not continue serving the older routing JavaScript after deployment.

## Permanent rule
All future important full-screen pages and record/profile detail views must use the shared URL-addressable routing/state framework. A refresh must not silently return the user to Dashboard. New business-unit-specific routers should not be created when the shared framework can be extended.

## Data safety
No database migration, destructive data operation, persistent-disk reset, or existing-record rewrite is included.
