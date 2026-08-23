# Blue Ocean Market OS — V28.3.0 Release Manifest

## Release identity

- Version: `28.3.0`
- Runtime: Node.js `22.x`
- SQLite driver: `better-sqlite3` `13.0.3`
- Start command: `npm start`
- Health check: `/api/health`
- Primary/default language: Korean
- Complete secondary language: English

## Included work

- Confirmed, immediate CEO/Owner execution with complete approval/audit history.
- Independent reviewer sequencing and Finance-requester dual-control deadlock prevention.
- Exact next-reviewer visibility, relevant non-zero action badges, and retryable automatic execution.
- Automatic execution across supported Finance, void, document, inventory, sale, purchase, Excavator, buyer-payment, and refund controls.
- Working buyer-payment void approval with allocation and Finance reversal.
- Evidence-backed buyer advance refund creation, correction, Finance posting, and controlled reversal.
- Verified-Finance change approval that automatically opens creator-owned correction work.
- Creator-scoped Finance visibility and creator-only source-specific correction/resubmission.
- Additive development users/sample records controlled by environment flags.
- Korean/English V28.3 UI and backend coverage.
- Existing mobile/fixed navigation, refresh, matching, evidence, task, reminder, performance, and notification behavior.

## Automated validation

- JavaScript syntax and legacy static checks.
- V28.3 approval/execution static gate.
- Isolated V28.3 live API workflow with a temporary database.
- V28.1 smart matching, Finance privacy/correction, reminders, tasks, and performance live API regression.
- Responsive/mobile, Korean-first, full localization, supplier-machine, and historical functional regression gates.
- Final integrity scan with zero critical cross-record failures in the runtime scenario.

## Excluded from the release archive

- `node_modules/`
- Local SQLite database, WAL, and SHM files under `data/`
- Runtime evidence/uploads under `uploads/`
- `.env` and credentials
- Git metadata
- Previous ZIP archives

The V28.3 schema migration is additive. Back up live database files and uploads before deployment and retain the existing Render persistent disk.
