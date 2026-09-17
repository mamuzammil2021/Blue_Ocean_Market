# Blue Ocean Market V30.31.0

**Lifecycle Integrity + Controlled Void/Reversal + Finance-Ready Posting Control + QA Refinements — Git-ready / Render Persistent Disk**

V30.31.0 is built directly on the protected V30.30.0 baseline. It is a focused QA/integrity release: it fixes the reported Supplier/Finance correction/void issues, introduces stage-driven lifecycle controls, preserves audit history for void/reversal actions, synchronizes linked machine/supplier/accounting effects, and keeps Finance-not-ready cash proposals out of the actionable Accounting Posting Control queue. Unrelated business workflows are intentionally left unchanged.

### V30.31.0 scope

- Add Supplier Save now closes on success and refreshes the Supplier list.
- One clear navigation path on full-screen workflows, compact Accounting working chrome, and a thinner sidebar scrollbar.
- Central stage-driven **Request Void / Request Reversal** policy based on Finance state, Accounting state, permissions, approvals, periods and linked dependencies.
- Posted Accounting records are never deleted: the original Posted journal is preserved and a linked reversal proposal/journal is created.
- Source-aware **Correct & Resubmit** for machine costs, with original fields/evidence preserved and no unrelated mandatory Counterparty field.
- Machine costs use **Edit + Void**; voided records remain visible for audit and are excluded from active cost calculations.
- Purchase Token / supplier-payment voids recalculate linked machine purchase paid/outstanding and supplier payable; machine-cost voids recalculate cost basis and sold-machine COGS/profit where applicable.
- Impact Review & Confirm shows linked Finance, Accounting, machine, supplier/buyer and reporting effects before controlled lifecycle execution.
- Supplier Payment entry is Purchase-only; obsolete Sale type is removed.
- Accounting Posting Control Pending Review shows Finance-linked cash proposals only after **Finance = Verified**; Accounting badge follows the same actionable rule.
- Lifecycle audit history and stakeholder notifications preserve the complete change chain.

See `V30_31_IMPLEMENTATION_SUMMARY.md` for the detailed requirement-to-implementation map.

### V30.31.0 QA status

- `npm run qa:current` — **PASS**
- `npm run qa:render` — **PASS**
- `node qa/qa_v331_button_actions.js` — **PASS** (targeted button/action wiring audit)
- JavaScript/server syntax checks — **PASS** as part of current QA
- Final ZIP is extracted and both main QA gates plus the button/action audit are rerun before delivery.
- Runtime smoke is not claimed in this build container because `npm ci` timed out before dependencies were installed. Run `npm ci && npm run qa:runtime` in the normal Node 22 target environment.

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
