# V30.69.26 — Financial reconciliation

All figures below come from isolated server/SQLite fixtures, not production. Source: qa/evidence/36926-recipient.json and 36926-recipient-browser.json.

| Scenario | Actual company movement | Recipient | KRW recognition | Fees | Realized FX difference |
| --- | --- | --- | --- | --- | --- |
| Server bank fixture | KRW 141,000 debit | USD 100 | KRW 130,000 | KRW 1,000 | KRW 10,000 loss proposal |
| Browser bank conversion | KRW 14,200 debit | USD 10 | KRW 13,000 | KRW 100 | KRW 1,100 loss proposal |
| Cash fixture | KRW 500 debit | KRW 500 | KRW 500 | 0 | 0 |

The bank proposal balances: recognition + fee + realized difference equals the single actual bank debit. Existing policy approval, Finance verification and Posting Control still determine posting eligibility; these calculations do not fabricate policy approval or final posting.

Every new typed-recipient cost creates one authoritative Finance movement, its linked FX transaction and operational cost. Payee and counterparty-account master counts do not increase. Recipient name/details and account data are per-payment snapshots; Finance stores the recipient name/provider/holder, currency and masked identifier. Leading account-number zeros are preserved in the protected transaction snapshot.

Repeated submissions with identical details reuse the existing movement. Reusing a key for changed recipient details is rejected. Missing fields, excessive text, incompatible recipient currency and injected operational-write failures leave no partial payment/Finance/request records.

Controlled corrections reverse/replace the exact linked money movement, retain the original recipient snapshot and track replacement Finance verification. A correction request remains Resubmitted until Finance acceptance. Authorized reversal retains both recipient and audit history. Cash strips stale bank fields. Existing source-account selection, permissions, fee movements, noncash allocation and posting/reversal controls are retained and covered by the broader regression gate.

The upgrade suite starts protected V30.69.25, records a historical registered-recipient cost, upgrades that same disposable database and restarts V30.69.26. Existing transaction/cost/Finance fields and Chart of Accounts IDs/codes are unchanged; a new typed-recipient payment survives restart without another master or cash record. Historical bank numbers are not silently taken from a changed master account.
