# V30.69.27 — Boundaries

The reproduced source defects are covered by isolated fixtures; no production database was accessed to identify the exact affected live account. The fix addresses currency filtering, historical method/currency formatting, stale context and coupling to company-account requests. Account authorization, supplier/BU ownership and active status remain enforced.

For a fixed-currency invoice, the recipient account must use that invoice currency. A different recipient currency requires supported, separately evidenced conversion legs; it remains disabled/rejected. Company source accounts may use a different supported currency when the actual bank conversion is recorded.

Cash never needs a supplier bank account. It still needs an authorized company Cash account, payment amount, date and receipt/evidence. Cross-currency Cash remains blocked.

The V30.69.26 simple typed-recipient Import Cost flow is preserved. Existing policy-dependent FX/fee posting, received-inventory valuation, immutable correction/reversal and closed-period controls remain. No production deployment, real bank remittance or external email delivery is claimed.

No deep-route startup redesign is included; the separate noted ancestor-page flash remains a future task. Existing refresh, Back/Forward and logout routing regressions are tested.
