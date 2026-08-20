# V27.5 Live Git / Render Testing

## Before push
1. Run `npm install` on a machine with npm registry access.
2. Run `npm run qa:static`.
3. Run `npm run qa:current` (this includes the V27.5 complete, Meetings, legacy, and Supplier Machines regression suites).
4. Start locally with `npm start` and confirm `/api/health` returns version `27.5.0`.
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

Set a strong `JWT_SECRET` environment variable in Render. Do not use the development fallback for a production deployment.

Health check path: `/api/health`

## Important persistence warning
The application currently uses SQLite and local filesystem uploads. On ephemeral hosting, database/upload files can be lost on redeploy/restart unless persistent storage is configured. For meaningful live business testing, use a persistent disk or migrate the database/uploads to persistent managed storage before entering important data.

## High-priority live regression
- CEO All Units vs unit-specific sidebar visibility.
- Notification panel close behavior.
- Browser/app Back/Forward across linked records.
- Finance source opening, evidence, verify/reject/correct/void workflow.
- No duplicate Finance entries when source records are updated.
- Excavator sale update and Finance sync.
- Supplier available-machine counts and Buy Machine supplier-machine selection.
- Buyer Local → South Korea and International country selection.
- Meetings, Tasks, Approvals, People & Performance and reports by role/unit.
- Unit switch refresh and no cross-unit data leakage.
