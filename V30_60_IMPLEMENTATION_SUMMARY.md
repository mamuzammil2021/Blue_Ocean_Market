# Blue Ocean Market V30.60.0 — Accounting Posting Control & Report Controls

## Scope completed

### Posting Control bulk posting
- Added bulk selection for ordinary eligible Posting Control proposals.
- Supports Select Page, Select All Ready Matching Search, Clear Selection and Post Selected.
- Bulk posting is limited to 100 entries per batch.
- Bulk eligibility preserves the normal maker/checker, Finance-verification, balanced-journal, period-open and permission controls.
- Accounting Reversals, Manual Journals, Financing proposals and Opening/Migration proposals remain individual controlled workflows.
- Bulk Review & Confirm shows ready/blocked counts and total debits/credits before final posting.
- Final bulk posting runs inside one SQLite transaction. An unexpected state/error rolls the entire batch back.
- Added posting batch and batch-item audit tables plus batch number traceability in posting history.

### Posting Control dashboard
- Added operational KPI cards for Ready to Post, Blocked/Needs Attention, Correction/Reversal Cases, Posted Today and Oldest Ready Entry.
- Added dynamic selected-entry debit/credit summary.
- Preserved individual Open/detail review for every proposal.
- Added Posting Control PDF report.

### Finance correction reversal automation
- A verified Finance correction now treats the reversal of the previously posted journal as a mechanical correction consequence.
- If the original journal was posted, the exact mirrored reversal is reused/created and automatically posted after the corrected Finance record is verified.
- The corrected replacement transaction still creates/uses the normal Posting Control proposal and remains subject to final Accounting review/posting.
- If the original proposal was never posted, no cash/GL reversal is fabricated; the superseded pending proposal follows the existing cancellation/supersession behavior.
- Duplicate effective reversal chains create a critical Accounting exception and block automatic posting.
- Closed current accounting period creates a controlled exception rather than silently reopening a period.
- Existing historical Render data is not scanned on startup to create reversals. A read-only reconciliation endpoint classifies existing reversal chains.

### System-wide protected processing visibility
- Important mutations now use the shared top-level `processingRoot` overlay above screens and modals rather than a local section/modal overlay.
- Add/Edit/Update/Save/Approve/Verify/Posting/Payment/Receipt/Refund/Transfer/Allocation/Void/Reverse and similar mutations are classified as protected transaction actions.
- Escape is blocked while a protected mutation is active; the top-level overlay blocks conflicting pointer actions and duplicate submission.
- Existing coordinated success/error handling remains the single primary feedback channel.

### Accounting report PDFs
Added report-specific server-generated PDFs built from official Accounting data rather than DOM screenshots:
- Balance Sheet
- Income Statement / Profit & Loss
- Trial Balance
- General Ledger / Account Statement
- Cash Flow Statement
- Management Accounting summary
- Bank Reconciliation Review
- Source Reconciliation
- Year-End Readiness Review
- Posting Control report

Each PDF includes report-specific scope/context, period/as-of date, BU scope, currency where relevant, useful totals, relevant rows and report basis. PDF endpoints preserve Accounting access controls and BU scope.

## Data safety
- No Render database/disk reset.
- No historic journal rewrite.
- No automatic deployment-time creation of historical correction reversals.
- Bulk posting and automatic correction reversals are idempotency/eligibility guarded.
- One real cash movement remains one Finance record; this build changes Accounting posting control, not Finance cash generation.
