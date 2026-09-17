# Changelog

## V30.31.0 — Lifecycle Integrity, Controlled Void/Reversal & Finance-Ready Posting Control

- Fixed Add Supplier Save so success closes the dialog and refreshes the Supplier list.
- Added one-navigation workflow cleanup, compact Accounting working chrome and a thinner sidebar scrollbar.
- Added central stage-aware lifecycle policy for Finance/source records, exposing Request Void or Request Reversal only when valid.
- Added impact Review & Confirm and lifecycle audit history; material void/reversal actions preserve original records and linked sources.
- Posted Accounting journals are reversed through linked reversal proposals/journals rather than deleted or silently mutated.
- Fixed Purchase Token and machine expense/cost void flows and synchronized linked machine purchase, supplier payable, machine cost basis and sold-machine COGS/profit where applicable.
- Reworked machine-cost Correct & Resubmit to mirror original source fields, preserve evidence/history and remove unrelated mandatory Counterparty behavior.
- Machine costs now expose Edit + Void semantics; voided costs remain visible for audit.
- Supplier/Machine supplier-payment entry is Purchase-only; removed the obsolete Sale payment type.
- Accounting Posting Control actionable queue now admits Finance-linked cash proposals only after Finance verification, while non-cash operational eligibility remains source-status driven.
- Accounting sidebar badge uses the same actionable posting eligibility.
- Added additive lifecycle audit schema/void metadata; no data reset required.

## V30.30.0 — Receiver Account Traceability, Smart Account Routing, Resale Credit & PDF Quality

- Added reusable Supplier/Buyer receiver/payee accounts and immutable destination-account snapshots on outgoing Finance records, including Buyer Advance refunds.
- Finance Verification now shows receiver `Paid To` details as well as the Company Financial Account used.
- Smart Company Financial Account filtering now respects account country, currency and receipt/payment direction.
- Pakistan Resales enforce Pakistan/PKR Company Bank accounts; ordinary Korea-side Excavator cashflow is restricted to eligible South Korea accounts.
- Company Financial Account defaults are scoped by BU + country + direction so Korea and Pakistan defaults can coexist.
- Added Pakistan Resale Allocate Credit, Refund Credit and combined Existing Credit + New Payment settlement without duplicate Finance receipts.
- Removed redundant Finance profitability card below the transaction list.
- Rebuilt statement PDF transaction layout for professional EN/KR fonts, multiline Description/Reference wrapping and dynamic row heights.
- Added additive schema support for counterparty payment accounts, Finance receiver snapshots and pooled Pakistan resale-credit refunds; no data reset required.

## V30.29.0 — Workflow UX, Finance Verification & Settlement Integrity

- Reworked Supplier/Buyer list layouts to fit available width, wrap long values and keep right-side actions visible without normal desktop/laptop horizontal scrolling.
- Aligned Search + Add controls to the right and simplified Supplier rows to Open, Edit and Delete.
- Added a full Supplier workspace with Overview, Machines, Requirements and Payments / Account, including purchase/payment KPIs and recent payments.
- Replaced duplicate phone-country search fields with one compact searchable country-code selector beside the phone number.
- Added combined Sell Machine settlement using Buyer Advance + New Payment, preserving one-real-receipt = one-Finance-record integrity and sending excess new receipt value to buyer credit.
- Changed Accounting Posting Queue to show Transaction/Source Amount and added sale, COGS, gross profit and balanced journal totals in Posting Review.
- Added exact Received Into / Paid From Company Financial Account information to Finance Verification.
- Aligned the Finance sidebar badge to Finance-only actionable records and zero-state hiding.
- Changed Statement date Apply to refresh the current Buyer/Supplier Statement modal in place.
- Hardened Buyer Detail so Pakistan Resales renders once only.
- Changed Pakistan Resale Profit Payment allocation to checkbox/machine selection with automatic allocation and unallocated resale credit.
- Restored a protected, working Review & Confirm step for resale-profit payments.
- Preserved all V30.28 Finance/Accounting data-integrity and V30.27 Pakistan Resales/country-account safeguards.

## V30.28.0 — QA + Finance/Accounting Data Integrity

