# V30.24.1 Implementation Summary

**Release:** V30.24.1 — WORKFLOW_CONTEXT_FINANCE_DOCUMENT_STATEMENT_REFINEMENT_LOCAL_TEST  
**Baseline:** V30.24.0 SAFE_FULL_SCREEN_WORKFLOW_BUTTON_QA_LOCAL_TEST

## Implemented

### Workflow context
- Added a nested workflow context stack around the existing explicit V30.24 full-screen helper.
- Child full-screen workflows restore the exact parent HTML/scroll state when closed.
- Background data sync refreshes counters/notifications but does not collapse an active full-screen record.
- Same-record re-renders do not create stale nested workflow copies, supporting Buyer Payment/Advance return to the same Buyer Detail screen.

### Attachment/dialog UI
- Added a shared responsive dialog header pattern separating title/subtitle, state, actions and Close.
- Replaced stored attachment preview entry points with authenticated metadata/view routes.
- Image/PDF previews show original filename/metadata, safe long-name handling, Download Original and a reserved Close control.

### Finance correction and history
- Correction reference uniqueness now excludes the Finance row being corrected and validates against other active rows on the exact selected Company Financial Account.
- Correction form exposes the exact Company Financial Account where account control applies.
- Existing receipt, Finance attachments and linked source evidence remain visible and preserved.
- New/replacement evidence is optional when valid evidence is already linked.
- Correction history is rendered as Date/Time, User, Action, Status, Field Changed, Old Value, New Value and Reason/Note.
- Raw technical metadata is omitted for ordinary users and only returned/displayed in collapsed Technical Details for audit-authorized users.
- History/correction workflows return to the same Finance context rather than collapsing to the Finance list.

### Documents & SOP
- Added document archive metadata and `document_history_v3241`.
- Final documents cannot be reopened through workflow transitions.
- Document deletion is now soft archive; the original file and metadata remain preserved.
- Archive records previous workflow status, reason, actor/time and audit history.
- Authorized Restore/Unarchive returns the document to its previous valid Draft/Submitted/Approved/Final state and records a restore audit event.
- Archived documents are not returned to unauthorized users.
- Documents UI is separated into Active/In Progress, Final Documents and authorized-only Archived Documents.
- Clear actions are used: View, Download, Archive, Restore, History.

### Statements and PDFs
- Buyer, Excavator Supplier and Pakistan resale-share activity summaries now use the selected period.
- Pink Salt customer/supplier ledgers expose period debit/credit and transaction count.
- Opening balances continue to include valid pre-period history, while closing/outstanding balances reconcile from the selected period correctly.
- Statement PDF/HTML generators were redesigned with Blue Ocean Market branding, statement period/generated metadata, summary cards/boxes, clearer transaction tables and improved multi-page layout.
- Existing Korean-capable font/rendering behavior is preserved and labels are bilingual-ready.

### QA
- Updated release/cache identity to V30.24.1 and retained every inherited V30.24 QA assertion.
- Added release-specific checks for workflow context, safe refresh, preview layout, Finance correction/evidence/history, document archive/restore/final lock and statement period/PDF quality.
- `npm run qa:current`: PASS.
- Runtime smoke was not executable in the build container because the environment could not resolve `registry.npmjs.org` to install the native `better-sqlite3` dependency. This is an environment/dependency-fetch limitation, not a static QA failure; run `npm ci` then `npm run qa:runtime` in a normal networked Node 22 environment before production deployment.
