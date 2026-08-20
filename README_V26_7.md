# Blue Ocean Market V26.7.0 — Excavator Buyers Fix

## What was fixed

The Excavator **Buyers** page could remain on `Loading...` in a fresh/local database.

### Root cause

The Buyers API queries use `excavator_buyer_payments.status` to distinguish Active and Voided payments. In V26.6, the migration that added this column ran **before** the `excavator_buyer_payments` table was created. On a fresh database the migration therefore failed silently, leaving the column absent. The Buyers SQL query then failed with `no such column: p.status`.

### V26.7 fix

- Buyer-payment `status` is now ensured after the buyer-payment table is created.
- Existing blank/null payment statuses are backfilled to `Active`.
- Buyer payment status is indexed.
- Voided payments no longer inflate buyer totals.
- Allocations linked to voided payments no longer count toward available/allocated advance.
- API calls have a 20-second timeout so a failed/hung request cannot leave the UI on an endless spinner.
- Buyers page now displays an actionable error with a **Retry** button if loading fails.
- Frontend cache-busting is updated to V26.7.0.

## Local test

From the project root:

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```

Login with your configured administrator credentials, select **Excavator**, then open **Buyers**.

## Render deployment

Use the repository containing this version and deploy the web service normally. The service starts with:

```text
node server/server.js
```

No special migration command is required; the SQLite schema migration runs automatically during startup.

## Verification

The following checks pass in the build environment:

- `node --check client.js`
- `node --check server/server.js`
- `node --check server/db.js`
- `node qa/static-check.js`
- `node qa/qa_v264_excavator_buyer_sale.js`
- `node qa/qa_v267_excavator_finance_ui.js`
- `node qa/qa_v267_buyer_runtime.js`

The build environment could not perform a full `npm install` because external npm registry access was unavailable, so live server/browser execution still needs to be performed on the user's Mac/Render environment.
