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


## V30.25 system-wide Finance Integrity and Accounting Eligibility

- **Separation of concerns:** Operations records the business event; Finance records only genuine money movement; Accounting records recognition/settlement.
- **One real payment = one Finance entry:** a receipt/payment/advance/refund/transfer may create one primary Finance cash transaction. A sale, purchase, import, production event, invoice or allocation must not create a second cash row merely because it has a value.
- **Advances and allocations:** Buyer/Supplier advances remain genuine Finance movements. Allocating an already received/verified amount changes allocation/available-credit state only and does not create another Finance receipt/payment.
- **Accounting eligibility:** Finance-sourced postings require the linked Finance entry to be Verified. Non-cash operational postings require the source operation to be Completed/Approved and must not create a fake Finance Verification record.
- **Excavator Sale:** because sale completion requires 100% payment/advance, the sale-recognition posting is eligible only when the sale is completed and required buyer allocations are covered by Finance-verified buyer payments.
- **Manual accounting:** manual journals/adjustments follow Accounting approval controls directly.
- **Source visibility:** Posting Control must show source type/status, whether Finance verification is required, linked-payment status, payment-requirement status and a clear eligible/not-eligible result.
- **Logical payment identity/idempotency:** linked source, Finance, allocation, evidence and Accounting records must resolve to the same logical payment family so retries/double-clicks do not create duplicate cash movements.
- **Cash reference:** Payment Reference is optional for Cash. Blank Cash references never create Missing Reference warnings/errors and never run duplicate checking.
- **Finance correction/update:** preload the existing values/evidence. The current reference may remain unchanged; duplicate checking excludes the current logical payment family and blocks only a different active transaction on the same actual Company Financial Account.
- **BU-scoped selectors:** Buyer/Supplier/Seller/Customer master search controls may share UI technology but must only return records belonging to the active BU and effective user permissions.
- **Statements:** Buyer/Supplier profile/detail screens expose a Statement action where supported. Statement data is BU-scoped, date-filtered and context-preserving, with opening/period/closing balances and EN/KR-ready exports/PDF.


## V30.25.2 controlled development/test-environment reset

- Dedicated development/test/staging environments may expose **System Settings → Backup / Storage / Maintenance → Development / Test Environment Reset**. Production must keep this capability disabled.
- Backend enablement requires `APP_ENV=development` or `APP_ENV=testing` together with `ALLOW_TEST_DATA_RESET=true`; UI hiding alone is never sufficient. `APP_ENV=production` must never satisfy the reset guard.
- Destructive reset/restore requires CEO/Owner or authorized System Administrator + Storage permission, current-password verification, reason, typed confirmation, Review & Confirm and audit.
- Every reset creates a pre-reset snapshot containing the SQLite database **and uploads** before destructive work begins.
- Automatic pre-reset snapshot retention is restricted to **2 or 3** copies; default **3**. The reset process must prune older automatic snapshots.
- Quick Reset preserves core users/access/configuration while clearing operational test data, sequences and uploads.
- Full Reset recreates the active SQLite database and clears active uploads without detaching/formatting the persistent disk or deleting the protected pre-reset backup directory.
- Full Reset + Demo may invoke existing test seeders only when demo credentials are explicitly configured.
- Restore validates that the snapshot is inside the protected pre-reset backup directory and restores database + uploads together.
- Uploads-only clearing must be refused when active operational records would be left with broken attachment references.
- Full reset/restore is applied before SQLite opens on startup; never replace the active database file while it is open.


## V30.26.0 Excavator sale/payment lifecycle integrity

- Buy Machine supplier selection must load supplier-listed machines immediately on result selection. Supplier search must be full width and show useful supplier identity/context (location, contact/phone and available-machine count).
- Cash token-payment reference is optional; non-cash reference remains mandatory; evidence remains mandatory for any recorded payment.
- Machine-payment mutations must refresh the payment list, machine detail, balances, Finance/Accounting indicators and related history without manual reload. Nested payment dialogs must never reopen stale Add Payment state.
- Sell Machine must visibly highlight every missing/invalid required field and focus/scroll to the first unresolved field.
- Sale PDF must show supplier payment status, total valid paid and supplier outstanding; voided payments stay auditable but never count as paid.
- Sold/Completed machines have no normal Delete action. Authorized lifecycle actions are controlled Void Sale, Archive and Restore. Void preserves audit history and reverses sale-linked buyer allocation/Finance/Accounting effects while supplier purchase payments remain intact unless the purchase itself is separately voided. Archive is non-financial.
- Generated sale PDFs must open through authenticated attachment access and remain available from the machine/sale/Documents records.
- Update Sale must show the original settlement method(s), references, receipts, payment details and allocation status. Financial changes use reversal/replacement rather than overwrite; evidence/reference-only corrections preserve the cash event and audit history.
- Update Sale price changes recalculate settlement. Increase requires only additional coverage; decrease releases excess to buyer unallocated credit or an explicit refund/reversal.
- Add Another Payment is distinct from editing an old payment. Record New Payment always has Payment Amount. Allocate only up to sale outstanding; excess becomes buyer unallocated advance/credit; fully paid sales route new receipts entirely to buyer credit.
- Incoming buyer payment account wording is Receive Into Company Bank / Financial Account.
- Mixed buyer-advance/direct-payment settlements and excess receipts must be classified correctly in Accounting and Posting Control.
- Excavator Operations header does not duplicate Suppliers/Buyers sidebar navigation.


## V30.26.1 Excavator sell-launch and development reset hotfix

- **Buy Machine supplier autocomplete:** supplier matches render only as a floating dropdown attached to Search Supplier. The result menu must not remain as a persistent block under the field. Selecting a supplier closes/clears the menu immediately, keeps the selected supplier summary visible, and loads Supplier Available Machine. The menu may reopen only when the user focuses/types to change the supplier; Escape/click-away closes it.
- **Sell Machine regression:** Sell Machine and Update Sale launch from Machines / Deals and Open Machine must use the same stable workflow without page freeze. Any DOM observer used by the sale/payment UI must be idempotent and must not mutate the same observed node indefinitely. Duplicate/double-click sale launches must be single-flight guarded.
- **Development reset support:** the protected reset architecture may run in `APP_ENV=development` as well as `testing`, but only when `ALLOW_TEST_DATA_RESET=true`. All existing authorization, password, reason, typed confirmation, Review & Confirm, backup, audit and retention safeguards remain mandatory.
- **Development full reset:** Full Clean Reset removes/rebuilds only the active development SQLite database and active uploads on restart. It must not detach/format the Render persistent disk and must preserve the protected pre-reset backup directory.
- **Local development launcher:** locally generated `.env` enables the guarded development reset controls for the dedicated local test instance. Real credentials remain local and excluded from Git.
- **Render:** the Git-ready package must document the exact persistent-disk paths and development reset variables. Blueprint defaults keep the reset flag disabled; the user explicitly enables it only on the dedicated non-production Render development/testing service. Production remains `APP_ENV=production` + `ALLOW_TEST_DATA_RESET=false`.
- **Regression QA:** release checks must verify supplier dropdown close behavior, sell-launch observer safety/single-flight behavior, development/testing reset guards, local reset enablement and Render production-disable documentation.


