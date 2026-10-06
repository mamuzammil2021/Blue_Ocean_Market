# Blue Ocean Market V30.66.0 — Pink Salt Product Master & Commerce-Ready Operations

Built directly on V30.65.0 Pink Salt Operational & Commerce Foundation.

## Completed

### Pink Salt Product Master
- Evolved Finished Goods into the operational Product Master while preserving existing SKU/BOM/stock records.
- Product catalog now supports EN/KR names and descriptions, product family, variant label, category, grind/mesh, UOM, barcode, sellable status, shelf life, origin, ingredients and storage instructions.
- Existing Pink Salt product create/edit APIs now persist the expanded catalog fields directly; no parallel product database was introduced.
- Pink Salt navigation labels the workspace as Products while retaining the existing `psFinished` route for compatibility.

### Product images / future channel media
- Added reusable product image library with multiple images per product.
- Upload image-only files, preview images through authenticated access, choose primary image, control sort order, keep EN/KR alt text and archive images without deleting the product.
- Product image bytes stay in Blue Ocean persistent upload storage and metadata stays attached to the Pink Salt product.
- Added channel-image mapping foundation so future website/marketplace connectors can select/order a subset of the same stored product images without duplicating the master media record.
- No marketplace-specific image rules or external upload APIs are activated yet.

### Production traceability
- New repacking batches accept Lot No. and Best Before Date.
- The values are persisted on the authoritative production batch and displayed in production details.
- Existing raw-input, BOM/packaging consumption, output costing, waste and accounting behavior is preserved.

### Structured storage locations
- Added Pink Salt Warehouse → Zone → Rack/Bin master with optional location code and active state.
- Seeded a non-destructive Main Warehouse default only when no Pink Salt location exists.
- Products can select a default storage location.
- Stock movement tables have additive location references ready for deeper location-level movement allocation later without rewriting historic movements.

### Pricing foundation completion
- Added operational Price List management using the V30.65 generic commerce price-list tables.
- Price lists can hold product/minimum-quantity prices.
- Product-channel configuration can now choose a price list.
- Existing customer-specific/tier pricing is preserved; this is a reusable channel pricing layer, not a replacement of historical sales snapshots.

### Customer / order readiness
- Existing Pink Salt customers can manage multiple shipping/billing addresses, including a default address.
- Added separate Fulfillment Status control (Unfulfilled / Partially Fulfilled / Fulfilled / Returned) while preserving existing Order Status and Payment Status.
- This prevents future website/marketplace fulfillment from being incorrectly coupled to payment completion.

### UI consistency
- New interfaces reuse established Blue Ocean/Excavator cards, section headers, tables, grids, action rows, status pills, modals, Review & Save language and responsive patterns.
- New EN/KR strings are registered for the touched workflows.
- Existing V30.63 root processing/sticky-dialog safeguards remain authoritative for serious mutations.

## Intentionally deferred
- Public website/storefront, customer login, cart and checkout.
- Coupang/Naver/Amazon/other marketplace connectors or hard-coded platform logic.
- Courier APIs and automatic shipment tracking sync.
- Automatic marketplace order/product/stock/settlement synchronization.
- Channel-specific image publishing UI/rules (schema foundation exists; enable when actual connector work starts).
- Advanced multi-warehouse allocation/transfer workflows and per-movement bin picking.
- Returns inspection/restock workflow beyond the fulfillment-status foundation.

## Database safety
- Additive tables/columns/indexes only.
- Existing Pink Salt IDs, products, BOMs, production, orders, Finance and Accounting records are preserved.
- No DROP/RESET/destructive migration.
- No Render database or persistent disk reset.
