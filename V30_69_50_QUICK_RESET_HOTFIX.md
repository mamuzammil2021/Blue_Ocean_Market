# V30.69.50 Quick Test Reset hotfix

Based directly on V30.69.49. Quick Reset failed with “Receiving facts are immutable; use controlled compensating events” because its normal DELETE statements ran through the receiving ledger's immutable triggers.

The guarded maintenance path now captures the SQL definitions of triggers attached to tables being cleared, suspends those triggers, clears the operational tables and sequences, and recreates the exact triggers in one immediate SQLite transaction. A failure rolls back both the data and trigger changes. The connection's original foreign-key setting is restored in a finally block, and the reset rejects a result containing broken foreign-key references.

The reset preserve list now includes the newer access profile/group assignments, approval authority/policy/catalog tables, module/entity registries and system migration markers. Users, business units, settings, approval rules, financial accounts and numbering configuration remain intact. The reset continues clearing operational/test records, sequences and uploads.

Environment flags, user authorization, current password, exact typed confirmation, required reason, automatic pre-reset database/upload backup, audit and backup retention are retained. Ordinary receiving operations continue to reject updates/deletes. No production reset was performed and no change weakens the operational ledger triggers.

## Validation

The targeted suite `npm run qa:quick-reset` runs against in-memory and disposable full-server databases. It checks rollback after an injected trigger-recreation failure; immediate reactivation of update/delete protection; authorization/password/confirmation/reason guards; a real reset containing receiving lines/events/history; modern access and core configuration preservation; byte-preserving database/upload backups; foreign-key integrity; repeat reset; and rejection in a production environment.

Current results are in `qa/evidence/36950-quick-reset.json` and `qa/evidence/36950-release.json`. Existing V30.69.49 browser evidence remains historical to that release. No UI changes are included in this hotfix.

## Deployment

Use Node 22 and deploy the complete release with its matching frontend manifest. Keep the existing database, uploads and environment configuration. There is no schema migration. The revised maintenance behavior applies only when an authorized user explicitly executes Quick Reset on a service with APP_ENV=development/testing and ALLOW_TEST_DATA_RESET=true.
