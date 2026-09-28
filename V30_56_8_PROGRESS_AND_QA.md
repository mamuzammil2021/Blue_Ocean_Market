# V30.56.8 — controlled lease closure staging checkpoint

Built from V30.56.7. Adds a read-only lease closure readiness view and a controlled **fully settled, fully depreciated KRW lease** closure proposal that removes gross asset and accumulated depreciation through Posting Control. It refuses unposted/reversed commencement, repayments, lease events, residual carrying value, and outstanding linked refundable deposits. It creates no Finance movement and does not declare the agreement closed before the proposed journal is posted. It intentionally does NOT automate early lease termination, deposit settlement, partial-value disposal, or foreign-currency financing.

Remaining: original-currency financing, realized/unrealized FX and posted GL integration; complex lease modification/termination and settlement; end-to-end authenticated PDF, posting and reversal testing against backup Render data. STAGING ONLY; no database reset.

## Executed regression results
- `qa_v3568_lease_closure.js`: PASS.
- `qa_v3567_accountant_review.js`: PASS.
- `qa_v3566_financing_audit.js`: PASS.
- `qa_v3565_finalization.js`: PASS.
- `qa_v3562_journal_fixture.js`: PASS.
- `qa_v3564_finalization.js`: FAIL due to exact historic asset query suffix `?v=30.56.4` rather than current version; not counted as passing.
- `node --check server/v356-finalization.js`: PASS.
No actual Render deployment, lender-document verification or PDF runtime test performed. No claim of production readiness.
