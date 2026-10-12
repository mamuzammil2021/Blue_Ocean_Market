# V30.69.7 — Routing stabilization hotfix

Base: user-provided V30.69.6 archive. No database/server business logic changes.

## Changes
- Removed shadowing legacy `allowed()` definition from `public/client.js`; permission checks now use the existing central access permissions and fallback role map.
- Preserved original deep-link URL when a view is unregistered or unauthorized; display an explicit error instead of destructively rewriting the address to Dashboard.
- Added protected routing restoration for route errors; route history events reapply canonical route validation before rendering.
- Removed the arbitrary 40ms defer for history restoration, and invalidate `lastRestored` on history navigation.
- Bumped modified browser resources to V30.69.7 for cache invalidation.

## Browser QA
Run: `python qa/browser_v3697_refresh.py`
6/6 Chromium test cases passed against extracted production routing functions, using mocked in-browser auth/unit/permission state. Because the environment blocked Chrome navigations to localhost and file: URLs (`ERR_BLOCKED_BY_ADMINISTRATOR`), full application reload, server-backed authenticated sessions and live Render verification **were not possible**. Browser test substitutes an in-memory storage stub for localStorage because `about:blank` denies access; application source itself is not changed to use this stub.

## Release gate remaining
- On staging Render, sign in as CEO and non-CEO; visit each full-page module and record profile, refresh browser, check unchanged URL and selected record/section.
- Check invalid routes/denied routes show useful error with original address retained.
- Test Back/Forward while switching tabs and different record details, multiple business-unit assignments, and session expiry.
- Check server logs, console and persistent DB behavior; do not deploy to production until completed.

This is a **targeted hotfix**, not proof that all modules have complete stable URL coverage; legacy route wrappers and delayed record restore remain and require further integration/QA.
