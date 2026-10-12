# Blue Ocean Market V30.69.3 — System-Wide Persistent Routing & Page-State

Base: V30.69.2.

## Purpose
Fix the system-wide defect where browser refresh on many non-core or record-detail screens returned the user to Dashboard or lost the selected record/section.

## Implemented
- Expanded authenticated boot routing to recognize dynamically-added application views such as Accounting, Payroll and Pink Salt workspaces instead of accepting only the original core `viewLabels` set.
- Added shared persistent record routing in `public/v3693-persistent-routing.js`.
- Added record URLs/restoration for Excavator Machine, Buyer and Supplier profiles; Employee Profile; Finance record/correction; Tasks; Meetings; Reports; Pink Salt Supplier, Import, Order and Production Batch.
- Preserved selected Buyer/Supplier/Employee/Pink Salt Supplier sections in the URL where supported.
- Added Back/Forward and hash-change restoration.
- Added sessionStorage-backed view-state persistence for list filters/fields/scroll where the existing `captureViewState`/`restoreViewState` engine applies.
- Boot now reapplies stored view state after rendering.
- Preserved permission checks: the existing boot access gate still falls back only when the user is not allowed to access the requested module.
- No database schema change, no persistent-disk reset and no destructive migration.

## Permanent engineering rule
All new important pages and record detail/profile screens must use stable URL-addressable routes. Refresh must restore the same screen/record/section; Back/Forward and copied URLs must work subject to permissions. Older screens should be migrated to the shared route registry when touched.

## Runtime acceptance
Test authenticated Render flows against the existing persistent database before promoting this build to protected baseline.
