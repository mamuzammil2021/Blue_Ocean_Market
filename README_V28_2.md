# Blue Ocean Market V28.2.0

V28.2.0 is the Git/Render-ready Approval and Finance Integrity release. Korean is the primary/default language and English is a complete selectable language.

## Main workflow

Finance reviewers now use only three clear decisions:

1. **Verify** — completes verification and applies the supported linked update.
2. **Request Correction** — assigns a visible task and notification to the original creator, who can edit every applicable source-specific field and resubmit it.
3. **Request Void** — starts the configured approval workflow and changes linked data only after final approval.

Approval requests preserve the original request, current request, changed fields, evidence metadata, payload hash, complete decision history, reminders, tasks, and execution result. A requester cannot approve their own request. Dual control always requires Finance first and CEO second.

## Important behavior

- Large manual Finance entries wait for required approval and are created automatically after the final decision, with evidence retained.
- Supported approved voids update the linked source and Finance data once; repeated execution cannot duplicate the result.
- Regular users see only Finance entries they created. Authorized Finance reviewers and the CEO see records within their permitted business-unit scope.
- Only the original creator can correct and resubmit a Finance entry or approval request.
- Purchase-token payment fields are hidden when the token is zero. When the token is positive, payment date, reference, and receipt/evidence are mandatory.
- Unread notifications are shown before read history; each group is newest first.
- Action counters appear beside Finance, Approvals, Tasks, matching, and other relevant sidebar modules only when that user has pending work.
- The desktop sidebar remains fixed and keeps the active tab visible; mobile uses a responsive drawer.

## Compatibility

- Node.js: `22.x`
- Database: SQLite through `better-sqlite3` `13.0.3`
- Start command: `npm start`
- Health check: `/api/health` → `28.2.0`
- Docker base: `node:22-bookworm-slim`

## Local verification

```bash
npm ci --omit=dev
npm run qa:current
npm run qa:v282:runtime
npm start
```

The runtime gate starts an isolated temporary server and database, tests V28.0, V28.1, and V28.2 workflows, then removes its test data. It does not modify the release database.

## Render persistence

Mount one Render persistent disk at `/var/data`, then configure:

```text
DATA_DIR=/var/data/data
UPLOAD_DIR=/var/data/uploads
```

Also configure a random `JWT_SECRET` of at least 32 characters, `ADMIN_EMAIL`, and an `ADMIN_PASSWORD` of at least 12 characters. Do not commit their values. Back up the existing SQLite database, WAL/SHM files when present, and uploads before upgrading. Startup migrations are additive and preserve existing data.

See `GIT_RELEASE_CHECKLIST_V28_2.md` for the exact copy, test, push, Render deployment, and live acceptance sequence.
