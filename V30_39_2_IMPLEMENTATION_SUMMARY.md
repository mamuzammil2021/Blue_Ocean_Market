# Blue Ocean Market V30.39.2 — Core Runtime & Data Path Optimization

## Baseline
Built directly on protected V30.39.1. Existing business rules, permissions, Review & Confirm, idempotency, Finance/Accounting integrity, targeted refresh, stable parent context, EN/KR, progressive loading, SQLite data/uploads/backups and Render persistent disk are retained. There is no destructive reset or schema rewrite.

## Why this release exists
V30.39.0 reduced startup/network overhead and V30.39.1 made high-use screens progressively usable. V30.39.2 targets the remaining runtime work that can make an apparently simple click wait even after the UI has already acknowledged it: synchronous Accounting queue drains, repeated authorization calculations, N+1 list summaries, expensive badge/notification side effects, repeated startup backfills, synchronous compression/hashing and client-only Finance list loading.

## Delivered

### 1. Accounting queue no longer blocks normal interactive reads
- Reworked Accounting synchronization into small, bounded time slices (default 40 records / 25 ms budget; hard bounded maximums).
- Normal Accounting/P&L/Finance reads no longer drain 1,000–5,000 queued items before they may respond.
- Business/Finance mutations still enqueue Accounting work immediately; a recursive low-priority scheduler continuously catches up.
- Direct operational journals that belong atomically to a specific workflow remain authoritative and are not blindly deferred.
- Added authorized diagnostics for queue depth and oldest queued age.

### 2. Authorization is reused/cached safely, not weakened
- Central API access gate stores the already verified identity for reuse by route authentication instead of verifying the same JWT and reloading the same user twice in one request.
- Assigned-BU/effective-access calculations use a short bounded cache (`BOM_ACCESS_CACHE_MS`, default 5 seconds, clamped 0.5–30 seconds).
- Cache is invalidated immediately when assignments, permission overrides, financial limits, role templates or copied access change.
- Existing permission/BU/action checks remain authoritative.

### 3. Read/count endpoints no longer inherit unrelated maintenance work
- Notification/unread-count reads no longer generate operational alerts/reminders before responding.
- Operational reminders/performance/Pink Salt alerts run on an independent schedule and are split across separate low-priority ticks instead of one large event-loop burst.
- Approval badge calculation no longer loads every normal pending approval and filters it in JavaScript. Ordinary approval levels are counted in SQL; only L5 dual-approver records retain row-level Finance/CEO sequencing checks.

### 4. Finance Control Center uses real server paging
- Added `/api/finance/v3392-page` with 25/50/100 database-backed pages.
- Permission/BU scope, search, verification status, type, evidence, special-control requests and date filters execute before `LIMIT/OFFSET`.
- KPI totals are calculated in a separate authorized aggregate query so page size never changes totals.
- Evidence/open-control indicators are calculated in SQL instead of running per-row JavaScript evidence lookups.
- The browser Finance screen uses the server page directly and the legacy client paginator explicitly ignores server-paged tables.
- Finance rows/KPIs can render before the independent, slower correction queue finishes; the correction badge/section fills progressively when ready.
- Existing Finance detail, verification, correction and mutation workflows remain authoritative and unchanged.

### 5. Pink Salt list N+1 paths converted to set-based summaries
- Unified Supplier list summary now uses set-based import, packaging, advance/allocation/refund aggregation rather than calling full account-state logic once per supplier.
- Customer master summary no longer invokes a full customer account calculation per customer.
- Order master summary no longer invokes full per-order financial calculations for every list row.
- Detailed Supplier/Customer/Order account/detail screens keep their richer authoritative calculations when the user actually opens the record.

### 6. Historical startup work is one-time and ledgered
Added/used `system_migrations` guards for historical work that should not repeat on every Render restart:
- initial Accounting queue population;
- Pink Salt historic Finance/Accounting backfill;
- V30.2 Finance integrity bootstrap;
- V30.25 Finance-separation migration.
Existing installations may execute each missing guarded migration once on the first V30.39.2 startup, record completion, and skip it on later starts.

### 7. Event-loop blocking I/O reduced
- Large JSON compression uses asynchronous `zlib.gzip` rather than `gzipSync`.
- Main attachment integrity hashing uses streaming file reads.
- System Settings bank-statement/data-migration interactive uploads use streaming SHA-256 instead of synchronously rereading the entire uploaded file.
- Synchronous bounded historical hash backfill remains startup-only and is not used for the interactive upload path.

### 8. Performance diagnostics expanded
Authorized V30.39.2 diagnostics expose:
- event-loop lag sample;
- Accounting queue depth and oldest queue age;
- access-cache TTL;
- applied migration count;
- process memory usage.
V30.39 request IDs, slow/large-response logging, Server-Timing and optional SQL profiling remain in place.

### 9. Targeted indexes only
Added narrowly scoped indexes aligned to the new Pink Salt summary, notification unread-count and Accounting queue paths. Index creation is guarded for installations where a legacy table/column is not present. This release deliberately does not add broad speculative indexes.

## Permanent carry-forward rules
`REQUIREMENTS_MASTER.md` now contains **Non-blocking runtime, set-based data access & one-time migration standard — V30.39.2+ PERMANENT RULE**. Future development must not reintroduce request-path queue drains, N+1 growing lists, side-effect-heavy unread/count endpoints, repeated historical startup scans, stale/unsafe access caching, synchronous large compression/file hashing, or client-only pagination on newly migrated high-volume lists.

The permanent **Smart Context-Aware Change & Impact-Control Standard** still governs every optimization. Faster is not accepted if it changes BU scope, permissions, Finance/Accounting meaning, void/reversal behavior, balances, audit history, localization or parent-screen context.

## Deliberately not done blindly in V30.39.2
- The audited compatibility runtime still contains 33 historical `MutationObserver` occurrences. V30.39.2 does **not** mechanically delete them. Each observer can carry protected compatibility behavior; removal requires behavior-by-behavior canonicalization and browser regression testing. The release gate prevents the baseline from growing.
- V30.39.2 does not rewrite every legacy list endpoint at once. V30.39.1 already migrated Excavator Machines/Buyers/Suppliers; V30.39.2 migrates Finance Control Center and removes high-value Pink Salt N+1 summary work. Accounting/Pink Salt/shared high-volume lists must continue migrating under the same permanent server-paging contract as they are safely touched.
- SQLite remains the development/test database. This release removes avoidable application/database work first rather than using a database/hosting upgrade to hide inefficient code.

## Data compatibility
No destructive database reset or replacement is required. Existing SQLite database, persistent disk, uploads, evidence, generated documents and backups remain compatible. Additions use `IF NOT EXISTS`/migration-ledger safeguards.