- Deduplicated the Pakistan Resales Buyer Detail action and preserved Buyer Detail context after editing.
- Separated Finance and Accounting sidebar counters so Finance never includes Posting Control counts.
- Removed the redundant Daily Finance guide card.
- Added posted-vs-operational Accounting visibility for Buyer Advances, Supplier Payable and Excavator Machine Inventory / Capitalized Costs.
- Supplier Payable operational balance now follows actual paid Purchase payments and reaches zero when fully settled.
- Added Pending Accounting and Finance Awaiting Verification indicators.
- Hid + Cost, Update Sale and Payments on Sold / Completed Machines / Deals cards.
- Added searchable phone country-code selectors by country name, ISO code or dialing code.
- Improved statement PDF description wrapping, spacing and row height.
- Reinforced Sell Machine required-field visual validation and live error clearing.
- Preserved V30.27 Pakistan Resales, Accounting-only Posting Control, protected reset and Render persistence safeguards.


## V30.27.0 — Pakistan Resales, Settlements & Cross-border Bank Transfer

- Added a dedicated Pakistan Resales page for Pakistani Excavator buyers and removed payment fields from the resale-event form.
- Auto-calculates Our Share Amount from Resale Profit × Our Share % ÷ 100, with authoritative server recalculation.
- Added one-receipt/multi-machine resale-profit allocations, partial settlements, unallocated resale credit, controlled reallocation, refund and void history.
- Added Bank Country / Account Country to Company Financial Accounts and country-scoped account selectors/backend validation.
- Restricted Pakistan resale-profit receipts/refunds to active Pakistan PKR Company Bank Accounts.
- Added separate Pakistan→Korea bank transfers with source/destination accounts, FX, bank fees, evidence, Finance verification and Accounting Posting Control.
- Added dedicated Pakistan resale income/credit and FX GL mappings so Pakistan resale profit never mixes with Korea machine-trading revenue.
- Preserved V30.26.4 protected development reset and Render persistent-disk behavior.

## V30.26.4 — Direct Reset Button Binding Hotfix

- Fixed the Render Full Clean Reset button appearing active but doing nothing after the V30.26.3 native-submit hardening.
- Reset dialogs now attach direct click and submit event listeners after modal render instead of depending on an inline submit callback.
- Both paths validate the browser form, call the same protected reset runner, and keep all reset credentials out of URL/query history.
- Preserves V30.26.3 POST-only reset transport, typed confirmation, Review & Confirm, single-flight protection, development/testing guard, backups and persistent-disk safeguards.


## V30.26.3 — Protected Reset Submission Hotfix

- Fixed the Render Development/Test Full Clean Reset dialog falling back to native browser GET navigation instead of the protected reset API.
- Reset reason/password/typed confirmation are now sent only in the authenticated JSON POST body and never intentionally placed in the URL.
- Reset forms now use explicit non-submit action buttons, native-submit prevention, `javascript:void(0)` fallback, exact typed-confirmation validation and a single-flight request guard.
- `formDirty` is cleared only after the protected reset API accepts the request, preventing the browser “Leave site?” prompt from interrupting the actual reset.
- Added current-URL scrubbing for legacy leaked reset query parameters and QA gates for the protected POST-only reset flow.


## V30.26.2 — Accounting-only Posting Control + Excavator Follow-up Integrity

- Removed Posting Control buttons/tabs from Finance and kept Finance focused on transaction review, evidence, corrections and verification.
- Moved Posting Control navigation fully into Accounting, replaced Back to Finance with Back to Accounting, and added contextual View Finance Record from individual posting items.
- Prevented the legacy V30.25 supplier search enhancer from rendering a second overlapping Buy Machine supplier dropdown.
- Current Sale Settlement now displays only active allocations for the sale; historical/unallocated buyer receipts stay in buyer ledger/audit history instead of appearing as duplicate active settlement rows.
- Retained V30.26.1 development/testing reset and Render persistent-disk safeguards unchanged.
- Updated package, browser cache, health/version identity, requirements and QA to V30.26.2.

## V30.26.1 — Sell Workflow + Development Reset Hotfix

- Fixed Chrome Page Unresponsive regression when launching Sell Machine / Update Sale by making the payment-account label mutation idempotent and queued instead of self-triggering.
- Added single-flight protection to the shared Sell Machine launcher used from Machines / Deals and Open Machine.
- Converted Buy Machine supplier search results into a floating dropdown/autocomplete that closes/clears after selection and supports Escape/click-away.
- Extended protected environment reset from testing-only to development-or-testing when `ALLOW_TEST_DATA_RESET=true`; all existing authorization/backup/audit safeguards remain.
- Local development launcher now enables guarded reset controls; Render Blueprint keeps reset disabled by default and Production remains blocked.
- Updated package, browser cache, health/version identity, requirements and QA to V30.26.1.

