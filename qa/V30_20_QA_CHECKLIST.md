# V30.20.0 Local Test QA Checklist

## System Settings
- [ ] Open every System Settings section at desktop, laptop and mobile widths.
- [ ] Confirm section names do not merge with Policy/Technical badges.
- [ ] Confirm scope switching (Company / BU / User) remains functional.
- [ ] Confirm File & Attachment Settings shows only max size, max attachments/upload and allowed formats.

## Supplier / Buyer validation
- [ ] Add/Edit Supplier: invalid phone shows inline error before save.
- [ ] Add/Edit Supplier: invalid email shows inline error before save.
- [ ] Duplicate Supplier phone/email is identified in the field UI and blocked server-side.
- [ ] Repeat all four checks for Buyer.

## Company Financial Accounts
- [ ] Add two bank accounts (including same bank), two Cash accounts and two Company Cards.
- [ ] Verify Company-wide and BU-scoped filtering.
- [ ] Verify GL mapping requirement.
- [ ] Mark a Bank account cheque-enabled.
- [ ] Close/archive an account and confirm it disappears from new transaction choices but historical records remain.
- [ ] Verify used-account GL remap is restricted/audited.

## Smart payment forms
- [ ] Cash automatically shows only Cash accounts.
- [ ] Bank shows only Bank accounts.
- [ ] Card shows only Company Cards.
- [ ] Cheque shows only cheque-enabled Bank accounts.
- [ ] Confirm Card + Cash on Hand cannot be submitted.
- [ ] Confirm non-cash reference requirement.
- [ ] Configure at least two compatible Bank/Cash/Card accounts and verify the user can choose the exact one.
- [ ] Verify the exact selected account appears in the operational source, Finance and Accounting/posting path.
- [ ] Repeat exact-account checks for generic Sales/Purchases, MIMI POS, Excavator payments/cost/sale receipt and Pink Salt import/customer/supplier payment flows.
- [ ] Cash may omit a reference; non-cash methods must require a reference where applicable.

## Attachments
- [ ] File field displays allowed formats, max file size and max count.
- [ ] Oversize, too-many and disallowed-format files show inline errors.
- [ ] Valid files upload directly without compression/preview/readability workflow.
- [ ] Stored documents can still be opened/previewed/downloaded where supported.

## Regression
- [ ] Finance Posting Control, correction/void/view states remain functional.
- [ ] Accounting Simple View remains responsive.
- [ ] English/Korean preference persists.
- [ ] Excavator Supplier modal/chassis/Notes fixes remain functional.
