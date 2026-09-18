# Blue Ocean Market Release Manifest

- Release: **V30.38.0 — Pakistan Resale Sections, Account Management, Buy Machine Account Integrity & Canonical Sale Settlement**
- Protected baseline: **V30.37.0 Profile Sections · Account Management Repair · Responsive Filter UI**
- Database schema changes: **Additive only** — creates `counterparty_payment_account_history` + index with `IF NOT EXISTS`
- Destructive migration/reset: **None**
- Existing SQLite database/uploads/backups/Render persistent disk: **Preserved / compatible**
- Implementation summary: `V30_38_IMPLEMENTATION_SUMMARY.md`
- QA status: `V30_38_QA_STATUS.md`
- Focused V30.38 browser audit: `qa/browser_v338_release_audit.py`
- Inherited V30.37 browser audit: `qa/browser_v337_profile_accounts_filters.py`
- Inherited V30.36 stateful browser audit: `qa/browser_v336_stateful_audit.py`
- Current QA: `npm run qa:current`
- Release QA: `npm run qa:v338`
- Inherited QA: `npm run qa:v337 && npm run qa:v336 && npm run qa:v335 && npm run qa:v334 && npm run qa:v333 && npm run qa:v332`
- Handler wiring: `npm run qa:v336:handlers`
- Render persistence QA: `npm run qa:render`
- Runtime smoke: run `npm ci && npm run qa:runtime` in a networked Node 22 environment.