## V30.26.0 — Excavator Sale & Payment Lifecycle Integrity

- Fixed Buy Machine supplier selection/search and full-width supplier result UX.
- Cash token payment references are optional while evidence remains mandatory.
- Fixed nested payment modal stale state and immediate payment/machine refresh.
- Added required-field highlighting on Sell Machine.
- Added supplier payment status / valid totals to the machine Sale PDF.
- Removed Delete from Sold / Completed machines and added controlled Void / Archive / Restore actions.
- Fixed authenticated post-sale PDF viewing.
- Added settlement-aware Update Sale, controlled payment correction/reversal, Add Another Payment, Payment Amount and buyer-credit excess handling.
- Added mixed-settlement / excess-receipt Accounting integrity fixes.
- Removed redundant Suppliers / Buyers shortcuts from Excavator Operations.

## V30.25.2 — Controlled Test Environment Reset

- Added guarded Test Environment Reset center under System Settings → Backup / Storage / Maintenance.
- Added Quick Reset, Full Clean Reset, Full Reset + Demo, safe uploads-only clear and Restore Last Pre-Reset Backup.
- Every reset snapshots SQLite + uploads before destructive work.
- Automatic pre-reset retention defaults to 3 and is hard-limited to 2–3 snapshots.
- Full reset/restore runs before SQLite opens after restart; Render persistent disk and reset backups remain attached.
- Reset is backend-disabled unless `APP_ENV=testing` and `ALLOW_TEST_DATA_RESET=true`.
- Added current-password, typed-confirmation, permission and audit controls.


## V30.25.1 — Critical Integrity Hotfix

- Made System Settings a deterministic base navigation item for CEO/Owner and authorized System Administrators; removed the broken late navigation refresh dependency.
- Restricted Finance Statement to real cash-effect movement so operational recognition bridge rows cannot enter cash totals.
- Explicitly records cash direction on new Manual Finance entries so genuine manual Money In/Out remains in Finance statements.
- Replaced the legacy P&L calculation with the official posted Accounting ledger while retaining the existing API response shape for compatibility.
- Completed remaining Pink Salt Cash-reference validation so Cash does not require a reference while non-cash methods do.
- Cash selection now removes the visible Reference required marker and restores it for non-cash methods.
- Moved Excavator Buyer/Supplier Statement actions into native profile/detail headers and removed delayed DOM injection.
- No wider module redesign or feature expansion is included in this hotfix.


## V30.25.0 — Finance Integrity, Source-Aware Accounting & Statement Recovery

- Enforced the system-wide rule that one real payment/receipt produces one primary Finance cash transaction; operational Sales/Purchases/Imports no longer inflate Finance cash totals merely because they have monetary value.
- Separated Operations, Finance and Accounting responsibilities while retaining controlled Accounting proposal/posting workflows.
- Added source-aware Accounting eligibility: Finance-sourced postings require Finance Verification; non-cash operational postings require the operation to be Completed/Approved; Excavator Sale additionally requires verified allocated buyer-payment coverage.
- Added transition protection for legacy combined operational Finance rows and existing Accounting proposals/postings without silently rewriting posted ledgers.
- Fixed Finance Correct & Resubmit so existing amount/currency/FX/date/method/reference/notes/account/evidence preload correctly.
- Cash payment references are optional system-wide and do not generate Missing Reference exceptions; duplicate-reference validation runs only when a reference is present/required.
- Existing references may remain unchanged during update/correction because the current logical payment family is excluded from duplicate matching.
- Standardized real-time searchable Buyer/Supplier/Seller selectors while keeping all results strictly Business-Unit scoped.
- Restored Buyer and Supplier Statement actions on Excavator profile/detail screens while retaining Pink Salt customer/supplier statements.
- Hardened System Settings navigation visibility after authentication/module hydration for CEO/Owner and authorized System Administrators.
- Retained V30.24.3 Numbering & References and Render persistent-disk architecture.

## V30.24.3 — BU-Scoped Numbering & Reference Registry

