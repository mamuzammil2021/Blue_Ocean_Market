# Synthetic stored financial evidence

Actual authenticated API transactions on a disposable SQLite database; rows below come from qa/evidence/36930-shared-rate-server.json. Amounts were asserted against stored transactions and linked Finance rows. No production data was used.

| ID | Workflow | Company currency | Actual company movement | Invoice currency | KRW carrying rate | Allocation KRW | Fee KRW | FX difference KRW | Finance ID |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | import_cost | KRW | 141000 | USD | 1400 | 140000 | 1000 | 0 | 1 |
| 2 | supplier_advance | KRW | 140000 | USD | 1400 | 140000 | 0 | 0 | 2 |
| 3 | import | KRW | 141000 | USD | 1300 | 130000 | 1000 | 10000 | 3 |
| 4 | import | USD | 10 | KRW | 1 | 14000 | 0 | 0 | 4 |
| 5 | import_cost | USD | 10 | USD | 1350 | 13500 | 0 | 0 | 5 |
| 6 | supplier_advance | PKR | 3000 | USD | 1400 | 14000 | 0 | 0 | 6 |
| 8 | import_cost | KRW | 141000 | USD | 1300 | 130000 | 1000 | 10000 | 8 |
| 9 | supplier_refund | KRW | 14000 | USD | 1400 | 14000 | 0 | 0 | 9 |

New USD costs/supplier advances paid from KRW derive the carrying equivalent from the one entered rate. Existing supplier invoices retain original recognition rates, so settlement differences remain visible. Three-currency cases use two distinct input pairs and derive the remaining equivalent. Legacy independent-rate corrections preserve their original bases and metadata.

Every exercised transaction proposal balanced to within KRW 0.01. Each actual payment had one linked Finance payment row. Invalid conflicting shared rates were rejected with no additional Finance row. Historical replaced rows and original bank snapshots remain in audit history. Separate bank-charge transactions and non-cash advances retain the existing tested policies.

These checks verify stored proposals and source effects; they do not assert that every policy-dependent proposal is automatically eligible for final Accounting posting. Approved policy, Finance verification and Posting Control remain required.
