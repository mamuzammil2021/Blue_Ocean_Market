# Blue Ocean Market V30.69.2 — Pink Salt QA 06 Oct + Shared Navigation/Payment Controls

## Baseline
Built directly from V30.69.1 (`Blue_Ocean_Market_V30_69_1_PINK_SALT_IMPORT_PAYMENT_CHOICE_GIT_READY.zip`).

## Scope completed

1. **Supplier edit parent/child navigation**
   - Edit opened from Supplier Profile returns to the same supplier profile after Save, Cancel or X.
   - Edit opened from Supplier List remains on the list after Save, Cancel or X.
   - Reuses the Excavator origin-aware edit/navigation pattern.

2. **Cash / Bank Paid From compatibility**
   - Pink Salt payment forms refresh eligible company accounts when Payment Method changes.
   - Cash shows Cash accounts; Bank shows compatible Bank/Payment accounts.
   - Existing server-side validation remains the integrity backstop.

3. **URL-addressable record state foundation**
   - Core hash boot now accepts record/sub-route hashes instead of collapsing them to only a top-level view.
   - Pink Salt Supplier Profile deep links preserve supplier id and selected section.
   - Pink Salt Import Detail deep links preserve import id.
   - Refresh and copy/paste URL can restore these implemented Pink Salt record pages.
   - This is the shared routing foundation for progressively migrating other record pages system-wide; it does not claim every legacy screen has already been converted.

4. **Supplier archive separation / restore**
   - Active and Archived supplier views are separated.
   - Archived suppliers no longer remain mixed with active suppliers.
   - Authorized users can restore/unarchive an archived supplier.

5. **Import Cost controls aligned to Excavator Machine Cost**
   - Finance Verified / Accounting Posted cost: edit action replaced with a lock state.
   - Received import: import cost edit/void locked.
   - Import-cost removal uses **Void**, not Archive/delete terminology.
   - Void uses the existing `payment.void` approval engine (including CEO direct authorization confirmation where applicable) and preserves audit/history.
   - Supplier Payments and Import Cost panels use equal-width layout.
   - Panels are bounded; after several records they scroll vertically instead of expanding indefinitely.

6. **Edit Import supplier selector**
   - Uses the same searchable supplier presentation as Create Import.
   - Current supplier is restored/preselected in the search control.
   - Authorized user may select another supplier subject to existing validation.

7. **Salt category remove control**
   - The red remove X is anchored inside the relevant Salt Category row/section rather than appearing as a second modal-close control.

8. **Import payment option stability**
   - Supplier Advance Only / New Payment Only / Advance + New Payment modes remain the V30.69.1 shared Excavator-style pattern.
   - Mode switching forces the correct payment-account refresh when a fresh-money payment is involved.

9. **Import payment return context**
   - Saving/recording an import settlement from Import Detail returns to the same Import Detail route rather than dropping to the import list.

10. **Repacking `qty is not defined` defect**
    - Added a safe shared quantity formatter fallback used by the legacy repacking runtime.
    - Visible Finished Output quantity changes now synchronize to the repacking output state and rebuild raw-input requirements.

## Reused/generalized Excavator/shared capabilities
- Origin-aware parent/child navigation
- Payment method ↔ company account compatibility
- Archive / restore lifecycle pattern
- Finance Verified / Accounting Posted lock presentation
- Controlled approval-based Void workflow
- Bounded cost/history panels
- Record-specific URL/deep-link state pattern
- Targeted post-action return instead of full-list remount

## Finance / Accounting integrity preserved
- Supplier advance allocation remains non-cash.
- Only actual new money creates Finance movement.
- Import cost Finance Verified / Accounting Posted rows are not directly editable/voidable.
- Received imports lock cost mutation from the Import Detail workflow.
- Void retains history and uses approval/audit rather than physical deletion.

## QA executed in build environment
- V30.69 shared workflow QA: 18/18 PASS
- V30.69.1 payment-choice QA: 14/14 PASS
- V30.69.2 QA: 17/17 PASS
- JavaScript syntax checks: PASS for modified server/client overlays and server entrypoint.

## Runtime acceptance still required
This environment did not perform an authenticated browser session against the live Render persistent database. Before merging to main, validate the flows on Render using the existing database and persistent disk. Do not reset the database or persistent disk.
