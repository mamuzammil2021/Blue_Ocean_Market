# V30.70.3 source release manifest

Base: V30.70.2 customer sales settlement release.

All nine November 2 QA areas are implemented. See QA_NOV2_703.md and RELEASE_NOTES.md.

Validation: 456 workflow checks, 19 database tests, one upgrade test, 2,613 PostgreSQL SQL plans, 307 JavaScript syntax files and 127 verified frontend assets. Tests use synthetic disposable data, Node 22, PGlite and real Chromium. See the release JSON for environment limits, including the test-only PDF adapter.

The only new database migration is 011-cost-amendment-history.sql. Migrations 001–010 remain byte-identical to V30.70.2. No new dependencies or environment variables. No Git push/pull/merge or Render deployment.

SOURCE_SHA256SUMS.txt covers every packaged source/evidence file other than itself. It is generated after the final validation results. No node_modules, local environment configuration, database, upload directory, Git metadata or new browser screenshots are included.
