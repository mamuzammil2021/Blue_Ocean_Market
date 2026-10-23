# V30.69.41 source release manifest

- Package: Blue Ocean Market 30.69.41, complete source tree for corrective UI staging review.
- Branch: feature/v30.69.41-tabler-screen-gaps. Starting commit: c094e3561121c387398ef4451077696f23b7cc77. Final commit is recorded in the QA archive’s SOURCE_COMMIT.json.
- Latest-source check: 22 October 2026; prior generated V30.69.40 delivery found, no newer protected business source. Protected V30.69.39 remains the business baseline.
- Protected ZIP SHA256: 4bfbd4101c96f5ae16a5b143688f0692a1ed167b8e4c6eaa8e11486a64776f9b.
- Supplied Tabler ZIP SHA256: b0b23e850adf705853bbfb2bc0c4fc4cca6b0ce58e9708cebdab506431248d3c.
- Tabler: 1.7.0, MIT; 58 selected Sass source files; 33 selected MIT Tabler Icons 3.49.0 SVGs. Original notices retained. No demo pages or full Bootstrap JavaScript introduced.
- Entry points: server/server.js, scripts/start-server.js, public/index.html; existing vanilla-JavaScript runtime and sole route controller retained. Original 57 entry scripts keep their relative order.
- Frontend manifest: server/frontend-manifest.json, intentional build via scripts/build-frontend-manifest.js. Version and all 120 public JS/CSS/HTML assets verified.
- Node: 22.x; QA used 22.21.0. Existing dependencies preserved; fresh npm ci installed 116 packages and native SQLite/app/login smoke passed.
- All server JavaScript is byte-identical to protected V30.69.39. No schema or production change. Eight entries added to the existing frontend route registry; optional parent.section honored by its controller.
- Scope/status: SCREEN_GAP_FIX_REPORT.md distinguishes structural changes, shared adaptation and remaining legacy forms. This is not a claim of complete system-wide structural migration.
- Evidence: separate QA ZIP with current 624 captures, 182 baseline captures, release/financial/role/install/upgrade results and before/after viewer. Screenshots, dependencies, Git internals, credentials and runtime databases are not in the source ZIP.
- Deployment/rollback: DEPLOYMENT_ROLLBACK_AND_GIT.md. No main edits, remote push, merge or deployment performed.

Archive checksums are delivered separately in SHA256SUMS; the archive cannot contain its own checksum. Root data/uploads/backups placeholders are retained where tracked; runtime contents are excluded.
