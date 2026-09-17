# Blue Ocean Market V30.32.0 Implementation Summary

V30.32.0 is a focused UI/account-flow refinement release built directly on V30.31.0. It preserves the V30.31 lifecycle integrity, controlled Void/Reversal, Finance Integrity Rule, Accounting Posting Control, receiver-account traceability, Pakistan/Korea account routing and existing operational workflows.

## Implemented refinements

1. **System-wide Receiver / Payee Account modal stability**
   - Saving or archiving a receiver/payee account refreshes the current modal in place.
   - The same modal is not recursively opened or stacked.
   - The add-account form resets after successful Save because the modal content is re-rendered from the refreshed account list.
   - One Close returns to the correct parent workflow; restored parent receiver selectors refresh and can select the newly created account.

2. **Minimal sidebar scrollbar**
   - Sidebar navigation uses a 2 px WebKit/Chromium scrollbar and Firefox thin-scrollbar treatment.
   - The scrollbar remains usable but does not consume unnecessary navigation width.

3. **Accounting top-area cleanup**
   - Hides repeated Official Accounting banner, version/navigation note and duplicate overview explanation in the Accounting workspace.
   - Keeps Advanced/Simple navigation where required but removes repeated Advanced Accounting description copy.
   - Adds compact Posting Control beside the title-row actions with a pending count badge.

4. **Buyer Detail action stability**
   - Buyer Statement / Pakistan Resales / Payment Accounts action area is visually held stable while older async enhancement passes complete.
   - Prevents the reported 2–3 visible button flashes/re-renders on Buyer open.

5. **Buy Machine token payment: Paid From + Paid To**
   - Token payment now exposes the exact Company Financial Account used to pay the token.
   - Existing suppliers expose their saved Receiver / Payee Accounts for the destination side.
   - Add / Manage Accounts is available without abandoning Buy Machine.
   - New suppliers can enter their receiver-account details inline; the supplier and destination account are created together on Save.
   - Electronic token payments require a valid destination account.
   - Token payment evidence and account data are submitted together as multipart form data.

6. **Supplier payment destination persistence**
   - Adds nullable `receiver_account_id` to `excavator_payments` (additive migration only).
   - Purchase token and later supplier Purchase payments preserve the selected supplier destination-account relationship.
   - Finance continues to retain immutable receiver snapshots for verification/audit.

7. **Responsive Add Machine Cost receiver section**
   - `Paid To · Receiver Account` spans the available modal width.
   - Two-column layout is used where space permits and collapses to one column on small screens.

8. **Correct & Resubmit Finance context**
   - Adds a read-only Original Transaction Context before editable correction fields.
   - Shows Paid From Company Financial Account, Paid To Receiver/Payee Account, original amount/currency/FX/KRW value, method, reference, transaction date, due date, source type/id/label, linked record/payment ids, category, status/verification and description.
   - Account numbers remain masked.
   - Existing source-aware correction/resubmission logic remains unchanged: the original Finance transaction is updated/resubmitted rather than duplicated.

## Schema and migration

V30.32.0 is additive only. It adds `excavator_payments.receiver_account_id` plus an index. Existing rows remain valid with a NULL receiver account. No destructive migration, database reset or upload reset is required.

## QA completed in build environment

- `npm run qa:current` — PASS
- `npm run qa:v332` — PASS
- `npm run qa:render` — PASS
- JavaScript syntax checks — PASS through the QA suites

Runtime smoke is not claimed in this build container because dependencies were not installed. Run `npm ci` and `npm run qa:runtime` in the target Node 22 environment before production deployment.
