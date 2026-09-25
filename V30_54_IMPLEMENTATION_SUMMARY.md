# Blue Ocean Market V30.54.0 — Finance Deployment Integrity

## Protected baseline and scope

Built directly from the recovered V30.53.0 source archive. This narrow financial-integrity release retains V30.53.0 workflow/UI and protected Render persistent-disk behavior. It does **not** reset or replace the company database, evidence, uploads, audit history, access configuration, or existing official journals.

## Actual source-level cause

1. `server/server.js` ran `backfillExcavatorFinance()` on every startup and incorrectly treated the `excavator_payments` sale **settlement mirror** as a distinct cash payment. In `server/v326.js`, that mirror records the full sale settlement for operational display, including existing buyer advance allocations; actual new cash receipts are recorded separately in `excavator_buyer_payments` and Finance as `Excavator Buyer Payment`.
2. Legacy `Excavator Payment` default classification treated the synthetic mirror as an expense/Money Out, even when related to a sale. This produced the false ₩9,500 outgoing row with generic `Multiple payment records` reference and no receipt evidence.
3. The startup backfill also classified the full operational `Excavator Cost Transaction` / `Purchase` as cash out, although its legitimate Accounting posting recognizes inventory and supplier payable, not an additional bank payment. Actual ₩2,000 token and ₩3,000 balance are independent settlement transactions.

## Repairs

- All `financeSync` and startup-backfill paths skip the `Excavator Sale` settlement mirror. Backfill considers only paid real purchase/payment rows. Direct genuine legacy sale payments remain incoming rather than outgoing.
- `Purchase` operational value is classified as `Purchase / Payable`, `cash_effect=0`. It remains source-linked for inventory/payable Accounting recognition without being counted as additional cash outflow. Existing payment-method metadata is preserved on purchase resync to avoid unnecessary posted-journal hash changes.
- Additive `finance_integrity_cases_v354` scan identifies old ghost Finance rows by the actual linked mirror source. For **unposted** mirror rows, it voids/quarantines the false Finance record with audit details and uses the established Accounting sync to cancel an unposted proposal. No source sale, buyer advance, real payment, evidence, or posted journal is deleted.
- For **already-posted** mirror rows, the scan records `Needs Controlled Reversal`, prevents another verification/post, and leaves the official ledger intact pending authorized Accounting reversal and bank/GL reconciliation. It does not falsely claim an automated reversal happened.
- Both single and bulk Finance verification and the Accounting posting-readiness path explicitly reject legacy mirror rows/cases. Source-linked transaction recognition and buyer-advance accounting are retained.
- Read-only, permission- and BU-scoped diagnostic: `GET /api/finance/integrity-v354` shows case IDs and flags rows needing controlled reversal; no maintenance mutation endpoint is exposed.
- Idempotent scan and existing active-source uniqueness protections prevent repeated deployments from recreating quarantined mirrors.

## Accounting expected example

Machine purchase ₩5,000 = noncash inventory/payable recognition ₩5,000 + actual cash outflow token ₩2,000 and balance ₩3,000. Sale ₩9,500 = operational revenue and settlement, using previously received buyer advance ₩9,000 and only ₩500 of new cash in; it is NOT a new ₩9,500 cash transaction. Other genuine Finance source records are preserved.

## Deployment and recovery requirements

Before deploying, make a snapshot/backup of the existing Render persistent SQLite database **and uploads**; preserve the V30.53.0 rollback archive. Keep existing Render disk mount and environment settings. Do not reset or delete live data. Deploy on staging/controlled test first, check `/api/health` for `30.54.0`, then review `/api/finance/integrity-v354` while signed in with Finance permissions. Check the indicated Finance ID, source payment ID, linked journal, buyer advances, supplier payables, company account balances and GL before any controlled reversal. Do not verify/post the old suspicious ₩5,000/₩9,500 rows as if they were new payments.

## Verification scope

Source/syntax, inherited QA, actual SQLite SQL migration fixture, repeat-scan/idempotence and archive integrity tested locally. Dependency-backed full authenticated Node/Render workflows, real company DB migration and controlled reversal acceptance remain **not run**; do not describe this as production verified.
