# Blue Ocean Market V28.3.0

V28.3.0 is the Git/Render-ready Approval Execution and CEO Direct Control development release. Korean remains the primary/default language and English remains fully selectable.

## Approval behavior

- Reviewers use **Approve**, **Request Changes**, or **Cancel Request**. Finance verification uses **Verify**, **Request Correction**, or **Request Void**.
- A CEO/Owner never waits for approval. A controlled action first returns a server-driven confirmation prompt; after the CEO enters an authorization note, the unchanged action executes immediately.
- CEO direct authorization is retained in the approval record, decision history, and audit log.
- A requester cannot approve their own request. Finance-originated dual-control requests proceed directly to an independent CEO review, avoiding self-review deadlocks.
- Delegated dual control uses Finance first and CEO second. The next responsible reviewer is shown by name and role.
- Supported actions execute automatically after final approval. Failed execution remains visible and can be retried by Finance/CEO without creating a second approval decision.

## Finance and payment integrity

- Buyer-payment deletion now creates a working Finance→CEO void request. Final approval voids the payment, reverses active allocations, voids linked Finance, and preserves the source/evidence history.
- Buyer advance refunds require receipt/evidence and a reference. Material refunds use approval and post automatically to Finance.
- Refund corrections expose the actual refund fields: amount, currency, FX rate, refund date, method, reference, and reason.
- Refund void approval reverses the refund and linked Finance record and restores available buyer advance.
- Changing a verified Finance record now requires independent approval, changes the record to **Correction Required**, and automatically creates the source creator's correction task.
- Only the original creator can change source-specific fields and resubmit. Finance/CEO can review company data within scope; other users see only entries they created.
- Correction history, reminders, response time, resubmissions, tasks, and performance metrics remain linked.
- Receipt/evidence remains mandatory for every payment-related Excavator entry.

## Interface behavior

- Finance, Approvals, Tasks, notifications, and matching modules show a sidebar badge only when the signed-in user has relevant pending work. Zero is never displayed.
- The desktop sidebar is fixed with independently scrolling navigation and a visible active module. Mobile uses an off-canvas responsive drawer.
- Clicking the selected module refreshes it. Successful create/update/delete/workflow actions refresh screen data and action counts.
- All V28.3 dialogs, errors, refund/approval states, and actions have Korean and English coverage.

## Development test data

No startup migration deletes or resets data. Optional development users and clearly labelled sample buyer/supplier/machine/requirement records are inserted only when missing.

Configure these only for development/testing:

```text
SEED_DEMO_USERS=true
DEMO_USER_PASSWORD=<unique password of at least 12 characters>
SEED_DEMO_DATA=true
```

Useful Excavator test accounts include:

- `bilal.ahmed@blueocean.local` — Finance
- `farhan.malik@blueocean.local` — independent Finance reviewer
- `hassan.excavator@blueocean.local` — Excavator Sales

All use the value you set in `DEMO_USER_PASSWORD`. No test password is embedded in the repository. Turning the seed flags off prevents new seed insertion; it does not delete existing test records.

## Compatibility and verification

- Node.js: `22.x`
- SQLite: `better-sqlite3` `13.0.3`
- Start: `npm start`
- Health: `/api/health` → `28.3.0`
- Docker base: `node:22-bookworm-slim`

```bash
npm ci --omit=dev
npm run qa:current
npm run qa:v283:runtime
npm start
```

The runtime gate uses an isolated temporary database and uploads directory and removes them after testing. It never changes the release/live database.

For Render, retain the existing persistent disk mounted at `/var/data` and set `DATA_DIR=/var/data/data` and `UPLOAD_DIR=/var/data/uploads`. Back up SQLite database/WAL/SHM files and uploads before deployment. Follow `GIT_RELEASE_CHECKLIST_V28_3.md`.
