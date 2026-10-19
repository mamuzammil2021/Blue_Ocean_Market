# V30.69.27 — Financial reconciliation

All tests use isolated synthetic data and authenticated local servers/Chromium. No production records or bank services were accessed.

The supplier-bank browser fixture selects an existing saved USD account with a historical `Bank Transfer` method label and spaced lowercase currency. The form sets the supplier-advance payment currency to USD, retains the selected authorized KRW company bank and leaves applicable FX rates empty. After evidenced rates are entered, USD 10 at a bank rate of KRW 1,400/USD records an actual KRW 14,000 debit, a USD 10 recipient settlement and the exact saved supplier-account ID. Finance has exactly one linked money movement; the new receiver currency snapshot is normalized to USD. The KRW carrying basis and policy-dependent difference remain under existing accounting controls.

Server fixtures independently verify USD 100 received from a KRW 140,000 debit. An identical repeat returns the same transaction/Finance movement. Missing, other-supplier, archived and incompatible-currency recipient accounts are rejected atomically for Bank payments.

Cash fixtures record KRW 500 from the exact company Cash account without any supplier account or cash reference. A stale submitted receiver ID is ignored and no recipient-account ID or bank-number snapshot is recorded. Cash import settlement also succeeds with no receiver account. A missing company source is rejected without creating a Finance movement. Cash currency conversion remains blocked.

Delaying/failing the company-account request does not prevent supplier-bank display. It still prevents recording without an authorized company source. Supplier/BU scoping, active status, invoice currency matching, FX evidence, fees, amount limits, approvals, Finance verification, Posting Control, original-user correction ownership and reversal/closed-period controls remain enforced.

Sources: qa/evidence/36927-supplier-accounts.json, 36927-supplier-browser.json and 36927-release.json. Protected V30.69.26 upgrade/restart acceptance preserves every existing cost/transaction/Finance field and Chart of Accounts codes; no schema migration or historical snapshot rewrite is introduced. Excavator financial regression and the inherited simple Import Cost/FX/correction matrices are rerun.
