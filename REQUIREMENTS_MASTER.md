# Blue Ocean Market — Master Requirements

This document is the standing acceptance baseline for the Blue Ocean Market Management OS. The original Blue Ocean Management Software Blueprint remains mandatory, together with all compulsory requirements added during development unless the user explicitly marks a requirement optional or supersedes it later.

## 1. Platform and business-unit architecture

- Every business unit is a separate operational workspace with business-unit-scoped data and permissions.
- CEO / Owner can access every active business unit and a consolidated All Business Units dashboard.
- Non-CEO users are restricted to their assigned/authorized business units at API/database-query level, not only by UI hiding.
- One primary dashboard is used per business unit; avoid duplicate dashboards for the same unit.
- Shared/global modules may remain available where operationally required, but business-unit-specific modules and workflows take priority over redundant generic modules.
- Full CRUD must be available where appropriate, using edit/archive/void/reversal instead of destructive deletion when financial, inventory, approval, or audit history must be preserved.
- All important create/update/delete/void/approval/payment/stock actions must refresh affected UI data and counters without requiring a manual page reload.

## 2. Finance, accounting, audit, and approvals

- Actual transaction values drive financial reporting; reference/master prices must never rewrite historical transaction values.
- Payment/evidence requirements, finance synchronization, accounting posting, correction history, verification, void/reversal, and approval controls must remain linked to the operational source record.
- Financial history must not be silently destroyed.
- CEO / Owner may directly authorize controlled actions through a confirmation/reason flow while preserving approval/audit history.
- Approval rules remain configurable by business unit, action, amount/risk threshold, and approval level.
- Pending actionable items should use visible non-zero counters/badges where applicable.
- Accounting must remain understandable and operationally connected to Finance rather than duplicating unrelated records.

## 3. Data-entry and UI consistency

- Static/enumerated/reference fields should use dropdown/select/search-select controls instead of unnecessary free text.
- Free text is reserved for genuine names, references, descriptions, notes, comments, and other non-enumerated values.
- Count quantities must use whole numbers where they represent physical counts; true measurements and financial values may use decimals where appropriate.
- Quantity input HTML constraints must be mathematically consistent: an integer field using `step=1` must not retain a fractional step base such as `min=0.01`; valid integers (for example 1, 10, 100) must never fail browser step validation.
- Quantity precision must follow the real unit/workflow, not only a generic field label. Discrete units (pieces, packs, pouches, cartons, boxes, bags, finished units, machines, parts) are whole-number counts; kg/weight and other true measurements may be decimal.
- Client-side controls and server-side validation must agree on quantity precision, including create/edit/correction/waste/stock-movement workflows.
- Restaurant/POS fractional quantity support must not be broken by global count validation.
- All screens must remain responsive and usable on desktop, laptop, tablet, and mobile, including forms, tables, cards, modals, drawers, navigation, and action controls.
- Selected navigation items must remain visibly highlighted and reachable; clicking the active tab should refresh its data.

## 4. Mandatory business-unit context integrity

This is a system-wide rule for every current and future business unit and major module.

1. Every placeholder, example, helper text, label, tooltip, empty-state message, validation hint, sample/default value, contextual note, search hint, form guidance, and other user-facing contextual UI copy must match the **selected business unit and the exact workflow/field** where it appears.
2. Text from one business unit must never leak into another business unit. For example, Excavator examples such as heavy-equipment suppliers, machines, yards, buyers, or model numbers must not appear in Pink Salt or Restaurant workflows; Pink Salt examples must not appear in Excavator or Restaurant workflows; Restaurant examples must not appear in unrelated units.
3. Shared/global modules may use neutral context only when the wording is genuinely applicable to all units. Where a shared field benefits from unit context, its placeholder/helper text must adapt to the currently selected business unit.
4. Module-authored field-specific placeholders have priority over generic global hint systems. A generic UI enhancement layer must never overwrite a more accurate business-unit/workflow-specific placeholder.
5. Any automatic placeholder/hint generator must first determine the active business unit. Unknown/future units must receive neutral wording rather than inherited wording from an existing unit.
6. Business-unit context rules apply equally in English and Korean. When Korean is selected, the corresponding contextual UI text must be translated while preserving user-entered names, references, SKUs, serial numbers, and other business data.
7. New business units and major modules must not be released until a dedicated **Business Context Audit** is completed across all create/edit/detail/search/filter/payment/finance/document/report/notification screens.
8. The Business Context Audit must specifically check for copied placeholders, examples, helper text, labels, tooltips, defaults, empty states, validation messages, sample data, and search wording from previously developed units.
9. Context correctness is a release-blocking requirement. A feature is not considered complete if its functionality works but its UI copy describes the wrong business domain.

