# Blue Ocean Market OS — V28.0.0 Release Manifest

## Release identity

- Version: `28.0.0`
- Runtime: Node.js `22.x`
- Start command: `npm start`
- Health check: `/api/health`
- Primary language: Korean
- Secondary language: English

## Included V28 work

- Korean-first interface coverage for static, generated and server-returned system text.
- Responsive mobile layout with an off-canvas, scrollable sidebar.
- Structured Buyer Requirements with view, edit, delete and supplier-machine matching.
- Shared form-save handling that prevents false unsaved-change warnings after successful saves.
- Mandatory receipt/evidence validation for monetary Excavator entries, enforced by both the browser and server.
- Evidence storage in Excavator documents and linked Finance entries.
- Finance correction requests, assigned-user notifications, response evidence, resubmission and review history.
- Finance correction activity in People & Performance metrics.
- Database migration that preserves existing installations while adding the V28 fields and tables.

## Validation completed

- JavaScript syntax checks for the server, database, browser client and runtime QA.
- Current static regression gate.
- V28 feature-source gate.
- Korean-first catalog and runtime-translation gates.
- Supplier-machine regression gate.
- Live API/database flow for requirements, evidence, Finance corrections and performance metrics.
- Clean dependency installation from `package-lock.json` using Node.js 22.

## Deliberately excluded from the release archive

- `node_modules/`
- Local SQLite databases and journal files under `data/`
- Runtime uploads under `uploads/`
- `.env` and credentials
- Git metadata

See `GIT_RELEASE_CHECKLIST_V28_0.md` for Git and Render deployment steps. Back up the live database and uploads before deploying over an existing Render service.
