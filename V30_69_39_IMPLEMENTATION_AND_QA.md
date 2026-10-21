# V30.69.39 implementation and verification

The eight issues in **QA POINTS 20 oct.docx**, including its screenshots, were implemented in the existing Blue Ocean Market application. This is a complete source build for staging/testing. No live deployment, main-branch push or production-data repair was performed.

## Protected baseline

| Item | Verified value |
|---|---|
| Baseline | V30.69.38, newest protected source available |
| Source ZIP | Blue_Ocean_Market_V30_69_38_PRODUCTION_PRODUCT_UI_GIT_READY.zip |
| SHA256 | b0b399127830deada3d24295f73b5c216d6720fcee0ad989878a92b324c5aac9 |
| Source location | Protected source ZIP retrieved from the available files; preserved separately |
| Local baseline Git commit | 89370c7; protected-v30.69.38; clean before work |
| Isolated development branch | feature/v30.69.39-oct20-qa |
| New version | 30.69.39 in package, lockfile, frontend manifest and browser cache references |

The baseline was reconstructed into a local Git repository from the verified ZIP. Its original remote Git history was not supplied. The local baseline commit is not represented as a commit from your GitHub repository. No main branch or unrelated remote development was changed.

## Implemented changes

| QA issue | Implemented behavior |
|---|---|
| Automatic financial voids/reversals | Removed startup duplicate consolidation and automatic voiding of legacy import Finance rows and unposted sale-settlement mirrors. Integrity scanning retains the financial records for review. Removed automatic final posting of correction reversals. A live authenticated mutation, or a persisted explicit source void with actor/reason, is required for cancellation/reversal preparation. Posted originals remain Posted until an authorized user posts their reversal through Posting Control. Retry reuses the existing reversal proposal. |
| Clear audit information | Finance source voids record actor, timestamp, reason and before/after snapshots. Shared FX reversals now audit the primary Finance row as well as linked rows. Accounting cancellation/reversal requests retain audit/posting history. Audit History displays the reason and expandable before/after/full details. Historical events without a known actor are identified as legacy/system records, not attributed to an invented user. |
| Advance allocation clarity | Central supplier allocations show dates, amounts, status, current remaining/unallocated advance and target links. Multiple partial allocations remain visible. Allocate Credit is hidden when supplier available credit is zero or an obligation is settled. Other available actions remain accessible. Supplier net available credit continues to use the existing refund-aware calculation; per-advance unallocated figures are not a second cash balance. |
| Import Supplier Payments | Includes advance-only allocations, separately from cash payments, with cash total, advance total, total settled and outstanding. Reversed/voided history is retained and does not increase settled totals. |
| Import History | Persistent full-page history with creation, creator, operational changes, payments/costs, advance allocations, stock events, linked Finance and Accounting records, verification, posting, reversals and relevant approval/audit events. Uses existing ledgers, server paging at 25, refresh and Back to Import. |
| Raw Salt Stock search | Generic list enhancement skips the existing server-paged raw-stock filter, leaving one functional search. |
| Add Material dropdowns | Base Stock Unit and Category are dropdowns. Options include existing configured/used values; Other opens a custom field. Used materials retain the protected base-unit rule. |
| Old UI after deletion | Active routing and refresh use the current Packaging renderer. Removed the obsolete card renderer from the active runtime; legacy form entry points delegate to the current module. Transaction records and legacy APIs remain preserved. |
| Packaging Purchase workflow | New/edit purchase routes open full pages. One reusable item editor adds/updates a compact cart, with Edit/Remove actions. Supplier, currency, date and references sit beside the cart with decimal-safe subtotal, discount, tax, expenses and payable totals. Mobile cart rows show labeled quantities/prices and visible actions. Session restoration preserves header/cart through refresh, scoped by user and business unit; stale edit revisions are not restored. Review & Confirm uses the existing mutation/processing workflow. |

Payments remain in purchase details and the central supplier workflow. Saving a purchase does not perform an undisclosed bank payment or receipt. Packaging receiving still supports partial quantities before full payment. No independent supplier, advance, payment, approval, inventory or Accounting engine was added. Existing accounting cost classifications and currency policies are retained.

## Reused architecture