### Required context examples
- Pink Salt supplier/import forms: use salt supplier, import invoice, packaging, warehouse, production, product, customer/store, and order context.
- Excavator forms: use machine/deal, supplier, buyer, yard/logistics, repair, parts, sale/export, and related finance context.
- MIMI Restaurant forms: use menu, ingredient, supplier, stock, table, order, POS, buffet, waste, and restaurant operations context.
- Future units: define and document their own domain vocabulary before implementing forms; do not reuse examples from a previous unit merely because the field names are similar.

## 5. Localization

- Korean and English are required throughout the system.
- Korean remains fully supported across navigation, dashboards, forms, buttons, statuses, validation/error messages, notifications, dialogs, Finance, Accounting, operational modules, reports, documents, and generated/printable outputs where localization is applicable.
- System labels may be translated, but user-entered business data must not be altered.
- Newly introduced UI copy must include localization coverage before release.

## 6. Pink Salt standing workflow requirements

- Dedicated modules include Imports / Purchases, Raw Salt Stock, Repacking / Production, Finished Goods, Packaging Materials, Sales / Orders, Customers / Stores, and Waste & Loss, plus required shared/global modules.
- Generic duplicate Sales, Purchases, and Inventory modules are hidden from Pink Salt navigation; other shared modules remain unless separately changed.
- Import creation itself does not create a Finance payment. Supplier payments are recorded from the saved import workflow, including supplier-advance allocation where supported.
- Controlled import Edit / History / Cancel / Void / Delete flows must preserve approvals, audit history, finance, accounting, stock, and downstream-production safeguards.
- Received imports cannot be silently moved backward or have locked financial/composition data rewritten outside controlled correction/reversal workflows.
- Repacking/production must update raw salt, packaging materials, finished goods, waste, costs, traceability, and accounting consistently.
- Gift Box / Set products may contain multiple salt categories while all pouches in that gift-box configuration use one shared pouch weight.
- Finished-product and packaging BOM calculations must consume the correct quantities and preserve category-level traceability.
- Finished Goods archive/delete requires zero stock and must remain history-safe.
- Import and production/repacking PDF workflows remain bilingual-ready and linked to the source records.

## 7. Excavator standing workflow requirements

- Maintain the long-running machine/deal lifecycle across purchase, supplier documentation/payment, logistics, repairs/parts, sale/export, finance, documents, and audit history.
- Supplier and buyer profiles, advances, allocations, evidence, requirements/matching, and linked machine history remain integrated.
- Buyer/supplier payment evidence requirements and Finance synchronization remain mandatory where applicable.
- Machine sale/payment/accounting rules must preserve the currently approved business logic and audit history.

## 8. MIMI Restaurant standing workflow requirements

- Maintain dedicated restaurant dashboard, menu management, stock, weekly menu, tables, POS, dine-in/takeaway/delivery, open-order editing/cancellation, receipts, waste, daily closing, and related Finance/inventory integration.
- Open order cancellation must release tables and reverse reserved/issued stock as appropriate while preserving audit history.

## 9. People, tasks, reports, meetings, documents, and notifications

- Task assignment, progress, evidence, due dates, performance tracking, daily/weekly/monthly reporting, meetings, approvals, documents, notifications, and action reminders remain part of the shared platform.
- Shared-module wording must still follow the Business Context Integrity rule when the selected business unit makes a contextual example more useful than a generic one.

## 10. Release acceptance

Before packaging a new release:

