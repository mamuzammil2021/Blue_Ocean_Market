# Blue Ocean Market V30.28.0 Implementation Summary

V30.28.0 is a focused QA, Finance/Accounting data-integrity and workflow-context release built on V30.27.0. It preserves the Pakistan Resales architecture, Accounting-only Posting Control, Finance Integrity Rule, protected development reset and Render persistent-storage behavior.

## Buyer / Pakistan Resales UI

- Buyer Detail now keeps exactly one **Pakistan Resales** entry point for Pakistani buyers. Legacy enhancement passes are deduplicated defensively.
- Editing an existing buyer from Buyer Detail now closes the edit dialog, refreshes the data, and returns to the same Buyer Detail workflow instead of the Buyers list.

## Finance navigation and counters

- Finance sidebar action count is Finance-only. Accounting Posting Control counts remain exclusively on the Accounting badge.
- Removed the redundant **Daily Finance / Transactions & Evidence · Corrections · Pending Review / Accounts & Reports** guide card while retaining the main page title, KPIs, filters/tabs and Finance records.
- Existing post-mutation refresh infrastructure remains active so current views, action counters and notifications reload after successful writes when no form is dirty.

## Accounting visibility and reconciliation

Accounting remains the official posted ledger. V30.28 makes the distinction between posted and operational data explicit instead of presenting a stale-looking single number.

- Revenue, Expenses, Profit, Assets, Liabilities and Equity remain based on **Posted/Reversed official journals**.
- **Excavator Buyer Advances** and **Excavator Supplier Payable** now show live operational subledger balances with the corresponding Excavator-scoped **Posted GL** amount underneath.
- Added **Excavator Machine Inventory / Capitalized Costs** for unsold Excavator machines, with an Excavator-scoped Posted GL comparison.
- Added **Pending Accounting** and **Finance Awaiting Verification** cards.
- Supplier Payable operational balance is calculated from machine purchase price less valid paid Purchase payments, so a fully paid supplier balance becomes zero immediately in the operational subledger.
- Buyer Advances operational balance is calculated from active buyer receipts less active allocations and refunds.
- Pre-sale Excavator purchase/logistics/repair/parts/eligible costs remain capitalized in Excavator Inventory. On completed sale, the existing accounting engine moves the eligible machine cost to Excavator COGS.
- Differences between operational and posted balances are shown as posting/reconciliation pending rather than silently mixing the two accounting bases.

## Excavator QA refinements

- On Machines / Deals, Sold / Completed cards no longer expose **+ Cost**, **Update Sale**, or **Payments**. Open Machine and Documents remain available.
- Sell Machine retains required-field highlighting, and V30.28 reinforces clearing of the field error state immediately after valid input/change.
- Phone country-code selectors gain a search box that filters by country name, ISO code or dialing code such as `Pakistan`, `PK`, `+92`, `South Korea`, or `+82`.

## Statement PDF formatting

- Statement transaction descriptions now use controlled word wrapping and dynamic row height.
- Machine/context detail is wrapped beneath the main description instead of being scattered or hard-truncated across the row.
- Existing bilingual PDF structure, balances and period/profile summaries are preserved.

## Release QA

Release verification:

- `npm run qa:current` — **PASS**
- `npm run qa:render` — **PASS**
- `npm run qa:runtime` — target-environment check required. A clean `npm ci` could not resolve `registry.npmjs.org` in this build container, so runtime smoke is not claimed here. Run it after dependency installation in the supported Node 22 environment.
