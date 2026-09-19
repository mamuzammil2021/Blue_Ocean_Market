# Blue Ocean Market V30.39.0 — Performance Foundation & Runtime Consolidation

## Baseline
Built directly on protected V30.38.2. No destructive database migration, reset, or workflow redesign.

## Delivered
- Consolidated the historical live browser patch chain into `public/runtime-v3039.js` while retaining historical source files for traceability. `index.html` now loads only i18n, core client, and the consolidated runtime.
- Added pre-compressed gzip variants for the three hot runtime assets and server support to serve them on gzip-capable connections with versioned immutable caching.
- Added system-wide network/action feedback: global working indicator, slow-response state, contextual button spinner/disable behavior, and automatic restoration on completion/failure.
- Added in-flight GET deduplication plus shared debounce/cancel and paged-request primitives for current/future modules without caching volatile financial state.
- Added a shared lifecycle registry for future explicit module initialization; new work should not add document-wide MutationObservers by default.
- Added system-wide server request timing, request IDs, `Server-Timing`/`X-Response-Time`, slow-request logging, large-response logging, and an authorized performance-health endpoint.
- Added built-in gzip compression for sufficiently large JSON API responses without a new npm dependency.
- Added safe SQLite runtime tuning (`busy_timeout`, `synchronous=NORMAL`, memory temp store, bounded cache) and targeted high-volume list indexes; `PRAGMA optimize` remains best-effort.
- Added optional SQL slow-query profiling via `BOM_SQL_PROFILE=true` / `BOM_SLOW_SQL_MS`.
- Replaced request-path `execFileSync` Chrome PDF generation in Pink Salt import/production/customer statement/supplier statement flows with asynchronous `execFile` Promise execution so Chrome rendering does not synchronously block the Node event loop.
- Added `server/pagination-v339.js` as the permanent server-side paging contract (25/50/100, total/range metadata) for migration of high-volume list endpoints and all new list development.
- Added permanent System-Wide Performance, Async Interaction & Scalability Standard to `REQUIREMENTS_MASTER.md` so future releases inherit these requirements automatically.

## Compatibility / protection
- Historical source patches remain unchanged and available individually for diagnosis; they are bundled in their previous exact live order.
- Existing backend idempotency and Review & Confirm mechanisms are preserved and reused rather than replaced.
- Existing SQLite data, uploads, backup/storage paths, Render persistent disk handling, permissions and business workflows are preserved.
- No table/data reset and no destructive schema migration.

## Important architecture direction
V30.39 establishes the foundation and release gates. Existing high-volume list screens can be migrated to real SQL paging incrementally using the shared helper without changing the paging contract. New high-volume screens must use server-side pagination from inception.
