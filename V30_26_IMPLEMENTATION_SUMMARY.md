# Blue Ocean Market V30.26.0 Implementation Summary

V30.26.0 is an Excavator workflow-integrity release built directly on the protected V30.25.2 testing/reset baseline. It preserves all prior business units, System Settings, Finance, Accounting, access control, attachments, numbering, review/confirm, Render persistent-storage support and test-environment reset controls.

## Excavator purchase fixes

- Buy Machine supplier search is now a full-width searchable result list rather than relying on an exact-name datalist match.
- Search results show supplier name, location, contact person, phone and available-machine count.
- Selecting a supplier immediately loads and reveals Supplier Available Machine.
- Cash token payments no longer require a payment reference. Non-cash token payments still require a reference and all token payments still require evidence.

## Machine payment UI / synchronization

- Add Payment form state is cleared after save and no longer reopens with the previous payment data when the Payments list is closed.
- Saving/voiding a machine payment refreshes the Payments list and the underlying Machine Details state immediately.
- Voided payments remain visible for audit but are excluded from valid paid totals.

## Sell / Update Sale controls

- Required Sell Machine fields receive strong inline error highlighting with focus/scroll to the first missing field.
- Update Sale displays the current settlement source(s), amount, currency/FX, method, date, reference, receipt and allocated amount.
- Existing payment reference/evidence remains visible and is preserved unless explicitly corrected.
- Financial corrections use reversal/replacement logic; metadata/evidence-only corrections do not create unnecessary cash reversals.
- Buyer Advance allocations can be released/reallocated without deleting the original buyer receipt.
- Sale-price increases require only the additional settlement; price decreases release the excess to buyer unallocated credit.
- Add Another Payment is a distinct action. A new Payment Amount can differ from the sale outstanding. The sale receives only what is outstanding and any excess becomes buyer advance / credit.
- Buyer incoming-payment account wording is Receive Into Company Bank / Financial Account.
- 100% settlement is still required before a new machine sale can complete.

## Sold machine lifecycle

- Sold / Completed machines no longer show the normal Delete action.
- Authorized users receive controlled Sale / Status Actions in Open Machine: Void Sale, Archive Machine and Restore from Archive.
- Void Sale preserves history, reverses active sale allocations, returns buyer funds to unallocated credit where appropriate, reverses the operational sale Finance/Accounting source, restores the machine to its prior available lifecycle stage and regenerates the sale PDF as VOID.
- Supplier purchase payments are not reversed merely because a customer sale is voided.
- Archive is non-financial and preserves all historical records.

## Sale PDF and document access

- The machine Sale PDF now shows Supplier Payment Status, Total Valid Paid and Remaining Supplier Balance.
- Purchase payment history includes status so voided entries cannot be confused with valid payments.
- Generated sale PDFs open through the authenticated attachment viewer instead of exposing a public upload URL.
- VOID sale PDFs remain retained in Documents for audit.

## Accounting integrity

- Direct buyer receipts that exceed a sale allocation are split correctly between Accounts Receivable clearing and Customer Advances.
- Mixed settlements (buyer advance + direct payment) are posted according to the active allocation source instead of forcing the whole sale through a single settlement account.
- Reallocation/void workflows resync the buyer receipt source so Posting Control can reflect the current economic classification without deleting the original cash event.

## UI cleanup

- Removed the redundant Suppliers and Buyers shortcut buttons from the Excavator Operations header; the dedicated sidebar modules remain.
- Added Archived as an explicit machine filter while archived machines stay out of normal active views.

## Release identity

- Package/application/browser cache version: `30.26.0`.
- Current protected baseline inherited: V30.25.2.
