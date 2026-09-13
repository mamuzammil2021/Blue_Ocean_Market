# V30.24.3 Implementation Summary

**Release:** V30.24.3 — BU_SCOPED_NUMBERING_REFERENCE_REGISTRY_LOCAL_TEST  
**Baseline:** V30.24.2

## Purpose

V30.24.3 replaces the incomplete generic Numbering & References form with a central registry of the reference formats the application actually issues. The same registry is used by the issuing code so System Settings is no longer only a visual configuration screen.

## Business Unit presentation

System Settings → Numbering & References now presents configuration using separate scope tabs. CEO / Owner can open **Company / Shared** plus every accessible active Business Unit. A scoped System Administrator sees only Business Units for which `sensitive.system_admin` is effective. The selected BU only shows reference types relevant to that BU, avoiding one mixed company-wide list.

Current group mapping is automatic from active BU identity: Excavator, Pink Salt, MIMI Restaurant, Mango/other. Company / Shared holds accounting, payroll, migration and general/shared references.

## Central registry

Added `server/numbering-service.js` with persistent tables for:

- reference definitions;
- Company / BU overrides;
- audited configuration history;
- persistent sequence counters.

Each definition records the stable reference key, label, module/group, default prefix, storage table/column, sequence digits, year behavior, reset behavior, format template and whether the number is automatic or manual/configuration-only.

The initial registry covers the reference prefixes currently issued/configured by the application, including general invoices/purchases, MIMI orders/invoices, Accounting journals/reversals/inter-BU transfers, employees/payroll/payslips, migration jobs, Pink Salt imports/production/sales orders and Excavator machine/deal configuration.

## Actual issuers use the registry

Existing number generation was moved to the central service for:

- General Sales Invoice;
- General Purchase;
- MIMI POS Order and MIMI sale invoice;
- Accounting Journal Entry and reversal;
- Inter-Business-Unit Transfer;
- Employee Number;
- Payroll Run and payslip prefix;
- Pink Salt Import;
- Pink Salt Production/Repacking Batch;
- Pink Salt Sales Order;
- Data Migration Job.

Existing historical references are never rewritten. Configuration changes affect only references issued after the change.

## Future feature registration

`numbering.next(referenceKey, { definition: ... })` automatically registers an unknown numbered feature before issuing its first number. New features that use the shared numbering service therefore become visible in Numbering & References without a separate manually maintained settings list. Feature code can also call `register()` during installation when the definition must be visible before the first transaction exists.

## Controls

- BU override → Company override → System default precedence.
- CEO-only Company / Shared modification.
- BU System Administrator scope enforcement.
- mandatory change reason and Review & Confirm in the UI.
- before/after numbering history.
- prefix normalization and conflict protection.
- existing legacy conflicts are displayed as warnings rather than silently renumbering historical records.
- persistent sequence counters rather than COUNT-only numbering.
- format preview and current sequence visibility.

## QA

`npm run qa:current` passes all inherited V30.24.2 checks plus V30.24.3 checks for registry schema, seeded prefixes, automatic registration, BU-scoped UI/access, historical-reference protection, conflict handling, actual issuer integration and overlay order.

Runtime smoke is not claimed in the build container because `node_modules` is intentionally excluded and the native `better-sqlite3` dependency is not installed there. Run `npm ci && npm run qa:runtime` in the normal Node 22 test environment before production deployment.
