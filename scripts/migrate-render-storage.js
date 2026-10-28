'use strict';
// This release stores all operational data in PostgreSQL. The old SQLite-file
// copy command cannot migrate it; use postgres:inspect and postgres:import.
console.error('SQLite file copying is retired. Import a consistent SQLite snapshot into the empty PostgreSQL destination with npm run postgres:import -- source.sqlite report.json. Copy matching uploads to UPLOAD_DIR while both applications are stopped; see POSTGRES_MIGRATION_STATUS.md. No files were changed.');
process.exitCode=1;
