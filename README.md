# Blue Ocean Market V27.9.0 — Complete Korean Runtime Coverage

V27.9.0 makes Korean the primary and default system language while keeping English as a complete, selectable secondary language. It also closes the JavaScript-generated dialog, subtitle, notification, and enum-label gaps found after V27.8. User-entered names, notes, references, model numbers, and uploaded documents remain unchanged.

한국어가 시스템의 기본 및 주요 언어입니다. 영어도 전체 기능에서 선택할 수 있습니다. 사용자가 입력한 이름, 메모, 참조, 모델번호, 문서는 변경하지 않습니다.

Current release notes: `README_V27_9.md` and `CHANGELOG_V27_9.md`.

Run the complete release gate before deployment:

```bash
npm run qa:current
```

# Historical V10 baseline

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
