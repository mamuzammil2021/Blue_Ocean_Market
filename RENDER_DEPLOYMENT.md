## V30.51.0 — Safe read-view code splitting

Do not reset or overwrite existing Render persistent disk `/var/data`. Use Node 22; `npm ci`; `npm run qa:release`; `npm run qa:v351:browser`; confirm health `30.51.0`. Verify direct first-use Pink Salt list, shipment, raw-stock access and fallback, same-unit and cross-unit navigation, EN/KO, business permissions, cash/advance/stock workflows, and accounting journal tab. Measure 1/3/5/10 real users on staging before production acceptance; existing static tests are not live acceptance. Retain V30.50.0 rollback source.

## V30.50.0 — scoped Pink Salt import list and inherited performance safeguards

Built directly on V30.49.0. Preserve the existing Render `/var/data` disk, SQLite, uploads, evidence, secrets and backups; no database reset. Node 22, `npm ci`, `npm run qa:release`, `npm run qa:v350:sql`, and `npm run qa:v350:browser`. Confirm `/api/health` is `30.50.0`; signed-in CEO and scoped user should verify import search/status/page and list → Open Import → supplier payments, advance allocation, Finance verification and stock receive. Reconcile list totals against the original single-import context including voided/cancelled records. Test English/Korean, denied BU, slow responses, return context and persistent storage. Live staging 1/3/5/10-user load results still must be collected. Retain V30.49.0 source as rollback. Do not promote based solely on static fixtures.

---

## V30.49.0 Render deployment — additive read-side performance update

Use the existing persistent `/var/data` mount and service configuration; preserve environment secrets, SQLite, uploads, evidence and backups. Deploy V30.49.0 on Node 22, run `npm ci`, full QA and real authenticated acceptance before production promotion. Confirm `/api/health` version 30.49.0. Test Pink Salt scoped customer/order pages, buyer financial summary consistency, explicit General Ledger pager, old transaction flows, EN/KO, and permission denials. No destructive migration, reset or replacement storage. Real Render 1/3/5/10-user benchmark remains NOT RUN until a staging URL and authorized token are available. Keep V30.48.0 rollback source.

---

## V30.48.0 Render deployment — additive, no reset

Keep the same Render service and persistent `/var/data` mount. Preserve `.env`, DB, evidence and uploads. Update the Git branch with V30.48.0 source; install dependencies in its normal Node 22 deployment environment, run `npm run qa:release`, and verify `/api/health` version plus storage. Test real authenticated notification user/BU scope, bilingual feed and bell, Pink Salt customer/order balances, and the original Financial/Accounting/paged workflows. Static browser and SQLite fixtures are supplemental, not live acceptance. Do not enable destructive test reset on production. Keep V30.47.0 deploy rollback available.

---

# V30.45.0 Render Deployment

Use the current service and persistent disk unchanged. Deploy V30.45.0 from the V30.44.0 protected source; no schema migrations or data resets. Keep existing `/var/data`, secrets, database, uploads and evidence. Build/install on Node 22 (`npm ci`); run QA commands in `GIT_READY_README.md`. Check `/api/health` returns version `30.45.0`, hard-refresh to load the latest assets, and perform manual signed-in QA: ordinary Save only shows a button state; payment/transfer/posting shows one contextual overlay without a chip/banner; slow messages replace current text; success/error remains clear; Simple and Advanced accounting account details still work. Run live acceptance in testing/staging before production.

---

# V30.44.0 Render Deployment

Deploy as a normal Git update over V30.43.0. Preserve your current Render service, persistent disk, database, uploads, secrets and environment values. No migration or reset is required for this UI-only repair. After deployment, verify `/api/health` returns version `30.44.0`; hard-refresh the browser once to pick up versioned assets. In Simple and Advanced Cash & Banks, reselect the tab, open an account, return, generate a statement and download PDF. Confirm the action remains present.

# V30.43.0 Render Deployment

V30.43.0 is an additive workflow/accounting refinement release built directly on V30.42.0. Preserve the existing database, uploaded files/evidence, users/access/tasks, backups, environment secrets and persistent disk. **Do not reset or recreate the persistent disk.**

## Required runtime
- Node.js 22.x
- Existing Render Web Service
- Existing persistent disk mounted at `/var/data`
- Existing environment variables/secrets unchanged

## Before deploy
```bash
npm ci
npm run qa:v343
npm run qa:current
npm run qa:render
npm run qa:v342:runtime
npm run qa:v341:runtime
npm run qa:runtime
```

## Deploy
Deploy the Git branch containing V30.43.0 using **Manual Deploy → Deploy latest commit**. Do not delete/recreate the persistent disk and do not reset the database/uploads.

## Post-deploy acceptance
Confirm `/api/health` reports version `30.43.0`, then verify:
- existing operational data/evidence remain present and persistence health remains true;
- browser loads `runtime-v30392.js`, `v340-client.js`, `v341-client.js`, `v342-client.js`, then `v343-client.js`;
- Supplier → Machines Add/Delete updates the Machines section without browser refresh;
- Buyer receipt updates Buyer Payments without returning to the Buyers list;
- browser refresh on Supplier/Buyer/Machine child pages restores the current record and selected section where applicable;
- unreviewed Finance-linked Machine Cost can still be edited; after Finance action it locks;
- Purchase row in Costs has no Edit; Sold / Completed Purchase card shows locked Edit and backend rejects direct update;
- sold-machine document Delete / Archive is absent for non-CEO users and bypass attempts receive 403;
- Add Buyer Payment and Sell Machine allow optional Buyer Sending Account while company Receive Into remains separate;
- Accounting → Cash & Bank Accounts opens account detail and statement period controls;
- Account Statement totals/running balances reconcile with underlying account movements and PDF downloads successfully;
- same-BU account transfer creates balanced Accounting entry; cross-BU transfer follows existing Inter-BU controls;
- V30.42 actionable Task/Finance correction/CEO Full System Access behavior remains intact.

## Persistent storage verification
After deployment, verify `/api/health` includes `persistent_storage:true` and that `/var/data` is mounted/writable. Perform a manual redeploy and confirm previously entered test data and uploaded evidence remain present.

## Reset safety
Production keeps `APP_ENV=production` and `ALLOW_TEST_DATA_RESET=false`. Development/testing reset safeguards and pre-reset backup retention remain inherited from the protected baseline.

## Development/test reset controls (retained)
For a dedicated local/development or testing environment only, the guarded reset tools may be enabled with:
```text
APP_ENV=development
ALLOW_TEST_DATA_RESET=true
TEST_RESET_BACKUP_RETENTION=3
```
Production must remain:
```text
APP_ENV=production
ALLOW_TEST_DATA_RESET=false
```
Never enable destructive test reset controls on the production Render service.
