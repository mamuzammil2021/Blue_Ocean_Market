# Git / Render Ready — V30.38.1

V30.38.1 is a focused point-release hotfix built directly on protected V30.38.0. It changes Sell Machine client validation presentation and Buy Machine token-account loading/routing only. There is **no V30.38.1 schema change or destructive reset**.

Recommended verification before merge/deploy:

```bash
npm ci
npm run qa:v3381
npm run qa:v338
npm run qa:v337
npm run qa:v336
npm run qa:v336:handlers
npm run qa:current
npm run qa:render
npm run qa:runtime
```

The clean build container can run the shipped static/browser QA but does not contain `node_modules`, so live Express/SQLite runtime smoke cannot start here. Complete `npm ci && npm run qa:runtime` in the normal networked Mac/Render Node 22 environment. Preserve the existing database, uploads and persistent disk during deployment.
