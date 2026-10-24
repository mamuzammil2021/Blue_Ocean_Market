# V30.69.43 — October 22 QA completion report

Date: 2026-10-23. Branch: `feature/v30.69.43-oct22-qa`. Baseline: the latest complete protected source found for this task, `Blue_Ocean_Market_V30_69_42_TABLER_MIGRATION_GIT_READY.zip` (5,891,330 bytes; SHA-256 `43b6674369551bb312a2764a6e8a34527dddda8a7e2af37f9f1d182f52153056`). The source document `QA POINTS 22 oct.docx` was read completely and all 11 embedded screenshots inspected. No main branch, remote repository, Render service or production data was changed.

## Every requested point

The document contains ten text requests. The implementation and acceptance matrix splits the import authorization/reversal work into separate checks so each requirement is reviewable.

| Document request | Delivered change | Fresh verification |
| --- | --- | --- |
| 1. Placeholder text looks entered | Shared placeholder color #697586, normal weight; shared form-control specificity fixed | Actual computed placeholder color differs from value color at 1440/820/390px in EN/KR; optional email stays empty and optional |
| 2. Supplier required fields need form validation | Supplier name remains required. At least one category is now a native custom-validity constraint with inline group error, ARIA error linkage and focus before review/submission. Packaging-only selection is valid. Phone/email are not made mandatory merely because examples appear in the screenshot | Invalid Save opens no confirmation and creates no supplier; focus reaches the category checkbox; selecting a category clears the error |
| 3. Slim modal scrollbars everywhere | Shared modal/dialog and nested scroll-surface rules use thin scrollbars and 6px WebKit tracks; native forced-color fallback retained | Computed thin scrollbar on real material dialogs in six viewport/language combinations |
| 4. Replace awkward page text loaders | 110 exact loading-markup instances in 29 maintained frontend/source/runtime owners now use one shared visual spinner; progressive skeleton sections use it too. Accessible labels are visually hidden and localized; reduced motion disables rotation | Delayed real route screenshot and accessible hidden-label check; broad 94-destination sweep; retained native select loading options and disabled action-button status text because those communicate control state |
| 5a. Hide actions that cannot execute | Received import costs no longer advertise Correct Posted Cost. Rendering also requires a real linked FX transaction before showing that action | Received, posted, real FX cost API test plus six-way Import Detail browser checks |
| 5b. Restrict who may void | Central server policy: unreceived/unpaid creator or manager or CEO, subject to write authority; paid/financially active import requires Admin/CEO. Received imports use stricter CEO-only rule | Policy matrix plus real manager HTTP denials, unchanged database state and hidden UI actions |
| 6. Import page can become unscrollable | Removed nested vertical scroll traps in cost/payment lists and history; preserve actual desktop main scroll or mobile document scroll during targeted refresh | Real wheel scrolling over a long cost list works at all three widths in both languages, including hard refresh/navigation |
| 7. Received Edit/Void CEO-only; clear status and reverse linked records | UI capabilities and direct APIs enforce CEO-only. Void banner and reason appear immediately below the header; obsolete receiving prompts/actions are removed on terminal records; historical amounts are explicitly identified. Void reverses FX, legacy payments/costs, fees, advance allocations, Finance, accounting sources and per-location stock in one transaction, preserving originals/history. Posted journal reversals remain subject to Posting Control | Closed-period and consumed-stock failures roll back entirely; multi-location stock returns to zero; balanced reversal proposal; supplier advance availability restored exactly; durable duplicate request produces no duplicate reversal; changed payload rejected; approval executes only an unchanged authorized snapshot |
| 8. Remove optional purchase units/supplier references from material forms | Removed Add/Edit form section and eight now-unreachable UI renderer/handler functions. Existing unit conversions/mappings are still loaded and round-tripped unchanged | Actual material edit/save retains existing box conversion and supplier item mapping; backend and history remain intact |
| 9. Purchase invoice PDF and detail actions | Successful non-draft purchase automatically prepares a saved-values invoice; Purchase Detail offers View/Download. EN/KR, lines, purchase/base units, discount, tax, expenses, FX, payments/advance/outstanding and original supplier snapshot included. PDF failure leaves the purchase saved with a retry | Real cart save, automatic PDF response, valid browser download; simulated PDF outage creates no duplicate purchase; authenticated EN/KR PDFs and totals verified; unauthenticated/cross-BU access denied; both rendered PDFs visually reviewed with all text within page bounds |
| 10. Discoverable BU-scoped warehouses/locations | New System Settings navigation section reuses existing warehouse/zone/rack master. Explicit BU, validation, duplicate protection, create/edit/archive/reactivate and audit. No deletion of historical locations. Receiving offers a permitted Manage link and live Refresh Locations | API scope/admin checks, active-only receipt options, real UI create followed by receipt refresh, retained quantity/notes and historical IDs |

