# Blue Ocean Market V30.69.46

Receiving decision fixes, purchase bag details and system-wide lighter placeholders. Built on protected V30.69.45. No remote push, merge or deployment was performed for this release.

## Changes

- Financial decisions validate agreement evidence before review or CEO authorization. The server performs the same check before changing a case or creating an approval action, preventing approvals that cannot execute. Errors target the active decision form and preserve its entries.
- Existing CEO Direct Authorization, permission checks, configured approvals and financial controls remain authoritative. CEO bypass applies to approval routing, while evidence, balanced settlements, stock dependencies and valid account mappings remain required.
- Successful decisions show a saved/approval-submitted outcome and refresh the issue. Confirmation dialogs close. Tasks, holds, purchase/supplier indicators and receiving eligibility follow the existing outcome rules. Shared responsibility cannot retain a previously selected, unsupported Replacement method.
- Receiving cards show the recorded kg per bag, ordered bags, previously received bags and expected bags. A reference weight for entered bags is shown without replacing actual measured weight.
- Blank/invalid actual weights or bag counts do not produce a false missing balance. Zero remains a valid measured quantity. Issue summaries now show previous receipts and explicit ordered units; KRW estimates are shown only once.
- Shared placeholder styling is lighter (#8a96a6), including login, searches, textareas and empty dropdown choices. Entered values keep their normal darker text. EN/KR and responsive behavior retained.

## Verification

All 34 top-level release checks passed on Node v22.21.0; includes the inherited 19-suite operational/financial regression orchestrator, upgrade/restart checks and actual Chromium browser submissions. Synthetic data only.

Acceptance combines the full run with a targeted rerun of its only failing check: the older browser test expected the previous placeholder color. Its expectation was updated to the intentional V46 color; no application code changed after that full run. The initial failure and rerun are retained in the evidence.

The new browser matrix covers supplier credit, invoice reduction, refund, replacement, company loss, shared responsibility, carrier recovery, later delivery and receipt correction; CEO authorization, final statuses, closed dialogs and disappearance of decision forms are asserted. Missing evidence is rejected before confirmation. EN/KR at 1440/820/390 and computed placeholder colors are checked. Non-CEO approval routing, independent execution, Posted-only credit and task/BU guards remain covered by the approval suite.

Evidence: `qa/evidence/36946-release.json`, `36946-decisions.json`, `receiving46-issues/results.json` and `36946-logs/`. Screenshots and generated sample PDFs were inspected internally or used by tests; they are excluded from delivery. The prior V45 documents describe unchanged receiving/settlement architecture.

## Staging and Git

Use Node 22 and install the entire source. Preserve existing database/upload/environment paths and back up before deployment. There is no new schema migration in V46. Never reset the Render persistent disk/database. Existing V45 rollback guidance applies.

Run `npm ci`, `npm run build:ui`, and `npm run qa:current`. The full gate additionally accepts `--browser --upgrade` and requires the protected V44 source via `BOM_BASELINE_DIR`, Chromium/Playwright, Korean fonts and the configured PDF tools as described in the V45 deployment guide.

Push on a new branch such as `v30.69.46-receiving-decision-fixes`; keep main unchanged until staging acceptance. The V45 Git steps apply using the V46 ZIP and source folder names. No GitHub push is included in this preparation.
