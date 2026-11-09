# Blue Ocean Market V30.70.8

This build applies the approved list layout to the cleaned V30.70.7 source.

- Existing KPI groups use equal-height, lightly tinted cards above their record controls. Desktop groups and filter toolbars stay in a single row. Narrow screens use a compact grid or wrap the controls, and wide tables scroll inside their own surface.
- In-app tables use the bundled Bootstrap and Tabler classes, with consistent headers, numeric alignment, responsive wrappers and footer styling. Existing tables and mobile record layouts retain their domain behavior.
- Short row actions use icons with localized hover and focus text. Text stays visible on phones and touch screens. Transaction and review actions keep their descriptive labels.
- Pink Salt Imports adds a count across all filtered records and page totals for active shipments. The optional sort direction is under More filters. The existing server-side search, pagination and sort state drive the list.
- The project’s development rules in `AGENTS.md` define the layout and checks for future screens.

Current browser evidence is written to `qa/evidence/ui708-browser.json` and `qa/evidence/ui708-matrix.json`. The release gate writes its result to `qa/evidence/postgres-release.json`.

Validation passed on Node 22 with PGlite and Chromium. The build passed 500 workflow checks, 20 database and upgrade tests, 294 screen cases and 18 focused UI and navigation checks. A Packaging tab-retention failure was corrected and the affected suite passed on rerun. PDF checks used the local Chromium PDF API adapter.
