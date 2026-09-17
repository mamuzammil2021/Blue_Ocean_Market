# Blue Ocean Market V30.31.0 — Implementation Summary

**Release focus:** Lifecycle Integrity + Controlled Void/Reversal + Finance/Accounting Posting Eligibility + QA Refinements

V30.31.0 is a focused integrity/QA release built directly on the protected V30.30.0 baseline. It does not redesign unrelated business workflows. The release hardens destructive-action lifecycle rules so Finance, Accounting, Excavator machine costs/payments and linked records remain traceable and internally consistent.

## 1. Supplier and workflow UI QA

- Fixed **Add Supplier → Save** so a successful save closes the modal and refreshes the Supplier list; validation failures stay visible in the current form.
- Reduced duplicated workflow chrome: full-screen workflows keep one clear Back/navigation path instead of simultaneous Back/X/breadcrumb navigation.
- Made Accounting working headers more compact so actionable data appears higher on screen.
- Reduced the visual weight of the sidebar scrollbar while keeping the sidebar scrollable.
- Removed the obsolete **Sale** option from Supplier/Machine supplier-payment entry; supplier payments are Purchase-side cash movements only.

## 2. Central lifecycle / stage policy

V30.31 adds a central stage-aware lifecycle policy for Finance/source transactions. Action availability is calculated from record type, Finance state, Accounting state, approval state, period status, permissions and downstream dependencies.

- **Draft / unlinked setup data:** ordinary edit/delete can remain available where no operational/financial history exists.
- **Pending/unverified Finance:** controlled Request Void may be available.
- **Correction Required / Resubmission:** source-aware Correct & Resubmit remains the normal correction path; conflicting lifecycle actions are constrained.
- **Finance Verified but not Accounting Posted:** controlled void/reversal invalidates/cancels the pending Accounting proposal and updates linked operational balances.
- **Accounting Posted:** the UI exposes **Request Reversal**, not destructive Void. The original Posted journal remains immutable and a linked reversal proposal/journal is created.
- **Closed period / unsafe downstream dependency / already voided:** action is blocked or redirected to the appropriate controlled accounting workflow.

The browser hides lifecycle buttons when the action cannot validly execute instead of showing a button that will fail.

## 3. No silent destruction / audit chain

Material Void, Cancel, Reverse and correction actions preserve the original record. V30.31 adds lifecycle-action audit history containing action, stage/status, reason, requester/approver context and linked record identity.

The intended audit chain is:

`Original operational source → Finance → Finance verification/correction → Accounting proposal → Posted journal → Void/Reversal request → linked reversal/updated source → final balances`

Voided machine costs/payments remain visible with status/reason rather than disappearing from history.

## 4. Impact Review & Confirm

Before a controlled Void/Reversal, the user is shown the affected-record impact map. Depending on the source, this can include:

- Finance transaction and verification status
- Accounting proposal / Posted journal / required reversal
- Excavator machine and machine cost basis
- Supplier purchase paid/outstanding/payable balance
- Buyer/payment allocation where applicable
- Sold-machine COGS / profit impact
- linked operational source, reports and audit history

If the system cannot safely synchronize a linked dependency, the action is blocked rather than applying a partial silent mutation.

## 5. Machine cost and supplier-payment lifecycle

- Machine costs now use **Edit + Void** semantics instead of destructive Delete.
- Voided costs remain visible with a clear Voided state and are excluded from active machine-cost calculations.
- Finance Verification shows linked machine/deal context for machine-cost/payment records.
- Voiding a supplier payment recalculates machine purchase paid/outstanding status and supplier payable.
- Voiding an eligible machine cost recalculates machine cost basis. If a sold machine's COGS already includes that cost, the sold-machine COGS/profit Accounting proposal is re-synchronized through the controlled lifecycle.
- Purchase Token void handling recalculates the token/payment state from the original active token source rather than leaving a stale token amount.

## 6. Source-aware Correct & Resubmit

The Finance correction form for an Excavator Machine Cost now mirrors the original source fields instead of inventing unrelated mandatory fields such as Counterparty. Original currency/amount, FX, method/reference, receiver details, machine-cost flag, notes and evidence context are preserved/prefilled where applicable.

**Save & Resubmit** updates the original linked source/Finance record, preserves prior evidence/history, and returns the item to the Finance verification flow.

## 7. Posting Control eligibility

The actionable Accounting Posting Control queue now follows the standing eligibility rule:

- Finance-linked cash/payment proposals appear in **Pending Review only after Finance = Verified**.
- Pending Verification, Correction Required, Void/Reversal-in-progress and otherwise Finance-not-ready records do not clutter the actionable queue.
- Non-cash operational proposals remain eligible after their operational source is Completed/Approved under the existing Accounting Posting Eligibility rule.
- Posted/Cancelled/Reversed records remain available in history/all-record views.
- The Accounting sidebar badge counts only actionable posting work.

## 8. Notifications and linked-state refresh

Controlled lifecycle execution records audit history and notifies relevant affected users according to available Finance/Accounting/BU/operations context. Linked Finance, Accounting, machine purchase/cost, supplier payable, sold-machine COGS and related counters/reports are refreshed/re-synchronized after successful execution.

## 9. Schema / migration

V30.31 uses additive startup-safe schema changes only:

- `lifecycle_action_history_v331` audit table + indexes
- machine transaction lifecycle fields for void reason/actor/time where absent

No database reset is required. Existing persistent database and uploads must be preserved.

## 10. Release QA

Release acceptance is gated by:

- `npm run qa:current`
- `npm run qa:render`
- JavaScript syntax checks included in current QA
- fresh-ZIP extraction followed by both QA commands
- `npm run qa:runtime` after `npm ci` in a Node 22 environment with dependencies available

V30.31-specific QA checks cover Supplier Save, single navigation, compact Accounting/sidebar behavior, stage-driven Void/Reversal policy, source-aware correction, Save & Resubmit, machine-cost Edit/Void audit preservation, Purchase-only supplier payments, Finance-ready Posting Control, actionable Accounting badge, posted-journal reversal, impact mapping, linked purchase/COGS re-sync and duplicate/closed-period blocking.
