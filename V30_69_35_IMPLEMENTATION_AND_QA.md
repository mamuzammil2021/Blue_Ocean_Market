# Blue Ocean Market V30.69.35 — implementation and QA

**Delivery status: operational staging build. The final engineering gate passed. Live deployment acceptance and the explicit software/process boundaries below remain; this is not a claim that every original production acceptance criterion is certified.**

## Baseline and source control

The latest available source was confirmed before changes: `Blue_Ocean_Market_V30_69_34_PACKAGING_MATERIALS_ENGINEERING_CANDIDATE_GIT_READY.zip`, SHA256 `2f79c14fdf9f43e163a125588b7874e35bae57b0016d224e212e04e0ee5ff0f9`. It extends the user's protected V30.69.33 source, SHA256 `a15de0392ca38fe0f920796453e48dccc4781c77cfe8fb37b0d9e8e17d6fa0c3`.

The .34 local branch was clean at commit `9b7ea4e`. Development used the separate worktree `/workspace/scratch/5d87514a8428/source-v30.69.35` and feature branch `feature/v30.69.35-packaging-completion`. The protected source and its branch were not modified. The original upload contained no remote Git metadata, so the user's remote branch/main state cannot be independently certified. No push, merge, deployment or production mutation occurred.

## Implemented completion work

| Previous gap | V30.69.35 behavior |
|---|---|
| Goods before invoice | Authorized Accounting policy selects an existing GRNI liability ledger. Each unbilled receipt records that exact ledger; invoice recognition clears its net received value and recognizes only the remaining in-transit balance. An invoice reference can be supplied when it arrives. |
| Recognized purchase changes | Revision-checked existing-line quantity, price, discount/tax and header amendments create before/after documents and balanced differential journals. Historical supplier/SKU/unit identities remain fixed. Controlled cancellation retains receipts/movements and cancels unposted journals or submits posted reversals. Downstream dependencies must be resolved. |
| Credit notes and refunds | Credits link accepted returns to the original receipt, reduce supplier AP and cancel replacement quantities. Overpayments become supplier credit. The existing settlement engine receives the actual refund into the selected company account. Credit reversal restores the replacement balance and submits the required posted reversal. |
| Complex return valuation | Physical inventory is removed at its moving-average value; source acquisition carrying value and any reviewed variance are separate journal components. Rejected goods reduce quarantine only. |
| Reservations and partial production returns | Warehouse reservations reduce available stock without changing on-hand. The native production form selects a reservation and validates its outputs/BOM snapshot; actual use and wastage consume stock atomically. Partial unused-material returns preserve batch/output snapshots and add finished-cost corrections. Whole-batch void reverses both consumption and returns. |
| Native advance selection | The shared payment form exposes existing advances in original currency, available native quantity and KRW carrying value. Selected advance carrying cost and invoice settlement basis are distinct; their difference produces one non-cash FX entry. Supplier pool availability consumes carrying values, not invoice values. |
| Extra conversion legs | Outgoing Packaging Purchase payments can explicitly evidence source → transfer → recipient → invoice currencies, rate direction, fees and confirmation. Immutable conversion snapshots and legs retain actual account debit and recipient amount. Amounts must reconcile after rounding. |
| Third-party costs | An existing central supplier can bill a separate final acquisition invoice after receipts. Inventory, recoverable tax and operating classifications remain distinct. It uses shared payment/Finance/Posting Control; controlled reversal restores its valuation and preserves history. See the timing/costing boundary below. |
| Central balances | Existing supplier profiles/statements include packaging invoices, dated amendments, credits/refunds and external invoices. Grouped currency balances show obligations, supplier credits and advances. No second supplier/payment/statement engine is introduced. |

## Reused architecture

The platform/component registry was inspected first. The build reuses the existing material and stock-movement tables; central `pink_salt_suppliers` and its multi-category classification; the shared production/SKU/BOM/lot infrastructure; central advance/allocation tables; shared Pink Salt FX payment form and service; L0–L5 approvals with actionable tasks/notifications; Finance verification; the Accounting Chart of Accounts, journal proposal/reversal service and Posting Control; existing document viewer; routing; Review & Confirm; root processing locks; and EN/KR rendering.

Packaging Materials still has exactly **Materials, Purchases, Stock & Usage**. Purchase detail still has Overview, Receiving, Payments and History. New actions live in those sections or the existing supplier/production profiles. Core material/purchase/stock lists retain backend pagination with default 25. Reservation/production/advance selectors use bounded auxiliary reads.

### Separate business events

