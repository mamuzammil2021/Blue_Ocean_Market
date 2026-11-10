# Blue Ocean Market V30.70.10

Blue Ocean Market’s shared record layout brings the same summary, filter, table and action patterns to the app’s record screens. Read the [release notes](RELEASE_NOTES.md) and follow [the UI standard](AGENTS.md) when building or editing a screen.

Use Node 22, `npm ci`, the existing PostgreSQL configuration and `npm start`. See [PostgreSQL setup and migration](POSTGRES_MIGRATION_STATUS.md) and [Render staging configuration](POSTGRES_MIGRATION_STATUS.md#render-staging).

Run `npm run qa:nov9` for the Excavator purchase, token deletion, sale and row-action regressions, `npm run qa:ui708` for focused record interactions, `npm run qa:ui708:matrix` for the English and Korean screen matrix, and `npm run qa:release` for workflow and upgrade checks. Set `BOM_CHROMIUM` for the local browser binary if needed.
