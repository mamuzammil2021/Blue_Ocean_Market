# Blue Ocean Market V30.49.0 — Paged Pink Salt and General Ledger, Safe Observer Cleanup

Protected source: V30.48.0 ZIP. Scope: performance-only, read-side optimizations; no destructive schema, new financial mutation, changed receipt, refund, void, approval, GL mapping, or posting policy.

## Delivered
1. Pink Salt Customers and Orders lists: new authenticated/BU/permission-scoped SQL page endpoints, searchable 25/50/100 pages, full-dataset authoritative totals, bounded selected-customer/order financial aggregation, preserved legacy v313 arrays and original single-record settlement logic. Browser list/pager keeps existing customer account and order-detail actions.
2. Advanced Accounting General Ledger: new authenticated, journalUnitFilter-scoped count/row endpoint; debit/credit grouped only over selected page, original journal and detail endpoints retained. Journal tab no longer reads entire journal and unrelated account-master list merely to render rows. Explicit pager, not scroll feed.
3. Three audited, idempotent UX/layout observer paths (`v329-resale-phones`, `v331-accounting-layout`, `v337-finance-posting-polish`) migrated to `BOMMutationHub`; 15 historical observer constructors remain in served compatibility runtime. Sensitive sale, permissions, account-picker, finance/modal observers remain protected.
4. Permanent requirements, dedicated regression, actual SQL fixture, static Chromium page fixtures, opt-in read-only staging benchmark script. Versioned source/asset identity 30.49.0.

## Compatibility
- v313 original customer/order full-array APIs still exist for dependent sale form, pricing and settlement flows; the new page API serves list rendering only.
- Accounting manual journal and reconciliation behaviors remain unchanged; no ledger totals calculated from the visible page.
- No full BU code-split asserted: historical runtime has cross-module behavior which cannot be removed safely without dependency-backed acceptance.
- Existing Render `/var/data`, backups, evidence and SQLite remain untouched; new indexes are additive only.
