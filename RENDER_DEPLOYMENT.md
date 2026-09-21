# V30.42.0 Render Deployment

V30.42.0 is an actionable-task, Finance-correction and Access Control hardening release built directly on V30.41.0. Preserve the existing database, uploaded files/evidence, users/access assignments, backups, environment secrets and persistent disk. There is no destructive reset; V30.42 schema/catalog additions are additive and idempotent.

## Required runtime
- Node.js 22.x
- Existing Render Web Service
- Existing persistent disk mounted at `/var/data`
- Existing environment variables/secrets unchanged

Optional diagnostics remain:
```text
BOM_SLOW_REQUEST_MS=750
BOM_LARGE_RESPONSE_BYTES=1048576
BOM_SQL_PROFILE=false
BOM_SLOW_SQL_MS=250
BOM_ACCESS_CACHE_MS=5000
```
Keep SQL profiling off unless diagnosing performance because it adds diagnostic overhead.

## Before deploy
```bash
npm ci
npm run qa:v342
npm run qa:current
npm run qa:render
npm run qa:v342:runtime
npm run qa:v341:runtime
npm run qa:runtime
```

## Deploy
Deploy the Git branch containing V30.42.0 using **Manual Deploy → Deploy latest commit**. Do not delete/recreate the persistent disk and do not reset the database/uploads.

## Post-deploy acceptance
Confirm `/api/health` reports version `30.42.0`, then verify:
- existing operational data/evidence remain present and persistence health remains true;
- browser loads `runtime-v30392.js`, `v340-client.js`, `v341-client.js`, then `v342-client.js`, and precompressed changed assets match their uncompressed scripts;
- requesting a Finance correction creates/reactivates one system-managed Task and notification opens that exact Task;
- the Task exposes **Correct & Resubmit** and opens the dedicated full-page Finance correction workflow rather than the generic Edit Finance Entry modal;
- normal users do not see raw correction metadata/JSON;
- after resubmission the task shows **Awaiting Finance Verification** and cannot be manually completed;
- successful Finance verification automatically completes the linked correction Task;
- a second correction request reuses/reactivates the same task and notifies again rather than creating a duplicate task;
- Approval **Changes Required** follows the same reusable/actionable task behavior;
- CEO / Owner effective access shows **Full System Access**, **All Business Units** and **All Permissions**, including newly registered permissions;
- Access Control Center includes registered permission catalog additions and relevant default profile/group mappings without overwriting later administrator customization;
- slow-loading, targeted-refresh, 25/50/100 server paging, maker/checker and Accounting/Finance integrity protections from prior protected releases remain intact.

## Test reset environment safety (retained)
For dedicated development/testing only: `APP_ENV=development` and `ALLOW_TEST_DATA_RESET=true`. Production must keep `APP_ENV=production` and `ALLOW_TEST_DATA_RESET=false`. Keep `TEST_RESET_BACKUP_RETENTION=3`.

## Persistent storage verification (retained)
After deployment, verify `/api/health` includes `persistent_storage:true` and that the disk is mounted/writable. Perform a **manual redeploy** and confirm previously entered test data and uploaded evidence are still present.

Reset safety is retained: production keeps `ALLOW_TEST_DATA_RESET=false`. Development/testing reset creates a **pre-reset** backup under the existing retention rule before destructive reset actions.
