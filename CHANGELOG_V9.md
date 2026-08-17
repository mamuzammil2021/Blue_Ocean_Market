# V9 Changelog

## MIMI open-order cancellation/deletion
- Added authorized Cancel/Delete action for open restaurant orders.
- Cancellation requires confirmation and a reason.
- Open order is retained as `Cancelled` for audit/history rather than silently erased.
- Assigned dine-in table is released when an order is cancelled.
- Added visible Open / Edit and Cancel / Delete controls to the MIMI Open Orders dashboard.
- Added open-order editor with add/remove item and quantity/price adjustment.
- Added close-and-pay workflow from an existing open order.
- Closed/paid orders remain protected from ordinary editing.
