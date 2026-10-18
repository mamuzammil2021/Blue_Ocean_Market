# V30.69.25 — consolidated October 14 QA corrections

- Build on protected V30.69.24 and reconcile active bundled handlers with canonical Pink Salt and authentication paths.
- Target supplier KPI/list refresh for payments, advances and allocations; stabilize shared account management and Accounts routing.
- Correct statement completeness/date ordering, original-currency context and CSV totals; reduce repeated generation using ledger-keyed PDF reuse; verify EN/KR exports and remove a blank PDF page.
- Add scoped, idempotent Finance action notifications and exact related-read behavior.
- Preserve active Posting Control, search/status/scroll and intentional Finance return navigation through review/posting.
- Preserve Import Detail on Edit Save/Cancel/X and failed-save retry; protect historical Actual Arrival and collect it only in receiving.
- Separate third-party Import Costs from purchase-invoice payment context; use independent payees/accounts, categories and conditional validation; eliminate the unbounded sentinel and reject unsafe numeric precision.
- Equalize/bound import payment/cost panels and maintain exact correction/task/Finance status until acceptance.
- Use atomic immutable replacements/reversals for supported corrections, including separately evidenced fees, original-user ownership, audit and controlled posting gates. Restore unreceived landed valuation on a cost reversal.
- Improve shared field highlighting/focus/scroll and dynamic required markers; rebuild the translated shell at the same URL/record/section when changing language; protect row-remove controls from modal-close normalizers and keep voided cost history read-only.
- Revoke only the logged-out token; issue unique tokens in the active authentication handler; isolate stale responses; reset explicit-login navigation while preserving authorized refresh/deep links.
- Add additive migrations, authenticated browser/financial tests, PDF and performance evidence, source-protection comparison, completion matrix and deployment/rollback/Mac Git instructions.

No production data, credentials, private uploads or dependencies are distributed. Existing Chart of Accounts codes and approvals remain intact. No production deployment or Git push is performed by this build.
