# October 17 QA corrections and payment integrity

Baseline: V30.69.31 PINK_SALT_QA_REFERENCES_COSTS_REFRESH_GIT_READY. Verified ZIP SHA256: f3389a820c47ebdd71908cf4b3f761e015b6b2cf0ac533f3d660cda28dc2e568. The available source inventory was checked before editing; no newer protected application source was found. Result: V30.69.32.

The attached QA document's complete text and all ten embedded screenshots were inspected. Its private screenshots are not redistributed. All reproductions and financial evidence use synthetic isolated databases.

## Currency valuation and posting

The protected server accepted an explicitly supplied foreign-to-KRW valuation of 1 independently of the same-currency bank transfer ratio. On an isolated .31 database, USD 49,950 against an invoice carrying rate of 1,000 reproduced bank KRW 49,950, invoice allocation KRW 49,950,000 and FX gain KRW 49,900,050. This reproduces the arithmetic, not the unknown sequence of live form inputs. Missing foreign valuation was already rejected in the current shared form; the defect was that an apparent identity valuation could be accepted without an evidenced exception, while Finance prominently displayed the stored KRW value and the posting list lost the specific blocking reason.

The shared calculation now distinguishes transfer identity from payment-date KRW valuation. Missing foreign valuation and arbitrary KRW-to-KRW valuation are rejected. A foreign valuation of 1 requires an explicit evidence explanation and CEO accounting-policy approval before posting; it is never silently substituted. Distinct historical recognition and payment bases remain separate. Foreign-to-foreign conversion needs the genuinely distinct pairs; no quote metadata or duplicate accounting-rate entry returns.

Finance rows show actual source-account currency/amount prominently, with a separately labelled KRW equivalent, valuation direction/date and review warning where applicable. Posting Control shows actual Finance verification separately from Accounting readiness. Its previous code read a nonexistent readiness.reason instead of the populated warnings array, leading to a generic Individual review required label. It now uses the same detailed checks as the posting review/final-post path: invalid/missing valuation, native/KRW mismatch, Finance/snapshot mismatch, policy approval, current/confirmed status, linked reversal and journal match.

A read-only valuation-review API and copy-only audit script identify existing suspect FX snapshots. Nothing is automatically revalued. Original-user correction rebuilds an unposted payment with immutable history; posted records require authorized reversal/reposting. Real posted-history upgrade and repair are exercised. Advance allocation remains non-cash under the existing KRW credit carrying basis; only the new payment creates cash Finance. Native source amounts and KRW credit/invoice carrying values remain distinct. Normal FX differences arise only from valid confirmed values and retained carrying bases.

## Stable operational costs and revisions

The old correction engine created a new operational cost projection for every immutable financial revision. Corrected costs now update the same operational row and its current FX pointer within the reversal/replacement transaction. Old FX, Finance and posted journal versions are retained, not overwritten. A revision table records before/after operational snapshots, actor, timestamp, reason and Finance request. The current cost returns to Resubmitted or Pending Verification as applicable.

Original FX URLs resolve the current business version, including earlier correction chains, while history exposes the financial versions. Current lists/totals/landed costs read the current operational row. Historic voided rows from pre-.32 corrections remain history; they are not deleted or rewritten. Reference exclusion continues to identify the exact logical payment and its linked representations.

Full-screen cost details now include relevant native debit, recipient amount, valuation directions/purposes, KRW cost/bank equivalents, fees, account snapshots, reference, view/download evidence, current Finance and Accounting status, correction context, created/updated/verified information, linked records and revision history. Simple KRW payments omit irrelevant conversion fields. Layouts stack on narrow screens.

## Advances

The supplier profile exposes state-appropriate Open/Edit/Void and draft-only Delete actions. Verification/posting/allocation locks are derived from authoritative records. Shared-engine advances use stable operational revisions; the legacy amendment route now locks verified/posted records, enforces original-user control and performs Finance sync inside its transaction instead of swallowing a failed resync.

An advance's own active allocations are checked, so another advance's available pool cannot make reversal of an allocated advance appear safe. Allocated rows explain the unallocation/reversal requirement. Recorded payments use audited Void, preserving Finance/source history. Only owned drafts with no Finance/FX/allocation dependencies can be deleted. Legacy amendment retries check both payload and uploaded evidence, roll back on late failure and preserve approval/audit controls. Deferred legacy advance approvals and sensitive import approvals have explicit executors with revalidation.

## Import save and authorization

The generic save processing surface stayed above the CEO decision dialog while the API awaited the decision. The protected baseline browser reproduces this obstruction. During that explicit server authorization handshake, only processing presentation is suspended so the decision is interactive. No mutation runs until authorization; processing resumes for execution and all normal locking remains.

A separate root cause affected non-CEO sensitive edits: no automatic executor was registered. The new executor reuses the same validation/apply function, checks current permissions and the approved before-snapshot, and refuses stale changes. Metadata, composition, inventory/settlement checks, reasons, audit and approval completion remain atomic.

Confirmed import edit/receive operations store payload-checked durable response receipts. The browser retains a form operation key. On a lost response it checks operation status; it recovers a committed result or offers explicit status/retry controls, preserving input. It does not blindly resubmit.

## Receiving and statement downloads

The receiving UI awaited automatic shipment-PDF generation after the stock mutation. Receiving now completes after stock/status/audit/Accounting commit; existing explicit PDF actions remain available. Accounting receipt preparation is inside the same transaction. Arrival/quantity validation, keyed replay and duplicate-receiving checks protect retries/concurrent requests.

Statement preview, CSV and PDF share the ledger and date filters, use current active settlements, display advance allocations as zero-cash rows and label KRW totals. Payment details identify native source debit, invoice settlement and carrying basis. Both offered formats are actually downloaded in Chromium.

The PDF runner previously used Chrome's shared default profile, with unbounded concurrent processes and incomplete process-tree cleanup. It now uses private per-report profiles, a bounded queue, process deadlines and process-group cleanup. Download requests also have a bounded failure path and restore their button. Local baseline statements were already fast; deployment-specific slow PDF/query behavior was not reproduced, so no production latency improvement is claimed. See the measured results.

## Preserved scope

No PostgreSQL migration, production database/disk operation, Git push, merge or deployment occurred. Existing CoA codes, raw historic financial fields, native Excavator financial mutation handlers, direct deep-route controller, category placement, reference validation, single-entry rates, evidence rules, approvals, BU isolation and targeted freshness controls are preserved. Reusable capabilities are added to the platform registry.
