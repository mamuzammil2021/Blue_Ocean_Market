# Blue Ocean Market Release Manifest

- Release: **V30.39.0 — Performance Foundation & Runtime Consolidation**
- Protected baseline: **V30.38.2 — Refund / Modal / Machine Cost / Token Account Interaction Hotfix**
- Release type: **system-wide performance architecture / compatibility consolidation**
- Destructive migration/reset: **None**
- Database changes: **additive performance indexes + runtime PRAGMA tuning only; no table/column destructive migration**
- Existing SQLite data/uploads/backups/Render persistent disk: **Preserved / compatible**
- Historical V30.38.2 browser patch source: **Retained for traceability/rollback**
- Live browser delivery: **3 scripts (`i18n-ko.js`, `client.js`, `runtime-v3039.js`) instead of the previous 45 startup script tags**
- Precompressed hot assets: **Included (`.gz`)**
- Implementation summary: `V30_39_IMPLEMENTATION_SUMMARY.md`
- QA status: `V30_39_QA_STATUS.md`
- Dedicated release QA: `npm run qa:v339` — **54 passed, 0 failed**
- Current/inherited QA: `npm run qa:current` — **PASS**
- Handler wiring: `npm run qa:v336:handlers` — **0 unresolved inline handlers**
- Render persistence QA: `npm run qa:render`
- Runtime smoke: run `npm ci && npm run qa:runtime` in a networked Node 22 Mac/Render environment.

## Carry-forward architecture

`REQUIREMENTS_MASTER.md` now contains the permanent **System-Wide Performance, Async Interaction & Scalability Standard**. New modules, new Business Units, new workflows and future releases inherit immediate action feedback, duplicate protection/idempotency, targeted refresh, stable parent context, shared request/lifecycle primitives, scalable server-side pagination, non-blocking heavy work, diagnostics and performance QA without requiring the user to repeat those requirements.

## Pagination transition note

V30.39 provides the shared server-side pagination contract/helper and makes it mandatory for new scalable lists. Existing legacy lists are not all rewritten to SQL `LIMIT/OFFSET` in this consolidation release; they can be migrated incrementally under the same 25/50/100 paging contract to avoid unnecessary regression risk.