## V30.26.2 Accounting-only Posting Control and Excavator follow-up integrity

- **Finance navigation:** Finance must not expose a Posting Control button/tab/workspace. Finance is for operational Finance entries, evidence, correction, verification/resubmission and read-only posting status.
- **Accounting navigation:** Posting Control belongs only to Accounting. Open Posting Control from Accounting, and use Back to Accounting rather than Back to Finance.
- **Source inspection:** An individual Accounting Posting Control item linked to Finance may expose a contextual **View Finance Record** action. This does not make Posting Control part of Finance navigation.
- **Workflow remains:** Operational Transaction → Finance Review/Verification → Accounting Posting Control → Official Ledger.
- **Buy Machine supplier autocomplete:** exactly one supplier result renderer is allowed. The canonical Search Supplier dropdown must set the actual supplier record/ID, close after selection, show supplier summary and load Supplier Available Machine. Legacy/general search enhancers must not wrap or duplicate this field.
- **Update Sale current settlement:** Current Sale Settlement displays only currently active payment/advance allocations to that sale. Historical, reversed or unallocated buyer receipts remain preserved in Buyer ledger/audit history and must not appear as duplicate active settlement rows.
- **Development reset:** all V30.26.1 development/testing DB/uploads reset and persistent-disk protections remain unchanged.


## V30.26.3 protected reset submission hotfix

- Development/Test Environment Reset dialogs must never submit as a native browser GET/navigation. Destructive reset credentials and confirmation values must never appear in URL query parameters, address-bar history, referrers, or normal navigation.
- Reset actions use a protected same-origin JSON POST request only after current-password, reason, exact typed confirmation and Review & Confirm validation. Full Clean Reset uses `POST /api/system-settings-v3252/test-reset/full`; equivalent POST-only behavior applies to Quick Reset, Full Reset + Demo, Clear Uploads and Restore.
- Reset submit controls are non-submit buttons and the form has a navigation-safe fallback. Enter-key submission must be explicitly prevented from native navigation. A single-flight guard blocks duplicate reset requests.
- The exact confirmation phrase is validated client-side before Review & Confirm: `RESET TEST DATA` for reset/clear actions and `RESTORE TEST BACKUP` for restore. Server-side validation remains authoritative.
- The global unsaved-form/beforeunload guard must not intercept an accepted protected reset. `formDirty` is cleared only after the reset API accepts the request; a restarting response may then reload the page.
- If an older build leaked `reason`, `password`, or `confirmation` into the current reset page URL, the current page entry is scrubbed with `history.replaceState`; users must still rotate any password that was previously exposed.
## V30.26.4 direct reset-button binding hotfix
- Development/Test reset dialogs must bind their destructive action button directly with a runtime `click` listener after the modal is rendered; do not rely solely on inline event attributes.
- The reset form submit event must also be directly intercepted with `preventDefault` / `stopPropagation` and must call the same protected reset runner.
- Browser validation and exact typed confirmation must occur before Review & Confirm.
- All reset actions remain authenticated JSON POST requests. Reason, password and confirmation must never be placed in a URL, query string or browser history.
- The action must show an explicit user-visible error if the reset form cannot be initialized.



## V30.27.0 Pakistan Resales, settlements and cross-border bank transfer

- Pakistani Excavator buyers must have a dedicated **Pakistan Resales** page from Buyer Details; normal Buyer Details must not embed payment/settlement controls for resale profit.
- A Pakistan resale record contains the machine/deal, resale date, resale price PKR, resale profit PKR, Our Share %, derived Our Share Amount PKR, notes and optional resale evidence. Payment receipt/date/reference/received controls belong to a separate settlement workflow.
- **Our Share Amount = Resale Profit × Our Share % ÷ 100**. The UI shows the value read-only and recalculates live; the backend independently recalculates and stores the authoritative value.
- Resale settlement status is derived from active allocations (Share Due / Partially Received / Settled) and is not manually marked received.
- One Pakistan resale-profit payment is one receipt/Finance event and may allocate to multiple resale records. Support partial allocations, multiple payments per resale, unallocated resale credit, controlled reallocation, refund and void/reversal while preserving history.
- Pakistan resale unallocated credit is separate from normal Buyer Advance/Credit. It must not be silently used for Korea machine purchases or reclassified without an explicit controlled action.
- Pakistan resale-profit receipts and resale-credit refunds may use only active configured Company Bank Accounts with **Bank Country / Account Country = Pakistan** and PKR currency. Korea/other-country accounts must be excluded in UI and rejected by backend validation.
- Company Financial Accounts require Bank Country / Account Country for Bank accounts. Country is independent from currency and must be available in Add/Edit/Review/history/audit and effective account selectors. Existing accounts without country require controlled maintenance before country-restricted use.
- Optional movement of resale funds Pakistan → Korea is a separate inter-account transfer, never a buyer payment or income event. Record Pakistan source account, Korea destination account, source PKR, FX rate, actual destination KRW, bank/remittance fees, date, reference, evidence and status.
- Pakistan→Korea transfers use active Pakistan PKR source Bank accounts and South Korea KRW destination Bank accounts. They remain Finance-reviewable and flow to Accounting Posting Control.
- Accounting must keep **Pakistan Resale Profit Share Income / Credit** separate from **Korea Excavator Sales Revenue / margin**. Bank transfer entries move bank balances only and may recognize bank fees and FX gain/loss; they never reclassify Pakistan resale profit as Korea profit.
- CEO consolidated reporting may optionally total company profit, but Pakistan resale and Korea machine-trading components must remain separately identifiable and drillable.
- Preserve the Finance Integrity Rule: one real receipt/refund/transfer = one Finance source record; allocations are child subledger records, not duplicate Finance payments.


## V30.28.0 QA and Finance/Accounting data-integrity requirements

