# V30.69.31 — Pink Salt QA correction package

Built directly on protected V30.69.30 SINGLE_PAYMENT_EXCHANGE_RATE_GIT_READY. This release fixes reference validation/constraint handling, the import category button, cost/correction presentation and confirmed stale-read/render races while preserving the simplified payment/rate UX.

Read docs/releases/v30.69.31/ROOT_CAUSES_AND_CHANGES.md, TEST_RESULTS.md, FINANCIAL_RECONCILIATION.md, KNOWN_LIMITATIONS.md, LOCAL_TESTING.md and RENDER_DEPLOYMENT_ROLLBACK.md. Git instructions: V30_69_31_MAC_GIT_MAIN_PUSH.md (main only, no new branch).

Current gate: npm run qa:release. Current aggregate: qa/evidence/36931-release.json. Older documents/reports describe earlier versions and are kept for provenance.

No push, deployment, production database reset or persistent-disk operation was performed. The ZIP excludes actual databases, secrets, private uploads and node_modules.
