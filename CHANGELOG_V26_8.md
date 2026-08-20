# Blue Ocean Market V26.8.0

## Excavator Supplier Machines fix

- Fixed **Excavator → Suppliers → Machines** failing when the supplier already has a machine purchased by the company.
- Root cause: the supplier-machines renderer referenced `machine.asset_no` inside a `purchased.map(a => ...)` loop, but `machine` does not exist in that scope. This caused a browser `ReferenceError` and made the Machines button appear unresponsive.
- Corrected the renderer to use the current purchased-machine record (`a.asset_no`).
- Added a safe fallback when an asset number or machine display name is missing.
- Added error handling so future Supplier Machines API/render failures display a visible message instead of appearing to do nothing.
- No supplier, buyer, sale, finance, payment, or database business rules were otherwise changed in this fix.
- Updated frontend cache-busting and package version to **26.8.0**.
