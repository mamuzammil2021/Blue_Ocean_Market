# V30.38.1 Implementation Summary

## Release title
Sell Machine Validation-State Repair · Buy Machine Token Account Loading / Selection Hotfix

## Baseline and versioning
V30.38.1 is a focused **point release** built directly on protected V30.38.0. It does not introduce a new major/minor feature line. V30.38.0 account management, Pakistan Resales, canonical sale settlement, Finance/Accounting filters, targeted refresh, stable UI chrome, pagination, permissions and Render persistence remain protected.

## 1. Sell Machine live validation-state repair
- Required/invalid fields no longer receive distracting red presentation merely because the Sell Machine form first rendered.
- Validation presentation is now interaction-aware: untouched fields remain neutral; blur and failed Submit/Complete Sale still surface invalid required fields.
- A field that was previously red immediately clears stale red styling/error presentation once the user enters/selects a valid value. Another submit or full refresh is not required.
- The repair normalizes all inherited Sell Machine error presentation layers (`v335-field-invalid`, `v326-invalid-field`, `v338-required-missing`) instead of fixing one screenshot field at a time.
- Stale V30.26 custom-validity errors for corrected buyer/customer name, selling price, destination country and new-buyer name are explicitly released once valid.
- Input/change/blur events re-evaluate dependent field presentation. Backend settlement, duplicate-reference, account, country and other authoritative validation remains intact.
- The fix applies to both existing-buyer and New Buyer / Other sale paths.

## 2. Buy Machine token account selection repair
- Replaced the layered/sequential account refresh chain with one V30.38.1 account-loading path for the Buy Machine token section.
- Company **Pay From** and supplier **Paid To** account requests start in parallel when both are needed.
- Both selectors show an explicit lightweight loading state instead of appearing empty/broken on slow connections.
- Company accounts are prefetched when the Buy Machine workflow opens. Supplier receiver accounts begin prefetch as soon as supplier context is known, before the user reaches the Token Payment area.
- Short-lived promise caches avoid repeated duplicate requests while preserving explicit refresh after account-management mutations.
- Both selectors remain enabled and explicitly selectable even when only one eligible account exists. The active default account is preferred; otherwise the first eligible account is selected while the selectable option remains visible.
- Added response-shape normalization and a read-only V30.32/V30.30 compatibility fallback for supplier account loading. Legacy bank-account rows that do not yet carry `method_type` are safely recognized from their bank/account fields.

## 3. Add / Manage Accounts repair
- Buy Machine's **Add / Manage Accounts** button now uses a capture-phase route to the final shared V30.38 counterparty account manager, bypassing fragile inherited closure/inline routing.
- The shared account manager remains a child workflow; Buy Machine stays mounted underneath and its entered state is preserved.
- Closing account management clears the short-lived account cache and refreshes the parent Paid To selector. Newly created/default account data is therefore available immediately without a full screen reload.
- Existing new-supplier inline receiver-account behavior remains intact.

## 4. Slow-connection and localization behavior
- Account loads use localized loading/status states and keep unrelated Buy Machine UI usable.
- New V30.38.1 account loading/status messages include Korean translations.
- Existing targeted-refresh and stable-chrome rules remain authoritative; this hotfix does not introduce whole-page refreshes.

## Data / migration safety
- **No V30.38.1 database schema change.**
- **No reset or destructive migration.**
- The additive V30.38.0 `counterparty_payment_account_history` table remains unchanged.
- Existing SQLite data, uploads, evidence, backups and Render persistent disk remain compatible.

## QA
- V30.38.1 hotfix static gate: **22/22 PASS**.
- V30.38.1 focused Chromium audit: **10/10 PASS**.
- Inherited V30.38 Chromium audit: **18/18 PASS**.
- Inherited V30.37 Chromium audit: **18/18 PASS**.
- Inherited V30.36 stateful Chromium audit: **28/28 PASS**.
- Handler wiring: **1,301 inline event attributes**, **1,354 call references**, **576 unique named targets**, **0 unresolved**.
- V30.32–V30.38/current/Render persistence static suites pass.

## Runtime acceptance note
The clean build container does not contain `node_modules`; `npm run qa:runtime` therefore stops before Express startup with `Cannot find module 'express'`. Complete live acceptance in the normal Mac/Render Node 22 environment with:

```bash
npm ci
npm run qa:runtime
```
