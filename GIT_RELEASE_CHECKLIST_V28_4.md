# Git / Render Release Checklist — V28.4.0

## Before merge
- [ ] Confirm PR base is `main` and head is `release/v28.4.0`.
- [ ] Confirm V28.4 branch is not behind `main`.
- [ ] Run `npm ci`.
- [ ] Run `npm run qa:v284` and require a PASS.
- [ ] Run `npm run qa:current`; investigate any regression before merge.
- [ ] Confirm no `.env`, SQLite database, uploads or secrets are committed.
- [ ] Confirm `server/server.js`, `server/db.js`, `public/client.js`, `client.js` and `public/i18n-ko.js` were not unintentionally replaced.

## Slow-network / duplicate tests
- [ ] Use browser throttling and double-click Add Buyer; exactly one Buyer must exist.
- [ ] Repeat double-click/retry checks for Buyer Payment, Supplier, purchase, sale, POS/order, stock, Finance, refund, task and approval actions.
- [ ] Verify a repeated request with the same idempotency key is replayed or blocked rather than recommitted.

## Statement tests
- [ ] Finance statement opens, filters by date, shows opening/debit/credit/closing balance and downloads PDF.
- [ ] Buyer statement includes Buyer profile, payments, allocations, refunds and available advance.
- [ ] Supplier statement includes Supplier profile, purchases, payments and outstanding payable.
- [ ] Pakistan Resale Profit Share statement includes machine, share, received and outstanding details.
- [ ] Korean PDF is readable.
- [ ] English PDF is readable when English is selected.

## Pakistan resale integrity
- [ ] Only machines Sold / Completed to the selected Buyer can be used.
- [ ] A machine with an existing resale record is not offered in Add Resale Record.
- [ ] Direct duplicate insert is rejected by the server/database.
- [ ] Existing record remains editable.
- [ ] Buyer screen shows resale totals and machine-level received/outstanding status.

## Render deployment
- [ ] Back up `/var/data/data/blue-ocean.sqlite`, WAL/SHM files and `/var/data/uploads` before deployment.
- [ ] Confirm persistent disk remains mounted at `/var/data`.
- [ ] Confirm `DATA_DIR=/var/data/data` and `UPLOAD_DIR=/var/data/uploads`.
- [ ] Confirm `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `NODE_ENV=production` remain configured.
- [ ] Deploy the merged `main` commit.
- [ ] Check `/api/health` reports `28.4.0`.
- [ ] Test login, Buyers, Suppliers, Finance, statements and one controlled approval action on Render.

## Development data
- [ ] Keep existing test users/data during development unless final cleanup is explicitly requested.
