# V30.38.0 Implementation Summary

## Release title
Pakistan Resale Sections · Account Edit/History · Buy Machine Account Integrity · Canonical Sell Machine Settlement · Collapsible Finance/Accounting Filters

## Baseline
Built directly on the protected V30.37.0 package supplied by the user. V30.37 profile sections, shared counterparty-account routing, responsive filter foundation, targeted refresh, stable UI chrome, pagination, Finance/Accounting integrity, permissions and Render persistent-storage behavior remain protected.

## 1. System-wide counterparty account management
- Extended the shared Buyer/Supplier receiver/payee account manager with **Edit / Update**, **Archive**, **Default** handling and **Account History**.
- Account edits require the existing **Review & Confirm** workflow; edit reason is required and recorded in account history/audit.
- Used accounts are never destructively deleted. Archive removes the account from new-payment selection while preserving historical references.
- Added `counterparty_payment_account_history` as a small additive audit/history table. It is created automatically with `CREATE TABLE IF NOT EXISTS`; there is no reset or destructive migration.
- Finance receiver snapshots remain immutable when an account master is edited later. Existing transactions keep the receiver name/label/bank/country/currency/masked account/method that applied when the transaction was recorded.
- Added Korean localization for the new account-management labels/actions and related messages.

## 2. Buy Machine token-payment account integrity
- Kept one company **Pay From** account and one supplier **Paid To** receiver account.
- Existing supplier receiver accounts refresh from the shared manager and prefer the active Default account.
- New Supplier flow can create the supplier receiver account inline; the new account defaults intelligently and remains linked to the supplier/purchase/token-payment workflow.
- Closing Add / Manage Accounts returns to the same Buy Machine parent state and refreshes the Paid To selector rather than reopening or replacing the transaction.
- Historical payment receiver snapshots remain protected from later account-master changes.

## 3. Pakistan Resales profile redesign
Pakistan Resales now uses one selected-section workspace rather than a long mixed page. The seven required sections are:

1. **Overview**
2. **Resale Records**
3. **Payments & Settlements**
4. **Credit**
5. **Refunds**
6. **Pakistan → Korea Bank Transfers**
7. **Documents**

- The selected section survives refreshes and child workflows.
- Existing Pakistan resale accounting separation remains intact: resale profit/share stays separate from Korea machine-sale profit.
- The transfer section explicitly remains a cash/bank movement workflow and does not create new Pakistan resale income.
- Existing resale payments, pooled credit, allocations, refunds and Pakistan→Korea transfers are reused rather than duplicated.
- Layout is responsive and mobile-safe.

## 4. Canonical Sell Machine settlement engine
- Added one shared settlement calculator shipped in `public/settlement-v338.js` and used by both the browser and the sale backend.
- Selling price, existing allocation, settlement mode, payment source, available advance, selected advance amount, payment amount, currency and FX now feed the same calculation.
- The browser updates dependent values immediately and the backend validates the same settlement state before commit.
- Dynamic summary includes Sale Price, Existing Allocated, Coverage Required, Buyer Advance Used, New Payment Required, New Payment Entered, Buyer Credit Added and Resulting Outstanding.
- Required-field validation changes with the selected settlement method and short/inconsistent settlement is blocked.
- Verified reference case: **₩15,000 sale + ₩10,000 buyer advance = ₩5,000 New Payment required**.
- Changing sale price immediately recalculates the required new payment; a short payment is invalidated consistently in UI/backend logic.

## 5. Finance / Accounting filters
- Finance and Accounting Posting Control now use a collapsible responsive filter body while preserving filter values across normal UI refreshes.
- **Accounting posting-status controls stay outside the collapsible filter body and remain visible** when filters are hidden.
- Existing search/date/status/type/evidence filter logic and pagination remain authoritative.
- Result-set filter changes continue to reset the relevant pager to page 1.
- Desktop/tablet/mobile responsive behavior remains aligned with the V30.37 shared filter shell.

## 6. Localization
- Added Korean translations for V30.38 account management, Pakistan Resale sections, filter controls and sale-settlement labels/messages.
- Dynamic settlement shortfall/additional-settlement messages include Korean pattern handling.

## Data / migration safety
- **Additive schema change only:** `counterparty_payment_account_history` table + index.
- **No destructive migration or reset.**
- Existing SQLite data, users, access rules, operational records, uploads, receipts/evidence, backups and Render persistent disk remain compatible.

## QA
- V30.38 requirement/static gate: **35/35 PASS**.
- V30.38 focused Chromium acceptance: **18/18 PASS**.
- Inherited V30.37 focused Chromium audit: **18/18 PASS**.
- Inherited V30.36 stateful Chromium audit: **28/28 PASS**.
- Handler-wiring audit: **0 unresolved inline named handler/call targets**.
- V30.32–V30.37/current/Render persistence suites pass.

## Runtime acceptance note
This build container does not include the npm runtime dependencies used by the live Express/SQLite server. Complete final runtime acceptance on the normal Mac/Render Node 22 environment with:

```bash
npm ci
npm run qa:runtime
```
