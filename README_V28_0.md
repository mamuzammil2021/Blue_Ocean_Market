# Blue Ocean Market V28.0.0

V28.0.0 completes the requested mobile, Buyer Requirement, payment-evidence and Finance-correction work while keeping Korean as the primary/default language and English as the complete secondary language.

## What changed

- Mobile navigation is now an off-canvas sidebar with overlay, close control and automatic closing after navigation.
- Dashboards, cards, forms, tables, headers, notifications, confirmations and dialogs adapt to tablet and phone widths.
- Buyer Requirements use structured supplier-machine fields and support View, Edit, Delete and live matching against available supplier machines.
- Successful form submissions clear dirty state before closing, eliminating false “Unsaved changes” warnings after saves.
- Every payment-related Excavator entry requires a receipt or evidence on both the client and server.
- Evidence is stored with the related Excavator/Buyer documents and linked Finance entry.
- Finance corrections are assigned to the original record creator with reason, requested changes, status, due date, evidence, response and history.
- Assigned users can view, correct, upload evidence and resubmit their records; Finance can verify or return them again.
- People & Performance includes correction volume, open/overdue work, response time and resubmission metrics.
- New V28 screens, validation messages, errors and dynamic labels are included in the Korean runtime catalog.

## Compatibility and deployment

- Node.js: 22.x
- Database: SQLite through `better-sqlite3`
- Start: `npm start`
- Health check: `/api/health` → `28.0.0`
- Docker: `node:22-bookworm-slim`

Do not commit `.env`, `node_modules`, SQLite database files or runtime uploads. On Render, use a persistent disk for `data/` and `uploads/` before storing meaningful test or production records.

## Verification

```bash
npm ci
npm run qa:current
npm start
# In another terminal:
npm run qa:v28:runtime
```

The runtime QA creates disposable QA records. Run it only against a local or dedicated test database, never against production data.