- Run current QA/static/syntax checks and relevant runtime smoke tests where dependencies are available.
- Verify version/cache identity and that every referenced runtime file exists.
- Verify no database wash/reset is introduced unless explicitly requested.
- Verify business-unit scoping, finance/accounting integrity, approvals/audit, localization, responsive UI, and the Business Context Audit.
- Remove obsolete/duplicate/temporary/historical release files from the distributable package unless they are required by runtime, deployment, current QA, or maintainability.
- Keep the release package clean, current, and production-focused while preserving all files required to run, test, build, deploy, migrate, and maintain the system.

## V30.13 mandatory Pink Salt customer accounts, receivables, pricing and list-control requirements

### Customer / Store receivables and account ledger
- Every Pink Salt Customer / Store must have an account/ledger accessible from the Customers / Stores workspace.
- The account must show sales/invoices, payments, allocations, advances/unallocated customer credit, adjustments/credit notes/returns, outstanding balance, overdue balance and transaction history.
- Credit sales are supported. Payment may be received immediately or later, in full or in multiple parts.
- One receipt/payment/marketplace settlement may be allocated across one or many completed orders. The system must preserve order-level allocation history and any unused balance as unallocated customer credit.
- Completed order payment state must distinguish unpaid, partially paid, paid/settled and overdue conditions. Due date and credit terms must be retained on the order.
- Customer/store accounts must support credit terms, credit limits and aging buckets including current, 1–30, 31–60, 61–90 and 90+ days overdue.
- Statements must support date filters, opening/closing balance, transaction rows and export. CSV must be available; PDF output must support English and Korean when the deployment PDF renderer is available.
- Customer receipts must retain payment date, payment currency, payment amount, FX rate to KRW, method, reference, receipt/evidence, notes, creator and audit history.
- Marketplace/e-commerce settlements must support delayed grouped payouts. A settlement may contain net cash plus marketplace/settlement fees while the gross settlement value is allocated to the underlying orders.
- Finance and Accounting must be synchronized from the operational record so cash/receivable/customer-credit/marketplace-fee amounts are not manually duplicated.

### Pink Salt customer/store selling-price architecture
- A single fixed selling price for all customers is not sufficient. Every finished product/SKU may have a default/base selling price, reusable price-tier prices and customer/store-specific prices.
- Supported pricing tiers must include at least Retail, Wholesale, Distributor, E-commerce and Special Contract, and the design must remain extensible.
- Price resolution priority is mandatory: **active customer/store-specific price → assigned price tier → product default price → authorized manual override**.
- Customer/tier prices may define minimum quantity, effective-from date, effective-to date and notes.
- Every order line must snapshot the suggested/list price, actual unit price, pricing source and any manual override reason. Later price-list changes must never rewrite historical order prices.
- A manual price different from the resolved price requires an override reason and auditability. Selling below current cost must be blocked for ordinary users and reserved for CEO / Owner controlled authorization.
- Customer/store profile must expose pricing terms and current/historical customer-specific pricing.

### Pink Salt list search, sorting and filtering
- All substantial Pink Salt record-list screens must provide consistent search, sorting and context-appropriate filters. This applies at minimum to Imports / Purchases, Raw Salt Stock, Repacking / Production, Finished Goods, Packaging Materials, Sales / Orders, Customers / Stores and Waste & Loss.
- Filters must use the context available on each screen (for example status, date, supplier/customer, sales channel, category/grade/SKU, stock state or reference) and must provide a clear/reset action.
- Controls must remain usable on desktop, tablet and mobile and must respect Pink Salt business-unit scoping and refresh behavior.

## V30.14 mandatory system-wide Review & Confirm and processing-safety requirements

### Review before persisted mutations
- Every user-triggered action that changes persisted business data must use a reusable **Review & Confirm** step after validation and before commit. This applies across all business units and shared modules to actions such as Save, Create, Update, Submit, Complete, Receive, Record Payment, Allocate, Sell, Purchase, Approve, Void, Delete, Cancel, Reverse, Close and Finalize where the action changes business state.
- The review must show the important entered values and the business effect of the action instead of relying on a generic yes/no prompt. Financial actions should summarize amount/currency/reference/allocation/evidence where applicable; stock/import/production actions should summarize quantities and operational impact where available.
- For edits, the review should show **old value → new value** for changed fields whenever the existing/form-default value is available.
- CEO / Owner approval bypass does not bypass Review & Confirm. Confirmation and approval are separate controls.
- Non-mutating actions such as search, filter, sort, tab navigation, view/open, refresh, download/export and ordinary report viewing do not require Review & Confirm. Save Draft/autosave may remain immediate when it has no financial/stock/operational posting effect.

