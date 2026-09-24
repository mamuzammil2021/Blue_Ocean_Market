# Blue Ocean Market V30.44.0 — QA Status

- `npm run qa:v344`: passed (dynamic Simple and Advanced renderer repeat-load checks; enhanced card buttons; account detail destination; Advanced/Simple close-flow behavior).
- `npm run qa:v343`: passed (inherited requirements, release tag adjusted to current version).
- `npm run qa:current`: passed (full packaged JS syntax / inherited static checks).
- `npm run qa:render`: passed (persistent storage/reset safeguards).
- Browser asset `.gz` integrity and ZIP integrity: checked at packaging.
- Dependency-backed runtime suites and live authenticated Render browser test are not claimed here. Run after `npm ci` on a normal Node 22 environment; smoke test an actual signed-in account before production promotion.

## Manual acceptance
1. Simple → Cash & Banks initial visit, re-click active tab, navigate away/back and hard-refresh: each accessible account retains a working Open button.
2. Advanced → Cash & Bank Accounts initial visit/reselect: every account row has an Open button.
3. Both lead to the same Account Detail, with statement generation, PDF download and permitted transfers.
4. The detail Back action returns to the originating Simple/Advanced view and does not force Advanced into Simple.
5. Verify across EN/KR and user BU scope.
