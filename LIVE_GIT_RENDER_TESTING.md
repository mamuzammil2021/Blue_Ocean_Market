# V28.1 Live Git / Render Testing

## Before push
1. Use Node.js 22.x and run `npm ci`.
2. Run `npm run qa:current`.
3. Run the self-contained live workflow with `npm run qa:v281:runtime`.
4. Start locally with `npm start` and confirm `/api/health` returns version `28.1.0`.
5. Test with CEO, Finance/Admin, Manager and Staff roles.

## Git
Do not commit:
- `.env`
- `node_modules/`
- local SQLite databases under `data/`
- runtime uploads under `uploads/`

Recommended flow:
- create a test branch for the build;
- push and let Render deploy that branch or merge after local QA;
- keep `main` as the stable branch.

## Render
The existing Dockerfile is production-host compatible and the server listens on `0.0.0.0` using `PORT` supplied by the host.

Node.js 22.x is pinned in `package.json` and the Docker image to keep the native SQLite dependency consistent on local machines and Render.

Set a strong `JWT_SECRET` environment variable in Render. Do not use the development fallback for a production deployment.

Mount a persistent disk at `/var/data`, then set `DATA_DIR=/var/data/data` and `UPLOAD_DIR=/var/data/uploads`.

Health check path: `/api/health`

## Important persistence warning
The application currently uses SQLite and local filesystem uploads. On ephemeral hosting, database/upload files can be lost on redeploy/restart unless persistent storage is configured. For meaningful live business testing, use a persistent disk or migrate the database/uploads to persistent managed storage before entering important data.

## High-priority live regression
- CEO All Units vs unit-specific sidebar visibility.
- Notification panel close behavior.
- Browser/app Back/Forward across linked records.
- Finance source opening, evidence, verify/reject/correct/void workflow.
- Finance correction assignment, notification, evidence upload, resubmission, resolution and performance metrics.
- No duplicate Finance entries when source records are updated.
- Mandatory receipt/evidence rejection for every payment-related Excavator entry.
- Excavator sale update and Finance sync.
- Supplier available-machine counts and Buy Machine supplier-machine selection.
- Structured Buyer Requirements, view/edit/delete and supplier-machine matches.
- Buyer Local → South Korea and International country selection.
- Off-canvas mobile sidebar, stacked cards/forms, scrollable tables and bottom-sheet dialogs.
- Meetings, Tasks, Approvals, People & Performance and reports by role/unit.
- Unit switch refresh and no cross-unit data leakage.
- Fixed desktop sidebar, independent navigation scrolling, active-item visibility and mobile drawer behavior.
- Same-tab and post-mutation refresh, including updated action counters.
- Non-zero-only Finance, Tasks and matching badges scoped to the signed-in user.
- Aligned Buyer/Supplier requirement fields and smart matching by machine name/type, make, model, year/range, condition and budget (never location).
- Deduplicated match notifications, match explanations and exchange proposals.
- Creator-scoped Finance data for regular users and full permitted-unit visibility for CEO/Finance reviewers.
- Original-creator-only, source-specific corrections with reminders, history, linked tasks and performance tracking.
