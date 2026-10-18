# Blue Ocean Market V30.69.34 — implementation, QA and remaining work

**Status: operational engineering candidate. The full requested production-ready scope is not complete.** The delivered source implements and tests a working Packaging Materials workflow; the substantive gaps below must not be treated as passed acceptance criteria.

## Baseline and source control

- Protected source: `Blue_Ocean_Market_V30_69_33_PAYMENT_SETTLEMENT_APPROVALS_GIT_READY.zip`, supplied in this conversation and confirmed as the newest available Library result before editing.
- Protected ZIP SHA256: `a15de0392ca38fe0f920796453e48dccc4781c77cfe8fb37b0d9e8e17d6fa0c3`.
- The uploaded ZIP contained no Git metadata, so its original remote branch and working-tree status could not be determined. An isolated working copy was imported into a local baseline commit and developed on `feature/v30.69.34-packaging-materials`. No existing main branch or unrelated working tree was overwritten.
- Delivered version: `30.69.34`. No Git push, merge, deployment, live bank transfer, production-data mutation or external email delivery occurred.

## Implemented architecture

Packaging Materials now has exactly **Materials, Purchases, and Stock & Usage** as its primary sections, with four backend operational KPIs and linked filters. Purchases use full-screen detail pages with Overview, Receiving, Payments and History sections. Material, purchase, selected purchase section, legacy receipt and stock movement have stable routes.

The central Pink Salt Suppliers registry remains the only supplier master. Its existing category JSON supports Import/Raw Salt and Packaging Material eligibility together. New packaging purchases enforce active eligible suppliers in the UI and backend; import creation also rejects inactive/ineligible suppliers. Existing identities and historical references remain intact. Central supplier profiles, payables, advance ledger and statements include new purchase obligations and settlements.

### Catalog and purchasing

The existing `pink_salt_packaging_items` master gains Korean name, specification, dimensions, configured purchase-unit conversions, optional image and revision data. Different variants remain separate material IDs/codes. Supplier/material mappings reference existing suppliers and retain code, quoted price/currency/unit, conversion, preferred status, lead time and date. Mapping changes are included in material before/after history. Used materials cannot be hard-deleted or have their base unit changed; unused materials can be deleted and used ones archived.

One purchase contains multiple lines from one supplier, plus currency, invoice reference, dates, delivery information, terms, notes, documents and audit information. Line snapshots preserve original material information. Fixed-scale BigInt arithmetic is shared by the browser preview and backend; net line amounts, discount amounts and tax are rounded to two currency decimals using half-up rules before summing. Quantities/unit prices and entered rates support up to four decimals. Acquisition-cost allocation and KRW conversion use integer arithmetic, with allocation residue assigned explicitly.

Draft editing, submit/approval, invoice recognition, pre-history status changes, closing after full receiving/settlement, and reopening after a controlled payment reversal are implemented. Purchase approval and invoice recognition use the existing L0–L5 rules, review tasks and notifications. They do not move cash or physical stock.

### Receiving, stock and production

Each partial/full receipt has its own durable header/lines, warehouse, employee, date, delivery reference, evidence and accounting link. Only accepted quantities enter usable stock. Rejected quantities enter a separate quarantine projection and can be returned without reducing usable stock. Receive All Now uses the same receipt operation. Atomic transactions and operation keys prevent partial writes, over-receipt and duplicate submission.

The existing packaging movement ledger remains authoritative. New movements have immutable UUIDs, source references, user, reason and cost links. Warehouse transfers preserve owned quantity. Wastage and positive/negative adjustments use existing permissions/approval rules. Supplier replacement returns retain source receipt history and reopen delivery balances. Receipt carrying values preserve the final rounding residue: a KRW 10 acquisition received in three equal parts produces KRW 3.33 + 3.33 + 3.34, not KRW 9.99 of inventory.

Packaging BOM editing reuses `pink_salt_bom_lines` and finished SKU IDs, with unit conversions and revision snapshots. The native production form shows expected requirements and stock, accepts actual use/wastage and a variance reason, and does not deduct inventory during planning. Confirmed completion consumes actual quantities at warehouse level, records the batch/recipe link and feeds existing finished-product cost/journals. Wastage is separated from finished-product cost. The existing controlled whole-batch void restores consumption/wastage and reverses accounting subject to dependency checks; reversal movement UUIDs remain unique.

