# Changelog

## V30.20.0 — Settings UX, Smart Payments & Direct Attachments

- Redesigned the System Settings shell for clearer grouped administration, separate Policy/Technical badges and responsive form spacing.
- Expanded Company Bank Accounts into Company Financial Accounts with multiple Bank, Cash, Card, Wallet/Other account types, BU/company scope, GL mapping, cheque/card metadata, close/archive and history.
- Added smart payment-method account filtering: Cash→Cash, Bank→Bank, Card→Card, Cheque→cheque-enabled Bank, with incompatible combinations blocked.
- Added exact-account selection when multiple compatible company accounts/cards/cash accounts exist, and preserved the chosen account through core Sales/Purchases, MIMI POS, Excavator payment/sale-receipt paths and Pink Salt import/customer/supplier cash movements into Finance → Posting Control → Accounting.
- Added method-compatible Finance fallback account resolution for older cash-movement sources that do not yet carry an explicit account ID.
- Cash references are optional; non-cash references remain required where applicable.
- Added immediate UI phone/email validation and duplicate checks for Excavator Suppliers and Buyers while retaining server-side integrity validation.
- Removed upload-time attachment compression/optimization/readability review. File inputs now show allowed formats, maximum file size and maximum attachments per upload and validate directly.
- Kept stored-document Preview/Open and Download Original behavior.


## V30.19.0 — System Settings & QA Hardening

- Added centralized System Settings with Company → BU → User override resolution and audited high-risk policy changes.
- Added System Administrator technical role/permissions, System Overview, BU administration, SMTP, storage, migration, bank, security, approval, notification, numbering, localization, maintenance, audit and AI settings.
- Added encrypted SMTP/AI credentials, SMTP test/logs and secure non-enumerating password reset flow.
- Added configured Company Bank Accounts with BU scope, GL mapping, history-preserving close, statement import and operational payment-account selection.
- Added System Settings-driven attachment policy, preview/optimization/readability workflow and preservation rules for financial/legal evidence.
- Added staged migration templates/validation/preview/import history without silent overwrite.
- Added AI Assistant configuration with the existing User → BU → Module → Record → Sensitive Permission boundary.
- Applied supplied QA document fixes: supplier validation/duplicate checks/modal lifecycle, chassis duplicate protection, supplier-machine Notes, document/receipt preview, machine-cost currency/FX/payment metadata, controlled cost reversal, Finance state-driven actions, correction evidence history, language persistence and Accounting Simple View responsive hardening.
- Retained V30.18 Finance → Posting Control → official Accounting workflow and all prior additive safeguards.


## V30.18.0 — Finance & Accounting Posting Control

- Kept **Finance** and **Accounting** as separate permission-controlled sidebar/workspace modules with distinct responsibilities.
- Implemented the controlled flow **Operational Transaction → Finance Review → Posting Control → Official Accounting Ledger**.
- Changed normal operational/accounting synchronization so prepared journals default to **Pending Review** and do not affect official GL/Trial Balance/P&L/Balance Sheet until final-posted.
- Added permission- and BU-scoped Posting Control queue, summary, detail, evidence, history, Pending Review/Correction Required handling and final posting.
- Final posting requires Accounting Approve authority for every affected BU, balanced journal validation, open period, Finance readiness and a mandatory review note.
- Added source/Finance evidence aggregation for Posting Control and safe internal evidence-link validation.
- Added controlled correction workflow and audit history instead of silent edits/deletes of posted records.
- Changed reversal behavior so an official Posted journal creates a Pending Review reversal proposal; the original remains Posted until the reversal is final-posted.
- Reversal final-post marks the original Reversed and releases stale bank-reconciliation matches where applicable.
- Blocked corrected Finance proposals while an earlier official Accounting reversal is unresolved.
- Strengthened period close so unresolved Posting Control proposals block close.
- Added V2 **Period Close Readiness** with automated blockers for Finance verification/corrections, sync queue, accounting exceptions, bank reconciliation, balanced official journals, suspense/clearing and Inter-BU balance integrity.
- Added a persistent period reconciliation checklist with reviewer/date/notes/evidence and BU-specific Excavator/Pink Salt subledger sign-offs before close.
- Consolidated/company close now requires active BU periods to be closed first; reopen requires a reason and resets reconciliation sign-offs for fresh review.
- Fixed ledger-effective reporting so both the original Reversed journal and its Posted reversal are included and net correctly, including the simple Accounting summary.
- Fixed source-reversal cleanup so unposted operational accounting proposals are cancelled instead of being left orphaned in Posting Control.
- Restricted official financial reports to ledger-effective Posted/Reversed journals; pending/correction proposals remain outside official statements.
- Hardened manual journals: sensitive Accounting-adjustment permission, active manual-postable accounts, positive one-sided lines, balanced totals, required reason and supporting evidence.
- Fixed manual-journal frontend/backend multipart evidence handling; added controlled edit/resubmit and cancel-with-reason for unposted manual proposals.
- Added active-proposal safeguards in Pink Salt operational, import-commitment and customer-allocation accounting paths to reduce duplicate pending proposals.
- Updated action counters so authorized Posting Control viewers receive pending badges even when they are not final-post approvers.
- Preserved V30.17 Users & Access behavior, including the Access button confirmed working on localhost, plus V30.11–V30.16 business, finance, stock, Review & Confirm and access safeguards.

