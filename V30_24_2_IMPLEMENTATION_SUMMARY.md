# V30.24.2 Implementation Summary

**Release:** V30.24.2 — SYSTEM_WIDE_NESTED_DIALOG_FINANCE_REFERENCE_HOTFIX_LOCAL_TEST  
**Baseline:** V30.24.1 WORKFLOW_CONTEXT_FINANCE_DOCUMENT_STATEMENT_REFINEMENT_LOCAL_TEST

## Implemented

### System-wide nested dialog isolation
- Replaced destructive single-modal replacement behavior at the final UI overlay with a shared nested-dialog stack.
- When a child dialog/preview opens, the exact parent dialog DOM node is detached and preserved rather than destroyed. This retains unsaved field values, file selections, event state and modal scroll position.
- Closing a child restores only the immediate parent (LIFO / one level at a time).
- Parent dirty/unsaved state, focus target and page/modal scroll context are restored with the parent.
- `closeModalAfterSave()` supports a one-shot same-level parent refresh so post-save re-rendering does not create duplicate parent dialogs.
- Added an explicit `closeAllModalsV3242()` helper for actions that intentionally need to clear the complete dialog stack.
- Backdrop close applies only to the currently visible topmost dialog.
- Escape is captured once at Window level so older document-level Escape handlers cannot close both child and parent.
- The shared behavior applies to Finance, Accounting Posting Control, Buyers, Suppliers, Machines, Documents/SOPs, Attachments, Approvals, Reports and other workflows that use the common `modal()` / `closeModal()` layer.

### Shared Close (X) / dialog-header layout
- Added protected right-side space for the standardized V30.22 Close control.
- Title/subtitle, status, action buttons and attachment preview actions can no longer occupy the reserved Close area.
- Long filenames/details can wrap safely.
- Attachment preview `Download Original` and other actions wrap responsively on smaller screens without colliding with Close (X).

### Finance correction reference integrity
- Finance correction forms now expose the current `finance_id` to the shared payment-reference validator.
- UI validation sends `exclude_finance_id` when checking a correction.
- Backend duplicate-reference validation now expands that ID into the whole current logical payment identity and excludes linked/mirrored Finance rows using source key and source-payment/source aliases.
- Keeping the original reference on the transaction being corrected is therefore valid.
- The same normalized reference is blocked only when used by a genuinely different active transaction on the same Company Financial Account.
- Same-reference usage on another financial account remains a warning rather than a conflict.

### Legacy “Unassigned KRW Bank” protection
- The legacy clearing placeholder is preserved for historical data but removed from interactive financial-account options.
- V30.19-era account selectors also filter the placeholder.
- Server-side exact-account validation rejects use of the placeholder for new/corrected money movement and requires an actual configured Company Financial Account.

### Accounting Posting parity
- Accounting Posting Review evidence continues through the authenticated shared stored-attachment viewer.
- Because the viewer now uses the centralized nested-dialog stack, closing an Accounting evidence preview restores the same Posting Review dialog rather than closing it.
- The same protected Close/header rules apply to posting evidence previews.

## QA
- `npm run qa:current`: **PASS**.
- Added V30.24.2 checks for nested parent preservation, one-level close-after-save behavior, Escape/backdrop isolation, protected Close/header layout, Finance correction ID forwarding, logical-payment reference exclusion, legacy account blocking and Accounting Posting preview inheritance.
- All server/client JavaScript files pass `node --check` through the current QA suite.
- Runtime smoke is not claimed in this build container because `node_modules` is intentionally excluded and `better-sqlite3` is not available locally. Run `npm ci && npm run qa:runtime` in the normal Node 22 test environment before production deployment.
