# V30.69.44 QA report — 24 October 2026

## Result

PASS: the complete release gate executed 28 top-level checks under Node 22.21.0, including 19 nested inherited financial/operational suites. Browser and V43 upgrade checks were enabled. All data was synthetic and disposable. No production database or live external service was used.

After the full gate, final PDF review prompted two small changes: automatic audit reasons now localize in Korean, and equal-width report columns prevent squeezed receipt labels. Affected report, UI-contract and six-combination responsive suites were rerun successfully. `36944-post-gate.json` records those results and final source hashes. This distinction preserves the exact validation history rather than claiming the earlier full gate tested later edits.

## Complete gate

| Suite | Result | PASS log lines |
| --- | --- | --- |
| `Node 22, release identity, frontend integrity and recursive JS syntax` | PASS | — |
| `qa_v36944_ui_contract.js` | PASS | 10 |
| `qa_v36944_receiving.js` | PASS | 12 |
| `qa_v36944_extended.js` | PASS | 14 |
| `qa_v36944_approval.js` | PASS | 6 |
| `qa_v36944_assurance.js` | PASS | 6 |
| `qa_v36944_production_restart.js` | PASS | 6 |
| `qa_v36943_oct22.js` | PASS | 11 |
| `qa_v36943_approval.js` | PASS | 2 |
| `qa_v36936_packaging.js` | PASS | 25 |
| `qa_v36937_refinement.js` | PASS | 8 |
| `qa_v36938_product_ux.js` | PASS | 11 |
| `qa_v36939_history.js` | PASS | 6 |
| `qa_v36939_financial_guards.js` | PASS | 5 |
| `qa_v36939_regressions.js` | PASS | 19 |
| `modernization/receiving44.cjs` | PASS | 4 |
| `modernization/receiving44-submit.cjs` | PASS | 4 |
| `modernization/receiving44-finance.cjs` | PASS | 3 |
| `browser_v36944_packaging.js` | PASS | 10 |
| `modernization/oct22-v44.cjs` | PASS | 14 |
| `browser_v36939_cart_history.js` | PASS | 7 |
| `browser_v36938_product_ux.js` | PASS | 17 |
| `modernization/interaction.cjs` | PASS | 9 |
| `modernization/completion.cjs` | PASS | 15 |
| `modernization/editors41.cjs` | PASS | 17 |
| `modernization/journal41.cjs` | PASS | 3 |
| `modernization/authority.cjs` | PASS | 5 |
| `qa_v36944_restart.js` | PASS | 2 |

PASS log lines are evidence grouping counts, not a claimed count of independent test cases. The nested regression suite separately recorded 282 passing log lines across 19 suites.

## Scenarios exercised

- Import categories received together; exact/partial/concurrent receipts; expected-versus-actual bags and net weight; over-receipt and closed-period rejection; multiple discrepancy reasons.
- Quarantine, acceptance, rejection, supplier returns and receipt reversal preserve immutable facts. Missing goods never create usable stock.
- Supplier/company 100%, 50/50, 85/15, carrier/insurer and three-party allocations; unresolved investigation remains provisional.
- Quality-dependent replacement, replacement of rejected deliveries, excess at No Charge versus Additional Payable, formal shortage closure, invoice reduction and mixed settlements.
- Partial agreement creates a linked dispute; controlled amendment preserves old obligations/history. Duplicate full credit/replacement compensation is rejected atomically.
- Supplier cash advance 500 + adjustment credit 300 + new payment 200 clears one invoice with only 200 of new cash; reversal restores both non-cash balances.
- Actual same-/cross-currency refunds preserve claim carrying values and actual receiving-account amounts. KRW, USD and PKR tested. Exactly one real Finance receipt per refund; non-cash credits never create bank receipts.
- Independent approval, actionable review tasks, Finance maker/checker and final Accounting posting; stale snapshots and revoked requesters cannot execute; Posted policy prevents early credit use.
- Concurrent allocations/refunds; injected Finance or stock failure causes full rollback.
- Real browser receipt save after lost response, retry, refresh during commit, Packaging unit conversion and Back/Forward.
- Real native credit-only payment review and save; real refund submission with a lost success response and durable status recovery.
- Accepted raw receipts and weighted packaging costs feed production BOM, finished lots and Accounting. Quarantined salt is unavailable. Reversal cannot remove consumed stock. Explicit variance preserves correct weighted pool values.
- Two restarts preserve new receiving/claims/credit/refund/production facts and durable operation receipts. V43 upgrade and two startups preserve original rows across 254 predecessor tables, with only documented baseline normalization and registry refresh timestamps excluded. Finished-lot `updated_at` refresh timestamps are excluded from the new-operation comparison; quantities, values, IDs and relationships are compared.
- Import, Packaging, Claim and Supplier HTML/CSV/PDF reports in EN/KR: 24 combinations. Automated PDF signature/text checks plus visual review of rendered English/Korean reports. User-entered names, notes and references are retained in their entered language.
- Responsive 1440/820/390 EN/KR receiving/calculator surfaces; direct deep reload, compact controls, keyboard focus, missing/invalid routes, 200% zoom-equivalent reflow and no uncaught browser errors.
- Existing material actions, purchase cart/history, warehouse Settings and live location refresh, PDF retry, received-import controls, Accounting editors/journals and role authority regressions.

## Evidence

- Complete gate: `qa/evidence/36944-release.json`.
- Final affected checks/source hashes: `qa/evidence/36944-post-gate.json`.
- Raw text logs: `qa/evidence/36944-logs/`.
- Receiving: `receiving44-api.json`, `receiving44-extended.json`, `receiving44-approval.json`, `receiving44-assurance.json` under `qa/evidence/`.
- Production/restart: `qa/evidence/36944-production-restart.json`.
- Migration: `qa/evidence/36944-upgrade.json`.
- Browser submission/financial results: `qa/evidence/receiving44-submit/results.json`, `qa/evidence/receiving44-finance-browser/results.json`; responsive calculator: `qa/evidence/receiving44-browser/results.json`.
- Packaging browser: `qa/evidence/36944-packaging-browser.json`.
- Nineteen inherited suites: `qa/evidence/36939-regressions.json`; suite filenames retain their historical version identifiers while this report records fresh V44 execution.

Screenshots and generated report samples were used internally and are excluded from the source ZIP. The source includes report generators and reproducible test scripts. Earlier historical failures/summaries do not override the current passing gate and supplementary checks.

## Deployment and policy limits

The tested environment is Linux, Node 22.21.0, SQLite, Chromium 141 and configured Korean fonts. Target-host migration, fonts/PDF execution, load behavior, SMTP delivery and real account/statement reconciliation require staging acceptance. No claim of production deployment or live bank reconciliation is made.

The build does not invent company monetary thresholds or silently authorize account mappings. The CEO must configure approved receiving/claims Accounting policy and review credit availability and cross-currency options. Existing L0–L5, Finance and Posting Control remain mandatory where applicable. Unsupported policy stays inactive; normal physical receipts can still be recorded.

Current code has no known failing automated acceptance check. Review the migration/rollback document before enabling real V44 activity.