## V30.17.0 — Users & Access Hardening + Render Build Fix

- Fixed the People & Access **Access** button and exported all V30.17 inline access handlers safely.
- Completed a system-wide Users & Access action review covering effective access, assignments, primary BU, permission matrix, sensitive/delegated rights, limits, templates, copy-access, user profile actions and audit history.
- Added explicit access-scope selection for multi-BU users and blocked edits outside the target user’s assigned units.
- Enforced self-access as read-only and strengthened delegated-admin authority ceilings, Finance-only boundaries and limit ceilings.
- Added payroll to granular modules and wired payroll, accounting-adjustment, approval-rule and audit-log sensitive permissions to backend authorization.
- Added legacy route/module aliases and missing centralized API mappings so effective permissions apply consistently across CRM, KPI, Payroll, statements/P&L and reporting routes.
- Added before/after access history snapshots for sensitive access changes.
- Reasserted effective-permission frontend visibility after legacy role-based code and added restricted-action UI enforcement.
- Added Review & Confirm to Users & Access mutations.
- Fixed Render `better-sqlite3` Docker builds by installing Python, make and g++; production startup can use Render environment variables without a physical `.env`.
- Retained all V30.16 and earlier business/finance/stock/approval safeguards.

## V30.16.0 — Hybrid Users & Access Control

- Added a system-wide Users & Access architecture using role templates plus granular effective permissions.
- Added multi-business-unit assignment with one primary unit and assigned-unit switching for non-CEO users.
- Added CEO / Owner global user/access administration, Effective Access review, Apply Role Template and Copy Access From Another User.
- Added delegated Business Unit Manager administration restricted to assigned business units and to permissions not exceeding the manager’s own effective access.
- Added Finance Head and Finance User templates; Finance Head administration is restricted to Finance users and Finance-related permissions.
- Added module/tab and View/Create/Edit/Delete/Void/Approve/Export/Print/Verify/Correct/Allocate permissions.
- Added sensitive permissions, delegated-administration rights and financial/sales limits/thresholds.
- Added access-change audit history, self-elevation prevention, template/grant ceiling checks and immediate live access revocation.
- Switched core sidebar/tab authorization and Pink Salt navigation to effective permission checks instead of role-only visibility.
- Added frontend restricted-action clarity while preserving backend authorization as the authoritative control.
- Retained all V30.15 supplier-account, V30.14 transaction-safety, V30.13 receivables/pricing, V30.12 quantity and V30.11 context-integrity requirements.

## V30.15.0 — Unified Pink Salt Suppliers, Payables & Packaging Supplier Accounts

- Added a dedicated Pink Salt **Suppliers** sidebar tab and removed Supplier Management from the Imports header.
- Added one unified supplier master with multi-category supplier classification for Import / Raw Salt and Packaging Material suppliers.
- Added supplier account/payables view with total outstanding, available supplier credit, semantic net position, aging, obligations, payment/advance history and allocations.
- Added supplier credit terms and credit limits.
- Added supplier statements with date filters plus CSV/PDF export.
- Reused the established supplier advance/payment ledger as the central supplier payment pool and extended its availability calculations across both import and packaging allocations.
- Added packaging payable allocations from supplier credit, including manual allocation and automatic packaging allocation.
- Separated packaging stock receipt from cash payment: receipt now creates packaging inventory and Accounts Payable; supplier payment is recorded from the supplier account.
- Added optional automatic use of available supplier credit at packaging receipt.
- Added supplier invoice/reference, due date and mandatory invoice/delivery evidence to packaging receiving.
- Added server-side supplier-category validation and category-specific supplier selection in import and packaging workflows.
- Migrates existing suppliers into appropriate categories from existing transaction history where possible.
- Updated simple accounting open balances and finance-integrity supplier advance checks to include packaging allocations/payables.
- Retained all V30.14 Review & Confirm/loading/idempotency safeguards, V30.13 customer accounts/pricing/filters, V30.12 quantity rules and V30.11 context integrity.


## V30.14.0 — Review & Confirm, Processing Safety & Account Position

