# Blue Ocean Market V27.2.0

## New / Fixed
- Supplier Available Machines counts now come from supplier-listed machines with status Available.
- Supplier and system UI data auto-refreshes after successful mutations to keep visible records synchronized without manual browser refresh.
- Tasks tab is visible to all authenticated users with task permissions enforced inside the module.
- Buyer Add/Edit country is a dropdown; no default country for International buyers; Local buyers are forced to South Korea.
- Buy Machine form now starts with Seller/Supplier, then supplier available machine selection, then Machine Details.
- Selecting a supplier-listed machine auto-fills stored machine data and links the purchase to the exact supplier machine.
- Purchased supplier-listed machines are marked Purchased and leave the Available list while history remains.
- Added excavator_assets.supplier_machine_id for traceability.
- Sale PDF generation now occurs only after the sale database transaction commits, and all PDF values are re-read from the persisted database.
- Updating a sale regenerates the linked sale PDF without creating a duplicate sale/Finance record.
