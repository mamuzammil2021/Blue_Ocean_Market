# Blue Ocean Market V30.51.0 — Frontend Lazy Loading & Performance Hardening

## Protected source
Directly derived from the actual V30.50.0 Git/Render ZIP. All V30.39–V30.50 financial, inventory, permissions, navigation, feedback, pagination and Read/Write workflow sources are carried forward. No DB migration, destructive reset, API write change, or persistence-path change.

## Changes delivered
1. Dependency-audited route-based loading for three **read-only Pink Salt presentation modules**: Customers/Orders (`v349-pink-pages.js`), Import Shipments (`v350-import-pages.js`), and Raw Stock (`v350-raw-pages.js`). They are no longer executed or transferred at initial app load; shared business logic and transaction forms remain in the protected eager runtime. The direct-tab `v349-accounting-pages.js` stays eager, because users can open its journal tab without passing through `loadView`.
2. New `v351-loader.js` single-flight module loading, cached readiness, fail-open legacy renderer, retry after missing module, and stale-navigation guard. No duplicate progress notification is introduced; the existing section shell is reused.
3. Strengthened Pink Salt customer/order and Accounting journal request epoch checks: results from the prior user/business unit are discarded even if the screen name is unchanged. Server BU/permission checks and authoritative full-unit totals are unchanged.
4. Mandatory release QA extended with 24 dedicated checks and a static Chromium scenario verifying initial module absence, first-use loading, second visit reuse, relevant screen content and absence of uncaught browser errors. Inherited SQL/browser suites remain in the gate.
5. A measured static payload comparison: the initial HTML includes 16 instead of 18 scripts; its referenced raw JS set is about 8,359 bytes smaller (based on the V30.50 script list and current source bytes). These are transferred/executed only upon the relevant route; this is *not* a claimed live load-time improvement. Two earlier optional workspace modules remain lazy.

## Deliberate safety boundary
The 15 remaining sensitive/legacy `MutationObserver` constructors and the large consolidated cross-business runtime remain unchanged. Those include access, sale validation, account picker and modal protections. Removing or splitting them without native authenticated workflow parity could break business transactions. Detailed performance sign-off also requires a representative live Render staging environment. No claim of full project performance completion.

## Deployment
Use Node 22. Preserve the mounted `/var/data`, production DB, uploads, evidence, backups, environment secrets, and existing Git metadata. Install dependencies with `npm ci`; run `npm run qa:release`, `npm run qa:v351:browser`, inherited browser/SQL fixtures and signed-in CEO/BU-restricted acceptance. Check `/api/health` reports `30.51.0`. Verify Pink Salt Customers/Orders/Imports/Raw Stock first-use and repeat navigation, denied BU, EN/KO, return context, and original import payment/advance/receiving and stock production/waste paths. Roll back to the protected V30.50.0 source if needed; never reset the production disk.
