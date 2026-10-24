# V30.69.45 verified results

All 33 top-level release checks passed on Node 22.21.0. Browser verification used Chromium 141 with Korean fonts. All fixtures used synthetic data; no production data, live supplier messages or real financial transactions were used.

The final run includes receipt retry/recovery, investigation holds and decisions, invoice valuation, credit/refund/replacement completion, approval ordering, stock consumption guards, measurement corrections, concurrent submissions, injected failure atomicity, existing financial regressions, actual browser submissions, EN/KR and 1440/820/390 responsive layouts. The inherited regression orchestrator includes 19 additional child suites.

V44 upgrade comparison preserved original business rows across 269 tables, including receiving, quarantine, supplier credit allocation and actual refund fixtures, across two startups. Only registry refresh timestamps and the intentional new migration ledger entry are normalized for comparison. New issue tables are empty for historical activity.

English/Korean receiving and issue screenshots were visually inspected internally. Application report checks cover HTML/CSV/PDF outputs, Korean PDF text, and purchase invoice retry without duplicate purchase. Generated screenshots and report samples are excluded from source delivery. Source includes machine-readable results and text logs. An additional six-check V45 issue-report smoke run verifies USD 200 / KRW 260,000 invoice estimates in EN/KR HTML, CSV and PDF; reproduce with `node qa/qa_v36945_reports.js`.

| Check | Result | PASS groups / syntax files |
| --- | --- | ---: |
| Node 22, release identity, frontend integrity and recursive JS syntax | PASS | 237 |
| qa_v36945_lifecycle.js | PASS | 8 |
| qa_v36945_simple.js | PASS | 11 |
| qa_v36945_edges.js | PASS | 8 |
| qa_v36945_approval.js | PASS | 4 |
| qa_v36944_ui_contract.js | PASS | 10 |
| qa_v36944_receiving.js | PASS | 12 |
| qa_v36944_extended.js | PASS | 14 |
| qa_v36944_approval.js | PASS | 6 |
| qa_v36944_assurance.js | PASS | 6 |
| qa_v36944_production_restart.js | PASS | 6 |
| qa_v36943_oct22.js | PASS | 11 |
| qa_v36943_approval.js | PASS | 2 |
| qa_v36936_packaging.js | PASS | 25 |
| qa_v36937_refinement.js | PASS | 8 |
| qa_v36938_product_ux.js | PASS | 11 |
| qa_v36939_history.js | PASS | 6 |
| qa_v36939_financial_guards.js | PASS | 5 |
| qa_v36939_regressions.js | PASS | 19 |
| modernization/receiving45.cjs | PASS | 4 |
| modernization/receiving45-submit.cjs | PASS | 4 |
| modernization/receiving45-issues.cjs | PASS | 6 |
| modernization/receiving44-finance.cjs | PASS | 3 |
| browser_v36945_packaging.js | PASS | 10 |
| modernization/oct22-v45.cjs | PASS | 14 |
| browser_v36939_cart_history.js | PASS | 7 |
| browser_v36938_product_ux.js | PASS | 17 |
| modernization/interaction.cjs | PASS | 9 |
| modernization/completion.cjs | PASS | 15 |
| modernization/editors41.cjs | PASS | 17 |
| modernization/journal41.cjs | PASS | 3 |
| modernization/authority.cjs | PASS | 5 |
| qa_v36945_restart.js | PASS | 2 |

The group count is the suite's logged checks, not a count of individual assertions. `qa/evidence/36945-release.json` is the authoritative final-run record. `qa/evidence/36945-logs/` contains that run's logs. Current source was checked with `git diff --check`; exported ZIP files are CRC-checked and hashed. A fresh extraction is additionally smoke-tested before delivery.

Target-host staging remains required before production: use existing database/upload configuration, backup first, verify configured SMTP separately and reconcile real balances. No Render deployment, remote Git push or main modification was performed. See `V30_69_45_MIGRATION_DEPLOYMENT_AND_GIT.md` for safe deployment and rollback.

Final run UTC: 2026-10-24T11:27:44.741Z
