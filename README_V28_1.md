# Blue Ocean Market V28.1.0

V28.1.0 is the Git/Render-ready action, matching and Finance-control release. It keeps Korean as the primary/default language and English as the complete secondary language.

## What changed

- The desktop sidebar is fixed while the page content scrolls independently. The sidebar has its own scroll area and automatically keeps the selected module visible.
- Mobile navigation remains an off-canvas drawer, with responsive cards, tables, forms and dialogs.
- Clicking the currently selected module refreshes its data. Successful create, update and delete actions also refresh the active screen and action counters.
- Finance, Tasks, Buyer Requirements and other action-oriented sidebar items show a counter only when the signed-in user has pending work; zero badges are hidden.
- Buyer and Supplier Requirements now share the same structured fields: machine name/type, make, model, minimum/maximum year, condition, minimum/maximum budget, quantity, action type and exchange-machine details.
- Matching uses machine identity and commercial criteria, never location. Exact and close matches include a score and field-by-field reasons, are stored without duplicates and notify the relevant users automatically.
- Matches can be reserved, dismissed or used to create an exchange proposal with offered/requested values and the calculated balance.
- Every payment-related Excavator entry requires receipt/evidence on both the client and server.
- Finance data is creator-scoped for regular users. CEO and authorized Finance reviewers can see all Finance data within their permitted business-unit scope.
- A correction request is assigned to the original record creator. Only that creator can edit all applicable source-specific fields and resubmit the record; the linked source and Finance record update together.
- Correction detail includes the original snapshot, current data, changed fields, full history, reminders, linked task and evidence. Verification resolves the task; correction activity is included in People & Performance.
- All new visible system text, validation messages, API errors, notifications and workflow states have Korean and English coverage.

## Compatibility

- Node.js: `22.x`
- Database: SQLite through `better-sqlite3` `13.0.3`
- Start command: `npm start`
- Health check: `/api/health` → `28.1.0`
- Docker base: `node:22-bookworm-slim`

## Local verification

```bash
npm ci --omit=dev
npm run qa:current
npm run qa:v281:runtime
npm start
```

`qa:v281:runtime` is self-contained: it starts a temporary server, uses an isolated temporary database/uploads directory, runs the complete API workflow and removes its test data.

## Render persistence

Mount a Render persistent disk at `/var/data` and set:

```text
DATA_DIR=/var/data/data
UPLOAD_DIR=/var/data/uploads
```

Also configure a `JWT_SECRET` of at least 32 characters, `ADMIN_EMAIL` and an `ADMIN_PASSWORD` of at least 12 characters. No administrator credentials are published or prefilled. Back up the existing SQLite database (including WAL/SHM files when present) and uploads before an upgrade. The application applies additive migrations and preserves historical/custom business units on startup.

See `GIT_RELEASE_CHECKLIST_V28_1.md` for the complete branch, push, deploy and live-acceptance sequence.