- Replaced the incomplete mixed Numbering & References settings view with a central registry separated into Company / Shared and Business Unit tabs.
- Registered the reference prefixes currently issued/configured by the live system and moved the corresponding generators onto the central numbering service.
- Added Company default / BU override precedence, format preview, current sequence, change reason, audit history and prefix-conflict warnings/protection.
- Preserved all previously issued references; changes affect future references only.
- Added automatic registration support so future numbered features using the central service appear in System Settings without a separate manual settings update.
- Scoped visibility/management to CEO / Owner and authorized System Administrators.
- Retained all V30.24.2 nested-dialog and Finance-reference safeguards.

## V30.24.2 — System-wide Nested Dialog & Finance Reference Hotfix

- Added one-level-at-a-time nested dialog isolation across the shared modal layer; child Close/backdrop/ESC no longer destroys the parent dialog.
- Parent dialog DOM/form state, unsaved values, file input state, scroll position and focus context are preserved while child dialogs/previews are open.
- Added protected responsive header space so standardized Close (X), Download Original, status and action controls do not overlap.
- Accounting Posting evidence previews now inherit the same nested-dialog behavior as Finance and other stored-attachment previews.
- Finance correction UI sends the current Finance identity to duplicate-reference validation.
- Backend reference validation excludes all Finance rows belonging to the same logical payment, including linked/mirrored aliases, while continuing to block a genuinely different transaction using the same reference on the same account.
- Removed legacy `Unassigned KRW Bank` from interactive account options and blocked its use for new/corrected money movement while preserving historical records.
- Added V30.24.2 regression checks and retained all V30.24.1/V30.24 safeguards.


## V30.24.1 — Workflow Context, Finance, Documents & Statement Refinement

- Preserved parent full-screen record context across nested child workflows and protected active workflows from global refresh collapse.
- Fixed Buyer Payment/Advance post-save navigation to remain in the same Buyer profile.
- Standardized attachment and dialog headers with safe long filenames, reserved Close control and Download Original.
- Finance corrections now exclude the current transaction from duplicate-reference checks and enforce conflicts only against another active transaction on the same Company Financial Account.
- Existing Finance correction evidence remains linked and visible; replacement evidence is optional when valid evidence already exists.
- Fixed Finance Full History persistence/return behavior and redesigned correction history into human-readable field changes with permission-controlled technical metadata.
- Final documents cannot be reopened. Document delete is now an audited archive/soft-delete; authorized users can view Archived Documents and restore them to their previous valid state.
- Documents UI is separated into Active/In Progress, Final Documents and authorized-only Archived Documents.
- Date-filtered Buyer, Supplier, resale-share and Pink Salt statements now use the selected period consistently for activity rows and summaries, with prior activity carried into opening balance.
- Statement PDFs received professional branding, period metadata, clearer summaries/tables, page handling and EN/KR-ready rendering.
- Added V30.24.1 regression QA checks while retaining all V30.24 safe full-screen workflow protections.

## V30.24.0 — Safe Full-Screen Workflow & Button QA

- Rebuilt from the stable V30.22.1 baseline; V30.23 automatic modal-promotion/interception code is not inherited.
- Fixed the numeric-input MutationObserver feedback loop that could progressively freeze number-heavy screens such as System Settings. The normalizer is now idempotent and only mutates attributes when a change is actually required.
- Added an explicit full-screen workflow surface with Back navigation for selected heavy workflows only. There is no global `modal()`/`closeModal()` interception, no `modalRoot` relocation, and no MutationObserver-driven automatic promotion.
- Converted selected heavy workflows explicitly while preserving their existing APIs/business logic: Buyer detail/account, Supplier detail/account, Buy Machine, Open Machine, Finance verification/manual entry, User Access, and key Pink Salt import/production workflows.
- Kept short focused actions as dialogs and retained the standardized top-right Close control.
- Added/verified missing action handlers discovered by button audit: Business Unit Edit, generic Inventory Product/Service Add/Edit, and Approval Rule Add/Edit.
- Added the missing MIMI Restaurant Tables screen with Add, Edit, Delete and Back-to-POS controls.
- Added browser QA that executes the packaged JavaScript in headless Chromium with mocked API responses, covering all 33 registered top-level views, System Settings section switching, repeated cross-screen stress cycles, selected heavy full-screen workflows, whole-number monetary input, and critical action buttons.
- Added repeated responsiveness checks and rejected the V30.23 architecture rather than layering another compatibility shortcut over it.
- Retained V30.22.1 attachment integrity, contact validation, public-auth isolation, notification layering, flexible numeric input, Finance/Accounting posting control, access control, audit and security safeguards.

