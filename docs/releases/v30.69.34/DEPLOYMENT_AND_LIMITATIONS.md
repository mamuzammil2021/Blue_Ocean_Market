# V30.69.34 — deployment, migration and remaining acceptance

## Release status

This is an **operational engineering candidate, not a production-certified completion of the entire requested redesign**. The implemented catalog, purchasing, receipt, stock, payment and production paths run against the real application and disposable SQLite databases. The acceptance gaps below remain substantive work. Do not promote this build to the protected production baseline until they are resolved or explicitly accepted for a limited staging trial.

## Implemented accounting boundary

Purchase approval creates neither stock nor cash nor an automatic payable. Supplier invoice recognition separately submits a balanced Accounting proposal using existing accounts: inventory in transit, the selected existing recoverable-tax asset where applicable, operating expense and supplier payable. A confirmed physical receipt transfers acquisition value from in-transit inventory to packaging inventory. Partial receipts carry the final rounding residue into the final receipt. Payments and advance allocation use the existing currency settlement engine and central supplier advance ledger. Consumption uses the existing production records and journals; confirmed wastage remains separate from finished-product cost.

Historical material unit costs and financial records are not recalculated during migration. New receipts update the existing material cost field with a moving weighted average; that field remains the cost used by native production. A supplier return preserves receipt carrying value; a return that cannot reconcile the remaining inventory valuation is stopped for Finance review rather than silently changing inventory value.

All additional purchase costs in this screen are amounts **billed by the selected purchase supplier**. A third-party freight invoice must not be added to that supplier's payable.

## Remaining business/implementation gaps

1. **Receiving before the supplier invoice / GRNI:** receiving currently requires an approved purchase with a recognized supplier invoice. A configurable, authorized goods-received-not-invoiced accounting policy and its later invoice reconciliation are not implemented. No GRNI account or policy has been invented.
2. **Amendment/cancellation after invoice recognition or stock/payment history:** safe Draft edits, approval-decision reopening and pre-history cancellation are available. An end-to-end source-linked purchase-invoice reversal/amendment workflow after recognition, receiving or payment is not implemented. Do not alter these records directly in SQLite or the ledger.
3. **Supplier credit notes and complex return valuation:** current supplier returns are replacement returns that reopen receipt quantities. They do not issue a supplier credit note, reduce the invoice payable or initiate a refund. Returns that require a valuation correction need an additional controlled Finance workflow; the current guard is not that completed workflow.
4. **Reservations and planning:** the existing packaging production workflow completes a batch directly; it has no packaging work-order reservation ledger. Expected requirements and available stock are shown without deducting stock. `reserved` is zero because packaging reservation is not implemented. Partial unused-material returns after completed production are not a separate operation; the existing authorized whole-batch void/replacement restores usage and wastage, subject to sold/allocated-lot dependencies.
5. **Native advance balance selection and currency summaries:** shared supplier advances remain a KRW carrying-value pool with original-currency evidence. The packaging payment form does not offer a new per-advance native-currency selection ledger. Supplier profile/statement integration reconciles KRW obligations and retains original-currency transaction information, but a complete grouped outstanding/advance balance presentation by every currency is still required.
6. **Multiple conversion legs / third-party acquisition costs:** the protected shared payment engine supports one evidenced bank conversion to the invoice/recipient currency. A recipient in a third currency requiring additional conversion legs is not implemented. All permitted supported source-account currencies remain available. Allocation of separately billed third-party acquisition costs into these purchase lines remains outside this build.
7. **Scope of localization and QA:** the new module has EN/KR strings and authenticated desktop/mobile browser coverage, including Korean glyph inspection. This does not certify every possible notification/error/PDF state throughout the application. Material-image upload is implemented but does not have a dedicated browser acceptance case in this release.
8. **Operational acceptance:** no live Render deployment, real bank transfer, production database migration, real SMTP recipient delivery or exhaustive production-history review occurred. The inherited important-email pipeline was exercised by its isolated delivery spy, not external SMTP.

## Prerequisites

- Node.js 22.x and the dependencies installed by `npm ci`.
- The existing persistent SQLite data/upload paths and existing secrets. Do not introduce PostgreSQL for this release.
- Standard Chromium and Korean fonts for production PDFs; the existing Dockerfile already installs them.
- Configured independent approvers and existing company/supplier accounts. New purchase and invoice authorization rules use the existing L0–L5 framework.
- For recoverable tax, use an existing active Asset account whose subtype identifies Tax/VAT, excluding any company payment-account ledger. No new Chart of Accounts is created.

## Backup and isolated upgrade

1. Pause financial/stock writes and stop the application before a controlled production upgrade.
2. Use the existing consistent SQLite/storage backup process, including uploads, configuration and secrets. Never copy only the main SQLite file while ignoring an active WAL. Keep the backup outside the source tree.
3. Restore a copy into an isolated staging data directory. Preserve the current uploads beside that copy. Never point QA fixture suites at production.
4. Install the new source using `npm ci` with Node 22.
5. Either start the application normally (the migration runs automatically), or run the explicit preflight against the **stopped isolated copy**:

```bash
node scripts/migrate-packaging.js \
  --database /absolute/staging/data/blue-ocean.sqlite \
  --backup /absolute/staging/backups/before-v30.69.34.sqlite
npm start
```

The backup filename must be new. The command validates initialized source tables and foreign keys, makes a consistent SQLite backup, runs the same idempotent migration and prints before/after material, movement/quantity and Finance reconciliation counts.

6. Check material quantities and warehouse assignments, supplier balances/advances, existing receipt evidence, posted journals and production links. Inspect `pink_pack_migration_audit` and the current release evidence.
7. Test existing open approvals and reviewer settings. Confirm a representative purchase, recognition, partial receipt, payment/advance, independent Finance verification, Posting Control and production batch in staging. Check direct refresh, Back/Forward and EN/KR behavior.
8. Complete the remaining business gaps or explicitly limit staging scope before any production promotion. No Git push or deployment was performed by this work.

## Migration details

The existing material IDs, supplier IDs, movements, advances, Finance and Accounting records remain authoritative. New purchase/receipt/line/audit/mapping tables are additive. The established supplier packaging allocation table is rebuilt transactionally to make its legacy movement FK nullable and add a purchase FK; all original columns, rows, IDs and indexes are preserved. This lets advance allocations reference a purchase without creating a fictitious stock movement.

Existing ledger balances already come from packaging movements, so this migration creates no guessed opening balance, historical purchase or receipt. Legacy combined purchase/receipt records remain accessible through the Purchases legacy filter and their original supplier profiles. New production fields record useful consumption, wastage, variance reason and recipe snapshot. Original historical columns remain unchanged.

## Rollback

A code-only downgrade is not safe once .34 purchase allocations, receipts or production movements have been created: .33 does not understand the new purchase references and source events. Pause writes and prefer a reviewed roll-forward fix. An old database backup can be restored only when doing so will not discard any subsequent stock, payment, approval or posting activity, and with its matching source/uploads/configuration. Never overwrite newer financial activity with the pre-upgrade backup. Keep the existing .33/.32 rollback restrictions as well.

## QA browser/PDF environment

Engineering QA used real Chromium. In this restricted host, the serverless Chromium binary worked through Playwright but its standalone print CLI did not exit normally. The PDF endpoint suites therefore used a local test-only CLI adapter that launched that same real Chromium through Playwright and printed the actual server-generated HTML. No production PDF service code was changed for that adapter. Standard Docker Chromium CLI behavior still requires staging acceptance.
