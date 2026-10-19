# Blue Ocean Market V30.69.36 — implementation and verification

## Result and scope

The simplified Packaging Materials workflow is implemented on the explicitly selected **V30.69.33** baseline. The source is ready for Render **testing/staging acceptance**. It has not been deployed or connected to your production database.

The final scope follows your later instructions: use Imports patterns, keep the interface simple, keep suppliers/payments central, allow multiple material lines per supplier purchase, support partial receipts, and never require full payment before receiving. This build does not introduce a supplier master, payment engine, approval engine, inventory engine or Accounting ledger alongside the existing ones.

## Protected baseline

| Item | Verified value |
| --- | --- |
| Source | `Blue_Ocean_Market_V30_69_33_PAYMENT_SETTLEMENT_APPROVALS_GIT_READY.zip` |
| SHA256 | `a15de0392ca38fe0f920796453e48dccc4781c77cfe8fb37b0d9e8e17d6fa0c3` |
| Version read from source | `30.69.33` |
| Protected local snapshot | `protected-baseline/v30.69.33`, commit `c1138fc` |
| Isolated implementation branch | `feature/v30.69.36-simple-packaging-from-33` |
| Original remote branch/status | Not available in the ZIP; no remote checkout was claimed or modified |

The original extracted source was committed unchanged before implementation. Work was isolated on a feature branch; `main` was not modified. Later experimental .34/.35 source trees were not used as the application baseline. Existing modules remain in the full source delivery.

## Implemented screens and workflow

| Screen | Implemented behavior |
| --- | --- |
| Sidebar | Foldable Packaging Materials group containing Materials, Purchases, Stock & Usage; three separate routes and no repeated primary tabs across the content area |
| Materials | Bilingual material names, unique code/specification checks, category/specification/size, base and purchase units/conversions, reorder level, supplier references/quotes, optional image, edit/archive, unused-only deletion and audit history |
| Purchases | Search/status filter, server paging default 25, New Purchase, Open/Edit; one active eligible existing supplier and multiple material lines; quantity/unit/price, optional discounts/taxes/expenses and exact totals |
| Purchase details | Full-screen Overview, Receiving, Payments, History; supplier link, material snapshots, attachments, allowed actions and approval links |
| Receiving | Independent dated receipts and warehouse, accepted/rejected quantities, optional evidence, full/partial receipts and Receive All Now for only the outstanding quantity |
| Payments | Existing shared advance-only/new-payment/both form, existing beneficiary/company accounts, actual debit currency, evidence, approvals, Finance verification and Posting Control |
| Stock & Usage | Existing movement ledger, location quantities, available/quarantined stock, reorder information, movement/source details and reasoned adjustments/transfers; link to existing Production |
| Central Suppliers | Packaging purchase obligations, Pay Outstanding, purchase links, bank payment/advance allocation history, documents, audit and statement integration |

The ordinary purchase form presents the supplier and material lines first. Extra commercial details, discounts/taxes, expenses and material supplier/unit references are optional/collapsible. No separate invoice-recognition administration screen, receiving-policy setup, reservation workspace or third-party cost management screen was added.

Typical process: create materials → create purchase → confirm/obtain approval when required → pay through the shared engine → receive in one or several parts. Receiving also works when the purchase is unpaid or partly paid.

Purchase approval, payments and physical receipt are separate events. A purchase or payment does not increase physical stock. Only confirmed accepted receipt quantities enter usable inventory. Rejected items remain outside usable stock; receipt-linked returns for replacement preserve history and reopen the replacement balance.

Draft quantities/prices can be edited. Confirmed purchases permit safe header/detail edits. An unreceived, unsettled purchase can return to Draft for amendment with Accounting reversal history. Received/settled transactions retain their financial and stock snapshots; their related controls remain accessible from the detail page. Posted financial reversals use the existing authorization controls.

## Existing architecture reused

- Imports' full-screen detail conventions, cards/tables/action rows, standard dialogs, sticky footers, Review & Confirm and root processing lock.
- Central supplier categories and beneficiary accounts. One supplier may be eligible for both Imports and Packaging Materials. New purchase eligibility is enforced in the backend and selectors; old supplier references remain usable after archival/reclassification.
- `pink-fx-engine` and its shared calculation/UI, supplier advances/allocation tables, company payment accounts, immutable transactions, duplicate-reference checks, corrections/reversals, Finance and Accounting posting controls.
- Shared L0–L5 configurable approval rules, assigned review tasks, notifications and important-only email policy. Small purchases/payments do not acquire an unconditional extra approval step. The initial packaging purchase threshold reuses the unit's existing purchase authorization threshold and remains configurable.
- Existing `pink_salt_packaging_items`, `pink_salt_packaging_movements`, product BOM, production consumption/costing and finished-lot service. Production consumes the same ledger only on actual confirmation. Warehouse consumption is allocated to the available locations without creating negative location balances.
- Existing route registry/controller, permission checks, attachment viewer, audit and EN/KR infrastructure.

