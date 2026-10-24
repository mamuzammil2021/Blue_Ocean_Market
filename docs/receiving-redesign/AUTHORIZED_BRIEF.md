# BLUE OCEAN MARKET
# Complete Import & Packaging Materials Receiving, Discrepancy Management and Supplier Settlement Redesign

**Project:** Blue Ocean Market Management System  
**Business Unit:** Pink Salt  
**Scope:** Import Receiving, Packaging Materials Receiving, Supplier Claims, Credits, Refunds, Inventory, Finance and Accounting  
**Execution:** One consolidated, fully tested development build

---

## 1. Primary Objective

Redesign and complete the receiving workflows for both:

1. Pink Salt → Imports → Import Detail → Receiving
2. Pink Salt → Packaging Materials → Purchases → Purchase Detail → Receiving

Implement a consistent, modern, reliable receiving experience that allows users to receive multiple purchased categories or materials together while accurately managing partial deliveries, shortages, excess quantities, damaged goods, rejected goods, supplier responsibility, company responsibility, shared losses, replacement deliveries, refunds and credits.

**Do not create two unrelated receiving systems.**

Build reusable receiving, discrepancy, responsibility and settlement components wherever technically appropriate, while preserving the distinct operational and accounting requirements of imported salt and packaging materials.

The completed system must be easy for ordinary employees to use, without sacrificing financial accuracy, approval controls or traceability.

## 2. Mandatory Baseline and Development Protection

Before changing any code:

1. Find the latest protected Blue Ocean Market source in the Library or supplied project files.
2. Verify the actual latest version and examine the existing import and packaging receiving implementations.
3. Review database models, inventory movements, supplier profiles, payments, Finance, Accounting, approval workflows and historical records.
4. Identify existing reusable components and the current UI architecture.
5. Preserve every unrelated completed feature, especially prior QA fixes.
6. Do not start from an older source merely because it is easier to modify.
7. Do not delete or overwrite existing operational or financial history.
8. Preserve all established EN/KR bilingual, permission, approval, audit and routing rules.
9. Prefer shared services and database-level consistency over duplicated business logic.

Use a new Git branch. Do not directly modify or push to `main`.

Do not perform destructive migrations or automatic retrospective corrections.

## 3. Core Receiving Principles

The redesigned receiving workflow must distinguish:

- Quantity ordered.
- Quantity previously received.
- Quantity planned or expected for this delivery.
- Actual physical quantity delivered.
- Accepted and usable quantity.
- Quarantined quantity.
- Rejected quantity.
- Quantity not delivered but still expected.
- Confirmed shortage or loss.
- Excess delivered quantity.
- Quantity returned to supplier.
- Replacement quantity received later.

**Physical inventory status, supplier responsibility, financial settlement and purchase closure are independent concepts.**

The system must never automatically treat every partial receipt as a shortage, wastage, refund or supplier credit.

Missing goods must never be posted into warehouse inventory.

Quarantined and rejected goods must not become available for production or sale.

## 4. Receiving Screen — Modern Unified Experience

Create a clean, responsive receiving screen using the existing Blue Ocean Market UI design system.

Use full-screen pages for complex receiving work, with stable URLs. Use compact dialogs only for short, focused actions.

When opening Receive Shipment or Receive Materials:

Display all purchased categories or materials in one receiving session.

For each line, show:

- Product or material name.
- Grade, specification or variant.
- Purchase unit and stock unit.
- Total ordered quantity.
- Previously received quantity.
- Open quantity.
- Expected quantity for this delivery.
- Actual physically received quantity.
- Accepted quantity.
- Quarantined quantity.
- Rejected quantity.
- Missing or excess quantity.
- Actual net weight where applicable.
- Quality inspection result.
- Discrepancy indicator.
- Remarks and evidence when relevant.

Include a prominent **Receive All as Expected** action.

This should prefill expected quantities rather than immediately posting receipt.

Require employees to confirm that physical quantities and condition have actually been checked. The action must not bypass quality inspection or server-side controls.

Users must be able to modify individual lines after prefill.

When actual quantities differ from expected quantities, reveal the additional discrepancy fields only for affected lines.

Allow multiple discrepancies within a single line.

Provide a clear Review & Confirm screen before final submission.

Show a top-level protected processing overlay while recording the receipt. Prevent duplicate submissions and conflicting actions.

On successful submission, return the employee to the appropriate purchase detail page with updated totals.

