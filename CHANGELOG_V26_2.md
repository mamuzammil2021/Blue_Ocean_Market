# Blue Ocean Market V26.2.0

## Excavator navigation and supplier UI

- Excavator-specific navigation is now grouped first when the Excavator business unit is selected:
  - Dashboard
  - Operations
  - Suppliers
  - Buyers
  - Finance
  - Documents
  - Notifications
- Added a clear separator before the remaining/general Blue Ocean Market modules.
- Dashboard routing now shows the Excavator dashboard when Excavator is selected.
- Added a dedicated Excavator Suppliers page instead of requiring the supplier tab to open as a modal.
- Supplier page follows the Buyers page layout pattern with summary cards, search, table-based management, and clear actions.
- Existing supplier functionality is preserved: add/edit/delete suppliers, supplier machines, available-machine list, and requirements.
- Added supplier search on the dedicated page.
- Removed duplicate top-level Excavator/Buyer navigation entries in favor of the grouped layout.
- Synchronized root `client.js` and `public/client.js`.
