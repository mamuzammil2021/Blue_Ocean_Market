# Git / Render Ready — V30.39.0

V30.39.0 is built directly on protected V30.38.2. It is a system-wide performance/architecture release: consolidated live browser runtime delivery, immediate slow-network processing feedback, GET request deduplication, shared search/pagination/lifecycle primitives, request and optional SQL diagnostics, async Chrome PDF execution, gzip/caching, SQLite tuning, and permanent performance carry-forward rules. Existing business workflows, SQLite data, uploads and Render persistent storage are preserved.

Recommended verification before merge/deploy:

```bash
npm ci
npm run qa:v339
npm run qa:v336:handlers
npm run qa:current
npm run qa:render
npm run qa:runtime
```

The packaged build environment used for this release does not include installed npm dependencies, so live Express/SQLite runtime smoke is not claimed here. Run `npm ci && npm run qa:runtime` in the normal networked Mac/Render Node 22 environment before production deployment. Preserve the existing database, uploads, backups and persistent disk.

For scalable list development from V30.39 onward, use `server/pagination-v339.js` (25/50/100, filter/search/sort before paging). Existing legacy lists are to be migrated incrementally rather than rewritten blindly in this release.
