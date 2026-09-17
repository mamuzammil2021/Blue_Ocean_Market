# Blue Ocean Market V30.31.0 — Git / Render Ready

V30.31.0 is a focused lifecycle-integrity and QA release built directly on V30.30.0. It preserves the existing database, Render persistent disk, Finance Integrity Rule, Accounting Posting Control, Pakistan/Korea account routing, resale-credit controls and all prior business workflows unless explicitly changed by the V30.31 QA requirements.

Release baseline: **V30.31.0 Lifecycle Integrity + Controlled Void/Reversal + Finance-Ready Posting Control + QA Refinements**.

## Deploy

1. Keep the existing Render persistent disk mounted at `/var/data`.
2. Keep all existing production environment variables/secrets.
3. Deploy the repository normally; **do not wipe the database or uploads**.
4. V30.31 additive schema/audit fields initialize safely at startup.
5. Before acceptance, run `npm ci`, `npm run qa:current`, `npm run qa:render`, and `npm run qa:runtime`.

The release package intentionally excludes runtime databases, uploaded business files, secrets, `.git` and `node_modules`.

See `RENDER_DEPLOYMENT.md`, `RELEASE_MANIFEST.md` and `V30_31_IMPLEMENTATION_SUMMARY.md`.

## Verified release gates

- `npm run qa:current` — PASS
- `npm run qa:render` — PASS
- `node qa/qa_v331_button_actions.js` — PASS
- Runtime smoke: run after `npm ci` in the target Node 22 environment; dependency installation timed out in the build container.
