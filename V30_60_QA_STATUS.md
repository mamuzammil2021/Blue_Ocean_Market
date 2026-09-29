# Blue Ocean Market V30.60.0 — QA Status

## Passed source/static gates
- `npm run qa:v360` — **24/24 PASS**
- `npm run qa:v3592` — **12/12 PASS**
- `npm run qa:v3591` — **18/18 PASS**
- `npm run qa:v359` — **21/21 PASS**
- `npm run qa:current` — **PASS**
- Node syntax validation passes for all current server/public JavaScript through `qa:current`.

## Runtime limitation in this build environment
The Git-ready source intentionally excludes `node_modules`. Runtime/SQLite functional suites that require `better-sqlite3` could not execute in this environment because dependencies are not installed. `npm run qa:release` also stops at an old release-identity assertion in the V30.51 historical hardening gate; the current V30.60 source/static gate passes.

## Required staging acceptance
After `npm ci` on a staging checkout / Render test branch, validate:
1. Posting Control KPI counts against real existing DB data.
2. Bulk post 2–5 clean proposals; confirm one batch, all journals posted, no partial batch after a forced failure.
3. Maker/checker, Finance-unverified, closed-period, Manual Journal, Reversal and Financing rows cannot bulk post.
4. Correct an already-posted Finance transaction; after corrected Finance verification confirm exactly one automatic reversal is posted and corrected replacement remains Pending Review.
5. Existing historic pending/posted reversal chains do not duplicate after restart/deploy.
6. Duplicate reversal test is blocked and creates a review exception.
7. Top-level processing overlay is above modal/screen for payment, edit, add, approval and bulk posting; Escape/backdrop/conflicting actions are blocked while processing.
8. Download every Accounting PDF type and visually verify layout/data scope, especially Korean/English text, totals and multi-page reports.
9. Confirm PDF/report access is denied outside authorized Accounting/Finance scope.
