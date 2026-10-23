# V30.69.41 corrective audit — current status

The V30.69.40 completion claim was too broad. A render screenshot and shared CSS do not establish a full screen migration. This report supersedes that claim. The inherited inventory below remains useful for renderer, permission and API ownership; its former “Migrated” labels are corrected.

The latest source was checked before editing on 22 October 2026: the previous V30.69.40 completion ZIP was the latest generated delivery; no newer protected business source was found. Protected V30.69.39 remains the business baseline. Work starts at c094e3561121c387398ef4451077696f23b7cc77 on a new feature branch. Server JavaScript remains byte-identical to protected V30.69.39.

## Verified gaps and delivered changes

| Area | Verified gap | Change | Current status |
| --- | --- | --- | --- |
| Accounting, 32 distinct menu destinations | Second 242px sidebar squeezed reports/controls; duplicated injected CSS | Two-level grouped navigation above a full-width work surface; original route buttons and permission checks retained | Layout modernized; six-way internal sweep |
| Accounting loan scope, two additional BU cases | Loans and foreign loans returned HTTP400 at All Units, displayed unsupported route | Localized selection prompt at All Units; actual forms still require the original BU scope | Fixed; all/unit variants swept |
| Settings, 16 sections | 250px inner sidebar, uneven buttons and restricted editing width | Responsive section navigation above the original scoped editors, retaining all 16 section handlers | Layout modernized; six-way sweep |
| Payroll and employee/self-service panels | Custom v3591/v3592 panels bypassed shared cards, oversized radii/weights, profile sidebars | Token-based domain panels, KPI density, wrapping tabs and full-width profile panels | Shared domain adaptation; four workspace sections swept |
| Users / Security & Access | Inconsistent summary cards and large editors inside modals | Token-based access panels; profile/group/policy create and edit become six canonical routed pages | Six editor routes tested with actual confirmed create/edit |
| Manual journals | Complex evidence/line form in modal; latest save callback referenced an out-of-scope accountingTab variable | New/correct routed pages, live balanced-line summary, existing evidence/confirmation and posting service; return through the router | Create and correction tested; remains Pending Review |
| Approval, task, work-report details | Full workflows rendered as modals despite existing record routes | Explicit full-page renderers; task save refresh stays on its record page | Six-way captures; task update/comment and report acknowledgement tested |
| Shell navigation | Actual anchor links escaped new styles targeting buttons | Explicit anchor navigation variant | All primary captures use corrected shell |
| Standalone search/filter/cart inputs | Only .field controls were adapted; Audit fields were 26px with square borders | Extend existing semantic decoration; scoped input styles; preserve values and handlers | Audit desktop controls measured 36–38px; six-way sweep |
| Korean and access semantics | Newly exposed profile explanations/placeholders and manual/attachment messages leaked English; matrix checkboxes lacked individual names | Existing KO catalogue additions and dynamic attachment pattern; per-cell module/action labels | Newly exposed editor/journal captures included |

## Coverage and remaining work

Current new evidence: 93 distinct destinations × 1440/820/390px × EN/KR = 558 render captures, plus 54 access/editor/detail and 12 manual journal captures. The pre-change audit has 182 unique captures (91 destinations × desktop EN/mobile KR). Accounting includes 32 menu destinations plus two scoped loan forms; the same Chart of Accounts route appears under two navigation labels and is counted once.

**This is a corrective gap-fix delivery, not proof that every legacy screen has been structurally redesigned.** Shared-adaptation-only areas include generic Sales/Purchases creation, Add User, older Excavator editing forms and several domain-specific dialogs. These retain their original controllers and shared Tabler treatment; complex-form promotion and exhaustive state-specific design review remain partial. Blank fixtures do not establish populated-state design acceptance. Full per-role/per-status/per-BU visual coverage and real assistive-technology acceptance remain untested. No arbitrary percentage complete is assigned.

The dedicated before/after viewer and machine catalogue in the QA ZIP are the current visual evidence. Historical evidence below must not be presented as newly executed V30.69.41 work.

