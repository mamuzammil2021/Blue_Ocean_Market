# Blue Ocean Market V30.69.43

October 22 QA fixes on protected V30.69.42. Feature branch: `feature/v30.69.43-oct22-qa`. Main was not modified; no push or deployment performed.

Start with [QA completion and evidence](V30_69_43_QA_REPORT.md), [Git/deployment instructions](V30_69_43_DEPLOYMENT_AND_GIT.md), and [verified cleanup](V30_69_43_CLEANUP_REPORT.md). This is a complete source delivery with precompiled Tabler assets, Node 22.x and package lock. `npm ci`, then `npm start`; preserve existing runtime secrets/data/uploads. See deployment instructions before configuring a new environment.

The requested import authorization and atomic void corrections are implemented. The separate proposed receiving/discrepancy/supplier-credit redesign is deferred and excluded. No new schema migration is introduced. Test on the feature branch before merging.

Current test entry: `npm run qa:current`. Full browser gate: `node qa/qa_v36943_release.js --browser`; explicit baseline upgrade requires `BOM_BASELINE_DIR`. PDF tests require configured Chrome/Chromium and Korean fonts. See the QA report for exact results and target-host acceptance limits.

Old root guides are archived in `docs/history/v30.69.42-recovery/`. Older versioned files are historical; do not follow their main-push instructions for this delivery.
