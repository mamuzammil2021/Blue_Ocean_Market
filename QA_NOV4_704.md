# November 4 QA completion — V30.70.4

Based directly on V30.70.3. Scope: all 15 items in QA POINTS 4 nov.docx.

| Point | Result |
|---|---|
| 1 | Import payments refresh outstanding cards, history and actions on the originating record; supplier refresh remains supported. |
| 2 | Documents hides supplier payment and import cost panels. Payments exposes them. |
| 3 | Draft packaging purchases hide Invoice PDF and Void Purchase. |
| 4 | Editing a draft checks Save as draft; clearing it saves and confirms through the existing approval engine. |
| 5 | Draft list rows expose Confirm Purchase; approved records do not. |
| 6 | Shared document presentation omits optional zero monetary rows and all-zero optional columns, preserving totals, negative adjustments and ledger detail. |
| 7 | Search-only forms filter after a short typing pause and preserve query/focus; existing search owners remain in charge. |
| 8 | Recipe materials use one searchable, keyboard-accessible dropdown. |
| 9 | Product image pickers and server accept JPG, PNG, WebP and GIF; mismatched non-image uploads receive a clear error. |
| 10 | Customer profile Addresses supports add, edit, remove and default using existing tables/APIs. The default synchronizes the existing invoice contact address. |
| 11 | Sales invoice previews and PDFs use the shared optional-zero presentation policy. |
| 12 | Receipts refresh and return to their origin: import, supplier, customer, order or list. |
| 13 | New Customer within sale saves customer and sale in one transaction; retries reuse the saved result and failed sales leave no orphan. |
| 14 | Save sale returns to Sales. Optional payment review opens over that list; unconfirmed receipts leave the saved order unpaid. |
| 15 | Packaging waste consumes actual warehouse stock using the existing FIFO/valuation engine. Warehouse totals include historical negative balances so discrepancies remain visible. Raw, packaging and finished stock reconcile across tested receipts, production, wastage, transfers, sales and cancellations. |

## Stock findings

General packaging wastage previously inserted an unassigned negative movement while warehouse queries hid non-positive balances. This could show a larger warehouse stock than the material ledger. Wastage now uses the same location-aware consumption routine as production. Warehouse balances show any nonzero quantity, including historical negatives; transfers are available only for positive balances. Historical locations are not guessed or rewritten. Existing production, receiving, quarantine, return, valuation, reservation and Finance controls remain in place.

## Future commerce foundation

Existing sales channels, seller accounts, external order/payment/settlement references, SKU mappings, buyer payment and platform payout allocation remain intact. Coupang/Naver and own-site API connections can use this existing foundation; no live connector or extra feature was introduced.

## Validation and limits

Passed: 482 workflow checks across 31 regression suites and the focused suites, 19 database tests plus one upgrade test, 2,617 SQL plans, 312 JavaScript syntax checks and 128 frontend integrity checks. See qa/evidence/v30_70_4-release.json and the targeted evidence files. Validation uses disposable synthetic PostgreSQL-engine databases (PGlite), Node 22 and real Chromium. It includes the previous regression suites and focused November checks. PDF tests use a test-only Playwright adapter; production Chrome CLI execution, native multi-session PostgreSQL and hosted deployment require environment validation. No production data was changed.

No new dependencies, migrations or environment variables. Migrations 001–011 remain byte-identical to V30.70.3. No Git push, pull, merge or hosted deployment was performed.
