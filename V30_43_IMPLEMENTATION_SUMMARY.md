# Blue Ocean Market V30.43.0 — Implementation Summary

## Baseline
V30.43.0 is built directly on V30.42.0 **Actionable Tasks & Smart Access Control**. It preserves the V30.39.2 performance/data-path protections, V30.40–V30.42 access/task safeguards, Render persistent-disk architecture, Review & Confirm, audit, permissions, targeted refresh and Finance/Accounting integrity rules.

## 1. Targeted refresh after child actions
- Supplier Profile → Machines now refreshes the affected Machines section after Add/Delete Machine succeeds instead of requiring a browser refresh.
- Buyer Profile → Payments refreshes the affected Payments section after a buyer receipt mutation.
- The implementation deliberately refreshes only the affected section and reuses the V30.33/V30.37 targeted-refresh infrastructure rather than remounting the whole page.

## 2. Browser refresh preserves child workflow context
- Added a shared session-scoped child-context registry for Supplier, Buyer, Machine, Task, Approval, Finance, Finance Correction and Accounting Account detail workflows.
- Supplier and Buyer selected sub-sections are preserved where applicable.
- Browser refresh restores the same child/detail screen when the top-level module is still the same.
- Normal navigation away from that workflow clears the stored context.
- A `BOMRegisterChildContextV343` hook is exposed so future detail workflows can opt into the same rule instead of adding isolated refresh hacks.

## 3. Machine Cost and Purchase edit rules
- A linked Finance row existing by itself no longer locks an Excavator machine cost.
- Direct cost Edit stays available while Finance has not acted on the linked record.
- Finance action states (verification/correction/rejection/resubmission) and Accounting posting lock normal direct Edit and route the user to the controlled Finance correction/reversal workflow.
- Purchase is informational inside the Costs list and no longer shows a duplicate Edit button there.
- Purchase is edited only from the dedicated Purchase card while the machine is eligible.
- Once the machine is Sold / Completed, Purchase editing is locked in both UI and backend.

## 4. Sold-machine document protection
- When a machine is Sold / Completed, ordinary users no longer see Delete / Archive for machine documents.
- The archive endpoint also enforces CEO / Owner-only access for sold-machine documents; hiding the button is not relied on as the security boundary.
- Existing audit/history and preserved-original-file behavior remain intact.

## 5. Optional Buyer Sending Account on receipts
- Added additive `excavator_buyer_payments.buyer_sender_account_id` support.
- Add Buyer Payment and Sell Machine/new-payment flows can select an existing active account belonging to the Buyer.
- Users may optionally enter new Buyer account details inline; those details are saved to the existing counterparty account master and linked to the Buyer for later receipts/refunds.
- Buyer sending-account data is optional. The receipt can still be recorded without it.
- The Buyer sending account is distinct from the Blue Ocean company **Receive Into** account; the existing company-account/payment-method/country eligibility rules remain authoritative.
- Buyer payment history exposes the sender account label/bank/currency/masked account where recorded.

## 6. Accounting Cash & Bank Account drill-down
- Accounting → Cash & Bank Accounts now supports opening an individual Company Financial Account.
- Account detail shows current balance and a selectable statement period.
- Statement rows are assembled from account-specific real money movements, including Finance entries and supported direct-account transfer/payment subledgers, while preserving account/BU access checks.
- Statement summaries include Opening Balance, Money In, Money Out, Closing Balance and per-row running balance.
- Statement rows include date, type, reference, description/source context, inflow, outflow and running balance.

## 7. Account Statement PDF
- Added authenticated PDF generation for a selected account/date range.
- PDF includes account identity, BU, currency/masked account details, statement period, opening/in/out/closing summaries and paginated transaction rows.
- English/Korean-capable PDF font mapping is included without exposing font files.
- Download is no-store/authenticated and uses the user's current account/BU authorization.

## 8. Company account transfers
- Added controlled transfer action from an Accounting account detail.
- Same-BU transfers create a balanced Accounting journal between the two mapped GL accounts and retain a dedicated transfer record/audit entry.
- Source/destination account currencies are validated and KRW equivalent is recorded.
- Cross-BU account transfers deliberately use the pre-existing Accounting Inter-BU transfer workflow so due-from/due-to accounting is preserved instead of creating a shortcut.
- Closed-period and missing-GL-mapping checks are retained for same-BU transfers.

## 9. Release/compatibility
- Server and browser identity advanced to `30.43.0`.
- `v343-client.js` loads after the protected V30.42 client layer.
- `server/v343.js` installs additive V30.43 account/statement/transfer behavior.
- Database changes are additive (`buyer_sender_account_id` and `accounting_account_transfers_v343`); no table drops or destructive reset.
- Existing SQLite data, uploads, evidence, backups and Render persistent disk remain compatible.