New files primarily implement packaging purchase/receipt documents, their API/UI, fixed-scale line calculations, additive schema setup, reconciliation/backup helpers and QA. They do not replace shared financial infrastructure.

## Financial and inventory treatment

The implementation follows the source application's Imports commitment policy: confirmation records the supplier obligation and goods awaiting receipt through the existing Accounting service, without creating a Finance cash record. Physical receipt moves the accepted acquisition value from in-transit to packaging inventory. Accounting proposals remain subject to existing Posting Control.

Purchase-level costs explicitly distinguish acquisition costs, recoverable tax and operating expenses. Recoverable tax requires an existing appropriate tax account. Quantities use four-decimal input precision; financial totals use fixed-scale, half-up calculations and the existing two-decimal settlement convention. Final receipt costing takes the remaining allocation to avoid rounding drift. Receipt costs update the existing material costing field used by Production.

Verified examples executed against the real application:

- Two-material USD purchase: **USD 70.90**, recognition rate **1 USD = KRW 1,300**; discounts, tax and capitalizable/operating extras calculated in the backend.
- Receive **600 + 400 = 1,000** base units in two durable receipt records, before payment; rejected stock excluded. Over-receipt and multi-line failure roll back atomically.
- USD bank payment: actual **USD 10** debit, **KRW 14,000** bank valuation, **KRW 13,000** invoice carrying settlement. Payment does not change stock.
- Advance-only allocation uses the central ledger and creates **zero** additional Finance debits.
- Combined allocation plus PKR bank transfer preserves the actual **PKR 280** debit and the separate **KRW 2,000** non-cash allocation.
- Final USD settlement after a KRW advance can leave a sub-cent invoice rounding difference. A tested **KRW 6** residual is explicitly disclosed in review/accounting details, retained in the immutable valuation snapshot and handled through the existing FX proposal, preserving the exact USD bank debit. Approval, Finance verification, balanced posting and supplier reconciliation all passed. The bounded rounding behavior applies only to the new packaging purchase workflow.
- Supplier statement closing balance equals the central supplier net balance; new bank payments and non-cash allocations appear once in their respective histories.
- Native Production consumes five packaging units at the recorded **KRW 0.05** unit cost, links the batch and finished lot, and retains non-negative warehouse balances.

## Data migration

The upgrade is incremental and transaction-protected. It extends existing materials/movements, adds purchase/receipt/history/operation tables, and extends the existing supplier packaging allocation ledger to reference either a legacy movement or a new purchase. Existing IDs and indexes are retained.

Legacy purchase/receipt records remain visible and payable through the original shared engine. No historical receipts, opening movements, Finance records or accounting postings are manufactured. No existing stock is received a second time.

The upgrade test starts the **original V30.69.33 application**, creates representative legacy supplier/stock/allocation records and a verified/posted USD payment, then starts the new application on that same database twice. It compares original field values across 14 protected tables, stock, supplier balances, statement totals and foreign keys. All comparisons passed. Backup and read-only reconciliation tools were executed as part of this test.

See `V30_69_36_DEPLOYMENT_AND_MIGRATION.md` for backup commands, migration/startup, acceptance reconciliation and rollback rules.

## QA evidence

All results below were actually executed on disposable SQLite databases using the project's application server, authentication and existing services. No production data was used.

| Check | Result | Evidence |
| --- | --- | --- |
| Packaging API/business workflows | PASS — 25 check groups | `qa/evidence/36936-packaging-server.json` |
| Authenticated Chromium workflows | PASS — 16 check groups, zero uncaught JS errors | `qa/evidence/36936-packaging-browser.json` |
| Original .33 → .36 upgrade, backup/reconciliation and restart | PASS — 4 check groups | `qa/evidence/36936-upgrade.json` |
| Protected regressions | PASS — 19 suites, 282 PASS log entries | `qa/evidence/36936-regressions.json` |
| Release gate | PASS — exact asset manifest, changed-source syntax, packaging API suite and protected regression suites | `qa/qa_v36936_release_gate.js` |

