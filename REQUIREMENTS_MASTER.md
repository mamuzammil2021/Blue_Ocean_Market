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

## V30.17 mandatory Users & Access hardening requirements

- **Every People & Access button/action must be functional and regression-tested.** This includes Access, Add User, Edit, Activate/Deactivate, Delete Profile where authorized, Effective Access tabs, business-unit assignment, primary business unit, Apply Role Template, CEO Copy Access, granular permission save, sensitive/delegated permission save, limit save, access-scope switching and history viewing.
- The **Access** button must always open the selected user’s access profile. Client extensions loaded under strict mode must explicitly export handlers used by inline UI actions; a silent script-evaluation failure is a release blocker.
- A user may review their own Effective Access, but **no user may change their own role, assignments, granular permissions, sensitive/delegated rights or limits** through Users & Access. CEO/Owner is not exempt from the self-elevation protection; CEO self-profile is read-only in this workspace.
- Multi-business-unit users require an explicit **Access Scope** when reviewing or changing unit-scoped permissions/limits. Delegated administrators may not create global overrides; their changes must be tied to a target user’s assigned BU and also be inside the administrator’s own BU scope.
- Primary business unit must be one of the assigned active business units. Invalid/archived unit IDs and inconsistent primary assignments must be rejected server-side instead of silently changing scope.
- Delegated access modification requires explicit `delegate.access`. A delegated administrator cannot grant a role template, Allow override, delegated/sensitive permission or numerical limit above their own effective authority.
- Finance-only delegated administration may manage only Finance Head / Finance User accounts, Finance-related permission keys and Finance amount limits. Possessing `delegate.finance_users` must not accidentally restrict a manager who also has broader `delegate.users`/`delegate.bu_users` authority.
- Complete **Copy Access From Another User** remains CEO/Owner-only. Copying BU assignments must remain an explicit option.
- Access changes must create meaningful audit/history records with before → after state for role/template, assignments, overrides and limits where applicable.
- The module catalog and route authorization map must cover active shared modules including Payroll and legacy route aliases such as Staff→Users, CRM/Customers→Sales, KPI→Performance and POS→Sales. Frontend legacy role-based `allowed()` logic must never override effective-permission navigation.
- Sensitive permissions must be operational controls, not display-only metadata: Payroll requires `sensitive.payroll`; manual Accounting changes require `sensitive.accounting_adjustments`; approval-rule mutations require `sensitive.approval_rules`; Audit access requires `sensitive.audit_logs`, in addition to applicable module/action rights.
- V30.14 Review & Confirm and processing protection applies to Users & Access mutations. Successful changes refresh effective access immediately; failures must preserve the form/state and show actionable errors.
- English/Korean localization remains mandatory for new access-control labels, read-only/scope guidance, confirmation text and errors.
- Render/Docker deployment must support native `better-sqlite3` installation on Node 22 slim images by providing the required node-gyp build toolchain. Production startup must work from platform environment variables without requiring a committed `.env` file.

## V30.18 mandatory Finance & Accounting Posting Control requirements

### Finance and Accounting must remain separate
- The left sidebar/workspace architecture must keep **Finance** and **Accounting** as separate permission-controlled modules. They must not become duplicate data-entry screens.
- **Finance** is the operational financial-control workspace: payments, receipts, advances, expenses, evidence, verification, correction requests, pending financial work and Posting Control.
- **Accounting** is the official books workspace: Chart of Accounts, official journals, General Ledger, Trial Balance, Profit & Loss, Balance Sheet, reconciliation, period close and specially authorized accounting adjustments.
- Ordinary operational users must not be required to know or enter Debit/Credit for normal business transactions. Accounting entries are prepared by the system from persisted operational source data and mappings.

