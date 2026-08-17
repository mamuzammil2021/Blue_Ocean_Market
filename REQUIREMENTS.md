# Blue Ocean Market — Master Requirements

## Source 1: Original Blueprint
The original Blue Ocean Management Software Blueprint remains mandatory and is the baseline specification for roles, CEO dashboard, staff management, tasks, daily reports, KPIs, approvals, business units, finance, CRM, inventory, documents/SOPs, meetings, alerts, implementation rules, architecture, audit/security, and management reporting.

## Source 2: Compulsory user additions
The following additions are mandatory:
- Product and service buying/selling.
- Buying/selling must be tied to the relevant business unit.
- Automatic gross and net profit/loss reporting using actual transaction values.
- Separate management of each business unit with consolidated CEO reporting.
- MIMI Resturant business unit with a practical POS.
- Restaurant POS for dine-in, takeaway and delivery.
- Restaurant tables, kitchen flow, waste and daily closing.
- Payment receipts and attachments where relevant.
- Browser receipt printing and receipt reprinting.
- Manual POS item quantity entry/adjustment, including decimals where applicable.
- Variable/negotiated purchase and selling prices at transaction time.
- Optional reference/master prices must not overwrite historical transaction prices.
- Price overrides, quantity, discounts and transaction-level profit calculation.
- Inventory add/remove/adjust/waste functionality by business unit.
- Other-user dashboards and role-specific functionality.
- Forgot-password workflow.
- Notifications, alerts and reminders for all relevant users.
- Attractive responsive UI and charts.
- Full CRUD for applicable records: create, view, edit, delete/archive/void, search/filter and history where appropriate.

## CRUD safety
Financial and accounting history must not be silently destroyed. Where appropriate, deletion is implemented as void/archive with audit history.

## Future additions
Any additional feature explicitly requested by the user for this project is compulsory unless the user explicitly marks it optional.
