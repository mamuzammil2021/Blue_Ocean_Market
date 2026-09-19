# Git / Render Ready — V30.39.2

V30.39.2 is built directly on V30.39.1 and preserves protected V30.38.2+ business behavior. It targets actual runtime/database waiting: Accounting queue blocking, repeated access calculations, side-effect-heavy badge/notification work, Finance/Pink Salt N+1 paths, repeated startup backfills, synchronous compression/hashing, and Finance client-only list loading.

Existing SQLite data, uploads/evidence, backups and Render persistent storage are preserved. Do **not** reset or replace the persistent disk/database for this release.

Recommended verification before merge/deploy:

```bash
npm ci
npm run qa:v3392
npm run qa:v339
npm run qa:v3391
npm run qa:v336:handlers
npm run qa:current
npm run qa:render
npm run qa:runtime
```

Focused Chromium audits (where Python Playwright + Chromium are available):

```bash
npm run qa:v3391:browser
npm run qa:v3392:browser
```

Optional performance environment setting:

```bash
BOM_ACCESS_CACHE_MS=5000
```

Keep it short-lived; V30.39.2 clamps it to 0.5–30 seconds and explicitly invalidates access changes.

All future development must follow the permanent V30.39/V30.39.1/V30.39.2 performance rules and the **Smart Context-Aware Change & Impact-Control Standard**. Do not optimize blindly: preserve BU/workflow context, permissions, Finance/Accounting semantics, void/reversal behavior, persistent data and parent-screen context.
