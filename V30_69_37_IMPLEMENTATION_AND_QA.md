# Blue Ocean Market V30.69.37 — Packaging Materials refinement

## Delivered result

Implemented the requested UI/workflow corrections on the latest verified **V30.69.36** complete source. Materials, Purchases and Stock & Usage remain separate sidebar destinations. No additional supplier, payment, stock or accounting system was introduced.

The supplied four screenshots were opened and inspected. They confirmed stretched toolbar actions and a generic full-width input rule affecting the Receive All checkbox. Both layout causes are fixed with scoped Imports-style controls and explicit checkbox sizing.

## Baseline and isolation

- Baseline ZIP: `Blue_Ocean_Market_V30_69_36_SIMPLE_PACKAGING_MATERIALS_GIT_READY.zip`.
- SHA256: `81e756ab2870d5d2da99d9512f5a7e5926859836384005de99e6fa911daa481c`.
- Baseline source commit: `9b69f38`; working tree was clean before creating the isolated worktree.
- Feature branch: `feature/v30.69.37-packaging-ui`.
- The original .36 source/ZIP is preserved. No remote branch, main branch or Render service was modified. The original ZIP has no remote Git metadata; no remote state is claimed.

## Changes

| Area | Implemented correction |
| --- | --- |
| Toolbars | Compact aligned search/filter/action rows using the shared Imports filter, button, card, table and pager conventions. Desktop input/Search/primary actions measured 38px high, aligned on the same baseline. Mobile toolbars wrap without document overflow. |
| KPI cards | Compact clickable cards with live counts, without a separate oversized number button inside each card. |
| Material rows | Visible Open, Edit, Archive/Activate, and Delete only for unused materials. Archive/reactivation/deletion refresh the current list. The backend remains authoritative for deletion restrictions. |
| Purchase rows | Supplier/reference/date; total, paid and outstanding in invoice currency; Not/Partially/Fully Received; Unpaid/Partially Paid/Paid; quantities or completed-line counts; Finance verification pending and Accounting status when relevant. Cancelled purchases show zero still due. |
| Purchase actions | Visible Open, Edit, Receive, Payments, History and Cancel/Close where the current record and permissions allow them. Receive opens the correctly routed purchase receiving section and its dialog. |
| Normal creation | One Review & Confirm creates and confirms a normal purchase. No second purchase-confirmation screen/action is required. Save as Draft remains optional. |
| Approval display | Ordinary confirmed purchases display Confirmed. Approval information/links appear when an actual approval record exists. Explicit configured rules, thresholds and exceptional financial controls remain enforced. Direct CEO authorization links are retained correctly too. |
| Receiving dialog | Checkbox and label are adjacent on a single row; checkbox measured 18×18px, 8px gap, zero vertical offset. Clear Ordered/Already Received/Remaining/Accepted/Rejected columns, accessible quantity labels, compact fields, bounded dialog width and sticky footer. |
| Receive All | Fills only remaining accepted quantities and clears rejected inputs. Manual partial receipts and unpaid/partly paid receiving continue to work. |
| Bilingual/routes | New labels have Korean text; existing deep links, selected purchase sections, Back/refresh and targeted updates are retained. |

## Backend and shared-platform integration

The material page API now supplies a history-dependency flag for safe row actions. The paged purchase API derives summaries from the authoritative purchase lines, receipts, shared supplier allocations, FX transactions, Finance and Accounting records. Default server paging remains 25. No cached stock, payment or outstanding balances are created.

The existing purchase creation API accepts an optional boolean `confirm_purchase`. The new UI sends it for normal creation. Creation/confirmation runs in the existing idempotent database transaction and existing authorization service; an error/required CEO confirmation rolls back the incomplete operation. Draft callers and existing submit routes remain compatible. No historical drafts are automatically changed on startup.

The established platform entity and route registries, Imports filters/pager, shared modal/Review & Confirm/processing lock and central supplier/payment/Finance/Accounting services remain in use. The new scoped stylesheet is included in the existing exact-hash frontend integrity check, whose allowed manifest extensions now include CSS.

