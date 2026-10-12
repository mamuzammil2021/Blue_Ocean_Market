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
