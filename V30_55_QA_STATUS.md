# V30.55 QA status

## Source-level
- `node --check` for changed JS, `npm run qa:v355`, gzip equality and release ZIP integrity are required by packaging.
- No test asserts that actual Render balances have been verified.

## Staging acceptance
1. Back up Render persistent SQLite database and uploads; use staging copy.
2. Verify account balances, statement running balances, posted GL and reconciliation against actual transaction/journal IDs for token + balance purchase and advance + new sale receipt.
3. Verify posted/unposted distinction, voids/reversals, shared GL mapping and company-scoped account visibility under CEO and BU roles.
4. Test simple/advanced open action after reload, statement date changes, PDF and CSV, no duplicate toasts/spinners.
5. Check bank statement unmatched/matched counts; do not equate absence of unmatched lines with actual bank reconciliation completion.
6. Run complete previous release QA and V30.54 integrity regression on backup data; two Render restarts without creating Finance records.

## Executed source checks
- V30.55 dedicated static checks: **13 passed**.
- V30.54 finance integrity source + executable SQLite fixture: **28 passed**, with release-version assertions rebased in a disposable test copy to V30.55.0 (original historical test preserved).
- V30.53 broad static regression: **156 passed**, same temporary version-assertion rebasing (original historical test preserved).
- Changed JavaScript syntax checks passed.
- Historical QA scripts contain exact V30.54.0 release-identity assertions and are not runnable unchanged against V30.55.0. The disposable copies above change only those historical version expectations. No live authenticated Render or actual database run was performed.
