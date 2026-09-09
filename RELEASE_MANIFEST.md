# Blue Ocean Market V30.20.0 — Release Manifest

**Release:** V30.20.0 Smart Payments, Settings UX & Direct Attachments — Local Test  
**Baseline:** V30.19.0 System Settings & QA Hardening  
**Database reset:** No. Additive migrations only.  
**Git:** This local-test package contains no Git operation or repository mutation.

## Primary V30.20 files

- `server/v320.js` — financial-account administration, smart account option API, contact duplicate/format API, direct-attachment policy API.
- `public/v320-client.js` — friendly System Settings shell, Company Financial Accounts UI, immediate Supplier/Buyer contact validation, smart payment account selector, direct attachment validation.
- `server/server.js` — V30.20 overlay installation, strict method/account compatibility, exact selected-account persistence for generic Sales/Purchases, MIMI POS and Excavator payment paths, Finance fallback for legacy sources, and buyer validation hardening.
- `server/v300.js`, `server/v305.js`, `server/v307.js`, `server/v313.js` — exact selected Company Financial Account persistence for Pink Salt import/customer/supplier cash-movement paths.
- `server/v319.js` / `public/v319-client.js` — V30.19 upload-time attachment-review path disabled for V30.20 and direct upload behavior retained; stored-file preview/download remains.
- `REQUIREMENTS_MASTER.md` — V30.20 consolidated mandatory requirements.
- `qa/qa_current.js` — release regression/source checks.
- `qa/V30_20_QA_CHECKLIST.md` — manual acceptance checklist.

## Safety / integrity

- Historical finance/accounting records are not reset.
- Closed/archived financial accounts preserve references and history.
- GL changes on used financial accounts remain high-risk and audited.
- Server-side contact and payment-account validation remains in addition to UI validation.
- Upload-time attachment compression/optimization/readability review is disabled; only allowed type/size/count are exposed for upload and enforced by policy/UI plus existing server middleware.
- Exact selected financial accounts are retained on source records where supported and synchronized to Finance/Accounting; incompatible account/method combinations are rejected server-side.

## Release verification

- `npm run qa:current`: **240 / 240 checks passed** on the completed source tree.
- The final ZIP is integrity-tested and the same QA suite is rerun after clean extraction before delivery.
- `npm ci` could not complete within this build environment, so the dependency-backed `npm run qa:runtime` smoke test could not be executed here. It remains included for local testing after dependencies are installed.

## Git-ready packaging note
This Git-ready package preserves the V30.20.0 application release and adds source-control hardening (`.gitignore`, `.dockerignore`, `.gitattributes`), secure generated local/runtime-test credentials, and Git deployment documentation. Post-V30.20 requirements are documented as pending and are not claimed as implemented in this release.
