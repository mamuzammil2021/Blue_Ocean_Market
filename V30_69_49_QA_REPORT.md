# October 26 QA implementation and verification

V30.69.49 is based on the uploaded V30.69.48 archive. All twelve screenshots and all document paragraphs were reviewed; duplicate refresh complaints were consolidated into one shared issue.

| QA point | Result | Verification |
| --- | --- | --- |
| 1 Same-page tabs reload the whole page | Router keeps the current page shell for same-record navigation. Packaging tab changes replace the tab body; unchanged summaries stay mounted. Posting filters update their queue and summaries without rebuilding the page. | Browser DOM identity checks for packaging, supplier profile and posting tabs; route refresh checks. Finance already uses its targeted table loader, which is retained. |
| 2 Advance edit creates voided Finance duplicates | Ordinary unverified amendments preserve transaction, operational and Finance IDs. Before snapshots and operational revisions retain audit history. Linked fee amendments preserve their own Finance ID. Verified/posted/allocated records stay protected; verified advances show disabled Edit with a lock. Authorized correction/reversal remains a distinct controlled flow. | Runtime identity, Finance row count, amount, history and verified rejection checks; linked fee identity and verification lock checks. Existing correction and FX guards regressions pass. |
| 3 Unpaid import receiving | Current receiving context and receipt execution enforce supplier clearance and Finance verification, including direct API calls. A locked Receive Goods action explains what is required. Follow-up partial deliveries remain eligible once payment is clear. | Unpaid and unverified requests rejected without stock mutation; fully cleared receipt succeeds; remaining paid delivery stays eligible. |
| 4 Actual received weight | Receiving retains measured kilograms independently of actual bags. Existing stock-ledger calculations were verified rather than replaced with an estimated bag calculation. No historical measurement is guessed or rewritten. | Eight 25 kg nominal bags received at measured 199 kg produce 199 kg in both raw-stock APIs. Browser entry of another one bag at 24.5 kg produces cumulative 223.5 kg, not 224 kg. Receipt bag count remains separately recorded. |
| 5 Material creation destination | Successful creation closes the form and returns to the refreshed Materials list. Editing an existing material keeps its record destination. | Browser creates a material through Review & Confirm and locates it in the updated list. |
| 6 Packaging detail readability | Four summary cards, purchase/payment status, one compact action area and clear tab navigation. Empty optional metadata is omitted; line currencies, discounts and tax are visible. Credit coverage is included. | Desktop and mobile EN/KR browser views inspected; viewport overflow checks pass. |
| 7 PDF generation and progress | One Invoice PDF action opens an in-page preview from the same saved invoice markup. Download is enabled when the actual PDF is ready. Snapshot matching prevents mismatched preview/download. Bounded content-based caching and concurrent-request coalescing avoid redundant rendering. Shared authenticated PDF/export fetches show preparation and downloaded bytes, with percentage only when the server provides total length. Errors offer retry. Automatic background invoice preparation after purchase creation is removed. | Browser with delayed PDF response sees progress, opens no extra tab and downloads a valid PDF. Downloaded PDF text and rendered page inspected. Existing statement PDF/CSV tests pass with configured Chromium. |
| 8 Posting Control refresh | Returning to the queue from posting actions now navigates to the queue URL. Detail URLs continue restoring their exact record. | Browser refreshes a posting record, returns through the existing queue refresh function, refreshes again, and checks that the queue remains open. |
| 9 Received purchase actions | Header editing is rejected on the server after any receipt; list and detail show locked Edit. List Close is removed. Existing dependency-safe cancellation is reused for eligible unpaid/unreceived purchases, retaining history. | Partial receipt blocks header and full edit APIs; browser checks disabled Edit and absence of list Close; existing cancellation/accounting tests pass. |
| 10 Recipe scalability | Search/select a material, enter quantity, Add; only selected materials form the editable recipe list. One-click removal and quantity editing retain the existing BOM payload. Source and shipped runtime bundles agree. | Browser searches a catalog with over 120 materials, adds one selected row, edits its quantity and removes it. Existing product-language/family validation tests pass. |

## Validation

The authoritative current run is qa/evidence/36949-release.json. It includes recursive JavaScript syntax, matching release identity and frontend integrity, plus the suites below:

- qa_v36932_server.js — Finance/Accounting corrections, advance locks, FX integrity, retries, receiving and supplier statements.
- qa_v36936_packaging.js — multi-material purchasing, receiving, stock, payments, approvals, accounting and scoping.
- qa_v36939_financial_guards.js — protects existing journals and historical financial records across startup.
- qa_v36938_product_ux.js — product languages, commerce fallback, families and permissions.
- qa_v36943_approval.js — approval snapshots and authorization behavior.
- qa_v36949_oct26.js — this release's runtime and browser acceptance checks.

The tests use temporary databases and synthetic records. Browser review covers 1440 px desktop and 390 px mobile, English and Korean. Internal screenshots and downloaded fixture PDFs are not part of this deliverable.

## Data and operational notes

No live company database was accessed. No destructive migration, historical duplicate consolidation or bulk financial repair is included. Existing posted records continue to use controlled correction/reversal. Historical test/report files in the archive describe their original builds; use the current release report above for this build.

The payment-clearance rule is specific to imports as requested. Packaging receiving retains its existing independent receiving/payment workflow. Chrome/Chromium remains required on the deployment host for PDF generation. The preview and download are generated from identical saved invoice markup; browser pagination can differ from PDF pagination.
