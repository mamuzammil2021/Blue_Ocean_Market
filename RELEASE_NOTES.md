# Blue Ocean Market V30.70.5

All four November 8 QA points are addressed on top of V30.70.4. See QA_NOV8_705.md for the requirement mapping and root causes.

- New Import uses a category cart with edit/remove, live weight and currency totals, and light section separation.
- Raw Salt Stock has one generic server search with full-result sorting, pagination and saved query state.
- Packaging purchase editing opens directly as a page, with draft/confirmed/received controls preserved.
- Repacking failures release their processing claim after rollback. Retry and successful replay remain protected. Inline errors, stable operation keys, accurate live weight summaries and focus preservation complete the flow.

The shared rollback fix preserves existing approval, financial and stock controls. There is no new business workflow, marketplace connector or database migration.

Use Node 22 and the existing PostgreSQL environment. No new dependencies or configuration. Run npm run qa:current for release checks or npm run qa:nov8 for the focused suite.

Validation uses synthetic PGlite databases and Chromium. Production Chrome CLI, native multi-session PostgreSQL and hosted deployment still require environment validation. No Git push/pull/merge or deployment was performed.