---

# UI audit and screen inventory — V30.69.41

## Baseline and evidence

Both complete 15-section instructions were read. Library verification found V30.69.39 as the newest available protected source; no older fallback was used. Both ZIPs passed CRC checks, and input hashes are in RELEASE_MANIFEST.md. Baseline source snapshots and original input ZIPs were kept separate from the feature workspace.

Entry points: server/server.js, scripts/start-server.js, public/index.html, public/client.js and runtime-v30392.js. Existing route ownership: route-registry.js + v3693-persistent-routing.js. Inventory: **113 baseline frontend assets; 57 entry scripts; 12 inline head style blocks; 1,417 inline style attributes**. The full asset/function/API-fragment inventory is in docs/ui-modernization/BASELINE_ASSET_INVENTORY.json. Runtime-injected styles and dynamically loaded scripts remain significant compatibility dependencies.

Verified layout findings: oversized/uneven controls, truncated long sidebar labels, mixed panel radii/shadows, scattered module-specific density values, hidden/scrolled table actions, and modal/control style collisions. The shared adapter addresses shell/typography/density/action-table treatment. Existing domain mobile cards, purchase receiving, full-page cart, product family/lot and production routes were preserved. Broad deletion of old scripts was rejected as unproven.

Coverage terms: **shared migration** means a renderer uses the scoped Tabler and application adapter; it does not mean its business logic was rewritten. **Swept** means authenticated render, correct view/language, page-error and document-overflow checks with a screenshot; it does not imply every state, permission or action was tested. Manually inspected representative screenshots are identified in the QA report. No exhaustive pixel-by-pixel review is claimed.

## Primary views

Every row below has a shared visual migration and six authenticated sweep captures: 1440/820/390px × EN/KR. All 34 views rendered the expected view/language, with no uncaught page errors or document overflow. Main entry dispatch is the existing loadView/extension chain; exact asset dependencies are retained in the asset inventory. All Units and unit-specific dashboards remain the original operational views.

| View | Permission module / preserved server authorization | CSS owner / pattern | Status |
| --- | --- | --- | --- |
| `dashboard` | `dashboard` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `businesses` | `businesses` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `sales` | `sales` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `purchases` | `purchases` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `inventory` | `inventory` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `finance` | `finance` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `approvals` | `approvals` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `tasks` | `tasks` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `performance` | `performance` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `reports` | `reports` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `documents` | `documents` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `meetings` | `meetings` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `restaurantTables` | `restaurant` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `restaurant` | `restaurant` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `excavator` | `excavator` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `excavatorSuppliers` | `excavator` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `excavatorBuyers` | `excavator` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `notifications` | `notifications` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `users` | `users` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `profile` | `profile` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `audit` | `audit` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `systemSettings` | `systemSettings` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `accounting` | `accounting` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `payroll` | `payroll` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `psSuppliers` | `purchases` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `psImports` | `purchases` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `psRawStock` | `inventory` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `psProduction` | `inventory` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `psFinished` | `inventory` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `psPackaging` | `inventory` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `psSales` | `sales` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `psCustomers` | `sales` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `psWaste` | `inventory` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |
| `psCommerce` | `sales` | Shared shell, scoped Tabler, application adapter; domain styles retained | Shared styling; primary render sweep passed (not a screen redesign) |

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


## V30.69.42 catalogue update

The machine-readable WORKFLOW_PAGE_CATALOGUE_42.json enumerates 73 renderer owners and 90 seeded create/edit/detail variants. WORKFLOW_SOURCE_AUDIT_42.json retains source/API ownership; the existing BOM router owns navigation, dirty guards, permissions and direct hydration. bom-workflow-pages.js owns only catalogue presentation and return-page coordination. Shared scoped CSS and existing form/mutation services remain the design/behavior owners. The fresh recovery QA report is authoritative for current execution; older screenshots/results are historical. Focused transaction dialogs and uncertain compatibility source are intentional exceptions.
