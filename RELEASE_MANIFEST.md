# Blue Ocean Market Release Manifest

- Release: **V30.43.0 — Workflow Context, Buyer Sender Accounts & Accounting Statements**
- Direct baseline: **V30.42.0 — Actionable Tasks & Smart Access Control**
- Protected lineage: **V30.39.2 performance/data-path + V30.40–V30.42 access/task/Finance correction safeguards retained**
- Release type: **QA workflow refinements + optional buyer sender accounts + Accounting account drill-down/statements/transfers**
- Destructive migration/reset: **None**
- Database changes: **additive `excavator_buyer_payments.buyer_sender_account_id` + `accounting_account_transfers_v343` table/indexes**
- Existing users/profiles/groups/policies/approval/task configuration: **Preserved / compatible**
- Existing SQLite data/uploads/evidence/backups/Render persistent disk: **Preserved / compatible**
- Live browser delivery: **7 scripts (`i18n-ko.js`, `client.js`, `runtime-v30392.js`, `v340-client.js`, `v341-client.js`, `v342-client.js`, `v343-client.js`)**
- Precompressed V30.43 browser asset: **`public/v343-client.js.gz` included**
- Implementation summary: `V30_43_IMPLEMENTATION_SUMMARY.md`
- QA status: `V30_43_QA_STATUS.md`
- Dedicated V30.43 QA: `npm run qa:v343` — **PASS in build environment**
- Current/inherited regression QA: `npm run qa:current` — **PASS in build environment**
- Render persistence QA: `npm run qa:render` — **PASS in build environment**
- Dependency-backed runtime suites: **packaged; run after `npm ci` in a normal Node 22 environment**

## V30.43 acceptance focus
- Supplier Available Machines and Buyer Payments refresh immediately after successful child mutations.
- Refreshing a Supplier/Buyer/Machine/etc. child workflow restores the same child context instead of returning to the parent list.
- Untouched/unverified Finance-linked machine costs remain directly editable; Finance action/Accounting posting locks normal Edit.
- Purchase does not expose duplicate Edit in Costs; Sold / Completed Purchase is locked in UI and backend.
- Sold-machine document Delete / Archive is CEO / Owner-only in UI and backend.
- Buyer Sending Account is optional, reusable and separate from the company Receive Into account.
- Accounting company financial accounts open to balance/statement detail.
- Account statement supports selected period, opening/in/out/running/closing balances and authenticated PDF download.
- Same-BU account transfer creates balanced Accounting entries; cross-BU uses the established Inter-BU workflow.
- V30.42 actionable Tasks, Finance correction task chain, notification deep-links, CEO Full System Access and smart permission evolution remain active.

## Deployment note
Do not reset the database or persistent disk. Deploy normally and let additive schema initialization run on startup. Verify `/api/health` reports `30.43.0`. Run dependency-backed runtime/API gates after `npm ci` before production promotion.
