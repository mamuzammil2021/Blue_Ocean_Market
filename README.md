# Blue Ocean Market V30.29.0

**Workflow UX + Finance Verification Traceability + Combined Sale Settlement + Pakistan Resale Allocation — Git-ready / Render Persistent Disk**

V30.29.0 is built on V30.28.0. It focuses on the latest live Excavator QA findings while preserving the Finance Integrity Rule, Accounting Posting Control architecture, Pakistan Resales separation, country-scoped financial accounts and Render persistent-storage safeguards.

### V30.29.0 scope

- Responsive Buyers/Suppliers lists that fit the available width, wrap long content and keep actions visible; Search + Add controls stay aligned on the right on normal desktop/laptop widths.
- Supplier list simplified to **Open | Edit | Delete**. Open launches a full Supplier workspace with Overview, Machines, Requirements and Payments / Account.
- Supplier workspace adds purchase/payment KPIs and recent payment visibility, while Supplier Statement remains the full ledger/history view.
- Phone entry uses one compact searchable country-code selector beside the phone number; no duplicate search field.
- Sell Machine supports **Buyer Advance + New Payment** in the same settlement. Existing advance is allocated without creating a duplicate Finance receipt; only newly received money creates a Finance cash record, with excess retained as Buyer Advance/Credit.
- Accounting Posting Queue shows the source/transaction amount instead of a misleading combined debit total; Posting Review exposes sale, COGS, gross profit and balanced journal totals.
- Finance Verification shows the exact Company Financial Account used as **Received Into** or **Paid From** for reviewer traceability.
- Finance sidebar pending badge uses Finance-only actionable records and disappears when no Finance work is pending.
- Buyer/Supplier Statement date Apply refreshes the same open statement dialog instead of stacking another modal.
- Buyer Detail hard-deduplicates Pakistan Resales so exactly one action is shown.
- Pakistan Resale Profit Payment uses machine selection/checkbox allocation with automatic allocation and unallocated resale credit handling. Review & Confirm is restored as a working protected financial review step.

See `V30_29_IMPLEMENTATION_SUMMARY.md` for implementation details.

### V30.29.0 QA status

- `npm run qa:current` — **PASS**
- `npm run qa:render` — **PASS**
- JavaScript/server syntax checks are included in the current regression gate.
- Runtime smoke requires `npm ci` in the target Node 22 environment because `node_modules` is intentionally excluded from the Git-ready release artifact.

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
