# Blue Ocean Market V30.43.0 — QA Status

## Build-environment results
- `node --check public/v343-client.js` — **PASS**
- `node --check server/v343.js` — **PASS**
- `node --check server/server.js` — **PASS**
- `npm run qa:v343` — **PASS**
- `npm run qa:current` — **PASS**
- `npm run qa:render` — **PASS**

The inherited `qa:current` suite syntax-checks the full packaged server/client/QA chain and reports the current release identity as V30.43.0. Render persistence QA confirms `/var/data` persistent-storage defaults, central DB/uploads storage, mount/preflight handling, health reporting and production reset safeguards remain intact.

## V30.43 dedicated QA coverage
The V30.43 static gate checks:
- release/package/server/browser identity and overlay order;
- shared child-context preservation registration;
- Supplier Machines and Buyer Payments targeted refresh hooks;
- untouched-Finance vs Finance-acted Machine Cost edit-lock logic;
- duplicate Purchase-row Edit removal;
- Sold / Completed Purchase backend/UI lock;
- sold-machine CEO-only document archive policy;
- optional Buyer Sending Account schema/resolver/UI/payment-history wiring;
- Accounting company-account drill-down, statement JSON/PDF and transfer APIs/UI;
- authenticated PDF fetch;
- additive migration/no `DROP TABLE` guard;
- retained V30.42 browser layer.

## Dependency-backed runtime QA
This clean release artifact intentionally does not package `node_modules`. The build container does not currently have `express`, `better-sqlite3`, `bcryptjs`, `jsonwebtoken` or `multer` installed, so dependency-backed API/runtime smoke is **not claimed as executed here**.

Before production promotion, run in the normal Node 22 environment:

```bash
npm ci
npm run qa:v343
npm run qa:current
npm run qa:render
npm run qa:v342:runtime
npm run qa:v341:runtime
npm run qa:runtime
```

## Manual acceptance focus
1. Supplier → Machines: Add Machine appears immediately without whole-page refresh.
2. Refresh a Supplier/Buyer detail while a sub-section is selected: same record and section restore.
3. Buyer receipt and Sell Machine new-payment flows: Buyer Sending Account remains optional, existing account can be selected, new account can be saved, and company Receive Into remains separate.
4. Machine cost linked to untouched Finance: direct Edit works; after Finance action it locks and points to controlled correction/reversal.
5. Machine Costs Purchase row has no duplicate Edit; Purchase card remains the single edit route until sale.
6. Sold machine: Purchase Edit is locked; non-CEO users do not see document Delete / Archive; server rejects bypass attempts.
7. Accounting → Cash & Bank Accounts: open an account, generate different statement periods, verify opening/in/out/running/closing balances.
8. Download statement PDF in English and Korean UI contexts.
9. Same-BU account transfer creates balanced Accounting movement; cross-BU transfer uses the existing Inter-BU path.
10. Existing V30.42 actionable Tasks/Finance correction/CEO Full System Access behavior remains unchanged.
