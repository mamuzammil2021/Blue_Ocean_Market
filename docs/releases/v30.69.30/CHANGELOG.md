# V30.69.30 — single-entry payment exchange rates

Built directly from protected V30.69.29 (ZIP SHA256 dbb486636052cf2546350ad676d4968a0009f30f2713ee2f0acea73d6cc0ec67).

- Removed the entire Bank quote / confirmation details section from all shared Pink Salt payment forms, including Import Costs and refunds. Quote reference, source and timestamp are no longer required by the server. Existing historical values are retained.
- Removed duplicate Payment accounting rate entry when a new payment’s entered bank rate already determines its KRW value. Source debit, recipient amount, fees and KRW equivalent reuse that rate and update on leaving the field.
- Same-currency foreign payments show one KRW reporting rate. KRW-to-KRW payments have no editable rate. Two foreign currencies plus KRW may require two distinct pairs; the third rate is calculated, never invented.
- New payment conversion/reporting rates remain empty until entered. Currency/account changes clear incompatible rates. Same-currency identity conversion uses 1 internally.
- Original invoice carrying rates and historical correction bases remain intact. An existing independent accounting basis is shown read-only for applicable KRW-account corrections, preserving real FX differences.
- Server checks reject inconsistent shared rates atomically. Existing legacy API calls retain their explicit accounting bases. Historical snapshots store normalized rates for reliable corrections.
- Preserved evidence/reference policy, Review & Confirm, processing protection, cost locks, permissions, idempotency, Finance linkage, controlled Accounting proposals and deep-route hydration.

No schema migration or existing-record rewrite is introduced. Shared capabilities are registered additively. Native Excavator handlers and routing code remain unchanged.
