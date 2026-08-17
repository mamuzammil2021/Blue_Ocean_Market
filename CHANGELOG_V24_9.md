# Blue Ocean Market V24.9

## Excavator payment fix
- Fixed Add Payment date validation mismatch: UI now submits `payment_date`, matching backend validation.
- Payment Date is mandatory.
- Reference is mandatory.
- Manual Status input removed.
- Payment receipt upload uses multipart FormData and is stored in Documents linked to the payment.
- Added client-side validation before submission.
- Removed Exported and Sold / Completed from manual Current Stage selection.
