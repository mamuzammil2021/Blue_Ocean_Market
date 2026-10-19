# V30.69.31 — Pink Salt QA corrections

Baseline: protected V30.69.30 SINGLE_PAYMENT_EXCHANGE_RATE_GIT_READY, archive SHA256 613297ef39ed523d7024c90d3267153144bf63c8581571f7b3100ef8881e22eb. Latest available source was verified before implementation. No older source was substituted.

## Reference constraint and validation

The protected FX path relied on the unique index on company account and lower(trim(reference)), with a partial condition reference != empty string. It did not perform a friendly reference precheck before the FX insert. Different whitespace-only optional cash references therefore entered the index as the same empty trimmed key. Genuine duplicates also reached the index before the user received a field-specific explanation. Finance uses an established stronger normalization (case-insensitive, keeping Latin digits/letters and Hangul); the FX insert and Finance validation were inconsistent.

The unmodified V30.69.30 server reproduced the whitespace collision on an isolated database. This is one verified cause, not a claim that the reported PS-IMP-2026-00001 transaction used Cash or blank references: its entered method, amount and reference are unknown. Genuine duplicate and normalization cases are separately tested.

The fix reuses Finance normalization and account scope, checks both linked FX and Finance representations, validates during entry and immediately before save, and translates safe errors. No unrelated global uniqueness rule is added. New references are trimmed on writing; historical references are untouched. Blank optional cash references are excluded from uniqueness. The safe rerunnable migration adds a normalized lookup column/index and transactionally replaces only the problematic partial index. Historical collisions under the stronger normalization do not block schema creation; no records or references are rewritten to hide a conflict.

Runtime checks use a read-only endpoint, cancellation/version guards, inline highlighting, top alerts and focus/scroll on blocked submission. Separate bank-charge references identify their own field. An obsolete result cannot invalidate a newer value. Required bank references and optional cash references retain their existing rules. Responses disclose no conflicting record ID, date or private details.

## Finance corrections and financial identity

An original user may retain the original reference. Runtime, preview and save checks exclude the current logical payment and its linked representations. A changed reference is checked against unrelated applicable payments. Original-user and assigned Finance-correction checks are enforced on the server, including direct API attempts. An existing authorized pre-verification cost edit and CEO/Admin Correct Posted Cost remain available under their protected policies.

The existing immutable reversal/replacement architecture is retained. It preserves original snapshots, evidence, audit and approval chains; historical Finance versions remain Voided/Reversed, and exactly one active authoritative movement represents the corrected payment. This does not add a second independent receipt or expense. Linked legacy representations of the same movement are reversed with audit and Accounting controls, not silently deleted. Posted reversals/reposting remain controlled proposals; received-inventory valuation and closed-period restrictions remain in force.

## Legacy cash API atomicity and retries

The compatibility audit found older cash handlers that could insert a source cost and recalculate landed allocations before Finance rejected the save. Seven legacy money-writing routes now register one shared synchronous atomic controller directly at their route definitions. It commits source records, Finance, Accounting, allocation changes, audit and a response receipt together; errors roll back the complete transaction and remove only the newly uploaded failed-request evidence. Legacy customer receipts also no longer treat two optional blank cash references as duplicates.

These legacy APIs require a stable idempotency key and compare a sorted payload/evidence hash. Concurrent identical retries replay one result; changed payloads with the same key are rejected. The old pre-multipart request guard now delegates these routes and the FX record route to their stronger controllers, so it cannot replay a response without checking its payload. Historical request keys that cannot be verified against a body hash are blocked with an instruction to open the original record. An additive pink_legacy_payment_requests table stores the new committed response receipts. Excavator routes are unchanged.

## Import category builder

The Add Category button was in the section heading, before the blocks. It now stays inside the category container after all blocks. Add focuses the new first field and scrolls it into view; the model retains all previously entered values, including after removal. The existing renderer and field handlers are reused.

## Cost section and correction state

Current costs show category/description, original currency/amount, distinct KRW equivalent, date/method/reference, payee and applicable account snapshots, Finance/Accounting status, locks and permitted actions. Totals are grouped by currency and a separately labelled KRW equivalent. Replaced/voided costs move to collapsed history. Long lists use bounded internal scrolling; panels stack on narrow screens.

Correction Requested includes Finance reason, requester/date where recorded and the authorized original-user action. Resubmitted remains awaiting Finance acceptance, rather than disappearing after an attempted save. Details and correction forms retain relevant account/evidence context and the original reference. Existing FX URLs remain stable; legacy costs receive a registered cost-specific detail route.

## Stale/staged rendering

Import Detail used multiple sequential wrapper/decorator paths, repeatedly fetching and decorating already rendered cost rows. Cost locks and correction status could be added after a less complete first render. The canonical import renderer now loads an authoritative snapshot and builds the completed destination before committing it. The older import wrapper chain is bypassed; its required actions, received PDFs, allocation history and controls are retained in the canonical renderer.

The shared cache also allowed an invalidated old promise to repopulate a cache entry or delete a newer promise. Its keys omitted the user. Those ownership/invalidation races are fixed. In-flight GET coalescing now respects caller cancellation and confirmed mutations. Snapshot/profile reads use scope/navigation/version guards, and explicit refresh reads do not reuse a stale in-flight response.

Read-only FX previews/reference checks previously passed through mutation feedback/fallback paths. A shared request-intent classification now keeps them out of processing overlays and save-triggered refreshes. Actual mutations retain their existing review and processing controls. Targeted same-import refresh preserves the header, history expansion, list scroll and page position, with one localized updating indicator. Supplier/customer profile reads also reject superseded responses.

## Protected behavior

The V30.69.30 simplified payment choices and single-entry rates remain. Bank quote details and duplicate accounting-rate input are not restored. Original invoice carrying values/FX differences, all eligible source accounts, evidence, cash-reference rules, Finance posting eligibility, permissions, BU isolation, EN/KR and direct route hydration are preserved. The routing controller and native Excavator financial mutation handlers remain unchanged. Reusable capabilities are registered for imports and FX payments.
