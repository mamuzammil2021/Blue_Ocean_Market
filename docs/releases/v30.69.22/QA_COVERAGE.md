# Acceptance and limitations

Release status: STAGING_CANDIDATE. The final automated gate result and exact per-suite checks are in qa/evidence/36922-release.json. Do not substitute historical results for that report.

Tests start real Node.js servers against disposable SQLite databases and use authenticated Chromium. They include cross-currency debit/allocation/fees, Finance linkage, controlled Accounting proposals and posting, rollback, duplicate submission, corrections/reversals, approval permissions, prior-version migration/restart and Excavator financial regression. The routing browser matrix exercises root modules, representative actual records and sections, supported list state, EN/KR, logout/sign-in, session expiry, explicit access denial, missing units/records, slow obsolete reads, transient failure/Retry, copied links, Back/Forward and business-unit switching. Synthetic screenshots and financial reconciliation evidence are included.

Outstanding acceptance is explicit:
- Every record type has not been independently exercised through every copied-link, refresh, logout, Back/Forward, language and permission permutation. Some workspace checks assert rendered title and URL rather than every inner widget.
- MIMI read workspace restoration is covered; restaurant order finalization and every restaurant mutation are not regression-tested by this release.
- Exhaustive non-CEO role and business-unit permutations across every module, every unsaved-form/history combination and all file/PDF download interactions remain manual acceptance.
- Private free-text searches and unsaved transaction values are not restored by design.
- Approval source types absent from the trusted registry or without independently scoped records are omitted; a reviewed source adapter is required to expose them.
- Cross-currency settlement still follows the supported routes and approved accounting-policy controls documented in the carried V30.69.20/21 notes. Multi-leg movements cannot be claimed supported merely because accounts are visible.
- No production/Render deployment or production database test was performed. Existing production data compatibility is supported by isolated baseline migration and preserved backend source, not a destructive production test.
- Carried payment acceptance remains pending for the complete Excavator browser mutation matrix, EN/KR PDF rendering, every historic operational payment entry point and UI edge state, isolated Render backup/restore rehearsal and business accounting-policy approval. Financial server regression passes do not establish those remaining browser or policy approvals.

Run staging acceptance on an isolated persistent disk. Verify the outstanding items before labelling the release COMPLETE or deploying to main.

