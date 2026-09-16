# Blue Ocean Market V30.27.0 Implementation Summary

## Release focus

V30.27.0 adds a controlled Pakistan Resales subledger for Pakistani Excavator buyers, separates resale facts from cash settlement, restricts resale receipts to configured Pakistan bank accounts, and adds a separate Pakistan-to-Korea inter-account transfer workflow without mixing Pakistan resale profit with Korea machine-trading profit.

## Pakistani buyer → Pakistan Resales

- Pakistani Buyer Details now exposes a dedicated **Pakistan Resales** workflow page.
- Legacy inline resale-profit cards are removed from the normal Buyer Details presentation for Pakistani buyers.
- The resale page shows Total Share Due, Received / Allocated, Outstanding, Unallocated Resale Credit, Resold Machines and Settled Machines.
- Each machine has one resale record with resale date, resale price PKR, resale profit PKR, Our Share %, auto-calculated Our Share Amount PKR, notes and optional resale evidence.
- `Our Share Amount = Resale Profit × Our Share % ÷ 100` is recalculated client-side for user review and recalculated again server-side as the authoritative value.
- Payment/receipt fields are not part of the Add/Edit Pakistan Resale form.
- Settlement status is derived from active payment allocations (Share Due / Partially Received / Settled / Voided), not manually marked received.

## Resale Profit Payments / Settlements

- A resale-profit receipt is one payment entity, never one row per allocation.
- One receipt can allocate to one or many machine resale records.
- Supports partial settlement, multiple receipts against one resale record, and unallocated resale credit when the receipt exceeds current allocations.
- Reallocation reverses prior allocation rows for audit and creates new active allocation rows; it does not overwrite the original payment.
- Refund of unallocated resale credit is a separate real Finance transaction and does not delete the original buyer receipt.
- Voiding a payment preserves history and reverses active allocations and linked Finance/Accounting effects.
- Receipt/evidence is mandatory for new resale-profit payments.

## Country-scoped Company Financial Accounts

- Company Bank Accounts now require **Bank Country / Account Country**.
- Country is stored separately from account currency and appears in Add/Edit/Review/account cards/history metadata.
- Financial-account option APIs support country filtering.
- Pakistan resale-profit receipts and refunds accept only active configured Bank accounts where Account Country = Pakistan and Currency = PKR.
- Korea destination accounts for this transfer workflow must be active Bank accounts where Account Country = South Korea and Currency = KRW.
- Existing Bank accounts without Account Country remain visible for maintenance but are not eligible for country-restricted Pakistan Resales workflows until updated.

## Pakistan → Korea bank transfer

- Moving resale funds from Pakistan to Korea is a dedicated inter-account transfer, not another buyer payment and not new income.
- Transfer records capture Pakistan source account, Korea destination account, PKR source amount, FX rate, actual KRW destination amount, PKR/KRW bank fee, transfer date, reference, evidence and notes.
- Transfer is a Finance-reviewable source and proceeds through Accounting Posting Control.
- Voiding a transfer creates controlled reversal history rather than deleting it.

## Accounting separation

Dedicated GL mappings are added for:

- Pakistan Resale Profit Share Receivable
- Pakistan Resale Unallocated Credit
- Pakistan Resale Profit Share Income
- Foreign Exchange Gain
- Foreign Exchange Loss

Pakistan resale receipts post allocated value to **Pakistan Resale Profit Share Income** and excess to **Pakistan Resale Unallocated Credit**. They never post to Excavator Sales Revenue. Pakistan-to-Korea transfers move balances between configured bank GL accounts only; bank fees and FX gain/loss are recognized separately. A transfer never reclassifies Pakistan resale profit as Korea machine-trading profit.

## Finance / Accounting integrity

- Pakistan resale receipt: one real receipt = one Finance record, with child resale allocations.
- Pakistan resale refund: one real outgoing refund = one Finance record.
- Pakistan → Korea transfer is shown in Finance for verification even though net company cash effect is zero.
- Verified Finance records continue to flow to **Accounting → Posting Control → Official Ledger**.
- Reallocation of a resale receipt resets Finance verification so the resulting Accounting proposal can be safely regenerated.

## Compatibility

- Existing legacy Pakistan resale records are retained.
- Legacy received amounts are migrated into legacy payment/allocation history without inventing a bank account or fake Finance receipt.
- Legacy `amount_received_pkr`, `outstanding_pkr` and received status are synchronized from the new active allocation subledger so older statements remain compatible.
- All V30.26.4 reset, Finance/Accounting, sale/payment, persistent-disk and Git/Render safeguards are preserved.