- Added a reusable system-wide Review & Confirm layer before mutating business data is committed.
- Added form review summaries and old → new presentation for edited fields where prior/default values are available.
- Added context-aware impact messages for import receiving, production/repacking, payments/allocations, sales/orders, approvals and controlled void/delete/reversal actions.
- Added blocking processing/loading UI for backend mutations, including disabled triggering controls and contextual progress text.
- Retained persistent backend idempotency/request-fingerprint protection from V28.4 and reinforced mutation requests with an idempotency key in the V30.14 client flow.
- Increased mutation-request timeout to 120 seconds so legitimate long-running import/production/finance operations are not cut off by the former 20-second client timeout.
- Added English/Korean localization for Review & Confirm and processing-state text.
- Changed Pink Salt customer/store account display from raw negative net balance to semantic Due / Credit / Settled account position.
- Added optional automatic application of existing unallocated customer/store credit to a newly completed Pink Salt order.
- Retained V30.13 receivables/pricing/list controls, V30.12 quantity integrity, V30.11 context integrity and earlier finance/stock/approval safeguards.

## V30.13.0 — Pink Salt Customer Accounts, Receivables & Flexible Pricing

- Added customer/store account ledgers with receivables, overdue balances, customer credit and aging.
- Added delayed, partial, full and grouped payment/settlement receipts with multi-order allocation.
- Added marketplace settlement fee handling so net cash plus withheld fees can reconcile gross order settlements.
- Added credit terms, due dates, credit limits, account statements, CSV export and bilingual statement PDF support.
- Added customer-specific prices and reusable price tiers with effective dates and minimum quantities.
- Added pricing priority and immutable order-line pricing snapshots with manual-override audit fields.
- Added non-CEO below-cost sale protection.
- Added consistent Pink Salt search/sort/filter controls across operational record screens.
- Integrated new Pink Salt receipts/settlement fees with Finance and double-entry Accounting.
- Retained V30.12 quantity integrity, V30.11 context integrity, import controls, production workflows and existing audit safeguards.


## V30.12.0 — Quantity Integrity

- Fixed count inputs whose `step=1` was combined with a fractional minimum, causing valid integers such as 100 to fail browser validation.
- Made whole-number enforcement workflow-aware so restaurant/POS and measurement quantities retain decimals where appropriate.
- Made Pink Salt packaging receiving and reorder levels unit-aware (`kg` decimal; discrete packaging whole-number).
- Made Pink Salt waste quantity precision follow the selected stock source/unit.
- Added matching server validation for packaging reorder, waste, Finance corrections and Excavator part corrections.
- Added QA coverage for the regression and preserved all V30.11 context-integrity/cleanup requirements.

# Blue Ocean Market — Changelog

## V30.11.0 — Context Integrity & Clean Release

### Business-unit context integrity
- Fixed the V28.5 global hint layer that could overwrite correct Pink Salt placeholders after a modal was rendered.
- Preserved explicit module-authored placeholders.
- Added business-unit-aware fallback hints for Pink Salt, Excavator, MIMI Restaurant, and neutral/future units.
- Added context-aware shared-field examples for Finance search, Related Record Type, and Linked Records.
- Replaced Pink Salt `Yard / Rack / Zone` storage examples with `Warehouse / Rack / Zone`.
- Added Korean translations for the new context-aware placeholder/helper strings.
- Strengthened the V30.10 Pink Salt placeholder safety layer by retaining field-specific examples.

### Requirements
- Added a mandatory system-wide rule that placeholders, examples, helper text, labels, tooltips, empty states, validation guidance, sample/default data, and other contextual UI copy must match the selected business unit and workflow.
- Added a required context audit before release of any new business unit or major module.

### Release cleanup
- Removed accumulated historical `README_V*`, `CHANGELOG_V*`, `QA_REPORT_V*`, release-checklist, dependency-check, and other stale release files.
- Removed obsolete duplicate root JavaScript mirrors and unused V6 HTML/server files.
- Consolidated the QA folder to current release checks instead of shipping the historical per-version QA archive.
- Moved the Pink Salt blueprint reference into `docs/reference/`.

### Retained from V30.10
- Controlled Pink Salt Import Edit / History / Cancel / Void / Delete workflows.
- Approval/audit, finance/stock safeguards, filters/sorting, and terminal-state protections.
- Whole-number validation for count quantities while retaining decimals for weights, money, rates, and other measurements.
- Pink Salt navigation cleanup removing only the generic duplicate Sales, Purchases, and Inventory tabs.

### Retained from V30.7–V30.9
- Pink Salt import received PDF and production/repacking PDF workflows.
- Supplier advance edit/allocation controls.
- Finished Goods archive/delete zero-stock safeguards.
- Mixed Gift Box composition and packaging/BOM integrity.
- Carton/Bulk Pack production calculations and stock traceability.