| Event | Physical stock | Cash/Finance | Accounting control |
|---|---|---|---|
| Purchase authorization | None | None | No automatic inventory/AP posting |
| Unbilled receipt | Accepted quantity only | None | Inventory / approved GRNI proposal |
| Invoice recognition | None | None | Clear GRNI, remaining in transit, tax/expense and AP |
| Receipt after recognition | Accepted quantity only | None | Inventory / in-transit proposal |
| Advance allocation | None | No new cash record | AP / advance carrying value / non-cash FX |
| New payment or refund | None | One exact real account movement | Required approval → Finance verification → Posting Control |
| Production | Confirmed actual use/waste only | None | Existing finished-product costing and waste recognition |
| Return, amendment or correction | Source-linked movement/value effect | Only through shared payment reversal/refund | Differential proposal or authorized reversal; posted originals are preserved |

## Schema and migration

`server/migrations/36935-packaging.sql` adds policy and source-document tables: `pink_pack_receiving_policies`, `pink_pack_revisions`, `pink_pack_credits`, `pink_pack_reservations`, reservation lines, production returns, finished-cost adjustments and external costs. Idempotent additions in `server/packaging-materials.js` preserve original receipt values, cancelled delivery quantities and central advance carrying amounts. The shared FX service adds immutable conversion snapshots to existing transactions and legs.

These are operational documents and references on the existing ledgers, not replacement supplier, payment, inventory or Accounting engines. Existing IDs, Finance references and posted journals are preserved. No fake purchases/receipts, duplicate opening stock or historical cash events are generated. The old nullable-allocation upgrade from .34 remains retry-safe.

The actual protected .34 application created representative legacy records plus a recognized packaging purchase and partial accepted/rejected receipt before the .35 migration. Original selected columns across supplier, material, movement, advance, allocation, purchase, receipt, production, Finance, Chart of Accounts and journal tables were compared after migration and repeated startup. All reconciled; foreign-key checks passed. The original .33 upgrade test also passed.

## Financial examples executed

- Partial receipt before invoice: 6 of 10 units at KRW 100 → Inventory/GRNI 600; later invoice clears GRNI 600 and retains only 400 in transit. Approval alone creates neither stock nor cash.
- Recognized unit-price change: 10 units × 100 → 10 × 120; the differential 200 changes value without adding quantity or replacing receipt IDs. Supplier statements retain dated amendment effects.
- Paid invoice return/credit/refund: original credit reduces AP, then one shared incoming account transaction clears the supplier credit; no second stock deduction occurs.
- USD advance 10 at historic KRW 1,200/USD settles USD 10 on an invoice carried at 1,300: advance carrying reduction 12,000, AP reduction 13,000, non-cash FX gain 1,000, no fresh bank movement.
- Evidenced KRW → USD → PKR → USD invoice: bank debit KRW 13,720, supplier receives PKR 2,800, invoice settles USD 10; all legs remain linked.
- Reservation, actual use plus wastage, partial unused return and whole-batch void reconcile quantities and unique movement IDs. Concurrent identical receive requests create one durable receipt and one increment.
- Posted credit correction leaves the original Posted until a Pending Review reversal is finalized in existing Posting Control.

## Executed QA evidence

| Test group | Result | Logged PASS checks / syntax files |
|---|---|---:|
| JavaScript syntax | PASS | 387 |
| Material image upload and authenticated viewer | PASS | 2 |
| Concurrent submissions, delegated corrections and posted reversals | PASS | 6 |
| Completion: GRNI, revisions, credits/refunds, reservations, returns and currency legs | PASS | 12 |
| Protected .34 data upgrade and retry | PASS | 6 |
| New browser workflows and Korean correction forms | PASS | 19 |
| Catalog, purchasing, receipts, stock and shared settlements | PASS | 18 |
| Delegated approvals, production, posting and evidence | PASS | 10 |
| Native KRW/USD/PKR closure, cash, reversal and tax treatment | PASS | 9 |
| Actual protected .33 data upgrade and repeated startup | PASS | 5 |
| Authenticated browser, native production, deep routes, EN/KR and responsive UI | PASS | 13 |
| Nineteen protected financial and operational regression suites | PASS | 19 |
| Actual English/Korean statement PDFs and cache invalidation | PASS | 4 |

One final-run currency fixture failed to become healthy before its startup deadline; no business assertions ran in that failed attempt. The same nine currency checks passed on a targeted rerun against identical implementation hashes. The release JSON preserves this startup retry explicitly; no functional failure was waived.

