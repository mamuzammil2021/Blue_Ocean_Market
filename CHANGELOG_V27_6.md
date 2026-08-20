# Blue Ocean Market V27.6.0

## Cross-module integrity and synchronization

- Added a scoped, read-only reconciliation API covering the financial and Excavator records that must stay linked.
- Added CEO dashboard visibility for critical data-integrity exceptions and warnings.
- Detects duplicate active Finance source records, sold machines without a completed sale, completed sales without Finance linkage, missing automatic sale PDFs, cross-unit buyer links, buyer-payment over-allocation, and purchased supplier listings incorrectly left available.
- The checker respects CEO consolidated scope, selected business-unit scope, and assigned-unit restrictions.
- No correction, deletion, or financial mutation is performed silently; the panel reports exceptions for controlled investigation.
- Preserved the complete V27.5 Finance verification, Korean/English UI, responsive layouts, Meetings, Approval, People & Performance, and Excavator regression coverage.

## Verification

- Added `qa/qa_v276_complete.js` and retained prior regression suites.
- Updated application, health endpoint, asset cache, and package versions to 27.6.0.
