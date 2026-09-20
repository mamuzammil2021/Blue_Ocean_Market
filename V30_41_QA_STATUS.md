# V30.41.0 QA Status

## Completed in the build workspace
- `npm run qa:v341`: **75 passed, 0 failed**.
- `npm run qa:current`: **538 inherited/current regression checks passed, 0 failed**.
- `npm run qa:render`: **19 persistence checks passed, 0 failed**.
- Node syntax validation is included for the changed server/browser/QA modules.
- Release ZIP integrity and SHA-256 verification are performed after final packaging.

## Runtime/API gate
The workspace does not contain committed `node_modules`. An attempt to run `npm ci` in this build sandbox did not complete before the environment network/install timeout, so live-server/API runtime suites are **not represented as passed** in this status.

Before production promotion, run in the normal local/Render Node 22 environment with npm registry access:

```bash
npm ci
npm run qa:v341
npm run qa:current
npm run qa:render
npm run qa:v341:runtime
npm run qa:v340:runtime
npm run qa:runtime
```

The V30.40 runtime suite remains relevant because V30.41 builds on the same multi-profile/effective-access engine and adds the Access Control Center/policy overlay on top of it.
