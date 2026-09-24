# V30.52.0 QA status

## Completed in source environment
- Verified protected V30.51.0 source archive SHA-256 before changes.
- All inherited release QA tests (with version/asset expectations advanced to V30.52) pass.
- 28 dedicated static/syntax V30.52 QA checks pass.
- All currently shipped JS files pass current release syntax check.
- `public/client.js`, `public/runtime-v30392.js`, `public/v343-client.js` and new `public/v352-client.js` precompressed `.gz` sidecars regenerated.

## Not completed; required before production rollout
- Native authenticated runtime smoke **blocked locally**: npm dependency install failed and `express` was unavailable. Run `npm ci && npm run qa:v352:runtime` on supported Node 22 with package-registry access.
- Reproduce 9 screenshot QA scenarios with actual sales, buyer/supplier profiles, refund statements, Finance verification and multi-record Bulk Verify on staging.
- Test old DB additive migration, real authenticated attachment preview/download, restricted BU user and maker/checker, English/Korean, concurrent reads/writes and Render persistent-disk deployment.
- For legacy entries created within the same one-second timestamp without finer provenance, exact inter-table entry ordering may be unknowable; stable fallback ordering is used. New allocation records store explicit entry timestamp.

**Do not treat source QA as production acceptance.** Keep V30.51.0 for rollback and retain current database/uploads and persistent disk.