- Buyer Detail must show only one Pakistan Resales action for eligible Pakistani buyers.
- Editing an existing buyer from Buyer Detail must return to and refresh that same Buyer Detail context after save.
- Finance and Accounting sidebar counters are independent. Finance must never include Accounting Posting Control counts.
- Remove the redundant Daily Finance guide card while retaining the page title, KPIs, filters/tabs and Finance records.
- Accounting overview must clearly distinguish official Posted GL values from current operational subledger balances and pending/unposted work.
- Buyer Advances operational balance must reflect active receipts less active allocations/refunds.
- Supplier Payable operational balance must reflect purchase price less valid paid supplier Purchase payments and must reach zero when fully settled.
- Pre-sale Excavator machine purchase and eligible cost items remain capitalized in Excavator Inventory. On completed sale the eligible accumulated machine cost moves to COGS/Expense under the existing Accounting Posting Eligibility rules.
- The Accounting overview must expose Machine Inventory / Capitalized Costs, Pending Accounting, and Finance Awaiting Verification so costs do not appear to disappear while awaiting posting.
- Sold / Completed Machines / Deals cards must not show + Cost, Update Sale or Payments actions.
- Sell Machine must visibly highlight every currently missing/invalid required field and clear the highlight as valid data is entered.
- International phone country-code selectors must support type-to-search by country name, ISO code and dialing code.
- Statement PDFs must wrap and align transaction descriptions professionally without scattered/truncated layout.
- All affected Finance, Accounting, Dashboard/KPI and sidebar data must refresh from the correct source after successful mutations without cross-module double-counting.

## V30.29.0 workflow UX, verification and settlement requirements

- **Buyer/Supplier list responsiveness:** use the available content width; long names, addresses, contact values and labels wrap/multiline rather than forcing ordinary desktop/laptop/tablet horizontal scrolling. The Actions area remains visible at the right; narrow screens may use stacked/card presentation.
- **List toolbar placement:** Buyer and Supplier Search controls are right-aligned on normal desktop/laptop widths, with `+ Add Buyer` / `+ Add Supplier` immediately to the right of Search.
- **Phone country code:** phone forms use one searchable country-code selector beside the phone number. Search happens inside that selector by country name or dialing code; do not show a second standalone country-search field.
- **Supplier list actions:** the supplier list uses `Open | Edit | Delete`. Machines and Requirements move inside the Supplier Open workspace rather than remaining separate row actions.
- **Supplier workspace:** Open launches one full-screen Supplier Detail workspace with Back navigation and no redundant Close (X). It includes Overview, Machines, Requirements and Payments / Account plus Supplier Statement access. Payment/account visibility includes Total Purchases, Total Paid, Outstanding Payable, Last Payment, Payment Status and recent payments supported by existing records.
- **Combined sale settlement:** Sell Machine supports Buyer Advance only, New Payment only, and Buyer Advance + New Payment. The user may choose the advance amount to allocate and record only the remaining real receipt as new money. Existing advance allocation is not a second Finance receipt. New receipt excess becomes Buyer Advance/Credit. The server remains authoritative and Review & Confirm shows the complete settlement split.
- **Posting Queue amount clarity:** the queue's primary amount is the source/transaction business amount, not the sum of unrelated debit lines. For a machine sale, Posting Review separately shows Sale Amount, Machine Cost / COGS, Gross Profit, Journal Debit Total and Journal Credit Total.
- **Finance Verification traceability:** every cash-movement verification view identifies the exact configured Company Financial Account used. Incoming cash shows `Received Into`; outgoing cash shows `Paid From`, with account name/type, institution, country, currency and safe/masked identifying details where available.
- **Finance sidebar badge:** the Finance badge is sourced only from Finance-actionable records using the same operational scope as Finance review. It excludes Accounting-only work, completed/hidden/stale records and disappears when the count is zero.
- **Statement filtering:** changing From/To and pressing Apply refreshes the currently open Buyer/Supplier Statement dialog in place. Repeated Apply actions must never stack duplicate statement modals.
- **Pakistan Resales action:** eligible Buyer Detail screens contain exactly one Pakistan Resales action regardless of repeated navigation/render enhancers.
- **Pakistan Resale Profit Payment allocation:** record the receipt once, select eligible machine/resale obligations with checkboxes, and automatically allocate the receipt up to each selected outstanding share. Excess remains Pakistan resale unallocated credit. Manual partial allocation may exist only as an explicit advanced workflow, not the default entry method.
- **Pakistan resale protected commit:** Review & Confirm must work. The review shows payment amount, Pakistan financial account, method/reference/evidence, selected machine allocations, unallocated credit and balance impact before the transaction commits. Validation failures must be visible; the button must never fail silently.



## V30.30.0 receiver-account, jurisdiction routing, resale-credit and statement requirements

- **Outgoing payment dual-side traceability:** Bank/Card/Cheque/Wallet outgoing money, including buyer refunds, must record the Company Financial Account used as `Paid From` and the receiver/payee destination used as `Paid To`. Saved Supplier/Buyer payee accounts are reusable; historical Finance records preserve immutable destination snapshots.
- **Finance Verification:** reviewers must see both company-account and receiver-account details needed to verify the actual money path before verification/Accounting eligibility.
- **Smart Company Financial Accounts:** account selectors are filtered by BU, active status, permissions, transaction country/jurisdiction, currency, payment method and cash direction. Pakistan Resales use eligible Pakistan PKR Company Bank accounts. Ordinary Korea-side Excavator receipts/payments/costs use eligible South Korea company accounts. Backend validation mirrors UI filtering. Inter-country movement uses the dedicated transfer workflow.
- **Country-scoped defaults:** receipt/payment defaults are scoped by BU + Account Country + direction so Korea and Pakistan defaults can coexist. Changing a default affects future selection only.
- **Pakistan Resale Unallocated Credit:** already-received unallocated resale credit may be allocated later to selected machine resale obligations without creating another Finance receipt.
- **Pakistan Resale Credit Refund:** available resale credit may be refunded to the buyer, limited to available credit and paid from an eligible Pakistan account to a recorded buyer destination account with reference/reason/evidence. A refund is one real outgoing Finance event.
- **Pakistan Resale Credit + New Payment:** a settlement may combine existing resale credit and new money. Existing credit creates allocations only; only new money creates a Finance receipt; excess new money remains unallocated resale credit.
- **Resale credit visibility:** Pakistan Resales exposes received, allocated, refunded and available/unallocated credit plus Record Payment, Allocate Credit and Refund Credit/combined settlement actions.
- **Finance screen scope:** remove redundant Revenue/Gross/Expenses/Net profitability card from Daily Finance; profitability belongs to Accounting/Reports/Dashboard.
- **Professional EN/KR statement PDFs:** Finance/Buyer/Supplier and related ledger statements use professional glyph-safe fonts, normal letter spacing, true multiline Description/Reference wrapping, dynamic row heights, stable numeric columns and no overlap. Known system labels localize to Korean in KR mode; genuine business data remains as entered.

