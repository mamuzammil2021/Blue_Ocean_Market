# Blue Ocean Market V30.43.0

V30.43.0 is the **Workflow Context, Buyer Sender Accounts & Accounting Statements** release built directly on V30.42.0. It hardens targeted refresh and browser-refresh child context, refines Machine Cost/Purchase edit locking, adds optional Buyer Sending Account capture to buyer receipt/sale flows, protects sold-machine documents, and expands Accounting Cash & Bank Accounts with account drill-down, generated statements, PDF download and controlled company-account transfers.

The V30.43 database changes are additive only: `excavator_buyer_payments.buyer_sender_account_id` plus the same-BU `accounting_account_transfers_v343` ledger. There is **no destructive reset**. Existing V30.42 Tasks/Access behavior, SQLite data, uploads/evidence, backups and Render persistent storage remain compatible. The live browser now loads seven versioned scripts through `v343-client.js`. See `V30_43_IMPLEMENTATION_SUMMARY.md` and `V30_43_QA_STATUS.md`.

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
