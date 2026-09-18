# V30.38.1 QA Status

- `npm run qa:v3381` — **22/22 PASS**
- V30.38.1 focused Chromium audit (`qa/browser_v3381_hotfix_audit.py`) — **10/10 PASS**
- Inherited V30.38 focused Chromium audit — **18/18 PASS**
- Inherited V30.37 focused Chromium audit — **18/18 PASS**
- Inherited V30.36 stateful Chromium audit — **28/28 PASS**
- `npm run qa:v338` — **35/35 PASS**
- `npm run qa:v337` — PASS
- `npm run qa:v336` — PASS
- `npm run qa:v336:handlers` — PASS, **0 unresolved inline named handler/call targets**
- `npm run qa:v335` — PASS
- `npm run qa:v334` — PASS
- `npm run qa:v333` — PASS
- `npm run qa:v332` — PASS
- `npm run qa:current` — **V30.38.1 CURRENT QA PASS**
- `npm run qa:render` — PASS
- V30.38.1 schema change — **NONE**
- Destructive migration/reset — **NONE**
- Existing data/uploads/backups/Render persistent disk — **PRESERVED / COMPATIBLE**

## Focused V30.38.1 acceptance coverage
- untouched Sell Machine required fields remain visually neutral
- blur/submit invalid-field behavior remains active
- valid corrected Sell Machine fields immediately clear inherited stale red/error state
- slow account connections show explicit Pay From / Paid To loading states
- company and supplier account requests begin in parallel
- one eligible company account remains enabled, visible and selectable
- one eligible supplier account remains enabled, visible and selectable
- legacy supplier account response shapes/missing method metadata remain compatible
- Buy Machine Add / Manage Accounts opens the final shared Supplier Accounts manager
- account manager close returns to Buy Machine and refreshes affected account data
- no uncaught browser page errors in the focused hotfix audit

## Live runtime note
The package contains no `node_modules`. In this build container, runtime smoke stops before application startup with `Cannot find module 'express'`. This is not claimed as a runtime pass. Run:

```bash
npm ci
npm run qa:runtime
```

on the normal networked Mac/Render Node 22 environment before production acceptance.
