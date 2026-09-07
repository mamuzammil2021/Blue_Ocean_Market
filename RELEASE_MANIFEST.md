# Blue Ocean Market V30.16.0 — Release Manifest

- Version: `30.16.0`
- Build: `ACCESS_CONTROL_LOCAL_TEST`
- Baseline: V30.15.0 Unified Pink Salt Supplier Accounts
- Database reset: No intentional reset; additive migrations only
- Primary scope: global Users & Access, hybrid role templates + granular permissions, multi-BU scope and delegated administration
- CEO / Owner: unrestricted global access controller, Effective Access visibility, role templates, copy-access workflow
- BU Managers: delegated administration only inside assigned business units; no privilege grant above their own effective access
- Finance Head: delegated Finance-user administration and Finance-related access only within authorized scope
- Permission layers: business-unit scope; module/tab visibility; action permissions; sensitive permissions; delegated admin; limits/thresholds
- Enforcement: frontend navigation/action visibility plus live backend authorization; access changes/revocation take effect on subsequent requests immediately
- Multi-BU: non-CEO users may be assigned multiple business units with a primary unit and can switch only among assigned units
- Audit: user/access changes are retained in dedicated access history and existing system audit
- Localization: new V30.16 access-control UI is English/Korean bilingual-ready
- Prior safeguards retained: V30.15 supplier accounts, V30.14 Review & Confirm/loading/idempotency, V30.13 customer receivables/pricing, V30.12 quantity integrity, V30.11 context integrity
- QA entry point: `npm run qa:current`
- Runtime smoke entry point: `npm run qa:runtime`
- Consolidated static/source QA: PASS (`npm run qa:current`)
- Runtime smoke in build environment: NOT EXECUTED because offline dependency installation failed (`ENOTCACHED`); `node_modules` is intentionally excluded from the release ZIP. Run `npm install`/`npm ci` locally before `npm run qa:runtime`
