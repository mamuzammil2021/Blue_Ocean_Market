# Scope and remaining operational acceptance

All engineering tests use synthetic disposable databases and actual local servers/browser sessions. No production database, persistent disk, bank transfer or private upload was accessed. Render deployment and live-production acceptance remain to be performed after staging checks. No Git push or deployment was performed.

The reported transaction's entered payment method, amount and reference are unavailable. The release fixes reproduced duplicate/whitespace/normalization/correction paths without inventing those production values. It does not claim forensic confirmation of which of those conditions occurred in that exact live transaction.

Controlled corrections retain historical reversed/voided versions under the protected immutable architecture. Tests count active real movements separately from historical versions. Policy-dependent Accounting proposals remain pending when existing approvals, Finance verification, reversal posting or policy decisions require it. No accounting policy is invented.

Three currencies can still require two genuinely distinct rate pairs; the duplicate Payment accounting rate is not restored. Independent historical invoice/correction carrying values are retained.

The refreshed import page uses one complete snapshot. Confirmed shared cache/race defects and supplier/customer read paths are corrected; this is not a speculative rewrite of every legacy screen. Existing system-wide route/navigation and representative module regression suites are run and documented in the current test report.

New private browser screenshots are used only for visual inspection and are not included in the deliverable. Older release evidence is historical; use qa/evidence/36931-release.json for the checks rerun on this source.

External clients calling the seven legacy Pink Salt money-writing APIs must supply a stable X-Idempotency-Key (or idempotency_key body field) of 8–200 permitted characters and reuse it on retries. Current browser clients supply keys. An unkeyed legacy request is rejected rather than guessing whether two blank-reference cash payments represent the same payment. Keys from the older response cache are not automatically replayed because it did not reliably hash multipart bodies; open the original record first.
