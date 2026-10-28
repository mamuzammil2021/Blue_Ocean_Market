// Blue Ocean Market V30.24.2 — nested dialog/Finance reference integrity hotfix marker.
'use strict';
const VERSION = '30.24.2';
async function install({ app, db, auth }) {
  try {await db.prepare("INSERT INTO schema_migrations(id,release_version,notes) VALUES('v30.24.2.nested-dialog-finance-reference',?,?) ON CONFLICT DO NOTHING").run(VERSION, 'System-wide nested dialog isolation, Finance logical-payment reference validation and legacy clearing-account selection protection.');} catch (_) {}
  await app.get('/api/v3242/version', auth, async (req, res) => await res.json({ version: VERSION, features: ['nested-dialog-isolation', 'finance-logical-reference-exclusion', 'legacy-clearing-account-protection'] }));
  return { VERSION };
}
module.exports = { install, VERSION };
