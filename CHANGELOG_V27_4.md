# Blue Ocean Market V27.4.0

## Navigation & UX
- Added platform-wide browser/in-app history integration with Back/Forward controls and breadcrumbs.
- Preserves active business-unit/module context and restores common filter/search controls and scroll position when returning to a view.
- Added unsaved-change protection for forms and modal/subview close actions.
- Business Units sidebar item is visible only to CEO in All Business Units — Consolidated context.
- CRM and KPIs were removed from sidebar navigation for all users.

## Notifications
- Fixed duplicate notification-bell implementation that overrode the closable dialog.
- Notification panel now closes with X, bell toggle, outside click, and Escape.
- Notification actions open related records while preserving navigation history.

## Finance Control Center
- Redesigned Finance into source/evidence verification workspace.
- Added overview metrics, Pending Verification, corrections/voids, income/expense filtering, search, and source-linked transaction rows.
- Added Open Transaction view with Financial Record, Source & Evidence, attachments/receipt, linked approvals, verification control, and timeline.
- Rejection/correction requires a reason. Verified entries are locked from ordinary edits.
- Added Request Change for verified records through approval workflow.
- Finance source synchronization is scoped by business unit + source type + source id to avoid cross-unit collisions and duplicate active entries.
- Added original currency, FX, KRW accounting amount, transaction date, source label/record/payment identifiers.
- Manual Finance entries now capture transaction date, original currency and FX rate.
- Buyer payments and Excavator sale Finance sync preserve historical original currency and FX information.

## Synchronization
- Existing immediate post-mutation refresh remains enabled.
- Added safe periodic visible-data refresh and focus refresh to pick up changes from other sessions without interrupting active forms/modals.

## Live/Git testing readiness
- Version bumped to 27.4.0 and health endpoint reports 27.4.0.
- Server binds to 0.0.0.0 for container hosting.
- Added deployment/checklist documentation and Docker ignore rules.
