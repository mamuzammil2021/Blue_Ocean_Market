# V30.69.41 component mapping additions

| Component | Owner / contract |
| --- | --- |
| Accounting grouped navigation | v357-accounting-workspace.js creates group buttons with aria-expanded/aria-controls and route panels; bom-module-layouts.css owns layout. v357WorkspaceGroup changes presentation only. |
| Settings full-width sections | Original v319/v320 scope/section renderers; semantic nav retains original onclick and index ordering; module CSS owns responsive layout. |
| Domain panels | Explicit v3591/v3592/v340/v341/v320/v291/v356/v305 class families in module CSS; no global wildcard card replacement. |
| Standalone controls | Existing BOMUI.decorate adds form-control/form-select without rewriting values, validation or callbacks. Checkbox/radio/hidden/button/submit types excluded. |
| Large editors and detail pages | Existing openWorkflowHtmlV324 and sole BOMRouter; six access routes and two manual journal routes added to original registry. Short confirmations stay in the existing controller. |
| Parent section | Optional existing registry parent.section; original router Back honors it, returning access editors to profiles/groups/policies. |

Original Tabler subset and API mapping are retained below.

# Tabler component mapping — V30.69.41

| Existing application surface | Tabler/application adaptation | Ownership / compatibility decision |
| --- | --- | --- |
| CEO/BU shell, sidebar, top bar, BU/language switch, breadcrumbs | Compact neutral canvas, navy sidebar, consistent page rhythm and SVG iconography | Existing shell HTML and routing handlers retained; application adapter owns appearance. |
| Page title/action rows | Shared titlebar/section-title spacing and wrapping | Existing allowed buttons retained; no new permission logic. |
| KPI/stat cards | Scoped card foundation + unified numeric typography | Native KPI values/calculations unchanged. |
| Data tables, filters and pagination | Scoped tables/forms/buttons, explicit header scopes, keyboard scroll regions, existing action cells sticky | No column data, server paging default or query semantics changed. Existing mobile product cards remain. |
| Currency/date/payment fields | Shared form-control/form-select appearance and native labels | No value transformations, FX defaults, rate-purpose rules or debit/credit changes. |
| Primary, secondary, danger and small actions | Existing btn/primary/danger/small mapped to central density/colors | Disabled, hidden, native button type, review/confirm and delegated handlers preserved. |
| Tabs and detail sections | Shared spacing/active-state accents; existing route section state | No tab controller replacement. |
| Status badges, alerts, empty/loading/error states | Semantic shared colors and panel/typography alignment | Existing text, server statuses and loaders retained. |
| Short dialogs, wide dialogs and confirmations | Shared widths/radii/backdrop/mobile bottom-sheet presentation | Existing V322/V363 modal/focus/processing controllers retained. No Bootstrap modal JS. |
| Serious mutation processing overlay | Existing protected top-level service remains | Existing approval, duplicate-submit, close/navigation locks and single outcomes retained. |
| Notifications and important-only email | SVG bell + existing notifications surface styling | No delivery/filter/email behavior changed. |
| Product families, lots, production, purchase cart | Existing full-page routed structures with shared design tokens | Existing stable URLs and Back/Forward retained. |
| Accounting journal/posting details | Full-page surface via existing workflow renderer; dedicated presentation owner | Deep links/refresh/Back retained; short correction/confirmation tasks still use existing dialogs. |

All 34 primary routes consume the same shared layer. The complete per-route status map is in UI_AUDIT_AND_SCREEN_INVENTORY.md. Upstream scoped CSS is built from 58 selected Sass sources; the browser receives neither the Tabler monorepo nor its JavaScript behavior plugins. There is no new chart-library dependency.


## V30.69.42 catalogue update

The machine-readable WORKFLOW_PAGE_CATALOGUE_42.json enumerates 73 renderer owners and 90 seeded create/edit/detail variants. WORKFLOW_SOURCE_AUDIT_42.json retains source/API ownership; the existing BOM router owns navigation, dirty guards, permissions and direct hydration. bom-workflow-pages.js owns only catalogue presentation and return-page coordination. Shared scoped CSS and existing form/mutation services remain the design/behavior owners. The fresh recovery QA report is authoritative for current execution; older screenshots/results are historical. Focused transaction dialogs and uncertain compatibility source are intentional exceptions.