### Mandatory posting flow
- The required architecture is **Operational Transaction → Finance Review → Posting Control → Official Ledger**.
- A generated journal is an accounting **proposal** until final posting. Its normal initial status is **Pending Review**; a proposal returned for correction uses **Correction Required**.
- Pending Review / Correction Required proposals must not affect official General Ledger, Trial Balance, P&L, Balance Sheet or other official financial-statement totals.
- Posting Control must show enough context to review the source: business unit, date, source/reference, description, debit/credit lines, linked Finance record, verification/dependency state, relevant evidence and posting history.
- Queue/detail visibility must be enforced by effective Accounting/Finance permissions and business-unit scope on the backend as well as in the UI.
- Final posting must require effective **Accounting · Approve** authority for every business unit affected by the proposal. CEO/Owner retains authorized bypass semantics but still uses Review & Confirm and audit.
- Immediately before final posting the backend must revalidate: proposal status, balanced debit/credit, open period, Finance/source readiness, unresolved correction/reversal dependencies, reviewer authority and a mandatory final-post review note.
- Successful final posting moves the proposal to **Posted** and only then makes it an official ledger event. Posting history/audit must record reviewer, time, note and status transition.

### Finance verification, evidence and source integrity
- A proposal linked to a Finance transaction must not final-post while the Finance record is unverified, void/inconsistent, under an open correction workflow or blocked by an unresolved prior Accounting reversal/dependency.
- Posting Control must surface available source/Finance evidence to the reviewer. Evidence URLs exposed by Accounting must resolve only to valid internal upload paths; arbitrary external/path-traversal values must not be emitted as trusted evidence links.
- Finance verification and Posting Control are separate controls: Finance verification confirms the operational financial record; Accounting final posting confirms the resulting accounting proposal.
- Authorized users must receive actionable Posting Control pending counts/badges even if they can review/correct but do not possess final-post approval authority. Zero badges remain hidden under the system-wide badge rule.

### Corrections, reversals and no destructive accounting history
- Official Posted journals must never be silently overwritten or destructively deleted as a normal correction mechanism.
- If a Posted source requires reversal, the system creates a **Pending Review Accounting Reversal proposal**. The original journal remains Posted until the reversal proposal itself is final-posted.
- When the reversal is final-posted, the original journal becomes Reversed and the posted reversal provides the offsetting ledger effect. Related bank-reconciliation matches must be released when the original matched journal is no longer a valid live posting.
- A corrected source transaction must not create/finalize a replacement official accounting effect while the prior official posting still has an unresolved reversal dependency.
- An unposted proposal may be cancelled rather than financially reversed where cancellation is safe. Cancellation/correction reason and audit history are mandatory.
- Source workflows must prevent duplicate active accounting proposals for the same logical source when an equivalent Pending Review, Correction Required or Posted proposal already exists, except where the business event is explicitly designed to create multiple separate journals (for example distinct partial payroll payments).

### Manual journals / accounting adjustments
- True manual journals are exceptional accounting adjustments and require applicable Accounting access plus `sensitive.accounting_adjustments` (CEO/Owner retains full authority).
- Manual journal proposal must require: authorized business unit, open period, transaction date, reason/description, supporting evidence, at least two active manual-postable accounts, exactly one positive Debit or Credit per line, and equal total Debit/Credit.
- A manual journal enters Posting Control as Pending Review and must not be official merely because the creator has permission to prepare it.
- Before posting, an unposted manual proposal may be corrected/resubmitted only by an appropriately authorized responsible user (or CEO/Owner according to policy). Existing evidence/history must remain available and additional corrected evidence may be attached.
- Cancellation of an unposted manual proposal requires authority and a mandatory reason and leaves an auditable Cancelled record.