## 5. Partial Deliveries and Multiple Receipts

A purchase can be received in several deliveries.

Example:

Import ordered: 1,000 bags.

First delivery: 800 bags.

Remaining: 200 bags.

The system must allow a second or subsequent receipt against the same import without creating another purchase.

A partial receipt must not automatically become a loss or financial claim.

Track cumulative quantities and independent receiving records.

Ensure:

- Previously received quantities remain immutable historical facts, subject only to controlled corrections.
- Remaining balances update automatically.
- Multiple receiving sessions cannot accidentally receive the same quantity twice.
- Concurrent submissions cannot exceed authorized quantities.
- Over-receiving requires a controlled excess-delivery workflow.
- Receipt corrections and reversals preserve audit history.
- Failed requests can be retried safely without duplicate stock movements.

The system should support partial receipt closure when the remaining quantity has been formally cancelled, written off or otherwise resolved.

## 6. Discrepancy Classification

Support the following discrepancy reasons:

1. Partial delivery — balance arriving later.
2. Supplier shipped fewer goods.
3. Transit loss.
4. Spillage or leakage.
5. Damaged packaging.
6. Contamination or quality failure.
7. Wrong grade, specification or product.
8. Excess delivery.
9. Weight difference.
10. Counting or measurement discrepancy.
11. Other — mandatory explanation.

Allow multiple reasons within a category or material line, each with its own quantity.

A discrepancy must record whether it represents:

- Pending delivery.
- Confirmed loss.
- Quality issue.
- Excess delivery.
- Pending investigation.

Do not allow the same quantity to be classified in contradictory ways.

For physical goods, reconcile received quantities into accepted, quarantined and rejected dispositions. Track returns and releases as separate movements.

For undelivered quantities, distinguish future deliveries from confirmed shortfalls.

Keep discrepancy status separate from receipt status.

## 7. Supplier, Company and Shared Responsibility

Support responsibility allocation for every confirmed discrepancy or claim.

Options:

- Supplier responsible.
- Blue Ocean Market responsible.
- Carrier or insurer responsible.
- Shared responsibility.
- Pending investigation.

For shared responsibility, allow the user to distribute the financial liability through either:

- Percentage allocation.
- Fixed currency amounts.
- Quantity-based allocation where meaningful.

Allow allocations across multiple responsible parties, including the supplier, company and carrier/insurer, where a case requires it.

The total allocation must reconcile to the agreed claim value.

### Example

White Salt expected: 200 bags.  
Actual delivered: 20 bags.  
Shortage: 180 bags.  
Illustrative agreed claim value: USD 1,800.

Supplier responsibility: 85% = USD 1,530.  
Blue Ocean responsibility: 15% = USD 270.

Record the allocation without creating stock, cash or credit automatically.

Use a compact interactive responsibility calculator similar to the ChatGPT example previously discussed:

- Percentage slider.
- Editable precise percentage or value fields.
- Live recalculation.
- Visual allocation bar.
- Side-by-side financial summary cards.
- Validation that responsibility totals equal 100% or the approved claim value.

Do not rely solely on slider increments for financial precision.

Responsibility remains provisional until the required authorized agreement and approval are completed.

Preserve the original allocation and an auditable history of later changes.

## 8. Discrepancy Case Management

Create persistent discrepancy cases linked to the original purchase and receipt.

Each case should contain:

- Unique case number.
- Import or packaging purchase reference.
- Relevant receipt.
- Category or material.
- Discrepancy type.
- Quantities and units.
- Relevant monetary values and currency.
- Evidence, photos and documents.
- Proposed responsibility.
- Confirmed responsibility.
- Assigned employee.
- Supplier or carrier response.
- Investigation notes.
- Follow-up date.
- Agreed settlement.
- Approval history.
- Related replacement, return, credit or refund transactions.
- Remaining unresolved quantity and financial amount.
- Audit history.

Suggested lifecycle:

**Open → Under Investigation → Proposed Resolution → Awaiting Approval → Agreed → Partially Settled → Settled → Closed**

Support rejection, reopening and controlled amendments.

A discrepancy case should remain open when approved replacements, credits, refunds or other obligations are still pending.

Provide a Claims & Adjustments section in the existing centralized supplier profile, together with links from the original import or packaging purchase.

## 9. Supplier Settlement Options

Once responsibility and claim value are agreed, support:

