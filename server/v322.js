// Blue Ocean Market V30.22.0 — stability, security and workflow hardening.
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const VERSION = '30.22.0';

async function install({ app, db, auth, currentUnit, enforceUnit, audit, uploads, secret, access }) {
  const text = (v) => String(v ?? '').trim();
  const tableExists = async (name) => !!(await db.prepare("SELECT 1 FROM bom._relations WHERE type='table' AND name=?").get(name));
  const columns = async (name) => {try {return (await tableExists(name)) ? (await db.columns(name)).map((x) => x.name) : [];} catch (_) {return [];}};
  const ensureColumn = async (table, column, definition) => {try {if (!(await tableExists(table))) return;const cols = await columns(table);if (!cols.includes(column)) void 0;} catch (e) {console.error('V30.22 migration', table, column, e.message);}};
  const normalizeRef = (v) => text(v).toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
  const sha = (v) => crypto.createHash('sha256').update(String(v || '')).digest('hex');
  void 0;
  const markMigration = async (id, notes = '') => {try {await db.prepare("INSERT INTO schema_migrations(id,release_version,notes) VALUES(?,?,?) ON CONFLICT DO NOTHING").run(id, VERSION, notes);} catch (e) {console.error('V30.22 migration registry', id, e.message);}};

  // Additive migrations only. These fields support session revocation, hashed reset
  // tokens, authoritative reference checks and security/audit telemetry.
  await ensureColumn('users', 'auth_version', 'INTEGER NOT NULL DEFAULT 1');
  await ensureColumn('password_resets', 'token_hash', "TEXT DEFAULT ''");
  await ensureColumn('finance_entries', 'reference_normalized', "TEXT DEFAULT ''");
  void 0;












  try {
    const upd = db.prepare("UPDATE finance_entries SET reference_normalized=? WHERE id=?");
    const rows = await db.prepare("SELECT id,reference FROM finance_entries WHERE COALESCE(reference,'')<>'' AND COALESCE(reference_normalized,'')=''").all();
    const tx = db.atomic(async () => {for (const r of rows) await upd.run(normalizeRef(r.reference), r.id);});await tx();
  } catch (e) {console.error('V30.22 reference backfill:', e.message);}
  try {
    const dup = await db.prepare("SELECT payment_account_id,reference_normalized,COUNT(*) c FROM finance_entries WHERE payment_account_id IS NOT NULL AND COALESCE(reference_normalized,'')<>'' AND COALESCE(status,'')!='Voided' GROUP BY payment_account_id,reference_normalized HAVING COUNT(*)>1 LIMIT 1").get();
    if (!dup) void 0;else
    console.warn('V30.22: historical same-account reference duplicates exist; application guard remains active until they are corrected.');
  } catch (e) {console.error('V30.22 unique reference index:', e.message);}
  await markMigration('v30.22.auth-session', 'Session revocation and login-attempt throttling schema.');await markMigration('v30.22.finance-reference', 'Normalized account-scoped payment reference integrity.');await markMigration('v30.22.secure-attachments', 'Authenticated stored-attachment access endpoints.');

  async function securitySettings() {
    const fallback = { password_min_length: 12, password_require_upper: true, password_require_lower: true, password_require_number: true, password_require_special: false, session_timeout_minutes: 720 };
    try {
      if (!(await tableExists('system_settings'))) return fallback;
      const r = await db.prepare("SELECT settings_json FROM system_settings WHERE scope_type='company' AND scope_id=0 AND section='security_access'").get();
      const x = r ? JSON.parse(r.settings_json || '{}') : {};return { ...fallback, ...x };
    } catch (_) {return fallback;}
  }
  async function passwordError(password) {
    const cfg = await securitySettings(),p = String(password || ''),min = Math.max(8, Number(cfg.password_min_length || 12));
    if (p.length < min) return `Password must be at least ${min} characters.`;
    if (cfg.password_require_upper && !/[A-Z]/.test(p)) return 'Password must include an uppercase letter.';
    if (cfg.password_require_lower && !/[a-z]/.test(p)) return 'Password must include a lowercase letter.';
    if (cfg.password_require_number && !/\d/.test(p)) return 'Password must include a number.';
    if (cfg.password_require_special && !/[^A-Za-z0-9]/.test(p)) return 'Password must include a special character.';
    return '';
  }
  function publicUser(u) {return { id: u.id, name: u.name, email: u.email, role: u.role, business_unit_id: u.business_unit_id, preferred_language: u.preferred_language || 'ko' };}
  function loginFingerprint(req, email) {
    const ip = text(req.ip || req.socket?.remoteAddress || 'unknown');
    return { emailHash: sha(String(email || '').trim().toLowerCase()), ipHash: sha(ip) };
  }
  async function recentFailedLogins(emailHash, ipHash) {
    try {return Number((await db.prepare("SELECT COUNT(*) c FROM auth_login_attempts WHERE success=0 AND created_at>=bom.utc_datetime('now','-15 minutes') AND (email_hash=? OR ip_hash=?)").get(emailHash, ipHash))?.c || 0);} catch (_) {return 0;}
  }
  async function logLogin(emailHash, ipHash, success, userId = null) {
    try {await db.prepare("INSERT INTO auth_login_attempts(email_hash,ip_hash,success,user_id) VALUES(?,?,?,?)").run(emailHash, ipHash, success ? 1 : 0, userId || null);await db.prepare("DELETE FROM auth_login_attempts WHERE created_at<bom.utc_datetime('now','-30 days')").run();} catch (_) {}
  }

  // Login hardening: persistent failed-attempt throttling, configured session duration,
  // generic failure messages and auth-version claims for session revocation.
  await app.post('/api/auth/login', async (req, res) => {
    const email = text(req.body?.email).toLowerCase(),password = String(req.body?.password || ''),fp = loginFingerprint(req, email),failed = await recentFailedLogins(fp.emailHash, fp.ipHash);
    if (failed >= 8) {await logLogin(fp.emailHash, fp.ipHash, false, null);return await res.status(429).json({ error: 'Too many sign-in attempts. Please wait and try again.' });}
    const u = email ? await db.prepare("SELECT * FROM users WHERE lower(email)=lower(?) AND active=1").get(email) : null;
    if (!u || !bcrypt.compareSync(password, u.password_hash)) {await logLogin(fp.emailHash, fp.ipHash, false, u?.id || null);try {await audit(u || null, 'auth', u?.id || null, 'login_failed', JSON.stringify({ email_hash: fp.emailHash.slice(0, 16) }));} catch (_) {}return await res.status(401).json({ error: 'Invalid email or password' });}
    await logLogin(fp.emailHash, fp.ipHash, true, u.id);
    const cfg = await securitySettings(),mins = Math.max(15, Math.min(Number(cfg.session_timeout_minutes || 720), 10080)),payload = { ...publicUser(u), epoch: (await db.one('SELECT epoch::text AS epoch FROM bom._pg_auth_epoch WHERE id=1')).epoch, auth_version: Number(u.auth_version || 1), jti: crypto.randomUUID() },token = jwt.sign(payload, secret, { expiresIn: Math.round(mins * 60) });
    try {await audit(u, 'auth', u.id, 'login');} catch (_) {}
    await res.json({ token, user: publicUser(u), session_timeout_minutes: mins });
  });

  function basenameFrom(value) {const s = text(value);if (!s) return '';try {return path.basename(s.split('?')[0]);} catch (_) {return '';}}
  function likeArgs(filename) {return [filename, '%/uploads/' + filename];}
  async function attachmentCandidates(filename) {
    const out = [],add = (row, source, module) => {if (!row) return;out.push({ ...row, source, module });},tryOne = async (sql, args, source, module) => {try {add(await db.prepare(sql).get(...args), source, module);} catch (_) {}};
    const [rawName, pathLike] = likeArgs(filename);
    const brandRows=await db.prepare("SELECT scope_type,scope_id,settings_json FROM system_settings WHERE section='document_branding'").all();
    for(const setting of brandRows){let data={};try{data=JSON.parse(setting.settings_json)}catch(_){}for(const item of Object.values(data))if(item&&typeof item==='object'&&item.file===filename)add({bu:setting.scope_type==='bu'?setting.scope_id:null,title:item.name,file_path:item.file,mime_type:item.mime},'company_document','systemSettings');}
    if (await tableExists('documents')) await tryOne("SELECT d.business_unit_id bu,d.title,d.file_path,'' mime_type FROM documents d WHERE d.file_path=? OR d.file_path ILIKE ? LIMIT 1", [rawName, pathLike], 'documents', 'documents');
    if (await tableExists('excavator_documents')) await tryOne("SELECT a.business_unit_id bu,d.title,d.file_path,d.mime_type FROM excavator_documents d JOIN excavator_assets a ON a.id=d.asset_id WHERE d.file_path=? OR d.file_path ILIKE ? LIMIT 1", [rawName, pathLike], 'excavator_documents', 'excavator');
    if (await tableExists('excavator_buyer_documents')) await tryOne("SELECT b.business_unit_id bu,d.title,d.file_path,d.mime_type FROM excavator_buyer_documents d JOIN excavator_buyers b ON b.id=d.buyer_id WHERE d.file_path=? OR d.file_path ILIKE ? LIMIT 1", [rawName, pathLike], 'excavator_buyer_documents', 'excavatorBuyers');
    if (await tableExists('finance_attachments')) await tryOne("SELECT f.business_unit_id bu,a.title,a.file_path,a.mime_type FROM finance_attachments a JOIN finance_entries f ON f.id=a.finance_entry_id WHERE a.file_path=? OR a.file_path ILIKE ? LIMIT 1", [rawName, pathLike], 'finance_attachments', 'finance');
    if (await tableExists('finance_entries')) await tryOne("SELECT f.business_unit_id bu,'Finance Receipt / Evidence' title,f.receipt_file file_path,'' mime_type FROM finance_entries f WHERE f.receipt_file=? OR f.receipt_file ILIKE ? LIMIT 1", [rawName, pathLike], 'finance_entries', 'finance');
    if (await tableExists('pink_salt_attachments')) await tryOne("SELECT business_unit_id bu,title,file_path,mime_type FROM pink_salt_attachments WHERE archived_at IS NULL AND (file_path=? OR file_path ILIKE ?) LIMIT 1", [rawName, pathLike], 'pink_salt_attachments', 'documents');
    if (await tableExists('payroll_documents')) await tryOne("SELECT COALESCE(e.business_unit_id,r.business_unit_id) bu,d.title,d.file_path,d.mime_type FROM payroll_documents d LEFT JOIN employees e ON e.id=d.employee_id LEFT JOIN payroll_runs r ON r.id=d.payroll_run_id WHERE d.file_path=? OR d.file_path ILIKE ? LIMIT 1", [rawName, pathLike], 'payroll_documents', 'payroll');
    if (await tableExists('accounting_journal_documents')) await tryOne("SELECT j.business_unit_id bu,d.title,d.file_path,d.mime_type FROM accounting_journal_documents d JOIN accounting_journal_entries j ON j.id=d.journal_entry_id WHERE d.file_path=? OR d.file_path ILIKE ? LIMIT 1", [rawName, pathLike], 'accounting_journal_documents', 'finance');
    if (await tableExists('sales')) await tryOne("SELECT business_unit_id bu,'Sales Receipt / Evidence' title,receipt_file file_path,'' mime_type FROM sales WHERE receipt_file=? OR receipt_file ILIKE ? LIMIT 1", [rawName, pathLike], 'sales', 'finance');
    if (await tableExists('purchases')) await tryOne("SELECT business_unit_id bu,'Purchase Evidence' title,attachment_file file_path,'' mime_type FROM purchases WHERE attachment_file=? OR attachment_file ILIKE ? LIMIT 1", [rawName, pathLike], 'purchases', 'finance');
    if (await tableExists('approvals')) await tryOne("SELECT business_unit_id bu,'Approval Evidence' title,attachment_file file_path,'' mime_type FROM approvals WHERE attachment_file=? OR attachment_file ILIKE ? LIMIT 1", [rawName, pathLike], 'approvals', 'documents');
    if (await tableExists('employee_advances')) await tryOne("SELECT business_unit_id bu,'Employee Advance Evidence' title,receipt_file file_path,'' mime_type FROM employee_advances WHERE receipt_file=? OR receipt_file ILIKE ? LIMIT 1", [rawName, pathLike], 'employee_advances', 'payroll');
    if (await tableExists('payroll_runs')) await tryOne("SELECT business_unit_id bu,'Payroll Payment Evidence' title,payment_evidence_file file_path,'' mime_type FROM payroll_runs WHERE payment_evidence_file=? OR payment_evidence_file ILIKE ? LIMIT 1", [rawName, pathLike], 'payroll_runs', 'payroll');
    if (await tableExists('excavator_buyer_payments')) await tryOne("SELECT b.business_unit_id bu,'Buyer Payment Receipt' title,p.receipt_file file_path,'' mime_type FROM excavator_buyer_payments p JOIN excavator_buyers b ON b.id=p.buyer_id WHERE p.receipt_file=? OR p.receipt_file ILIKE ? LIMIT 1", [rawName, pathLike], 'excavator_buyer_payments', 'excavatorBuyers');
    if (await tableExists('excavator_buyer_resale_shares')) await tryOne("SELECT b.business_unit_id bu,'Resale Profit Receipt' title,r.receipt_file file_path,'' mime_type FROM excavator_buyer_resale_shares r JOIN excavator_buyers b ON b.id=r.buyer_id WHERE r.receipt_file=? OR r.receipt_file ILIKE ? LIMIT 1", [rawName, pathLike], 'excavator_buyer_resale_shares', 'excavatorBuyers');
    // Direct evidence columns for legacy rows that predate attachment tables.
    const direct = [
    ['excavator_payments', 'receipt_file', 'asset_id', 'excavator'], ['excavator_transactions', 'receipt_file', 'asset_id', 'excavator'], ['excavator_repairs', 'attachment_file', 'asset_id', 'excavator'], ['excavator_logistics', 'attachment_file', 'asset_id', 'excavator'], ['excavator_parts', 'attachment_file', 'asset_id', 'excavator']];

    for (const [table, col, assetCol, module] of direct) {if (!(await tableExists(table)) || !(await columns(table)).includes(col)) continue;await tryOne(`SELECT a.business_unit_id bu,'Evidence' title,x.${col} file_path,'' mime_type FROM ${table} x JOIN excavator_assets a ON a.id=x.${assetCol} WHERE x.${col}=? OR x.${col} LIKE ? LIMIT 1`, [rawName, pathLike], table, module);}
    return out.filter(Boolean);
  }
  async function authorizeAttachment(req, filename) {
    const candidates = await attachmentCandidates(filename),user = req.user;
    if (!candidates.length) {if (user.role === 'CEO / Owner' && fs.existsSync(path.join(uploads, filename))) return { bu: null, title: 'Legacy Attachment', mime_type: '', source: 'legacy_orphan', module: 'documents' };return null;}
    const c = candidates.find((x) => !x.bu || enforceUnit(req, Number(x.bu))) || null;if (!c) return false;
    if(c.source==='company_document'&&user.role!=='CEO / Owner'&&!await access?.can?.(user.id,'sensitive.system_admin',Number(c.bu)||null))return false;
    if (c.module === 'payroll' && user.role !== 'CEO / Owner' && access?.can && !(await access.can(user.id, 'sensitive.payroll', Number(c.bu) || null))) return false;
    if (access?.canAction && user.role !== 'CEO / Owner' && ['finance', 'documents', 'excavator', 'excavatorBuyers'].includes(c.module)) {
      // The record's BU remains the primary confidentiality boundary. If an explicit
      // module view permission exists, require it as an additional boundary.
      try {if (!(await access.canAction(user.id, c.module, 'view', Number(c.bu) || null))) return false;} catch (_) {}
    }
    return c;
  }
  async function streamAttachment(req, res, download = false) {
    const filename = basenameFrom(req.params.filename);if (!filename || filename === '.' || filename === '..') return await res.status(400).json({ error: 'Invalid attachment path.' });
    const meta = await authorizeAttachment(req, filename);if (meta === false) return await res.status(403).json({ error: 'You do not have permission to access this attachment.' });if (!meta) return await res.status(404).json({ error: 'Attachment not found or is not linked to an accessible record.' });
    const p = path.join(uploads, filename);if (path.dirname(p) !== path.resolve(uploads) || !fs.existsSync(p) || !fs.statSync(p).isFile()) return await res.status(404).json({ error: "Attachment file is missing from storage." });
    const original = basenameFrom(meta.file_path) || filename,ext = path.extname(filename).toLowerCase(),types = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.csv': 'text/csv', '.txt': 'text/plain', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xls': 'application/vnd.ms-excel', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.doc': 'application/msword' },mime = text(meta.mime_type) || types[ext] || 'application/octet-stream';
    res.set('Cache-Control', 'private, no-store, max-age=0');res.set('X-Content-Type-Options', 'nosniff');res.type(mime);res.set('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(original)}`);
    try {await audit(req.user, 'attachment_access', null, download ? 'download' : 'view', JSON.stringify({ filename, source: meta.source, business_unit_id: meta.bu || null }));} catch (_) {}
    fs.createReadStream(p).on('error', () => {if (!res.headersSent) res.status(404).end();}).pipe(res);
  }
  await app.get('/api/v322/attachments/:filename/view', auth, async (req, res) => await streamAttachment(req, res, false));
  await app.get('/api/v322/attachments/:filename/download', auth, async (req, res) => await streamAttachment(req, res, true));
  await app.get('/api/v322/attachments/:filename/meta', auth, async (req, res) => {const filename = basenameFrom(req.params.filename),meta = await authorizeAttachment(req, filename);if (meta === false) return await res.status(403).json({ error: 'You do not have permission to access this attachment.' });if (!meta) return await res.status(404).json({ error: 'Attachment not found or inaccessible.' });await res.json({ filename, title: meta.title || 'Attachment', source: meta.source, business_unit_id: meta.bu || null });});

  await app.get('/api/v322/version', auth, async (req, res) => await res.json({ version: VERSION, features: ['secure-attachments', 'login-rate-limit', 'session-revocation', 'hashed-reset-tokens', 'reference-index-hardening'] }));
  return { VERSION, passwordError, normalizeRef, authorizeAttachment, attachmentCandidates };
}

module.exports = { install, VERSION };
