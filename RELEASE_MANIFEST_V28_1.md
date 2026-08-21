# Blue Ocean Market OS — V28.1.0 Release Manifest

## Release identity

- Version: `28.1.0`
- Runtime: Node.js `22.x`
- SQLite driver: `better-sqlite3` `13.0.3`
- Start command: `npm start`
- Health check: `/api/health`
- Primary/default language: Korean
- Complete secondary language: English

## Included work

- Fixed and independently scrollable desktop sidebar, mobile drawer and active-item visibility.
- Active-tab and post-mutation data refresh.
- Non-zero, user-specific sidebar action counters.
- Unified Buyer/Supplier Requirements.
- Location-independent smart machine matching with score, reasons and deduplicated notifications.
- Exchange proposals for requirement matches.
- Mandatory Excavator payment receipt/evidence.
- Creator-scoped Finance visibility for regular users.
- CEO/Finance-reviewer scoped oversight.
- Original-creator-only, source-specific correction and resubmission.
- Atomic source/Finance updates, history, reminders, Tasks and performance metrics.
- Complete Korean/English coverage for V28.1 interface and API text.
- Additive SQLite migrations that retain existing application data.
- Render-compatible configurable database and upload locations.

## Automated validation completed

- JavaScript syntax and legacy static regression checks.
- V28.1 feature/source checks.
- Responsive V28 checks.
- Korean-first runtime/catalog checks: 1,869 exact phrases and 106 dynamic patterns.
- Supplier-machine regression checks.
- Full isolated live API workflow, including permissions and database state transitions.
- Package/runtime compatibility check with Node.js 22-compatible SQLite driver.

## Excluded from the release archive

- `node_modules/`
- Local SQLite database, WAL and SHM files under `data/`
- Runtime evidence/uploads under `uploads/`
- `.env` and credentials
- Git metadata
- Previous release archives

Back up the live database and uploads before deployment. Follow `GIT_RELEASE_CHECKLIST_V28_1.md` for the Git/Render release sequence.
