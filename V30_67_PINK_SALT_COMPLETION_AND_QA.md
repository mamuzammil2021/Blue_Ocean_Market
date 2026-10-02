# Blue Ocean Market V30.67.0 — Pink Salt Operational Completion

Built directly on V30.66.0.

## Completed
- Product Family → SKU Variant model and non-destructive migration from existing `product_family` text.
- Product/variant media remains stored once in Blue Ocean; every sellable SKU can carry its own image library.
- Finished lot register built from completed production outputs.
- FEFO lot allocation for completed orders.
- Order → finished lot → production batch → raw import traceability.
- Best-before/expiry visibility and lot quality status (Released / Hold / Rejected / Legacy).
- Customer classification and complete address edit/default controls.
- Fulfillment status is visible in Sales / Orders, separate from payment and order status.
- Explicit pricing hierarchy visibility.
- Pink Salt Attention Center for stock/packaging/expiry/fulfillment exceptions.
- Grouped Pink Salt sidebar consistent with the Blue Ocean design language.
- V30.66 Product Master catalog save-path persistence corrected.

## Intentionally deferred
- Public website/storefront, cart, checkout and customer login.
- Coupang/Naver/Amazon/other marketplace-specific connectors.
- Payment-gateway/courier connectors and automatic external synchronization.
- Advanced multi-warehouse transfer/picking engine.
- Full return inspection/restock/waste workflow.

## Database safety
All V30.67 changes are additive. No DROP/reset/delete migration is included. Existing Pink Salt, Finance and Accounting records remain authoritative.

## QA
Run `npm run qa:v367` for the V30.67 static completion gate. Full runtime smoke/staging QA still requires dependencies and a test database/environment.
