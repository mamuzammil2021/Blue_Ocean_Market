# Blue Ocean Market V30.18.0 — Finance & Accounting Posting Control Local Test

V30.18.0 continues from the locally verified V30.17.0 baseline without an intentional database reset. This release implements the accounting-control architecture agreed for Blue Ocean Market and keeps **Finance** and **Accounting** as separate, permission-controlled workspaces.

## Core architecture

**Operational Transaction → Finance Review → Posting Control → Official Accounting Ledger**

- Operational users continue working in Excavator, Pink Salt, Restaurant and other business modules; they do not enter debit/credit for normal transactions.
- The system prepares balanced accounting proposals from operational transactions. A prepared proposal is **not** part of the official General Ledger, Trial Balance, P&L or Balance Sheet until an authorized reviewer completes final posting.
- **Finance** remains the day-to-day control workspace for payments, receipts, advances, expenses, verification, correction requests, evidence and Posting Control.
- **Accounting** remains the official books workspace for Chart of Accounts, journals, General Ledger, Trial Balance, P&L, Balance Sheet, reconciliation, period close and authorized accounting adjustments.
- One shared double-entry engine is retained across business units, with business-unit and operational dimensions for unit-level and consolidated reporting.

## Posting Control

- Added a dedicated Posting Control queue with Pending Review, Correction Required, Posted and controlled historical states.
- Queue/detail visibility is driven by effective Accounting/Finance permissions and business-unit scope.
- Final posting requires `Accounting · Approve` authority for every affected business unit.
- Final posting revalidates balanced debits/credits, open accounting period, Finance verification/dependencies and a mandatory reviewer note.
- Linked Finance records must be verified and free of unresolved correction/reversal dependencies before the related accounting proposal can become official.
- Evidence from Finance and supported source workflows is surfaced to the reviewer using safe internal upload paths.
- Posting decisions and corrections are retained in posting history/audit.
- Sidebar/action badges include pending Posting Control work for authorized viewers, not only final approvers.

## Corrections, reversals and period integrity

- Posted accounting entries are not silently overwritten or destructively deleted.
- A correction to an official posted source uses a controlled reversal proposal. The original journal remains Posted until the reversal itself is reviewed and final-posted.
- When a reversal becomes official, the original is marked Reversed and stale bank-reconciliation matches are cleared where applicable.
- Corrected Finance activity cannot bypass an unresolved prior Accounting reversal.
- Closing a period is blocked while Posting Control proposals, accounting sync items or required accounting exceptions remain unresolved.
- Official financial reports include only ledger-effective `Posted` / `Reversed` journals; Pending Review and Correction Required proposals are excluded.

## Manual accounting adjustments

- Manual journals remain restricted by `sensitive.accounting_adjustments` and applicable Accounting access.
- A manual proposal requires an authorized business unit, open period, at least two valid manual-postable accounts, exactly one positive debit or credit per line, equal debit/credit totals, a reason/description and supporting evidence.
- Manual journal UI now submits the required evidence correctly using multipart form data.
- An unposted manual proposal can be corrected/resubmitted by the responsible authorized user or cancelled with a mandatory reason; existing evidence/history is preserved.
- Manual proposals still require Posting Control final review before entering the official ledger.

## Preserved requirements

V30.18.0 retains the V30.17 Users & Access architecture—including the **Access** button confirmed working by the user on localhost—plus V30.15 supplier accounts, V30.14 Review & Confirm/processing/idempotency, V30.13 customer receivables/pricing, V30.12 quantity integrity, V30.11 business-context integrity and earlier stock/finance/approval safeguards. English/Korean localization and business-unit scoping remain mandatory.

## Local test

1. Keep/copy your existing `data/` and `uploads/` folders if you want to continue with the same local records.
2. Run `npm install` or `npm ci` if dependencies are not installed.
3. Run `npm run qa:current`.
4. Start with `npm start` or double-click `START_LOCAL_MAC.command` on macOS. The launcher creates a Git-ignored local `.env` if one does not exist.
5. Test Posting Control with a Finance-linked transaction, a correction/reversal scenario and a manual journal before production deployment.

For Render, configure `JWT_SECRET` and production environment values in Render. The Docker image includes Python, make and g++ so `better-sqlite3` can build on Node 22 slim.

## V30.18 validation note

Final source/release validation: **PASS — 194 consolidated checks**, including **36/36 JavaScript syntax checks**, package-cleanup validation and ZIP-integrity testing. The release contains **50 files** and excludes `.env`, `node_modules`, runtime databases and runtime uploads.

A full runtime smoke test is **not claimed in the build environment** because dependency installation (`npm ci`) timed out there. Before production deployment, install dependencies locally or in CI and run `npm run qa:current` followed by `npm run qa:runtime`.