### A. Remaining Goods Delivered Later

Keep the quantity outstanding until physically received.

Link later deliveries to the original purchase and discrepancy case.

No financial credit should be created merely because a delivery is delayed.

### B. Replacement Goods

The supplier agrees to send replacement goods.

Track:

- Replacement authorization.
- Expected quantity.
- Expected delivery date.
- Actual replacement receipt.
- Quality acceptance.
- Remaining replacement obligation.

Replacement goods must be physically received before inventory increases.

Prevent the same shortage from being compensated by both full replacement and full financial credit unless the agreement explicitly supports additional compensation.

### C. Invoice or Bill Reduction

If the relevant invoice remains unpaid, allow an approved supplier adjustment to reduce the outstanding payable.

Preserve the original invoice and create a linked adjustment, debit/credit-note record or appropriate Accounting transaction.

Do not rewrite the original invoice.

### D. Future Purchase Credit

Allow an approved recoverable amount to become supplier adjustment credit where permitted by the agreement.

This credit must:

- Remain linked to its original discrepancy or adjustment.
- Be distinguished from cash advances.
- Have its own approval and availability status.
- Show original and remaining balances.
- Support controlled allocation to future eligible purchases.
- Never create fictitious bank or cash transactions.

### E. Cash Refund

Support full and partial refunds from suppliers.

Distinguish:

- Refund requested.
- Refund agreed.
- Refund due.
- Refund partially received.
- Refund fully received.

Record real refunds only when money is actually received.

Require receiving company account, transaction amount/currency, exchange details where applicable, date, reference and evidence.

Create exactly one corresponding cash receipt in Finance and appropriate Accounting postings.

### F. Mixed Settlement

Support one claim being resolved through multiple methods.

Example:

Supplier liability: USD 1,000.

- USD 400 settled through bill adjustment.
- USD 350 through future purchase credit.
- USD 250 through cash refund.

Track each obligation independently.

Do not allow total settlements or allocations to exceed the approved recoverable amount.

### G. Company-Accepted Loss

When Blue Ocean accepts responsibility, record an authorized company loss or other appropriate inventory/cost adjustment.

Apply the correct approved Accounting treatment.

Do not automatically capitalize abnormal shortages or spread all losses across accepted inventory.

## 10. Centralized Supplier Profile

Continue using the existing Pink Salt supplier master.

Do not create separate supplier masters for Imports and Packaging Materials.

Supplier profiles should show:

- Import-related purchases.
- Packaging material purchases.
- Cash advances.
- Approved supplier adjustment credits.
- Available advance and credit balances.
- Reserved and allocated balances.
- Refunds due.
- Actual refunds received.
- Pending and disputed claims.
- Supplier statements.
- Supporting documents.
- Related financial history.

Maintain separate balance sources for cash advances, adjustment credits and refund receivables.

Show balances by original currency.

One supplier may serve both Imports and Packaging Materials, subject to current eligibility and permissions.

Cross-BU allocations must not occur automatically.

Do not treat adjustment credits as money actually paid.

## 11. Future Purchase Payment Allocation

Extend the existing payment framework so eligible supplier credits can be used alongside actual advances and new payments.

Offer context-appropriate settlement choices:

1. Available Advance / Credit Only.
2. New Payment Only.
3. Advance / Credit + New Payment.

Display each available source separately.

For example:

Supplier cash advance: USD 500.  
Supplier adjustment credit: USD 300.  
New invoice: USD 1,000.

The user could allocate USD 500 advance, USD 300 credit and USD 200 new payment.

Only USD 200 represents new cash movement.

Each credit or advance application must create a non-cash allocation linked to the proper source and purchase.

Preserve the existing payment approval and Finance verification sequence.

Use controlled server-side balance checks, allocation locking and database transactions to prevent over-allocation or reuse.

Show clearly which supplier balance source was consumed, and how much remains.

## 12. Import Receiving — Specific Requirements

For Pink Salt Imports, support all purchased salt categories within the same receiving session.

Record actual bag count and actual net weight independently.

Do not assume bag counts and net weight always reconcile at nominal weight.

Support:

- Salt category and grade.
- Expected bags.
- Actual received bags.
- Nominal unit weight.
- Actual net weight.
- Quantity and weight discrepancies.
- Accepted stock.
- Quarantined stock.
- Rejected stock.
- Supplier shortages.
- Transit losses.
- Partial deliveries.
- Later replacements.
- Lot and batch traceability.
- Warehouse stock movement.
- Import costing adjustments.

