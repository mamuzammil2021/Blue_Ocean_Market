'use strict';const __async = require("./postgres/collections");
const fs = require('fs'),path = require('path'),crypto = require('crypto'),bcrypt = require('bcryptjs');
const storage = require('./runtime-storage'),maintenance = require('./postgres/maintenance');
const VERSION = '30.70.0';
const text = (v) => String(v ?? '').trim();
async function install({ app, db, auth, access }) {
  const enabled = () => ['development', 'testing'].includes(text(process.env.APP_ENV).toLowerCase()) && process.env.ALLOW_TEST_DATA_RESET === 'true';
  const retention = () => Math.max(2, Math.min(3, Number(process.env.TEST_RESET_BACKUP_RETENTION) || 3));
  const canReset = async (req) => req.user?.role === 'CEO / Owner' || (await access?.can(req.user.id, 'sensitive.system_admin', req.selected_business_unit_id || req.user.business_unit_id)) && (await access?.can(req.user.id, 'sensitive.storage', req.selected_business_unit_id || req.user.business_unit_id));
  const authorized = async (req, res, confirmation) => {
    if (!enabled()) {await res.status(403).json({ error: 'Development/Test Environment Reset is disabled.' });return false;}
    if (!(await canReset(req))) {await res.status(403).json({ error: 'CEO / Owner or an authorized System Administrator with Storage permission is required.' });return false;}
    if (confirmation && text(req.body.confirmation) !== confirmation) {await res.status(400).json({ error: `Type ${confirmation} exactly to continue.` });return false;}
    if (confirmation) {
      const user = await db.prepare('SELECT password_hash FROM users WHERE id=? AND active=1').get(req.user.id);
      if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.password_hash))) {await res.status(403).json({ error: 'Current password is incorrect.' });return false;}
      if (!text(req.body.reason)) {await res.status(400).json({ error: 'Reset reason is required.' });return false;}
    }
    return true;
  };
  const operationalRows=()=>maintenance.operationalRows(db);
  const listBackups = () => maintenance.listBackups(storage).filter((b) => b.operation !== 'backup');
  const publicBackup = ({ path, tables, sequences, migrations, files, ...m }) => m;
  function prune() {for (const b of listBackups().slice(retention())) fs.rmSync(b.path, { recursive: true, force: true });}
  function restart() {if (process.env.APP_ENV === 'testing' && process.env.PG_TEST_NO_RESTART === 'true') return;const timer = setTimeout(() => process.emit('SIGTERM'), 500);timer.unref();}
  await app.get('/api/system-settings-v3252/test-reset/status', auth, async (req, res) => {
    if (!(await canReset(req))) return await res.status(403).json({ error: 'Test reset access is not authorized.' });
    const backups = listBackups(),op = await operationalRows(),uploads = maintenance.files(storage.uploadDir);
    let bytes = 0;try {bytes = Number((await db.one('SELECT pg_database_size(current_database())::text AS bytes')).bytes);} catch {}
    await res.json({ enabled: enabled(), app_env: process.env.APP_ENV || '(not set)', allow_flag: process.env.ALLOW_TEST_DATA_RESET === 'true', retention: retention(), pre_reset_backups: backups.map(publicBackup), latest_backup: backups[0] ? publicBackup(backups[0]) : null, database_bytes: bytes, database_provider: 'postgresql', upload_files: uploads.length, upload_bytes: uploads.reduce((n, f) => n + f.bytes, 0), operational_rows: op.total, clear_uploads_allowed: op.total === 0, guard: 'APP_ENV=development|testing + ALLOW_TEST_DATA_RESET=true + authorized user + password + typed confirmation' });
  });
  await app.get('/api/system-settings-v3252/test-reset/history', auth, async (req, res) => {if (await authorized(req, res)) await res.json(await db.prepare('SELECT * FROM system_test_reset_log ORDER BY id DESC LIMIT 100').all());});
  for (const [route, action, label] of [['quick', 'quick', 'Quick Reset'], ['clear-uploads', 'clear-uploads', 'Clear Uploads'], ['restore-last', 'restore', 'Restore Last Pre-Reset Backup'], ['full', 'full', 'Full Reset'], ['full-demo', 'full', 'Full Reset + Demo']]) {
    await app.post('/api/system-settings-v3252/test-reset/' + route, auth, async (req, res) => {
      if (!(await authorized(req, res, action === 'restore' ? 'RESTORE TEST BACKUP' : 'RESET TEST DATA'))) return;
      let marker;
      try {
        const restore = action === 'restore' ? listBackups()[0] : null;
        if (action === 'restore' && !restore) return await res.status(404).json({ error: 'No pre-reset backup is available to restore.' });
        const operationId = crypto.randomUUID();
        if (action === 'full') {
          if (!text(process.env.ADMIN_EMAIL) || text(process.env.ADMIN_PASSWORD).length < 12) return await res.status(409).json({ error: 'ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) are required before a Full Reset.' });
          if (route === 'full-demo' && text(process.env.DEMO_USER_PASSWORD).length < 12) return await res.status(409).json({ error: 'DEMO_USER_PASSWORD (12+ characters) is required before Full Reset + Demo.' });
          marker = path.join(storage.dataDir, '.postgres-reset-seed.json');fs.mkdirSync(storage.dataDir, { recursive: true });
          fs.writeFileSync(marker, JSON.stringify({ operationId, demo: route === 'full-demo' }), { mode: 0o600, flush: true });
        }
        const result = await maintenance.perform(db, storage, { action, actor: req.user, reason: text(req.body.reason), restoreName: restore?.name, operationId, expectedEpoch:req._bomTokenEpoch });
        prune();await res.json({ ...result, action: label, restarting: action === 'full' || action === 'restore', retained_pre_reset_backups: retention() });
        if (action === 'full' || action === 'restore') restart();
      } catch (e) {if (marker) fs.rmSync(marker, { force: true });await res.status(Number(e.status) || 409).json({ error: e.message });}
    });
  }
  return { VERSION, isEnabled: enabled, retention, listBackups };
}
module.exports = { install, VERSION };
