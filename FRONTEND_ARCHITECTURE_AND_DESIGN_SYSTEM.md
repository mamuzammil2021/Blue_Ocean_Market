# V30.69.41 ownership changes

`public/bom-module-layouts.css` owns the Accounting top navigation, Settings full-width workspace, standalone control variants and named legacy domain panel adapters. It loads after the shared design system and uses the same density, border, radius and color tokens. Every selector is scoped to html.bom-ui. The obsolete Accounting injected stylesheet is removed. Original non-presentation controllers remain in place.

The six access editors and manual journal new/correct forms explicitly call the original full-page renderer. Native form events retain dirty tracking. The existing route controller owns permissions, safe URL state, hydration, errors and parent navigation. Approval/task/report detail functions explicitly use full pages; task progress/comment saves refresh their own record after commit. No second router, modal interception, external framework or new data service is added.

New editor routes: systemSettings/profile-new, profile-edit, group-new, group-edit, policy-new, policy-edit (existing safe filter query carries the nonnumeric library key); accounting/new-journal and accounting/edit-journal/:id. Never put passwords, tokens, attachments or form payloads in URLs.

Maintenance: preserve global function names and data IDs. Match active runtime changes with their maintained v318/v319/v320 source fragments. Do not regenerate the entire historical runtime by naïvely concatenating sources: it contains intentional compatibility differences. New CSS remains in the module owner; generated Tabler CSS remains build-only.

# Frontend architecture and design system — V30.69.41

## Scope and ownership

The application remains its existing Express/vanilla-JavaScript ERP. No second router, framework, modal controller, chart engine, calendar or CDN is introduced. All 34 primary views share the new presentation layer. Domain scripts retain their calculations, forms, requests, permission checks and business state. This is a shared visual/semantic migration; it does not replace every legacy renderer with a new component implementation.

| Owner | Responsibility / public interface |
| --- | --- |
| `public/legacy-components.css` | Structural rules extracted from 12 original index.html style blocks, in original cascade order, minus 31 exactly duplicated earlier rules. Retained compatibility owner; do not add new design variants here. |
| `vendor/tabler/components.scss` | Selected upstream Sass modules. Includes root tokens, buttons, cards, tables, forms, badges, alerts and pagination; excludes reboot, modal JS and unrelated demos/vendors. |
| `public/tabler-components.css` | Generated upstream subset, scoped to `html.bom-ui` / descendants of `.bom-ui`. Rebuild; do not edit. |
| `public/bom-design-system.css` | Application tokens, density, shell, navigation, forms, tables, cards, dialogs, breakpoints, focus and reduced motion. Add shared visual variants here. |
| `public/bom-ui.js` | Idempotent progressive semantics: control classes, native label associations, header scopes, safe table scroll containers, sticky existing action cells, navigation ARIA, SVG decoration, keyboard skip link and supplementary focus restoration when the original controller leaves focus on a removed dialog. Public read-only adapter API: `BOMUI.version`, `BOMUI.decorate(root=document)`. No API requests, domain mutations or handler replacement. |
| `public/bom-accounting-details.js` | Cohesive journal/posting detail presentation; original read APIs and permission-derived buttons, existing mutation handlers. Original v290/v318 and active runtime definitions become delegating stubs. |
| `public/bom-ui-icons.js` | Generated, selected inline SVG icon catalogue. Decorative icons use aria-hidden/focusable=false. |
| `public/packaging-materials.css`, `public/pink-product-ux.css` | Domain structures retained; control sizing now consumes the shared density token. |
| `public/route-registry.js`, `public/v3693-persistent-routing.js` | Existing canonical route registry/controller; eight routes added, optional parent.section honored by Back. |
| `public/v363-dialog-processing.js` and existing feedback services | Existing dialog lifecycle, sticky actions, processing surface, locks and outcomes. Unmodified. |

Load order: preserved structural CSS → existing domain CSS → scoped Tabler CSS → application adapter → domain layout adapter. Existing 57 application script tags remain in exactly the original order. The two shared presentation scripts load after them; the dedicated Accounting detail module loads before the existing registry/router startup, without reordering any original script. Runtime-injected legacy styles still exist and are tracked in the asset inventory; their uncertain code was not deleted.

## Tokens and variants

