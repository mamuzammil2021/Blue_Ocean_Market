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
