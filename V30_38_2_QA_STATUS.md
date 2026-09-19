# V30.38.2 QA Status

- `npm run qa:v3382` — **33/33 PASS**
- V30.38.2 focused Chromium audit (`qa/browser_v3382_patch_audit.py`) — **18/18 PASS**
- Inherited V30.38.1 focused Chromium audit — **10/10 PASS**
- Inherited V30.38 focused Chromium audit — **18/18 PASS**
- Inherited V30.37 focused Chromium audit — **18/18 PASS**
- Inherited V30.36 stateful Chromium audit — **28/28 PASS**
- `npm run qa:v3381` — **22/22 PASS**
- `npm run qa:v338` — **35/35 PASS**
- `npm run qa:v337` — PASS
- `npm run qa:v336` — PASS
- `npm run qa:v336:handlers` — PASS; **1,301 inline event attributes / 1,354 call references / 576 unique named targets / 0 unresolved**
- `npm run qa:v335` — PASS
- `npm run qa:v334` — PASS
- `npm run qa:v333` — PASS
- `npm run qa:v332` — PASS
- `npm run qa:current` — **V30.38.2 CURRENT QA PASS**
- `npm run qa:render` — PASS
- V30.38.2 schema change — **NONE**
- Destructive migration/reset — **NONE**
- Existing data/uploads/backups/Render persistent disk — **PRESERVED / COMPATIBLE**

## Focused V30.38.2 acceptance coverage
- real mouse interaction keeps both Buy Machine Token Payment account lists usable;
- a non-default Pay From and Paid To account can be selected and retained;
- the actual Add / Manage Accounts control opens the final shared Supplier Accounts manager;
- V30.38.1 parallel/prefetch account-loading behavior remains protected;
- refund preview shows Refund Currency, FX/KRW equivalent, KRW deduction and remaining balance clearly;
- direct refund Pay From and Paid To accounts are constrained to Refund Currency and backend-validated;
- successful child mutations close only the active child and restore parent context;
- failed mutations keep the dialog open for correction;
- protected processing appears for active modal mutations;
- Machine Costs entries use a bounded scroll region while Total machine cost remains visible;
- locked cost rows use compact disabled `🔒 Edit` instead of the large yellow lock card;
- cost-row actions align to the right;
- no uncaught page errors in the focused V30.38.2 browser audit.

## Live runtime note
The package intentionally contains no `node_modules`. In this clean build container, runtime smoke stops before application startup with `Cannot find module 'express'`; it is **not claimed as a runtime pass**. Run:

```bash
npm ci
npm run qa:runtime
```

on the normal networked Mac/Render Node 22 environment before live acceptance.
