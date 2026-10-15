# Render deployment and rollback

No push or deployment has been performed. Keep the existing service, Node.js 22 configuration, environment, DATA_DIR, UPLOAD_DIR, database, uploads and persistent disk. Never reset or replace production storage.

1. Take a consistent SQLite backup using the backup API or a stopped service; a live main-file copy may omit WAL changes. Back up uploads separately.
2. Deploy this source to isolated staging storage first. No new schema migration or existing-record rewrite is required. Existing startup migrations remain idempotent and capability registration is additive.
3. Check the reported PKR import cost paid from KRW: quote details absent, one bank rate, correct actual debit and KRW equivalent. Test USD/USD, USD/KRW, account changes, Advance Only/Both, fees, evidence, ordinary edits, Finance locks and corrections.
4. Check one authoritative Finance movement for each real debit, balanced controlled proposals, existing invoice FX differences, unchanged historical records, EN/KR and deep-link refresh/Back/Forward. Smoke-test Excavator payments.
5. Only after staging acceptance, merge the tested branch and deploy according to the service’s existing branch configuration. An auto-deploy service can deploy immediately when its tracked branch is pushed.

Code rollback: redeploy protected V30.69.29 using the same current storage and environment. No database downgrade is needed. The duplicate input and quote UI defects return. New records retain canonical accounting rates in existing columns/snapshots and remain readable. Preserve all financial history; do not restore an older database over new financial activity without a reviewed recovery and reconciliation plan.
