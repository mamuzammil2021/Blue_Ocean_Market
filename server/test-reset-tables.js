'use strict';

// Only the password-confirmed, non-production maintenance reset calls this helper.
// SQLite transactional DDL restores every trigger if any deletion/recreation fails.
function clearTestTables(db, targets) {
  if (db.inTransaction) throw new Error('Test reset cannot run inside another transaction.');
  const quote = name => '"' + String(name).replace(/"/g, '""') + '"';
  const selected = new Set(targets);
  const foreignKeys = db.pragma('foreign_keys', {simple: true});
  db.pragma('foreign_keys=OFF');
  try {
    if (db.pragma('foreign_keys', {simple: true}) !== 0) throw new Error('Could not prepare test reset.');
    db.transaction(() => {
      const triggers = db.prepare("SELECT name,tbl_name,sql FROM sqlite_master WHERE type='trigger' AND sql IS NOT NULL ORDER BY name").all().filter(t => selected.has(t.tbl_name));
      for (const t of triggers) db.exec('DROP TRIGGER ' + quote(t.name));
      for (const name of targets) {
        db.exec('DELETE FROM ' + quote(name));
        if (db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='sqlite_sequence'").get()) db.prepare('DELETE FROM sqlite_sequence WHERE name=?').run(name);
      }
      for (const t of triggers) db.exec(t.sql);
      if (db.pragma('foreign_key_check').length) throw new Error('Test reset would leave invalid configuration references. No data was cleared.');
    }).immediate();
  } finally {
    db.pragma('foreign_keys=' + (foreignKeys ? 'ON' : 'OFF'));
  }
}

module.exports = {clearTestTables};
