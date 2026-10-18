# Blue Ocean Market V30.69.26 — Simple Import Cost recipients

Based on protected V30.69.25. Import Cost now uses a typed recipient/payee name, optional details and conditional general bank/account fields. There is no saved-recipient dropdown, Add Recipient step or receiver-account selector. New payments do not create reusable recipient/account list entries. The authorized company paying-account selector remains.

Original records, Finance snapshots, correction/reversal history, approvals, FX safeguards and Excavator functionality are preserved. Corrections open both new typed-recipient and historical registered-recipient costs. Cash hides and clears bank details. Review & Confirm displays the recipient and destination before recording.

Final isolated acceptance: **484 checks across 25 suites pass**, including authenticated Chromium, financial reconciliation, V30.69.25 upgrade/restart, all October 14 acceptance and Excavator regression. Also 190 JavaScript syntax checks and 105 frontend integrity entries pass. No production storage was used or changed.

Read:

- [Changes](docs/releases/v30.69.26/CHANGELOG.md)
- [Test results](docs/releases/v30.69.26/TEST_RESULTS.md)
- [Financial reconciliation](docs/releases/v30.69.26/FINANCIAL_RECONCILIATION.md)
- [Known boundaries](docs/releases/v30.69.26/KNOWN_LIMITATIONS.md)
- [Render deployment and rollback](docs/releases/v30.69.26/RENDER_DEPLOYMENT_ROLLBACK.md)
- [Mac Git push steps](docs/releases/v30.69.26/MAC_GIT_PUSH.md)
- [Reproduce tests](docs/releases/v30.69.26/LOCAL_TESTING.md)

Test on an isolated staging service before production. Keep existing Render environment, database/disk paths and uploads. Never deploy a test database or reset the persistent disk. Older release notes/evidence remain for traceability; the 36926 aggregate is current.