Inspected the shared platform/component registry and route catalog before editing. Reused BOMRouter, the existing workflow surface, shared dialogs/Review & Confirm, root processing, supplier account/profile and statements, Pink FX settlement/reference/approval services, Packaging purchasing/receipts, fixed-scale decimal calculations, inventory/BOM/production services, Finance verification and Accounting Posting Control.

New backend helpers are `server/financial-action-context.js` (authenticated mutation context, including multipart continuations) and `server/import-history.js` (read-only projection of existing records). There is no new financial ledger. Existing stable API namespace `/api/pink-salt/packaging-v36` is intentionally unchanged.

## Executed verification

Executed with **Node v22.23.3**, SQLite through the actual application, Chromium headless shell **136.0.7103.25**, Playwright **1.62.1**, and local CJK fonts. Every suite below exited successfully. Test data was disposable and synthetic.

| Executed suite | Result |
|---|---|
| Current release identity, lockfile, exact frontend manifest and all server/public JavaScript syntax | PASS |
| Packaging application/API workflows | 25 PASS groups |
| Purchase confirmation/refinement controls | 8 PASS groups |
| Product/Family/Lot API regression | 11 PASS groups |
| New import history/advance reconciliation | 6 PASS groups |
| New financial startup/retry safeguards | 5 PASS groups |
| Protected financial/operational regressions | 19 suites PASS; 282 PASS log checks |
| Packaging browser workflows | 10 PASS checks |
| Cart/import-history/supplier browser workflows | 7 PASS checks |
| Product/Production/Families/Lots/sidebar browser regression | 17 PASS checks |
| Actual V30.69.38-to-.39 upgrade and repeated restart | 4 PASS groups; all columns/rows in 15 protected tables preserved |

Primary evidence: `qa/evidence/36939-release.json`, `36939-regressions.json`, `36939-packaging-api.json`, `36939-financial-guards.json`, `36939-history-api.json`, `36939-upgrade.json` and the three current browser result files. Synthetic screenshots are under `qa/evidence/v306939/`.

Protected regression coverage includes required approval before Finance verification, all six configured currency combinations, cross-currency actual debits, cash, partial and combined settlements, supplier statements, duplicate references, owned corrections/resubmissions, posted correction holds, FX policies, Excavator buyers/suppliers/accounts, raw/finished stock, production/lot traceability, authentication and permissions. Browser checks cover compact controls, visible actions, full-page routes, refresh/history restoration, deletion parent, custom dropdowns, partial unpaid receiving and EN/KR at desktop and 390px widths.

### Reconciliation results

- Two actual advance allocations of KRW25,000 and KRW30,000 settle KRW55,000 against a KRW100,000 import. Cash paid remains zero, outstanding is KRW45,000, supplier available credit is zero, both allocation records remain, and no extra Finance row is created.
- Packaging tests reconcile supplier statements to the central net position, native USD/PKR account debits to invoice settlement/KRW valuation, receipts to stock, and balanced Accounting postings. Payments alone do not move stock.
- Upgrade tests compare every column of 15 existing transaction/master tables, including purchases/lines/receipts, stock, FX, Finance, journals/lines, approval rules and product/lot data, across two .39 starts. No quantity, money, ID or transaction-count drift; foreign keys remain valid.
- Explicit legacy fixtures containing duplicate Finance rows, a historical void with no actor, and pending/posted journals retain their financial statuses across restart and diagnostic retries. No automatic void/cancellation/reversal is generated.

## Migration and remaining practical limits

No destructive migration, stock opening event, fabricated receipt, payment replay or bulk historical repair is included. Existing schema installers remain additive/idempotent. Integrity case metadata can be created/updated while the underlying financial record is preserved. Existing voided records are not automatically restored; unknown historical actors or absent historical audit events cannot be reconstructed from screenshots.

The production database and the specific KRW25,000 transaction in the screenshot were not supplied. Its actual cause cannot be certified. Inspect its source, void reason/user/time and Accounting history during staging reconciliation; do not unvoid it merely because it resembles a test fixture. Legacy duplicate groups require deliberate reconciliation through authorized correction/reversal and Posting Control; the release intentionally does not silently consolidate them. A source without historical actor/event data remains visibly incomplete rather than fabricated.

No live Render deployment, real bank test, production reconciliation, or actual SMTP delivery was executed. Existing notification/approval application tests passed; actual important-email delivery still needs the configured staging SMTP service. Render testing must use a backed-up test copy and preserve disk/environment paths. See deployment notes for exact commands and rollback limits.
