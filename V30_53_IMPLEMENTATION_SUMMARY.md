# Blue Ocean Market V30.53.0 — Financial & UX regression corrections

Source: exact V30.52.0 archived source available in the user Library. Original source folders, SQLite migrations, persistent-disk startup and history are retained. No test reset, no production data edits.

## Implemented source changes

1. **Buyer edit origin:** Edit from Buyers list closes the form, remains on list and preserves list context via targeted refresh; edit from profile remains on profile. Success includes entered buyer name.
2. **Shared success feedback:** V30.53 shared green-bordered success card with check icon, a dedupe window and automatic dismissal layered after V30.45 single-feedback system.
3. **Payment lifecycle:** Shared request-level form protection for detected payment/refund/sale/transfer and token-purchase mutations. Protected in-flight form blocks duplicate actions and closing; sends persistent `X-Idempotency-Key`, retains successful promise on same form and retains key on ambiguous connection failures. Original server request-idempotency middleware remains. A fallback scoped 'Recording payment…' overlay is only shown if existing V30.45 overlay is absent.
4. **Accounting UI:** Remove redundant Posting Control control from its own screen and dedupe Back to Simple View at source/enhancer level.
5. **Create-form context:** Remove supplier receiver account example values from actual input values. Placeholder example is English/Romanized for English UI and mapped to Korean only when Korean chosen. Preserve legitimate configured defaults and actual saved edit values. The scoped account form source is corrected; not every historical form has been individually browser-audited.
6. **Buy Machine token accounts:** Retire fragile custom mirrored pickers, expose native account selects holding original IDs; isolate shared supplier account manager click; on close use the actual full-screen Buy Machine form as account-option refresh target.
7. **Cost Edit lock:** Remove mere linked journal ID from backend and legacy/current UI lock conditions. Finance Verified / Accounting Posted are lock statuses; previous unverified cost remains normally editable.
8. **Sell Machine reference:** Debounced input reference check, clear stale reference validity before final review, revalidate, retry transient reference check once. The original server uniqueness check remains authoritative. One submission should proceed through normal Review & Confirm rather than requiring a stale-form second click.
9. **Notification Mark read:** Per-card state update of modal and lazy/full-page notification rows and unread counts without list/page remount; popup reopens unread only, full page retains history.
10. **Notification Open related:** Notify read via same shared handler before navigating; navigation remains possible if read-marking returns an error.

## Release constraints

- All modifications are source-level; browser-interaction and authenticated multi-user tests against deployed Render are **not performed in this offline build environment**. Static and syntax checks do not prove live behavior. Test staging before merging to production.
- App source, historic scripts, request scheduler, lazily loaded views, Finance/Accounting controls, role checks and persistent DB/uploads are retained.
- Existing historic demo/sample strings not in the specific changed account forms are not comprehensively audited in this candidate. Preserve actual Pakistan resale business workflows and data.
- No independent claim of completed system-wide form remediation beyond the source paths documented above.
