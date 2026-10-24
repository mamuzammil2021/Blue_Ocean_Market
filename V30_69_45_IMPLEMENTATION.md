# V30.69.45 implementation

## Protected baseline

Built from `Blue_Ocean_Market_V30_69_44_RECEIVING_SETTLEMENT_GIT_READY.zip`, SHA-256 `1b407a4d889c58e2c9e59a06fba3f5f67e3254d8616fd063d52608806b06c9d7`. Work is isolated on `feature/v30.69.45-simple-receiving`. Main, remote Git and production were not modified.

## Agreed behavior delivered

- One simple Import/Packaging receiving page: selected purchased categories, actual quantities, condition, date and location.
- Missing-balance questions appear only when a selected category differs. Later/investigation/split choices preserve delivered stock and independent bag/net-weight facts.
- One investigation task per receiving issue, including multiple affected categories. Supplier, purchase, receipt, original prices, expected/received/missing quantities, estimate, currency, evidence, assignment and follow-up remain linked.
- Only disputed missing stock is held. Other categories and the undisputed pending portion remain eligible. Old/direct requests and concurrent requests cannot bypass held or exhausted quantities.
- Decisions cover later delivery, supplier/company/shared/carrier responsibility and controlled measurement correction. Complex financial controls are confined to the issue or optional advanced view.
- Invoice-based unit and settlement values are calculated automatically, using original recognition rates and stock-unit conversions. Original estimates are immutable. A negotiated change requires an explicit explanation, evidence and configured approval. Invoice discounts are included in the net line basis; freight/customs and separately treated taxes are not automatically claimed.
- Supplier credit, invoice reduction, refunds and losses close compensated missing quantities. Replacement/later-delivery obligations use their authorized linked allowance and stay pending until accepted.
- Future credit can resolve the investigation when it becomes available under Approved/Posted policy; unused credit remains a separate supplier balance. Refunds stay pending until actual money is recorded.
- Pending indicators link purchase lists/details, supplier lists/profiles and the original task. Task status follows the outcome; controlled reversal reopens the same task rather than duplicating work.
- Receiving actions disappear when normal eligible quantities are exhausted, fully held or formally closed. Linked-delivery actions disappear when no unreserved delivery allowance remains. History remains available.
- Required approvals still precede Finance verification and final Accounting Posting Control. Normal physical receiving does not gain an unnecessary approval step.
- EN/KR controls, task response projections, direct routes, Back/Forward, responsive views and safe operation recovery are preserved.

## Shared owners and schema

The existing `server/receiving/` receipt, disposition, case and ledger owners remain authoritative. `simple.js` owns the employee flow and task integration; `indicators.js` supplies read-side pending flags. The existing `receiving44.js`/CSS owners now render the simpler default pages, so no duplicate startup bundle or separate supplier master was introduced. The retained V44 API namespace remains for compatibility; new simple requests use `/api/pink-salt/receiving-v44/simple/:type/:id/receipts`.

Two additive tables are introduced:

| Table | Purpose |
| --- | --- |
| `pink_receiving_issues` | One receipt-linked investigation, supplier/purchase identity, task, owner and follow-up |
| `pink_receiving_issue_lines` | Linked cases, original estimate, disputed missing quantities, current holds and decisions |

A trigger protects the original estimate and identifying quantity facts. Hold/decision updates are controlled and audited. The existing receiving migration ledger adds V30.69.45. No old receipt, payment, Finance record or journal is rewritten to fabricate historical claims/tasks/holds.

Original V44 cases retain their history and detailed case tools. New V45 receiving generates the simpler linked issue/task structure. Existing formal closures and quantity balances continue to determine receiving eligibility.

## Correction and fulfillment integrity

A receipt measurement correction is the existing controlled Receipt Reversal, including its stock and Accounting effects. It resolves the associated investigation and restores eligible quantities for correct re-entry. It cannot remove stock already consumed or ignore active settlement dependencies. An entirely missing zero-stock receipt can be corrected without fabricating a movement.

Partial agreements retain disputed portions under the same issue/task. Child claims retain their own holds until resolved. Reversing a parent settlement requires dependent child work to be resolved first. Original task and receipt identities remain stable.

Single and bulk final credit posting synchronize task completion inside the posting transaction. An injected task-projection failure rolls back posting too, so the system cannot report a failed action after secretly committing a financial posting.

## Cleanup and practical limits

The superseded ordinary receipt form, discrepancy editor and their unused receipt-only handlers were removed from the active UI owner. Advanced case tools remain intentionally available for historical cases and uncommon settlements. Temporary debug probes, dependencies, runtime databases/uploads, screenshots and generated sample reports are excluded from the source export.

Company GL mapping, credit availability and cross-currency policy remain CEO decisions. This build does not authorize real policy or invent financial thresholds. Target-host staging acceptance, SMTP delivery and production reconciliation remain deployment responsibilities. The current QA report records exactly what was executed.
