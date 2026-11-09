# Blue Ocean Market development rules

## Screens with records

Use the shared record layout on every new or updated list, table or record card screen. Keep English and Korean equally usable.

1. Start with a page title, context or record count when available, and the main action. Place relevant metrics above the filters. Use `data-bom-summary` for a group of equal-height cards. Include `bom-record-summary` in renderer markup for a summary whose HTML is compared during tab changes. Keep one row on desktop and a compact grid on narrow screens.
2. Put the main search, dates, filters and reset/apply controls in one desktop toolbar with `data-bom-filters`. Use the same search across all results. Put less-used options in a native `details.bom-record-filter-options` with a localized summary. Keep active criteria discoverable. Let controls wrap at narrow widths and keep any horizontal scroll within the toolbar.
3. Use the bundled Bootstrap and Tabler table styles. Use `table table-hover` inside a responsive wrapper, semantic headers and accessible names. Use the existing mobile record cards when they improve reading. Keep tabular financial detail scrollable on phones. Align amounts to the right and preserve currency, sorting, status, pagination and empty states.
4. Use compact icons for short row actions such as Open, View, Edit, Print, Download and Delete. Provide localized hover and focus labels, accessible names and adequate touch targets. Give destructive row icons a distinct treatment and retain their confirmations. Size the Actions column to its controls. Keep descriptive text on primary workflows and confirmation dialogs. Preserve authorization and disabled states.
5. When a total helps, use a footer or summary card and label its scope and currency. Derive all-filtered totals from all filtered records, including records on other pages. Label page-only totals as such. Keep different currencies distinct unless the displayed figure has an explicit conversion basis.

Use `public/bom-record-layout.css` and `public/bom-record-layout.js` for shared presentation. Keep queries, mutations, route state and permissions in the domain code. Use the existing bundled assets and rebuild the frontend integrity manifest after editing frontend files.

Validate each affected collection at desktop, tablet and phone widths in English and Korean. Check a populated view, an empty result, a filter change, row actions and pagination where present. Run `npm run qa:ui708:matrix` for the shared screen matrix and `npm run qa:ui708` for focused interactions.
