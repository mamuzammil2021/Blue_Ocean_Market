# Blue Ocean Market V26.5.0 — Dependency & Inspection Check

## Dependency changes
- No new npm packages added.
- Existing runtime dependencies retained: express 5.1.x, better-sqlite3 11.10.x, bcryptjs 2.4.x, jsonwebtoken 9.0.x, multer 2.0.x.
- package.json version updated to 26.5.0.

## Static inspection
- `node --check server/server.js` — PASS
- `node --check server/db.js` — PASS
- `node --check public/client.js` — PASS
- `node qa/static-check.js` — PASS
- `node qa/qa_v265_excavator_finance_ui.js` — PASS

## UI inspection
- Business-unit switching opens Dashboard.
- Foldable left navigation with icons added.
- Excavator navigation order preserved with separator before general modules.
- Excavator Machines / Deals payment-status line removed; realized profit/loss shown only for sold machines.
- Notifications include actionable navigation where a record is available.

## Backend inspection
- Business-unit scoping reviewed for dashboard and notifications.
- Excavator payments/costs linked to Finance through source_type/source_id.
- Historical Excavator finance backfill added at startup for existing records.
- Payment/cost voids require a reason and preserve audit/Finance history.
- Buyer payment voids no longer count toward active buyer balance/advance.
- Finance traceability columns added through migrations.

## Runtime note
The build environment used for this package did not contain `node_modules`, and installing dependencies was unavailable within the build environment. Therefore the application was syntax/static inspected but not started against a live SQLite database in this environment. The package intentionally adds no new dependencies.
