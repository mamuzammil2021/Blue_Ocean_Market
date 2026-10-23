# V30.69.43 release manifest

- Protected input: V30.69.42 ZIP SHA-256 `43b6674369551bb312a2764a6e8a34527dddda8a7e2af37f9f1d182f52153056`.
- Branch: `feature/v30.69.43-oct22-qa`; package/lock version: 30.69.43.
- Complete source root: `Blue_Ocean_Market_V30_69_43/`; Git archive contains tracked source with export exclusions. Separate SHA256SUMS covers delivered files.
- Frontend asset hashes: `server/frontend-manifest.json` (122 assets); source refuses mixed frontend releases before database startup.
- Changed backend owners: import authorization policy, import controls/void transaction and approval dispatch, FX whole-import reversal integration, Settings catalog, new scoped warehouse/PDF endpoints. Server sources are intentionally not byte-identical to V42.
- No new database schema migration. Existing records, stock history, audit and accounting posting controls retained; upgrade verified against all 254 baseline tables.
- QA, Git, deployment and cleanup: current V30_69_43 reports. Old version-specific records are historical.
- No `.git`, real databases, credentials, runtime attachments, dependencies or scratch tools in the source ZIP. QA screenshots and logs are separate.
