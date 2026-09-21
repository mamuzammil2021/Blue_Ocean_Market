# Blue Ocean Market Release Manifest

- Release: **V30.42.0 — Actionable Tasks & Smart Access Control**
- Direct baseline: **V30.41.0 — Access Control Center & Simple User Assignment**
- Protected lineage: **V30.39.2 runtime/data-path protections + V30.40/V30.41 access/UI safeguards retained**
- Release type: **workflow/task integration + Finance correction hardening + CEO full-access hardening + future-permission synchronization**
- Destructive migration/reset: **None**
- Database changes: **additive actionable-task workflow columns + central permission catalog/default-assignment tracking**
- Existing users/profiles/groups/policies/approval configuration: **Preserved / migration compatible**
- Existing SQLite data/uploads/evidence/backups/Render persistent disk: **Preserved / compatible**
- Live browser delivery: **6 scripts (`i18n-ko.js`, `client.js`, `runtime-v30392.js`, `v340-client.js`, `v341-client.js`, `v342-client.js`)**
- Precompressed changed browser assets: **Included**
- Implementation summary: `V30_42_IMPLEMENTATION_SUMMARY.md`
- QA status: `V30_42_QA_STATUS.md`
- Dedicated V30.42 QA: `npm run qa:v342` — **PASS in build environment**
- Current/inherited regression QA: `npm run qa:current` — **PASS in build environment**
- V30.42 runtime workflow QA: `npm run qa:v342:runtime` — **packaged; run after `npm ci` in a normal Node 22 environment**
- Inherited Render/runtime/API QA: **retained and packaged**

## V30.42 acceptance focus
- Automatically generated Tasks expose the relevant workflow action; they are not passive reminders.
- Automatic task notifications deep-link to the exact Task.
- Finance correction uses one reusable task per workflow chain and one dedicated Correct & Resubmit workflow.
- Finance resubmission moves the same task to Awaiting Finance Verification; successful Finance verification auto-completes it.
- Repeated correction requests reactivate/reuse the same task and notify again.
- Normal correction UI does not expose raw metadata/technical JSON.
- System-managed tasks cannot be manually completed/cancelled to bypass the underlying workflow.
- Approval Changes Required uses the same actionable/reusable task pattern.
- CEO / Owner displays and behaves as Full System Access: All Business Units + All Permissions.
- New permissions are automatically registered and smart-mapped to relevant default Access Profiles / Permission Groups, while intentional later administrator removals/customizations are preserved.
- V30.39.2 performance, targeted-refresh, server-pagination, maker/checker, Review & Confirm and persistent-storage rules remain active.

## Deployment note
Do not reset the database or persistent disk. Deploy normally, let additive schema/catalog initialization run on startup, and verify `/api/health` reports `30.42.0`. Run the dependency-backed runtime/API gates after `npm ci` before production promotion.
