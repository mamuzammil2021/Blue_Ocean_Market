# V30.56 consolidated finalization — implementation and QA checkpoint

## Source implementation
Built from V30.56.8. Includes separately integrated foreign-currency financing register (`server/v356-final-foreign.js`) and lease modification / settled early-termination proposals (`server/v356-final-lease.js`), with `public/v356-final-ui.js` and server route registration. Foreign register retains original-currency principal, FX rate and KRW carrying; links existing verified Finance receipts/payments, creates only cash-neutral accounting proposals for recognition/reclassification and revaluation, and rejects duplicate linking. Lease modification requires lender reference, accounting policy and original accounts; termination requires settled liability and no outstanding deposit, and derecognizes the recognized asset through pending Accounting review. No synthetic Finance transaction is created by the focused fixtures.

## Executed checks on this package
PASS: `node qa/qa_v356_final_foreign.js`
PASS: `node qa/qa_v356_final_lease.js`
PASS: `node qa/qa_v3568_lease_closure.js`
PASS: `node qa/qa_v3567_accountant_review.js`
PASS: `node qa/qa_v3566_financing_audit.js`
PASS: `node qa/qa_v3565_finalization.js`
PASS: `node qa/qa_v3562_journal_fixture.js`
PASS: `node qa/qa_v3562_financing_integration.js`
PASS: `python3 qa/sql_v354_integrity.py`
PASS: Node syntax checks of server/server.js, v356-final-foreign.js, v356-final-lease.js and public/v356-final-ui.js.

Legacy checks not green in unchanged form: `qa_v354_integrity.js` (exact old version assertion), `qa_v356_workspace.js`, `qa_v3561_financing.js` and `qa_v3563_financing_compat.js` (including outdated mocks), `qa_v3563_financing.js` (expected old test count), `qa_v3563_workspace_compat.js`, `qa_v3564_finalization.js`. These are NOT counted as passing. Do not interpret targeted fixtures as complete regression coverage.

## Remaining before production sign-off
Authenticated browser testing of all routes/UI; test against backed-up actual persistent Render data; bank account and lender statement reconciliation; controlled Posting Control approvals, reversals and post-reversal state; PDF generation/download on Render; accountant approval of FX and lease policies; cross-business-unit permissions and EN/KR review. Lease settlement requires actual Finance records; complex nonstandard contract treatment still requires an accountant-led adjustment rather than an automatic cash movement. No production database was opened or changed in preparing this archive.

STATUS: CONSOLIDATED STAGING CANDIDATE; NOT PRODUCTION VERIFIED. Do not reset database or persistent disk.
