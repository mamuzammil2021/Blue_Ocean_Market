# Blue Ocean Market V30.26.2 Implementation Summary

V30.26.2 is the Git/Render-ready follow-up built on V30.26.1. It addresses the final QA issues reported after the Sell workflow/development-reset hotfix without changing the wider business architecture.

## 1. Finance vs Accounting Posting Control

Finance no longer receives Posting Control buttons in either the top action area or Finance tabs. Finance remains the operational verification workspace. Posting Control is launched from Accounting and renders there as **Accounting Posting Control**. The generic Back to Finance control was replaced with **Back to Accounting**. Individual posting items linked to a Finance record now provide a contextual **View Finance Record** action for source inspection.

The intended control chain is unchanged:

**Operational Transaction → Finance Review / Verification → Accounting Posting Control → Official Ledger**

## 2. Buy Machine supplier duplicate dropdown

The V30.25 generic searchable-master enhancer was still wrapping the newer canonical Buy Machine supplier autocomplete, creating two overlapping lists. V30.26.2 detects the canonical `buySupplierResults` control and skips the legacy enhancer for that field. The canonical dropdown remains responsible for selection, supplier ID state, selected supplier summary and immediate Supplier Available Machine loading.

## 3. Update Sale current settlement list

The Update Sale Current Sale Settlement card previously showed historical/unallocated buyer receipts together with the active sale allocation, which could look like duplicate active settlement entries. The current-settlement renderer now includes only non-voided payment records with a positive active allocation to the sale. Historical/unallocated receipts remain preserved in the Buyer ledger and audit history and are explicitly not treated as current sale settlement.

## 4. Development/Render safety retained

The V30.26.1 reset architecture is unchanged: development/testing reset requires `APP_ENV=development` or `testing` plus `ALLOW_TEST_DATA_RESET=true`; Production remains blocked. Full reset preserves the mounted Render disk and protected pre-reset snapshots.

## 5. Release identity and QA

Package, health endpoint, startup banner and browser cache identity were updated to **30.26.2**. Static QA adds explicit gates for:

- one canonical Buy Machine supplier dropdown,
- Current Sale Settlement filtering,
- Accounting-only Posting Control with no Finance injection,
- retained V30.26/V30.26.1 controls.
