# Blue Ocean Market V27.6.0

This release builds on V27.5.0 and adds a CEO-visible, business-unit-scoped data-integrity reconciliation panel.

Run:

```bash
npm install
npm run qa:current
npm start
```

Open the CEO consolidated dashboard and select **Open checks** under **Data Integrity**. Zero critical exceptions means the checked cross-module invariants are consistent. Warnings identify missing sale PDFs or supplier listings that remain available after purchase and should be reviewed.