The 19 inherited regression suites contain **282 named PASS checks**. Logged checks are grouped assertions and repeated workflows, not a count of unique scenarios. The exact authoritative outputs are `qa/evidence/36935-release.json`, completion/corrections/browser/upgrade/image JSONs and the referenced .34 regression evidence rerun against this source. The release gate records SHA256 hashes for 222 implementation/build files; the packaged source is checked against those hashes.

Runtime: Node 22.23.3, real Chromium 153.0.8010.0, Playwright 1.62.1, disposable SQLite databases. Browser checks cover desktop and 390px layouts, deep refresh/Back, Korean correction forms, shared payments, processing locks, production and material images. No uncaught JavaScript errors were observed in those journeys.

Real English/Korean PDF endpoint checks passed for content, totals and cache invalidation. The host's serverless Chromium print CLI does not exit normally, so a **test-only Playwright adapter** prints the production server HTML using real Chromium. Production PDF code is unchanged. Standard Docker/Render Chromium CLI behavior remains a staging check.

### Reproducing the gate

With Node 22, dependencies, compatible Playwright and a real Chromium installed, set the two original baseline archive paths and run:

```bash
export BOM_PACKAGING_BASELINE_ZIP=/absolute/path/Blue_Ocean_Market_V30_69_33_PAYMENT_SETTLEMENT_APPROVALS_GIT_READY.zip
export BOM_PACKAGING_V34_ZIP=/absolute/path/Blue_Ocean_Market_V30_69_34_PACKAGING_MATERIALS_ENGINEERING_CANDIDATE_GIT_READY.zip
export BOM_CHROMIUM=/absolute/path/chromium
export CHROME_PATH=/absolute/path/chromium
npm run qa:release
node qa/browser_v36935_material_image.js
```

Use the normal production Chromium CLI for local/staging PDF acceptance. The special host adapter used for this report is a test-environment workaround, not a production dependency shipped as a substitute.

## Bugs fixed during completion

Reservation saves originally returned to Materials instead of Stock & Usage. Native advance availability initially conflated AP settlement and advance carrying cost; all affected central projections now consume the proper carrying amount. Moving-average return rates now use an internal valuation arithmetic path rather than rejecting computed precision. Cancellation uses revised receipt values, including amendments. Supplier statements include dated amendments, credit reversals and non-cash advance FX adjustments. Corrections preserve original accounts and conversion fields. Existing protected workflows passed their reruns.

## Remaining work and practical limits

The following are deliberately explicit; the passing gate does not erase them:

1. **Live acceptance:** no access to the user's actual production database, Render instance, real bank evidence or SMTP delivery was available. Real-data migration reconciliation, deployment/storage/PDF runtime and real reviewer/account policies still need staging acceptance. No production deployment was attempted.
2. **Third-party cost timing and retrospective costing:** separate capitalizable third-party invoices are finalized after receipts and after parent invoice recognition. Pre-receipt third-party invoice accrual/allocation is not implemented. Costs arriving after packaging has been issued use reviewed General Expense variance treatment; a retrospective accountant-selected finished-lot/COGS revaluation policy is not implemented. The supported final-invoice workflow is operational and tested.
3. **Historical refund attribution:** existing refunds without a source advance ID cannot be honestly assigned to an exact historical native advance. They retain the established KRW pool/FIFO carrying projection. No missing identity was fabricated.
4. **Supported corrections:** existing-line approved amendments preserve supplier/material/unit/currency identity. Different identities require a new purchase or dependency reversal. Sold/allocated production lots require existing downstream corrections first. Incoming refunds use the existing normal bank receipt conversion; the new additional-leg editor is for outgoing Packaging Purchase payments.
5. **Exhaustiveness:** selected EN/KR browser/PDF/error workflows and existing notification regressions passed; every possible app-wide localization and real email state was not exhaustively exercised.

The implementation closes the major .34 operational gaps, but points 1–2 prevent claiming that the entire original production-ready assignment is fully accepted. Do not deploy merely because the archive says Git-ready.

## Git, deployment and rollback

Use `V30_69_35_MAC_GIT_NEW_BRANCH.md` for clean-main → new branch → safe copy → review → commit/push instructions. If main is newer, reconcile it rather than overwriting it. Use `docs/releases/v30.69.35/DEPLOYMENT_AND_ACCEPTANCE.md` for backup, exact migration commands, approval/GRNI prerequisites and rollback.

No destructive reset, main push, duplicate supplier registry or replacement financial ledger is required. After new .35 activity, prefer audited roll-forward; never restore an old database over newer money, inventory or production history.
