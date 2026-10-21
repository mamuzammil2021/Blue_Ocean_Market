# UI audit and screen inventory — V30.69.40

## Baseline and evidence

Both complete 15-section instructions were read. Library verification found V30.69.39 as the newest available protected source; no older fallback was used. Both ZIPs passed CRC checks, and input hashes are in RELEASE_MANIFEST.md. Baseline source snapshots and original input ZIPs were kept separate from the feature workspace.

Entry points: server/server.js, scripts/start-server.js, public/index.html, public/client.js and runtime-v30392.js. Existing route ownership: route-registry.js + v3693-persistent-routing.js. Inventory: **113 baseline frontend assets; 57 entry scripts; 12 inline head style blocks; 1,417 inline style attributes**. The full asset/function/API-fragment inventory is in docs/ui-modernization/BASELINE_ASSET_INVENTORY.json. Runtime-injected styles and dynamically loaded scripts remain significant compatibility dependencies.

Verified layout findings: oversized/uneven controls, truncated long sidebar labels, mixed panel radii/shadows, scattered module-specific density values, hidden/scrolled table actions, and modal/control style collisions. The shared adapter addresses shell/typography/density/action-table treatment. Existing domain mobile cards, purchase receiving, full-page cart, product family/lot and production routes were preserved. Broad deletion of old scripts was rejected as unproven.

Coverage terms: **shared migration** means a renderer uses the scoped Tabler and application adapter; it does not mean its business logic was rewritten. **Swept** means authenticated render, correct view/language, page-error and document-overflow checks with a screenshot; it does not imply every state, permission or action was tested. Manually inspected representative screenshots are identified in the QA report. No exhaustive pixel-by-pixel review is claimed.

## Primary views

Every row below has a shared visual migration and six authenticated sweep captures: 1440/820/390px × EN/KR. All 34 views rendered the expected view/language, with no uncaught page errors or document overflow. Main entry dispatch is the existing loadView/extension chain; exact asset dependencies are retained in the asset inventory. All Units and unit-specific dashboards remain the original operational views.

| View | Permission module / preserved server authorization | CSS owner / pattern | Status |
| --- | --- | --- | --- |
| `dashboard` | `dashboard` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `businesses` | `businesses` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `sales` | `sales` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `purchases` | `purchases` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `inventory` | `inventory` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `finance` | `finance` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `approvals` | `approvals` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `tasks` | `tasks` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `performance` | `performance` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `reports` | `reports` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `documents` | `documents` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `meetings` | `meetings` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `restaurantTables` | `restaurant` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `restaurant` | `restaurant` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `excavator` | `excavator` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `excavatorSuppliers` | `excavator` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `excavatorBuyers` | `excavator` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `notifications` | `notifications` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `users` | `users` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `profile` | `profile` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `audit` | `audit` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `systemSettings` | `systemSettings` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `accounting` | `accounting` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `payroll` | `payroll` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `psSuppliers` | `purchases` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `psImports` | `purchases` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `psRawStock` | `inventory` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `psProduction` | `inventory` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `psFinished` | `inventory` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `psPackaging` | `inventory` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `psSales` | `sales` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `psCustomers` | `sales` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `psWaste` | `inventory` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |
| `psCommerce` | `sales` | Shared shell, scoped Tabler, application adapter; domain styles retained | Migrated; primary sweep passed |

## Registered record patterns

The runtime registry contains 59 patterns, including routed Accounting journal/posting details. This table is exhaustive for that observed registry. Full renderer-owner matches, CSS owners, API fragments, localization and risk are in ROUTE_MIGRATION_INVENTORY.json. `open` targets below are the original renderer interfaces; they were not renamed. A static owner match may include wrappers and source fragments as well as the active bundle. Server role/BU gates remain authoritative.

