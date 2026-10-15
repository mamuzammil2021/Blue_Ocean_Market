# Stored financial reconciliation evidence

`qa/evidence/36925-extended.json` includes actual stored synthetic transaction IDs, exact company account IDs/native currencies/debits, invoice/recipient amounts, KRW allocations, fee/FX differences, linked Finance records, correction links/statuses and debit/credit totals of journal proposals. Every listed journal is balanced; Finance verification and controlled posting eligibility are tested separately in the release gate.

| Scenario | Expected and stored behavior |
|---|---|
| KRW third-party cost | KRW 2,000 actual debit; one authoritative Finance movement; unchanged supplier purchase obligation; separate cost payee and landed-cost allocation. |
| Currency conversion cost | Supplier/recipient USD 10, company debit KRW 14,000, carrying settlement KRW 13,000 and FX difference KRW 1,000. One company debit/Finance record, not another cash entry for recipient settlement. |
| Separately evidenced bank fee | Master debit KRW 1,000 plus distinct fee debit KRW 100. Each real movement has its own exact account/reference/Finance notification. |
| Fee correction | Atomic replacement retains master KRW 1,000 and corrects fee to KRW 120; original rows are voided with audit/history, leaving exactly two active real movements. The original correction task follows the replacement fee until Finance accepts it. |
| Cost reversal | Controlled reversal voids the original cash movement and restores unreceived inventory landed valuation by KRW 13,000. Received-cost changes remain subject to valuation-adjustment control. |
| Posted correction | Original posted journal is preserved; a balanced reversal proposal is created; replacement posting remains ineligible while its linked reversal awaits posting. |
| Advance allocation | Existing supplier/customer advance settles an obligation without a new Finance cash movement. Partial/combined/full settlement, refunds and reversals are covered by the existing workflow matrix. |
| Failed mutation and replay | Invalid conversion/correction or injected transaction failure rolls back related financial effects. Same-key replay creates no new debit; changed evidence is rejected and unused uploaded duplicates are cleaned. |

Bank-fee and realized-FX policy approval is never fabricated. Where policy is not approved, journals remain controlled pending proposals. No original bank/account snapshot is directly rewritten by generic Finance editing.

Additional exact statement evidence reconciles KRW 1,400,000 obligations, KRW 5,000 advance, KRW 2,000 direct payment and KRW 500 refund to KRW 1,393,500 closing. Reversing the direct payment restores KRW 1,395,500 while preserving audit history. Date-range opening and non-cash allocation entries are checked independently.
