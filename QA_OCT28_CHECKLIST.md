# October 28 QA completion checklist

Release V30.70.1, prepared October 30, 2026. Source baseline: the supplied
Blue_Ocean_Market_V30_70_0_POSTGRESQL_TESTED.zip. Requirements: QA POINTS 28 oct.docx,
including its 13 embedded screenshots.

| # | Requested behavior | Implementation and verification |
|---|---|---|
| 1 | Supplier profile X returns to list | Explicit supplier-list navigation; browser checked. |
| 2 | Remove category storage field during import creation | Field is hidden and excluded from the visible purchase workflow. Real location selection remains at receiving; existing stored locations are retained. |
| 3 | Import tabs refresh only the relevant section | Addressable Overview, Payments, Documents and History sections preserve the mounted shell. Browser checked zero import API reloads on section switching. |
| 4 | Supplier advance refunds | Discoverable profile action uses the existing incoming shared settlement engine. Tested company receipt, one Finance record, advance-pool reduction and excess-refund rejection. Cash and currency validation remain shared. |
| 5 | Professional attachment controls with evidence protection | Shared document cards for import, packaging purchase, production and sales; authorized archive with required reason and audit. Direct archive rejects linked payment/Finance evidence. Physical files and historical identifiers are retained. |
| 6 | Automatic packaging purchase calculations | Decimal calculation includes the pending item or edited replacement, discounts, tax and expenses. Browser checked live changes and no double count after Add to Cart. |
| 7 | Successful purchase returns to list | Browser saved a purchase through Review & Confirm and checked the list destination. |
| 8 | Full and partial receipt feedback | Fully received purchases return to list with completion message. Partial receipts show ordered, received and pending quantities per unit and open Receiving. Resolved differences use an accurate completion message. Both paths browser checked. |
| 9 | Dedicated warehouses by BU | BU-scoped management links, inventory by location, transfer controls and transfer history. Raw salt and finished-product transfers use paired movements with durable idempotency. Packaging reuses the established controlled movement engine. Stock consumption retains warehouse/batch/lot provenance. |
| 10 | Warehouse search/filter | Dedicated warehouse stock filters plus a persistent warehouse filter on Packaging Stock & Usage. |
| 11 | Open child navigation in a new browser tab | Packaging children and primary sidebar destinations are real links, preserving ordinary navigation, middle-click and modified clicks. |
| 12 | Cart-based New Sales screen | Products and editable/removable cart on the left; customer, order, settlement and live summary on the right. Existing price and stock validations retained. Desktop/mobile checked. |
| 13 | Downloadable sale PDF | Saved sale prepares an invoice in the background, exposes download, and retains download on order details. Downloads retrieve current settlement state. Real English/Korean PDFs rendered and inspected. |
| 14 | Matching invoice format and company assets | Purchase and sale share the invoice renderer. Company/BU details, logo, letterhead header/footer, sample layout, registration and terms uploads. Images print; PDF samples remain references. Existing statement, shipment, production, receiving and financing renderers use the shared branding. Bundled licensed Korean fonts support offline PDFs. |
| 15 | Customer/store editing | Dedicated scoped profile read, saved-name hydration and distinct classification label. The screenshot's customer edit form was corrected; new-sale customer selection remains operational. Browser checked. |
| 16 | Optional new-sale receipt | Full/partial receipt choice opens the existing shared receipt flow after the sale saves once. Tested an incoming partial receipt, one Finance record and correct outstanding balance. |

## Additional defects discovered during verification

- Fixed a PostgreSQL GROUP BY error in packaging receiving summaries that prevented
  purchase details from reopening after unified receipts existed.
- New warehouse tables are explicitly recognized by the frozen SQLite import
  contract. They must be empty for import. New location attribution triggers are
  disabled during historical import so imported values remain exact.
- Supplier statement cache keys include company branding. Cached shipment and
  production PDFs are regenerated when branding changes.
- Korean PDFs embed the required Noto Sans KR Unicode subsets rather than relying
  on the server's installed fonts.

## Validation

The authoritative results are in qa/evidence/postgres-release.json and
qa/evidence/oct28.json. The release command runs connection/schema/import tests,
static PostgreSQL SQL planning, the existing 31 regression suites and the new
October 28 API/browser/PDF suite. Tests use synthetic records in disposable
PGlite PostgreSQL-engine databases. They do not use the hosted company database.

PDFs were rendered with Chromium and inspected visually in English and Korean.
The supplied Dockerfile already includes Chromium; CHROME_PATH also supports an
existing server installation. The new font files do not require network access
at PDF generation time.

Git and Render were not changed. No live acceptance or deployment is claimed.
