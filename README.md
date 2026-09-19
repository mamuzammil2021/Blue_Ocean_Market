# Blue Ocean Market V30.39.0

V30.39.0 is the **Performance Foundation & Runtime Consolidation** release built directly on the protected V30.38.2 baseline. It preserves current business workflows while reducing live browser startup requests, adding system-wide slow-network action feedback, request/performance diagnostics, safer async heavy-work handling, shared pagination/request/lifecycle primitives, SQLite runtime tuning, and permanent carry-forward performance rules for all future development.

There is **no destructive database migration or reset**. V30.39 adds only targeted indexes and runtime PRAGMA tuning; existing SQLite data, uploads/evidence, backups and Render persistent storage remain compatible. Historical browser patch source files remain packaged for traceability, while the live browser now loads the ordered compatibility runtime through `runtime-v3039.js`. See `V30_39_IMPLEMENTATION_SUMMARY.md` and `V30_39_QA_STATUS.md`.

---

# Blue Ocean Market V30.38.2

V30.38.2 is a focused point release built directly on protected V30.38.1. It fixes the real Buy Machine Token Payment Pay From/Paid To interaction and Add/Manage action, standardizes successful child-dialog auto-close behavior, adds shared refund currency/FX/account integrity, and refines Machine Detail Costs into a compact scrollable list with always-visible total and disabled `🔒 Edit` lock UI.

There is **no V30.38.2 database schema change, reset or destructive migration**. Existing SQLite data, uploads/evidence, backups and Render persistent storage remain compatible. See `V30_38_2_IMPLEMENTATION_SUMMARY.md` and `V30_38_2_QA_STATUS.md`.

---

# Blue Ocean Market V30.38.1

V30.38.1 is a focused point-release hotfix built directly on protected V30.38.0. It repairs Sell Machine validation-state clearing and the Buy Machine Token Payment account workflow: Add / Manage Accounts routing, explicit Pay From / Paid To selection, parallel/prefetched account loading and slow-connection loading states.

There is **no V30.38.1 database schema change, reset or destructive migration**. Existing SQLite data, uploads, backups and Render persistent storage remain compatible. See `V30_38_1_IMPLEMENTATION_SUMMARY.md` and `V30_38_1_QA_STATUS.md`.

---

# Blue Ocean Market V30.38.0

V30.38.0 is built directly on the protected V30.37.0 package. It adds editable/audited counterparty accounts, the seven-section Pakistan Resales workspace, Buy Machine receiver-account integrity, one canonical Sell Machine settlement engine shared by browser/backend validation, and collapsible Finance/Accounting filters with Accounting status controls kept visible.

The only schema change is the additive `counterparty_payment_account_history` audit table/index created with `IF NOT EXISTS`. There is **no destructive migration or reset**; existing SQLite data, uploads, backups and Render persistent storage remain compatible. See `V30_38_IMPLEMENTATION_SUMMARY.md` and `V30_38_QA_STATUS.md`.

---

# Blue Ocean Market V30.37.0

V30.37.0 is a UI/workflow refinement release built directly on protected V30.36.0. It repairs the shared Buyer/Supplier payment-account entry points, standardizes Buyer/Supplier profile sections, and replaces the awkward Accounting/Finance date controls with a reusable responsive filter toolbar.

The release is additive with **no database schema change** and preserves existing SQLite data, uploads, backups and Render persistent disk. See `V30_37_IMPLEMENTATION_SUMMARY.md` and `V30_37_QA_STATUS.md`.

---

# Blue Ocean Market V30.36.0

V30.36.0 is a browser-audit and UX-hardening release built directly on the protected V30.35.0 workflow/pagination baseline. It completes a Chromium-based control audit across the application, fixes the remaining validation-while-typing/focus regression and filter-to-pagination reset gaps, and preserves all V30.31–V30.35 lifecycle, targeted-refresh, stable-chrome, Finance/Accounting and persistence rules.

Browser audit evidence is recorded in `qa/V30_36_BROWSER_AUDIT_RESULTS.txt`; implementation details are in `V30_36_IMPLEMENTATION_SUMMARY.md`. No destructive migration or schema reset is required.

---

# Blue Ocean Market V30.35.0

V30.35.0 is built directly on the protected V30.34.0 Stable UI Chrome & Slow-Connection Integrity baseline. It adds the post-V30.34 workflow refinements: Buy/Sell payment-account integrity, blur-based validation, sold/posted edit controls, Finance/Posting date filtering, and shared high-volume pagination while preserving stable UI chrome and targeted refresh behavior.

See `V30_35_IMPLEMENTATION_SUMMARY.md` for the exact scope. No destructive migration or schema reset is required.

---

# Blue Ocean Market V30.34.0

Blue Ocean Market management OS — Git/Render-ready targeted-refresh release.

V30.34.0 is built directly on V30.32.0 and preserves all V30.32 account-flow, Finance/Accounting, lifecycle, approval, audit and persistent-storage behavior. The release focuses on system-wide UI responsiveness: mutation actions should update only affected data areas while unrelated UI remains stable.

### V30.34.0 scope

- System-wide targeted/partial refresh architecture.
- Section-level localized loading indicators for mutations.
- Broad automatic post-mutation screen reload removed.
- Soft compatibility refresh for legacy handlers, keeping old content visible until new data is ready.
- Unchanged top-level sections are reused after legacy revalidation.
- Guarded fallback refresh preserves data consistency when an older handler does not explicitly update its UI.
- Shared `BlueOceanRefresh` helper and standing development/QA rule for future features.
- No database schema changes; preserve current DB/uploads and Render persistent disk.

