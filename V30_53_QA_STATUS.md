# V30.53.0 QA status

## Completed in build environment

- All inherited release static/source/syntax checks plus V30.53 dedicated regression suite completed successfully (see release QA log).
- Dedicated V30.53 suite asserts 10 requirements' source paths, idempotency middleware retention, cost lock rule, sell-reference debounce, notification in-place update, and version/load order.
- Syntax checked all packaged public and server JavaScript modules.
- Compressed JavaScript sidecars verified byte-for-byte after decompression against source.
- ZIP integrity and SHA-256 verified after packaging.

## Must test in staging / before production

1. Create/edit a machine cost before Finance Verify; reject/review attempt remains editable; Verify locks; posting correction stays controlled.
2. Buy Machine token: change company and supplier account to second eligible account; add a supplier account from in-progress purchase; ensure selected IDs persist.
3. Sell Machine with New Payment and New Payment + Advance: reference input and one Complete Sale click followed by Review & Confirm; no duplicate settlement, allocation or Finance row; check slow/network failure.
4. Protected modal: payment after final Confirm; double-click, close, Escape, delayed/ambiguous requests; one server transaction and one success notice.
5. Buyer Edit from list and profile; preserve list search, pagination and scroll.
6. Notification bell/full page Mark read retains visible item/scroll, reopening filters; Open related marks correct item read.
7. Advanced Accounting reload shows one Back to Simple View; Posting Control toolbar is not redundant.
8. English vs Korean placeholders and account details; edit retains true persisted values; no illustrative prefill in create form.
9. Run authenticated live runtime smoke, role/BU, financial balances/void/reversal, Render persistent disk and real PDF workflows.

Not production-certified solely by these source checks. Keep V30.52.0 rollback ZIP; do not reset persistent storage.
