# Financial reconciliation evidence

All values below are synthetic test data, not production assertions. Source: `qa/evidence/36932-benchmark-before.json`, `36932-benchmark-after.json`, `36932-server.json`, `36932-upgrade.json`, and the current release aggregate.

## Reported arithmetic reproduction

| Basis / effect | Unchanged .31 with explicit valuation 1 | .32 with confirmed valuation 1,000 |
|---|---:|---:|
| Actual company debit | USD 49,950 | USD 49,950 |
| Invoice carrying allocation | KRW 49,950,000 | KRW 49,950,000 |
| Bank accounting equivalent | KRW 49,950 | KRW 49,950,000 |
| Calculated FX difference | KRW −49,900,050 (gain) | KRW 0 |
| Actual new Finance records | 1 | 1 |

A same-currency transfer ratio of 1 is separate from USD-to-KRW valuation. Current .32 refuses an unexplained foreign identity valuation. An actual evidenced foreign valuation of 1 needs an explicit explanation and approved accounting policy before posting. KRW valuation must be identity. Missing or inconsistent values block saving or posting; an FX balancing amount cannot make invalid inputs eligible.

## Configured native currencies, advance plus new payment

Each scenario applies an existing KRW 50 carrying advance plus one new native payment; advance application itself creates no Finance movement. Rates below are deliberately chosen test values, not market quotes.

| Source and recipient currency | New native debit | KRW valuation per native unit | New bank KRW value |
|---|---:|---:|---:|
| USD | 10 | 1,000 | 10,000 |
| PKR | 10 | 5 | 50 |
| KRW | 10 | 1 | 10 |
| EUR | 10 | 1,500 | 15,000 |
| JPY | 10 | 9 | 90 |
| CNY | 10 | 190 | 1,900 |

The server suite asserts exact native source account/currency/debit, KRW value, one new Finance movement, non-cash advance handling and valid posting eligibility after the required verification/policy checks. Existing matrix tests cover permitted KRW/foreign cross-currency routes, genuine rate differences, fees, source balances, reference reuse, refunds and rollback. Direct preview values are revalidated by the server.

Advance balances retain the existing KRW carrying policy. This build does not invent a new commercial denomination or historical revaluation policy. Original recognition and payment-date values stay distinct; only genuinely different pairs require separate rates.

## Cost correction

Customs KRW 2,000 → KRW 4,000 retains one operational cost ID/row and the original route/reference. Before/after operational snapshots, requester/reason, actor and times are retained. Financial replacement versions remain linked and the old active Finance effect is reversed; one current active movement remains. The changed record returns to Finance review, never silently verified. Lists/totals use the current operational projection.

An actual .31 synthetic posted cost was migrated. All original source/Finance/journal fields and CoA IDs/codes were compared unchanged. Authorized posted correction creates a linked pending reversal and corrected proposal. Final posting of the replacement is rejected until the old reversal is posted. Both controlled postings then succeed, with historical posted lines intact and one active Finance movement. Repeat startup preserves revisions and both valuations.

Read-only detection of incorrect historical mappings and an original-user **unposted** repair were also tested. Repair uses supplied evidence; no guessed rates or bulk SQL rewrite. Older voided operational rows are preserved as history, not erased.

## Other integrity checks

Allocated advances cannot be amended/voided merely because another advance could cover the pooled balance. Verified advances reject ordinary UI and direct API edits. Only uncommitted, dependency-free owned drafts are deletable. Legacy advance late-failure tests roll back both source and Finance changes; recorded void is audited. Import/receiving keyed retries and payload/evidence matching prevent duplicates. Receiving late Accounting failure rolls back stock/status/audit. Statements reconcile current payments, reversals, non-cash allocations and date ranges; CSV and PDF actually download.

Balanced totals alone are not accepted as correctness. Posting checks include valuation validity, native/Finance snapshot consistency, policy, verification/confirmation, journal matching and linked reversal status. Queue and detail show specific blockers separately from Finance verification.
