# Blue Ocean Market V30.70.3

November 2 QA fixes, based directly on V30.70.2. Read QA_NOV2_703.md for the requirement-by-requirement record and validation.

## Changes

- Supplier/import details no longer poll every 30 seconds or reload on window focus. Existing successful mutation handlers still update the affected records.
- Supplier profile close button follows all other header actions.
- Permitted cost amendments retain the transaction, operational cost and authoritative Finance ID. Multiple revisions retain before/after snapshots. Finance-requested corrections keep their original task chain. An obsolete duplicate Finance projection, when encountered, is retired with an audit entry rather than counted as a second money movement.
- Verified costs reject ordinary editing on the server. The direct Correct Posted Cost action is removed. A formal assigned Finance correction remains controlled: posted journals are preserved, a reversal must be reviewed and posted before the corrected journal can post, and the Finance identity stays the same.
- Warehouses opens its existing create/edit/archive editor in the warehouse workspace. Successful changes update its warehouse selector without reloading the page.
- Packaging Materials navigation updates its active destination. Search/status filters combine, retain their parameters and use case-insensitive PostgreSQL search. Search fields do not trigger unsaved-edit prompts.
- Material edits return to their originating list (including its filters/page) or material detail.
- Import detail tabs have clear, consistently sized active states and responsive spacing. Packaging sidebar children have readable text and selection contrast.
- Posting queue and detail distinguish purchase recognition from stock receipt. These are valid separate accounting stages: recognition debits in-transit inventory and credits the payable; receipt moves that value into warehouse stock. Retry tests confirm one entry per stage and no duplicated payable, stock value or cash movement.

## Upgrade and validation

Use the supported Node 22 runtime and the existing PostgreSQL setup. Startup applies migration 011-cost-amendment-history.sql automatically. Migrations 001–010 are unchanged. Migration 011 removes the obsolete one-revision-per-transaction constraint and retains the transaction lookup index. It preserves all existing rows and supports repeated amendments with stable transaction identity.

No new dependencies or environment variables. Existing EN/KR selection, financial approval/verification controls, shared payment engine, inventory receiving and customer/marketplace foundations are retained. Historical voided records remain as audit history; this build does not delete old transactions.

Validation is against disposable synthetic PostgreSQL-engine databases (PGlite) and real Chromium browser sessions. PDF regressions use Chromium through a test-only Playwright adapter because this environment supplies headless-shell; production Chrome CLI execution, native multi-session PostgreSQL behavior and Render deployment are not certified by these checks.

No Git push, pull, merge or Render deployment is part of this release.
