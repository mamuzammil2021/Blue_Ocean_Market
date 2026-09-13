# V30.22 Browser Acceptance QA Plan

This plan is intentionally separate from the zero-dependency source QA. It should be automated with Playwright (or equivalent) in CI/development when browser-test dependencies are available.

1. **Public authentication isolation:** open Sign In and Forgot Password while logged out; enter valid/invalid emails; assert there is no request to `/api/v321/contact-check` and no “Authentication required” contact error.
2. **Field-specific contact validation:** Add Buyer/Supplier; select Pakistan; assert +92/flag; type invalid phone and valid email, then reverse; verify each message remains under its own field.
3. **Single review:** submit Add Buyer; assert exactly one Review & Confirm; Confirm & Save; assert record created and no second identical dialog.
4. **Machine token payment:** Buy Machine with token > 0; select Bank/Card/Cash in turn; assert only compatible accounts are selectable and the exact selected account is posted.
5. **Payment-reference integrity:** create one bank transaction/reference, try same normalized reference on same account (block), then on another account (warning/allowed as policy permits).
6. **Attachment confidentiality:** create/store harmless receipt; direct raw `/uploads/...` returns inaccessible; View Receipt succeeds for authorized user; other-BU user is denied; Download Original works from viewer.
7. **Finance chain:** create operational payment/receipt → Finance verification → Posting Control → final Accounting; assert amount, direction, account, reference and evidence remain consistent.
8. **User archive/session revocation:** sign in as test user, archive that user from CEO session, then assert old test-user token no longer accesses protected APIs and audit history remains.
9. **Buyer detail order:** Pakistan buyer shows Buyer Details before Pakistan Resale Profit Share; non-Pakistan buyer hides resale section.
10. **Responsive/dialog controls:** desktop/mobile viewport checks for top-right X, usable scrolling, focus and no nested duplicate confirmations.
