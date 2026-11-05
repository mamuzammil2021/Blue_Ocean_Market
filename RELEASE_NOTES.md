# Blue Ocean Market V30.70.4

November 4 QA fixes, based directly on V30.70.3. All 15 reported items are mapped in QA_NOV4_704.md.

- Import payment refresh, focused Documents content, draft purchase controls and edit/list confirmation.
- Shared optional-zero document presentation, live search, searchable recipe materials and image-only uploads.
- Customer Addresses, atomic New Customer at sale, and Sales list return with optional payment review.
- Receipt navigation preserves its origin. Packaging wastage uses actual warehouse balances; historical negative balances remain visible for reconciliation.
- Shared form validation resubmits after the original browser event completes, fixing stalled address submissions while retaining validation and confirmation.

Existing Finance, approvals, receiving, valuations and marketplace settlement foundations are reused. No live marketplace integration or new business workflow is added.

Use Node 22 and the existing PostgreSQL setup. No new dependencies, environment variables or migrations. Existing migrations 001–011 are unchanged. Run npm run qa:current for the complete release checks, or npm run qa:nov4 for the targeted suite.

Tests use synthetic PGlite databases and real Chromium; the PDF harness uses a test-only adapter. Native multi-session PostgreSQL, production Chrome CLI and hosted deployment are not certified here. See the release evidence for exact checks and limitations.

No Git push, pull, merge or hosted deployment was performed.
