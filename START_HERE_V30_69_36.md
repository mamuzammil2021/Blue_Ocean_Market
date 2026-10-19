# V30.69.36 — Simple Packaging Materials

Protected baseline: **V30.69.33**, selected explicitly for this build. Start with:

- `V30_69_36_IMPLEMENTATION_AND_QA.md` — implemented workflow, verification and limits.
- `V30_69_36_MAC_GIT_NEW_BRANCH.md` — extract, clone, branch, copy, commit and push.
- `V30_69_36_DEPLOYMENT_AND_MIGRATION.md` — backup, additive upgrade, reconciliation and rollback.

Packaging Materials expands in the sidebar into **Materials**, **Purchases**, and **Stock & Usage**. Create materials first; create one purchase for one existing supplier with multiple material lines; manage payments, partial receiving, documents and history from purchase details. Suppliers remain central. Receiving does not require full payment.

Use Node 22. `npm ci`, then `npm run qa:release` on a disposable test environment. Browser and original-baseline upgrade checks have separate commands in the report. Do not run synthetic test setup against a production database. Do not replace a persistent disk, database, uploads or secrets with source ZIP contents.

This build is ready for your **Render staging/testing review**. It has not been deployed to your Render service or tested against your production database.
