# Blue Ocean Market V28.4.0

## Global duplicate-submission protection
- Added browser-side in-flight request deduplication for POST, PUT, PATCH and DELETE actions.
- Every outgoing mutation receives an idempotency key.
- Added server-side idempotency storage/replay so retries do not commit the same action twice.
- Added short-window semantic duplicate protection for Buyer creation as an additional safety net.
- Protection applies across all business units and transactional modules, including Finance, Buyers, Suppliers, POS, payments, purchases, sales, stock, tasks, approvals and future routes registered through the shared Express application.

## Financial statement engine
- Added reusable bank-style statements with date filters, opening balance, debit, credit, running balance and closing balance.
- Added Finance statement with PDF download.
- Added Buyer statement with Buyer profile summary, payments, allocations, refunds and available advance.
- Added Supplier statement with Supplier profile summary, machine purchases, payments and outstanding payable.
- Statement PDFs support Korean and English output.

## Pakistan Resale Profit Share
- Added dedicated Pakistan Resale Profit Share statement and PDF.
- Added totals for machines with resale records, company share, received and outstanding.
- Added machine-level original sale price, Pakistan resale price, manual profit, company share, received, outstanding and status display.
- Sold-machine rows now show whether resale information has been recorded and the current share status.
- A sold machine with an existing resale record is removed from the Add Resale Record selector.
- Server/database protection prevents more than one resale-share record for the same Buyer + machine/deal.
- Backend validates that the selected machine was actually sold to that Buyer.

## Data and compatibility
- V28.4 is additive and does not reset or wash the development database.
- The complete verified V28.3 server/client remains intact underneath the V28.4 extension layer.
- Existing approval execution, CEO direct authorization, Finance correction, evidence and bilingual behavior are preserved.
