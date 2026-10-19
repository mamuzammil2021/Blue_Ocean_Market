# Controlled boundaries

- Production deployment, actual bank transfers and external email delivery are not executed by this release's isolated QA. Render latency will depend on service resources and network conditions.
- Cross-currency settlement supports one explicitly evidenced bank conversion leg. Unsupported intermediate/recipient-currency conversion chains remain blocked; visible accounts do not authorize unsupported conversions. Cash cannot convert currencies.
- Fees and realized FX journals remain controlled pending proposals when the required company accounting policy is not approved. Finance verification and Posting Control eligibility remain mandatory; no policy approval is fabricated.
- Received inventory cost changes and direct cost reversals require an approved inventory valuation adjustment. Same-carrying-value payment corrections can use the protected replacement workflow. Closed periods and posted journals retain reversal/reposting controls.
- The existing Import Cost flow records paid expenses. It has no accrued/unpaid-cost mode; this release does not introduce an unreviewed accrual policy.
- The existing Posting Control queue has search, status and business-unit controls; it has no user-facing sort or pagination controls to preserve. Queue row updates preserve its existing controls and scroll.
- The first statement PDF still invokes Chromium. An unchanged authorized snapshot can be reused for up to 60 seconds; its cache key includes actual ledger contents, supplier, range and language. A financial change invalidates the snapshot immediately by changing that key.
- QA screenshots and statement samples use generated synthetic records. Original private QA-document screenshots and real uploads are intentionally excluded from the distribution.
