# Release Manifest — V28.4.0

## Base
- Base branch: `main`
- Base release: complete verified V28.3.0
- Release branch: `release/v28.4.0`

## New runtime files
- `server/server-v284-run.js` — production entry point and combined V28.3 + V28.4 browser delivery.
- `server/server-v284-bootstrap.js` — idempotency, statement APIs/PDFs, Buyer duplicate safety and Pakistan resale integrity.
- `public/v284-client.js` — browser request deduplication, statement UI, PDF downloads and resale UI enhancements.

## QA
- `qa/qa_v284_statements_idempotency.js`
- `.github/workflows/v284-qa.yml`

## Documentation
- `CHANGELOG_V28_4.md`
- `README_V28_4.md`
- `GIT_RELEASE_CHECKLIST_V28_4.md`

## Existing core intentionally preserved
The following verified V28.3 files are not replaced by this release:
- `server/server.js`
- `server/db.js`
- `public/client.js`
- `client.js`
- `public/i18n-ko.js`

The V28.4 startup layer loads the existing core and extends it additively.

## Database changes
Only additive objects are created by V28.4:
- `request_idempotency` table and index.
- `prevent_duplicate_buyer_resale_share` insert trigger.

No table is dropped, no users/test data are deleted, and no production/development records are washed.
