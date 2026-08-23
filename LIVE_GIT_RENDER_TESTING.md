# V28.3 Live Git / Render Testing

## Before pushing

1. Use Node.js 22.x and run `npm ci`.
2. Run `npm run qa:current`.
3. Run `npm run qa:v283:runtime` and `npm run qa:v281:runtime`.
4. Configure `JWT_SECRET`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
5. Start with `npm start`; `/api/health` must report `"version":"28.3.0"`.
6. Test with CEO/Owner, Finance/Admin, Manager and Staff accounts.

## Git

Do not commit `.env`, `node_modules/`, local SQLite files under `data/`, or runtime files under `uploads/`.

Recommended flow:

1. Back up the current Render database and uploads.
2. Create a release branch such as `release/v28.3.0`.
3. Copy this release into the repository root without copying the excluded runtime files.
4. Run the QA commands above.
5. Review `git status` and `git diff --check`.
6. Commit and push the release branch, then deploy that branch to Render for live testing.
7. Merge to the stable branch only after the live checklist passes.

See `GIT_RELEASE_CHECKLIST_V28_3.md` for exact commands.

## Render settings

- Runtime: Docker using the included `Dockerfile`.
- Health check: `/api/health`
- Persistent disk mount: `/var/data`
- `DATA_DIR=/var/data/data`
- `UPLOAD_DIR=/var/data/uploads`
- `JWT_SECRET`: unique random value with at least 32 characters
- `ADMIN_EMAIL`: CEO/Owner login email
- `ADMIN_PASSWORD`: strong password with at least 12 characters

For development testing, set `SEED_DEMO_USERS=true`, `SEED_DEMO_DATA=true`, and a shared `DEMO_USER_PASSWORD` of at least 12 characters. Disable both seed flags before the final production release. Seeding is additive and does not wipe existing records.

## Persistence warning

The application uses SQLite and filesystem uploads. Without the persistent disk and both path variables, database and evidence files can be lost on a redeploy or restart. Back up both `/var/data/data` and `/var/data/uploads` before every release.

## High-priority live regression

- CEO/Owner receives a confirmation dialog, executes the controlled action immediately, and never enters an approval queue.
- Delegated buyer-payment void follows independent Finance then CEO approval, reverses allocations, voids linked Finance and retains history.
- Buyer-advance refund requires evidence, follows the configured threshold workflow, posts Finance automatically, supports creator correction, and reverses safely after void approval.
- Approval and Finance badges appear only for actionable non-zero work and disappear after completion.
- Final approval automatically applies supported actions; failed execution remains visible and can be retried only by Finance/CEO.
- Verified Finance change opens a source-specific correction for the original creator, with notifications, task, reminder history and performance tracking.
- Regular users see only Finance entries they created; authorized Finance/CEO users see the permitted company/unit scope.
- Receipt/evidence is rejected when missing from every Excavator payment-related entry.
- Unread notifications display first, newest first inside each group.
- Korean is the default and no English static UI text remains when Korean is selected; English switching still works.
- Desktop sidebar stays fixed with the selected item visible; mobile uses the off-canvas menu and responsive content.
- Clicking the selected tab and every create/update/delete action refreshes the current data and counters.
- Buyer/Supplier matching uses machine type/name, make, model, year/range, condition and budget, never location.
- Requirement matches create deduplicated notifications for relevant users and support exchange proposals.
- CEO All Units and unit-specific views do not leak unauthorized data.
