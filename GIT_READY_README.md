# Git / Render Ready — V30.38.0

This package is built directly on protected V30.37.0. It contains one additive audit/history table (`counterparty_payment_account_history`) and **no destructive schema reset**.

Recommended verification before merge/deploy:

```bash
npm ci
npm run qa:v338
npm run qa:v337
npm run qa:v336
npm run qa:v336:handlers
npm run qa:current
npm run qa:render
npm run qa:runtime
```

The current build container can run the shipped static/browser QA but does not contain the npm dependencies needed for live Express/SQLite runtime smoke. Complete `npm ci && npm run qa:runtime` in the normal networked Mac/Render Node 22 environment. Preserve the existing database, uploads and persistent disk during deployment.
