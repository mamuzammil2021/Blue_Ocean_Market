# V30.69.12 — Pink Salt Import Company Accounts: staging candidate

Source baseline: V30.69.11.

## Root cause and scope
The V30.69.4 Pink Salt account loader hard-coded `country=South Korea` for all non-cash methods, causing legitimate PKR bank accounts registered in Pakistan to be excluded by `/api/v320/financial-accounts/options`. Removed this client-only geographic restriction. The server remains authoritative for active account status, business-unit scoping, account type and currency compatibility. This does **not** permit paying PKR from a KRW-only account; changing currencies may be necessary, with applicable FX review.

The loader now differentiates an API error from a successful response containing no matching accounts and includes EN/KR messages. The modified browser asset's query-string version is bumped to prevent stale caching.

## Automated verification
`node qa/qa_v306912_import_company_accounts.js` — six mock-backed loader assertions (PKR/ KRW Bank, PKR Cash, business-unit scope, removal of hard-coded country, error feedback). `node --check public/v3694-pink-qa.js` passes.

## Pending staging acceptance
No authenticated browser session with the user's Render accounts/data is available here, so no actual posting or real database verification was performed. On staging, verify Cash and Bank for KRW and PKR, account BU accessibility, no incompatible currency accounts, actual advance+new-payment settlement and Finance/Accounting entry IDs. Verify that the current user has account access; an empty list after correction may still reflect a legitimate currency or BU mismatch.

## Safety
No database migration or finance-posting logic changed. Do not overwrite or reset Render persistent disk.
