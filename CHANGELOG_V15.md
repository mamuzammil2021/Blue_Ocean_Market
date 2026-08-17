# Blue Ocean Market V15 — Rebuild

## Important correction
V14 was inspected and was not accepted as a faithful implementation of the recorded requirements. V15 restructures the UI/workflow instead of treating the Excavator unit as a simple asset register.

## Dashboard architecture
- Exactly one dashboard is rendered for the selected business-unit workspace.
- CEO All Business Units renders only the consolidated CEO dashboard.
- Selecting MIMI renders the MIMI dashboard; selecting Excavator renders the Excavator dashboard; Mango/Seasonal and Pink Salt use their scoped dashboards.
- MIMI POS and Restaurant Tables are operational modules, not additional dashboards.

## MIMI
- Restaurant Tables is a dedicated navigation area.
- Add/Edit/Delete Table controls are in Restaurant Tables, not Open POS.
- POS continues to use tables for dine-in without table-management controls.

## Excavator
- One Excavator Dashboard plus an Excavator Operations module.
- Persistent machine/deal records designed for pause/resume across a long lifecycle.
- Separate transaction records for purchase, logistics, repair, parts, other direct costs, local sale, export sale and payments.
- Transaction edit and auditable void rather than destructive financial deletion.
- Local Sale and Export Preparation are distinct lifecycle stages.
- Machine-level direct cost and gross margin are derived from applicable transaction records.
- Machine-specific parts and independent parts inventory are supported.
- Multiple document uploads per lifecycle stage; optional transaction association.
- KRW is the current base currency; future currencies/accounting rules remain extensible and are not forced into this version.

## Validation
- Node syntax checks passed for server.js, db.js and client.js.
- Existing static QA passed.
- New V15 rebuild QA passed.
- Live dependency installation/browser/database integration could not be completed in this environment because npm dependency installation timed out.