### Shared payments and Accounting

The purchase Payments section opens the protected shared payment form and settlement engine through a `packaging_purchase` context. Advance Only, New Payment and Both use the same conditional controls and existing supplier advance ledger. A purchase advance allocation references the purchase directly and creates neither a fake stock movement nor another cash record.

All supported active permitted company accounts remain available, including cross-currency accounts. Source debit, account currency, recipient/invoice currency, rates, fees, KRW valuation, invoice settlement and exchange differences remain separate. Required authorization precedes independent Finance verification and Accounting Posting Control. Corrections/reversals use the protected shared engine rather than a new payment service. Reversing a payment on a closed purchase reopens that purchase's operational settlement state.

Invoice recognition creates a proposal using existing in-transit inventory, supplier payable, tax and expense mappings. A recoverable-tax selection must be an existing active Tax/VAT asset ledger and cannot be a company bank/payment ledger. A confirmed receipt transfers acquisition value into the existing packaging inventory account. Production uses the existing raw/packaging/finished inventory and waste accounts. No Chart of Accounts or parallel posting engine was created.

### Shared components reused

- Platform/entity registry and the sole route registry/controller.
- Central supplier profiles, payment accounts, statements and advance/allocation tables.
- `pink-fx-engine`, shared payment UI, approval dependencies, Finance verification and Posting Control.
- Existing packaging movement ledger, SKU/BOM records, production batches, lots and production journal service.
- Shared Review & Confirm, root processing overlay, modal/footer behavior, authenticated attachment viewer and important-only notification/email policy.

New components are the packaging workspace/controller, purchase/receipt records, supplier-material references, immutable history/operation records, BOM revisions, decimal utility/client generation and the controlled migration CLI. They extend the existing services; they do not replace supplier, cash, stock or Accounting ledgers.

## Migration and historical integrity

The migration is additive and retry-safe. The existing packaging advance allocation table is transactionally rebuilt to allow a purchase reference without requiring a legacy stock movement; original IDs, fields and indexes are copied intact. New material/production metadata is added without revaluing history. Existing legacy receipts remain original receipts, accessible through the Purchases legacy filter; no historical purchase, receipt or opening balance is fabricated.

The protected-source upgrade test starts the actual .33 application, creates a legacy material/receipt/evidence, advance/allocation, verified Finance entry and posted journal, lets its pre-existing Accounting queue finish, then backs up and upgrades that database. It compares all original selected columns across supplier, material, movement, advance/allocation, import payment, production, Finance, CoA and journal tables. It also checks foreign keys, exact balances/evidence and repeat startup. No original posted/verified monetary record is rewritten by the migration.

Run the same migration through normal startup or `scripts/migrate-packaging.js`, which requires explicit absolute database and new-backup paths. Full backup/upgrade/rollback instructions are in `docs/releases/v30.69.34/DEPLOYMENT_AND_LIMITATIONS.md`.

## Actual verification

Current aggregate: `qa/evidence/36934-release.json`; status **PASS**. Node `v22.23.3`, Chromium `153.0.8010.0`, Playwright `1.62.1`, actual application servers, authenticated browser sessions and disposable SQLite data. The gate records exact SHA256 values for the implemented source files. Its recorded execution started `2026-10-18T18:42:39.203Z` and finished `2026-10-18T18:44:03.679Z` (runtime UTC timestamps).

| Suite | Result | Named checks |
|---|---|---:|
| Catalog, purchasing, receipts, stock and shared settlements | PASS | 18 |
| Delegated approval, production, posting and evidence | PASS | 10 |
| Native currency, cash, reversal, tax and decimal valuation | PASS | 9 |
| Protected .33 upgrade, consistent backup and repeat startup | PASS | 5 |
| Authenticated browser, production, routing, processing, EN/KR and mobile | PASS | 13 |
| 19 inherited financial/operational regression suites | PASS | 282 |
| Actual English/Korean supplier PDFs and cache invalidation | PASS | 4 |
| JavaScript syntax, including scripts | PASS | 381 files |

There are **55 new named acceptance checks, 282 inherited named PASS checks and four PDF checks**. These are named checks containing multiple assertions, not 341 distinct production user journeys. The current aggregate expands to 26 suites/groups including syntax and the 19 regressions.

