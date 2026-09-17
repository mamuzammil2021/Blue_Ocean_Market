# Blue Ocean Market V30.30.0 Implementation Summary

## Baseline and purpose

V30.30.0 is built directly on V30.29.0. It is a targeted finance-traceability, smart-account-routing, Pakistan Resale credit-control and statement-PDF quality release. All V30.29 workflow UX, Finance Verification, combined buyer advance + new payment, Pakistan Resale checkbox allocation, Accounting Posting Control and Render persistent-storage safeguards remain authoritative.

## 1. Receiver / payee account traceability for outgoing money

- Added reusable counterparty payment accounts for Excavator Suppliers and Buyers, with support for Bank/Card/Wallet-style destination metadata.
- Supplier and Buyer workspaces expose Payment Accounts management so destination details can be reused rather than retyped for every payment.
- Bank/Card/Cheque/Wallet outgoing payments now capture the receiver/payee destination as well as the Company Financial Account used as `Paid From`.
- Purchase payments validate that the selected receiver account belongs to the machine supplier.
- Korea Buyer Advance refunds now also require/record `Paid From` and `Paid To` for electronic refunds, including approval-delayed execution.
- Manual outgoing Finance entries and machine-cost electronic payments require destination/payee details when no saved entity account is available.
- Finance records preserve immutable receiver-account snapshots (label, bank/institution, country, currency and masked account identifier). Editing a supplier/buyer account later does not rewrite historical Finance records.
- Finance Verification now exposes `Paid To` alongside the existing `Paid From` / `Received Into` traceability.

## 2. Smart Company Financial Account routing

- Company-account option loading now understands account country, currency and cash direction (`receipt` / `payment`) in addition to BU, permissions, status and method.
- Pakistan Resale receipts/refunds are constrained to active Pakistan PKR Bank accounts.
- Normal Korea-side Excavator buyer receipts, supplier purchase payments and machine-cost cashflow are constrained to eligible South Korea Company Financial Accounts; KRW is enforced where the workflow is KRW-native.
- UI filtering and backend validation use the same jurisdiction rules so an ineligible foreign account cannot be submitted manually.
- Inter-country movement remains a dedicated transfer workflow rather than an ordinary receipt/payment selector.

## 3. Country / purpose defaults

- Existing Company Financial Account `Default for Receipts` / `Default for Payments` behavior is now scoped by BU and account country.
- Saving a new default clears the competing default for the same BU + country + direction, allowing a Korea default and a Pakistan default to coexist.
- Smart option loading preselects the eligible default without changing historical transactions.

## 4. Pakistan Resale unallocated credit controls

Pakistan Resale unallocated credit remains separate from Korea Buyer Advance and can now be managed independently:

- **Allocate Credit** — applies already-received unallocated resale credit to selected machine resale-profit obligations. This creates allocations only and **does not create a second Finance receipt**.
- **Refund Credit** — returns available resale credit to the buyer. It requires an eligible Pakistan company account, buyer receiver account, reference/reason/evidence and creates one real outgoing Finance transaction.
- Refunds consume original resale-payment credit sources, preserving traceability back to the receipts that created the credit.
- The resale workspace exposes Total Received, Allocated, Refunded and Available/Unallocated Credit balances.

## 5. Pakistan Resale Credit + New Payment settlement

- Added a combined settlement workflow analogous to Sell Machine `Buyer Advance + New Payment`.
- User selects machine resale obligations, chooses how much existing resale credit to use and optionally records additional new PKR money.
- Existing resale credit is allocation-only and creates no Finance cash event.
- Only the additional new money creates one Finance receipt; any unconsumed new money remains unallocated resale credit.
- Review & Confirm explicitly distinguishes existing credit from new receipt impact.

## 6. Finance screen cleanup

- Removed the redundant bottom `Excavator / Revenue / Gross / Expenses / Net` card from Daily Finance.
- Profitability remains in Accounting / Reports / Dashboard rather than being mixed into the operational Finance transaction list.

## 7. Professional EN/KR statement PDFs

- Reworked the server statement PDF renderer for width-aware multiline cells rather than character-count squeezing.
- Description and Reference cells wrap to multiple lines and transaction row height expands to fit their content.
- Description receives more usable width; Debit/Credit/Balance remain stable, right-aligned numeric columns.
- Removed abnormal wide Latin letter spacing caused by sending mixed punctuation descriptions through the Korean CJK font path.
- English uses professional Helvetica-family rendering; Korean uses the available Korean CJK PDF font with correct glyph support.
- Known system-generated transaction descriptions are localized to Korean when KR is selected while genuine business data is preserved.
- Related HTML-to-PDF statement templates were hardened with normal letter spacing, multiline wrapping and sensible line-height.

## 8. Compatibility / migrations

- **No data reset is required.**
- V30.30 adds safe additive schema fields/tables for receiver-account snapshots and Pakistan resale pooled-credit refunds.
- Existing V30.29/V30.27 data is preserved. New migration code uses additive `CREATE TABLE IF NOT EXISTS` / column backfill behavior.
- One real money movement = one Finance record remains authoritative.
- Pakistan Resale accounting remains separate from Korea machine-sale profit accounting.
- Accounting Posting Control remains in Accounting only.
- Render persistent-disk paths, backups and protected reset safeguards are unchanged.

## QA release gate

- `npm run qa:current` — **PASS**
- `npm run qa:render` — **PASS**
- JavaScript/server syntax checks — **PASS**
- `npm run qa:runtime` — run after `npm ci` in the target Node 22 environment; `node_modules` is intentionally excluded from the Git-ready ZIP.
