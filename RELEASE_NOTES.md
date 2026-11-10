# Blue Ocean Market V30.70.14

- Excavator historical cost corrections update the original record, its mirror, and the existing Finance entry atomically. Missing sources and conflicting active Finance entries require System Integrity review.
- Clear recorded parts usage through Finance Correct & Resubmit with a reason. The reversal checks the linked part and machine activity again before writing.
- Archived machine cost history stays readable. Restore the machine for ordinary cost writes. Existing Finance entries can use controlled correction.
- Full packaging receipts with rejected or quarantined stock remain on Receiving. The confirmation shows physical and accepted quantities, stock dispositions, and the linked receiving issue. Clean completed receipts return to Purchases.

Run `npm run qa:reaudit7014` for the targeted fixes and `npm run qa:release` for the release gate.

The local release regression suites passed. The separate November purchase-deletion check hit a previously observed Finance-state timing issue in both attempts.
