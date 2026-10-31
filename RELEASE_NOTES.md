# V30.70.2 — Pink Salt customer accounts, sales and settlement

Built from Blue_Ocean_Market_V30_70_1_OCT28_QA_GIT_READY.zip. This release implements the approved Customers / Stores and Sales / Orders scope. It does not connect to Coupang, Naver, a website, a payment provider, or any external API.

## Daily workflows

- Customers / Stores has a compact six-column list and three summary cards: outstanding, overdue (included in outstanding), and available credit.
- A full-page customer profile has Orders, Payments & Credit, and Details & Pricing sections. Pricing, credit terms, aging and adjustments remain available without crowding the header. Sections restore on refresh and back/forward navigation.
- New Sale starts with the selected customer when opened from its profile. Receive now supports full/partial receipts; credit-only and credit plus new money reuse the shared payment engine. The order saves once before the money review, remains unpaid until confirmation, and can be reopened if the payment is cancelled or fails.
- Sales / Orders shows order, buyer-payment and company-settlement states separately. Order details separate items, payments/settlement, and documents/history. Existing invoice, stock/lot trace, cancellation and refund functions remain connected.
- Customer payments can pay multiple orders. Each physical bank/cash receipt is recorded once; allocating existing credit adds no bank movement. Receipts, direct payments, refunds, order allocations, evidence and Finance state appear together.

## Channels and payouts

The release extends the existing commerce_channels, commerce_product_channels and commerce_external_transactions masters rather than adding parallel commerce ledgers. Direct sales, local stores, marketplaces and an own website have distinct channel/store records. Marketplace payouts are the default for marketplace channels; a website can also use provider payouts instead of immediate company receipts.

Each channel can identify its seller/store and an optional settlement customer/store account. That account can receive one payout for orders from multiple buyers. Buyer and payout-account statements include the corresponding cross-account allocation entries without duplicate receipts.

External order/payment references and external order-line identifiers are preserved with internal IDs. External product/option codes map to the existing SKU. Duplicate order references are scoped to the seller channel. Duplicate active payout references cannot create another receipt. Source, external status, event payload and event hash fields support a later authenticated adapter; repeated events are recognized and changed payloads are marked Conflict, without silently rewriting protected records.

A payout separates gross order application, fees and actual net company receipt. Documented refund/adjustment offsets use previously held credit from the same channel/account. The source credit allocations must be released first. These offsets create no bank refund and are not treated as platform fees. An offset exceeding held credit is rejected; an unexplained difference stays unsettled. Net-zero or negative provider settlements require a separately reviewed non-cash settlement design; they are not fabricated as bank receipts in this release.

## Controls and corrections

- Existing Finance approval, verification, evidence, currency valuation and Accounting policy controls remain authoritative.
- Credit applications use their allocation/payment date, leaving the original receipt unchanged; closing an old receipt period does not require rewriting its bank movement.
- Grouped allocation journals wait for parent-receipt Finance verification and required approval/policy checks in both individual and bulk Posting Control.
- Releasing receipt allocations preserves history. Posted allocations require a controlled reversal to be posted before operational credit is released. Corrected payouts retain channel/refund-offset references and can review their order allocations.
- Payouts using prior credit cannot reverse while their linked prior-credit allocations remain active.
- Cancellation uses the existing stock/Finance/Accounting mechanism in one transaction. An order with receipt/credit allocations requires those allocations to be released first. Cancelled direct-sale money is shown as refund due separately from reusable credit.
- Statements include unused-credit refunds and cross-customer platform allocations, and sort running balances by transaction date. English/Korean invoice generation and existing statement exports remain available.

## Deployment and boundaries

Use the supported Node 22 runtime and the existing one-PostgreSQL configuration. No new environment variables or application dependencies are required. Additive migration 010 runs through the existing startup migration mechanism. Migrations 001–009 and the frozen SQLite migration catalog are unchanged. Existing data is not reset.

No automatic order import, webhook listener, credentials screen, payout synchronization, stock push or external API calls are enabled. A future adapter must authenticate its source, resolve SKU/store identities, compare source revision/time, review conflicts and call the same operational/payment services. An external buyer-payment event is not a company bank receipt. Imported returns and zero/negative settlements need explicit operational and accounting treatment before connector activation.

See QA_CUSTOMER_SALES_702.md and qa/evidence/v30_70_2-release.json for validation and limits. No Git push, pull, merge or Render deployment was performed for this build.
