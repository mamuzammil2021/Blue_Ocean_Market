# V30.52.0 implementation summary — 23 September QA

Protected baseline: V30.51.0 archive SHA-256 `3544c8a0cb83afaf206d9420e6ad0eede216b8f654c3c414f670832ef418ddd5`.

1. **Machine cost locking/correction:** server edit lock now checks Finance verified or Accounting posted, not mere attempted review/resubmission; original-cost-creator correction rule maintained. Matching V30.43 and shared cost UI lock checks updated. Existing source-linked financeSync continues to refresh amount/accounting dependencies.
2. **Finance detail closure:** after successful Verify or Request Correction, clear stored workflow selection and close the full record workflow, rather than leave the last record open.
3. **Supplier freshness:** post-commit data invalidation includes supplier sections, requirements, statement and account state; epoch protection discards pre-mutation responses.
4. **Accounting route:** selecting Accounting clears stale Posting Control mode and child-context state; V30.43 restore is no longer run after every routine loadView, but browser-refresh initial restoration remains.
5. **Buyer freshness:** buyer profile summary, payments and accounts revalidate following committed related writes; in-flight stale requests are ignored. Original protected progressive loader and server pagination retained.
6. **Sale Document:** sold machine action obtains linked PDF from existing sale source and opens existing secured viewer with download button.
7. **Statement sequencing:** event creation timestamps drive ascending order, with stable tie breakers and original business dates kept for period filters; applied in Excavator, Pink Salt customer/supplier and company account statement builders shared by JSON/PDF/CSV. Buyer advance allocation gets additive created_at migration and legacy backfill.
8. **Excavator dashboard:** remove duplicate hard-coded workspace explanation only; keep KPI/action/navigation layout.
9. **Finance:** remove duplicate explanatory banner only. Bulk verification rechecks each selected record under its BU/permission, maker/checker, evidence, amount, warning and account policy; single-row database transactions, explicit skipped reasons, guarded browser control and paged refresh.

**QA:** inherited `npm run qa:release` plus dedicated V30.52 syntax/static tests pass. Native runtime and deployment checks not completed locally because npm dependencies could not be installed in this environment. Perform authenticated staging acceptance before promotion. Do not reset `/var/data` or existing database.
