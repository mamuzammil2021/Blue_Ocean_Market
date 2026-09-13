# Blue Ocean Market V30.24.1 — QA Report

## Automated static/current-release QA

`npm run qa:current` — **PASS**.

Coverage includes all inherited release checks plus V30.24.1 checks for:
- nested parent workflow preservation;
- active workflow protection from global refresh;
- attachment preview header/original download;
- Finance correction reference self-exclusion and existing evidence reuse;
- human-readable Finance history and technical metadata permission gate;
- Final document workflow lock; archive/restore and separated document sections;
- selected-period statement rows/activity summaries;
- professional branded statement PDF output.

## Runtime smoke

Not executed successfully in the build container because dependency installation could not reach `registry.npmjs.org` (DNS `EAI_AGAIN`), leaving the native `better-sqlite3` dependency unavailable. Source packaging excludes `node_modules`.

Before production deployment, on Node 22 with normal npm access:

```bash
npm ci
npm run qa:current
npm run qa:runtime
```

## Manual regression checklist

- Buyer Detail → Add Payment/Advance → Save returns to same Buyer.
- Nested Finance Verification → Full History remains open and closes back to the same Finance record.
- Finance correction accepts unchanged reference on same record and rejects a different record using that reference on the same account.
- Finance correction reuses existing evidence without forcing duplicate upload.
- Attachment previews: image/PDF/unsupported type, short and very long filename, mobile/desktop.
- Final document has View/Download only for ordinary users; no Reopen.
- Authorized Archive hides document from ordinary users; Archived Documents shows it to authorized user; Restore returns prior status and records audit.
- Supplier/Buyer/Pink Salt statements use From/To consistently in rows and period summaries; opening/closing balances reconcile.
- Statement PDFs checked in English and Korean.
