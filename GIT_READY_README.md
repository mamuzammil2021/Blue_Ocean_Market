# Blue Ocean Market V30.69.2 — Git-Ready Build

Built directly from V30.69.1. This source is intended for branch-based Git/Render staging validation against the existing persistent database/disk.

Runtime data, `.env`, SQLite/database files, uploads and `node_modules` are not part of the release package.

Recommended source QA before deployment:

```bash
node qa/qa_v369_pink_shared_workflows.js
node qa/qa_v3691_pink_payment_choice.js
node qa/qa_v3692_pink_qa.js
```

Then complete authenticated Render acceptance for supplier origin-aware navigation, Cash/Bank account selection, deep-link refresh, supplier archive/restore, import-cost locks/approval Void, Edit Import supplier/category controls, all three settlement modes, payment return context, and repacking completion.

**Do not reset/delete the Render persistent disk or production database.**
