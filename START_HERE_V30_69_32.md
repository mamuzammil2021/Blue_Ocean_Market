# V30.69.32 October 17 QA and all-currency integrity

Built directly on verified protected V30.69.31. Start with docs/releases/v30.69.32/ROOT_CAUSES_AND_CHANGES.md, TEST_RESULTS.md, EXISTING_DATA_REVIEW_AND_REPAIR.md, KNOWN_LIMITATIONS.md and DEPLOYMENT_AND_ROLLBACK.md.

Current acceptance: qa/evidence/36932-release.json. Reproduce with npm run qa:release using the environment in docs/releases/v30.69.32/LOCAL_TESTING.md. Earlier-numbered functional suites retain their original names when rerun; the current aggregate identifies what actually ran. Historical reports do not certify this source independently.

Git instructions: V30_69_32_MAC_GIT_NEW_BRANCH.md. Create a NEW branch from updated main and push the branch. Do not push main directly. No push, merge or deployment was performed. No production database, private uploads, secrets or node_modules are included.
