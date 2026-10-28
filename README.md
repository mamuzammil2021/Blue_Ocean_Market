# Blue Ocean Market V30.70.0

One PostgreSQL database for all modules and business units. Read [migration, setup, validation and Render instructions](POSTGRES_MIGRATION_STATUS.md). Use Node 22, `npm ci`, a private DATABASE_URL and `npm start`. Current validation: `npm run qa:current`.

This is a local migration build. Git and Render have not been changed. The version-specific material below documents earlier SQLite releases.

Previous SQLite application release: **V30.69.50** — [Quick Test Reset hotfix](V30_69_50_QUICK_RESET_HOTFIX.md).

Historical release: **V30.69.49**. See [Start Here](START_HERE_V30_69_49.md) and [QA report](V30_69_49_QA_REPORT.md).

Historical release: **V30.69.48**. See [Start Here](START_HERE_V30_69_48.md), [QA report](V30_69_48_QA_REPORT.md), and [deployment](V30_69_48_DEPLOYMENT.md). Content below records earlier releases.

Historical release: **V30.69.47**. See [Start Here](START_HERE_V30_69_47.md), [QA report](V30_69_47_QA_REPORT.md), and [deployment instructions](V30_69_47_DEPLOYMENT_AND_GIT.md). Content below records earlier releases.

> Historical release: **V30.69.46**. Read `START_HERE_V30_69_46.md` for the fixes and current verification. Earlier version-specific content below is historical.

# Blue Ocean Market — V30.69.45

Simple receiving and linked investigation/task workflow on the protected V44 financial and stock foundations. Start with [START_HERE_V30_69_45.md](START_HERE_V30_69_45.md).

Runtime: Node 22.x. Install with `npm ci`; start with `npm start` and the existing environment/storage configuration. Validate with `npm run qa:current`; full browser/upgrade gate: `npm run qa:current -- --browser --upgrade`.

Read the current implementation, bilingual user guide, QA report and migration/deployment/Git instructions. Existing version-specific documents are retained as history. Source delivery excludes dependencies, credentials and real runtime data. Main, remote Git and production were not changed.
