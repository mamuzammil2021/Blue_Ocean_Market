# V30.69.21 — October QA corrections and sales settlement staging candidate

Baseline: V30.69.20 cross-currency staging candidate, the newest actual source available when work began. No newer protected source was found. This build preserves the durable payment engine, persistent routing and all earlier application source. The complete QA report and all seven screenshots were inspected. No production database, disk or uploads were accessed.

## QA points 1–7

| Point | Implementation | Evidence / acceptance boundary |
|---|---|---|
| 1. Receive Shipment | Disabled lock button and one contextual reason; shared server eligibility requires the full supplier purchase carrying amount to be covered by Finance-verified cash movements or advances backed by verified original movements. Direct receiving API rejects ineligible requests. Corrections/reversals recalculate eligibility. Received historical imports remain unchanged. | Actual API unpaid/partial/unverified/verified cases; authenticated browser lock, verification unlock and reversal relock. No new exception bypass is introduced. |
| 2. Production Edit / Delete | Edit metadata; permitted draft date correction; completed stock/cost/date/lot values immutable. CEO-controlled Void appends opposite raw/packaging/finished movements, deactivates lots, retains outputs, waste and audit, and creates controlled Accounting reversal. Consumed/sold/reserved output and closed periods block reversal. A corrected replacement uses the normal production engine and an immutable unique link to the voided original. | Actual production, metadata edit, forbidden quantity edit, exact stock restoration, duplicate void, consumed-output rejection, posted GL reversal and linked replacement posting dependency tested. Browser Edit/Void passed. Permanent deletion is intentionally unavailable. |
| 3. Customer Archive | Archive/Restore with reason, audit and permissions; Active/Archived/All server-paged filter; default active selections exclude archived customers. Historical orders, statements, receivables, refunds and advances remain present. Both order creation APIs reject archived customers. | Actual server archive/filter/restore/history and authenticated browser Archive/Restore. |
| 4. Account tabs | Blue active tab with white text, focus styling and selected semantics; pane-only switching; stable customer record URL with section restoration. | Authenticated browser checks contrast and refresh on Customer Pricing. |
| 5. Order overflow | Responsive min-width grids and compact line layout; usable remove buttons, live totals and sticky actions. | Authenticated Chromium checks every input/action against viewport at 1440, 1280, 1024 and 768 px. Synthetic EN/KR screenshots included. |
| 6. Sales / settlement | Product/SKU and stock, quantity/unit, suggested/actual price and line total; summary before settlement; subtotal, discount, delivery, platform expense, total, credit plan and remaining due. Separate choice to receive full/partial payment after saving. Actual status is computed from allocations/receipts. Existing shared FX engine labels incoming company receiving accounts and supports subsequent receipts, advances, combined settlement, corrections/refunds/reversals. List has payment status chips, server-paged payment filtering and Receive Payment for outstanding completed orders. | Actual multi-line totals and partial + final receipt browser transactions; exact account, Finance amounts and outstanding checked in SQLite. Idempotent order creation, stock/COGS/profit reconciliation, rollback and cancellation/lot release tested. Existing payment matrix rerun. |
| 7. Validation | Specific field borders/messages, first-invalid focus, retained entered data, automatic clearing; quantity/inventory, price/cost policy, manual override reason and discount/fee controls. Server independently rejects invalid values and below-cost unauthorized requests. | Browser missing customer/product checks and server invalid price/fee/discount cases. Existing CEO/Owner cost policy remains intact. |

## Financial and inventory reconciliation

Browser order: 2 + 3 units × KRW 1,000 = KRW 5,000 subtotal; discount 20; delivery 100; invoice KRW 5,080. Platform fee KRW 50 is a separate expense estimate affecting margin, not an extra customer receivable reduction. Receipt KRW 1,000 leaves KRW 4,080 and Partially Paid; a subsequent KRW 4,080 receipt changes status to Paid. Exactly two authoritative actual money movements exist, using the selected company account.

Production test: 6 kg raw salt consumed, 10 × 500 g output = 5 kg finished goods, 1 kg waste. Voiding restores the full 6 kg input and reverses the 10 units of output. Original movements, output records and waste history remain. Voided production waste is excluded from current dashboard loss totals. Posted recognition reversal remains Pending Review until Accounting Posting Control final-posts it. A linked replacement cannot final-post ahead of the original reversal; repeated replacement submission is blocked by a unique constraint.

