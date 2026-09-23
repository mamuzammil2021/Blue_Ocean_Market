# Blue Ocean Market V30.46.0 — QA Status

## PASS — executed in build environment
- `npm run qa:release`: V30.46 dynamic/static suite (32 checks), inherited V30.45 feedback, V30.44 Cash & Bank account actions, V30.43 QA, full current static/inherited source QA, and Render persistence checks.
- `npm run qa:v346:browser`: static Chromium browser-shell render against bundled JS and CSS, login visible, scheduler/hub present, no uncaught page errors. **Not a signed-in backend test.**
- `node --check` of served/new client and new server script and inherited current QA JS syntax coverage.
- Current asset source equals the regenerated gzip-precompressed bytes for all modified/new scripts. Package ZIP central-directory/file integrity and SHA-256 digest checked at packaging.

## NOT RUN — must not be called a pass
- `npm ci` and native `better-sqlite3`/Express dependency-backed live API tests: dependencies are not installed in the release container. SQL instrumented timing is covered by mocks only; validate with actual native prepared statements under controlled testing.
- Authenticated browser workflows on the live Render deployment (actual buyer/supplier, sale, payment, Accounting account detail, PDF and EN/KR).
- Real multi-user concurrency and load/performance measurement on Render. Performance thresholds, baseline deltas and real-user experience improvement are therefore not yet demonstrated.

## Manual acceptance focus
1. Notifications and Audit: permissions/BU isolation, 25/50/100 paging, search/read/unread/date filters; legacy callers and deep links.
2. Heavy document/history reads cannot starve primary screens; queued abort never starts; POST/money actions never queued.
3. No missing enhancements after re-rendering buyer profiles, supplier/Pink Salt screens and child modals.
4. Unified feedback remains one primary location; purchase/sale/void, Finance/Accounting and authorizations preserve original integrity.
5. Enable detailed diagnostics only in staging and confirm native SQLite timing metrics, redaction, resource impact and role permissions.
6. Preserve persistent `/var/data` storage and existing uploads/SQLite on Render, without reset.

## Overall status
**Offline package regression gate PASS; dependency-backed and live Render acceptance NOT RUN.** This is a packaged incremental performance release, not full completion of the previous backlog.