### Period close, reconciliation and reporting
- Period close must be blocked while the period contains unresolved Pending Review/Correction Required accounting proposals, pending accounting synchronization, unverified Finance transactions, open Finance correction requests, open accounting exceptions, unreconciled imported bank-statement lines, unbalanced official journals, uncleared suspense balances or an Inter-BU Due From/Due To mismatch.
- Accounting Periods must provide a **Period Close Readiness** view that displays automated control results and a persistent V2 reconciliation checklist before a close is attempted.
- Required reconciliation areas retain status, notes, reviewer, completion date and optional supporting evidence. Valid controlled states are Open, Reconciled, Exception Approved and Not Applicable; Exception Approved / Not Applicable require a reason.
- The checklist must include the core V2 areas (Bank, Cash, Payroll, Tax/WHT/Duties, Inter-BU Clearing, Suspense/Clearing, Corrections/Voids and Trial Balance) plus applicable Excavator and Pink Salt supplier/customer/inventory/WIP/GIT subledger areas.
- Company/consolidated close is permitted only after active business-unit periods for the month have been closed; Inter-BU clearing must reconcile for consolidation.
- Closing a period requires an Accounting-authorized review note. Closed periods block normal back-dated source/accounting changes.
- Reopening is CEO/authorized controlled activity with a mandatory reason and audit; reopening resets the reconciliation checklist so the period requires fresh sign-off before it can be closed again.
- Official accounting reports must reconcile from the same ledger-effective journal population. Pending/correction/cancelled proposals must not inflate balances or profit; a controlled reversal is represented by the original Reversed journal plus the Posted reversal so the net official effect is zero.
- Bank, supplier, buyer/customer and inventory subledger reconciliation remains mandatory before close under Accounting Requirements V2.

### Shared engine, subledgers and currency
- Continue the Accounting Requirements V2 architecture: one shared double-entry engine with `business_unit_id` and operational dimensions; BU-level and consolidated reports come from the same accounting source.
- Maintain control accounts plus operational subledgers rather than creating a separate COA account for every buyer/customer/supplier/machine/SKU/batch.
- KRW remains the base ledger currency while Payment Currency, Payment Amount and FX Rate to KRW are preserved for applicable foreign-currency transactions and audit.
- Perpetual inventory, Excavator machine/deal costing, Pink Salt raw/packaging/WIP/finished-goods costing, supplier/customer advances and payable/receivable treatment remain governed by Accounting Requirements V2 and the later Blue Ocean workflow decisions.

### UX, access, audit and localization
- Posting Control and Accounting controls must use the V30.14 Review & Confirm/processing/idempotency protections for consequential mutations.
- Effective Users & Access permissions remain authoritative for Finance/Accounting visibility and actions. Frontend hiding is not a substitute for backend authorization.
- Every posting/correction/reversal/manual-journal state change must preserve meaningful who/what/when/reason/status history.
- All new Finance/Accounting labels, statuses, confirmations, errors, help text and generated output remain English/Korean ready with no hardcoded-English-only user experience in Korean mode.
- V30.17 Users & Access behavior, including the locally verified Access button, is a regression requirement for every subsequent release.


## V30.19 mandatory System Settings & QA hardening requirements

### Central configuration / authority
- System Settings is the permanent source of company-wide and technical configuration. Effective settings resolve **Company Default → Business Unit Override → User Override**.
- Access is restricted to CEO/Owner and authorized System Administrators. Technical administration does not automatically grant business-policy, Finance or Accounting authority.
- High-risk changes (base currency, fiscal year, accounting mappings, storage provider, migration/reset, evidence requirements, bank GL mapping and numbering sequences) require special permission, Review & Confirm/reason and immutable old→new audit history.
- Sections must cover System Overview, Company Profile & Branding, Business Units, Email/SMTP, Files & Attachments, Migration, Finance & Accounting, Company Bank Accounts, Security & Access, Approval Settings, Notifications, Numbering, Localization, Backup/Storage/Maintenance, System Audit and AI Assistant.

### System administration connected behavior
- Add System Administrator role/template and granular permissions for System Settings, SMTP, storage, migration, bank accounts, AI and accounting configuration.
- Forgot Password uses configured SMTP, secure expiring one-time tokens, rate limiting, generic/non-enumerating responses, password policy and audit.
- Company Bank Accounts are the operational payment-account source for Finance/Accounting. They are BU/permission scoped, GL-mapped and history-preserving; used accounts are closed/inactivated instead of deleted, and post-history GL remapping is highly restricted.
- Posting/verification must block a non-cash transaction when its configured payment account does not have a valid active Asset GL mapping.
- Shared Attachment Service consumes centralized limits/types/compression/original-retention/storage rules. Routine upload uses attachment preview/readability confirmation instead of the full business-data Review & Confirm dialog. Financial/legal originals/history are preserved where required.
- Migration flow is **Upload → Validate → Preview/Map → Resolve → Review/Approve → Import** with Migration ID, duplicate detection, errors/warnings, audit and reconciliation; no silent overwrite.
- AI Assistant settings must preserve **User → Business Unit → Module → Record → Sensitive Permission** and must never provide unrestricted DB access. Consequential AI-assisted actions use the same Review & Confirm → user confirmation → commit → audit controls as normal actions.