### Processing state, duplicate prevention and failure safety
- After final confirmation, backend work that may take noticeable time must show a clear processing/loading state. Short actions may use button-level loading; high-impact transactional actions should use a blocking modal/overlay.
- While processing, disable the triggering control and block duplicate/conflicting user actions so double-clicks do not create duplicate business transactions.
- Frontend blocking is not sufficient by itself. Sensitive mutations must retain server-side transaction and idempotency/request-fingerprint protection so duplicate payment, stock, sale, import, allocation and other postings are rejected or safely replayed.
- Processing text must describe the operation when practical (for example Receiving import…, Recording payment…, Completing production…, Allocating balance…). Do not imply completion until the backend confirms success.
- On success, close the processing state, show/allow the normal success feedback and refresh all affected source/Finance/Accounting/stock/dashboard/badge data according to existing refresh rules.
- On failure, stop the loader, re-enable the UI, preserve entered data where practical, show an actionable error and ensure transactional financial/stock work is not partially committed.
- Backend-intensive mutations must have a client timeout appropriate to legitimate processing time rather than the former short generic timeout.

### English / Korean localization
- Review titles, field summaries, action/impact messages, confirmation buttons, loading/progress text, warnings, validation feedback and error/success-facing text introduced by this workflow must use the English/Korean i18n layer. No new hard-coded English may remain visible when Korean is selected.

### Pink Salt Customer / Store account-position presentation and credit use
- Do not present a customer/store credit position as a confusing raw negative account balance. If receivables exceed credit, show **Due** with a positive amount; if unallocated/advance credit exceeds receivables, show **Credit / Available Credit** with a positive amount; if balanced, show **Settled**. The underlying accounting calculation remains unchanged.
- Available/unallocated customer/store credit must remain allocatable to existing orders and may be explicitly applied to a newly completed order. Allocation must reduce both unallocated credit and the linked order receivable without duplicating cash or Finance entries.



## V30.15 mandatory Pink Salt unified supplier architecture

- Pink Salt must expose a dedicated **Suppliers** destination in the left sidebar. Supplier master/account management must not be embedded as a large management action inside Imports / Purchases or Packaging Materials. Operational screens remain focused on operations and link back to the supplier profile where appropriate.
- Pink Salt must maintain one unified supplier master. Do not create disconnected duplicate supplier systems for imports/raw salt and packaging materials. A supplier may belong to one or multiple supply categories, initially **Import / Raw Salt Supplier** and **Packaging Material Supplier**, with the design extensible to future categories.
- Supplier category must control context-specific availability: import workflows select suppliers categorized for Import / Raw Salt; packaging setup/receiving selects Packaging Material suppliers. Existing supplier history should be migrated/classified where safely inferable.
- Each supplier profile must provide shared core details plus an account/payables view containing supplier purchases/obligations, payments/advances, unallocated supplier credit, allocations, outstanding balance, credit terms, credit limit, aging, documents/evidence, audit/history and statements.
- A supplier payment is entered once in the supplier account. It may cover one obligation, multiple imports/packaging receipts, be partially allocated, or remain as unallocated supplier credit for later use. The same supplier credit must never be double-allocated across import and packaging obligations.
- Stock receipt and supplier payment are separate but linked business events. Packaging material may be received before payment, after an advance payment, or against existing supplier credit according to commercial terms.
- Receiving packaging material must recognize the packaging inventory value and a supplier Accounts Payable obligation. It must not create a cash payment merely because stock was received. Supplier invoice/reference and receipt/delivery evidence are mandatory for packaging purchase receipt.
- When available supplier credit exists, packaging receiving may offer the user an explicit option to apply it automatically. Supplier account must also allow controlled manual/automatic allocation after receipt. Allocation reduces Accounts Payable and supplier-advance/credit balance without creating a second cash transaction.
- Supplier account balances and open-balance accounting must combine import and packaging obligations consistently. Supplier advance editing/refunding/integrity checks must consider allocations from every supported supplier obligation type.
- Supplier statements must support date filtering and export. English/Korean localization requirements apply to supplier UI, confirmations, processing messages and generated statements/PDF labels.
- V30.14 Review & Confirm and protected processing rules apply to supplier creation/edit, supplier payment, allocation, packaging receipt and other supplier mutations. Existing approval, audit, evidence, idempotency, finance/accounting and business-unit scoping rules remain mandatory.