## V30.31.0 lifecycle integrity, void/reversal and Posting Control requirements

- **Supplier Save:** Add Supplier Save must validate, save once, close the dialog after success and refresh the Supplier list. Validation errors keep the current form open with clear feedback.
- **Single workflow navigation:** full-screen workflows use one clear Back/navigation path. Do not show redundant Back + Close/X + duplicate breadcrumb navigation for the same parent transition. Keep working headers compact.
- **Accounting working space:** minimize oversized Accounting introductory/header sections so Posting Control and accounting data remain the primary visible work area.
- **Sidebar scrollbar:** keep sidebar scrolling functional while making the visual scrollbar thin/unobtrusive.
- **Central lifecycle policy:** Void, Cancel, Delete, Reverse and related actions are controlled by record type + current stage + permission + approval state + accounting period + downstream dependencies. Buttons are shown only when the action can actually proceed.
- **Terminology:** Delete is limited to genuinely unused/unlinked drafts/setup records; Cancel stops an incomplete workflow; Void invalidates an unposted/unsettled record while retaining history; Reverse counteracts a verified/posted/financially effective record with linked reversal entries.
- **Posted records:** an Accounting Posted transaction is never destructively voided/deleted. Show Request Reversal, preserve the original Posted journal and create a linked reversal proposal/journal with full audit traceability.
- **Finance stage rules:** unverified eligible Finance may Request Void; Finance Verified but unposted uses a controlled void/reversal and cancels/invalidate pending Accounting proposal; posted records require reversal; already voided/reversed records do not expose a second Void; unsafe closed-period/dependency cases are blocked or require authorized adjustment.
- **No silent destruction:** material Void/Cancel/Reverse/Correction preserves the original record, requires reason (and evidence where required), records requester/approver/time/status and keeps linked history for audit.
- **Impact Review & Confirm:** before lifecycle execution, show all affected entities including source transaction, machine/product/inventory, buyer/supplier balances, Finance, Accounting/reversal, allocations, COGS/profit, documents/reports and required approvals. If every linked entity cannot be updated safely, block the action rather than apply a partial mutation.
- **Linked entity synchronization:** successful void/reversal updates the linked machine/product/inventory/payment allocation, buyer/supplier balance, Finance, Accounting, dashboard/report and other downstream state consistently. Stock already consumed/transferred and machine costs already included in sold-machine COGS require controlled downstream reversal/adjustment.
- **Affected-user notification:** notify relevant Finance, Accounting, BU/operations and original-entry users when a lifecycle action materially affects their linked records, with action/reason/affected-source context.
- **Machine costs:** do not destructively Delete recorded machine costs. Use Edit + Void/Request Reversal according to stage. A voided cost remains visible with clear status/reason/audit, is excluded from active cost totals, and linked machine cost basis/COGS/profit is recalculated where applicable.
- **Finance Verification source clarity:** machine cost/token/payment verification must show the linked machine/deal and source details needed to understand the record.
- **Correct & Resubmit:** preserve the original source transaction structure and evidence/history. Do not introduce unrelated mandatory fields such as Counterparty where the original machine-cost workflow did not require them. Save & Resubmit must return the corrected record to Finance verification with an auditable correction chain.
- **Supplier payment type:** Supplier/Machine supplier payment entry must not offer Sale; only valid supplier purchase-side payment types/workflows are allowed.
- **Posting Control eligibility:** Finance-linked cash/payment proposals enter the actionable Accounting Pending Review queue only after Finance = Verified. Finance-not-ready/correction/void/reversal-in-progress items are excluded from the actionable queue but may remain in all/history/waiting-source views for traceability. Non-cash operational proposals remain eligible after the source is Completed/Approved.
- **Accounting badge:** the Accounting sidebar badge counts only actionable Posting Control items that currently meet posting eligibility.
- **Audit chain:** auditors must be able to trace Original Source → Finance → Verification/Correction → Accounting Proposal → Posted Journal → Void/Cancel/Reversal → linked reversal/updated operational source → final balances without any material record silently disappearing.



## V30.32.0 UI/account-flow refinement requirements

- **Receiver/Payee modal stability system-wide:** account Save/Archive refreshes the existing modal in place, resets the entry form and never recursively opens/duplicates the same modal. One Close returns to the correct parent workflow.
- **Sidebar scrollbar:** use a minimal-width scrollbar for left navigation without clipping or reducing usability.
- **Accounting top chrome:** remove redundant explanatory text/banners and place Posting Control compactly beside `+ Manual Journal`, preserving pending status/count where practical.
- **Buyer Detail action stability:** Buyer Statement, Pakistan Resales and Payment Accounts render in a stable action row without flashing or layout shift.
- **Supplier payment dual-side accounts:** all purchase-side supplier payments identify both the Company Financial Account (`Paid From`) and Supplier Receiver/Payee Account (`Paid To`). Existing payee accounts are selectable and new accounts can be added in context.
- **Machine-cost receiver responsiveness:** `Paid To · Receiver Account` uses modal width intelligently with two columns where space permits and one column on smaller widths.
- **Finance correction context:** Correct & Resubmit shows and prefills all important original transaction data, including Paid From, Paid To, source record, amount/currency/FX, dates, method/reference, status, evidence/receipt, notes and relevant allocation context. Corrections update/resubmit the existing logical payment and must not create duplicate Finance money movement.

## Standing UI Architecture Rule — Targeted Refresh / Partial Revalidation

This is a mandatory platform rule for current cleanup **and all future feature development**.

- After any create/update/delete/approval/payment/void/correction/posting or other mutation, refresh/revalidate only the data scopes actually affected by that action wherever safe.
- Keep unaffected page sections, headers, tabs, filters, scroll position, modal/workflow context and sidebar state stable. Do not remount/reload the whole page merely to refresh one table/card/balance.
- Show a compact localized loading spinner/state only inside the affected section while its data is being updated.
- Prefer deterministic in-place UI updates followed by background verification. Otherwise re-fetch only the relevant endpoint/query/section.
- Every mutation must define its refresh/invalidation dependencies, including linked Finance, Accounting, stock, balances, approvals, action counters, dashboards or documents when applicable.
- Prevent duplicate/cascading refresh chains. One Save/action must not trigger repeated full-screen loading or multiple overlapping re-renders.
- Existing Finance Integrity, Accounting Posting Control, approval, audit, stock and balance consistency rules remain authoritative; UX optimization must never leave linked data stale.
- New features must use the shared targeted-refresh helper/pattern and must pass targeted-refresh QA before release acceptance.

