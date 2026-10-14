# V30.69.22 — system-wide routing staging candidate

Consolidates the V30.69.20 cross-currency engine and V30.69.21 Pink Salt controls with shared routing and deep-link restoration. This is a staging candidate; automated test success does not constitute every workflow's full acceptance.

- One route controller and reusable route registry replace competing restoration owners.
- Stable business-unit IDs, record IDs, sections, supported filters and pagination survive refresh.
- Awaited lazy modules, stale-response cancellation, Back/Forward and copied links are integrated.
- Authentication preserves the destination; access denial, unavailable units, missing records and temporary failures have distinct states.
- EN/KR changes restore the current record and section.
- Approval-history read repair uses trusted entity registration, record-level access, sensitive Payroll checks and credential redaction.
- Finance correction read acknowledgement no longer prompts a mutation review.
- Excavator payment handlers and financial backend engines remain preserved. Navigation adapters changed and regression tests are included.
- No new database schema migration in V30.69.22. Existing safe V30.69.20/21 migrations are carried forward.

See QA_COVERAGE.md, ROUTING_ARCHITECTURE.md and deployment instructions in this directory. Actual test evidence is under qa/evidence.

