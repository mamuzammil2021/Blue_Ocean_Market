# V30.22 QA Checklist — Stability, Security & Workflow Hardening

## Release and source
- [ ] `package.json`, lockfile, server health/banner and browser cache use V30.22.0.
- [ ] Every server/public JS file passes `node --check`.
- [ ] `server/v322.js` and `public/v322-client.js` are installed/loaded in the intended order.

## Authentication
- [ ] Sign In with valid local user succeeds.
- [ ] Invalid logins return a generic error; repeated failures are throttled.
- [ ] Login/Forgot/Reset fields never display an authenticated business-contact error.
- [ ] Password change/reset invalidates previous sessions.
- [ ] Password policy is consistent across create/change/reset.
- [ ] Reset tokens are stored/looked up by hash and production uses APP_BASE_URL.

## Contacts
- [ ] Phone and Email have independent helper/error elements.
- [ ] Invalid phone cannot display an Email error.
- [ ] Invalid email cannot display a Phone error.
- [ ] Country/flag/dial code sync and E.164 normalization work on Supplier, Buyer and embedded contact forms.
- [ ] Duplicate contact warning appears before save and backend still blocks invalid/duplicate canonical data where supported.

## Review & Confirm
- [ ] A reviewed business form shows Review & Confirm exactly once.
- [ ] Confirm & Save does not reopen the same review dialog.
- [ ] Back to Edit returns without mutation.
- [ ] Processing/idempotency protection prevents double submit.

## Finance and payment accounts
- [ ] Cash/Bank/Card/Cheque show only compatible configured Company Financial Accounts.
- [ ] Payment shows Pay From; receipt shows Receive Into.
- [ ] Interactive cash movement cannot save without the exact financial account.
- [ ] Same-account normalized payment-reference duplicate is blocked before submit and by backend.
- [ ] Same normalized reference on a different account is warning-only where appropriate.
- [ ] Exact account reaches Finance → Posting Control → Accounting.

## Attachments
- [ ] Raw `/uploads/<filename>` is not publicly accessible.
- [ ] Stored Receipt/Evidence/Document View opens for an authorized user.
- [ ] Unauthorized BU/user cannot access the secured attachment route.
- [ ] Download Original is explicit and separate from normal click/view.
- [ ] Existing simple upload flow remains: no upload-time compression/optimization dialog.

## History / lifecycle
- [ ] User removal archives/deactivates and revokes sessions.
- [ ] User/audit history remains after archive.
- [ ] Financial/accounting history remains linked.

## UI
- [ ] Normal modal Close X is top-right.
- [ ] Escape closes safe normal modal, not an active confirmation/process state.
- [ ] Focus is usable/restored.
- [ ] Buyer Details appears before Pakistan Resale Profit Share.
- [ ] Non-Pakistan buyer does not show Pakistan resale section.

## Production/deployment
- [ ] Docker build resolves Chromium and Noto CJK fonts.
- [ ] PDF generation is tested in the deployment image.
- [ ] Production env defines strong JWT_SECRET, separate APP_ENCRYPTION_KEY and trusted APP_BASE_URL.
- [ ] Persistent database and upload storage are configured.