## Standing UI Architecture Rule — Stable UI Chrome / Slow-Connection Rendering

All current and future screens must keep persistent page chrome stable while child data changes. Top action bars, workflow toolbars, navigation tabs, and entity action buttons must not repeatedly unmount/remount during tab changes, background revalidation, or linked-data refreshes. Local tab switches must update only the selected body/content region. Detail refreshes must preserve unchanged action DOM where practical, coalesce duplicate in-flight refreshes, and keep current page/tab/scroll/workflow context. On slow connections, unaffected controls must remain usable and visually stable; localized busy indicators belong only to the affected section. This rule is part of QA acceptance for all future feature development.

## V30.35.0 — Workflow Validation & Shared Pagination Integrity

### Buy Machine payment-account integrity
- A token payment must show one authoritative Pay From company financial account field and one Paid To supplier receiver account field, in that order.
- Existing supplier selection should preselect the supplier's active default compatible receiver account where available.
- Receiver-account loading should avoid duplicate requests where practical; Add / Manage Accounts is a nested child workflow and must restore the same Buy Machine parent context on close.

### Form validation interaction
- Interactive field error styling must not distract the user while typing.
- Validate fields when the user leaves the field (blur), and validate all authoritative rules again on Save / Submit.
- Backend validation remains authoritative for permissions, financial integrity, uniqueness, lifecycle and cross-record rules.

### Sell Machine settlement amount integrity
- Record New Payment defaults/synchronizes Payment Amount to the current sale settlement requirement.
- Buyer Advance + New Payment records only the New Payment Required after the chosen buyer-advance allocation; it must not blindly force the full selling price into the cash receipt.
- Receipt/evidence, account, method/reference and Finance linkage rules remain applicable to the actual new-money portion.

### Sold/posted edit controls
- Purchase Edit is hidden/blocked for normal users once the machine is Sold / Completed; CEO / Owner access remains controlled and auditable.
- A machine cost linked to Finance Verified / Accounting Posted history cannot be directly overwritten. Use controlled Finance correction, void/reversal and replacement so the original transaction, inventory/COGS/profit impact and audit history remain traceable.

### Posting Control and Finance filters
- Accounting Posting Control uses a compact queue presentation without redundant introductory summary chrome and includes From / To date filtering.
- Finance transaction review includes From / To date filtering composed with search, status, type, evidence and other active filters.

### Shared high-volume pagination
- Potentially large tables/lists use a shared pagination pattern. Default page size is 25; 25 / 50 / 100 are offered where appropriate.
- Show current range and total, plus Previous / Next and page state; mobile may simplify the page indicator controls.
- Search, sorting, status filters, date range and other filters are applied before pagination. Changing the visible result set resets or clamps the current page safely.
- Preserve current screen chrome, parent workflow and scroll/context where practical; mutations refresh only affected data/current scope.
- Small fixed configuration lists and short dropdowns do not require pagination.
- Prefer server-side pagination for endpoints that grow beyond practical bounded result sets; the shared UI paginator is the compatibility layer for existing bounded list APIs until each endpoint is moved to paged queries.

### Stable UI / slow connection rule remains mandatory
- V30.34 stable chrome and V30.33 targeted-refresh rules remain release-blocking. Loading data must not unnecessarily rebuild the sidebar, page header, tabs, workflow toolbar, parent dialog or unrelated sections.


## V30.36.0 — Complete Browser Button Audit & UX Hardening

- Browser acceptance must exercise rendered controls in the real frontend, not rely only on source grep. Generic crawls must be supplemented by state-aware workflows for permission-gated, lifecycle-gated, stock-gated and mounted/persistent panels.
- Validation must remain quiet while the user is actively typing. Input handlers may sanitize values but must not call `checkValidity()`/`reportValidity()` or trigger remote duplicate checks merely because text changed. Visible field validation occurs on blur; authoritative validation runs again at Save/Submit.
- Blur-time validation must inspect validity without dispatching a browser `invalid` event that steals focus. Focus/scroll-to-error behavior is reserved for an actual failed Save/Submit/review action.
- Search, status, sort, date range and other result-set-changing controls reset the affected paginator to page 1 before rendering the new filtered result set. This applies to Finance, Posting Control, Excavator Machines and all shared high-volume paginated lists.
- Nested child workflows such as Add/Manage receiver accounts must close back to the exact parent workflow and preserve entered state/context.
- Release acceptance retains V30.33 targeted-refresh and V30.34 stable-chrome rules: browser hardening must not introduce page reloads, unrelated remounts, duplicated refresh chains or slow-connection UI flicker.
- Browser/source event-handler audit should report unresolved action handlers; release-blocking handlers must not be missing or dead.


## V30.37 — Profile Sections / Counterparty Accounts / Responsive Filter Bars
- Buyer and Supplier account-management actions must use one shared, context-preserving counterparty account manager.
- Supplier profile must separate Payments from Accounts.
- Buyer profile keeps Buyer Details visible and exposes only one selected section at a time: Payments & Advance, Advance Refunds, Machines Sold, Requirements, Documents, Accounts.
- Payment Accounts must not be a disconnected top action on Buyer Detail; it belongs to Accounts.
- Account child dialogs must return to the same parent record/form and refresh only affected account selectors/sections.
- Finance and Accounting Posting Control must use the same responsive Search / Date Range / status filter pattern on desktop, tablet and mobile.
- Filter changes must retain targeted-refresh/stable-chrome behavior and reset the applicable pager to page 1.


## V30.38.0 — Account Management, Pakistan Resales, Buy/Sell Settlement & Filter Controls

