# V30.69.29 scope and remaining operational acceptance

All acceptance uses disposable synthetic SQLite databases, real application servers and authenticated Chromium. Production Render deployment, live-data performance, bank transfers and external email delivery were not performed. No production disk, database or private uploads were accessed.

Quotation-field removal is intentionally limited to outgoing supplier-payment flows: import payment, supplier advance, packaging settlement and supplier operational expense. Customer receipts/refunds, supplier advance refunds and general import-cost cross-currency quote controls retain their existing policy. Mathematical rate/debit/recipient checks, bank evidence and reference rules remain mandatory.

FX-backed cost editing is an audited immutable replacement, not an in-place edit of bank snapshots. Historical Finance rows remain as voided/reversed versions; one active authoritative movement represents the current amount. Original evidence can be reused in authorized corrections under the existing policy.

Only the original creator can Correct & Resubmit. Posted-cost correction also requires the existing CEO/Admin authority and financial permissions. A different CEO cannot impersonate the original creator; records requiring another user's correction stay with their assigned original user. Closed periods and received-inventory valuation restrictions remain enforced.

The test matrix covers representative permitted/denied users and realistic records, not every possible role/permission/approval combination. The source integrity report proves Excavator handlers and direct hydration unchanged, supplemented by actual financial and browser regression suites.

Historical tests requiring the now-removed supplier quote fields and redundant confirmation checkbox are superseded/adapted in the current gate. Untargeted flows retain their quote/evidence assertions. Historical release notes/reports remain included for provenance; use the V30.69.29 aggregate for this source.
