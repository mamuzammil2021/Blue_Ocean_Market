# Blue Ocean Market V30.20.0 — Smart Payments & Settings UX Local Test

V30.20.0 is an additive local-test release built on V30.19.0. It preserves the existing Blue Ocean Market database architecture and all earlier Excavator, Pink Salt, MIMI Restaurant, Finance, Accounting, Access Control, Approval, Migration and audit functionality while hardening the newest administration workflows.

## What changed in V30.20

- **System Settings UX:** clearer grouped navigation, separate Policy/Technical badges, improved responsive cards/forms and friendlier administration presentation across sections.
- **Company Financial Accounts:** multiple Bank, Cash and Card accounts with Business Unit/company scope, currency, GL mapping, defaults, cheque/card details, Close/Archive and immutable history.
- **Smart payments:** Cash shows Cash accounts, Bank shows Bank accounts, Card shows Company Cards, and Cheque shows cheque-enabled bank accounts. Incompatible combinations are blocked, and when several compatible accounts exist the exact user-selected account is preserved.
- **Finance/Accounting integration:** the exact selected Company Financial Account is carried from operational transactions into Finance → Posting Control → Accounting and determines the mapped GL account. Core Sales/Purchases, MIMI POS, Excavator and Pink Salt cash-movement paths are covered.
- **Supplier/Buyer validation:** phone and email validation now appears immediately in the UI and duplicate contact checks run before save, backed by server validation.
- **Simpler attachments:** upload-time compression, optimized/original choice, readability confirmation and preview-before-store are disabled. File inputs show allowed formats, maximum size and maximum files per upload, then upload directly when valid.

## Local test

1. Extract the ZIP.
2. Double-click `START_LOCAL_MAC.command` on macOS, or run `npm install` then `npm start`.
3. The local launcher creates a local-only `.env` if one does not exist and runs `npm run qa:current` before start.

Do not use local-test credentials/secrets in production. Configure production environment variables, persistent database/storage, SMTP and financial accounts before launch.

## QA

Run:

```bash
npm run qa:current
```

For a dependency-backed runtime smoke test after dependencies are installed:

```bash
npm run qa:runtime
```

See `V30_20_IMPLEMENTATION_SUMMARY.md` and `qa/V30_20_QA_CHECKLIST.md` for release-specific verification.
