# V30.58 QA results — 2026-09-27

Node 22 runtime in an isolated local environment. Tests below were executed against this build, not inherited from a prior report.

| Gate | Result | Coverage and limit |
|---|---|---|
| `npm run qa:v358:consolidated` | PASS | Three in-memory SQLite V30.58 fixtures including current-state supplier advance/payroll/buyer advance/Pink Salt AP source reconciliation with 25-row cross-kind paging, paged machine/import/batch/SKU/expense/exposure reports, corrected customer-dimension AR invoice linkage and Pink Salt supplier import/packaging aging, inherited `qa:release` chain, fresh-server `qa:runtime`. Includes posted-only reporting, BU isolation, internal-transfer cash exclusion, bank preview/duplicate/commit without Finance or journal creation, balanced noncash historical proposal, cross-job duplicate guard and pre-proposal preview tie-out, period close/reopen, Posting Control. |
| `npm run qa:v357:full-audit` | PASS | 17 inherited independent suites, zero failures; stronger reopen assertion verified. |
| `V357_PROTECTED_SOURCE=<protected V30.57.7 source> node qa/runtime_v357_copy_migration.js` | PASS, synthetic only | Protected-source generated SQLite database with posted journals, supplier/import obligation and retained upload was copied and opened with V30.58. Authenticated AP reconciliation and import aging matched the retained payable. Account IDs/codes/meanings, users, source rows, journals/lines and upload digest remained unchanged; source copy unchanged. The `staging_v358_existing_data.js` verifier was exercised against that synthetic retained-data source: its isolated backup, authenticated report reads, original-file comparison, posted balance and upload hash checks passed; expected supplier category derivation is reported separately. |
| Matrix structure | PASS | 499 JSON rows, 499 spreadsheet data rows, 15 evidence/status columns; 30 draft-code collisions retained. |
| Static JS syntax and compressed assets | PASS within release chain and direct syntax checks | `v358-accounting.js` gzip mirror regenerated after final UI change. |

Historical V30.54 Finance mirror fixture is part of the release gate: ₩9,500 sale, ₩9,000 advance and only ₩500 genuine new receipt. The gate passed.

**Not executed:** a migration or balance comparison against an actual restored Render SQLite copy with uploads; authenticated end-to-end browser verification for CEO/BU Manager/Finance/Accountant in EN/KR and desktop/mobile; accountant-signed policy and chart mapping; production backup/restore rehearsal. The synthetic copy test is not a substitute for these. No Render data or disk was accessed, reset or overwritten.
