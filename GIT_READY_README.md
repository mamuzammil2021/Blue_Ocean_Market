# Blue Ocean Market V30.59.1 — Git-Ready Build

This source continues directly from V30.59.0 and contains the Employees / Payroll / My Account full-page UI hotfix and redesign.

Before commit, verify that `.env`, SQLite/DB files, `data/`, `uploads/`, `node_modules/` and credentials are not staged.

Recommended QA after `npm ci`:

```bash
npm run qa:v3591
npm run qa:v359
npm run qa:current
npm run qa:runtime
```

Use a separate Git branch for Render/staging validation before merging into the release branch.
