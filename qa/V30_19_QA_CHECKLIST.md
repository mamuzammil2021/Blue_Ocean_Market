# V30.19.0 Local Test QA Checklist

## A. System Settings / administration

- [ ] CEO/Owner can open System Settings.
- [ ] Normal user cannot open System Settings by UI or direct API.
- [ ] System Administrator can access only technical sections allowed by sensitive permissions.
- [ ] High-risk setting save requires confirmation/reason and creates settings history.
- [ ] Company → BU → User override precedence produces the expected effective value.
- [ ] System Overview shows version, environment, DB/storage/backup/users/BUs/migrations/warnings.
- [ ] Add/edit/archive Business Unit preserves historical data.

## B. SMTP / password reset

- [ ] Save SMTP config; password is never shown back in plaintext.
- [ ] Test Email records success/error log.
- [ ] Forgot Password always returns a generic response for known and unknown addresses.
- [ ] Reset token expires/is one-time; password policy is enforced; audit event is created.

## C. Bank accounts / Finance / Accounting

- [ ] Add Company-wide and BU-specific payment accounts with valid Asset GL mapping.
- [ ] Ordinary users see only operational-safe account information for their BU.
- [ ] Non-cash Manual Finance entry requires payment method, reference and configured payment account.
- [ ] Non-cash Machine Cost and Excavator Payment require configured payment account.
- [ ] Invalid/inactive/mismatched-BU account is rejected server-side.
- [ ] Missing/invalid Asset GL mapping blocks verification/posting path.
- [ ] Used bank account is closed/inactivated rather than deleted.
- [ ] GL mapping change after transaction history requires CEO high-risk confirmation.
- [ ] Statement import links to correct payment account and creates unreconciled lines.

## D. Attachment service

- [ ] Configured max size/file types/count are enforced by server.
- [ ] Image upload shows original vs optimized size and preview.
- [ ] Readability confirmation is required before optimized selection is stored.
- [ ] Financial/legal evidence keeps original where required.
- [ ] Excavator document Preview does not auto-download.
- [ ] Download Original is explicit.
- [ ] Authorized delete archives the document; history/original remain available.

## E. Data migration

- [ ] Download bilingual template.
- [ ] Upload CSV/XLSX into staging.
- [ ] Preview/map/validate before import.
- [ ] Duplicate/error rows are shown and block unsafe import.
- [ ] Import retains Migration ID/audit; no silent overwrite.
- [ ] Opening balances remain subject to Accounting controls.

## F. QA document — Excavator suppliers/machines

- [ ] Invalid mobile number is rejected.
- [ ] Invalid email is rejected.
- [ ] Duplicate mobile/email is rejected with clear message.
- [ ] Supplier list modal does not reopen after submit/update/delete/back navigation.
- [ ] Duplicate Serial/Chassis is rejected and existing machine is identified where possible.
- [ ] Supplier Machine Notes load on Edit and persist on Update.

## G. QA document — Machine costs / payments / documents

- [ ] Full business Review & Confirm is not shown for routine document upload.
- [ ] Machine Cost supports currency + FX + KRW preview.
- [ ] Payment Method is mandatory.
- [ ] Payment Reference is mandatory for non-cash and optional for Cash.
- [ ] Receipt/evidence required where configured.
- [ ] Unverified Machine Cost can be edited/deleted under permission.
- [ ] Verified/posted cost cannot be directly edited/deleted; use correction/reversal.
- [ ] Purchase token/partial paid and purchase balance display clearly.
- [ ] View Receipt previews first and download is explicit.

## H. QA document — Finance states / corrections

- [ ] Pending Verification/Resubmitted: Verify, Request Correction, Request Void shown only to authorized reviewer.
- [ ] Correction Required: invalid Verify/Request Correction/Request Void actions are hidden; original creator gets Correct & Resubmit.
- [ ] Verified: verification buttons hidden; View + controlled change/history behavior only.
- [ ] Voided: no Open Verification; View shows complete record/history.
- [ ] Successful void closes modal and refreshes Finance list.
- [ ] Correction form shows last/current values and previous evidence.
- [ ] Replacement/removal from active evidence preserves old evidence in history.

## I. Localization / responsive / regression

- [ ] Select Korean, refresh and re-login; Korean preference remains.
- [ ] Select English, refresh and re-login; English preference remains.
- [ ] System Settings and new V30.19 controls are usable in English/Korean.
- [ ] Accounting Simple View is usable at desktop/laptop/tablet widths; Advanced View remains unchanged.
- [ ] Excavator, Pink Salt, MIMI, Finance, Accounting, Approvals, Users & Access still load.
- [ ] Run `npm run qa:current` and `npm run qa:runtime` after dependencies are installed.
