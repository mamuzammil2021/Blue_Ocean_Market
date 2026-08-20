# Blue Ocean Market V26.7.0

## Excavator Buyers runtime fix

- Fixed the Excavator Buyers page getting stuck on `Loading...` on fresh/local databases.
- Moved the buyer-payment `status` migration so it runs after `excavator_buyer_payments` is created.
- Backfilled existing buyer payments to `Active` where status is missing/blank.
- Added an index for buyer payment status queries.
- Buyer totals now exclude voided payments.
- Buyer allocations now exclude allocations belonging to voided payments.
- Added a 20-second API request timeout so failed/hung requests cannot leave the UI on an endless loading state.
- Added a Buyer-page retry/error state.
- Updated frontend cache-busting and version metadata to 26.7.0.
