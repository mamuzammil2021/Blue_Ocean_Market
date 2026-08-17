# Blue Ocean Market — Master Requirements V7

This document is the acceptance baseline for V7. It combines the supplied **Blue Ocean Market Management Software Blueprint v1.0** with every compulsory recommendation recorded during the project conversation.

## 1. Blueprint baseline

The supplied blueprint requires: role-based access; CEO dashboard; staff profiles, job descriptions and recurring duties; task/follow-up management with evidence, dependencies, reminders, recurring tasks and history; daily reports; KPI target vs actual; configurable approvals; business-unit workspaces with consolidated CEO reporting; finance visibility and attachments; CRM pipeline; inventory; document/SOP center and versioning; weekly management meetings; notifications/alerts; responsive web application; central database/audit history; search/filtering; configurable statuses/KPIs/approval limits/business units; real-data dashboards; exports; backup/access security; and architecture extensibility. See the source blueprint for the complete wording and organization.

## 2. Mandatory project additions

- Every business unit is a separate business/workspace.
- Every non-CEO user is restricted to their assigned business unit at API/database query level, not only by UI hiding.
- CEO can access every active business unit.
- CEO home page provides consolidated all-unit reporting.
- CEO has a business-unit switcher/toggle. Selecting a unit changes the working scope and relevant functions/data.
- Business managers and employees can only work in their specified unit.
- Product and service buying/selling.
- Business-unit-specific purchases, sales and profit/loss.
- Actual transaction price can differ from master/reference price.
- Actual cost and actual selling price drive transaction profit.
- Price overrides are permission-controlled and auditable.
- Inventory add/remove/adjust/waste.
- Full CRUD for applicable records: create, view, edit, archive/delete/void as appropriate.
- Historical/financial records use void/reversal/archive where destructive deletion would damage audit history.
- MIMI Resturant is a dedicated business unit.
- MIMI Resturant POS.
- Manual POS quantity entry and +/- adjustment.
- Decimal quantities where relevant.
- POS receipt printing and reprinting.
- Browser/PDF/standard printer receipt flow.
- Restaurant tables, dine-in/takeaway/delivery, kitchen order status, restaurant stock, waste, daily closing and cash variance.
- Payment receipts and attachments wherever required.
- Forgot-password workflow.
- Notifications, alerts and reminders for all users.
- Attractive responsive UI with charts.
- Sidebar must vertically scroll on desktop; mobile navigation may scroll horizontally.
- Static/enumerated/reference fields must use dropdown/select/search-select controls instead of unnecessary free text. Free text is reserved for genuine notes/descriptions/comments.

## 3. Security acceptance tests

1. Log in as a business-unit user and attempt to request another unit's product, sale, finance, task, document, KPI, meeting or restaurant data by ID/API: request must be denied.
2. Log in as CEO: all active units are available in the selector and consolidated dashboard.
3. Select MIMI Resturant as CEO: MIMI-specific functions become available and data is scoped to MIMI.
4. Return to All Business Units: consolidated CEO reporting is restored.
5. A non-CEO user cannot change their own business-unit scope through a request header.

## 4. Data-entry acceptance tests

Predefined fields must use selects/search selectors for role, status, priority, business unit, owner/user, payment method, product/service, supplier/customer where records exist, order type, restaurant table, approval status, KPI period, and similar enumerations.

## 5. Transaction acceptance tests

- Variable selling price is stored on the sale line.
- Variable purchase cost is stored on the purchase line.
- Historical transactions do not change when master prices change.
- Quantity changes recalculate totals, stock, cost and profit.
- Voiding a sale/purchase/finance entry is auditable.
- Receipt can be printed and reprinted without changing the transaction.


## V9 mandatory MIMI POS addition
- Open orders must have an authorized Cancel/Delete action. Cancellation requires confirmation/reason, releases the dine-in table, removes the order from active open orders, and preserves audit history. Closed/paid orders use controlled void/refund workflows instead.