### QA hardening from supplied QA document
- Validate supplier phone/email and prevent duplicate normalized supplier contact details.
- Fix Excavator Supplier modal reopening after submit/update/delete/back navigation.
- Prevent duplicate Serial/Chassis across supplier-listed machines and machine history; show a clear error and do not save.
- Load and persist supplier-machine Notes during Edit/Update.
- Documents/receipts provide Preview first and explicit Download Original; authorized removal archives/preserves history where evidence integrity requires it.
- Payment Method is mandatory for payment-related entries; Payment Reference is required for non-cash. Applicable entries retain Payment Currency, Payment Amount, FX Rate to KRW, Accounting Amount KRW, Company Bank/Payment Account and evidence.
- Machine Cost supports controlled edit/delete/reversal by lifecycle state and clearly shows purchase token/partial paid. Verified/posted financial costs are corrected/reversed rather than destructively altered.
- Finance actions are state-driven: Verified/Voided records use View; Correction Required hides inappropriate verification/void actions; successful void closes its modal; View includes complete record/evidence/history/posting context.
- Finance correction form shows previous/current data and evidence, allows revised evidence and preserves superseded/removed evidence in history.
- User language selection persists across refresh/login using a reliable stored preference.
- Accounting Simple View responsive defect is fixed without disturbing the working Advanced View.
- Fix reported instances and audit equivalent patterns system-wide rather than treating each screenshot as an isolated one-off.

## V30.20 mandatory requirements — Settings UX, Smart Payments & Direct Attachments

V30.20 builds on V30.19 without resetting or replacing historical operational, Finance or Accounting data.

### User-friendly System Settings
- System Settings must use a clear administration layout across every section: readable headings/descriptions, grouped navigation, separate Policy / Technical badges, consistent form spacing, responsive cards and obvious Save / Test / History actions.
- Technical classification text must never run into the section name.
- Company Default → Business Unit Override → User Override remains the configuration precedence.
- Company Financial Accounts replaces the narrow bank-only presentation while preserving the same permission and audit controls.

### Supplier and Buyer UI validation
- Add/Edit Supplier and Add/Edit Buyer must validate phone and email immediately in the UI while typing / on blur.
- Invalid values must show an inline field error and block save.
- Phone/email duplicate checks must surface in the form before save where possible and identify the conflicting field/record.
- Server-side validation remains mandatory as a second integrity layer.

### Smart payment method → financial account routing
- Every payment/receipt/expense/cost form that records a real cash movement must use the shared smart financial-account selector.
- Cash → active authorized Cash accounts only; Bank/Bank Transfer → active authorized Bank accounts only; Card → active Company Cards only; Cheque → active cheque-enabled Bank accounts only. Internal credit/advance allocations do not require a cash/bank account.
- Incompatible combinations such as Card + Cash on Hand are forbidden in UI and server validation.
- Choices are filtered by current BU, account status and access scope. If more than one compatible account exists, the user must be able to select the exact account/card/cash account used. Non-cash payment reference remains required where applicable; cash reference may remain optional.
- The exact selected/resolved payment account must be persisted on the operational source where applicable and flow into Finance → Posting Control → Accounting to determine the mapped GL account. A display-only account selector is not acceptable.

### Company Financial Accounts
- System Settings must support multiple Company Bank Accounts, Cash Accounts and Company Cards (including several accounts/cards at the same bank), with currency, Company/BU scope, GL mapping, defaults, and audit history.
- Bank accounts may be marked cheque-enabled. Cards may store issuer/network, last four digits, expiry and optional linked bank account.
- Accounts with history are never destructively deleted. Authorized users Close / Archive them and add new/replacement accounts; historical Finance/Accounting references remain intact.
- Closed/archived accounts are unavailable for new transactions. GL remapping after transactions exist is high-risk and requires controlled authorization/audit.

