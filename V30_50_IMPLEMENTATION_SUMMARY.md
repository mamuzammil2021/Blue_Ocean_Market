# Blue Ocean Market V30.50.0 — Bounded Pink Salt Import and Raw Stock Read Paths

**Protected source:** actual V30.49.0 release ZIP. All V30.39–V30.49 performance, finance/accounting, Access, account actions, feedback and Render persistence functionality is retained. This is a read-side, additive, scope-aware optimization, **not** a rewrite of stock or financial transaction sources.

## Delivered

1. **Pink Salt Import Shipments list:** authenticated and original-permission/BU-scoped SQL server pagination (25/50/100), search/status filters, full matching count, and selected-page aggregate reads for import items, purchase original/KRW, actual cash payments, active advance allocations, costs, outstanding and payment status. The original full-array endpoint and individual Import Detail/payment/advance/evidence APIs remain for other callers. Financial status math matches the old list and excludes voided/reversed entries.
2. **Pink Salt Raw Salt Stock list:** SQL page for received stock batches with bounded selected-item stock-movement aggregation; separate authoritative full-unit stock totals for all batches and mesh/2–3 mm/3–5 mm categories, independent of visible row/page/search. Production/repacking, waste, traceability, valuation and selection continue to use the original full-stock API. No partial stock list is passed to a stock mutation.
3. **Front-end UI:** explicit 25/50/100 previous/next controls, contextual search and status, stale view/BU/user result guard, preserved page/filter state on targeted refresh, EN/KO labels and existing Import Open/stock traceability actions. There is no blind infinite scrolling on finance or stock review tables.
4. **SQL indexes:** additive import-ID/status and stock-movement read indexes only. No destructive schema operation, reset, or modification to real-money/inventory/Accounting mutations.
5. **Regression:** V30.50 dedicated route/auth/source checks, exact executed SQLite import/stock fixtures, static Chromium screen fixtures and the inherited release gate. Updated an inherited V30.48 SQL fixture to capture its current dynamic query strings instead of a stale source regex; original void/BU assertions remain.

## Compatibility / safe deployment

Use Node 22, existing Git checkout, same Render service and mounted `/var/data`. Preserve `.git`, `.env`, SQLite, uploads, evidence and backups. Run `npm ci`, `npm run qa:release`, `npm run qa:v348:sql`, `npm run qa:v349:sql`, `npm run qa:v350:sql`, `npm run qa:v350:stock-sql`, and the V30.47–V30.50 browser fixtures as available in staging. Verify authenticated CEO/BU-restricted navigation, totals, receipts, advances, receiving stock, production/waste, and Finance/Accounting consistency before promotion. Rollback source: V30.49.0. No data reset.

## Explicit exclusions

This release **does not complete** canonical full BU JavaScript splitting, retirement of 15 protected observers, all high-volume historical Accounting/Pink Salt pages, or live authenticated and 1/3/5/10-user Render benchmarking. Native dependencies were not successfully installed in this offline/limited environment; fixture success is not a production speed measurement. See `V30_50_REMAINING_PERFORMANCE_WORK.md`.
