# V10 Change Log

## Business-unit architecture
- CEO can switch between consolidated view and an individual business-unit workspace from the header.
- Selected unit is sent to the API using `x-business-unit-id`.
- Non-CEO users remain restricted to their assigned unit.
- MIMI features require the MIMI workspace scope.

## MIMI Resturant
- Reworked restaurant dashboard.
- Added Menu Management UI.
- Added Menu Stock Management UI and direct stock update.
- Added recipe/ingredient management endpoints and UI.
- Added fixed/variable menu pricing selection.
- Added Weekly Menu and Buffet access.
- New dine-in POS shows only Available tables.
- Added Save Open Order.
- Open orders can be reopened, modified, cancelled, and closed.
- Closed orders remain protected.

## Validation
- `node --check server/server.js` passes.
- `node --check server/db.js` passes.
- `node --check client.js` passes.
- Static QA checks are included under `qa/static-check.js`.
- Full `npm install` could not be completed in the build environment because package downloads timed out; runtime installation must therefore be verified on the user's Mac.