### V30.34.0 QA status

Run `npm run qa:current`, `npm run qa:v333`, `npm run qa:render`, and after `npm ci`, `npm run qa:runtime`.

## V30.24.2 hotfix scope


- Fix nested child dialogs throughout the system so Close (X), backdrop and ESC close only the topmost child and restore the exact parent dialog/form state.
- Preserve unsaved edits, file inputs, focus and scroll context while previews/history/child dialogs are open.
- Reserve protected responsive header space for Close (X), status/actions and Download Original so they do not overlap.
- Apply the shared behavior to Finance and Accounting Posting evidence previews and every module using the common modal layer.
- Fix Finance Correct & Resubmit reference validation so the current logical payment and linked/mirrored Finance rows are excluded from duplicate matching.
- Preserve the rule that only a genuinely different active transaction on the same actual Company Financial Account blocks a duplicate reference.
- Remove the legacy `Unassigned KRW Bank` clearing placeholder from interactive account selection while preserving historical records.

V30.24.2 is a focused hotfix built directly on V30.24.1. It does not introduce a new architecture or business module; it hardens shared dialog behavior and Finance correction/account integrity discovered during V30.24.1 QA.

## QA status

- **`npm run qa:current`: PASS**, including all inherited V30.24/V30.24.1 safeguards and the new V30.24.2 checks.
- Full static QA output is included at `qa/V30_24_2_STATIC_QA_RESULTS.txt`.
- Runtime smoke is not claimed in this build container because the clean package has no `node_modules` and `better-sqlite3` is unavailable here. Run `npm ci && npm run qa:runtime` in the normal Node 22 test environment before production deployment.

## Local test

```bash
npm ci
npm run qa:current
npm run qa:runtime
npm start
```

Use a test database or backup while testing destructive actions.

## Inherited implementation notes

## Main changes

- Fixed the numeric-input observer loop that could make System Settings and other number-heavy screens unresponsive.
- Added explicit, opt-in full-screen workflow pages for selected heavy workflows.
- No global modal interception, no `modalRoot` relocation, and no MutationObserver-based automatic full-screen conversion.
- Heavy workflows use a visible Back control; short actions remain dialogs with the standardized top-right Close control.
- Restored/fixed missing Business Unit Edit, generic Inventory Product/Service Add/Edit, Approval Rule Add/Edit, and MIMI Restaurant Tables actions.
- Retained all V30.22.1 validation, attachment integrity, Finance/Accounting, permissions and security fixes.

## QA status

- **V30.24.1 current/source regression suite:** `npm run qa:current` — PASS, including all inherited V30.24 checks and new V30.24.1 workflow/Finance/Documents/statement checks.
- **Inherited V30.24 browser QA:** 302/302 source/regression and 115/115 targeted browser interaction/responsiveness checks passed on the verified baseline and remain protected by the current regression suite.
- **Runtime smoke in this build container:** not executed because the environment could not resolve `registry.npmjs.org` to install the native `better-sqlite3` dependency. Run `npm ci && npm run qa:runtime` in a normal networked Node 22 environment before production deployment.
- All **33 registered top-level application views** rendered without browser page errors.
- All **16 System Settings sections** were switched and responsiveness-tested, followed by repeated switching cycles.
- Add Supplier, Add Buyer, Buyer full-screen detail, Supplier full-screen detail, Buy Machine, Open Machine, Finance tabs/actions, Finance verification, Manual Finance, User Access, Pink Salt import/production full-screen workflows, repeated cross-screen navigation and whole monetary value entry were exercised.
- Additional per-screen button-matrix checks were run for the major modules, including Suppliers, Buyers, Excavator Operations, Approvals, Tasks, Performance, Reports, Documents, Meetings, MIMI, Users, Profile, Payroll and Pink Salt screens.
- Browser test result: **0 page errors / 0 console errors** in the targeted acceptance suite.

## Important runtime note

Backend dependency-backed runtime smoke is **not claimed as passed in this build container**. The available `node_modules` set is incomplete (`express` is unavailable), and package installation has been blocked by the environment/network timeout. Run the commands below on the target Mac before production acceptance.

## Local test

```bash
npm ci
npm run qa:current
npm run qa:runtime
npm start
```

Use a test database or backup while testing destructive actions.
## Git-ready Render persistent-storage variant

For the paid Render web service, this package is prepared to keep the SQLite database, backups, attachments, receipts/evidence and generated PDFs on a persistent disk mounted at `/var/data`. See `RENDER_DEPLOYMENT.md` before the first disk-aware redeploy, especially if the current Render instance still contains ephemeral test data that must be preserved.


### V30.26.4 direct reset-button hotfix
- Fixes the Render reset dialog case where **Full Clean Reset** was visibly clickable but no Review & Confirm dialog appeared.
- The reset form now binds both the button click and form submit with direct `addEventListener` handlers immediately after the modal is rendered.
- The handler calls `window.v3252RunReset(...)` directly, validates required fields and the exact typed phrase, then performs the protected JSON POST.
- Native form navigation remains blocked and reset credentials never belong in the URL.

### V30.26.3 reset hotfix

Development/Test reset dialogs now use only the protected authenticated POST workflow; destructive reset values no longer fall back to native URL submission. Existing V30.26.2 business workflows are unchanged.
