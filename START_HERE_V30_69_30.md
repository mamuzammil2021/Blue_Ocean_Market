# V30.69.30 — single payment exchange-rate entry

Based directly on protected V30.69.29. The marked Bank quote / confirmation details section is removed from all shared Pink Salt payment forms. New payments reuse an entered rate wherever it determines the same KRW equivalent; duplicate Payment accounting rate entry is removed. Historical invoice/correction bases remain accurate.

Read docs/releases/v30.69.30/CHANGELOG.md, TEST_RESULTS.md, KNOWN_LIMITATIONS.md, LOCAL_TESTING.md and RENDER_DEPLOYMENT_ROLLBACK.md. Mac Git instructions: V30_69_30_MAC_GIT_PUSH.md.

Current gate: npm run qa:release. Current evidence: qa/evidence/36930-release.json. Earlier release documents are historical.

No Git push, deployment or production storage operation was performed. Dependencies, secrets, private uploads and actual databases are excluded from the ZIP.
