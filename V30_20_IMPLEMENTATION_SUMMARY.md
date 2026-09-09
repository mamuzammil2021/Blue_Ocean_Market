# V30.20.0 Implementation Summary

## 1. System Settings UX
The V30.19 administration functionality is retained but presented through a new V30.20 shell with grouped sections, separate Policy/Technical badges, responsive layouts, cleaner field spacing and clearer section actions. Company Financial Accounts and File & Attachment Settings use dedicated user-friendly panels rather than developer-style configuration grids.

## 2. Company Financial Accounts
`accounting_payment_accounts` is extended to support Bank, Cash, Card, Wallet and Other account types, card metadata, linked bank accounts, cheque enablement and archive metadata. Multiple accounts per company/BU are supported, including several accounts/cards at the same bank. Each account maps to Accounting GL and retains change history. Accounts with transaction history are closed/archived instead of destructively deleted.

## 3. Smart payment routing and exact-account persistence
Payment forms are enhanced centrally. The selected payment method controls eligible financial accounts: Cash → Cash, Bank → Bank, Card → Card and Cheque → cheque-enabled Bank. Internal credit/advance allocations do not force a cash account. The server independently rejects incompatible account/method combinations.

Where multiple compatible accounts exist, the user can choose the exact account/card/cash account used. That account ID is now preserved through the relevant operational source and Finance sync for core Sales/Purchases, MIMI POS, Excavator token/payments/sale receipts, Pink Salt import payments/costs, supplier advances/refunds and customer payments/refunds/settlements. Finance → Posting Control → Accounting therefore uses the selected account's GL mapping rather than a display-only dropdown. Legacy cash-movement sources that do not yet carry an explicit account can still resolve a compatible configured default safely.

## 4. Supplier / Buyer contact validation
Supplier and Buyer forms use immediate phone/email format validation plus debounced duplicate checks. Inline errors block submission. Existing server-side validation remains authoritative.

## 5. Direct attachments
V30.19 upload-time preview/compress/resize/readability selection is disabled in V30.20. File inputs display and validate allowed formats, maximum per-file size and maximum files per upload, then upload directly. The System Settings attachment panel exposes only these three user-facing upload rules. Existing stored-document Open/Preview and Download Original functionality remains.

## 6. Compatibility and QA
V30.20 is additive. Existing V30.19 System Settings, V30.18 Posting Control, V30.16 Access Control and prior BU workflows remain in place. No database reset and no Git operation are performed by this local-test build. The completed source/regression QA suite contains 240 passing checks. A dependency-backed runtime smoke test remains available as `npm run qa:runtime`; dependency installation could not be completed inside the build environment.
