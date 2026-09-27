# V30.56.4 — Accounting financing consolidated continuation (STAGING)

Protected base: exact V30.56.3 source. Additive SQLite schema; no database reset, no upload removal and no new Finance cash movement.

## New implementation
- Captures equipment-lease asset value, refundable deposit, residual value and accountant-review accounting policy separately from repayment principal; **does not** invent lease right-of-use recognition or depreciation journals.
- Adds versioned, lender-referenced future repayment schedule amendments. Requires adjustment authority, explicit lender approval reference/reason, matched eligible Finance principal, chronological effective installment, exact balance, no future/unassigned allocations; preserves earlier schedule rows and linked Finance/posted journals. Approved early repayment is a real verified Finance payment first, never an artificial journal or receipt.
- Shows agreement-scoped posted funding/repayment journal statuses and pending/unclassified source entries; explicitly does not misrepresent a shared liability GL account as an agreement-level official balance.
- Adds printable financing statement (browser Print/Save PDF) alongside CSV with repayment IDs, posted-journal status and schedule amendments. Adds CSV spreadsheet formula-injection guard.
- Keeps Simple/Advanced Accounting, cash/bank cards, links to original journals, previous funding and repayment reclassification Posting Control checks.
- Updated cache-busted script, gzip mirrors, package and health version to 30.56.4.

## Incomplete / intentionally gated (do NOT describe as implemented)
1. Complete lease accounting (ROU asset/liability measurement, depreciation, deposit and disposal) requires approved accounting policy and dedicated authenticated journal workflow.
2. Foreign-currency financing and revaluation are still explicitly rejected, not silently treated as KRW.
3. Official historical opening-balance reconciliation, already-correctly-classified source journals, complex journals, full correction/reversal and shared liability account signoff need authenticated staging review.
4. Browser printing permits user Save as PDF; it is not a server-generated official bilingual signed PDF.
5. Full multi-user browser and deployed Render persistent-DB regression tests have not been performed. Do not promote this staging artifact to production yet.

## QA
- V30.56.4 actual in-memory SQLite route tests passed for recast, prepayment, authority, negative validation, lease metadata and no synthetic cash/GL.
- V30.56.2 integration static/mock check passed.
- V30.54 SQLite historical Finance-integrity fixture passed.
- Legacy version-locked test scripts retain their original version assumptions and may fail on version checks; do not misstate those failures as passing.
