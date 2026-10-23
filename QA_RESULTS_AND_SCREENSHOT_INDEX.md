# Recovered V30.69.42 — current QA results

Recovery date: 2026-10-23. Node v22.21.0, Playwright 1.56.1, Chromium with Noto Sans KR available on the isolated QA host. All records are synthetic and disposable; no production database, email or Render service was used. Historical QA files are retained in source but are not counted as current evidence.

| Current executed check | Result |
|---|---|
| `node qa/qa_v36942_release.js --browser --upgrade` | 17/17 gates PASS; raw accepted run is release-all17-accepted.json. |
| Final `node qa/qa_v36942_release.js` | 8/8 non-browser gates PASS. |
| Nested financial regression aggregate | 19/19 suites PASS; 282 PASS log lines (not a distinct-scenario count). |
| `node qa/modernization/workflows42.cjs after` | 73 owners / 90 seeded variants × 3 widths × EN/KR = 540 captures PASS. Every combination navigates and directly reloads. Expected route owner, ready state, language, no modal-as-page and document containment checked. |
| `node qa/modernization/screens41.cjs after` | 93 destinations × 6 = 558 PASS; 16 Settings destinations recaptured after final language fixes (96 samples replace corresponding captures). Includes Accounting internal destinations, Finance modes, Settings sections, Payroll sections and primary roots. |
| `node qa/modernization/detail-matrix.cjs` | 61 record/tab destinations × 6 = 366 PASS. |
| `node qa/modernization/remaining-records.cjs` | 34 further record destinations × 6 = 204 PASS. |
| Access editors / manual journal browser suites | 54 editor + 12 journal captures PASS; actual create/edit, balanced journals/evidence, task updates and report decisions exercised. |
| `node qa/modernization/flows42.cjs` | 8 checks PASS: dirty Back/discard, exact return state, real purchase/sale, stock/cash-source counts, product/user creation, payroll and channel mapping. |
| `node qa/modernization/locale42.cjs` | 9 checks PASS. Six workflows × two asserted active languages compare raw select values; actual Korean channel save and localized Settings/scope fallback checked. |
| Authority + role suites | 90 authority/view/width/language cases plus authorized operator, denied staff mutation and denied cross-BU cases PASS. Protected dual-approval L5 retained; ordinary L5 assignment capped at L4 by existing server. |
| Upgrade / repeat startup | All 98 server JS files byte-identical to V30.69.39; 254 tables, schema and row values preserved across two V42 starts after original baseline normalization; FK clean. Only documented volatile registry timestamps ignored. |
| Fresh `npm ci` + installed-app smoke | 116 packages installed; actual final application health version, isolated login and frontend integrity PASS. |
| `node qa/modernization/volume.cjs` | 2,501 orders / 1,001 customers, 12 width/language samples with ≤25 visible rows; search returns exactly one record. |
| Build/static contracts | Icons/Tabler/manifest build PASS; scoped reproducible Tabler, licenses/hashes, preserved original 57-script relative order, JS syntax and frontend manifest checked. Final UI contract rerun after translations. |
| Representative V41 before captures | 13 variants × desktop EN/tablet KO/mobile KO = 39. Representative baseline, not an exhaustive before matrix. |
| Screenshot review | Direct visual review included Korean mobile Sale, financial-account form, Settings accounts, tablet channel mapping and desktop Accounting. All delivered PNGs pass image integrity checks. Automated capture is distinguished from manual inspection. |

Widths: 1440, 820, 390. The record sweeps assert language, expected view, no loading/ReferenceError and document containment; they do not exercise every business status or all possible field combinations. Matrix capture counts can overlap destinations across suites and should not be added as unique screens.

## Business, accessibility and failure-state coverage

Current release children exercise import/packaging purchasing and receiving, cart/history, supplier allocations and actual cash movements, KRW/USD/PKR/cross-currency FX, payment approvals before verification, posting/corrections, product/family/lot/production and FEFO, trace/stock, reference reuse, access and important notification controls. Read/navigation coverage asserts no unintended cash/ledger/FX/stock rows. UI acceptance checks keyboard skip link, labels, single main landmark, ten keyboard dialog cycles and focus return, mobile navigation, reduced motion, 200% equivalent reflow, Back/Forward, direct refresh, loading, injected HTTP 503 with Retry, missing/invalid routes and retained invalid form values. Existing mutation protection and double-submit behavior remain under original controllers and protected workflow tests.

## Performance observations

Six synthetic cold browser contexts before/after; shared CPU/cache, no controlled benchmark and no speed claim. Median ready/DCL/navigation: V41 516.5/307.1/203.5 ms; V42 390/219.2/116.5 ms. Resource counts and encoded/transfer byte observations are in performance JSON. Final complete public JS/CSS/HTML cost: 7,004,112 → 7,029,894 bytes; per-file gzip 1,792,966 → 1,802,550. This disk inventory includes lazy assets and differs from initial transfer.

## Retries and execution limits

Initial browser run crashed because the recovered fontconfig referenced absent font directories. Correcting QA-only font paths resolved it; the full release and matrices were rerun. Initial npm ci hit managed-host fchown EINVAL while extracting Node headers; using already available official 22.21.0 headers resolved installation. One Settings-targeted rerun overwrote the prior full sweep result; the full 93-destination sweep was rerun rather than reconstructing missing observations. Final locale test was strengthened after detecting hash navigation did not reload preferred language; it now reloads and asserts language. Its initial scope assertion also used a real selected BU instead of All Units and was corrected. Failed logs are retained/sanitized; final accepted results are separate. Later language-only changes were followed by final locale, Settings, static-contract, installed-app and performance checks; the financial/server source was unchanged.

This host uses a Playwright Chromium CLI adapter for PDF generation. Native Render Chromium PDF/download/printing, target-host fonts, real staging datasets/roles/statuses/BU combinations, and human assistive-technology review remain staging acceptance. No zero-regression or production acceptance claim is made.

## Evidence navigation

Extract the QA evidence ZIP and open INDEX.html. It filters screenshots by filename/language/width/group and loads original PNG files. results/ contains accepted suite JSON, logs/ current execution and initial failures, and SCREENSHOT_INDEX.json records screenshot paths and SHA256. SOURCE_COMMIT.json identifies the exact source commit. Older source QA reports retain their original dates and are historical. Git/Render staging/rollback commands are in DEPLOYMENT_ROLLBACK_AND_GIT.md.
