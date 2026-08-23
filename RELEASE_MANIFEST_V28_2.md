# Blue Ocean Market OS — V28.2.0 Release Manifest

## Release identity

- Version: `28.2.0`
- Runtime: Node.js `22.x`
- SQLite driver: `better-sqlite3` `13.0.3`
- Start command: `npm start`
- Health check: `/api/health`
- Primary/default language: Korean
- Complete secondary language: English

## Included work

- Reviewer decisions simplified to Verify, Request Correction, and Request Void.
- Exact reviewer sequencing, self-approval prevention, and Finance-then-CEO dual control.
- Immutable approval snapshots, payload hashes, revisions, diffs, evidence metadata, reminders, linked tasks, and full history.
- Original-requester cancellation and original-creator-only correction/resubmission.
- Automatic, idempotent execution of supported approved Finance and void actions.
- Creator-scoped Finance visibility for regular users and scoped oversight for Finance/CEO.
- Source-specific Finance correction forms and atomic source/Finance resubmission updates.
- Conditional Buy Machine token payment fields, reference, and evidence validation.
- Unread-first notifications and non-zero user-specific action counters.
- Korean/English coverage for V28.2 UI and backend messages.
- Existing fixed responsive sidebar, mobile navigation, active-module visibility, refresh behavior, matching, and mandatory Excavator evidence controls.
- Additive SQLite migrations and Render-compatible persistent paths.

## Automated validation

- JavaScript syntax and legacy static regression checks.
- V28.2 feature/source checks.
- Responsive V28 and smart-matching checks.
- Korean-first runtime/catalog checks: 1,952 exact phrases and 107 dynamic patterns.
- Full isolated V28.0 → V28.1 → V28.2 live API workflow.
- Approval roles, sequencing, snapshots, corrections, reminders, tasks, performance, cancellation, automatic Finance execution, void propagation, token evidence, notification ordering, and action counts.
- Upgrade startup check against a copied existing SQLite database.

## Excluded from the release archive

- `node_modules/`
- Local SQLite database, WAL, and SHM files under `data/`
- Runtime evidence/uploads under `uploads/`
- `.env` and credentials
- Git metadata
- Previous release archives

Back up the live database and uploads before deployment. Follow `GIT_RELEASE_CHECKLIST_V28_2.md` for the Git/Render release sequence.
