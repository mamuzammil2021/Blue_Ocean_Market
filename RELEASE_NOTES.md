# Blue Ocean Market V30.70.15

- All business-unit dashboards show date presets, a custom range, recorded cash KPIs in KRW and a cash trend chart. Each supported business unit also shows a period count from its own operations.
- Excavator Operations, Suppliers and Buyers use a shared header with page search and their primary action. Machine cards are more compact. The Excavator sidebar omits Warehouses.
- Finance uses a compact tab strip and puts search in the header. Accounting removes repeated Overview copy and Posting Control displays its five indicators in one desktop row.
- The development standard documents the shared record page and dashboard layout.

Run `npm run qa:ui7015` with `BOM_CHROMIUM` set to the browser executable when needed.

# Blue Ocean Market V30.70.14

- Excavator historical cost corrections update the original record, its mirror, and the existing Finance entry atomically. Missing sources and conflicting active Finance entries require System Integrity review.
- Clear recorded parts usage through Finance Correct & Resubmit with a reason. The reversal checks the linked part and machine activity again before writing.
- Archived machine cost history stays readable. Restore the machine for ordinary cost writes. Existing Finance entries can use controlled correction.
- Full packaging receipts with rejected or quarantined stock remain on Receiving. The confirmation shows physical and accepted quantities, stock dispositions, and the linked receiving issue. Clean completed receipts return to Purchases.

Run `npm run qa:reaudit7014` for the targeted fixes and `npm run qa:release` for the release gate.

The local release regression suites passed. The separate November purchase-deletion check hit a previously observed Finance-state timing issue in both attempts.
