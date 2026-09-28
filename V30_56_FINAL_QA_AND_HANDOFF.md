# V30.56 source finalization — QA and deployment handoff

## Completed in this pass
- Corrected inconsistent release metadata in package.json, package-lock.json, health endpoint and current Accounting script cache keys.
- Regenerated the compressed index asset from the current HTML to avoid a stale served UI.
- Restored a non-secret .env.example template with reset disabled by default.
- Added `npm run qa:v356:consolidated` (tests current source and runs historical checks with only obsolete test expectations adapted in-memory; original historical test files are preserved).
- Kept the prior foreign-financing, lease lifecycle, reconciliation, posting and financial integrity modules unchanged in this QA finalization pass.

## Scope and limitations
This is a source-complete staging release candidate, NOT proof of production readiness. The consolidated suite and SQL fixture are offline tests. Historical older-version checks remain historical and are not counted as full current-release coverage. Authentic browser/account roles, real persistent-data migration, lender agreement reconciliation, live PDF/Chromium, transaction posting/reversal and cross-BU operational regression require deployment to a separate staging service with a backup copy of existing data. Do not reset or overwrite the live persistent disk.

## Deployment verification checklist
1. Back up SQLite DB and uploads; deploy on staging branch using a copied database.
2. Confirm /api/health version 30.56.0, mounted writable disk and correct BU permissions.
3. Create KRW/USD test financing records; link exactly one verified original receipt and repayment; confirm no duplicate Finance entries.
4. Post eligible proposals through Posting Control; confirm bank ledger unchanged by cash-neutral reclassification, proper loan principal/interest/FX lines.
5. Test pending/posted reversals, lease modification/termination conditions, reconciliation invalidation and PDF download.
6. Re-run Excavator purchase/token/sale advance scenarios and Pink Salt supplier advances and balances. Confirm opening balances and trial balance against copied source.
