# V30.56.0 — Accounting Workspace, scoped first delivery

Built directly from V30.55.0, preserving the existing application, persistent-disk paths, mutations, Finance verification and Accounting posting controls.

## Implemented
- Simple Accounting Financial Workspace navigation and consolidated POSTED financial KPIs from existing scoped /simple-v305/summary API.
- Bank-by-bank recorded-balance list with direct Open Account Details action using V30.55 overview, explicitly labeled as including unposted Finance and not bank-confirmed funds.
- Operational payables, receivables and advances group totals and expandable full record lists based on existing /simple-v305/open-balances API; distinguish from posted GL.
- Accounting attention KPIs linked to existing Posting Control / advanced experience.
- English/Korean navigation labels, scoped section loading, stale response guard and no new financial writes, database migrations or posting paths.

## Not delivered in this build
- Loan/leasing setup, repayment engine, bank statement bulk import, expanded CoA rules, full 32-report set and data migration. These need separate implementation and verified financial rules; no mock ledger writes were added.
- Authenticated multi-user Render browser tests and existing persistent-database balance reconciliation.

This source package is a staging candidate, not a declaration of production readiness.
