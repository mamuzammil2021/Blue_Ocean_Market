# Blue Ocean Market Release Manifest

- Release: **V30.40.0 — Access Control, QA & System UI Refinement**
- Direct baseline: **V30.39.2 — Core Runtime & Data Path Optimization**
- Protected lineage: **V30.38.2 + V30.39.x functional/performance protections retained**
- Release type: **access-control redesign + system-wide QA/UI refinement**
- Destructive migration/reset: **None**
- Database changes: **additive access-profile/group/approval-authority tables/indexes with lossless legacy-role migration**
- Existing SQLite data/uploads/backups/Render persistent disk: **Preserved / compatible**
- Live browser delivery: **4 scripts (`i18n-ko.js`, `client.js`, `runtime-v30392.js`, `v340-client.js`)**
- Precompressed hot assets: **Included / regenerated for modified live scripts**
- Implementation summary: `V30_40_IMPLEMENTATION_SUMMARY.md`
- QA status: `V30_40_QA_STATUS.md`
- Dedicated V30.40 QA: `npm run qa:v340` — **69 passed, 0 failed**
- Current/inherited regression QA: `npm run qa:current` — **536 PASS**
- Render persistence QA: `npm run qa:render` — **19 PASS**
- V30.40 access runtime QA: `npm run qa:v340:runtime` — **packaged; run after dependencies are installed with `npm ci`**
- Inherited runtime smoke: `npm run qa:runtime` — **deployment/local environment gate after `npm ci`**

## V30.40 acceptance focus
- Simple assignment-first Users & Access workflow with multiple BU-scoped Access Profiles per user.
- Permission Groups and rare individual exceptions; Effective Access shows permission sources.
- Approval Authority remains separate from feature access and maker/checker remains enforced.
- Shared profile mutations are protected; delegated admins cannot grant above their own authority/scope.
- Actions columns remain far right/right-aligned and sticky where practical; wide lists may scroll.
- Modal lifecycle, filters, account validation, Cash handling, verified Void protection, new-tab navigation and Chrome translation behavior follow the V30.40 system rules.
- V30.39.2 performance, targeted-refresh, progressive-loading and persistent-storage protections remain active.

## Deployment note
Do not reset the database or persistent disk. Deploy normally, let the additive schema migration run on startup, and verify `/api/health` reports `30.40.0`. Run runtime QA after `npm ci` in the target/local Node 22 environment before production promotion.
