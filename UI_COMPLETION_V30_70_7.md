# V30.70.7 — UI completion and acceptance

Built directly from V30.70.6. User-approved remaining UI polish and acceptance work; no Git push or deployment.

## Completed work

| Item | Result |
| --- | --- |
| Mobile action consistency | Content/dialog action buttons have a 44px minimum target, including Finance, Posting Control and Restaurant. |
| Shared responsive sizing | Root cause repaired: responsive `.bom-ui` token declarations had lower specificity than `html.bom-ui`, leaving the desktop 36px token active. Matching selectors restore intended tablet 40px / phone 44px sizing, including Packaging toolbar controls. |
| Financial tables | Retain exact financial columns and horizontal scrolling, add contained overscroll and an explicit keyboard focus outline. No columns/data were removed. |
| Responsive and bilingual acceptance | All 49 listed destinations checked at 1440, 820 and 390px in English and Korean: 294 cases; ready routes, no body overflow, no visible mobile content buttons below 44px. |
| Populated records/navigation | Long bilingual supplier/customer names, populated import/customer/supplier records, direct links, selected section retention on refresh, and browser Back/Forward passed. |
| Current release documentation | README, release notes, package/lock, adapter version and frontend integrity manifest identify V30.70.7 consistently. Historical documents remain explicitly historical. |
| Cleanup/ownership | Fixed the shared token at its owner instead of adding Packaging-specific overrides. Retained compatibility scripts: there was no evidence authorizing deletion of their remaining active handlers. No generated Tabler CSS edits or new runtime dependencies. |

## Fresh validation

- Node 22.23.4; 349 JavaScript/CJS syntax checks and frontend integrity passed.
- 20 database/upgrade tests passed; SQL audit: 2,617 checked, zero failures.
- 31 regression suites / 500 workflow checks passed after the documented host-specific retries.
- 13 UI interaction checks passed on final CSS: Imports search/filter/sort/refresh, action hierarchy, payment sections/evidence, settings groups/refresh/Korean labels, employee tabs, POS totals, feedback and browser errors.
- 294 responsive screen cases passed; 4 populated navigation checks passed.
- Local Korean import detail screenshot inspected after installing Noto Sans CJK KR in the host. Long names wrap and primary actions remain readable/reachable. Screenshots are local inspection material and are not packaged.

Evidence: `qa/evidence/ui707-release.json`, `ui707-matrix.json`, `ui707-browser.json`, `ui707-navigation.json`, `ui707-integrity.json`, and the current PostgreSQL regression evidence.

### Test environment accommodations

The host blocks full Chrome's process-singleton socket. Browser checks use Chromium headless shell. Four suites initially failed from the browser/PDF launch constraint and then passed using the headless shell and a local adapter invoking Chromium's real PDF API. The original run and successful retry logs are retained. Production PDF code was unchanged. Native Chrome CLI behavior on Render is not certified by the PDF adapter. Korean fonts were installed only in the test host; existing platform Korean font fallbacks remain unchanged.

## Acceptance boundaries

This completes the identified local UI polish and expanded acceptance pass. It is not certification of every role/status/data-volume combination, every accessibility technology, real bank/SMTP integrations, or the hosted Render deployment. Browser route/section restoration passed; no claim is made that every possible intermediate hydration frame has been eliminated. Dense financial tables intentionally remain horizontally scrollable on phones.

No business workflow, financial rule, permission gate, routing implementation, database schema or server source was changed. `server/frontend-manifest.json` is the sole changed server-directory file and records frontend checksums.

## Reproduce and deploy

Use Node 22 and `npm ci`. Set `BOM_CHROMIUM` to an installed Chromium binary if required. Run `npm run qa:ui707`, `npm run qa:ui707:matrix`, `npm run qa:ui707:navigation`, and `npm run qa:release`. `CHROME_PATH` must point to the real Chrome executable for production PDF acceptance. UI screenshots are opt-in through `BOM_UI_SCREENSHOTS`.

Existing Render environment and PostgreSQL configuration apply; there is no migration or configuration change. Deployment and any Git push remain separate actions and have not been performed.
