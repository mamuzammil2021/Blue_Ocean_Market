# Blue Ocean Market V30.65.0 — Pink Salt Operational & Commerce Foundation

Built directly on protected V30.64 EN/KR Bilingual Integrity baseline.

## Completed in V30.65.0

### Pink Salt import workflow correction
- Physical shipment receipt is no longer blocked by full supplier settlement.
- Received imports may retain an outstanding supplier payable.
- Supplier payments may continue after physical receipt.
- Finance/Accounting source integrity remains unchanged: receipt moves inventory; supplier payment remains a separate real-money event.
- Pink Salt import detail/receive UI now explains the separate physical and financial statuses.

### Channel-agnostic commerce foundation
- Added generic Commerce / Channels workspace inside Pink Salt using existing Blue Ocean/Excavator design language.
- Generic channel types: Own Website, Marketplace, Social Commerce, B2B Portal, Internal, Other.
- Generic integration modes: Manual, API, File Import / Export, Webhook, Connector Pending.
- No Coupang/Naver-specific schema or hard-coded dependency.
- Protected Internal Sales channel is seeded for Pink Salt.

### Product-channel controls
- Per-product / per-channel enable/disable foundation.
- Publication status and external product/variant/seller SKU mappings.
- Inventory policy foundation: Shared, Allocated, Maximum Quantity.
- Safety stock, allocated quantity and maximum sellable quantity fields.
- Sync-ready state fields without making external API calls.
- Existing Pink Salt on-hand minus reserved logic remains the authoritative Available to Sell calculation.

### Product/catalog readiness
Non-destructive compatibility columns added to existing Pink Salt products for:
- EN/KR product names
- product family / variant label
- category
- grind/mesh
- UOM
- barcode
- sellable status
- shelf-life days
- origin
- EN/KR ingredients and storage instructions
- website-ready indicator

Existing products are preserved; `name_en` is backfilled from the existing product name only when blank.

### Future commerce data foundations
- Generic commerce price lists and items.
- Customer multi-address table for future B2C usage.
- Order source channel, external order IDs and fulfillment status fields.
- External payment/shipment/settlement reference fields.
- Shipment foundation.
- External transaction/payment/settlement foundation.
- Production lot/best-before compatibility columns.

### UI / bilingual consistency
- Commerce / Channels appears in Pink Salt navigation and follows established Blue Ocean/Excavator cards, tables, status chips, action rows and modal patterns.
- New V30.65 user-facing labels/messages have Korean translations.
- Existing system-wide Review & Confirm / mutation protection remains active for forms and API mutations.

## Deliberately NOT built yet
- Public website/storefront
- Shopping cart / checkout / customer login
- Payment gateway integration
- Coupang, Naver, Amazon or other marketplace connectors
- Courier APIs
- Automatic external product/order/stock synchronization
- Automated marketplace settlement reconciliation
- Full promotion/SEO engine

## Remaining Pink Salt improvement work
1. Surface the new catalog fields in the operational Finished Goods product profile/form (EN/KR content, variants, barcode, origin, shelf life).
2. Expand production UI to actively manage lot number / best-before and strengthen lot-to-order tracing.
3. Formal warehouse/location master (warehouse / zone / rack/bin) rather than only text location fields.
4. Connect commerce price-list foundation to the existing Pink Salt pricing workflow without duplicating current tiers/customer prices.
5. Extend customer UI to manage multiple addresses and B2C customer details.
6. Evolve order UI to show separate order/payment/fulfillment statuses where useful while preserving current workflows.
7. Add shipment/return operational screens when actual e-commerce/marketplace fulfillment is introduced.
8. Add connector adapter framework and platform-specific APIs only when a channel is selected for integration.
9. Continue Pink Salt UI refinement against Excavator design standards, including shared modal right-whitespace cleanup when affected dialogs are touched.

## QA status
- JavaScript syntax checks passed for V30.65 server/client changes and touched V30.64 files.
- `qa/qa_v365_pink_commerce.js`: PASS (14/14 checks).
- V30.64 i18n functional assertions: translation/integrity checks passed; two legacy assertions fail only because they are intentionally pinned to literal V30.64 asset version strings.
- Full runtime/database QA was not executed in this isolated packaging environment because the uploaded Git-ready source does not include installed Node dependencies and dependency installation did not complete within the tool environment. No production or user SQLite database was opened/reset.