Preserve existing import cost records, exchange rates, customs charges, freight and other landed-cost components.

Financial recovery must be valued according to the original supplier agreement and approved claim.

Do not automatically assume freight, customs duties or other landed costs are recoverable.

Apply approved inventory valuation policies when determining how purchase adjustments and actual losses affect remaining inventory.

Maintain accurate downstream raw-material availability and production costing.

## 13. Packaging Materials Receiving — Specific Requirements

Apply the same receiving philosophy to Packaging Materials purchases.

Support all materials on a purchase within one receiving session.

Examples include:

- Salt pouches.
- Printed labels.
- Cartons.
- Seals.
- Bags.
- Other packaging components.

Support purchasing and stock units such as pieces, packs, cartons, rolls, kilograms or other configured units.

Preserve each material's unit-conversion configuration.

Example:

Purchase quantity: 10 cartons.  
Configured conversion: 1,000 pouches per carton.  
Expected stock quantity: 10,000 pouches.

Allow actual receipt and inspection with controlled unit conversion.

Manage:

- Full and partial receipts.
- Material shortages.
- Excess quantities.
- Printing defects.
- Incorrect sizes.
- Wrong material specification.
- Damaged packaging.
- Rejected or quarantined materials.
- Supplier returns.
- Replacement receipts.
- Adjusted purchase costs.

Only accepted, released material stock should become available for production BOM consumption.

Receiving must not break material stock balances, reservations, production usage, lot/batch traceability or finished-product costing.

## 14. Quality Inspection and Inventory Disposition

Physical quantity received must not be confused with usable inventory.

For each physically received line, users should be able to allocate quantities to:

- Accepted / usable.
- Quarantined.
- Rejected.

Provide controlled workflows to:

- Release quarantined goods.
- Reject quarantined goods.
- Return rejected goods to supplier.
- Dispose of approved damaged goods.
- Correct an inspection or quantity record.
- Record replacement receipts.

Every action affecting inventory must create the correct traceable stock movement.

Prevent negative or duplicate inventory and unauthorized quantity changes.

A supplier's financial responsibility should remain independent of the physical inspection outcome.

## 15. Finance, Accounting and Currency Integrity

Preserve Blue Ocean Market's KRW-based Accounting engine and supported transaction currencies, including KRW, USD and PKR.

Separate:

- Original invoice amount/currency.
- Agreed claim amount/currency.
- Supplier adjustment credit.
- Cash advance.
- Invoice reduction.
- Refund receivable.
- Actual refund received.
- Company-accepted loss.
- Accounting valuation and FX differences.

Use explicit FX currency pairs, rate direction, applicable date and valuation purpose.

Never use an exchange rate of 1 to imply USD or PKR equals KRW.

Same-currency transfers do not require a fictitious transfer conversion.

Cross-currency allocations and refunds require controlled valuation and reconciliation.

Preserve the existing distinction between transaction currency, source account currency, recipient currency and KRW reporting values.

Only actual cash payments or receipts should create new cash/bank movements.

Non-cash invoice adjustments and advance/credit allocations must not create fake cash flows.

Preserve the integrity rule:

**One actual cash event → one linked Finance cash record.**

Operational approval must occur before Finance verification whenever approval is required.

The Accounting engine must correctly handle:

- Supplier payable reductions.
- Supplier advances.
- Adjustment credits and allocation.
- Refund receivables and receipt.
- Inventory valuation adjustments.
- Approved inventory losses.
- Exchange differences.
- Returns and reversals.

Use original financial records plus controlled linked adjustments, not silent overwriting.

## 16. Approval and Authorization Controls

Reuse the existing L0–L5 approval architecture and CEO/Owner authorization rules.

Approval requirements must depend on role, configured thresholds, financial impact and risk.

Do not require approval for every normal receipt or ordinary purchase merely because approval functionality exists.

Use controlled approvals for cases such as:

- Material financial claims.
- Supplier credit issuance.
- Refund settlements.
- Company-accepted losses.
- Significant responsibility reallocations.
- Large stock adjustments.
- Cross-currency settlement exceptions.
- Sensitive financial corrections.

Required approval tasks must include full transaction context, affected amounts, evidence, responsible parties and the proposed resolution.

Notify the designated approver using existing in-app notifications.

