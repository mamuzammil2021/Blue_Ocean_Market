# November 2 QA acceptance V30.70.3

Based on QA POINTS 2 nov.docx and all ten embedded screenshots. Implemented directly on V30.70.2 without pulling or merging Git branches.

| Reported area | Delivered behavior | Validation |
| --- | --- | --- |
| Supplier/import automatic refresh | Removed focus, visibility and 30-second reload callbacks. Reads and dialog cancellation leave the parent untouched. Successful writes keep their explicit record updates. | Browser idle through the old polling interval, focus/visibility events, payment dialog cancellation, receiving history and browser Back. |
| Supplier close action | X follows statement, payment/advance and refund actions. | Browser verifies final header button and existing close-to-list regression. |
| Cost editing and Finance identity | Repeated permitted amendments and assigned Finance corrections retain one cost, transaction and authoritative Finance ID. Before/after snapshots, request/task history and evidence remain accessible. | API edit, retry, correction, multiple-revision, before-snapshot and total-Finance-count assertions. |
| Verified/posted cost controls | Server and UI block ordinary verified edits. Removed direct Correct Posted Cost action. Assigned formal corrections retain the Finance ID; a posted journal requires reviewed reversal before corrected posting. | Verified edit denial, forged posted-edit denial, formal correction and reversal-before-posting lifecycle. |
| Warehouse management | Existing create/edit/archive controls run inside Warehouses. Saves refresh the management rows and selector after data changes. Existing permissions, BU scope and historical links remain enforced. | Browser create/edit/archive/selector checks plus existing location API authorization regressions. |
| Packaging navigation and filters | Materials, Purchases and Stock & Usage navigate directly and highlight correctly. Search/status combinations preserve their route parameters. Search is case-insensitive and does not create an unsaved-edit prompt. | Browser navigation/combined filter checks, API material/purchase search and warehouse stock filter. |
| Tab readability | Import tabs have consistent spacing, size and selected states; sidebar children have readable contrast. Selected EN/KR language is respected. | Real desktop/mobile Chromium inspection, width assertions and Korean accounting/customer regressions. |
| Material edit return | List edits return to the same list filters/page. Detail edits return to the same material detail. | Browser edits through Review & Confirm from both origins. |
| Apparently duplicate purchase postings | Queue/detail explain recognition versus receipt. Kept the two necessary accounting stages and verified one payable, one warehouse inventory value, zero residual in-transit balance after receipt, and idempotent purchase/receipt retries. | Synthetic KRW 350 purchase and receipt produce a payable of 350 and stock of 350, with one journal per stage. |

## Data and upgrade

Migration 011 removes the obsolete uniqueness constraint that allowed only one revision per transaction. It retains an indexed lookup and all existing history. A dedicated upgrade test applies migrations 001–010, inserts an existing revision, upgrades to 011, checks the original row unchanged, saves a second revision using the same transaction ID, and verifies migration reruns are idempotent. Migrations 001–010 and the existing frozen import catalog are unchanged.

No historical transactions were deleted or merged. Obsolete duplicate operational Finance projections encountered during an amendment are retired with an audit snapshot; the authoritative Finance row remains the same. Separate actual bank-fee movements remain separate records.

## Test evidence and limits

Current machine-readable results: qa/evidence/v30_70_3-release.json, qa/evidence/nov2.json, qa/evidence/postgres-regression-run.json and qa/evidence/v30_70_3-syntax.json. Browser screenshots are internal QA artifacts and are not release deliverables.

Tests use disposable synthetic data, Node 22, the PGlite PostgreSQL SQL engine and real Chromium. The environment uses a test-only Playwright PDF adapter for its headless-shell browser. Production Chrome CLI PDF execution, native multi-session PostgreSQL locking and hosted Render acceptance were not performed. Existing full English/Korean customer, sales, payment and settlement regressions also run.

No new dependencies or environment variables. No Git push, pull, merge or hosted deployment was performed.
