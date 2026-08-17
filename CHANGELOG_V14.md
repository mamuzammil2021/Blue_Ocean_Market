# Blue Ocean Market V14

## Architecture
- Exactly one Dashboard per business unit.
- CEO top workspace toggle controls the active business unit.
- Dashboard shows only the selected unit's relevant dashboard/data.
- All Business Units shows only the consolidated CEO dashboard.
- Four business units retained: MIMI Resturant, Excavator, Mango / Seasonal, Pink Salt.

## Excavator
- One Excavator Dashboard.
- South Korea used-machine workflow with KRW as base currency.
- Persistent machine/deal record that can be saved and resumed later.
- Lifecycle stages from Purchased through local sale/export/completion.
- Separate transaction records for purchase, logistics, repair, parts, local sale, export sale, payments and other costs.
- Cost-to-date and gross-margin visibility.
- Stage history and audit trail.
- Multiple document uploads per stage without replacing earlier files.
- Parts inventory foundation.
- Optional future multi-currency/accounting layer remains extensible; USD/PKR are not forced into the current version.

## Existing system
- Existing MIMI POS/menu/open-order/restaurant functions preserved.
- Responsive web layout and scrollable navigation retained.
- Profile management retained.