Use important-only email notifications for qualifying urgent or high-risk approvals under the established notification policy.

Finance verification must not proceed until required approvals have been completed.

## 17. UI/UX Requirements

Follow the established responsive application design system and reusable component strategy.

Where useful, incorporate interactive UI elements inspired by the previously discussed ChatGPT responsibility calculator:

- Compact allocation sliders.
- Precision numeric inputs.
- Live calculations.
- Percentage distribution bars.
- Financial summary cards.
- Clear remaining-balance indicators.
- Quantity reconciliation visuals.
- Contextual discrepancy sections.
- Inline validation.
- Clean confirmation screens.

Do not overuse sliders or decorative charts.

Prioritize accurate data entry, clarity and fast operation.

Use concise, clearly grouped form fields.

Keep primary action buttons visible.

Avoid scattered controls, oversized buttons, unnecessary right-side whitespace and excessively wide dialogs.

Use full-screen pages for complex receiving, claim and financial record details.

Maintain stable deep URLs, browser Back/Forward support, direct refresh hydration and correct selected-tab restoration without rendering intermediate parent pages.

Provide complete English/Korean localization for all new interfaces, validation, statuses, reports and notifications.

## 18. Receipt, Claims and Supplier Reports

Add appropriate views and downloadable reports for:

- Import receiving history.
- Packaging material receiving history.
- Ordered vs received vs remaining quantities.
- Shortage and damage reports.
- Outstanding supplier deliveries.
- Supplier discrepancy cases.
- Responsibility allocation and company losses.
- Supplier credits and allocations.
- Refunds due and received.
- Replacement delivery history.
- Supplier financial statements.
- Receipt and claim audit histories.

Reports must reconcile with current operational and Accounting data.

Provide suitable PDF exports where applicable, with correct currency labels, dates, supplier references, line details and totals.

Do not mix amounts from different currencies into a misleading single total.

## 19. Data Migration and Existing History

Preserve existing purchases, receipts, inventory movements, supplier advances, payments, Finance records and Accounting postings.

Introduce new schema and services through safe, versioned migrations.

Preserve historical record IDs, relationships and references wherever possible.

Do not automatically classify historical partial receipts as supplier shortages.

Do not automatically create supplier credits, losses or refunds from historical receiving differences.

If existing data requires reconciliation, produce a reviewable exception report and a controlled repair or transition plan.

For already posted financial records, use approved corrections and linked reversals rather than destructive updates.

The migration must be retry-safe and support rollback or recovery.

## 20. Reliability and Security

Ensure backend-enforced correctness.

Required safeguards:

- Database transactions for receipt and stock posting.
- Decimal-safe quantities and financial calculations.
- Idempotency keys for serious mutations.
- Protection against double receipt posting.
- Protection against duplicate stock movements.
- Protection against repeated credit/refund allocation.
- Concurrency checks on remaining quantities and financial balances.
- Server-side role and approval enforcement.
- Immutable audit trails.
- Atomic processing or safe compensation/reconciliation across subsystem boundaries.
- Clear error handling.
- Controlled correction and reversal paths.
- No silent partial success.

If a receiving operation partially fails, the user must not be left with inconsistent inventory or financial balances.

Do not use UI-only checks as a substitute for server validation.

## 21. Mandatory End-to-End QA

Test the complete workflow against realistic examples.

### Receiving Cases

- All categories received exactly as expected.
- Multiple categories received simultaneously.
- Only one category partially received.
- Several categories with different discrepancies.
- Partial delivery followed by second receipt.
- Short delivery followed by supplier replacement.
- Supplier confirms fewer goods shipped.
- Transit loss.
- Excess delivery.
- Net-weight difference with correct bag count.
- Damaged or contaminated goods.
- Quarantine followed by acceptance or rejection.
- Supplier return.
- Receipt correction and reversal.

### Responsibility Cases

- Supplier 100% responsible.
- Blue Ocean 100% responsible.
- Supplier and company each 50%.
- Supplier 85%, company 15%.
- Carrier or insurer responsible.
- Multiple-party responsibility.
- Responsibility pending investigation.
- Responsibility amended after approval.
- Partial claim agreement.
- Disputed claim.

### Supplier Settlement Cases

