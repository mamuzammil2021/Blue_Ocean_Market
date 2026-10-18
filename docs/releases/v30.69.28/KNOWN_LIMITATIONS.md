# V30.69.28 — Scope and limitations

Acceptance uses authenticated local servers, real SQLite and Chromium with synthetic records. Production Render deployment, live-data latency, real bank remittances and external email delivery were not exercised. No production database or private uploads were accessed.

The change covers existing registered navigable destinations; it does not invent persistent URLs for unsaved payment/edit forms or other temporary mutation dialogs. Product variants, lot editing and similar modal actions remain their existing workflows. Existing read-only family, lot and order-trace destinations are tested.

The mandatory route matrix exercises broad representative records, sections, main workspaces, permissions, authentication, errors and history. It is not an exhaustive Cartesian product of every role, record and section. Semantic navigation depths greater than five use the existing record/section/workspace URL fields; no artificial extra path segments were added.

DOM-write interception plus animation-frame snapshots detect intermediate headings and selected profile tabs. Optional router traces confirm a single destination invocation at startup. The tests do not claim a browser video/performance benchmark for production.

Timing observations are individual comparable local fixture runs, not statistically significant latency guarantees. Some destinations can take longer despite fewer requests; permission checks and data freshness remain mandatory.

The inherited FX, fee-policy, accounting-period, inventory-valuation and immutable correction/reversal safeguards remain in force. This routing release does not declare all unrelated financial-policy decisions approved.

Historical notes describing the ancestor-page flash as a future task are superseded by this release's implementation and current evidence.
