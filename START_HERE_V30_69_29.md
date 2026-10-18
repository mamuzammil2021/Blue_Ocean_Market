# V30.69.29 October 15 QA corrections

Protected baseline: exact V30.69.28. This consolidated release adds authoritative Pink Salt import-cost locks and cost-specific details, top payment alerts/field validation and simpler outgoing supplier payments with accurate FX settlement.

Read `docs/releases/v30.69.29/CHANGELOG.md`, `TEST_RESULTS.md`, `KNOWN_LIMITATIONS.md`, `LOCAL_TESTING.md` and `RENDER_DEPLOYMENT_ROLLBACK.md`. The main-branch Git instructions are `V30_69_29_MAC_GIT_MAIN_PUSH.md`.

Current release gate: `npm run qa:release`. Current aggregate: `qa/evidence/36929-release.json`. Historical documents and reports remain included for context; the current aggregate identifies checks actually rerun on this release.

No Git push, Render deployment, production database reset or persistent-disk operation was performed. The ZIP excludes actual databases, credentials, .env secrets, private uploads and node_modules.
