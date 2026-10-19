# Financial reconciliation — V30.69.31

All examples below use synthetic records in isolated databases served by the real application. No production or bank data was used.

| Exercised transaction | Stored source and settlement | Finance and Accounting result |
|---|---|---|
| Existing USD 100 obligation, carrying rate 1 USD = 1,300 KRW; bank rate 1 USD = 1,400 KRW; included fee 1,000 KRW | Exact KRW bank debit 141,000; USD invoice allocation 100; carrying allocation 130,000 KRW | One Finance outflow; balanced proposal: payable 130,000 + FX loss 10,000 + fee 1,000 = bank credit 141,000 KRW |
| New USD 100 cost from KRW account, same payment rate 1,400 and 1,000 KRW fee | Cost equivalent 140,000 KRW; exact debit 141,000 KRW | One entered bank rate; no duplicate accounting-rate entry; one linked Finance movement |
| KRW 14,000 obligation paid from USD account | Actual debit USD 10; invoice settlement KRW 14,000; derived USD/KRW equivalent 1,400 | One source-currency Finance debit and balanced proposal |
| USD 10 advance from PKR account, 1 USD = 300 PKR and 1 USD = 1,400 KRW | PKR debit 3,000; KRW equivalent 14,000 | Two genuinely distinct entered pairs; derived PKR/KRW equivalent; one Finance movement |
| Supplier Advance Only | Existing credit allocated to obligation | No new Finance cash movement |
| Both (advance plus new payment) | Allocation and remaining bank amount recorded atomically | Only the new bank amount creates Finance cash movement |
| Separate real bank charge | Main payment and separate fee have linked identities | One movement for the payment and one for the actual separate charge; reversal includes both |
| Original-reference correction | Same logical payment, immutable original/replacement linkage, original snapshots/evidence/history retained | One active authoritative movement; previous Finance versions voided/reversed, controlled Accounting reversal/reposting where required |
| Reference rejection / injected late failure | No committed payment, allocation, source cost, attachment row, request receipt or landed-allocation change | Transaction rolls back; retry is checked and creates one movement |
| Concurrent same-key submissions | Identical payload returns the same transaction/result; changed payload rejected | One actual source record and Finance movement, including the legacy cost API |

Sources: qa/evidence/36920-fx-integration.json, 36920-workflows.json, 36925-extended.json, 36930-shared-rate-server.json and 36931-reference-server.json. The current aggregate lists which suites were actually rerun on this source.

Finance verification, approved policy and posting eligibility are exercised before a journal may post. Policy-dependent entries and posted reversal controls remain pending proposals when required; no unapproved policy was inferred. Journal/proposal debit and credit balance is checked by the server suites. Account-currency balances and company account IDs are asserted in the financial matrix.

The total number of historical Finance rows is not used as a count of active bank movements: corrections retain immutable history. Non-cash advance allocations are counted separately. No fabricated second receipt or supplier payment is created.
