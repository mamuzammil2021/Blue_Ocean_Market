# Blue Ocean Market Release Manifest

- Release: **V30.41.0 — Access Control Center & Simple User Assignment**
- Direct baseline: **V30.40.0 — Access Control, QA & System UI Refinement**
- Protected lineage: **V30.39.2 runtime/data-path protections + V30.40 UI/access safeguards retained**
- Release type: **access-control completion/refinement + Machine Cost Edit-lock correction**
- Destructive migration/reset: **None**
- Database changes: **additive `users.job_title`, `access_role_templates.description`, `access_policy_sets`, `access_approval_levels`**
- Existing profile/group/user assignment data: **Preserved / migration compatible**
- Existing SQLite data/uploads/backups/Render persistent disk: **Preserved / compatible**
- Live browser delivery: **5 scripts (`i18n-ko.js`, `client.js`, `runtime-v30392.js`, `v340-client.js`, `v341-client.js`)**
- Precompressed V30.41 browser asset: **Included**
- Implementation summary: `V30_41_IMPLEMENTATION_SUMMARY.md`
- QA status: `V30_41_QA_STATUS.md`
- Dedicated V30.41 QA: `npm run qa:v341` — **75 passed, 0 failed**
- Current/inherited regression QA: `npm run qa:current` — **538 PASS, 0 FAIL**
- Render persistence QA: `npm run qa:render` — **19 PASS, 0 FAIL**
- V30.41 Access Control Center runtime QA: `npm run qa:v341:runtime` — **packaged; run after `npm ci` in a normal network-enabled Node 22 environment**
- Inherited runtime/API QA: **also packaged; run after dependencies are installed**

## V30.41 acceptance focus
- System Settings is the authoritative shared Access Control Center.
- Permission Groups can bundle multiple permissions.
- Access Policies can bundle multiple runtime restriction rules.
- Multiple Access Profiles and Permission Groups per user remain supported with BU scope.
- Job Title / Position is separate from system access.
- Approval Authority remains separate from feature access.
- Effective Access preview exposes permission sources before new-user creation.
- Delegated admins cannot grant above their own authority/scope.
- Maker/checker and Accounting self-post protections remain intact.
- Machine Cost Edit lock is evaluated per individual record; unprotected sibling costs are not globally locked.
- V30.39.2/V30.40 performance, targeted-refresh, table/action and persistent-storage rules remain active.

## Deployment note
Do not reset the database or persistent disk. Deploy normally, let additive schema initialization run on startup, and verify `/api/health` reports `30.41.0`. Run the runtime/API gate after `npm ci` before production promotion.
