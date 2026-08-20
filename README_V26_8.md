# Blue Ocean Market V26.8.0 — Supplier Machines Fix

This build is based on V26.7.0 and contains a focused fix for **Excavator → Suppliers → Machines**.

## Fixed

When a supplier had one or more company-purchased machines, clicking **Machines** could fail because the frontend attempted to read an undefined variable while rendering the purchased-machine list. V26.8.0 uses the actual purchased-machine row and now opens the Supplier Machines workspace correctly.

The Supplier Machines function also catches API/render errors and shows a visible toast message.

## Run

```bash
npm install
npm start
```

Then open `http://localhost:3000`, select **Excavator → Suppliers**, and click **Machines**.

## QA

```bash
node --check public/client.js
node --check server/server.js
npm run qa:static
node qa/qa_v268_supplier_machines.js
```
