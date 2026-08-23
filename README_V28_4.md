# Blue Ocean Market V28.4.0

V28.4.0 extends the verified complete V28.3 release with transaction idempotency and financial statements. It is a development/testing release; existing data is preserved.

## Main additions

### One intended action = one committed record
For every browser mutation (POST/PUT/PATCH/DELETE), V28.4 generates an idempotency key and suppresses a second identical request while the first is still in flight. The server stores the key and replays a completed response instead of committing a duplicate. This is designed for slow internet, repeated clicks, browser retries and delayed responses.

Buyer creation also has a short-window duplicate sanity check. Pakistan resale records have a database trigger and API validation enforcing one record per Buyer + machine/deal.

### Statement engine
The statement engine uses the existing persisted transaction tables. It does not create a parallel accounting ledger.

Available statements:
- Finance statement — all permitted Finance entries in the selected business-unit scope.
- Buyer statement — Buyer profile, payments, machine allocations, refunds, opening/closing advance balance.
- Supplier statement — Supplier profile, machine purchases, supplier payments and outstanding payable.
- Pakistan Resale Profit Share statement — machine resale/share position, received and outstanding.

Each statement supports date filtering, running balance, on-screen viewing and authenticated PDF download. Korean is the default; English is selectable.

### Pakistan resale integrity
The Buyer profile now enriches the resale section with totals and machine-level financial position. A machine that already has a resale record is unavailable when adding another resale record. The backend also verifies that the machine belongs to the selected Buyer and is Sold / Completed.

## Startup

```bash
npm ci --omit=dev
npm run qa:v284
npm start
```

`npm start` runs `server/server-v284-run.js`, which loads the verified V28.3 core and appends V28.4 behavior without replacing the large V28.3 client/server files.

## Render
Keep the existing required production environment values and persistent storage configuration:

```text
JWT_SECRET=<32+ character secret>
ADMIN_EMAIL=<admin email>
ADMIN_PASSWORD=<12+ character password>
NODE_ENV=production
DATA_DIR=/var/data/data
UPLOAD_DIR=/var/data/uploads
```

During development/testing, optional seed flags remain additive only:

```text
SEED_DEMO_USERS=true
DEMO_USER_PASSWORD=<12+ character test password>
SEED_DEMO_DATA=true
```

## Required test scenarios
1. Throttle the browser/network, click Add Buyer twice rapidly and confirm exactly one Buyer is committed.
2. Repeat the test for payments, purchases, sales, POS actions and other business-unit forms.
3. Open Finance, Buyer and Supplier statements and verify opening/debit/credit/closing balances.
4. Download both Korean and English statement PDFs.
5. For a Pakistani Buyer, create a resale record, then verify that same machine cannot be selected/inserted again.
6. Verify Pakistan resale totals, received/outstanding status and PDF statement.
7. Confirm all V28.3 approval, Finance correction and evidence workflows still operate normally.
