# V30.56.5 — Accounting Financing Finalization Continuation (STAGING ONLY)

Protected source baseline: V30.56.4. Additive schema only. No database reset; no uploads removal; no synthetic Finance entries or bank movements.

## Implemented in this continuation
- Controlled lease commencement proposal (debit approved lease asset, credit approved lease liability); exact equal measurement only. Must be approved in Accounting Posting Control.
- Policy-referenced monthly lease depreciation proposal, capped by recognized opening amount, with unique agreement/month and posted-commencement prerequisite.
- Refundable lease deposit recognition by cash-neutral reclassification of a single existing verified/posted Finance payment; amount, BU and company account must match.
- Existing historical opening/migration liability journal linking without creating another cash movement or another journal; one-to-one journal/agreement uniqueness.
- Agreement-specific source-linked liability reconstruction, reported separately from any certified shared-GL balance; explicit unresolved flag and posted-journal status.
- UI forms and account selectors with bilingual labels, protected confirmations; original Finance/journal drill-down and Posting Control retained.
- Posting-time source revalidation for lease commencement, depreciation and deposit reclassification.

## Still incomplete: do NOT call this a production-ready final V30.56 release
1. Full foreign-currency financing and FX realization/revaluation across receipts, principal carrying values, GL and closing periods. Existing KRW-only gate remains deliberately in place.
2. Complex lease measurement (unequal initial asset/liability, initial direct costs, lease modifications, end-of-lease termination/disposal) remains accountant-controlled manual workflow rather than an automated module.
3. Official server-generated bilingual financing PDF; current browser Print/Save PDF and CSV remain.
4. Certified agreement-specific GL reconciliation inclusive of other source/manual adjustments and shared liability accounts; source-linked reconciliation is available but not certified.
5. Authenticated, multi-user browser/Render persistent-database regression and correction/reversal approval testing requires staging backup of actual database.

## Release status
This is an incremental staging artifact and progress checkpoint, **not** the final completed scope. Do not merge into production until the outstanding financial workflows and live QA are closed. Test on a copy of Render persistent DB; no reset.