### Direct attachment upload
- Remove upload-time attachment preview, compression/resize, optimized-vs-original selection and readability confirmation throughout the system.
- Attachment fields show only: allowed file formats, maximum file size, and maximum number of attachments per upload.
- Validate these rules immediately in the UI. Valid files upload directly; invalid files show a clear inline error.
- Normal post-upload Open/Preview and Download Original actions may remain for stored documents.

## V30.21 mandatory requirements — Financial Integrity, Stored Attachment View & International Contacts

V30.21 extends V30.20 without changing the direct/simple upload rule. The new preview behavior applies only after a file has already been stored.

### Stored Attachment View
- Clicking an already uploaded receipt, evidence, attachment or document must open a View/Preview experience instead of immediately downloading the file.
- Use contextual actions such as View Receipt, View Evidence, View Attachment or View Document.
- PDF/images may preview in a modal; other formats may open in a new browser tab when browser-native preview is unavailable.
- The viewer must provide a separate explicit Download Original action. Upload-time compression, optimization and preview-before-store remain disabled.

### Exact payment source / destination account
- Every real payment or receipt must clearly identify the exact Company Financial Account used.
- Outgoing transactions show a Pay From Account selector; incoming transactions show a Receive Into Account selector.
- Cash, Bank, Card and Cheque methods continue to show only compatible active accounts/cards and preserve the exact selected account through Operational Transaction → Finance → Posting Control → Accounting.
- Purchase-token payments and other prefixed/embedded payment sections follow the same rule rather than being exceptions.
- Default Payment Account is used for outgoing transactions; Default Receipt Account is used for incoming transactions when multiple compatible accounts exist.

### Payment Reference Integrity
- Payment/reference fields must be validated in the UI before submission and rechecked against server data.
- Comparison is normalized so case, spaces, hyphens and common punctuation cannot bypass duplicate detection.
- The same normalized reference on the same Company Financial Account is a blocking duplicate.
- The same reference on a different financial account is allowed but should show a verification warning.
- Cash references may remain optional; non-cash references remain required.

### International Phone & Email Validation
- Phone entry throughout the system uses an international phone component with Flag + Country Name + Dial Code and a separate local-number field.
- When a country is already selected/known, the phone country code is selected automatically. The user may change the code manually.
- The stored phone value is normalized to E.164-style international form (for example +923002920550 or +821012345678) to improve duplicate checking and reporting.
- Email validation is immediate and UI-based across all forms, not limited to standalone Supplier/Buyer screens. Invalid email/phone values block submission and show inline errors.
- Supplier/Buyer and other supported contact masters perform duplicate checks using normalized contact values before save, while server-side validation remains the final protection layer.

## V30.22 mandatory requirements — Stability, Security & Workflow Hardening

### One mutation/review pipeline
- There must be only one shared form submission pipeline for consequential business forms: **validate → Review & Confirm once where required → protected processing/idempotency → save → refresh**.
- Contact/payment validation overlays must not register competing submit interceptors that can reopen Review & Confirm.
- Duplicate clicks and duplicate submissions remain blocked.

### Contact and public-auth isolation
- Login, Forgot Password and Reset Password use public-auth validation only and must never call authenticated Supplier/Buyer/Customer/User duplicate-check endpoints before authentication.
- Every Phone and Email field owns its own validation/error/helper element; validation state must never leak to another field.
- International phone input remains **flag + country + dial code + local number**, with smart country synchronization and normalized international storage.
- UI validation is an early usability control; server validation remains authoritative.

### Financial integrity
- Every interactive real-money payment/receipt identifies the exact Company Financial Account. Defaults may preselect but may not silently substitute for the user's selected Pay From / Receive Into account.
- Normalize payment references before comparison and persistence. Same normalized reference on the same active financial account is a blocking duplicate; the same reference on another account may be an informational warning.
- Duplicate-reference integrity must be enforced on the backend/database as well as checked in the UI.
- Finance → Posting Control → Accounting must retain the exact source/destination financial account.

