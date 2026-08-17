# Blue Ocean Market V25.1

## Sell Machine payment-date and mandatory-field fix
- Fixed the root cause of the Sell Machine “Payment Date is required” error: the form did not actually contain a payment_date field.
- Added mandatory Payment Date, Payment Reference, Payment Method, Customer/Buyer and Shipping/Reference fields.
- Added optional Notes and Sell Note only.
- Export sales require Destination Country; Other Country allows manual country entry.
- Sale PDF is generated automatically by the backend and stored in Documents.
- Sale remains 100% advance with no separate sale-payment completion condition.
- Selling remains blocked until the machine purchase price is fully paid.
