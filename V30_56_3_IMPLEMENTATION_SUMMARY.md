# V30.56.3 — Accounting Financing Continuation (STAGING)

Base: V30.56.2. Preserves V30.54 historical Finance integrity and V30.55 Cash & Banks. Uses additive SQLite tables; no DB reset or upload deletion.

## Implemented in this continuation
- Existing verified KRW financing disbursement may be linked one-to-one to an agreement, same BU/account/amount and **matching exact agreement reference**. Reject unrelated operational-source receipts, foreign currency, invalid or duplicate links. Never manufactures a Finance receipt.
- Authorized accounting adjustment can prepare a *cash-neutral*, source-linked financing funding reclassification ONLY if original receipt journal was Posted as one bank debit plus one revenue credit. Proposed journal debits original revenue and credits loan liability. Any other classification or complex posting is blocked for manual controlled review.
- Posting Control rechecks source eligibility, original journal, maker/checker and duplicate final posting. Original Finance evidence is exposed to reviewer. No additional bank entry in financing reclassifications.
- Financing account selector includes active flag (fixes previously empty liability/interest/fee selectors).
- Account-specific operational financing statement endpoint and downloadable CSV (repayment IDs, journal refs, schedule and balances); explicit disclosure that this is not a bank-confirmed or official posted GL statement.
- Estimated installment schedule shows matched principal/interest, partial/overdue/paid flags and remaining due. Actual repayment remains a single verified Finance movement; allocation is not a second payment.
- Source journal links, six-section accounting nav and previously implemented Cash & Banks views retained.

## Not represented as complete
- Lease right-of-use asset/liability recognition, variable-rate/recast, lender-approved prepayment restructuring, FX-denominated finance, automatic end-to-end loan creation/disbursement, final historical opening-balance migration, authoritative loan liability vs GL reconciliation and PDF financing statements. Existing loan opening register is operational and requires separate official GL signoff.
- Extensive Chart of Accounts, cost/asset/tax accounting and full report/migration catalogue remain V30.57/V30.58 roadmap.
- The already correctly-classified/complex receipt journal requires controlled Accounting review; reclassification must not manufacture new cash or blindly reverse legitimate income.

## QA
- V30.56.3 static/mock financing checks, V30.56.2 financing integration, adapted legacy V30.56 workspace/financing QA and V30.54 SQLite mirror fixture passed.
- Original historic QA test files retain old exact version/route assertions; compatibility copies adapt these assertions, not business behavior. Browser testing and authenticated, real existing-database posting/reversal runs NOT performed: do not merge into production until staging acceptance.
