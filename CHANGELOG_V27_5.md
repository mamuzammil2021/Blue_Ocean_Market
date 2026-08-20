# Blue Ocean Market V27.5.0

## Main changes
- Replaced generic browser confirmations/prompts with contextual in-app transactional dialogs.
- Removed periodic/focus-based client polling; visible data refreshes after user mutations/navigation instead of timer refresh.
- Expanded Finance Verification & Control with review queues, source/evidence comparison, warnings, controlled correction/rejection, bulk low-risk verification, protected verified records, change/void approvals, and improved audit notifications.
- Enforced evidence for final Finance verification (CEO explicit override supported) and CEO review for critical verification warnings.
- Strengthened source linkage/backfill for Purchases and Sales and excluded voided Finance records from dashboard/P&L totals.
- Added English/Korean i18n infrastructure with English default and per-user language preference.
- Added responsive UI overrides for desktop, laptop, tablet and mobile, including Finance review and decision dialogs.
- Fixed the Business Unit form runtime issue caused by an unrelated lifecycle-stage field.
- Preserved V27.4 navigation, notification panel, approvals, tasks/performance, meetings, Excavator buyer/supplier/sale, Finance source synchronization and Git/Render readiness.