### Private stored attachments
- Runtime `uploads/` is private application storage, not a public static web directory.
- Stored receipts/evidence/documents open through authenticated View/Download endpoints with BU/module/record/sensitive access enforcement.
- User interaction remains **View first → Preview/Open → Download Original if requested**. Upload-time compression/optimization remains removed.

### Authentication and secrets
- Sign-in is rate-limited/audited without revealing whether an email exists.
- Session lifetime follows effective Security settings. Password change/reset and account deactivation/archive revoke previous sessions.
- Password policy is centralized across user creation, password change and reset.
- Password reset lookup uses a cryptographic hash of the raw token and production reset URLs use trusted `APP_BASE_URL`.
- Encryption of stored application secrets uses a dedicated `APP_ENCRYPTION_KEY`; JWT signing and application-secret encryption should not share a key for new deployments.

### History and record lifecycle
- Audit history must never be deleted as part of normal user/account removal.
- A user with historical activity is archived/deactivated rather than physically deleted.
- Referenced business/financial records use archive/void/correction/reversal patterns rather than destructive removal; unused drafts may use controlled delete where safe.

### UI architecture rule
- Avoid excessive modals throughout current and future development. Short focused decisions/actions may use dialogs; heavy multi-section workflows, attachments, history and complex actions should use dedicated screens/pages.
- When a modal Close (X) is present it is positioned at the top-right. Dialog actions, Escape behavior, focus, scrolling and responsive behavior are standardized.
- Buyer Details/core account information appears before Pakistan Resale Profit Share; Pakistan-specific UI is shown only for eligible buyers.

### Backend/production hardening
- Generated transaction/document numbers use persistent transactional sequences rather than `COUNT(*) + 1`.
- New schema changes use a migration registry; historical migrations are progressively consolidated without breaking old databases.
- Production PDF runtime must include a supported Chromium/browser renderer and Korean/CJK fonts while browser-based PDF functions remain in use.
- Existing SQLite remains supported for the current single-instance launch; any later horizontal scaling requires a controlled database/storage architecture review.
- Money precision migration from historical SQLite REAL fields to fixed-decimal/minor-unit representation is a future accounting migration and must not be performed casually.

### QA
- Keep source/regression QA and add browser-level acceptance coverage progressively for Login, Forgot Password, Phone/Email validation, single Review & Confirm, exact financial account selection, duplicate references, stored attachment View/Download and Finance → Posting Control → Accounting.


## V30.22.1 Standing Regression Rules
- Contact validation messages are field-owned. A Phone/WhatsApp field must never render an Email validation message, and legacy validators must not compete with the active shared contact component.
- Public Login, Forgot Password and Reset Password use public format/token/password validation only; authenticated business-contact duplicate checks never run on those screens.
- User-facing action errors/warnings/success messages must render above modal/dialog/processing overlays; field-specific errors remain beside their fields.
- Non-count value fields accept whole numbers and manually entered decimals. Do not force decimal-point entry through HTML step-base configuration. True discrete count fields remain integer-compatible.
- Uploaded files are preserved byte-for-byte. Preserve original filename, extension, MIME type, byte size and SHA-256 metadata; stored-file preview uses authoritative MIME and Download Original restores the original filename.
- Attachment helper text must reflect the actual input capability. A single-file field says one file; a multi-file field shows its real contextual/system limit.


## V30.24 UI architecture safety rule
- V30.22.1 is the code baseline for V30.24; V30.23 automatic modal-promotion code is not inherited.
- Heavy workflows are converted explicitly in their own render functions to dedicated full-screen workflow pages.
- Never intercept or monkey-patch global `modal()`, `closeModal()`, `go()`, `modalRoot`, or form submission to simulate full-screen pages.
- Never use a MutationObserver to auto-promote dialogs.
- Short actions remain dialogs; full-screen workflows may intentionally open a short focused child dialog.
- Number-input normalization must be idempotent and must not create MutationObserver feedback loops.
- UI release acceptance requires browser-driven button/navigation tests in addition to static QA.


## V30.24.1 mandatory refinement requirements

V30.24.0 is the code baseline. V30.24.1 is a refinement/hotfix release and must not replace the safe explicit V30.24 full-screen architecture with automatic dialog promotion.