API checks include catalog conversions/duplicates/multi-supplier mapping/archive/deletion restrictions/snapshots; multi-line totals and eligibility; idempotent retries; receipts/rejections/returns/atomic rollback; new/advance/both and cash/KRW/USD/PKR settlement; prepaid and partially paid receiving; full settlement; supplier reconciliation; safe amendments/cancellation; wrong-unit/unauthenticated rejection; and a configured independent L4 approval with a full task snapshot and delayed source execution.

Browser checks include real material creation, Review & Confirm/root overlay/navigation lock, purchase creation/CEO authorization, deep-route refresh and Back, unpaid partial receiving then Receive All Now for the remainder, central advance allocation without another Finance debit, Supplier Pay Outstanding and purchase return links, actual native production/cost/lot behavior, 1360px/390px views, and Korean purchase text/actions.

The 19 regression suites cover shared rate/reference/recipient controls, supplier accounts/advances/statements, import settlements and costs, Finance authorization/verification/corrections, posting, notifications and important-email deduplication, auth/permissions, Excavator payment behavior, static assets and runtime smoke. The exact suite list and results are recorded in the regression JSON.

## Defects corrected during verification

- Missing purchase-form date helper.
- Packaging obligations being routed to Import or legacy material allocation actions in central supplier screens.
- Packaging direct payments missing from central supplier payment history and legacy-only supplier summary totals.
- Purchase receipt refresh using a navigation wrapper, which could remount the page or close a quickly reopened receipt form. Same-record refresh now uses the original renderer and updates affected purchase sections in place.
- Production consuming packaging without warehouse attribution and finished lots being created only on a later read. The existing stock/lot services now run at confirmation.
- Archived/ineligible supplier selection and loss of history-tab access after supplier reclassification.
- Final foreign settlement rounding after a KRW advance, without changing protected Import/Excavator calculations.

## Re-running QA

Use Node 22 and `npm ci`:

```bash
npm run qa:release
npm run qa:packaging
```

Browser QA requires Playwright plus a Chromium executable available in the QA environment:

```bash
npm install --no-save --package-lock=false playwright
BOM_CHROMIUM=/absolute/path/to/chromium npm run qa:packaging:browser
```

Original-baseline upgrade QA can use a separately extracted protected .33 source folder:

```bash
BOM_BASELINE_DIR=/absolute/path/to/Blue_Ocean_Market_V30_69_33 \
  npm run qa:packaging:upgrade
```

The upgrade test also supports the local baseline commit when it exists. It never migrates the production service database. PDF regression checks require the configured Chromium PDF runtime (`CHROME_PATH`).

## Practical limits and remaining acceptance

- No authorized Render service/session or production database was available. Live deployment, production-data reconciliation, real company bank/beneficiary configuration and business-user acceptance remain to be performed on staging.
- Live SMTP delivery was not sent. The existing important-email pipeline was exercised with an isolated delivery spy; actual service email delivery still needs its normal environment check.
- The full Docker image and a fresh network dependency install were not built here. Application tests ran with Node **22.23.3** and the installed project dependencies. Chromium **153.0.8010.0** executed the browser workflows. PDF checks used a Playwright Chromium print adapter because the host's direct Chrome CLI was unsuitable; verify the existing Docker PDF runtime on Render.
- EN/KR text assertions and responsive layout passed. This host lacks CJK fonts, so Korean glyph appearance requires the Render/browser acceptance check; the existing Dockerfile includes CJK fonts.
- No new reservation, standalone supplier/finance ledger, credit-note administration or late third-party costing workflow was added. Existing production recipes and correction/posting services remain authoritative. These are scope choices from the simplified workflow, not hidden additional screens.

No tests are claimed as live production acceptance. No Git branch was pushed, `main` merged, Render disk reset or production deployment performed.

## Delivery contents

The ZIP contains the complete source, lockfile, additive migration, executed QA evidence, tests, backup/reconciliation utilities, this report, deployment/migration instructions and your requested Mac new-branch steps. It excludes dependencies, credentials, production data, uploads, databases and internal screenshots.

`V30_69_36_FROM_V30_69_33.patch` contains the feature changes for applying/reviewing on a different checkout. Use the patch alternative if current `main` has development beyond the protected .33 snapshot; do not overwrite unrelated newer work.
