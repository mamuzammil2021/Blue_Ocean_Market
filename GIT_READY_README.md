# Blue Ocean Market V30.69.6 — Git-Ready Build

Built directly from V30.69.5. This release fixes the system-wide browser-refresh fallback to Dashboard by making the current full-screen view and business-unit context URL-addressable and restoring them before first render. Existing registered record/detail deep links are restored after the page shell.

Runtime data, `.env`, SQLite/database files, uploads, `data/`, and `node_modules` are not part of the release package.

Recommended source QA before deployment:

```bash
node qa/qa_v3696_system_routing.js
node qa/qa_v3695_repacking_inputs.js
node qa/qa_v3694_pink_qa.js
```

Then test browser refresh, copied URLs, and Back/Forward on Render against the existing persistent database/disk.

**Do not reset/delete the Render persistent disk or production database.**
