# Changelog — V28.2.0

## Clear approval decisions

- Simplified reviewer choices to **Verify**, **Request Correction**, and **Request Void**.
- Removed overlapping Reject and Reject & Resubmit decisions from the Finance and Approval interfaces.
- Restricted corrections and resubmission to the original request or record creator.
- Restricted cancellation of an active approval to its original requester.
- Prevented users from approving their own requests.
- Enforced the exact configured reviewer: Manager, Finance, CEO, or Finance followed by CEO for dual control.

## Approval integrity and execution

- Stored immutable original/request snapshots, payload hashes, revision numbers, changed fields, evidence metadata, reminders, linked tasks, and complete decision history.
- Added request-change, creator-resubmission, reminder, cancellation, and post-approval void workflows.
- Added automatic execution after final approval for large manual Finance entries and supported void actions.
- Made automatic execution idempotent and retained its result or error in the approval record.
- Made approved voids update linked source, allocation, inventory, document, and Finance records where the source type supports those changes.
- Added linked correction tasks and included correction activity in People & Performance.

## Finance verification and access

- Limited regular users to Finance records they created; authorized Finance users and the CEO retain scoped company visibility.
- Kept Finance records read-only until a reviewer requests correction.
- Presented source-specific correction fields rather than one generic correction form.
- Updated the source record and linked Finance record atomically when the original creator resubmits.
- Converted legacy Rejected Finance records into the single Correction Required workflow.
- Preserved original/current snapshots, field diffs, evidence, reminders, complete history, and resolution data.

## Payments and notifications

- Fixed Buy Machine so payment reference, date, method, and receipt/evidence appear and become mandatory only when a purchase token is greater than zero.
- Kept all other Excavator payment evidence requirements enforced in both browser and API validation.
- Sorted notifications with every unread item first and newest items first inside unread/read groups.
- Kept sidebar Finance, Approvals, Tasks, matching, and other action badges user-specific and hidden when their count is zero.

## Bilingual and responsive interface

- Added Korean and English coverage for all V28.2 labels, dialogs, validation messages, notifications, API errors, and workflow states.
- Kept Korean as the primary/default language.
- Retained the fixed desktop sidebar, independently scrolling navigation, visible active module, mobile drawer, and responsive forms/dialogs/tables.
- Retained active-tab refresh and post-create/update/delete/workflow refresh.

## Release engineering and QA

- Updated application, health endpoint, browser cache, and package identity to `28.2.0`.
- Kept Node.js `22.x`, configurable Render data/upload paths, additive SQLite migrations, and environment-only secrets.
- Added V28.2 static and isolated runtime API suites.
- Re-ran the complete V28.0, V28.1, and V28.2 API chain plus responsive, bilingual, localization, matching, and legacy static gates.
