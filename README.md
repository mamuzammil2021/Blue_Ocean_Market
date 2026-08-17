# Blue Ocean Market V10 — Full Stack Production Candidate

V10 is a rebuilt production-candidate baseline based on the original Blue Ocean Management Software Blueprint plus the compulsory requirements added during development.

## Core architecture
- Node.js / Express API
- SQLite + better-sqlite3 for local testing
- JWT authentication + role permissions
- Server-side business-unit isolation
- CEO consolidated view + business-unit workspace switcher
- Responsive browser UI with vertically scrolling desktop sidebar
- Uploads for receipts/documents
- REST API structured for future mobile clients

## MIMI Resturant
- Dedicated business dashboard
- Menu management
- Menu pricing: fixed or variable
- Menu availability
- Menu item stock update
- Ingredient/recipe management
- Weekly menu
- Buffet management
- Dine-in table status
- Only available tables selectable for new dine-in orders
- Open orders: save, reopen, add/remove items, quantity/price editing, cancel, close/pay
- Receipt printing/reprinting
- Inventory/waste/daily closing
- Optional advanced POS feature switches

## Local run
1. Install a Node.js version compatible with macOS 11 Intel.
2. `cd` into the folder containing `package.json`.
3. `npm install`
4. `npm start`
5. Open `http://localhost:3000`

Default CEO:
- Email: `admin@blueocean.local`
- Password: `Admin@123`

## Important
SQLite is used here to make local testing simple. For internet production deployment, migrate the database to PostgreSQL and configure HTTPS, secure secrets, email delivery, file/object storage, backups and monitoring.
