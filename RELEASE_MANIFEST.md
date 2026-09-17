# Blue Ocean Market V30.31.0 Release Manifest

**Release:** V30.31.0  
**Package:** `Blue_Ocean_Market_V30_31_0_LIFECYCLE_INTEGRITY_VOID_REVERSAL_POSTING_CONTROL_QA_GIT_READY_RENDER_PERSISTENT_DISK.zip`  
**Baseline:** V30.30.0 Receiver Account Traceability + Smart Account Routing + Pakistan Resale Credit Controls + Professional EN/KR Statements

## V30.31.0 changed files

- `server/v331.js` — central lifecycle/action policy, lifecycle audit history, Finance/source action-policy APIs, controlled Finance Void/Reversal, source-aware Finance correction/resubmit, impact mapping, linked machine purchase/COGS synchronization and stakeholder notification support.
- `public/v331-client.js` — stage-aware Request Void/Request Reversal UI, Impact Review & Confirm, lifecycle history/linked-machine visibility, single-navigation cleanup, compact Accounting chrome and controlled machine-cost/payment void actions.
- `server/server.js` — V30.31 installation/identity, source-aware machine-cost correction mapping, supplier-payment Purchase-only validation, controlled machine-cost/payment lifecycle execution, Accounting badge eligibility and linked source/Finance synchronization.
- `server/v318.js` — Posting Control actionable queue/summary filters Finance-linked cash proposals until Finance verification is ready.
- `server/v290.js` — active machine-cost/COGS snapshot excludes Voided costs so controlled lifecycle recalculation remains correct.
- `public/v319-client.js` — machine-cost Edit + Void/Voided-history presentation and Purchase-only supplier-payment UI.
- `public/v3241-client.js` — correction/resubmit reference validation supports source-aware payment reference fields.
- `public/client.js` — Add Supplier Save close/refresh fix plus inherited protected Finance/sold-machine UI cleanup retained.
- `public/index.html`, `package.json`, `package-lock.json`, `START_LOCAL_MAC.command`, `qa/runtime_smoke.js` — V30.31.0 release/cache/runtime identity.
- `qa/qa_current.js`, `qa/qa_v331_button_actions.js` — V30.31 lifecycle regression gates and targeted button/action wiring audit.
- `README.md`, `CHANGELOG.md`, `REQUIREMENTS_MASTER.md`, `GIT_READY_README.md`, `RENDER_DEPLOYMENT.md`, `V30_31_IMPLEMENTATION_SUMMARY.md` — release documentation.

## Inherited behavior

All V30.30 receiver-account traceability, smart Korea/Pakistan account routing, Pakistan Resale reusable credit/refund/combined settlement and EN/KR statement formatting remain protected. Earlier V30.29 responsive Buyer/Supplier workspaces, combined sale settlement and Finance verification improvements also remain protected.

## Schema / data handling

V30.31.0 contains **additive schema extensions only** (`lifecycle_action_history_v331` and lifecycle metadata fields/indexes). Preserve the existing database and uploads. No reset or destructive migration is required. Historical records remain intact.

## Package exclusions

The Git-ready ZIP excludes runtime databases/WAL/SHM, runtime backups, uploaded business files, `.env`/secrets, `node_modules`, Git metadata, OS caches and temporary files.

## QA release gate

- `npm run qa:current` — **PASS**
- `npm run qa:render` — **PASS**
- `node qa/qa_v331_button_actions.js` — **PASS**
- final ZIP extraction — rerun the same gates on the packaged copy
- `npm run qa:runtime` — not claimed in this build container because dependency installation timed out; run after `npm ci` in the target Node 22 environment
