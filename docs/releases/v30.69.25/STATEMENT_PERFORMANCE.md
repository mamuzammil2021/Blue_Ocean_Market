# Statement download performance

Protected V30.69.24 and V30.69.25 were measured sequentially with the same Node.js 22/Chromium executable, launch flags, Korean font installation, local server, date range, 1,500 generated advances and 102 imports. No production records were used. Opening KRW 1,500,000, closing KRW 1,350,000 and 1,500 period transactions match in both JSON reports.

| Format | Baseline runs (ms) | V30.69.25 runs (ms) |
|---|---:|---:|
| JSON | 31.83, 13.84, 11.09 | 34.26, 13.79, 14.7 |
| CSV | 9.19, 10.85, 10.22 | 12.45, 9.79, 8.39 |
| PDF | 1167.46, 1171.75, 1125.77 | 1110.71, 20.08, 17.06 |

JSON/CSV timings are broadly comparable. PDF first generation still launches Chromium (about 1.1 seconds here); the clear improvement is repeated identical authorized downloads (17-20 ms in this run). These are local measurements, not promised Render/network latency.

The ledger now avoids unrelated profile/aging work and has supporting indexes. Cache keys include supplier, range, language and actual ledger contents. A real payment changes the key; actual PDF tests verify changed closing figures and reference contents. Unchanged snapshots can be reused for up to 60 seconds, including the original generated timestamp. Concurrent identical requests reuse one generation.

Raw evidence: `qa/evidence/36925-statement-before.json`, `36925-statement-after.json`, `36925-statement-integrity.json` and `36925-statement-pdf.json`.
