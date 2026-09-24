# Blue Ocean Market V30.44.0 — Implementation Summary

## Protected source
Directly built on V30.43.0. V30.43 Accounting detail/statement/PDF/transfer APIs are reused unchanged. No DB change or migration.

## Changes
1. `public/runtime-v30392.js` (actual served consolidated runtime) and historical `public/v291-client.js`: the Simple Cash renderer itself now includes a native Open button for every account. This survives its own tab re-render and view reload rather than depending on a later temporary enhancement.
2. `public/runtime-v30392.js` and historical `public/v290-client.js`: Advanced Cash & Bank Accounts table includes an Action column and native Open button per account.
3. `public/v343-client.js`: the V30.43 enhanced account card now uses a real button instead of a styled span, calling the same `v343OpenAccount(id)` function as both other renderers.
4. `public/v344-client.js`: small close-flow refinement keeps Advanced mode when using the account detail's explicit Back; existing Simple close path is retained.
5. Versioned browser scripts, precompressed files, package/lockfile and server health/banner identity advance to 30.44.0.
6. `qa:v344` executes both source renderer functions twice and asserts one functional Open button/account each time, verifies common workflow links, V30.43 card action and Advanced/Simple return behavior.

## Existing protections
Account list filtering and account-detail access checks remain in existing backend APIs. Statements, PDF and transfer permissions/validations are unchanged. No permission bypass, new ledger or duplicate workflow is introduced.
