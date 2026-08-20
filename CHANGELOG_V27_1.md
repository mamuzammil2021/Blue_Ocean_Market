# Blue Ocean Market V27.1.0

## Excavator
- Rebuilt Excavator dashboard aggregation so dashboard cards are calculated from the selected Excavator business unit's actual machines, lifecycle, purchases, costs, payments, buyers, suppliers and sales.
- Dashboard shows total machines, open/sold counts, purchase cost, logistics, repairs, parts, other costs, total machine cost, sales, gross profit/loss, payables, receivables and lifecycle counts.
- Sold machine cards use actual sale minus actual total machine cost; unsold machines show Not Sold.
- Existing Sold / Completed machines reopen their latest sale in Sell Machine instead of creating a blank new sale.
- Existing sale fields auto-load and the submit action changes to Update Sale.
- Updating a sale updates the same sale transaction, reverses/reallocates buyer advance allocations, refreshes the sale PDF, updates the machine and synchronizes the existing Finance source entry without creating a duplicate active Finance entry.
- Selecting an existing buyer automatically determines sale type from the buyer profile/country: local South Korea buyer => Local Sale; international buyer => Export Sale.
- Supplier Management > Machines button fix from V26.8 is preserved.
- Buyers loading/runtime fix from V26.7 is preserved.

## Approval System
- Added configurable approval rules per business unit.
- Supports Automatic, Operator, Manager, Finance, CEO and dual Finance + CEO approval levels.
- Added business-unit-scoped Approval Center and full approval history.
- Added configurable thresholds/conditions for large payments, machine purchases, loss/below-margin sales, payment voids, completed-sale updates, document deletion, inventory write-offs and buyer advance refunds.
- Financial/controlled void operations require a reason and preserve audit/history rather than silently deleting records.
- Added document workflow fields for Draft, Submitted, Approved and Final.

## People & Performance
- Added business-unit-scoped People & Performance module.
- CEO and authorized managers can create and assign work/tasks to users in their authorized business units.
- Tasks support priority, due date, complexity/work points, linked records, progress, review requirement, comments, attachments and history.
- Added configurable role/business-unit KPI rules and weighted system performance scores.
- Added manager evaluation, employee self-evaluation and review history for monthly/quarterly/yearly periods.
- Added workload, overdue, first-pass quality/rework, timeliness, reliability and business-result metrics.
- Added management performance alerts for overdue workload, repeated rework, overload, declining quality and strong performance.

## Daily / Weekly / Monthly Reports
- Users can submit structured Daily, Weekly and Monthly reports to Manager, CEO or both according to unit/role reporting rules.
- Reports support work completed, task summary, achievements, blockers, pending decisions, next-period plan, KPI updates, linked records and attachments.
- Manager/CEO review supports acknowledge/approve, return/reject, comments and follow-up task creation.
- Report versions, actions, timestamps and review history are preserved.
- Missing/late required reports can generate reminders/alerts and feed reliability/performance metrics.

## General
- Approval and People & Performance systems are platform-wide capabilities but are isolated and independently configurable by business_unit_id.
- CEO can work in a specific unit or consolidated scope; managers remain limited to authorized units.
- Fixed a pre-existing New Purchase form runtime reference that could prevent the form from opening.
- Cache/version markers updated to V27.1.0.