Customer archiving changes active selection eligibility; it never removes historical financial balances. Order cancellation restores sold stock once and releases finished-lot allocation. Non-cash advance application never creates a fresh Finance receipt. Cross-currency quote/debit/fee/carrying-value distinctions and the actual company account remain the V30.69.20 shared engine's responsibility.

## Tests and limitations

Current result: `qa/evidence/36921-release.json`; the final consolidated gate includes 144 passing behavioral checks plus syntax checks. This gate checks all active server/public JavaScript, startup/Accounting runtime, financial integrity, all existing FX workflows, approvals/permissions, Excavator server financial regression, migration/restart from the actual V30.69.19 archive, new QA controls, and two authenticated Chromium matrices. Tests use disposable SQLite databases and synthetic evidence only. Native payment forms remain inert during initial account/correction loading; existing original account values cannot be acted upon before prefill is ready. New QA dialogs are protected against late background remounts while editing.

This release remains **STAGING_CANDIDATE**, despite implemented/tested primary paths for all seven points. It is not full production acceptance. Still required: full Excavator browser interaction matrix; bilingual PDF rendering and report-specific PDF acceptance; real isolated Render persistent-disk deployment/restore rehearsal; remaining unusual historical entry points/approval configurations and complete UI loading/error/keyboard/dark-theme acceptance. Production quantitative correction is supported as eligible Void then linked replacement; consumed output requires first resolving dependent records, not an unsafe rewrite. The replacement factory is implemented, but its complete browser creation/confirmation path is not separately covered; the durable engine/link/posting controls are server-tested. No actual business FX/fee accounting policy has been approved by QA.

Existing reports/order recognition are KRW-based. No new tax regime, per-line discount regime or bank-rate feed is invented. Existing order-level discounts and platform expense semantics are retained. Full/partial collection at creation is an explicit second review after order creation; cancelling that review leaves the order unpaid/partially settled according to actual records.

## Reproducing the build

Use Node 22 and the existing configuration. `npm ci`; `npm start`. The automatic guarded startup runner adds only missing columns, indexes and the QA action history table. The SQL reference is for review; use application startup rather than manually applying it to live storage. Existing records are not reset.

```bash
npm ci
python3 -m pip install playwright
python3 -m playwright install chromium
export BOM_BASELINE_ZIP=/absolute/path/Blue_Ocean_Market_V30_69_19_IMPORT_CURRENCY_GUARD_INCOMPLETE_STAGING.zip
npm run qa:release
```

Optional `BOM_CHROMIUM` / `BOM_PYTHON` select browser/Python executables. `npm run qa:oct12` and `npm run qa:oct12:browser` run the new suites. Earlier suite names are retained for reproducibility. The constrained build environment used Chromium headless shell and installed Korean fonts for screenshot review. Included screenshots show synthetic records, not production evidence. Dependencies/browsers are not bundled.

## Render deployment and rollback

Stage on a separate service/disk with synthetic or sanitized data first. Preserve existing DATA_DIR, UPLOAD_DIR, secrets and persistent mount. Do not detach/recreate/reset production storage. Before an authorized production upgrade, pause writes and take a consistent SQLite Online Backup API snapshot with matching uploads; rehearse restoration separately and verify the snapshot. Do not copy only a live SQLite main file while ignoring WAL state.

After new FX records exist, downgrading to old code that backfills payment projections is unsafe and can duplicate Finance. Prefer a forward fix. Any full rollback must pause writes and use an explicitly approved matching database/upload snapshot, with a decision about transactions recorded after the backup. Additive columns can remain for a forward fix. Never execute automated database deletion or reset. Business Accounting must approve the real FX/fee policy before applicable postings; Finance verification and Posting Control stay mandatory.

## Mac Git push

Use a clean clone and keep `git status --short` clean before copying. Substitute the real repository URL and extracted path. Use staging if main auto-deploys production.

```bash
git clone YOUR_REPOSITORY_URL Blue-Ocean-Market
cd Blue-Ocean-Market
git switch main
git pull --ff-only
git status --short
rsync -av --exclude='.git' --exclude='.env' --exclude='node_modules' --exclude='data' --exclude='uploads' --exclude='backups' /path/to/Blue_Ocean_Market_V30_69_21/ ./
git diff --stat
npm ci
# Run isolated QA and finish the staging acceptance above.
git add .
git diff --cached --check
git commit -m "Complete primary Pink Salt October QA corrections and sales settlement redesign"
git push origin main
```

No `--delete` is used. Review staged changes; production secrets/data never belong in Git. No production deployment was performed by this build.
