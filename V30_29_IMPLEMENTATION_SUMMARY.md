# Blue Ocean Market V30.29.0 Implementation Summary

## Baseline

V30.29.0 is built directly on V30.28.0. It is a targeted live-QA release focused on workflow clarity, responsive Buyer/Supplier workspaces, Finance verification traceability, combined sale settlement and Pakistan resale-payment allocation. Existing accounting, approval, country-account and persistence safeguards remain authoritative.

## 1. Buyer / Supplier responsive workspaces

- Buyer and Supplier tables use fixed available width, wrap long values and keep the Actions area reachable.
- Search + Add controls are grouped at the right on normal desktop/laptop layouts.
- Mobile/narrow layouts may stack rows instead of requiring horizontal table scrolling.
- Supplier rows now expose `Open | Edit | Delete`; Machines and Requirements live inside Open.
- Supplier Open is a full-screen workspace with Overview, Machines, Requirements and Payments / Account. It uses Back navigation rather than a modal-style Close X.
- Supplier payment KPIs and recent payments are derived from the existing supplier statement/purchase/payment data.

## 2. Phone country-code input

V30.29 converts the earlier two-control country search into one visible searchable country-code control next to the phone number. The underlying canonical country code remains synchronized so existing forms/backend contracts are preserved.

## 3. Sell Machine — Buyer Advance + New Payment

The active V30.26 sale route now accepts `advance_plus_new`. The workflow allocates the requested buyer advance first, then records only the required new receipt. If the new receipt exceeds the remaining sale amount, the excess remains buyer advance/credit under the existing credit rules. A combined settlement therefore does not duplicate money already received as advance.

Client Review & Confirm presents the advance used, additional new receipt and resulting settlement before commit. Backend settlement checks remain authoritative.

## 4. Accounting Posting Queue clarity

Posting Queue now exposes a source/transaction amount independently of the balanced journal totals. For machine sale review, the UI separates Sale Amount, Machine Cost / COGS, Gross Profit, Journal Debit Total and Journal Credit Total so a balanced double-entry total cannot be mistaken for the sale price.

## 5. Finance Verification financial-account traceability

Finance detail now returns the linked configured Company Financial Account. Finance Verification shows `Received Into` for incoming money and `Paid From` for outgoing money, including safe account metadata such as account name/type, institution, country, currency and masked number where available. This gives reviewers the context required to verify the actual account used before Accounting posting.

## 6. Finance sidebar badge

The sidebar count is restricted to Finance-actionable cash/manual/transfer records in pending verification/correction states. Accounting Posting Control and hidden/non-cash operational mirrors no longer inflate the Finance badge. Zero actionable Finance work produces no badge.

## 7. Statement modal refresh

Buyer/Supplier Statement date Apply fetches the selected period and refreshes the existing open modal in place. It no longer opens a new statement modal on each Apply.

## 8. Pakistan Resales Buyer action

V30.29 adds a final hard-deduplication layer for the Pakistan Resales action on Buyer Detail to protect against repeated async enhancers. Eligible buyers show one Pakistan Resales button.

## 9. Pakistan Resale Profit Payment allocation

The standard allocation UI uses selectable machine/resale obligations instead of requiring manual amount entry for every row. Selected obligations are allocated automatically up to their outstanding amount; any receipt remainder becomes Pakistan resale unallocated credit. The receipt remains one Finance event with child allocations.

The protected Review & Confirm flow validates the form and shows payment/account/reference/evidence, allocation and unallocated-credit impact before submitting the multipart payment request.

## 10. Compatibility / protection

- No business-data reset is required.
- V30.29 is schema-preserving relative to V30.28.0.
- V30.28 operational-vs-posted Accounting visibility is retained.
- V30.27 Pakistan Resales remain separate from Korea machine-trading profit/accounting.
- Bank Country / Account Country restrictions remain authoritative.
- One real receipt = one Finance record remains authoritative.
- Accounting Posting Control remains in Accounting, not Finance navigation.
- Render persistent-disk paths and protected reset safeguards remain unchanged.

## QA

- `npm run qa:current` — PASS
- `npm run qa:render` — PASS
- Runtime smoke should be run with `npm ci && npm run qa:runtime` in the target Node 22 environment because `node_modules` is excluded from the release ZIP.
