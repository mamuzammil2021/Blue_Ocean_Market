# Changelog — V28.3.0

## CEO direct control

- Removed approval waiting for CEO/Owner actions.
- Added mandatory server-driven confirmation and authorization note before a CEO executes a controlled action.
- Stored direct authorization, note, decision, result, and audit history.
- Kept high-risk actions protected without creating a self-approval queue.

## Reviewer integrity and execution

- Made dual control revision-aware and prevented self-review after resubmission.
- Treated a Finance-originated dual request as the Finance initiation and routed it to an independent CEO.
- Exposed the current waiting stage and exact eligible reviewer names/roles.
- Automatically executed supported approved actions for Finance creation/change, financial voids, buyer payments/refunds, documents, inventory write-offs, sales, and Excavator purchases/sales.
- Added safe retry for approved actions whose automatic execution failed.
- Replaced unsupported silent/manual outcomes with a visible execution error.

## Buyer payments and refunds

- Completed the buyer-payment deletion workflow: request, Finance review, CEO review, automatic payment void, allocation reversal, linked Finance void, and retained history.
- Added evidence-backed buyer advance refunds with available-balance validation and automatic Finance Expense posting.
- Added buyer refund history, receipt access, approval state, pending-void indication, and controlled reversal.
- Restored available advance after an approved refund void.
- Added source-specific refund correction fields and atomic source/Finance updates.

## Finance correction workflow

- Added the missing default rule for changing a verified Finance record.
- Made final approval change the record to **Correction Required** and create the original creator's linked correction task automatically.
- Kept every source field editable only by the original creator assigned to that correction.
- Retained snapshots, field changes, evidence, reminders, tasks, resolution, and performance measures.

## Navigation, language, and development data

- Scoped Approval badges to relevant pending requester/reviewer work and omitted zero values.
- Retained fixed responsive navigation, active-tab visibility, same-tab refresh, and mutation refresh.
- Added Korean/English mappings for all V28.3 UI and backend messages; Korean remains default.
- Added opt-in, additive development users and clearly labelled sample data without any reset/delete behavior.

## QA and release engineering

- Updated package, health, startup, and browser-cache identity to `28.3.0`.
- Added V28.3 static and isolated runtime suites.
- Tested CEO confirmation/direct execution, Finance→CEO sequencing, Finance-requester deadlock prevention, creator correction, buyer-payment void, refund create/correct/void, badge visibility, evidence rules, and system integrity.
- Re-ran responsive, Korean-first, localization, matching, Finance privacy/correction, and supplier-machine regressions.
