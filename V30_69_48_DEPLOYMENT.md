# V30.69.48 deployment

Use Node 22. Preserve the existing environment, database path, uploads and Render persistent disk. Back up before upgrading. Do not reset or delete the production disk/database.

This is a full source ZIP, including the V47 accounting workbook and Settings entry hotfix. Deploy it using the existing installation process. No new schema, account mappings or historical financial rewrites are introduced by V48. Do not copy disposable QA databases, node_modules or secrets into production.

After deployment verify one supplier profile and one credit-paid import, then test navigation and refresh. The CEO-only approved-policy action is under System Settings → Receiving & Claims Policy. Do not reapply merely to refresh summaries if the approved policy is already active.

GitHub/main and the running service are not changed by preparing this source. When pushing, use a new version branch; inspect staged files and exclude .env, runtime data, uploads, node_modules, backups and databases. Do not pull or merge as part of a branch-only push.
