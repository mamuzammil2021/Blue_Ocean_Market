# Blue Ocean Market V30.69.4 — Git-Ready Build

Built directly from V30.69.3. This release completes the Pink Salt QA 07 Oct regression fixes: Cash-vs-Bank account compatibility, supplier account targeted refresh, Pink Salt deep-link refresh recovery, Edit Import category action placement, reliable three-mode import settlement, Import Detail cleanup, received-shipment PDF actions, and received-status semantics.

Runtime data, `.env`, SQLite/database files, uploads, `data/`, and `node_modules` are not part of the release package.

Recommended source QA before deployment:

```bash
node qa/qa_v3694_pink_qa.js
node qa/qa_v3693_persistent_routing.js
```

Then complete authenticated Render acceptance against the existing persistent database/disk.

**Do not reset/delete the Render persistent disk or production database.**
