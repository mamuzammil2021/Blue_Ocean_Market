# Deployment, rollback and operational acceptance

Use Node 22 with the existing Render persistent SQLite/upload paths and existing secrets. Install from package-lock with `npm ci`. Do not point local fixture tests at production. Do not move to PostgreSQL as part of this release.

Before deployment, create and verify a consistent backup using the existing database/storage process. Test this source on an isolated copy and review configured approval levels, independent reviewers, source-account mappings and SMTP settings. The current engineering report is `qa/evidence/36933-release.json`; old-numbered evidence is historical unless included in this current aggregate.

Schema changes are additive/rerunnable: payment/approval links and indexes plus the approval review-task pointer. Original financial snapshots and Chart of Accounts codes are preserved. A real protected .32 database with a posted USD movement is migrated and restarted in the automated suite. Existing pending approvals receive tasks when eligible reviewers exist; no Finance/Accounting history is rewritten.

Deploy to staging first. Check a real permitted payment/receipt, native account movement, invoice/advance settlement, approval task, notification, Finance verification, Posting Control, correction and receiving. Confirm bilingual behavior, refresh/deep links, and SMTP delivery to intended reviewers. No push, merge or deployment was performed by this build.

Email requires configured/enabled SMTP and notification email settings. `email_important_tasks` controls high/urgent/critical task assignment/escalation; global email remains opt-in. No live SMTP delivery or live Render acceptance is claimed. Check existing email logs for configuration/provider failures.

Historical bad currency mappings need bank evidence and the audited repair/reversal path in the .32 release guide. No guessed rate, bulk rewrite or silent historical revaluation is applied. Legacy records lacking an actual account-currency amount are flagged as unmapped. A foreign native opening balance cannot be reconstructed from a KRW opening amount alone; statements show native movements separately.

Payment approval checks use explicit durable links and exact registered legacy source links. This does not invent retrospective approval decisions for old records with no surviving relationship. Review any historical anomaly individually. A bank balance is not independently confirmed merely because bookkeeping movements reconcile.

The shared lifecycle is exercised across registered approval requests and the canonical individual/bulk Finance verification boundary. Native BU financial handlers are preserved and regression-tested; this is not a redesign of every old BU payment form or a new bank-payment API integration. Existing policy-dependent reversal and inventory restrictions still apply.

Rollback: pause financial mutations before switching application versions. Do not blindly downgrade after .33 policy/task activity: .32 does not understand the new exact-payment policy approval linkage/executor, and lacks the new pre-verification gate. Prefer a reviewed compatibility hotfix or roll-forward. Never overwrite newer financial activity with an old database backup. The additional .32→.31 stable-cost revision downgrade restrictions still apply.