- Original invoice unpaid.
- Original invoice partly paid.
- Original invoice fully paid.
- Approved invoice reduction.
- Supplier future purchase credit.
- Partial cash refund.
- Full cash refund.
- Replacement goods.
- Mixed settlement.
- Credit allocated to a later purchase.
- Advance and credit combined.
- Credit plus new payment.
- Refund received in a different currency.
- Correction and reversal after settlement.

### Inventory and Accounting Cases

- Correct usable stock quantities.
- Quarantined stock unavailable for production.
- Rejected goods excluded from usable stock.
- Raw-material lot traceability intact.
- Packaging BOM stock deduction intact.
- No duplicated receipt or financial entries.
- No double counting of credit, refund or replacement.
- Correct KRW valuation for USD and PKR.
- Correct company and supplier responsibility accounting.
- Correct historical and revised supplier statements.
- Approval-before-Finance-verification enforcement.

### Reliability Cases

- Simultaneous receiving submissions.
- Repeated Save clicks.
- Browser refresh during processing.
- Failed network response after successful server commit.
- Concurrent credit allocations.
- Concurrent refund records.
- Direct deep-route reload.
- Back/Forward navigation.
- EN/KR layout and PDF verification.
- Mobile and desktop responsive behavior.

## 22. Implementation Acceptance Criteria

Do not mark the feature complete until all of the following are true:

1. Import and Packaging Materials both support coherent multi-line receiving.
2. Exact and partial receipts work correctly.
3. Previously received and remaining quantities always reconcile.
4. Physical inventory accurately reflects accepted, quarantined and rejected quantities.
5. Missing goods never enter warehouse stock.
6. Multiple discrepancy reasons can be recorded accurately.
7. Supplier, Blue Ocean and shared responsibility are supported.
8. Discrepancy cases are traceable from the purchase and supplier profile.
9. Supplier replacements, credits, refunds and bill adjustments reconcile.
10. No supplier recoverable value is compensated twice.
11. Future purchases can use eligible supplier credits without fictitious cash payments.
12. Real supplier refunds create correct linked cash receipts.
13. Existing approval, Finance and Accounting controls remain intact.
14. Cross-currency transactions and KRW values are correct.
15. Historical records remain preserved.
16. EN/KR bilingual UI and relevant exports work.
17. Serious operations are protected against duplication, concurrency and partial posting.
18. All mandatory regression tests pass.

## 23. Delivery Expectations

Complete the work in a consolidated, tested development build based on the newest verified protected source.

Before delivery:

- Run automated tests and appropriate builds.
- Run regression checks for Imports, Packaging Materials, Suppliers, Payments, Finance, Accounting, Inventory and Production.
- Check database migrations.
- Validate real workflow examples.
- Document any remaining policy decisions, assumptions or limitations.
- Do not represent untested functionality as completed.

Provide:

1. A versioned, Git-ready source ZIP.
2. A summary of architectural and database changes.
3. A detailed completed-features checklist.
4. QA results with pass/fail status.
5. Any remaining issues or policy-dependent functionality.
6. Migration and deployment instructions.
7. Git push instructions using a new branch, without modifying `main`.

## 24. Policy Decisions Requiring Special Attention

Before activating any financial rule that depends on company policy, identify whether it has already been authorized in the latest protected project.

In particular, review:

- Monetary thresholds for claim and loss approval.
- When provisional supplier credits become spendable.
- Whether disputed credits can be reserved but not allocated.
- Cross-currency credit allocation policy.
- Treatment of company-accepted inventory losses.
- Recoverability of freight, customs and related charges.
- Treatment of claims against carriers or insurers.
- Supplier credit use across eligible purchases and business units.
- Rules for closing partially fulfilled purchases and claims.

For any unresolved policy-dependent behavior, implement the structural support and safe controls, but do not invent financial authorization or automatically post unsupported transactions.

Document the exact decision required and ensure the remainder of the implementation can function safely.

## Final Instruction

This is a coordinated redesign of physical receiving, discrepancy tracking, supplier responsibility and settlement across Pink Salt Imports and Packaging Materials.

The goal is to make receiving fast and intuitive for employees while maintaining accurate stock, supplier balances, approvals, Finance and Accounting.

**Do not solve discrepancies merely by blocking transactions. Implement the underlying receiving, claim, allocation and settlement lifecycle so valid business cases can be completed and reconciled.**

Preserve all unrelated Blue Ocean Market features and existing financial history.

Perform the complete work carefully, verify the outcome and deliver a production-oriented, Git-ready consolidated build.
