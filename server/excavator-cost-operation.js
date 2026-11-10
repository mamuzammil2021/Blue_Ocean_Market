'use strict';

const { createHash } = require('node:crypto');
const { unlink } = require('node:fs/promises');

function evidenceCleanup(db, req) {
  const files = req.files || (req.file ? [req.file] : []);
  const removeFiles = async () => {
    for (const file of files) await unlink(file.path).catch(error => {
      if (error.code !== 'ENOENT') console.error('Unused Excavator evidence cleanup:', error.message);
    });
  };
  const removeRegistry = async () => {
    for (const file of files) {
      await db.prepare('DELETE FROM attachment_file_registry WHERE stored_name=?').run(file.filename);
    }
  };
  if (files.length) {
    const previousRollback = req.bomIdempotencyRollback;
    req.bomIdempotencyRollback = async () => {
      try { await previousRollback?.(); }
      finally {
        await removeFiles();
        await removeRegistry();
      }
    };
  }

  return { removeFiles, removeRegistry, hasFiles: files.length > 0 };
}

async function start(db, req, unit) {
  const { removeFiles, removeRegistry, hasFiles } = evidenceCleanup(db, req);
  const key = String(req.get('x-idempotency-key') || req.body.idempotency_key || '');
  if (!key) return { complete: async result => result };
  if (!/^[\w:.-]{8,200}$/.test(key)) {
    throw Object.assign(Error('Invalid operation key.'), { status: 400 });
  }
  const fields = Object.entries(req.body).filter(([name]) => name !== 'idempotency_key');
  fields.sort(([a], [b]) => a.localeCompare(b));
  const hash = createHash('sha256').update(JSON.stringify([fields, req.attachment_metadata || []])).digest('hex');
  const scope = [unit, req.user.id, req.route.path.replace(':id', String(Number(req.params.id))), key];
  const existing = await db.prepare(`SELECT payload_hash,response_json FROM excavator_cost_operations
    WHERE business_unit_id=? AND user_id=? AND route=? AND operation_key=?`).get(...scope);
  if (existing) {
    if (existing.payload_hash !== hash) {
      throw Object.assign(Error('Operation key was already used for different details.'), { status: 409 });
    }
    await removeRegistry();
    if (hasFiles) db.afterCommit(removeFiles);
    return { result: JSON.parse(existing.response_json) };
  }
  return {
    async complete(result) {
      await db.prepare(`INSERT INTO excavator_cost_operations
        (business_unit_id,user_id,route,operation_key,payload_hash,response_json) VALUES(?,?,?,?,?,?)`)
        .run(...scope, hash, JSON.stringify(result));
      return result;
    },
  };
}

module.exports = { start, evidenceCleanup };
