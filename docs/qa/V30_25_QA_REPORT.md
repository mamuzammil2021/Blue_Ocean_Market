# V30.25.0 QA Report

## Result

**Current/source regression QA: PASS**  
**Render persistent-storage QA: PASS**

V30.25.0 was checked against the complete inherited V30.24.x regression suite plus new release assertions covering the Finance integrity and workflow changes.

## V30.25-specific checks

- Finance/Operations/Accounting separation and one-real-payment/one-Finance-entry rule.
- Operational Sale/Purchase remain non-cash Accounting sources.
- Accounting eligibility requires Finance Verification for cash movements and Operational Source Control for non-cash operations.
- Excavator Sale requires completed operation plus Finance-verified allocated buyer payment coverage.
- Finance Correct & Resubmit preloads existing values.
- Cash references are optional and do not create Missing Reference warnings.
- Duplicate reference validation excludes the current logical payment family during update/correction.
- BU-scoped searchable Buyer/Supplier/Seller controls.
- Buyer and Supplier Statement actions restored on profile/detail screens.
- Pink Salt customer/supplier statements retained.
- System Settings navigation refresh after auth hydration.
- Legacy combined operational Finance rows transition without silent ledger rewrite.
- Finance UI uses Money In / Money Out for real cash movement.
- Render persistent-disk preflight, storage paths and health diagnostics retained.

## Evidence

- `qa/V30_25_STATIC_QA_RESULTS.txt`
- `qa/V30_25_RENDER_QA_RESULTS.txt`

## Runtime acceptance

The clean Git-ready ZIP intentionally excludes `node_modules`. Runtime smoke is therefore not claimed in the packaging container. Before production deployment, run:

```bash
npm ci
npm run qa:current
npm run qa:render
npm run qa:runtime
```

Then browser-test Finance correction, cash payments, Buyer/Supplier statements, Excavator sale posting eligibility and the BU-scoped searchable selectors against a backup/test database before applying to production data.
