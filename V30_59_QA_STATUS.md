# V30.59.0 QA Status

- Current protected-source static/syntax regression: PASS (`npm run qa:current`).
- V30.59 focused Employees/Payroll/My Account source/integration gate: run with `npm run qa:v359`.
- Node runtime smoke could not be completed in the build container because the source archive excludes `node_modules` and dependency installation did not complete in the available environment. This is an environment/dependency availability limitation, not a reported application test failure.
- Before production merge/deploy: install locked dependencies with `npm ci`, run `npm run qa:runtime`, then exercise employee advance → Finance verification → Accounting posting and payroll draft/approval/payment on a copied/staging database.
