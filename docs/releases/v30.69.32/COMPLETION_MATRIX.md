# October 17 completion matrix

Baseline V30.69.31, result V30.69.32. PASS below means locally implemented and actually exercised using isolated data; it does not mean deployed or actual production balances repaired.

| Brief area | Implemented and verified | Evidence / boundary |
|---|---|---|
| 1. Latest source and registry | PASS — archive identity verified; shared capabilities reused/registered | `36932-source-integrity.json`; root-cause report; .31 SHA256 |
| 2. Supplier advances | PASS — owned permitted edit, draft-only delete, audited void, allocation and verified locks, shared/legacy API guards | `36932-server.json`, `36932-legacy-advances.json`, authenticated browser |
| 3. Stable corrected cost | PASS — one current operational ID/row, immutable financial versions, revisions and original URL/reference | Server, browser and protected .31 posted-upgrade tests |
| 4. Complete cost details | PASS — relevant amounts/accounts, KRW basis, Finance/Accounting, documents, history and authorized actions | Browser EN/KR; desktop/tablet/mobile visual review; extra earlier-version Finance attachment |
| 5. Import save | PASS — CEO overlay obstruction fixed; ordinary approval executor; atomic saved result and response recovery | Baseline browser reproduction, current API/browser, concurrent retry and lost response |
| 6. Statements | PASS locally — preview/CSV/PDF reconcile and actual downloads complete; bounded PDF execution/error paths | Before/after local timings; live deployment stall not reproduced |
| 7. All-currency integrity | PASS on configured currencies and supported routes — native debit distinct from KRW, required rate validation, specific posting blockers, one new Finance movement | Six-currency server tests, existing cross-currency/fees/advance matrices; readonly detection and authorized unposted/posted repair tests |
| 8. Receiving | PASS — essential atomic receipt/stock/Accounting, retry protection; PDF no longer blocks completion | Server rollback/concurrency and authenticated browser timing |
| 9. Shared safety/UX | PASS focused regression — original references, locks, roles/BU, bilingual, route refresh/history, stale reads, simplified form, processing | Current 44-group aggregate; native Excavator financial handlers remain unchanged |
| 10. Verification/delivery | PASS engineering package — source, safe additive migrations, tests/reports, repair/deploy/rollback and NEW-branch Git guide | Current aggregate and archive audit; no push/merge/deployment performed |

Operational follow-up: run staging Render acceptance, inspect a consistent copy of the real database/evidence, approve each needed repair and accounting policy, then use controlled correction/reversal. Statement deployment-specific latency still needs live diagnostics if it persists. Read the limitations and downgrade restrictions before deployment.