| Token / contract | Value / use |
| --- | --- |
| `--bom-font` | System sans with platform Korean/CJK fallbacks; no font download added. |
| `--bom-blue`, `--bom-blue-dark` | #066fd1 / #0559a7; primary buttons and navigation accents. |
| `--bom-surface`, `--bom-canvas` | #fff / #f5f7fb; panels and application canvas. |
| `--bom-ink`, `--bom-muted`, `--bom-border` | #182433 / #5d6b7d / #dce1e7. |
| `--bom-space-1…5` | 4, 8, 12, 16 and 24px. |
| `--bom-radius`, `--bom-radius-lg` | 6px controls; 10px panels/dialogs. |
| `--bom-control` | 36px desktop, 40px tablet, 44px small mobile. Existing domain sizing exceptions remain where explicitly controlled. |
| `--bom-sidebar`, `--bom-header`, `--bom-page-width` | 244px, 64px, 1600px; responsive shell. |
| `--bom-focus`, `--bom-elevation` | Visible blue focus ring; restrained panel shadow. |
| `.btn`, `.btn.primary`, `.btn.danger`, `.btn.small` | Preserve native type/disabled/onclick and permission-driven existence. |
| `.card`, `.stat`, `.pack-kpi`, `.titlebar`, `.section-title` | Existing markup consumes one visual language. |
| `.table`, `.table-wrap`, `.bom-table-scroll` | Compact rows, explicit header scopes and keyboard-focusable horizontal scrolling. Existing mobile record-card layouts remain. |
| `.bom-actions-cell` | Only an existing final cell with a button is enhanced. Existing controls are not invented or permission-hidden controls revealed. |
| `.badge.good/success`, `.badge.warn`, `.badge.bad/danger` | Consistent semantic color aliases, with status text retained. |
| `.modal`, `.modal.wide`, `.confirm-dialog` | Existing controller + responsive visual treatment. No Bootstrap JS. |

HTML `[hidden]` is explicitly preserved. This visibility contract needs one intentional `!important`; the migration does not add a collection of arbitrary priority overrides. Existing historical priority rules remain in their compatibility files.

## Navigation and dialogs

The adapter does not read or rewrite URL state, intercept Back/Forward, change the selected BU or change API authorization. Existing native buttons/details/summary remain keyboard-operable. The skip link focuses current content without navigating to a new hash route. Full-page product-family/lot/production and purchase/cart flows keep their existing routed architecture. Accounting journal and posting review now use the existing full-page workflow renderer. Their original global interfaces delegate to `BOMAccountingDetails.journal(id)` and `.posting(id)` in `bom-accounting-details.js`. Existing wrappers and protected mutation handlers are retained. Posting Back returns to the control queue. Variable-height mobile headers no longer overlap the workflow toolbar.

Packaging FX detail now selects the Packaging view for packaging/packaging_purchase records rather than the Imports view; the financial transaction and calculations are unchanged.

A legacy completion-timer race was corrected in the active runtime and its `v3382-client.js` source: it may close only the original connected form, not a newly opened form that happens to use the same submit handler. This changes UI lifecycle, not payment or Accounting policy. The product workflow browser test exercises saving and immediately reopening a product form.

## Localization and accessibility

New labels (Skip to content, Main navigation, Scrollable table) use the existing `t()` + Korean catalogue. UI language stays independent of product-content language. Existing English/Korean/Both product editing tests passed. Labels already wrapping their inputs are retained; unassociated standalone field labels receive `for`/id associations. Header cells receive scope=col. SVGs are decorative, not substitutes for action text. Reduced-motion handling and visible keyboard focus are included. Korean browser rendering was checked with Noto Sans KR installed in the QA host; no third-party font files are deployed.

Not certified: every screen-reader/browser combination, every status/role combination, or full WCAG conformance. The follow-up audit adds 238 legacy system labels, one contextual Accounting Credit message, and dynamic patterns for counts/settings/composite text. Audited Payroll, Accounting, role administration, meeting and Pink Salt labels now use the existing catalogue. Original names, references, currency codes, account data and permission keys remain record content. Browser accessibility-tree and keyboard checks passed; these are not OS screen-reader certification.

## Build and extension rules

Node 22; pinned Sass 1.103.1, PostCSS 8.5.6 and Playwright 1.56.1. `npm run build:ui` rebuilds SVGs, scoped CSS and the protected frontend integrity manifest. Only 58 upstream Sass sources and 33 original SVGs are vendored, with licenses and checksums. Rebuilding the CSS is checked for byte equality. Keep module-specific layout in its module owner, use tokens for new sizing, and retain current public functions/load order while reducing legacy responsibilities gradually.


## V30.69.42 catalogue update

The machine-readable WORKFLOW_PAGE_CATALOGUE_42.json enumerates 73 renderer owners and 90 seeded create/edit/detail variants. WORKFLOW_SOURCE_AUDIT_42.json retains source/API ownership; the existing BOM router owns navigation, dirty guards, permissions and direct hydration. bom-workflow-pages.js owns only catalogue presentation and return-page coordination. Shared scoped CSS and existing form/mutation services remain the design/behavior owners. The fresh recovery QA report is authoritative for current execution; older screenshots/results are historical. Focused transaction dialogs and uncertain compatibility source are intentional exceptions.
