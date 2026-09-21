# Git / Render Ready — V30.42.0

V30.42.0 is built directly on V30.41.0. It adds actionable system-generated Tasks, task-driven Finance corrections, notification-to-task deep links, CEO / Owner Full System Access hardening, and automatic future-permission registration/smart bundle mapping without a destructive database reset.

Existing SQLite data, users/access assignments, uploads/evidence, backups and Render persistent storage are preserved. Do **not** delete/recreate the persistent disk for this release.

Recommended verification before merge/deploy:

```bash
npm ci
npm run qa:v342
npm run qa:current
npm run qa:render
npm run qa:v342:runtime
npm run qa:v341:runtime
npm run qa:runtime
```

Finance correction execution is now canonical from the linked Task. Automatically generated workflow Tasks expose their real contextual action and normally close from successful completion of the underlying workflow, not from passive manual task status changes.

CEO / Owner is system-managed Full System Access. Future permissions are registered automatically and smart-mapped into relevant default Access Profiles / Permission Groups while preserving later administrator customization.

The V30.41/V30.40/V30.39 performance, Access Control Center, targeted-refresh, maker/checker and persistent-storage standards remain mandatory carry-forward rules.