| Route pattern | Original renderer target(s) | Sections | Risk | Detailed browser status |
| --- | --- | --- | --- | --- |
| `#restaurant/menu` | `restaurantMenu` | Default / renderer-controlled | Medium | Swept across 3 widths × EN/KR |
| `#restaurant/stock` | `restaurantStock` | Default / renderer-controlled | Medium | Swept across 3 widths × EN/KR |
| `#restaurant/weekly` | `restaurantWeekly` | Default / renderer-controlled | Medium | Swept across 3 widths × EN/KR |
| `#restaurant/buffet` | `restaurantBuffet` | Default / renderer-controlled | Medium | Swept across 3 widths × EN/KR |
| `#restaurant/open-orders` | `restaurantOpenOrders` | Default / renderer-controlled | Medium | Swept across 3 widths × EN/KR |
| `#excavator/machine/{id}` | `excavatorOpenMachine` | Default / renderer-controlled | Medium | Representative default/status sweep passed |
| `#excavatorSuppliers/supplier/{id}` | `BOMProfileRoutes337.supplier` | overview, machines, requirements, payments, accounts | Medium | Representative default/status sweep passed |
| `#excavatorBuyers/buyer/{id}` | `BOMProfileRoutes337.buyer` | payments, refunds, machines, requirements, documents, accounts | Medium | Representative default/status sweep passed |
| `#excavatorBuyers/pakistan/{id}` | `openPakistanResalesV327` | overview, records, payments, credit, refunds, transfers, documents | Medium | Representative default/status sweep passed |
| `#psSuppliers/supplier/{id}` | `psSupplierAccount315` | overview, account, payments, accounts, imports, packaging, documents, history | High | Swept across 3 widths × EN/KR |
| `#psPackaging` | `psPackHome` | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#psPackaging/materials` | `psPackHome` | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#psPackaging/purchases` | `psPackHome` | Default / renderer-controlled | High | Swept across 3 widths × EN/KR |
| `#psPackaging/stock` | `psPackHome` | Default / renderer-controlled | High | Swept across 3 widths × EN/KR |
| `#psPackaging/new` | `psPackNewPurchase` | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#psPackaging/edit/{id}` | `psPackEditPurchase` | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#psPackaging/material/{id}` | `psPackMaterial` | Default / renderer-controlled | High | Swept across 3 widths × EN/KR |
| `#psPackaging/legacy/{id}` | `psPackLegacy` | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#psPackaging/movement/{id}` | `psPackMovement` | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#psPackaging/fx/{id}` | `psFxTransactionDetail` | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#psPackaging/purchase/{id}` | `psPackPurchase` | overview, receiving, payments, history | High | Swept across 3 widths × EN/KR |
| `#psImports/history/{id}` | `psImportHistory39` | Default / renderer-controlled | High | Swept across 3 widths × EN/KR |
| `#psImports/import/{id}` | `psImportDetail` | Default / renderer-controlled | High | Swept across 3 widths × EN/KR |
| `#psImports/cost/{id}` | `BOMPinkImportDetailQA.openCost` | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#psImports/fx/{id}` | `psFxTransactionDetail` | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#psSales/fx/{id}` | `psFxTransactionDetail` | Default / renderer-controlled | Medium | Representative default/status sweep passed |
| `#psSales/order/{id}` | `psOrderDetail313`, `psOrderDetail` | Default / renderer-controlled | Medium | Swept across 3 widths × EN/KR |
| `#psSales/new` | `psSaleForm313` | Default / renderer-controlled | Medium | Representative default/status sweep passed |
| `#psCustomers/customer/{id}` | `psCustomerAccount313` | orders, receipts, prices, adjust | Medium | Swept across 3 widths × EN/KR |
| `#psProduction/batch/{id}` | `psProductionDetail` | Default / renderer-controlled | High | Swept across 3 widths × EN/KR |
| `#psProduction/new` | `psProductionForm` | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#finance/record/{id}` | `financeOpen` | Default / renderer-controlled | High | Swept across 3 widths × EN/KR |
| `#finance/correction/{id}` | `financeCorrectionOpen` | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#users/access/{id}` | `BOMUserRoutes340.open` | summary, profiles, groups, scope, authority, advanced, history | Medium | Swept across 3 widths × EN/KR |
| `#users/profiles` | `v340ProfileLibrary` | Default / renderer-controlled | Medium | Representative default/status sweep passed |
| `#tasks/task/{id}` | `taskDetail` | Default / renderer-controlled | Medium | Representative default/status sweep passed |
| `#meetings/meeting/{id}` | `meetingDetail` | Default / renderer-controlled | Medium | Representative default/status sweep passed |
| `#reports/report/{id}` | `reportDetail` | Default / renderer-controlled | Medium | Representative default/status sweep passed |
| `#approvals/approval/{id}` | `approvalDetail` | Default / renderer-controlled | Medium | Representative default/status sweep passed |
| `#payroll/employee/{id}` | `employeeProfileV3592`, `employeeProfileV359`, `employeeDetailV29` | overview, employment, compensation, advances, payroll, accounts, documents, allocation | Medium | Representative default/status sweep passed |
| `#payroll/run/{id}` | `payrollRunDetailV3591`, `payrollRunDetailV29` | Default / renderer-controlled | Medium | Representative default/status sweep passed |
| `#profile` | Existing workspace dispatcher | overview, security, employment, payroll, payslips, advances, accounts, documents, access | Medium | Swept across 3 widths × EN/KR |
| `#payroll` | Existing workspace dispatcher | overview, employees, runs, advances | Medium | Swept across 3 widths × EN/KR |
| `#accounting` | Existing workspace dispatcher | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#accounting/account/{id}` | `v343OpenAccount` | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#psFinished/lots` | `psLotsV367` | Default / renderer-controlled | Medium | Swept across 3 widths × EN/KR |
| `#psFinished/lot/{id}` | `psLotDetail38` | Default / renderer-controlled | Medium | Swept across 3 widths × EN/KR |
| `#psSales/trace/{id}` | `psOrderLotTraceV367` | Default / renderer-controlled | Medium | Representative default/status sweep passed |
| `#psFinished/families` | `psFamiliesV367` | Default / renderer-controlled | Medium | Swept across 3 widths × EN/KR |
| `#psFinished/family/{id}` | `psFamilyDetail38` | Default / renderer-controlled | Medium | Swept across 3 widths × EN/KR |
| `#accounting/journal/{id}` | `journalDetailV29` | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#accounting/posting/{id}` | `postingOpenV318` | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#accounting/control` | `accountingPostingControlV318` | Default / renderer-controlled | High | Swept across 3 widths × EN/KR |
| `#accounting/financing/{id}` | `v356FinancingDetail` | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#accounting/asset/{id}` | `v357FixedAssetDetail` | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#accounting/ledger/{id}` | `v358AccountLedger` | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#accounting/foreign-financing/{id}` | `v356ForeignDetail` | Default / renderer-controlled | High | Representative default/status sweep passed |
| `#systemSettings/security` | `BOMSecurityRoutes.open` | overview, profiles, groups, policies, approval, audit, defaults | Medium | Swept across 3 widths × EN/KR |
| `#systemSettings` | Existing workspace dispatcher | Default / renderer-controlled | Medium | Representative default/status sweep passed |

## Remaining acceptance / limits

95 selected record/tab combinations (61 initial detailed cases plus 34 additional registered patterns) have 570 detailed captures. Together they cover all 59 observed registered route pattern pairs at 1440/820/390px in EN/KR. The 34 primary views add 204 captures, for 774 after-change captures. Section lists in the table are registry capabilities, not a claim that every possible section/state combination was exercised. Additional purchase/cart, product/production and permission tests exercise real mutations and role restrictions.

Follow-up acceptance adds five standard feature-access profiles with separately assigned L0–L4 authority, across Approvals/Finance/Payroll × three widths × EN/KR (90 browser cases). L5 remains protected dual approval; the existing API caps an attempted ordinary-user assignment at L4. Additional checks cover delayed loading, forced 503/retry, 404/invalid routes, native invalid forms, keyboard focus, browser accessibility-tree output, 200% zoom-equivalent reflow, and large synthetic paged lists. All 59 registered patterns retain six-way representative coverage. Audited legacy system labels are translated; data names/codes are preserved. Remaining production acceptance concerns are target-host install/PDF behavior, real-volume capacity and user acceptance, not unimplemented shared UI work. Every possible lifecycle/role combination and OS screen reader is outside the automated coverage claim.
