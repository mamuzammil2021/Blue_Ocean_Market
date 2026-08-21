# Blue Ocean Market V28.1.0 — Action Matching & Finance Controls

V28.1.0 is a Git/Render-ready release with fixed responsive navigation, automatic data refresh, action-only sidebar counters, aligned Buyer/Supplier Requirements, smart location-independent machine matching, exchange proposals, mandatory Excavator evidence, and creator-secure Finance correction workflows. Korean remains the primary default language and English remains a complete selectable language. User-entered names, notes, references, model numbers and uploaded documents remain unchanged.

한국어가 시스템의 기본 및 주요 언어입니다. 영어도 전체 기능에서 선택할 수 있습니다. 사용자가 입력한 이름, 메모, 참조, 모델번호, 문서는 변경하지 않습니다.

Current release notes: `README_V28_1.md` and `CHANGELOG_V28_1.md`.

Run the complete release gate before deployment:

```bash
npm run qa:current
npm run qa:v281:runtime
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
1. Install Node.js 22.x (the same major version pinned for Render).
2. `cd` into the folder containing `package.json`.
3. `npm install`
4. `npm start`
5. Open `http://localhost:3000`

Before the first startup, set `JWT_SECRET`, `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` in the process environment. The application does not publish or prefill administrator credentials.

## Important
SQLite is used here to make local testing simple. For internet production deployment, migrate the database to PostgreSQL and configure HTTPS, secure secrets, email delivery, file/object storage, backups and monitoring.
