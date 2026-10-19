# V30.69.37 — Packaging Materials UI refinement

This complete source build extends the verified V30.69.36 build. It addresses the four supplied screenshots: compact toolbars, visible row actions, live purchase statuses and a properly aligned receiving dialog.

- `V30_69_37_IMPLEMENTATION_AND_QA.md`: changes, executed checks and limitations.
- `V30_69_37_MAC_GIT_NEW_BRANCH.md`: simple new-branch Git commands.
- `V30_69_37_DEPLOYMENT_NOTES.md`: backup, upgrade and rollback.

Normal purchases complete through one Review & Confirm. Draft saving is optional; approval is requested only when configured rules require it. Supplier/payment engines, partial receiving, Finance verification and Posting Control remain shared.

Use this release for Render testing before promotion. Do not replace the service database, persistent disk, uploads or secrets with ZIP contents.
