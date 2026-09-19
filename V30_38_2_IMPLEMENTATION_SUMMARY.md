# V30.38.2 Implementation Summary

## Release title
Refund Settlement Integrity · System-wide Modal Success Lifecycle · Token Account Interaction · Machine Cost UI Hotfix

## Baseline and versioning
V30.38.2 is a focused **point release** built directly on protected V30.38.1. It does not start a new major/minor feature line. V30.38/V30.38.1 settlement, account-management, profile, pagination, targeted-refresh, stable-chrome, permissions, audit and Render-persistence behavior remain protected.

## 1. Buy Machine Token Payment account interaction repair
- The V30.38.1 async/prefetch/cached account-loading path is preserved.
- The real browser interaction failure was addressed at the UI layer rather than by adding more data requests: Pay From and Paid To now use stable interaction-safe account pickers while their underlying native `<select>` elements remain the authoritative form values.
- Clicking either account control keeps its list open for normal mouse selection instead of immediately blinking/collapsing because of inherited refresh/focus interaction.
- Every eligible loaded account remains visible; users can switch away from the Default account, and one-account cases remain usable.
- Selecting an account updates the underlying real selector and dispatches the normal `input`/`change` events so existing validation and submit logic continue to work.
- The Token Payment **Add / Manage Accounts** control is detached from conflicting inherited click/inline routes and calls the final shared V30.38 supplier account manager directly.
- Supplier Accounts opens as a child workflow above Buy Machine. Closing/saving the child returns to the same Buy Machine state and refreshes the affected account data without a full-page rebuild.

## 2. Shared refund settlement integrity
- Refund workflows now present a shared settlement preview with:
  - Available Before;
  - Refund Amount + Refund Currency;
  - FX Rate to KRW where applicable;
  - KRW Equivalent / Advance Deduction;
  - Remaining After Refund.
- For KRW-backed advances/credits, only the KRW equivalent (`Refund Amount × FX Rate to KRW`) is deducted from the stored KRW balance.
- KRW refunds lock FX to `1`; foreign-currency refunds require a valid FX rate.
- Pakistan resale credit remains PKR-native for its available/remaining credit while the KRW equivalent is still shown for financial clarity.
- Direct refund **Paid To** receiver accounts are filtered to the selected Refund Currency and method compatibility.
- Direct refund **Pay From** company accounts are filtered/defaulted to the same Refund Currency.
- Backend validation now blocks a direct cross-currency source/destination mismatch for Excavator buyer refunds and the comparable Pink Salt cash-refund paths. A genuine different-currency funding case must use an explicit FX-conversion workflow rather than silently pretending the currencies match.
- Pakistan resale pooled cash refunds continue to require a compatible PKR buyer destination account.
- Existing receipt/evidence, Finance one-real-money-movement, immutable receiver/account snapshots, permissions, approvals and Review & Confirm rules remain authoritative.

## 3. System-wide successful modal/dialog lifecycle
- A shared success lifecycle now observes real modal form submissions and closes the active child dialog only after the mutating API call succeeds.
- The existing nested-dialog-safe `closeModalAfterSave()` path is used, so the underlying parent screen/dialog is restored rather than replaced.
- Validation/API failures cancel auto-close and leave the dialog open for correction.
- The success close is guarded by original-form/action identity so an unrelated modal opened later is never blindly closed.
- A protected processing indicator appears once the actual mutation begins, including after Review & Confirm, to reduce duplicate submission risk.
- After a successful child account mutation, the affected Buy Machine account cache/selectors are refreshed without rebuilding unrelated UI.
- Existing handler-specific targeted refresh remains in place; this layer standardizes the final close behavior rather than replacing business handlers.

## 4. Machine Detail → Costs UI refinement
- Cost-row Edit/Void controls are aligned to the right.
- Cost entries are placed in a bounded vertical viewport showing roughly three to four rows before scrolling, preventing the card from growing indefinitely.
- **Total machine cost** stays outside the scrollable entry list and remains visible while entries are scrolled.
- The large yellow `Locked after Finance verification / Accounting posting` treatment is removed.
- Locked rows show a compact disabled **🔒 Edit** control with the lock explanation available as a tooltip/title.
- Backend Finance/Accounting lock enforcement remains authoritative.
- Void stays governed by its separate permission/lifecycle rules and is not automatically disabled merely because Edit is locked.
- Voided-row presentation remains distinct.

## Data / migration safety
- **No V30.38.2 database schema change.**
- **No reset or destructive migration.**
- V30.38.0's additive `counterparty_payment_account_history` table/index remains unchanged.
- Existing SQLite data, uploads/evidence, backups and Render persistent disk remain compatible.

## QA
- V30.38.2 requirement/static gate: **33/33 PASS**.
- V30.38.2 focused Chromium audit: **18/18 PASS**, including real mouse clicks on both Token Payment account lists and the actual Add / Manage Accounts control.
- Inherited V30.38.1 Chromium hotfix audit: **10/10 PASS**.
- Inherited V30.38 Chromium audit: **18/18 PASS**.
- Inherited V30.37 Chromium audit: **18/18 PASS**.
- Inherited V30.36 stateful Chromium audit: **28/28 PASS**, updated only for the intentional V30.38.2 account-button selector and compact disabled lock/Edit presentation.
- Handler wiring: **1,301 inline event attributes**, **1,354 call references**, **576 unique named targets**, **0 unresolved**.
- V30.32–V30.38.1/current/Render persistence static suites pass.

## Runtime acceptance note
The clean build container does not contain `node_modules`; `npm run qa:runtime` therefore stops before Express startup with `Cannot find module 'express'`. Complete live acceptance in the normal Mac/Render Node 22 environment with:

```bash
npm ci
npm run qa:runtime
```