Purchase confirmation still follows the established Imports commitment policy through the existing Accounting service. It does not create a cash payment or usable stock. Receipts and payments stay independent. No shared payment calculations, company account currency handling, supplier statements or Posting Control rules were replaced.

## Data protection and upgrade

No new schema migration is required for .37. Existing .36 migrations remain retry-safe. No existing materials, purchases, receipts, payments, supplier identities, stock movements, approvals or postings are rewritten merely to display list information.

The upgrade test starts the **original .36 application**, creates a purchase with partial accepted/rejected receiving and a cash settlement, then starts .37 twice on that same database. All fields in 12 protected tables, existing approval rules, stock/payment balances and foreign keys reconcile. The list correctly derives Partially Received / Partially Paid / KRW 900 outstanding from the retained records.

## Executed QA

All tests ran against the application's actual server and authenticated services, using isolated SQLite fixture databases. No production data was used.

| Suite | Result | Evidence |
| --- | --- | --- |
| New refinement API | PASS — 8 groups | `qa/evidence/36937-refinement-api.json` |
| New refinement browser | PASS — 8 groups | `qa/evidence/36937-refinement-browser.json` |
| Existing packaging API | PASS — 25 groups | `qa/evidence/36937-core-api.json` |
| Existing packaging browser workflow, using its explicit draft/approval path | PASS — 16 groups | `qa/evidence/36937-workflow-browser.json` |
| .36 → .37 upgrade and repeated startup | PASS — 3 groups, 12 complete tables compared | `qa/evidence/36937-upgrade.json` |
| Protected regressions | PASS — 19 suites / 282 PASS log entries | `qa/evidence/36937-regressions.json` |

The new API tests cover history flags, one-step normal confirmation without an approval record, no purchase-created stock, live partial/full receiving/payment summaries, independent Finance verification status, optional drafts, pagination, cancellation balances, and explicit configured authorization.

The new browser tests measure control dimensions and checkbox alignment, exercise material archive/reactivation and unused deletion, create a normal purchase through one review, check visible row actions/statuses, receive an unpaid purchase partially through its list action, protect used material deletion, and check Korean/mobile rendering at 390px. No uncaught browser JavaScript errors occurred.

Existing packaging checks cover multi-line conversions/totals, eligibility, duplicate submission/reference controls, partial/full/rejected receiving, returns, historical snapshots, source account currencies, advance/new/both, cash, KRW/USD/PKR, final FX rounding, supplier statements, financial authorization/verification/posting and native Production costing/lot links.

Protected suites cover Excavator, Imports, central suppliers/accounts/advances/statements, shared payments/rates/references/recipients/corrections, Finance approval before verification, Posting Control, notifications/important-email promotion, authentication/permissions, static assets and runtime smoke. The regression JSON records every suite.

## Re-running

Use Node 22 and the existing locked dependencies (`npm ci`).

```bash
npm run qa:release
npm run qa:packaging:refinement
```

For browser and original-baseline upgrade checks, use the commands in `V30_69_37_DEPLOYMENT_NOTES.md`. The .36 browser test is intentionally retained as a draft/approval regression; the new .37 browser test verifies the simplified normal creation path.

## Limitations and deployment

This build is ready for Render **testing/staging review**, not a claim of live production acceptance. No live deployment, production database reconciliation or external SMTP delivery was performed. Tests used Node 22.23.3 and Chromium 153.0.8010.0 with the installed project dependencies; a fresh Docker/network dependency build was not run here. PDF regressions used the previously verified Playwright Chromium print adapter. Korean text assertions passed, but final CJK glyph appearance needs the deployed-browser check because this QA host lacks CJK fonts; the existing Dockerfile includes them.

Back up the actual database and uploads before upgrade. Keep the persistent disk, data paths, secrets and existing environment configuration. Follow `V30_69_37_DEPLOYMENT_NOTES.md` for reconciliation and rollback. Do not reset production data.

The ZIP is the complete application source. It includes QA evidence, tests, Git instructions, deployment notes and a reviewable delta patch from .36. Dependencies, databases, uploads, private screenshots and secrets are excluded.
