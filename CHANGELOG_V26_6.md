# Blue Ocean Market V26.6.0

## UI and Excavator corrections
- Business-unit switching always opens that unit's Dashboard.
- Navigation sidebar is foldable/collapsible and remembers its state.
- Navigation tabs show appropriate icons.
- Excavator Notifications now provide direct navigation to related machine, buyer, or finance records when an action target exists.
- Excavator machine/deal cards no longer display Payment/Paid/Outstanding information.
- Excavator machine cards show realized Profit/Loss only after the machine is sold; unsold machines show Not Sold.
- Removed obsolete Payment Pending machine filter/dependency from the machine list UI.
- Existing backend payment/finance synchronization remains intact; payment records continue to flow to Finance and void reasons remain audited.

## V26.6 verification note

Static verification completed for backend syntax, frontend syntax, legacy QA, buyer/sale QA, and Excavator/Finance/UI QA. Runtime dependency installation could not be completed in this environment because npm install timed out; therefore a live server/database runtime test could not honestly be marked passed. No new npm dependencies were introduced.
