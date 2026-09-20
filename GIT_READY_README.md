# Git / Render Ready — V30.41.0

V30.41.0 is built directly on V30.40.0 and completes the Access Control Center separation without a destructive database reset.

Existing SQLite data, users/access assignments, uploads/evidence, backups and Render persistent storage are preserved. Do **not** delete/recreate the persistent disk for this release.

Recommended verification before merge/deploy:

```bash
npm ci
npm run qa:v341
npm run qa:current
npm run qa:render
npm run qa:v341:runtime
npm run qa:v340:runtime
npm run qa:runtime
```

Shared Access Profiles, multi-permission Permission Groups, multi-rule Access Policies, Approval Levels and Access Audit are managed under System Settings → Security & Access. Users & Access remains assignment-first, including multiple BU-scoped profiles/groups and separate Approval Authority.

The V30.40/V30.39 performance, targeted-refresh, list/action, maker/checker and persistent-storage standards remain mandatory carry-forward rules.
