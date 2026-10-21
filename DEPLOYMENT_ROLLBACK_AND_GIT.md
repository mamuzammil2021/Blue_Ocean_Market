# V30.69.40 — staging, deployment, rollback and feature-branch Git steps

Status: engineering staging candidate. No production deployment or remote push was performed. Review `QA_RESULTS_AND_SCREENSHOT_INDEX.md` and `IMPLEMENTATION_COMPLETION_AND_ACCEPTANCE.md` before production acceptance. The release preserves all server JavaScript and adds no schema migration.

## Prerequisites and installation

Use the supplied protected V30.69.39 source as the baseline, Node 22.x, the matching package-lock.json, existing persistent DATA_DIR/UPLOAD_DIR, existing encrypted secrets/configuration and normal backup procedures. Do not copy runtime data or environment files from a ZIP over the deployment host. Configure an installed Chrome/Chromium and Korean fonts for production PDF rendering; those runtime dependencies are not bundled here.

Standard deployment remains `npm ci --omit=dev`, followed by the existing `npm start` command. Compiled CSS/icons are included; production does not require Sass, PostCSS or a frontend rebuild. If rebuilding intentionally in development, install dev dependencies and run `npm run build:ui`; do not generate integrity manifests automatically at startup.

**Install validation:** plain npm ci on this managed QA host failed while node-gyp extracted official Node headers (`fchown` is unsupported here). Supplying official Node 22.21.0 headers extracted without ownership changes through `npm_config_nodedir` allowed clean `npm ci --foreground-scripts` to exit successfully. With those clean dependencies, the actual application started, passed frontend integrity, returned health version 30.69.40 and completed an isolated login. The smoke test loaded the package’s bundled Linux x64 SQLite binary; it does not claim a newly compiled binary. A clean `npm ci --ignore-scripts` install and a real SQLite in-memory query succeeded using the package's bundled native binary under Node 22.21.0. This does not prove plain npm ci or a Docker/Render build will pass on every deployment host. Validate standard install in staging with the host's native toolchain. An ignore-scripts installation is an environment-specific fallback only after checking the native binary on that exact host; do not silently use it on an incompatible architecture.

If the managed-host header extraction issue occurs, use a directory containing the official headers for the exact Node patch version. For the tested Node 22.21.0 environment, the archive was `https://nodejs.org/download/release/v22.21.0/node-v22.21.0-headers.tar.gz`; extract it outside the repository without restoring archive ownership, then run `npm_config_nodedir=/absolute/path/to/node-v22.21.0 npm ci --foreground-scripts`. Do not commit headers or dependencies. Normal Docker/Render hosts may not need this workaround.

Native smoke check:

```bash
node -e "const Database=require('better-sqlite3'); const db=new Database(':memory:'); console.log(db.prepare('SELECT 1 AS ok').get()); db.close();"
```

## Feature branch only

Begin in a clean local repository checked out at the verified protected V30.69.39 source. If git status shows existing work, preserve it first. The commands below do not switch, commit, reset or push main.

```bash
git status --short
git switch -c feature/v30.69.40-tabler-ui-completion
```

Copy the contents of the extracted `Blue_Ocean_Market_V30_69_40` folder into that repository, preserving `.git`, `.env`, existing data/uploads and node_modules. No whole source file was deleted, so an overlay copy is sufficient; do not use a destructive synchronization command.

```bash
node --version
npm ci
npm run build:ui
npm run qa:current -- --browser
```

For the fixture upgrade check, set BOM_BASELINE_DIR to a separate extracted V30.69.39 directory with its dependencies available, then use `npm run qa:current -- --browser --upgrade`. Set BOM_CHROMIUM to the installed browser path if it is not `/usr/bin/chromium`; CHROME_PATH is used by the PDF service. `npx playwright install chromium` supplies the Playwright browser where network/downloads work. The QA host used a separate packaged Chromium plus a Playwright PDF CLI adapter; that scratch adapter is not a production deliverable.

Review changes, excluding environment files, runtime databases and user uploads:

```bash
git diff --stat
git diff --check
git add .gitattributes public scripts package.json package-lock.json server/frontend-manifest.json vendor docs qa/modernization qa/qa_v36931_reference.js qa/qa_v36940_release.js qa/qa_v36940_ui_contract.js qa/qa_v36940_upgrade.js CHANGELOG.md RELEASE_NOTES.md RELEASE_MANIFEST.md GIT_READY_README.md README.md UI_AUDIT_AND_SCREEN_INVENTORY.md TABLER_COMPONENT_MAPPING.md FRONTEND_ARCHITECTURE_AND_DESIGN_SYSTEM.md CLEANUP_REMOVAL_REGISTER.md QA_RESULTS_AND_SCREENSHOT_INDEX.md DEPLOYMENT_ROLLBACK_AND_GIT.md THIRD_PARTY_NOTICES.md IMPLEMENTATION_COMPLETION_AND_ACCEPTANCE.md
git commit -m "Modernize shared ERP UI with scoped Tabler presentation"
git push -u origin HEAD:refs/heads/feature/v30.69.40-tabler-ui-completion
```

Add the current `qa/evidence/36940-*.json` files only if you keep machine-generated evidence in Git; the separate evidence archive includes them. If that branch name already exists locally, choose a new unused feature branch; do not reset main.

The internal workspace feature branch is already committed, but no remote repository URL or original upstream Git history was supplied. The ZIP itself intentionally has no .git directory. Do not merge or push to main as part of these steps.

## Staging acceptance

Run against a backup-derived staging copy with outbound email disabled. Run the supplied role/authority and failure-state tests, then validate representative real record volumes, native assistive-technology behavior, PDFs with the host’s actual Chrome binary and the business workflows listed in the QA report. Verify /api/health, static assets and the frontend manifest before users enter the system. No production migration command is required for this UI release.

## Rollback

Keep the verified original V30.69.39 archive (SHA256 in RELEASE_MANIFEST.md) and a staging/production backup made under normal policy. Stop the candidate service, restore the complete matching original source/assets/lockfile/manifest, install its dependencies and restart with the same persistent data and secret configuration. Never mix a .39 index with .40 assets/manifest. Clear stale browser/service-worker caches if applicable. This UI change does not require a schema rollback. Do not blindly restore an older database over newer legitimate transactions; investigate and use the organization's normal recovery process if an unrelated data issue occurs.

## Full visual/role evidence reproduction

After configuring the fixture browser, run `npm run qa:ui:browser`, `npm run qa:ui:details`, `npm run qa:ui:records` and `npm run qa:ui:roles`. These generate screenshots in the sibling ui-evidence folder and do not use production data. The two detailed scripts together cover representative cases for all registered route patterns.

The completion gate includes `completion.cjs` and `authority.cjs` when `--browser` is selected. Run `node qa/modernization/volume.cjs` for the synthetic 2,501-order / 1,001-customer paging test. Browser AX-tree output and 200% zoom-equivalent reflow are recorded; arrange native OS screen-reader/user acceptance on your target platform.