## V30.22.1 — Regression & Attachment Integrity Hotfix

- Fixed the V30.20/V30.21 validation collision that could display an email error under a valid international phone field.
- Kept Login, Forgot Password and Reset Password isolated from authenticated business-contact duplicate validation.
- Raised action feedback/toasts above modal, confirmation and processing overlays and added first-invalid-field focus/scroll guidance.
- Removed forced decimal step bases from non-count numeric fields: whole values and manually entered decimals are both accepted; true discrete counts remain whole-number fields.
- Made attachment helper text contextual: single-file controls explicitly show and enforce one file; multiple controls respect contextual/system limits.
- Changed upload storage to preserve the original file extension while keeping original bytes untouched.
- Added a centralized attachment integrity registry with original filename, MIME type, byte size and SHA-256 checksum.
- Added authenticated V30.22.1 attachment metadata/view/download endpoints and original filename restoration on Download Original.
- Preview now uses authoritative MIME metadata rather than the random stored filename and cleanly falls back to Download Original for unsupported formats.
- Retained V30.22 single Review & Confirm pipeline, modal-control hardening, exact financial-account integrity and backend payment-reference checks.

## V30.22.0 — Stability, Security & Workflow Hardening
- Unified business form validation and Review & Confirm into one pipeline, eliminating the double-confirm regression.
- Isolated public Login/Forgot/Reset validation from authenticated business contact duplicate checks and bound Phone/Email messages to their own fields.
- Disabled public static `/uploads` serving and added authenticated BU/access-aware stored-attachment View/Download endpoints.
- Strengthened exact Pay From / Receive Into account enforcement and persisted normalized account-scoped payment references with backend duplicate protection.
- Added persistent login throttling, configurable session duration, auth-version session revocation, centralized password policy, hashed reset tokens and APP_BASE_URL.
- Added APP_ENCRYPTION_KEY for new secret encryption while retaining legacy secret decryption compatibility.
- Changed user delete semantics to archive/deactivate while preserving audit/history.
- Replaced COUNT+1 generated numbering with persistent SQLite sequences.
- Kept Buyer Details before Pakistan-specific resale profit and added a shared top-right modal Close/accessibility foundation.
- Added Chromium and Noto CJK fonts to the production Docker image for browser-based PDF generation.
- Added V30.22 migration registry groundwork and browser acceptance QA plan.

# V30.21.1 — Login Validation Hotfix

- Fixed a V30.21 regression where system-wide email/contact validation was also applied to the public Sign In email field.
- Public login and other unauthenticated forms no longer call authenticated contact duplicate-check APIs.
- Login email keeps normal browser email-format validation, while authenticated business contact forms retain live UI validation and duplicate checks.
- Added a regression QA assertion to prevent this authentication deadlock from returning.


## V30.21.1 — Financial Integrity, Stored Attachment View & International Contacts
- Added post-upload View/Preview behavior for stored receipts, evidence, attachments and documents with explicit Download Original.
- Added direction-aware Pay From / Receive Into Company Financial Account selection and default payment/receipt handling.
- Extended exact-account routing to embedded/prefixed payment sections including Excavator purchase-token payment.
- Added UI-first normalized duplicate payment-reference checks scoped to the selected financial account.
- Added international phone input with flag, country name, dial code and E.164-style submitted value.
- Generalized email/phone UI validation beyond standalone Supplier/Buyer forms.
- Preserved V30.20 simple direct-upload behavior and historical Finance/Accounting data.

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

## V30.24.3 — Git-ready Render persistent-storage packaging
- Added Render-aware persistent storage defaults under `/var/data` for SQLite, backups, attachments and generated PDFs.
- Added startup storage preflight, mount/writability checks and `/api/health` persistence indicators.
- Added graceful HTTP shutdown with SQLite WAL checkpoint/close for Render redeploys/restarts.
- Added `render:storage-check` and `render:migrate-storage` helpers plus Render deployment documentation and Blueprint example.
- Strengthened `.gitignore` so runtime databases, WAL/SHM files, backups, uploads, secrets and node_modules are never committed.
- Functional application version remains V30.24.3.
