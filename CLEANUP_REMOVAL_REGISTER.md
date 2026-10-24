# V30.69.45 cleanup

Removed the superseded ordinary receipt/discrepancy form and unused receipt-only handlers from the shared receiving UI owner. Detailed case tools remain for historical and advanced settlements. No new frontend startup bundle was added. Temporary debug probes, screenshots, generated report captures and runtime data are excluded from export.

---

# V30.69.44 cleanup update

Current receiving has one shared service and one scoped UI owner. Temporary debug probes, generated report captures, failed screenshot captures, installed dependencies and runtime fixture data are excluded from source delivery. Historical version modules and test suites remain where they still own active behavior or regression assertions; no speculative broad code removal was performed. Current cache keys/package/lock/frontend hashes agree on V44. V44 browser variants preserve earlier assertions while replacing only the superseded modal receiving interactions.

---

# Current cleanup — V30.69.43

See [V43 cleanup report](V30_69_43_CLEANUP_REPORT.md). The entries below describe earlier builds and their original scope; old “unchanged server” claims do not describe V43.

# V30.69.41 verified cleanup register

| Candidate | Decision / evidence |
| --- | --- |
| Entire v357 Accounting injected style block | REMOVE after replacing navigation and preserving journal/chart/table rules in bom-module-layouts.css; 6154 bytes removed from former owner. Accounting destinations pass render checks. |
| Repeated 11–29px panel radii and 750/800/900 weights in six named module style blocks | MIGRATE to existing radius/weight tokens; v319/v320 active runtime fragments mirrored. Domain layouts remain owned by original modules where still needed. |
| v357 details/summary sidebar DOM and toggle listeners | REMOVE with replacement two-level group/route navigation; direct routes, selection and refresh tested. |
| Generic .field-only decoration limitation | MIGRATE in existing BOMUI adapter; standalone controls now reuse the same semantic classes. No second observer/controller. |
| Whole v290/v318/runtime bundles, old editors, loaders, server migrations | KEEP/UNCERTAIN; active overrides and dynamic dependencies are real. No whole source file deleted. |
| Additional inline styles and old domain templates | DEFER; this pass does not prove them dead. Historical cleanup counts remain historical, not new removals. |

No npm package or financial logic was deleted. New source CSS adds explicit domain coverage; this is not a net-byte-reduction claim. The prior cleanup register follows for provenance.

# Frontend cleanup removal register — V30.69.41

| Candidate | Decision | Change / evidence |
| --- | --- | --- |
| 12 inline index.html style blocks | MIGRATE — done | Extracted to `public/legacy-components.css` in original order. No runtime lookup of the old style-element IDs was found in frontend sources. 34 primary routes and 61 detailed route/tab combinations were browser-swept after extraction. |
| Exactly repeated earlier CSS rules | REMOVE — done | 31 earlier rules removed only when selector, declarations, importance and enclosing at-rule context exactly match a later rule in the same stylesheet. The later identical rule determines the same final cascade. Every removed selector and original line is in `docs/ui-modernization/CSS_REMOVAL_EVIDENCE.json`. Shared-route browser coverage supplements the static proof. |
| Scattered packaging/product control heights | MIGRATE — done | Existing module rules now consume `--bom-control`; responsive sizes come from the shared design-system owner. |
| Legacy completion timer's same-handler fallback | REMOVE — done | It could close a newly opened product form after an earlier save. Only original connected-form identity now qualifies. Source and active bundle changed together; product save/reopen browser regression passed. |
| Older runtime bundles / versioned scripts | UNCERTAIN — retain | 113 frontend baseline assets inventoried, including dynamic loaders, global wrappers and shared helpers. Filename age or lack of an index.html script tag does not prove dead code. No destructive script deletion. |
| 1,417 baseline inline style attributes | UNCERTAIN / migrate gradually | Mostly in dynamic business renderers; broad removal requires per-state visual coverage beyond this run. Retained. |
| Runtime-injected legacy style elements | KEEP pending further migration | Domain-specific structural/behavioral selectors are still active. The scoped adapter coexists with them. |
| Server logic, migrations, authorization and payment compatibility | KEEP | All server JavaScript is byte-identical to the protected source. No database migration added. |
| Tabler demo pages, full monorepo, chart/map/marketing/calendar assets and Bootstrap/Popper JS | EXCLUDE | Only required Sass/SVG sources and compiled presentation assets enter the release. |
| Four inherited `qa/evidence/v306939/*.png` captures | EXCLUDE from source export | Git export-ignore keeps historical captures out of the source ZIP without deleting them from the protected repository history. Fresh before/after captures are in the evidence archive. |
| node_modules, tool caches, scratch browsers/fonts, runtime databases, generated screenshots | EXCLUDE from source ZIP | Screenshots and QA logs are a separate evidence archive. No .env or live data is packaged. |

The follow-up moves 7,688 bytes of journal/posting renderer definitions out of the active giant runtime and their maintained legacy source owners into `bom-accounting-details.js`, retaining small public-interface stubs and the three required closure formatters. `ACCOUNTING_EXTRACTION.json` records the original sizes/hashes and source ownership. Direct refresh, Back and six-way Accounting captures validate this migration. Existing posting actions remain owned by v318 and the protected processing service.

A copied `d.allocations` fragment in the active `sales313` list renderer referenced an undefined variable and showed a caught error instead of orders. It did not exist in the maintained v313 list source. Removed only that invalid presentation fragment; existing API summaries, stored allocations and calculations remain unchanged. A regression now asserts the existing order and pager render. Route sweeps additionally reject a destination left on loading or displaying a ReferenceError.

No whole legacy frontend source file was deleted. This is deliberately verified, limited cleanup, not a claim that all frontend technical debt has been removed. Uncertain code remains listed rather than guessed obsolete. Historical QA scripts/reports are retained; the new current release gate owns V30.69.40 acceptance.


## V30.69.42 recovery update

- Removed 41 earlier, shadowed top-level function declarations from public/client.js (48,129 bytes). The final declarations and original public names remain. DUPLICATE_FUNCTION_REMOVAL_42.json records hashes and hoisting proof; fresh route, mutation and protected financial regressions exercise retained behavior.
- Added the cohesive bom-workflow-pages.js catalogue/adapter after the original route registry and before persistent-routing boot. Original entry-script relative order remains intact; no second router or modal controller.
- Existing renderer sources and active maintained runtime owners were migrated together. IDs, field names, validators, API payloads and business rules remain owned by the original controllers. WORKFLOW_SOURCE_AUDIT_42.json records ownership/API literals.
- Corrected five commerce select builders to submit explicit raw option values independently of translated labels; fresh EN/KR equality and actual Korean save checks verify this.
- Removed the checkpoint-only diagnose42.cjs probe. No whole application legacy bundle or runtime dependency was guessed obsolete. Structural legacy inline styles, short financial dialogs and uncertain dynamically referenced compatibility source remain KEEP/UNCERTAIN.
- All 98 server .js files are byte-identical to protected V30.69.39. Only the frontend integrity manifest changes in server/. No business migration or policy rewrite.
- Generated QA PNGs, raw logs, dependency folders, runtime data and private environment files are excluded from the Git source export; QA evidence is packaged separately.

The prior paragraph referring to the V30.69.40 gate is historical. Current acceptance belongs to qa_v36942_release.js and the current recovery QA report.
