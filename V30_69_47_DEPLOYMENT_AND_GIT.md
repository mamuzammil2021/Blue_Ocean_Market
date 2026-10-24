# Deployment and Git — V30.69.47

Use Node 22 and existing environment variables, database path and Render persistent disk. Back up before upgrading. Never delete or reset the production database or persistent disk. This ZIP contains source, not production data or secrets.

Extract the ZIP. Copy its project directory into a clean repository checkout on a NEW branch, excluding .git, .env, node_modules, data, uploads, backups, *.sqlite and *.db. Inspect git status and the staged diff before committing. Push only the new branch; do not pull or merge as part of this delivery. This preparation has not pushed, merged or deployed anything.

After deployment, the CEO must open Receiving Accounting Settings and choose Apply Approved Workbook Settings, review and authorize. This action records the actual approving user and policy history. Startup does not overwrite an existing policy. If account 1220 is occupied by a different purpose, setup stops with a clear conflict; obtain an approved alternate mapping rather than renumbering live accounts.

## Approved mappings

| System key | Existing account |
|---|---|
| Supplier advances / posted claim credit | 1300 |
| Pink Salt goods in transit | 1260 |
| Raw inventory | 1270 |
| Packaging inventory | 1280 |
| Abnormal receiving loss | 6610 |
| FX gain / loss | 4300 / 6600 |
| Other Receivables | Reuse matching active account; create 1220 only if unused |

Preserve all existing account IDs/codes, journals and supplier masters. Financial settlements use existing Accounting Posting Control. Cash refunds require Finance verification and Accounting posting. Cross-currency applications retain evidenced exchange-rate controls. Corrections use auditable reversals. No historical financial records are rewritten.
