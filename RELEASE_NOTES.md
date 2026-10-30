# V30.70.1 October 28 QA fixes

Built directly on the supplied V30.70.0 PostgreSQL tested source. All 16 requested
QA points are addressed; see QA_OCT28_CHECKLIST.md for the implementation and
verification of each point.

The release adds a BU-scoped warehouse workspace, reusable document archiving,
company document/branding settings, matching purchase/sales invoices, and a
cart-based sales form. It exposes supplier advance refunds through the shared
incoming payment engine and corrects purchase/receiving destinations, live cart
totals, customer editing and import section navigation.

The existing payment, Finance, Accounting, approval, receiving and stock ledgers
remain authoritative. A warehouse transfer does not create a bank movement.
Payment evidence cannot be removed with ordinary document controls.

New PostgreSQL migrations 008 and 009 are additive. The application still uses
one PostgreSQL database. The original SQLite migration catalog and historical
migration checksums are retained.

No Git push, pull, merge or Render deployment was performed.
