# Git / Render Ready — V30.43.0

V30.43.0 is built directly on V30.42.0 and is intended to be copied into/cloned over the existing Git repository while preserving the repository's `.git` directory, environment secrets and persistent runtime data.

## Main release scope
- targeted Supplier/Buyer section refresh after child mutations;
- browser-refresh restoration of current child/detail workflow and selected section;
- Machine Cost direct Edit remains available until Finance actually acts;
- no duplicate Purchase Edit inside Costs; Sold / Completed Purchase is locked;
- sold-machine document Delete / Archive restricted to CEO / Owner;
- optional Buyer Sending Account on Buyer Payment and Sell Machine receipts;
- Accounting Cash & Bank account drill-down with balance/statement history;
- generated Account Statements and authenticated PDF download;
- controlled same-BU company-account transfers and preserved Inter-BU workflow;
- V30.42 actionable Tasks and Smart Access Control retained.

## Recommended local QA before push/deploy
```bash
npm ci
npm run qa:v343
npm run qa:current
npm run qa:render
npm run qa:v342:runtime
npm run qa:v341:runtime
npm run qa:runtime
```

The clean release ZIP does not include `node_modules`, `.env`, runtime database files, uploads or backups.

## Git workflow
Create a new branch from the current stable repository, copy the **contents** of this release into that clone without replacing `.git`, review `git status`, commit and push the branch. Test on Render before merging to the stable/main branch.
