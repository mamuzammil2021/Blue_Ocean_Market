# V30.36.0 QA Status

## Passed in this build environment

- `npm run qa:v336` — PASS
- `npm run qa:v336:handlers` — PASS
- `npm run qa:v335` — PASS
- `npm run qa:current` — PASS
- `npm run qa:v334` — PASS
- `npm run qa:v333` — PASS
- `npm run qa:v332` — PASS
- `npm run qa:render` — PASS
- `node qa/qa_v331_button_actions.js` — PASS
- Chromium stateful audit (`qa/browser_v336_stateful_audit.py`) — 28/28 PASS, 0 uncaught page errors
- Expanded inline action wiring sweep — 1,248 inline event attributes, 1,300 named call references / 559 unique targets, 0 unresolved targets

The broader browser inventory preceding the stateful acceptance pass rendered 99 navigation states across consolidated + all business units, inventoried 438 visible controls and normalized 169 unique rendered controls. Generic controls ran without application runtime failures; state-dependent Accounting/Payroll and stock-gated Finished Goods actions were separately exercised.

## Runtime smoke limitation

`npm run qa:runtime` was attempted and did not reach application startup because this build container does not have the required `express` module installed. The available `node_modules` tree is incomplete and npm registry access is unavailable in this environment. The observed failure is `Cannot find module 'express'` before Blue Ocean Market server startup.

This release therefore does **not** claim live Express/SQLite end-to-end runtime coverage in the build container. Before production acceptance, run:

```bash
npm ci
npm run qa:runtime
npm start
```

in the normal networked Node 22 test/deployment environment.

## Data safety

V30.36.0 is additive/no-schema. It does not reset or destructively migrate the SQLite database, uploads, backups or Render persistent disk.
