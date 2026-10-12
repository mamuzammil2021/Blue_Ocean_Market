# Blue Ocean Market V30.69.5 — Pink Salt Repacking Input Integrity

Built directly on V30.69.4.

## Fixes
- New Repacking Batch no longer auto-fills Actual Input Weight from calculated required salt. New raw-input rows start blank so the operator records the actual weighed amount manually.
- Required Salt Weight remains system-calculated from selected outputs and updates when product/quantity changes.
- Browser requirement calculation is aligned with the server calculation rules for Retail Pack, Bulk Pack (including pouch count from BOM), and Gift Box / Set category composition.
- Added live Required / Actual Entered / Difference display per salt category and per raw-input row.
- Changing output requirements preserves manually entered actual input instead of silently replacing it; the comparison immediately updates so the operator can review the difference.
- Multiple raw batches for one salt category remain supported; actual amounts are totaled by category.
- Completion still requires every required category to have selected raw batches and sufficient manually entered actual input.
- Server remains authoritative for available-stock checks, required-weight coverage, stock consumption, waste/loss, finished stock, traceability, and accounting synchronization.

## Calculation integrity
The shared server helper `server/v309-calculations.js` remains the source rule:
- Retail: units × pack weight / 1000
- Bulk Pack: units × inner pouch count × pouch weight / 1000 when pouch BOM exists; otherwise pack weight fallback
- Gift Box / Set: units × pouches per category × gift pouch weight / 1000, calculated separately by salt category

## Data safety
No database migration, destructive data operation, persistent-disk reset, or existing-record rewrite is included.