- **Shared counterparty accounts:** Buyer/Supplier receiver/payee accounts use one shared manager and support Add, Edit/Update, Default, Archive and History. Consequential changes use Review & Confirm, permission checks, audit/history and EN/KR localization. Used accounts are archived rather than destructively deleted.
- **Historical payment integrity:** editing an account master must never rewrite historical Finance/payment receiver snapshots. Past transactions continue to show the actual receiver details captured at transaction time.
- **Buy Machine account integrity:** Pay From and Paid To are distinct and independently validated. Existing supplier defaults refresh reliably. A supplier created inline during Buy Machine can also receive a receiver account in the same workflow; supplier/account/purchase/token-payment linkage must remain consistent and child account management must return to the exact Buy Machine context.
- **Pakistan Resales section pattern:** use one selected section at a time with exactly Overview, Resale Records, Payments & Settlements, Credit, Refunds, Pakistan → Korea Bank Transfers and Documents. Preserve the selected section after child actions/refresh. Do not combine Pakistan resale profit accounting with Korea machine-sale profit accounting.
- **Pakistan → Korea transfer integrity:** this remains a separate inter-account cash movement; it does not create new resale income. Existing Pakistan-source/Korea-destination jurisdiction and account restrictions remain authoritative.
- **Canonical Sell Machine settlement:** browser display and backend validation must use the same settlement formula. Selling price, current allocation, settlement mode, payment source, buyer advance, new-payment amount, currency and FX all feed one authoritative result. Every relevant input change immediately updates dependent values and required fields.
- **Combined sale settlement:** support Buyer Advance only, New Payment only, and Buyer Advance + New Payment. Example: ₩15,000 sale with ₩10,000 available/selected advance requires exactly ₩5,000 New Payment. Short/inconsistent settlement must be visibly invalid and server-blocked.
- **Settlement clarity:** show Sale Price, Existing Allocated, Coverage Required, Buyer Advance Used, New Payment Required, New Payment Entered, Buyer Credit Added and Resulting Outstanding from the same calculation state.
- **Finance/Accounting filters:** use the shared responsive/collapsible filter pattern. Accounting posting-status controls stay outside the collapsible area and remain visible. Preserve filter state through normal UI refreshes and reset the relevant pager to page 1 when result-set filters change.
- **No regression:** V30.33 targeted refresh, V30.34 stable UI chrome, V30.35 pagination, V30.36 browser hardening, V30.37 profile/account routing, permissions, sold-machine safeguards, verified/posted machine-cost locks, Review & Confirm and Render persistent-storage rules remain release-blocking.


## V30.38.1 — Sell Machine Validation & Buy Machine Token Account Hotfix

- **Point-versioning:** focused bug fixes after V30.38.0 use point releases rather than jumping to a new major/minor release line unless the scope materially expands.
- **Sell Machine validation presentation:** required/invalid fields remain visually neutral before interaction. Invalid styling appears on field interaction/blur or failed Save/Complete Sale, and immediately clears when the value becomes valid. This applies to New Buyer/Other and existing-buyer paths and every conditional Sell Machine field.
- **Validation authority:** the UI may clear stale presentation/custom errors when the relevant value is valid, but backend settlement, account, country, reference, evidence, permissions and lifecycle validation remains authoritative.
- **Buy Machine Add / Manage Accounts:** Token Payment account management must always open the final shared supplier receiver-account manager as a child workflow and return to the exact Buy Machine parent context.
- **Pay From / Paid To selectors:** show every eligible active account, stay enabled/selectable even when only one eligible account exists, prefer the active Default where available, and refresh after account Add/Edit/Default/Archive.
- **Slow-connection account loading:** prefetch company accounts when Buy Machine opens and supplier receiver accounts as soon as supplier context is known. Load Pay From and Paid To in parallel where possible, avoid duplicate requests with short-lived safe caching, and show localized loading/error states rather than an empty/broken selector.
- **Compatibility:** account loaders tolerate supported legacy response shapes and historical bank-account rows lacking newer method metadata without weakening backend account eligibility checks.
- **No regression:** V30.38 canonical Sell Machine settlement, shared account manager/history, Pakistan Resales, Finance/Accounting filter behavior, historical snapshots, targeted refresh, stable UI chrome, pagination, Review & Confirm and Render persistence remain release-blocking.

## V30.38.2 — Refund Settlement, Modal Lifecycle, Token Account Interaction & Machine Costs

- **Point release discipline:** focused bug fixes/refinements continue on the V30.38.x patch line unless scope materially expands.
- **Buy Machine Token account interaction:** Pay From and Paid To must remain stable/open during normal mouse/touch selection; all eligible active accounts must be selectable, including switching away from Default. The underlying submitted account IDs remain authoritative and all backend eligibility rules remain enforced.
- **Token Add / Manage Accounts:** must invoke the final shared Supplier Accounts manager as a nested child, preserve the full Buy Machine parent state, and refresh/reselect affected Paid To data after successful account mutations.
- **Account-loading integrity:** retain V30.38.1 parallel/prefetched/cached loading and localized slow-connection states; account controls must not be repeatedly rebuilt while the user is actively choosing an option.
- **Shared cash-refund settlement:** genuine cash refunds use Refund Currency + Refund Amount. KRW refunds use FX 1; foreign refunds require FX Rate to KRW. Show Available Before, Refund Amount/Currency, KRW Equivalent / Advance Deduction and Remaining After before confirmation. KRW-backed advances/credits deduct only the KRW equivalent.
- **Refund account-currency integrity:** direct Paid To receiver-account currency must equal Refund Currency and direct Pay From company-account currency must equal Refund Currency. Filter UI choices and enforce backend validation. A different-currency funding source is an explicit FX-conversion workflow, not a silent mismatch.
- **Refund scope:** apply the shared cash-refund rules to Buyer advance refunds, Supplier advance returns, customer/store cash-credit refunds and comparable real-money returns. Do not blindly apply cash-refund rules to non-cash voids, credit notes or accounting-only reversals.
- **Modal success lifecycle:** after a confirmed successful Create/Save/Update/Submit/Approve/Complete/Receive/Record/Allocate/Archive/etc. mutation in a dialog, close only the active/topmost child and refresh affected parent data in place. Preserve parent record, tab/section, filters, pagination, selections and scroll where practical. Validation/API failure leaves the dialog open. Protected processing prevents duplicate submission.
- **Machine Costs layout:** action controls align right; entries use a bounded vertical viewport (about 3–4 rows before scroll); Total machine cost stays permanently visible outside the scroll region; voided rows remain distinct.
- **Locked Machine Cost UI:** verified/posted records show a compact disabled `🔒 Edit` control instead of a large yellow lock card. Backend lock enforcement remains authoritative. Void retains its separate permission/lifecycle rules.
- **No regression:** preserve V30.33 targeted refresh, V30.34 stable chrome, V30.35 pagination, V30.36 browser hardening, V30.37 profile/account routing, V30.38 settlement/account history, V30.38.1 validation/account-loading, Review & Confirm and Render persistence.


---

# System-Wide Performance, Async Interaction & Scalability Standard — V30.39+ PERMANENT CARRY-FORWARD RULE

This section is mandatory for **every existing module, every future change, every new Business Unit, every integration, every migration, and every future Blue Ocean Market release**. It is not a one-time optimization checklist. New development must inherit these rules automatically and QA must treat regressions as release blockers.

