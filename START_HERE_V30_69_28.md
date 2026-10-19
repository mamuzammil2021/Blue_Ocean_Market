# V30.69.28 — Direct deep-route hydration

Built from protected V30.69.27, preserving supplier Bank/Cash fixes and typed Import Cost recipients. The existing router now initializes required dependencies and renders the exact requested record/section without first loading module lists or dashboards.

Read the current release documents in `docs/releases/v30.69.28/`:

- `CHANGELOG.md` — reproduced root causes and implementation.
- `TEST_RESULTS.md` — actual browser/render evidence, performance observations and coverage.
- `FINANCIAL_RECONCILIATION.md` — protected financial logic and rerun regression evidence.
- `LOCAL_TESTING.md` — reproducible isolated tests.
- `RENDER_DEPLOYMENT_ROLLBACK.md` — staging, storage protection and rollback.
- `KNOWN_LIMITATIONS.md` — precise boundaries.
- `MAC_GIT_PUSH.md` — simple Mac commands.

Current gate: `npm run qa:release`. Current result: `qa/evidence/36928-release.json`. Historical release documents remain included for continuity; use the current report for acceptance of this source. No production database, credentials, private uploads or node_modules belong in the release ZIP.
