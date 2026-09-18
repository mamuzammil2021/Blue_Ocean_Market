# V30.37.0 QA Status

- `npm run qa:v337` — PASS
- Focused Chromium profile/account/filter audit — **18/18 PASS**
- V30.36 inherited stateful Chromium audit — **28/28 PASS**
- `npm run qa:v336` — PASS
- `npm run qa:v336:handlers` — PASS, 0 unresolved inline named handler/call targets
- `npm run qa:v335` — PASS
- `npm run qa:v334` — PASS
- `npm run qa:v333` — PASS
- `npm run qa:v332` — PASS
- `npm run qa:current` — PASS
- `npm run qa:render` — PASS
- Schema changes — NONE
- Destructive migration/reset — NONE

Live Express runtime smoke remains environment-limited because the build container cannot install the npm dependencies. Run `npm ci && npm run qa:runtime` on the normal Mac/Render Node 22 environment.
