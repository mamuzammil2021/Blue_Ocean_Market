# V30.69.33 — payment settlement and approvals

Built directly from protected V30.69.32 (`327f6f3316ca40d3da77299750e2c85e2aad7039585b0278853a338d9256c6a0`). Latest available protected source was checked before editing. The initial un-packaged working changes were lost after the environment reset; this build was reconstructed from the verified .32 archive and tested again. Earlier un-packaged test claims are not substituted for current results.

## Positive settlement outcome

The existing durable settlement engine already records confirmed source-account debits/credits and separate invoice/advance carrying values, then prepares balanced Accounting proposals. This build preserves that engine and adds the missing native-currency account presentation and approval lifecycle. Invalid data still needs correction; a block alone is not the acceptance outcome.

A real isolated-server case exercises the full sequence:

| Item | Confirmed fixture value |
|---|---:|
| Invoice settled | USD 10 |
| Original invoice recognition | 1 USD = KRW 1,300 |
| Actual debit from the selected company USD account | USD 10 |
| Transfer ratio to the supplier USD account | 1 USD = 1 USD |
| Payment-date KRW valuation | 1 USD = KRW 1,400 |
| Bank accounting equivalent | KRW 14,000 |
| Payable carrying amount cleared | KRW 13,000 |
| Genuine realized FX loss | KRW 1,000 |

The approved posting is **Dr Payables KRW 13,000; Dr FX Loss KRW 1,000; Cr the selected company bank ledger KRW 14,000**. Its bank line retains USD 10 and the exact company financial account ID. The external supplier bank is recipient evidence; it is not fabricated as another company bank account or another Finance cash movement.

A customer receipt subsequently credits the same company account USD 5 (against KRW 7,000 of customer credit). Native movements are therefore USD 10 out, USD 5 in, net USD −5, with their separate KRW values. Advance allocation changes settlement without a new Finance movement. Existing tests cover six configured currencies, permitted cross-currency routes, separate/included fees, refunds, corrections and reversals.

The application records the evidenced bank movement. It does not initiate a real transfer through a bank API.

## Required approval before verification

Payment authorization, Finance verification and Accounting posting are separate decisions. The individual and bulk Finance endpoints enforce the same approval dependencies; CEO status does not bypass a pending dependency at verification time. Existing controlled CEO direct authorization remains available with its explicit confirmation and audit record.

Pending transaction authorization still prevents recording a new movement until approval execution. Request-local explicit links bind resulting Finance records to approved actions without replacing native BU payment handlers. Historical exact source links are also checked. A two-stage request reuses one task, routes it from Finance authorization to CEO, and records exactly one payment after final approval. Finance must then verify it separately.

When FX/fee accounting treatment lacks an approved basis, the Finance detail offers **Request payment approval**. The request includes the native debit, account, recipient, invoice allocation, advance carrying allocation, payment valuation, fees, genuine difference, reference and receipt. CEO review of that exact payment can make it eligible for later Finance verification and Posting Control. It does not approve unrelated payments or silently enable an entire BU policy. Immutable snapshot/hash checks reject changed or invalid values. A current approved BU accounting policy remains valid for its established scope.

Retries, changed request notes and another reviewer opening the same payment reuse its pending review. Rejected/superseded policy requests remain in history. New valid approval can resolve the current dependency without deleting old requests. Correction and reversal controls remain mandatory for verified/posted financial changes.

## Tasks, notifications and email

Every pending request created through the shared approval mechanism gets one system-managed review task linked to its full protected approval/source detail. Ownership follows the next eligible approval stage. All eligible reviewers receive the existing in-app approval notification; the first eligible reviewer owns the single task. Any eligible approver can decide using the established approval permissions. The task completes with the accepted outcome, waits for changes or exposes an execution problem. It cannot be manually completed as a substitute for approval.

Existing pending requests receive missing review tasks on startup using current eligible reviewers. No reviewer is invented if configuration is incomplete. The approval rules must name an eligible independent reviewer; financial verification remains unavailable until the dependency is resolved.

Important approval notifications include exact record/BU deep links. High/urgent/critical task assignment and priority escalation qualify for the important-task email setting. Routine payment success remains in-app. Email retains encrypted SMTP, global opt-in, per-category settings, delivery logs and event deduplication. Current tests exercise email classification/rendering/deduplication with an isolated delivery spy; no real SMTP recipient is contacted.

## Native account statements

Finance is the authoritative real-money movement source for the selected company account. Account detail/statement and overview now expose native inflows, outflows and net movement separately from KRW recorded/posted values. Statement rows and PDFs identify original currency/amount. Records with unmapped native currency are counted for review instead of being guessed.

Foreign opening balances are not inferred from a KRW opening value. A native movement total is not labelled as bank-confirmed available funds. Existing posted GL values and bank reconciliation remain separate.

## Protected behavior

The simplified Pink Salt forms, one necessary rate per conversion, all permitted active source accounts, cash reference exception, receipt requirements, original-reference correction reuse, cost identity/locks, category placement, stale-data guards and direct routing are preserved. Native Excavator mutation handlers and shared monetary Finance SQL/calculation remain unchanged; only approval-link hooks and shared verification/posting guards are added. No production database, uploads or Render disk were accessed, reset or replaced.

Pending approval HTTP responses are buffered until the surrounding settlement transaction commits. This fixes a response/commit race in the older approval path: a client must not receive an approval ID before its request, task and notification are durable. Separate bank-debit fees are included explicitly in the review and keep their own real Finance movement.
