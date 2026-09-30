# Blue Ocean Market V30.63.0 — Dialog Actions & Root Processing

Built directly on the protected V30.62 collaboration/platform baseline.

## Implemented
- Added shared `public/v363-dialog-processing.js` loaded last in the browser.
- Scrollable medium/large dialogs and confirmations now receive persistent sticky terminal action groups without rewriting their business forms.
- Small dialogs retain their natural compact layout.
- Serious mutating API requests are promoted to the root `processingRoot` portal, including direct `fetch`/multipart-style mutation paths that could previously bypass the API-level presentation wrapper.
- Root processing surface is above pages, modals, confirmations, drawers and nested content.
- Existing upstream root processing is reused when already present; duplicate root surfaces are reconciled/suppressed.
- Legacy modal-local V30.38.2/V30.53/V30.45 progress chips/overlays are hidden while the root serious-mutation state is active.
- Generic application roots are made inert while serious processing is active; Escape/modal close/conflicting interaction are guarded and unload receives protection.
- Notification mark-read, language and auth mutations remain excluded from this serious-processing surface.
- Existing Review & Confirm, idempotency, targeted refresh, Finance/Accounting and collaboration logic remain unchanged.

## Compatibility approach
This is an additive presentation/locking layer. It does not migrate or rewrite ledger, payment, approval, meeting, task or persistent business records. Existing modal and transaction handlers remain authoritative.

## QA
- V30.63 dialog/processing source QA: 21/21 PASS.
- V30.62 collaboration regression QA: 21/21 PASS.
- V30.61 registry regression QA: 21/21 PASS.
- V30.60 Accounting controls regression QA: 24/24 PASS.
- Current source/syntax QA: PASS.
- Real Render/persistent-database browser acceptance remains required after deployment.