- Preserve parent record context after child workflows; nested workflows must unwind to the exact parent and affected records must refresh without returning to module lists. Buyer Payment/Advance must return to the same Buyer Detail/Profile.
- Use a shared dialog/preview header with non-overlapping title/subtitle, status, actions and Close control. Long filenames must be safe. Attachment previews must support View and Download Original using authenticated attachment routes.
- Finance correction duplicate checking must exclude the current Finance transaction and only block another active transaction with the same normalized reference on the same exact Company Financial Account.
- Existing correction evidence remains linked/visible and may satisfy evidence requirements; new/replacement evidence is optional unless no valid evidence remains or the correction specifically requires new evidence.
- Finance Full History must remain open until user close, return to the same Finance Verification context, and show human-readable Date/Time, User, Action, Status, Field Changed, Old Value, New Value and Reason/Note. Raw technical metadata is collapsed and restricted to authorized audit users.
- Final Documents do not expose Reopen. Normal users see View/Download only. Delete is archive/soft-delete, preserving file, metadata, linked record, prior status, reason, actor/time and audit. Archived Documents are separated and permission-controlled. Authorized Restore returns the item to its previous valid active/final state and is audited.
- Every date-filtered statement/report must apply From/To consistently to transaction rows and period activity summaries. Opening balance must carry pre-period activity where accounting logic requires it; closing/outstanding must reconcile from opening plus period movements.
- Statement PDFs must use professional branding/layout, statement period/generated information, readable tables/totals, stable page breaks and complete EN/KR presentation.
- Regression QA is release-blocking for parent/child context, Buyer return behavior, unchanged Finance reference correction, evidence reuse, history persistence, preview/header layout, document permissions/archive/restore, date-filter integrity and bilingual statement output.


## V30.24.2 standing nested-dialog and Finance-correction integrity

- Nested dialogs are system-wide LIFO workflows: a child Close (X), backdrop close or Escape may close only the topmost child, never its parent.
- A parent dialog/form must preserve unsaved values, file selections, selected record, scroll/focus context and return path while any child preview/history/dialog is open.
- Shared dialog/preview headers must reserve non-overlapping responsive space for title/details, status/actions, Download Original where applicable and Close (X), including long filenames.
- These rules apply equally to Finance, Accounting Posting Control, Buyers, Suppliers, Machines, Documents/SOPs, Attachments, Approvals, Reports and future modules using nested dialogs.
- During Finance correction/resubmission, retaining the current payment reference is valid. Duplicate checking must exclude every Finance/source mirror belonging to the same logical payment and block only a genuinely different active transaction using the same normalized reference on the same actual Company Financial Account.
- The legacy `Unassigned KRW Bank` clearing account may remain for historical integrity but must not be offered or accepted for new/corrected money movement when an actual configured Company Financial Account is required.


## V30.24.3 standing Numbering & References requirements

- **Central registry:** System Settings → Numbering & References is the authoritative registry for every system-issued numbered/reference identifier. It must not rely on a separately maintained partial list.
- **BU-separated presentation:** show Company / Shared and each authorized Business Unit separately. Users must not be presented with one mixed cross-BU prefix list.
- **Authorization:** CEO / Owner can view/manage all scopes. A System Administrator can view/manage only BUs for which effective `sensitive.system_admin` authority exists. Company / Shared changes remain CEO-controlled.
- **Automatic feature registration:** any new module/workflow that issues a numbered identifier must use/register with the central numbering service as part of that feature so its definition appears automatically in Numbering & References.
- **Historical immutability:** changing prefix, year/reset or padding rules applies only to future numbers. Previously issued references must never be rewritten.
- **Sequence integrity:** use persistent sequence counters and safe Company/BU override precedence; do not regress to COUNT-only numbering.
- **Conflict control:** normalize prefixes, visibly warn about inherited legacy conflicts, and prevent users from introducing a new conflicting prefix in the same scope.
- **Audit:** numbering changes require Review & Confirm, a change reason and before/after audit history.
- **Business/external references:** bank references, supplier invoice numbers, chassis/serial numbers and other externally supplied references remain source data and are not automatically replaced by internal numbering rules unless that workflow explicitly defines an internal system reference.
