# Blue Ocean Market V30.69.27 — Supplier accounts and Cash

Built on protected V30.69.26. Saved active supplier banks now load independently of company-account requests. Historical method/currency formatting is normalized for selection. Accounts in other currencies remain visible: selecting one sets the payment currency where that currency is editable; fixed-invoice unsupported routes remain disabled with an explanation. Applicable FX rates require explicit entry.

Cash hides, clears and disables the supplier-account selector. No supplier bank account is required or stored for Cash; the authorized company Cash source and evidence remain required, and cash reference remains optional. Existing simple Import Cost recipient entry, Finance/Accounting safeguards, supplier accounts/history, approvals and Excavator functionality are preserved.

Final isolated acceptance: **508 checks across 28 suites pass**, including authenticated Chromium, exact source/receiver Finance reconciliation, actual protected V30.69.26 upgrade/restart, Excavator and all October 14 regression. Also 190 active JavaScript syntax checks and 105 frontend integrity entries pass. No production database or disk was accessed or changed.

- [Changes](docs/releases/v30.69.27/CHANGELOG.md)
- [Test results](docs/releases/v30.69.27/TEST_RESULTS.md)
- [Financial reconciliation](docs/releases/v30.69.27/FINANCIAL_RECONCILIATION.md)
- [Boundaries](docs/releases/v30.69.27/KNOWN_LIMITATIONS.md)
- [Render deployment and rollback](docs/releases/v30.69.27/RENDER_DEPLOYMENT_ROLLBACK.md)
- [Mac Git push steps](docs/releases/v30.69.27/MAC_GIT_PUSH.md)
- [Reproduce tests](docs/releases/v30.69.27/LOCAL_TESTING.md)

Stage on an isolated service first. Keep existing Render environment, persistent disk, database paths and uploads. Never reset or replace runtime storage to deploy this ZIP. No new schema migration is introduced. Earlier release notes/evidence remain for traceability; 36927-release.json is current.
