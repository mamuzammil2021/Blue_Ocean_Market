# Git / Render Ready — V30.40.0

V30.40.0 is built directly on the protected V30.39.2 baseline. It adds the multi-profile Users & Access redesign and the agreed 19 Sep/system-wide UI QA refinements without a destructive database reset.

Existing SQLite data, uploads/evidence, backups and Render persistent storage are preserved. Do **not** delete/recreate the persistent disk for this release.

Recommended verification before merge/deploy:

```bash
npm ci
npm run qa:v340
npm run qa:current
npm run qa:render
npm run qa:v340:runtime
npm run qa:runtime
```

The shared Access Profile library is protected, per-user profile/group assignments are BU-scoped, Approval Authority remains separate, and Finance/Accounting maker-checker safeguards remain active. Wide tables may scroll horizontally when needed, but Actions stay at the far right and are sticky/right-aligned where practical.

All V30.39/V30.39.1/V30.39.2 performance, progressive-loading, targeted-refresh and Smart Context-Aware Change & Impact-Control standards remain mandatory carry-forward rules.
