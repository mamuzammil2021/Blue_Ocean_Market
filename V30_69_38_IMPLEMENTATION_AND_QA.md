# Blue Ocean Market V30.69.38 — Production and Product Master refinement

## Baseline

Built on the latest complete protected source found in Library: `Blue_Ocean_Market_V30_69_37_PACKAGING_UI_REFINEMENT_GIT_READY.zip`, SHA256 `cfe029c182ea44890d7e801618dcc7b67d5bda7babc69080c0f0db9c6b49b2fd`. Source commit `391922d` was clean. Work is isolated on `feature/v30.69.38-production-product-ui`. The protected .37 source and ZIP are preserved. No remote branch, main branch or Render service was changed.

## Implemented

- Packaging Materials sidebar now follows the platform icon/label/hover/active styling. The disclosure arrow sits after the label at the far right. Keyboard focus, expand/collapse and the existing three submenu destinations remain supported.
- New Repacking Batch has its own persistent `#psProduction/new` route. Explicit page Back, application Back, Cancel and successful completion return to Production, preserving safe generic list filters where available. Batch detail Back uses the same explicit parent. Browser Back/Forward and refresh use the existing sole route controller. Dirty Production/Product pages prompt before discarding; validation errors retain inputs.
- Production Batch and Product Master list actions are always visible, with a sticky right-hand action column on desktop and wrapped record cards on phones. Actions respect permissions; voided batch actions are disabled with a localized reason. Existing stock-dependent product archive/delete controls remain intact.
- Finished product creation/editing offers English only, Korean only, or Both. Only relevant language fields show; SKU, packaging, prices, stock settings and other shared fields remain visible. Switching never erases hidden language values. Existing products infer their initial choice until explicitly saved.
- Each product stores an independent preferred commerce content language: automatic available content, English or Korean. Existing commerce APIs supply `display_content`, using the preferred language per field and falling back to the other language. Commerce screens consume the resolved name. This does not change the app interface language or introduce a storefront/channel connector.
- Product Families and Lots & Expiry are populated full-screen pages with compact search/filter controls, default-25 server paging, useful empty states and visible actions. Neither opens a modal on entry. Family/lot details have their own routes; details and lists restore directly on refresh.
- Family details show linked variants and retained EN/KR descriptions. Families support short add/edit dialogs, archive/reactivate, and deletion only without linked products or image records. Historical product-family relationships survive archiving.
- Lot details show quantities, allocation/available balance, expiry, quality, location and linked Production batch where present. Short metadata edits preserve stock quantities and validate the location in the same BU. Closing/cancelling a short dialog leaves its backing page visible.

## Reused services and corrections

Inspected the shared platform/entity registry and route catalogue before editing. Reused `BOMRoutes`, `BOMRouter`, the Imports filter/table/pager conventions, existing modal/Review & Confirm and root processing layer, native product/BOM transactions, family and lot services, and existing Production execution/Accounting/stock services.

The routing defect was caused by New Production having no registered child destination and a generic workflow close falling back to `history.state.previousRoute`. Explicit parent metadata now resolves the return destination. Existing unrelated route-close behavior is preserved.

The blank Families/Lots backing page was caused by addressable read routes calling `modal()`. Their renderers now populate the page directly. Only short editors use dialogs; successful edits refresh the active list/detail. Saving a linked product variant retains its Family Details context. Read-only filters opt out of dirty-form tracking, and full-screen read pages retain the existing workflow marker so background synchronization cannot replace them with a parent list.

Product family/variant selections now persist inside the existing product transaction. An invalid family rolls back the entire product/BOM save. Content preferences and their before/after values are included in the existing product audit. The shared action-permission gate now recognizes the touched versioned family/lot endpoints, preventing view-only users from mutating records.

New source components: `public/pink-product-ux.js`, its scoped stylesheet, and `server/product-content.js` (normalization/fallback integrated into existing services). No separate supplier, payment, approval, inventory, production or accounting engine was created.

## Database upgrade

Two additive nullable/defaulted product columns are installed through the existing retry-safe `addCol` mechanism:

- `pink_salt_products.content_language TEXT DEFAULT NULL`: null preserves the legacy/inferred preference until a user saves a choice.
- `pink_salt_products.commerce_language TEXT DEFAULT 'auto'`.

Existing IDs, names and translated content are retained. Korean-only products are excluded from the older startup routine that fills a missing English name from the generic operational name. Generic `name` remains a compatibility display name derived from the selected content; absent translations are not fabricated.

No stock movements, supplier allocations, Finance payments or Accounting journals are generated by this new migration. The .37-to-.38 fixture upgrade compares all original columns in 15 protected tables across two startups, plus a Korean-only product restart check. See the machine-readable evidence and deployment notes.

## Executed QA

Final results and exact counts are recorded below at packaging time. All execution uses authenticated real application servers and isolated fixture databases; browser tests use Chromium/Playwright. No production records are used.

| Suite | Executed result | Evidence |
| --- | --- | --- |
| New Product/Production API | PASS — 11 groups | `qa/evidence/36938-product-api.json` |
| New Product/Production browser | PASS — 17 groups | `qa/evidence/36938-product-browser.json` |
| Packaging API | PASS — 25 groups | `qa/evidence/36938-core-api.json` |
| Packaging refinement API | PASS — 8 groups | `qa/evidence/36938-packaging-refinement-api.json` |
| Packaging refinement browser | PASS — 8 groups | `qa/evidence/36938-packaging-refinement-browser.json` |
| Packaging/production/supplier settlement browser | PASS — 16 groups | `qa/evidence/36938-packaging-workflow-browser.json` |
| .37 → .38 upgrade and restart | PASS — 4 groups | `qa/evidence/36938-upgrade.json` |
| Protected regressions | PASS — 19 suites / 282 PASS log entries | `qa/evidence/36938-regressions.json` |

The backend release gate completed with exit code 0. Exact-hash frontend integrity and changed-source syntax checks passed. The upgrade compares original columns in 15 protected tables, existing payment/stock balances, preferences and foreign keys. The new browser suite reports no uncaught JavaScript errors and includes desktop and 390px mobile layouts. Protected suites cover Excavator, Imports, supplier accounts/advances/statements, all-currency settlement, approval-before-verification, Accounting corrections/posting, notifications, permissions and runtime.

Browser screenshots were inspected internally for layout; private screenshots are not included in this deliverable.

## Limits

Ready for Render testing/staging review. No live Render deployment, production database reconciliation, external SMTP delivery or fresh Docker/network dependency installation was performed. Protected email-policy tests use controlled mail spies. The installed Node 22 dependencies and Chromium were used; PDF regression checks use the existing Playwright Chromium print adapter. Korean text assertions pass, but this QA host lacks CJK fonts, so final glyph appearance must be reviewed in the deployed browser; the existing Dockerfile includes CJK fonts.

The build preserves the .37 payment/receiving workflows. Back up the actual database and uploads, retain the persistent disk and current secrets, and test the supplied branch before merging. See the deployment and Mac Git guides included with the full source.
