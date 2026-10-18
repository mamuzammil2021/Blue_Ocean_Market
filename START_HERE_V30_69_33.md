# V30.69.33 payment settlement and approval lifecycle

Baseline: protected V30.69.32. Read `docs/releases/v30.69.33/IMPLEMENTATION_AND_RECONCILIATION.md`, `TEST_RESULTS.md`, and `DEPLOYMENT_AND_LIMITATIONS.md`.

Current acceptance report: `qa/evidence/36933-release.json`. Run `npm run qa:release` with the isolated test environment documented in `docs/releases/v30.69.32/LOCAL_TESTING.md`, plus `BOM_QA32_BASELINE_ZIP` pointing to the protected .32 ZIP. Tests use temporary SQLite data and synthetic evidence; never use production paths. The current aggregate records actual completed groups; earlier reports alone do not certify this source.

Mac Git guide: `V30_69_33_MAC_GIT_NEW_BRANCH.md`. Always create a new branch from updated main. No Git push, merge or deployment occurred. No production DB, credentials, uploads or node_modules are included.
