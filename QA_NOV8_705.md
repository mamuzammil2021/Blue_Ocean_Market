# November 8 QA completion — V30.70.5

Baseline: V30.70.4, verified from the protected release ZIP (SHA-256 4571cb289204251339431407409ead77f1bed145b790b1ee9a832d7035738fd3). Scope: the four points and four screenshots in QA POINTS .docx.

| Point | Implementation | Verification |
|---|---|---|
| New Import form | One category entry area and Add to Cart / Update Item; compact item table with edit/remove. Light section backgrounds separate supplier/shipment data, category entry and totals. Existing import API and accounting semantics remain unchanged. | Multiple categories, edit/remove, positive values/whole bag counts, currency changes, live original/KRW/weight totals, saved database lines, EN/KR and mobile. |
| Raw Salt Stock search | One server search replaces the competing generic table search. Searches import number, container, invoice reference, category, specification, supplier and location. Sorting/pagination use the full result; search and sorting persist in the route. | Case-insensitive supplier/location/specification lookup, results beyond page one, query/focus/refresh/clear and whole-result sorting. |
| Packaging Purchase edit | Confirmed purchase header edits open directly in the edit route as a page. Drafts retain the full cart editor. Received/ineligible purchases stay locked; quantities, prices, payment history and existing server controls are preserved. | List-to-edit with no intermediate modal, direct refresh, save and cancel returning to the purchase. |
| Repacking / Production | Failed business transactions release their processing claim after rollback. Stable per-form operation keys and client busy guards preserve successful replay protection. Specific validation/API errors remain visible in the form. Quantity changes preserve raw-input controls, entered weights and batch selection, and both summaries update live. | Repeated invalid/shortage attempts, corrected retry, replay/concurrent duplicate protection, raw/packaging/finished/waste reconciliation, multiple output rows and list return. |

## Root causes

The generic mutation middleware created its processing claim before the business transaction began. Error handling deleted that claim inside the transaction; rejecting the business response rolled back that deletion. An unchanged retry then reported that processing was still in progress. The boundary now invokes the claim cleanup after rollback. Successful response storage remains in the committed transaction, and true concurrent requests remain protected. This fix also applies to other controllers using the same shared boundary; it does not disable duplicate protection or delete operational history.

Production quantity input and change handlers also rebuilt raw-input controls while focus was moving into them. The calculation now redraws those controls only when the category structure changes. Quantity-only changes update the summaries in place. Added output rows use the same delegated input handler.

## Validation

Passed: 500 workflow checks (including 18 focused November 8 checks), 20 database/upgrade tests, 2,617 SQL plans, 314 JavaScript syntax checks and 129 frontend integrity checks. See qa/evidence/v30_70_5-release.json for environment details. Tests use disposable synthetic PGlite PostgreSQL-engine databases, the supported Node 22 runtime and real Chromium. The test-only Playwright PDF adapter does not certify the production Chrome CLI. Native multi-session PostgreSQL and hosted deployment are not certified by this environment.

No new migrations, dependencies or environment variables. Migrations 001–011 remain byte-identical to V30.70.4. No Git push, pull, merge or hosted deployment was performed.
