# Frontend cleanup removal register — V30.69.40

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
