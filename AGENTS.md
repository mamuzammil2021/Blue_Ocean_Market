# Blue Ocean Market development rules

## Screens with records

Use the shared record layout on every new or updated list, table or record card screen. Keep English and Korean equally usable.

1. Put the page title on the left and one page-scoped search followed by the primary action on the right where the page has these controls. Use the shared record page header and keep primary actions at the same control height. Follow the header with relevant metrics, then filters and records. Omit repeated headings, implementation notes and controls without a purpose. Retain status, currency and workflow guidance users need to act safely. Use `data-bom-summary` for a group of equal-height cards. Include `bom-record-summary` in renderer markup for a summary whose HTML is compared during tab changes. Keep one row on desktop and a compact grid on narrow screens.
2. Keep dates, filters, sorting and reset/apply controls in one desktop toolbar with `data-bom-filters`. Keep the main search in the header and apply it across all results. Put less-used options in a native `details.bom-record-filter-options` with a localized summary. Keep active criteria discoverable. Let controls wrap at narrow widths and keep any horizontal scroll within the toolbar.
3. Use the bundled Bootstrap and Tabler table styles. Use `table table-hover` inside a responsive wrapper, semantic headers and accessible names. Use the existing mobile record cards when they improve reading. Keep tabular financial detail scrollable on phones. Align amounts to the right and preserve currency, sorting, status, pagination and empty states.
4. Use compact icons for short row actions such as Open, View, Edit, Print, Download and Delete. Provide localized hover and focus labels, accessible names and adequate touch targets. Give destructive row icons a distinct treatment and retain their confirmations. Size the Actions column to its controls. Keep descriptive text on primary workflows and confirmation dialogs. Preserve authorization and disabled states.
5. When a total helps, use a footer or summary card and label its scope and currency. Derive all-filtered totals from all filtered records, including records on other pages. Label page-only totals as such. Keep different currencies distinct unless the displayed figure has an explicit conversion basis.

Use `public/bom-record-layout.css` and `public/bom-record-layout.js` for shared presentation. Keep queries, mutations, route state and permissions in the domain code. Use the existing bundled assets and rebuild the frontend integrity manifest after editing frontend files.

Validate each affected collection at desktop, tablet and phone widths in English and Korean. Check a populated view, an empty result, a filter change, row actions and pagination where present. Run `npm run qa:ui708:matrix` for the shared screen matrix and `npm run qa:ui708` for focused interactions.

## Dashboards

Use the shared dashboard period controls and card styles in every business unit. Show date-scoped metrics and charts from authorized data, then separately identify current workspace totals. Use meaningful colors with readable labels and units. Provide empty and error states, a responsive layout and English and Korean labels.

## Access control for new features

When a new feature needs access control, register the permission in the shared
catalog and map it to the appropriate default profiles or permission groups in
the same release. Include the versioned update for existing deployments and keep
custom bundles, business-unit assignments and explicit overrides intact. Keep CEO
access complete. Enforce every protected action on the server and use the
effective business-unit permissions to render tabs and controls. Verify the
allowed, denied and cross-unit cases through the normal entry points.
