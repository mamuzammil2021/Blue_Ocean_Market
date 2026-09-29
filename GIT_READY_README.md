# Blue Ocean Market V30.60.0 — Git-Ready Build

Built directly from V30.59.2. This source is ready for branch-based Git/Render staging validation. Runtime data, uploads, `.env`, SQLite databases and `node_modules` are intentionally excluded.

Before release acceptance run:

```bash
npm ci
npm run qa:v360
npm run qa:v3592
npm run qa:v3591
npm run qa:v359
npm run qa:current
npm run qa:runtime
```

Then complete the staging tests documented in `V30_60_QA_STATUS.md`, especially bulk posting, Finance-correction reversal automation, existing-DB reversal reconciliation, global processing overlay behavior and Accounting PDF downloads.
