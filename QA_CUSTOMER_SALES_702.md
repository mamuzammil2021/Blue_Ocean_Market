# V30.70.2 implementation and acceptance

## Approved scope delivered

| Area | Implementation |
|---|---|
| Customer list/profile | Compact list, three summary cards, visible actions, three lazy profile sections, active/archive history, selected-section routes |
| Sales/orders | Existing cart, customer-prefill, payment-at-sale choices, channel/store identity, external references, order/payment/settlement separation |
| Customer receipts | Shared currency engine, partial/grouped receipts, held credit, full/partial order allocations, combined history and evidence |
| Marketplace/provider payouts | Existing commerce masters, seller account identity, optional payout account, multiple buyer orders, fees versus net receipt, typed held-credit offsets |
| Reconciliation | Consistent invoice/credit/refund calculations, order outstanding, separate refunded/allocated receipt amounts, cross-buyer statements, cancelled-order refund due |
| Financial protection | One actual money movement per receipt, allocation idempotency, atomic rollback, Finance approval/verification, individual/bulk posting readiness, controlled posted reversals |
| Integration foundation | Existing channel/SKU mappings, external order/line/payment/payout/event IDs, duplicate protection, raw payload/hash and conflict status, protected source ownership |
| Usability | Tabler-aligned existing components, responsive tables, compact cards, bilingual labels, refresh/back/forward routes, no connection to external services |

## Evidence

- qa/evidence/customer-sales-702.json: targeted API, stock, allocation, bank, policy/posting, offset, refund, external-reference, restart and correction checks.
- qa/evidence/customer-sales-702-browser.json: real Chromium customer/sales/payout/payment/credit/channel/SKU forms; desktop/mobile and Korean; navigation and uncaught-error checks.
- qa/evidence/oct28.json: prior October 28 API/browser/PDF suite, rerun against this build. Its payment-choice selector was aligned with the redesigned form; the same partial-receipt outcome is asserted.
- qa/evidence/postgres-regression-run.json and postgres-regression-logs/: all 31 existing runtime regression suites, covering shared currencies, approvals, Excavator, Pink Salt, receiving, packaging and source controls.
- qa/evidence/v30_70_2-database-tests.txt: database connection, migration, frozen import, rollback and schema tests.
- qa/evidence/postgres-sql-planning.json: PostgreSQL SQL planning checks.
- qa/evidence/v30_70_2-release.json: final versions, syntax, counts and environment.

The acceptance scenarios include partial payment at sale; credit-only/credit-plus-new payment; grouped receipts with surplus credit; buyer-paid-but-payout-pending; gross/fee/net settlement; one website payout covering another buyer's order; incorrect-channel and unconfirmed-buyer rejection; duplicate order/payout/event handling; held-credit refund offsets; unused-credit and order refunds; repeated allocation release; posted reversal hold; parent Finance verification before allocation posting; cancellation stock/Finance controls; section restoration; English/Korean PDFs and responsive layouts.

## Practical limits

Validation uses disposable synthetic databases with the PGlite PostgreSQL SQL engine and Node 22, not the hosted company database or a native multi-session PostgreSQL server. Chromium is used for browser/PDF checks. Existing cross-request locking unit tests pass, but production concurrency, provider-specific contracts and hosted performance are not certified by these tests. No production data was used or changed.

The channel event foundation stores/deduplicates events for future adapters and flags conflicts. It does not claim to import or synchronize actual Coupang/Naver/website records. Only positive actual company receipts are handled by the shared incoming-payment engine; zero/negative provider statements remain pending for a separately reviewed non-cash design.
