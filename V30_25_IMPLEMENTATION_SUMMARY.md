# Blue Ocean Market V30.25.0 Implementation Summary

**Release:** V30.25.0  
**Baseline:** V30.24.3 Git-ready + Render persistent-disk build  
**Release focus:** Finance integrity, source-aware Accounting eligibility, correction reliability, BU-scoped master selectors, Buyer/Supplier statements, and navigation hardening.

## 1. System-wide Finance Integrity Rule

V30.25.0 separates the three control layers:

- **Operations** records the business event (sale, purchase, import, production, etc.).
- **Finance** records only genuine money movement: Money In, Money Out, refunds and transfers.
- **Accounting** records recognition and settlement through controlled journal proposals/postings.

A single real-world payment/receipt creates only one primary Finance cash transaction. An operational sale, purchase or import no longer creates a second Finance cash row merely because it has monetary value. Existing advances remain genuine Finance movements, while allocations against an existing advance/payment do not create another receipt/payment.

## 2. Accounting Posting Eligibility

Accounting Posting Control now evaluates the correct source control:

- A posting sourced from a real payment/receipt/refund/transfer requires the linked Finance entry to be **Verified** before posting.
- A posting sourced from a non-cash operational event requires the source operation to be **Completed/Approved** according to its workflow. It does not create an artificial Finance Verification record.
- Excavator Sale remains subject to the existing 100% payment/advance rule: the sale must be completed and the required allocated buyer payments must be Finance Verified before the sale-recognition posting becomes eligible.
- Allocating a previously verified advance does not create a new Finance Verification event.
- Manual journals continue to use Accounting approval controls directly.

Posting Control surfaces source status, Finance verification requirement, linked-payment status and payment-requirement status so the reviewer can see why a proposal is or is not eligible.

## 3. Existing-data transition protection

Legacy V30.24-era Finance rows that represented operational sale/purchase recognition are migrated/treated as non-cash operational rows so they no longer inflate cash totals. Unposted legacy Accounting proposals are superseded by the new operational-source proposal. Already-posted legacy accounting is not silently rewritten; controlled reversal/proposal handling is used where required.

## 4. Finance Correction / Resubmission

Correct & Resubmit now preloads the existing transaction values instead of presenting blank fields. The correction form carries forward the current amount, currency, FX rate, payment date, payment method, reference, notes, exact Company Financial Account and existing evidence/attachments where available.

The original payment reference may remain unchanged. Duplicate-reference validation excludes the current logical payment family and only blocks a genuinely different active transaction using the same normalized reference on the same financial account.

## 5. Cash-reference rule

Payment Reference is optional when **Payment Method = Cash** throughout the system. A cash payment with a blank reference must not:

- fail validation,
- generate a Missing Reference warning,
- appear as a Finance verification exception, or
- run duplicate-reference checking.

Non-cash methods continue to require/reference-check where operationally appropriate.

## 6. BU-scoped searchable master selectors

Buyer/Supplier/Seller and similar master selectors use a robust searchable dropdown/autocomplete pattern while preserving strict Business Unit scoping. Excavator workflows only show Excavator masters, Pink Salt only shows Pink Salt masters, and so on. The controls improve real-time filtering, touch/keyboard behavior, long-list scrolling and modal/full-screen positioning without mixing records across BUs.

## 7. Buyer and Supplier Statements

The missing **Statement** action is restored on Excavator Buyer and Supplier detail/profile screens. Statement access remains BU- and permission-scoped and uses the existing period-aware statement APIs/PDF output. Pink Salt customer and supplier statement workflows remain intact.

Statements retain From/To filtering, opening balance, period activity, advances/allocations/refunds where applicable, closing/outstanding balance and professional EN/KR-ready PDF/export behavior. Closing the statement returns to the same parent profile/workflow context.

## 8. System Settings navigation reliability

CEO / Owner and authorized System Administrator navigation is refreshed after authentication/module hydration so System Settings does not disappear because of client script/load order.

## 9. Inherited protections retained

V30.25.0 retains:

- V30.24 explicit full-screen workflow architecture,
- V30.24.1 parent-context/document/statement refinements,
- V30.24.2 nested-dialog isolation and Finance reference safeguards,
- V30.24.3 BU-scoped Numbering & References registry, and
- Git-ready Render persistent-disk storage under `/var/data`.

## QA

- `npm run qa:current` — **PASS**
- `npm run qa:render` — **PASS**
- Source/static output: `qa/V30_25_STATIC_QA_RESULTS.txt`
- Render persistence output: `qa/V30_25_RENDER_QA_RESULTS.txt`
- Runtime smoke is not claimed in the clean build container because `node_modules` is intentionally excluded. Run `npm ci && npm run qa:runtime` in the normal Node 22 test environment before production acceptance.