An additional regression found in the recovered baseline was fixed: eight later Korean catalog blocks discarded earlier translations. Catalogs now retain prior entries with later overrides; audited Payroll/Accounting headings, navigation accessibility strings and placeholders render in Korean.

## Executed acceptance

All tests use isolated, synthetic fixture databases and disposable accounts.

- Full current release command: `node qa/qa_v36943_release.js --browser --upgrade`. The result JSON lists all 20 passing suite/check entries; the browser option includes the October-specific browser suite.
- Financial regression aggregate: **19/19 suites PASS, 282 PASS log lines**. Log lines are not claimed as 282 independent business scenarios.
- Destination sweep: **94 destinations × 3 widths × EN/KR = 564 PASS**. Includes Accounting internal workspaces, Settings, Finance modes, Payroll and application roots; actual locale, ready route and document containment asserted; no uncaught page errors.
- Focused October suite: **48 width/language captures**, plus delayed loader and manager-denied screenshots; real saves, native invalid-form focus, warehouse refresh and PDF failure/retry. No uncaught page errors or foreign-key violations.
- API suite: **11 grouped checks PASS**, including real financial/stock reversals, protected permissions, period/consumption rollback, invoices and location scope. Approval suite: **2 grouped checks PASS** for real final execution and stale-snapshot rejection.
- Upgrade from immutable V30.69.42 and repeat startup: **254 tables and protected row values preserved twice**, schema unchanged, FK clean. Only pre-existing volatile registry refresh timestamps ignored. No new database migration introduced.
- Existing browser regression suites cover packaging cart/history, products/families/lots, production, access editors, manual journals, approvals, keyboard dialogs, reduced motion, 200% equivalent reflow and failure/retry routing. Current frontend manifest verifies 122 assets; pinned Tabler build is reproducible; all server/public JavaScript syntax and Git whitespace checks pass.

Current machine-readable results are in `qa/evidence/36943-*.json`, `qa/evidence/36939-regressions.json` and the separate QA evidence archive. Older versioned evidence is historical and is not counted as fresh acceptance. The archive contains final accepted logs, synthetic screenshots, EN/KR invoice PDFs and a SHA-256 evidence index. No live credentials, databases, user uploads or dependency directories are shipped.

## Reproduce

Use Node 22.x and `npm ci`. Set `CHROME_PATH` to a working local Chrome/Chromium executable with Korean fonts before running the PDF/API checks. For browser tests, install Playwright's Chromium (`npx playwright install chromium`) or set `BOM_CHROMIUM` to a compatible browser executable. `BOM_PLAYWRIGHT` optionally selects the Playwright package path.

```bash
npm run qa:current
node qa/qa_v36943_release.js --browser
npm run qa:ui:destinations
# For the explicit baseline upgrade check:
export BOM_BASELINE_DIR=/absolute/path/to/untouched/Blue_Ocean_Market_V30_69_42
export NODE_PATH="$PWD/node_modules"
npm run qa:upgrade
```

Optional evidence output variables: `BOM_OCT22_EVIDENCE`, `BOM_OCT22_PDF_EVIDENCE`, `BOM_UI_EVIDENCE`, `BOM_GAP_EVIDENCE`. Upgrade intentionally requires a separately retained V42 baseline, not the current source tree.

## Practical limits and staging acceptance

QA used Node v22.21.0, Playwright 1.56.1, Chromium 141 and Korean fonts. The QA host required a Playwright-backed Chrome CLI adapter for PDF generation; real PDF bytes were generated and rendered. Native printing with the target Render/macOS Chromium executable, target fonts, real company data, human assistive-technology use and staging concurrency remain deployment acceptance checks. Tests do not establish production acceptance for every possible business state. This build changes the requested import authorization and void behavior; review those on staging before merging.

The separate import-receiving/discrepancy/claim/refund-credit redesign remains **excluded and deferred until explicitly requested**. Existing receiving settlement prerequisites, quantity rules and supplier-credit model are preserved. Restoring an existing advance allocation on an authorized void is not the proposed new credit mechanism.
