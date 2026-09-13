# Blue Ocean Market V30.24.3 Release Manifest

**Release:** V30.24.3  
**Package:** `Blue_Ocean_Market_V30_24_3_BU_SCOPED_NUMBERING_REFERENCE_REGISTRY_LOCAL_TEST.zip`  
**Baseline:** V30.24.2

## Primary V30.24.3 files

- `server/numbering-service.js` — central definition, override, sequence and audit service.
- `server/v3243.js` — BU-scoped Numbering & References APIs, access enforcement and conflict checking.
- `public/v3243-client.js` — Company / Shared + BU-separated Numbering & References UI.
- `server/server.js`, `server/v290.js`, `server/v300.js`, `server/v313.js`, `server/v319.js` — actual reference issuers routed through the central service.
- `public/v319-client.js` — dedicated Numbering & References renderer hook.
- `public/index.html` — V30.24.3 cache identity and final overlay order.
- `qa/qa_current.js` — inherited + V30.24.3 source/regression QA.
- `qa/runtime_smoke.js` — V30.24.3 health identity.
- `V30_24_3_IMPLEMENTATION_SUMMARY.md` and `docs/qa/V30_24_3_QA_REPORT.md` — implementation and QA documentation.

## Package exclusions

The local-test ZIP excludes runtime databases, `.env`, secrets, `node_modules`, uploaded business files, caches and temporary files.

## Git-ready Render persistent-storage packaging

This V30.24.3 Git-ready variant adds deployment/runtime storage hardening without changing the functional application version: Render defaults to `/var/data/data` for SQLite/backups and `/var/data/uploads` for attachments/PDFs, includes persistent-disk preflight/health checks, graceful SQLite shutdown, migration/check helpers, and Render deployment documentation. Runtime data, uploads, secrets, `.env`, `node_modules` and databases are excluded from Git.
