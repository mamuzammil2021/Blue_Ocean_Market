# V30.57.7 consolidated QA — 2026-09-26

Node 22.23.3 and `better-sqlite3` 13 in an isolated local environment. Historical results stored in older files describe earlier builds; the commands below were run against this source.

| Test | Result | Evidence and limit |
|---|---|---|
| `npm run qa:release` | PASS | Inherited release chain, 11 current-gate suites, Finance mirror ₩9,500 sale/₩9,000 advance/₩500 actual receipt fixture, syntax, compressed assets and seven current invariants. |
| `npm run qa:v357:full-audit` | PASS | Independent audit: 17 suites passed, zero failed; financial assertions unchanged. |
| `node qa/qa_v357_consolidated_functional.js` | PASS | In-memory real SQLite: 138 mappings/30 collisions, seed meanings, CEO/BU access, inactive drafts, duplicate intent, supplier pool, verified posted Finance payroll link and duplicate block, no extra Finance/journal, consolidated read. |
| `node qa/qa_v3577_inventory_review.js` | PASS | Source/posted GL by BU, pending exclusion, Excavator/Pakistan separation, packaging/WIP/finished/gift-box traces, no ledger mutation. |
| `npm run qa:runtime` | PASS | Fresh Node 22 server startup/login, eight inventory kinds and new accounting endpoints, evidence-backed Pending→Posted→trial balance, correction/cancel, period close/reopen, local persistence. |
| `V357_PROTECTED_SOURCE=<unmodified extracted V30.57.6 source> node qa/runtime_v357_copy_migration.js` | PASS, synthetic only | Protected-source generated DB with posted journal and upload copied to new source, migrated, restarted; account IDs/meanings, users, posted journal/lines and upload hash unchanged, original unchanged. No existing Render data was available. |
| 499-row matrix audit | PASS for structure | 499 rows each include eight new status/evidence fields; original 198 signoff tags are classified independently. No production acceptance is inferred from source labels. |

## Acceptance evidence still absent

- No existing Render SQLite copy or representative real upload set was provided. Therefore production balance preservation, live COA differences, actual source/journal continuity and persistent disk restart **cannot be asserted**.
- No authenticated staging browser run covering CEO, BU Manager, Finance and Accountant at desktop/mobile sizes in EN/KR was performed. Runtime CEO and fixture role checks are narrower.
- No authorized accountant policy/mapping signoff, owner deployment acceptance, production backup/rollback rehearsal, merge or deployment occurred.

The protected baseline lacked `.env.example`; this build supplies a safe, nonsecret example that satisfies inherited QA and keeps test reset disabled. The actual Render database and disk were never read or changed.
