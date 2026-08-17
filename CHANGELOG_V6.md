# Blue Ocean Market V6

## Corrections from V5 review
- Added vertical scrolling to the desktop side navigation; mobile navigation supports horizontal scrolling.
- Added visible Edit/Void/Delete actions across purchases, finance, CRM, KPIs, documents, sales, businesses, restaurant tables and existing task/product/meeting screens.
- Added actual edit forms and API calls for purchase, finance, CRM and KPI records.
- Added document deletion and restaurant table edit/delete.
- Added sale voiding.
- Fixed task update so title, owner and business unit are actually persisted, not only status/priority/due date/result.
- Preserved audit/void behavior for historical financial transactions.

## Validation
- `node --check server/server.js` passed.
- Extracted browser script and `node --check` passed.