## V30.16 mandatory system-wide Users & Access requirements

### Hybrid effective-access architecture
- Blue Ocean Market must use a hybrid access-control model: **role templates are defaults only; effective permissions are authoritative**. A user’s displayed role must never be treated as sufficient authorization by itself when a granular permission is available.
- Effective access must combine the user’s role template, global overrides, business-unit-specific overrides, assigned business units, sensitive permissions, delegated-administration rights and configured limits/thresholds.
- Frontend navigation/action visibility and backend API authorization must resolve from the same effective-access rules. Hiding a tab or button is not a security control by itself; the backend must independently reject unauthorized requests.
- Access removal, deactivation and permission changes must take effect immediately for subsequent requests by resolving the current live user/access state instead of trusting stale role/business-unit claims from an old session token.

### CEO / Owner global administration
- CEO / Owner must have a global **Users & Access** workspace covering every active system user and every business unit.
- CEO / Owner can control business-unit assignments, sidebar/tab/module visibility, action permissions, approval authority, financial/sales limits, sensitive permissions, report/export/print access, delete/void rights, audit visibility and delegated administration.
- CEO / Owner must be able to view a user’s **Effective Access**, apply an authorized role template and copy complete access settings from another user. Copying business-unit assignments must be explicit rather than automatic.

### Business Unit Manager delegated administration
- A Business Unit Manager may create and manage users only inside business units assigned to that manager.
- A Business Unit Manager must never assign another user to a business unit outside the manager’s scope and must never grant a template, permission, sensitive right, delegated right or limit above the manager’s own effective authority.
- Delegated administrators cannot change their own role/access or elevate themselves. They cannot manage CEO / Owner users.

### Finance Head delegated administration
- Finance Head may create/manage Finance users and Finance-related access only within business units authorized to that Finance Head.
- Finance Head cannot grant non-Finance operational/system permissions merely because the user-management screen is available. Finance-related delegated administration must remain a bounded scope.
- Finance Head and Finance User templates must coexist with the legacy Finance / Admin role so existing test data remains compatible while the newer delegated model is adopted.

### Permission layers
- Business-unit scope: a non-CEO user may be assigned to one or multiple business units and must have one primary business unit. Users with multiple assignments may switch only among assigned units.
- Module/tab access: every substantial module/business-unit tab can be independently visible/hidden by effective View permission.
- Action permissions must include at minimum **View, Create, Edit, Delete, Void, Approve, Export, Print, Verify, Correct and Allocate** where the action is applicable.
- Sensitive permissions must include at minimum user management, approval-rule configuration, accounting adjustments, payroll access, audit-log access and system administration.
- Delegated-administration rights must be explicit and separable from ordinary module access.
- Limits/thresholds must support at minimum Finance payment entry, Finance expense entry, Finance approval, maximum discount percentage and manual selling-price override limits. Configured limits must be enforced server-side on applicable operations.

### Templates, overrides, audit and usability
- Provide reusable role templates such as CEO / Owner, Business Unit Manager, Operations Manager, Finance Head, Finance User, Finance / Admin, Sales / Business Development and Staff Member. Templates are starting points and do not replace effective permission evaluation.
- Granular overrides must support Inherit / Allow / Deny and business-unit-specific scope where applicable.
- All user/access changes must preserve who changed what, when, target user, business-unit scope and meaningful details in access/audit history.
- The access-control UI must clearly separate profile/role, business-unit assignments, effective access, granular action permissions, sensitive permissions, delegated administration, limits and history without overwhelming ordinary users.
- All V30.16 access-control UI labels, messages, confirmations, errors and guidance must support English and Korean through i18n.