## 1. Immediate action feedback and protected processing
- A user action that can wait on network/server work must never appear ignored.
- The triggering control must react immediately. When work starts, use a contextual spinner/label such as `Saving…`, `Recording payment…`, `Receiving import…`, `Generating PDF…`, `Approving…`, or the Korean equivalent.
- Disable the active trigger while the same operation is in flight and preserve button width to avoid layout jump.
- Normal actions use button-level feedback; important transactional workflows also lock the active modal/card/section; only system-level destructive/maintenance operations may lock the whole workspace.
- After ~3.5 seconds without completion, show a truthful indeterminate `Still working…` state. Never display fake percentage progress.
- On success, update the affected data and show success feedback. On failure, unlock the UI and show a clear retryable/non-retryable error.
- All states must be fully EN/KR localized.

## 2. Duplicate-submit and financial idempotency rule
- The first valid mutation immediately enters an in-progress state; repeated clicks must not create repeated requests.
- Financial/high-integrity mutations must use backend idempotency/duplicate protection in addition to the UI lock.
- Lost responses/retries must not create duplicate payments, receipts, refunds, transfers, allocations, sales, purchases, stock movements, postings, voids, approvals, or other irreversible records.
- A retry after an uncertain network result must verify/replay the existing operation where possible rather than blindly create another transaction.

## 3. Targeted refresh / stable UI rule
- After a mutation, refresh only the affected record/row/card/KPI/list scope. Do not reload unrelated modules or reconstruct the whole application.
- Preserve parent screen, active tab/section, search, filters, sort, page, selection and scroll position where practical.
- Nested child success closes only the correct child workflow and refreshes its parent in place.
- Clicking an already-selected sidebar tab remains an explicit user refresh; mutations must not simulate a full-tab refresh unless technically required and documented.

## 4. Large-list server-side pagination rule
- Any list/table that can grow materially must support real database/API pagination; hiding rows in the browser is not sufficient for the scalable path.
- Standard page size is 25 with 25/50/100 choices where appropriate.
- Search, permission scope, BU scope, status/date filters and sorting are applied **before** pagination in the server/database query.
- Changing search/filter/sort resets to page 1.
- Responses must expose total/range metadata (`1–25 of 3,482` equivalent).
- Small fixed settings lists and short dropdown enumerations are exempt.
- New high-volume endpoints must use the shared V30.39 pagination helper rather than inventing a new paging contract.

## 5. Shared request layer rule
- New code must use the shared request infrastructure rather than creating ad-hoc network behavior.
- Identical in-flight GETs must be reused/deduplicated when safe. Do not use stale caching for volatile financial balances or transactional state.
- Remote search/autocomplete uses debouncing (normally ~300 ms) and cancels superseded searches.
- Requests must have defined timeout/error behavior and must leave no permanent spinner on failure.

## 6. Frontend runtime / lifecycle rule
- V30.39 consolidates the historical browser compatibility chain into one ordered runtime asset for delivery. Historical source patches remain for traceability but are not individually loaded by the browser.
- Do not resume indefinite `vXXXX-client.js` stacking in the live page. Future functionality belongs in the current maintained module/runtime and the release build is regenerated.
- New features must prefer explicit component/workflow lifecycle hooks over document-wide `MutationObserver` patching.
- Adding a new document-wide observer requires a documented justification and performance QA; the V30.39 observer baseline must not grow casually.

## 7. Heavy work must not block normal requests
- Chrome/PDF generation, large exports/imports, backups, migrations and similarly expensive external/process work must be asynchronous/non-blocking relative to the Node event loop where practical.
- Do not introduce `execFileSync`, `spawnSync`, large synchronous CPU loops, or equivalent request-path blocking for user-facing jobs without an explicit reviewed exception.
- Long jobs must use the shared processing UX so other users can continue working.

## 8. Static/network efficiency rule
- Versioned JS/CSS/text assets should use compression and safe browser caching.
- HTML shell and dynamic authenticated API data must not be cached in a way that produces stale application/financial state.
- API payloads should return only what the active screen needs. List endpoints should use summary rows; detail/history/attachments load separately when needed.
- Attachments load metadata/preview first; do not transfer full receipt/document bytes merely to render a list.

## 9. Database/query performance rule
- Keep WAL and safe concurrency settings. Optimize measured queries, not guesses.
- Slow endpoints/queries must be measured and investigated with query plans before adding indexes.
- Use targeted/composite indexes aligned with actual BU/status/date/join/sort patterns; avoid uncontrolled index proliferation.
- V30.39 provides optional SQL profiling (`BOM_SQL_PROFILE=true`) and slow-request logging. Future development should use these during QA when changing high-volume queries.
- SQLite remains supported during development. PostgreSQL migration is a production-capacity decision, not a substitute for inefficient application/query design.

## 10. Dashboard aggregation rule
- Dashboards/KPIs should be calculated by compact aggregate queries/APIs (`SUM`, `COUNT`, grouped summaries) rather than downloading transaction history and calculating totals in the browser.
- Dashboard refreshes should update only the relevant metrics and must not force unrelated transactional lists to reload.

## 11. Performance budgets / release gate
Targets are engineering targets under normal test conditions, not promises for every internet connection:
- visible button/action response: effectively immediate;
- normal API target: <300 ms where practical;
- common search/filter target: <500 ms;
- normal save/update target: generally <800 ms excluding external/heavy processing;
- first useful list content: around <1 second;
- dashboard: around 1–2 seconds;
- no duplicate financial mutation is acceptable.

V30.39 default diagnostics flag API requests >=750 ms as slow and responses >=1 MiB as large (environment-adjustable). New releases must run performance QA and must not silently increase runtime script count, document-wide observer count, synchronous heavy-process calls, or unpaginated high-volume patterns.

