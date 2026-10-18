# Current engineering candidate: V30.69.34

Read `START_HERE_V30_69_34.md`. Operational Packaging Materials redesign on protected .33; remaining production acceptance gaps are explicit. Earlier entries below are historical.

# Current release: V30.69.33

Baseline V30.69.32 SHA256 327f6f3316ca40d3da77299750e2c85e2aad7039585b0278853a338d9256c6a0. See START_HERE_V30_69_33.md and qa/evidence/36933-package-audit.json. Earlier manifests below are historical.

# Current release: V30.69.32

Baseline: protected V30.69.31, SHA256 f3389a820c47ebdd71908cf4b3f761e015b6b2cf0ac533f3d660cda28dc2e568. See START_HERE_V30_69_32.md and docs/releases/v30.69.32. Current verification: qa/evidence/36932-release.json. Current packaged file checksums and exclusion audit: qa/evidence/36932-package-audit.json. Earlier content below is historical.

# Current release V30.69.29

Protected baseline: exact V30.69.28. October 15 cost locks/details and simpler supplier payments. Read START_HERE_V30_69_29.md and qa/evidence/36929-release.json. No new schema migration. Historical manifests follow.

---

# Current release: V30.69.28

Protected baseline: V30.69.27. Direct deep-route hydration using the existing sole route controller/registry. Read START_HERE_V30_69_28.md and docs/releases/v30.69.28/TEST_RESULTS.md. Current evidence: qa/evidence/36928-release.json. No database schema change. Historical manifest follows.

# V30.69.21 — October QA and sales settlement staging candidate

Primary paths for all seven QA points are implemented with server and authenticated browser testing. See `V30_69_21_QA12_IMPLEMENTATION_AND_ACCEPTANCE.md` and `qa/evidence/36921-release.json` for per-point evidence, remaining acceptance and safe deployment/rollback. Entries below are historical.

# V30.69.20 — Cross-currency payment staging candidate

Consolidated durable Pink Salt settlement engine, native payment UI, approval/Finance/Accounting integration, immutable corrections and reversals, and real server/browser QA. See `V30_69_20_IMPLEMENTATION_AND_ACCEPTANCE.md` and `qa/evidence/36920-release.json` for evidence, remaining acceptance work and safe Render rollback. Historical entries below describe earlier releases.

# V30.69.6 Release Manifest

Base: V30.69.5
Release: System-Wide Refresh / Persistent Routing Hardening
Git-ready folder: `Blue_Ocean_Market_V30_69_6`
Primary changes: `public/client.js`, `public/runtime-v30392.js`, compatibility runtime copies, `public/v3692-pink-qa.js`, `public/v3693-persistent-routing.js`, `public/index.html`, package version/QA, dedicated V30.69.6 QA script.
Persistent-data safety: no DB reset, no persistent-disk reset, no destructive migration. Existing data/history preserved.
Runtime acceptance: authenticated Render/browser refresh testing remains required before protected-baseline promotion.

# V30.69.4 Release Manifest

Base: V30.69.3
Release: Pink Salt QA 07 Oct regression completion
Git-ready folder: `Blue_Ocean_Market_V30_69_4`
Primary changes: `public/v3694-pink-qa.js`, `public/index.html`, `server/v300.js`, `server/v305.js`, `server/v310.js`, `server/v350-import-pages.js`, package version/QA, dedicated QA script.
Persistent-data safety: no DB reset, no persistent-disk reset, no destructive migration. Existing data/history preserved.
Runtime acceptance: authenticated Render/existing-DB browser test remains required before protected-baseline promotion.

# V30.69.3 Release Manifest

Base: V30.69.2
Release: System-Wide Persistent Routing & Page-State
Git-ready folder: `Blue_Ocean_Market_V30_69_3`
Primary changes: `public/client.js`, `public/v3693-persistent-routing.js`, `public/index.html`, package version/QA, dedicated QA script.
Persistent-data safety: no DB reset, no persistent-disk reset, no destructive migration. Existing data/history preserved.
Runtime acceptance: authenticated Render/existing-DB test remains required before protected-baseline promotion.

# V30.69.2 Release Manifest

Base: V30.69.1
Release: Pink Salt QA 06 Oct + shared navigation/payment/control hardening
Git-ready folder: `Blue_Ocean_Market_V30_69_2`
Primary changes: `public/v3692-pink-qa.js`, `server/v3692-pink-qa.js`, `server/v369-pink-shared-workflows.js`, `server/server.js`, `public/client.js`, `public/v369-pink-shared-workflows.js`, `public/index.html`, package version/QA, dedicated QA script.
Persistent-data safety: no DB reset, no persistent-disk reset, no destructive migration. Existing data/history preserved.
Runtime acceptance: authenticated Render/existing-DB test remains required before protected-baseline promotion.

# V30.69.1 Release Manifest

Base: V30.69.0
Release: Pink Salt Import UX Hotfix
Git-ready folder: `Blue_Ocean_Market_V30_69_1`
Primary changes: `public/v369-pink-shared-workflows.js`, version marker in `server/v369-pink-shared-workflows.js`, `public/index.html`, package version/QA, dedicated QA script.

# Blue Ocean Market V30.69.0

Baseline: V30.68.1 PASSWORD_RESET_HOTFIX.

Scope: Pink Salt QA corrections (05 Oct) plus shared Excavator-pattern supplier account/payment/settlement reuse.

Persistent-data safety: additive schema migration only. No database reset, destructive migration, or persistent-disk reset.