The regression set covers Excavator payments/accounts, Pink Salt Imports/advances/recipients, all six configured same-currency settlement combinations, reference and correction integrity, approvals/tasks, native bank posting, important-email classification/deduplication through a spy, Accounting periods/runtime and inventory/order atomicity.

Practical browser verification creates material and purchase records, performs CEO authorization with a reason, receives all materials, opens shared advance-only settlement, checks a single root overlay plus modal/navigation locking, and completes native production using five pouches plus one wasted pouch (exactly six deducted). It exercises direct refresh, purchase sections, browser Back, English/Korean rendering and a 390px mobile viewport. Desktop/mobile Korean screenshots were inspected with Korean fonts; screenshots are internal QA artifacts and are not redistributed.

The restricted host's serverless Chromium print CLI could not exit normally. Actual PDF endpoint tests used a local test-only adapter that launched the same real Chromium through Playwright to print the server-generated HTML. English and Korean PDF text/figures and cache invalidation were verified. The production PDF service was not changed for this adapter; standard Docker Chromium CLI behavior remains staging acceptance.

## Defects corrected during implementation

- Combined purchase/receipt behavior was separated for new purchases without duplicating legacy stock or supplier records.
- Shared auto-review plus custom confirmation initially produced two review steps; new forms now use one shared explicit confirmation.
- Same-record route section transitions initially lacked handlers; primary/internal tabs now restore correctly.
- Production consumption now reduces the relevant warehouse projections rather than only the global material quantity.
- Cloned production reversals now receive fresh immutable movement IDs.
- Rejected-item returns clear quarantine without reducing usable inventory or recognizing a second asset value.
- Closed purchases reopen after authorized payment reversal.
- Frontend/backend invoice arithmetic is shared, recoverable tax excludes bank ledgers, and partial receipt valuation clears acquisition value exactly.

## Remaining work — not passed or production-certified

1. **GRNI / receipt before invoice:** the current receipt flow requires recognized supplier invoice. A configurable authorized unbilled-receipt policy and later invoice reconciliation remain unimplemented.
2. **Recognized purchase amendments/cancellation:** an end-to-end source-linked invoice/receipt/payable correction or reversal/revision flow after financial/stock history is not complete. Draft edits and safe pre-history status changes do not satisfy that remaining requirement.
3. **Supplier credit notes and complex valuation returns:** implemented returns expect replacement goods and leave the invoice payable unchanged. Credit notes, supplier refunds and a completed Finance valuation-correction flow remain required. A guard for an unsafe valuation is not presented as that completed flow.
4. **Packaging reservations / partial post-production returns:** expected requirements are implemented; a packaging reservation/work-order model and separate partial unused-material return after completion are not. Current reserved values are zero; whole-batch controlled void/replacement is available.
5. **Native advance/currency presentation:** central advances still use their existing KRW carrying pool. A complete per-advance native-currency selector and grouped supplier outstanding/advance balances by currency remain to be implemented.
6. **Extra conversion legs / other-party costs:** supported single-bank-conversion settlements work, including different source-account currencies. Additional recipient/intermediary currency legs and allocation of a separately billed third-party acquisition cost are outside this implementation. Purchase expense lines must be billed by the selected supplier.
7. **Operational/exhaustive acceptance:** real SMTP/Render/bank evidence, the user's actual production database, and every possible app-wide bilingual/error/notification state were not exercised. Optional material-image upload is wired to the existing authenticated viewer but has no dedicated browser acceptance case in this release.

These are substantive remaining requirements. The source ZIP is a working engineering candidate, **not a claim that all 20 non-negotiable acceptance criteria are complete**.

## Git and deployment

Use `V30_69_34_MAC_GIT_NEW_BRANCH.md` for exact new-branch, safe-copy, commit and push steps. Use Node 22 and preserve existing `.env`, persistent data, uploads and secrets. The guide never pushes main or uses a destructive reset/delete copy. If current main is newer than .33, reconcile its changes instead of overwriting them.

Staging upgrade, consistent backup, migration commands, reviewer/account/tax prerequisites and rollback restrictions are documented in `docs/releases/v30.69.34/DEPLOYMENT_AND_LIMITATIONS.md`. A code-only downgrade after .34 financial/stock activity is unsafe; prefer an audited roll-forward. Never restore an old database over newer financial activity.
