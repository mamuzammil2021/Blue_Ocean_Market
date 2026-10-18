# V30.69.29 October 15 QA corrections

Built directly from the exact protected V30.69.28 ZIP. Verified SHA256: `c81c14b9818a548c60dfca9814dbf5c7d53482f6877c24fce2efd5c4c361989a`. Reviewed all text and all four embedded screenshots in QA POINTS 15 oct.docx.

## Cost locking and details

- Replace the two overlapping Pink Salt lock lookups with a shared read-only `costState` policy. Resolve the actual FX-linked Finance record as well as legacy cost-source links, including historical costs whose projection-link field is empty.
- Derive verification and posting locks from Finance and Accounting. Show the translated lock in FX-backed cost rows instead of returning early after inserting Open.
- Preserve legacy permitted edits before verification. Reject verified legacy direct edits/ordinary voids and keep immutable FX bank snapshots protected.
- Show a proper Import Cost detail page on the existing stable FX URL: category, notes, amount/currency, date/method, import, actual paying account/debit, typed payee/account, reference/evidence, verification/posting state and audit history. Same-currency costs omit irrelevant conversion and financial-leg summaries.
- Return authoritative action eligibility from the server. Correct & Resubmit requires an actual Open/Viewed assigned Finance correction and the original authorized creator. Resubmitted records wait for Finance acceptance; they do not immediately enable another correction.
- Edit Cost before verification uses the existing atomic reversal/replacement engine with an explicit amendment flag and audit linkage. Original snapshots and historical Finance rows remain intact; only the current active version affects cash.
- Retain controlled Correct Posted Cost for an authorized original CEO/Admin, with a linked reversal proposal and posting gates. No direct edit of a posted movement is introduced.

## Supplier payment simplicity

- Remove Bank quote / confirmation details and required quote reference, rate source and rate timestamp from outgoing import supplier payments, supplier advances, packaging supplier payments and supplier operational expenses. No historical stored values are deleted.
- Keep the essential FX pair/rate, actual source debit, recipient amount, fee math, accounting equivalent, overpayment controls, required evidence and non-cash advance allocation.
- Keep one Review & Confirm step for these supplier payments. The live recipient calculation stays estimated until the user confirms the actual amounts against attached evidence. Customer/refund and general import-cost quote policy is unchanged.
- Move the single form-wide alert immediately below the modal heading. Keep the cash-currency restriction and clear/update its alert when the method/account becomes compatible.
- Highlight missing/invalid fields, open collapsed fee sections and focus/scroll to the first error while preserving values. Clear field errors when corrected and hide errors for inactive fields.
- Preserve shared root processing protection, duplicate-submit guards, targeted refresh and bilingual labels.

## Scope protection

No new database schema migration, financial backfill, database reset or production storage operation. Registry capabilities are additive/idempotent. The sole deep-route controller, route registry, application shell and Excavator native UI/money-mutation handlers are unchanged from V30.69.28. Existing financial history is retained.
