# Remaining Work after V30.49.0 — explicit, not silently closed

**Critical production gates (NOT RUN in source environment):** install native Node dependencies and run real authenticated Express/better-sqlite3 CEO/BU-restricted E2E, payments/refunds/voids/posting/reconciliation, EN/KO; test live Render with representative production-shaped data, 1/3/5/10 concurrent users, CPU/RAM/SQL write contention, request/first-useful-render p50/p95 and payloads. The read-only `qa/load_v349_staging.js` harness needs a staging URL/token, does not supply production access or load evidence by itself.

**Further source optimization, not complete:** cross-module dependency-verified full BU lazy JavaScript split; 15 remaining sensitive/legacy observers one by one; other Accounting posting/statement/reconciliation history lists and Pink Salt import/stock/supplier history pagination/N+1 as needed; secondary attachments/payload, startup/backfill and sidebar metrics when measured. No claim of global virtualization or infinite scroll. Continue inherited regression gates and create bug-specific checks.

**Promotion rule:** This ZIP is source-QA-ready, not fully production-verified. Do not claim the original entire performance program is complete or rename the protected baseline until actual deployment and the critical tests pass.
