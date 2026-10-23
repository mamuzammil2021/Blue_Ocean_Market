# V30.69.43 verified cleanup report

Baseline and branch are recorded in V30_69_43_QA_REPORT.md. Cleanup is limited to proven obsolete UI or packaging artifacts; preserved compatibility code is not classified as dead merely because it is old.

| Item | Action and proof |
| --- | --- |
| Add/Edit Material optional purchase-unit/supplier-reference markup | Removed per the marked QA screenshot; no remaining DOM containers `packUnits`/`packMappings` in those forms |
| `renderUnits`, `psPackUnit`, `psPackAddUnit`, `psPackRemoveUnit`, `renderMappings`, `psPackMapping`, `psPackAddSupplier`, `psPackRemoveSupplier` | Removed eight unreachable frontend functions after repository-wide reference search showed their only callers belonged to the removed section or these functions themselves. Actual existing-material save preserves hidden conversions and mappings |
| `unitDraft`, `supplierDraft`, backend units/mapping endpoints and stored data | KEEP. Used to retain historic conversions/mappings and existing purchase semantics; no data migration or deletion |
| Plain root file named `node_modules` containing `../../work/node_modules` | Removed. It was an inherited one-line packaging placeholder, not dependencies or application code. Actual install directory is ignored and excluded |
| Earlier page/section text-loader markup | MIGRATE. Replaced in maintained source and supported runtime copies; exact owners/counts in `docs/ui-modernization/OCT22_LOADER_MIGRATION_43.json` |
| Repeated final Korean optional-cash translation entries | Removed exact duplicate pair in final catalog owner. Earlier catalog blocks now merge instead of discarding previous entries |
| Existing application runtime bundles, versioned loaders and legacy financial services | KEEP. Dynamic references/overrides remain active; no whole bundle guessed obsolete |
| Old general release/acceptance documents | Archived under `docs/history/v30.69.42-recovery/`; current root guides point to V43. Version-specific historic records remain for provenance |
| Runtime databases/data/uploads/backups, private environment files, node_modules, browser/font/tool caches, generated QA screenshots/logs | EXCLUDE from source ZIP. Synthetic QA evidence is delivered separately |

Verification: repository reference search, preserved-map real browser save, full release regressions, reproducible Tabler build, asset-integrity manifest, Git diff/syntax checks and ZIP content/CRC validation. No npm dependency or financial history table was removed. This is verified cleanup for the requested QA work, not a claim that all frontend technical debt is gone.
