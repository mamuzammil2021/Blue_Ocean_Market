# Changelog — V28.1.0

## Navigation, refresh and responsive layout

- Fixed the desktop sidebar to the viewport and gave navigation an independent scroll area.
- Kept the active module visible after navigation and refresh.
- Preserved the off-canvas mobile sidebar and responsive layouts.
- Made repeated clicks on the active tab reload its data.
- Added post-mutation refresh for create, update and delete actions.
- Added user-specific sidebar action badges, hidden when their value is zero.

## Buyer and Supplier Requirements

- Aligned both requirement types to the same structured machine and commercial fields.
- Added View, Edit, Delete, Matches and exchange-proposal flows for both requirement owners.
- Added smart scoring for machine name/type, make, model, year/range, condition and budget.
- Explicitly excluded location from match eligibility.
- Added field-level match explanations and Exact/Close match levels.
- Persisted matches uniquely to prevent duplicate alerts.
- Added automatic notifications to relevant requirement and machine users.
- Added reserve/dismiss status handling and exchange proposal records.

## Excavator payment evidence

- Retained mandatory receipt/evidence validation across buyer payments, machine payments, purchases, sales, repairs, logistics, parts and other monetary Excavator records.
- Enforced evidence on both browser and API paths.
- Retained evidence links in Excavator documents and source-linked Finance records.

## Finance access and corrections

- Restricted regular Finance users to records they created.
- Kept complete business-unit Finance visibility for CEO and authorized Finance reviewers.
- Restricted correction editing to the original record creator and enforced it server-side.
- Added source-specific correction forms instead of a generic Finance-only form.
- Added atomic source-record and Finance-record updates on resubmission.
- Added original/current snapshots, field-change comparison, correction history and evidence.
- Added reminders, linked Tasks and notification/action counters.
- Added correction lifecycle tracking to People & Performance.
- Resolved linked tasks and user badges when Finance verifies the correction.

## Korean-first bilingual coverage

- Added Korean translations for every V28.1 static/dynamic interface phrase and backend error.
- Preserved English as a complete selectable language.
- Preserved user-entered names, notes, models, references, filenames and business content.
- Expanded release QA to 1,869 exact phrases and 106 dynamic runtime patterns.

## Release engineering

- Updated version and browser-cache identity to `28.1.0`.
- Updated `better-sqlite3` to `13.0.3` for Node.js 22/24 compatibility.
- Added configurable persistent `DATA_DIR` and `UPLOAD_DIR` paths for Render.
- Removed published/default administrator credentials and password-prefilled user forms; first-start credentials and JWT signing secret are now required through the environment.
- Disabled demo-user seeding by default; it requires an explicit opt-in and an environment-supplied password.
- Removed destructive startup purging and table-rebuild migrations; V28.1 preserves historical/custom business units and uses additive schema migrations.
- Added V28.1 static and full runtime API gates.
- Made the runtime gate self-contained with disposable data and uploads.
