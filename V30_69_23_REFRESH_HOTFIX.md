# V30.69.23 — actual deployed refresh hotfix

The live site served V30.69.22 HTML and routing scripts alongside obsolete client.js and runtime-v30392.js. Their received bytes exactly matched the deployed .gz artifacts. The precompressed static middleware preferred these files without comparing them to the canonical JavaScript. The old startup parser then replaced parameterized/detail routes with Dashboard. A fresh version query still returned those obsolete artifacts, so version labels alone did not repair delivery.

The new middleware verifies decompressed bytes against canonical source, caches the validation by both files' metadata and falls back to current source for stale, corrupt or orphan compressed artifacts. It preserves valid gzip delivery, Vary headers and HEAD behavior. Unversioned assets revalidate. All eager and lazy script URLs now use V30.69.23 to invalidate previously cached incompatible responses. X-BOM-Version now reports package.json rather than a historical hard-coded version.

An explicit frontend SHA-256 manifest is checked before database initialization. Partial/mixed canonical frontend copies fail startup with the affected path, rather than booting an incompatible Dashboard. After an intentional future frontend change, run npm run build:frontend-manifest and commit the matching manifest; startup never silently regenerates it.

Native browser testing also exposed missing toggleSidebar, toggleMobileSidebar and closeMobileSidebar helpers in V30.69.22. These small shell helpers are restored. Payment, approval and posting handlers are unchanged.

Evidence: qa/evidence/36923-live-root-cause.json, 36923-static-assets.json, 36923-native-refresh.json and the final 36923-release.json. The stale-gzip HTTP regression fails against the V30.69.22 server module and passes against the correction. Browser regression deliberately leaves stale .gz artifacts beside current source, logs in against a disposable real server and navigates through native menus before refresh. It covers EN/KR and a nested customer section in addition to the carried system-wide matrix.

No production payment, database reset, Git push or Render deployment was performed. Production sign-in was blocked by an obsolete review surface and cancelled; investigation then used public assets. The hotfix must be deployed before your production refresh behavior can be accepted. The broader payment build remains STAGING_CANDIDATE for the remaining acceptance listed in docs/releases/v30.69.22/QA_COVERAGE.md.

Deploy and rollback: retain the same Render persistent disk, database/uploads paths and secrets. Use npm ci and the existing npm start. Old .gz files may safely remain because mismatched representations are ignored; do not use rsync --delete against runtime storage. Roll back to the recorded previous commit/configuration without replacing data. Because V30.69.22 has the confirmed asset-delivery defect, a code rollback may restore that behavior.

After deployment, confirm X-BOM-Version: 30.69.23, open pages using the actual sidebar and record buttons, then refresh. The URL, record, selected section and BU must remain. Test Finance, Accounting, Pink Salt and Excavator. A manifest startup error means the source copy is incomplete: copy/reconcile the full release; do not regenerate the manifest simply to accept unexplained mismatched files.