## 13. Progressive loading, parallel reads & section resilience — V30.39.1+ permanent rule
- Data-heavy screens render their structural shell immediately. Never keep the content area blank while waiting for a remote read.
- Use shared skeleton placeholders for page/section reads; use contextual button/overlay processing for mutations. Do not replace true progress with fake percentage values.
- Independent read requests start concurrently. Sequential request waterfalls are allowed only when a later request genuinely requires data produced by an earlier one.
- Prefer `Promise.allSettled`/independent section completion semantics for non-critical secondary reads so one failed section does not blank or block the rest of the page.
- Critical summary/header data receives high priority. Heavy secondary sections (documents, audit/history, statements, accounts, long transaction histories and analytics) are lazy/deferred where practical and load when selected/visible.
- A section has explicit Loading / Loaded / Empty / Error / Retry states, localized EN/KR. Failed secondary sections retry independently without forcing a whole-page reload.
- Use the shared `BOMProgressive` primitives for skeletons, parallel work, safe short-lived reference caching, visibility-based lazy work and server-pager UI. Do not invent incompatible per-screen loaders.
- Prefer a compact summary endpoint for critical header/KPI information and separate paged/lazy endpoints for large related datasets. Avoid dozens of tiny requests when one safe compact summary query is more efficient.
- Safe read caches must be invalidated by relevant mutations; volatile financial balances/transaction state must not be served stale merely for speed.
- New high-volume screens must be server-paged from inception. Existing high-volume screens are migrated under the same contract as they are touched; V30.39.1 begins that migration with Excavator Machines, Buyers and Suppliers.
- Performance work is release-blocking: future development must not reintroduce blank waits, avoidable sequential waterfalls, client-only pagination for growing datasets, or full-page failure because a secondary section failed.

## 12. Carry-forward development contract
Every future requirement implicitly includes: permissions/BU scope + audit + Review & Confirm where applicable + EN/KR + immediate processing feedback + idempotency where applicable + targeted refresh + stable parent context + scalable pagination/list behavior + shared request/lifecycle patterns + performance QA. The user should not need to repeat these rules in future feature requests.


## 14. Smart context-aware change & impact-control standard — PERMANENT SYSTEM-WIDE RULE
- **Never implement a requirement blindly.** Every fix, feature, optimization, migration, validation change, UI refactor, bulk replacement, query rewrite and automation must first identify the exact affected workflow, Business Unit, screen/section, parent-child context, record lifecycle and user role.
- Prefer the **smallest correct scope**. Do not apply broad/global replacements merely because screens look similar. Shared behavior belongs in a shared component/service only when the underlying business meaning and validation are genuinely shared.
- Before changing behavior, review relevant dependencies: permissions/BU scope, approval level, Finance cash movement, Accounting recognition/posting, balances/allocations, inventory/stock, linked documents/evidence, numbering/references, audit/history, notifications, EN/KR localization, persistent data compatibility, performance and downstream reports/KPIs.
- Preserve unrelated behavior and context. A change in one BU/workflow must not leak labels, placeholders, validation, account eligibility, payment logic, refreshes, routes or state into another BU/workflow.
- Preserve the user's working context: parent record, selected section/tab, modal stack, filters, sort, page, search, scroll and unsaved form state where the workflow permits it. Child actions return to the correct parent rather than a generic list or unrelated screen.
- Optimizations must be **semantically safe**: do not improve speed by serving stale volatile financial data, skipping authorization/validation, weakening idempotency/audit, changing calculation meaning, dropping required related records or hiding an error.
- Data/query changes require result-equivalence checks for the affected business logic. When replacing JavaScript calculations with SQL aggregation, paging, caching or parallel reads, verify totals/counts/status logic against the protected behavior and edge cases (voided/cancelled/reversed/archived/permission-scoped records).
- UI standardization must be context-aware. Reuse shared patterns for loading, pagination, Review & Confirm, errors and account selectors, but keep BU-specific terminology, examples, required fields, account/jurisdiction rules and lifecycle actions.
- Broad mechanical code transformations, global search/replace, schema rewrites and cross-module refactors require an explicit impact review and regression QA of affected neighboring workflows before release. If risk is high, migrate incrementally rather than changing every legacy path in one release.
- When requirements conflict, preserve financial/data integrity and the more specific workflow rule; document the conflict/decision instead of silently applying a generic rule.
- Every future release must treat this standard as implicit acceptance criteria. QA should include targeted regression checks for the directly changed path plus relevant dependent/neighbor paths.
- AI-assisted development follows the same rule: infer context from the protected baseline and master requirements, make targeted changes, and never assume that similar-looking screens or records have identical business semantics.


## 15. Non-blocking runtime, set-based data access & one-time migration standard — V30.39.2+ PERMANENT RULE
- Interactive user requests must not drain large background queues, perform bulk historical synchronization, generate unrelated alerts/reminders, or run other maintenance work before returning the requested result. Queue work immediately, then process it in small time-budgeted background slices unless the exact workflow explicitly requires synchronous completion for integrity.
- Accounting integrity is preserved while synchronization is decoupled: Finance/business mutations enqueue Accounting work immediately; Accounting status/queue depth remains observable; direct non-cash operational journals that are part of the same atomic business event may still be created synchronously where required by the specific workflow.
- Any list/summary endpoint that can grow must avoid application-level N+1 patterns. Prefer set-based SQL aggregation, grouped/bulk lookups, or one compact summary query. Detailed record screens may retain richer authoritative calculations when those calculations are actually needed for that record.
- Authorization must remain authoritative but must not be recalculated wastefully. Reuse verified request identity within the same request and use only short-lived, bounded effective-access caching with immediate invalidation when role, BU assignment, permission override, limits, templates or copied access change. Performance work must never weaken authorization.
- Read/count endpoints must be side-effect-light. Notification unread counts, sidebar badges and similar reads must not trigger unrelated report generation, stock sweeps, reminder generation, Accounting synchronization or other expensive maintenance work.
- Large JSON compression, file hashing and comparable I/O/CPU work must use asynchronous/streaming techniques where practical; avoid synchronously reading an entire uploaded file or synchronously compressing a large response on the main Node event loop.
- Historical data backfills and upgrade migrations must be ledgered/idempotent. A migration that only needs to run once must record completion and must not rescan/rewrite all historical data on every normal server restart. Maintenance/repair endpoints remain explicit and auditable.
- Server-side pagination is the required scalable path for Finance, Accounting, Pink Salt and shared high-volume lists as they are migrated. Search, date/status/evidence/type filters, BU/permission scope and sort must execute before `LIMIT/OFFSET`; KPIs/totals must come from separate scoped aggregate queries so paging never changes their meaning.
- Smart concurrency is required. Parallel reads are encouraged only when independent and useful; do not fire unbounded SQLite-heavy requests merely because parallelism is available. Prioritize critical summary/header reads, bound concurrent secondary work, and lazy-load low-priority history/documents/analytics.
- Performance diagnostics must expose enough information to distinguish network delay from server/event-loop/queue pressure. V30.39.2 adds event-loop lag, Accounting queue depth/age, memory and migration visibility for authorized diagnostics.
- Apply the Smart Context-Aware Change & Impact-Control Standard to every optimization. A faster result is not acceptable if it changes Finance/Accounting meaning, permissions, BU scope, void/reversal semantics, balances, audit history, localization or parent-screen context.
