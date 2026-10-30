# V30.70.1 verified October 28 QA release

All 16 QA points are implemented. Validation passed with 389 workflow checks across the 31 existing regression suites and the new 28-check October 28 suite, 19 database/connection/schema/import tests, 2,569 PostgreSQL SQL plans and 301 JavaScript syntax checks.

Validation uses Node v22.23.4 and the PGlite PostgreSQL engine, plus real Chromium PDF and desktop/mobile browser checks. English and Korean invoices were visually inspected; licensed Korean fonts are embedded for offline rendering.

Read QA_OCT28_CHECKLIST.md, RELEASE_NOTES.md and qa/evidence/postgres-release.json. Git and Render were not changed. No hosted acceptance or production deployment is claimed.
