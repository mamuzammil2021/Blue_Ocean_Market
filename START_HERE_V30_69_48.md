# V30.69.48 — Supplier and import settlement summaries

Built on V30.69.47 plus the verified System Settings entry hotfix. Includes all six approved UI/data-update points. Advances and claim credits remain separate.

- Supplier claim cards now appear above profile tabs, grouped by currency. Only relevant available credit, awaiting posting/on-hold balances and refund/recovery amounts appear. Used credit remains in detailed history. Net Position identifies its calculation basis and is not presented as a payment instruction.
- Import Total Covered includes active cash, advance and Purchase Credit applications. The component cards show New Payments, Advance Balance Used and Claim Credit Applied. Signed invoice adjustments are separate from coverage. Native displayed equivalents use invoice valuation; original credit/target currencies and KRW are retained in application records.
- Import Supplier Payments and Supplier Profile Advances & Payments expose distinct non-cash credit applications, status and reversal history. No new Finance records or journals are created by these summaries.
- Existing save/navigation refreshes use the current record; targeted supplier refresh also refreshes claim cards and flags. Active supplier/import pages refresh on focus and every 30 seconds while visible, pausing during receiving edits, modals, confirmations and processing. Stable routes and selected tabs are preserved.
- Import actions use equal responsive grid sizing and compact receiving issue summaries. Resolved issues are collapsed into history; active issues show missing quantities, recorded methods and next steps.
- EN/KR and desktop/tablet/mobile behavior covered by browser checks.

## Accounting setup

The accounting workbook and approved policy are unchanged from V47. If not already activated, sign in as CEO / Owner, select Pink Salt and choose System Settings → Receiving & Claims Policy → Apply Approved Workbook Settings, then review and authorize. Claim credit becomes available only after Accounting posting. An active allocation reserves/settles the operational invoice balance immediately; its awaiting-posting status is shown until its journal is posted.

See V30_69_48_QA_REPORT.md and V30_69_48_DEPLOYMENT.md. Earlier release reports are historical.
