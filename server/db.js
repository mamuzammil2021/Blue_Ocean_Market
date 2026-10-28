'use strict';const __async = require("./postgres/collections");const bcrypt = require('bcryptjs'),fs = require('fs'),path = require('path');const storage = require('./runtime-storage');const dataDir = storage.dataDir;const db = require('./postgres/runtime').getDatabase();module.exports = db;db.ready = (async () => {await require('./postgres/migrate').migrate(db);await require('./postgres/maintenance').recover(db, storage);db._resetSeedFile = (await require('../scripts/test-reset-startup').applyPending(storage, db))?.file;
  void 0;







































  try {void 0;} catch (e) {}
  try {void 0;} catch (e) {}
  try {void 0;} catch (e) {}
  const units = ['MIMI Resturant', 'Excavator', 'Mango / Seasonal', 'Pink Salt'];
  try {void 0;} catch (e) {}
  try {void 0;} catch (e) {}
  const addUnit = db.prepare("INSERT INTO business_units(name,notes) VALUES(?,?) ON CONFLICT DO NOTHING");await __async.forEach(units, async (x) => await addUnit.run(x, `${x} management workspace`));
  // Add required workspaces without deleting or mutating historical/custom business units.

  let admin = await db.prepare("SELECT id FROM users WHERE role='CEO / Owner' ORDER BY id LIMIT 1").get();
  if (!admin) {
    const adminEmail = String(process.env.ADMIN_EMAIL || '').trim(),adminPassword = String(process.env.ADMIN_PASSWORD || '');
    if (!adminEmail || adminPassword.length < 12) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters) are required for first startup.');
    const r = await db.prepare("INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)").run('Abdullah Muzammil', adminEmail, bcrypt.hashSync(adminPassword, 12), 'CEO / Owner');admin = { id: r.lastInsertRowid };
  }
  const unitId = async (n) => (await db.prepare("SELECT id FROM business_units WHERE name=?").get(n))?.id;
  const mimi = await unitId('MIMI Resturant');
  const seedProduct = db.prepare("INSERT INTO products(business_unit_id,sku,name,category,supplier,item_type,unit,opening_stock,current_stock,reorder_level,cost_price,selling_price,tax_rate) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING");
  if (mimi && process.env.SEED_DEMO_DATA === 'true') {await seedProduct.run(mimi, 'MIMI-001', 'Chicken Biryani', 'Main Course', 'MIMI Kitchen', 'PRODUCT', 'plate', 0, 0, 5, 280, 450, 0);await seedProduct.run(mimi, 'MIMI-002', 'Chicken Burger', 'Fast Food', 'MIMI Kitchen', 'PRODUCT', 'pcs', 0, 0, 5, 220, 380, 0);await seedProduct.run(mimi, 'MIMI-003', 'Tea', 'Beverage', 'MIMI Kitchen', 'PRODUCT', 'cup', 0, 0, 10, 45, 100, 0);await seedProduct.run(mimi, 'MIMI-004', 'Delivery Service', 'Service', 'MIMI', 'SERVICE', 'service', 0, 0, 0, 0, 250, 0);for (let i = 1; i <= 12; i++) await db.prepare("INSERT INTO restaurant_tables(business_unit_id,name,capacity) VALUES(?,?,?) ON CONFLICT DO NOTHING").run(mimi, `Table ${i}`, i <= 4 ? 2 : i <= 10 ? 4 : 6);}
  const demoPassword = String(process.env.DEMO_USER_PASSWORD || '');
  if (process.env.SEED_DEMO_USERS === 'true' && demoPassword.length >= 12 && (await db.prepare("SELECT COUNT(*) c FROM users").get()).c === 1) {const defs = [['Ahmed Khan', 'Business Unit Manager', 'MIMI Resturant'], ['Bilal Ahmed', 'Finance / Admin', 'Excavator'], ['Hassan Raza', 'Sales / Business Development', 'Mango / Seasonal'], ['Usman Ali', 'Business Unit Manager', 'Pink Salt'], ['Sara Ali', 'Staff Member', 'MIMI Resturant']];const st = db.prepare("INSERT INTO users(name,email,password_hash,role,business_unit_id) VALUES(?,?,?,?,?)");await __async.forEach(defs, async ([n, r, b]) => await st.run(n, n.toLowerCase().replace(/\s+/g, '.') + '@blueocean.local', bcrypt.hashSync(demoPassword, 12), r, await unitId(b)));}

  if (mimi && process.env.SEED_DEMO_DATA === 'true') {
    const mp = db.prepare("INSERT INTO restaurant_menu_items(business_unit_id,product_id,name,category,price,active,available,description) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING");
    await __async.forEach(await db.prepare("SELECT id,name,selling_price,category FROM products WHERE business_unit_id=? AND active=1").all(mimi), async (x) => await mp.run(mimi, x.id, x.name, x.category, x.selling_price, 1, 1, ''));
  }


  // V20: migrate databases created by earlier versions.
  async function v20EnsureColumn(table, column, definition) {
    try {
      const cols = (await db.columns(table)).map((x) => x.name);
      if (cols.length && !cols.includes(column)) {
        void 0;
      }
    } catch (e) {
      console.error(`V20 migration ${table}.${column}:`, e.message);
    }
  }
  try {
    // V22: full compatibility for Excavator transaction tables from earlier versions.
    await v20EnsureColumn('excavator_transactions', 'asset_id', 'INTEGER');
    await v20EnsureColumn('excavator_transactions', 'type', "TEXT DEFAULT 'Other Cost'");
    await v20EnsureColumn('excavator_transactions', 'stage', "TEXT DEFAULT 'Purchased'");
    await v20EnsureColumn('excavator_transactions', 'transaction_date', 'TEXT');
    await v20EnsureColumn('excavator_transactions', 'counterparty', "TEXT DEFAULT ''");
    await v20EnsureColumn('excavator_transactions', 'amount', 'REAL DEFAULT 0');
    await v20EnsureColumn('excavator_transactions', 'currency', "TEXT DEFAULT 'KRW'");
    await v20EnsureColumn('excavator_transactions', 'status', "TEXT DEFAULT 'Open'");
    await v20EnsureColumn('excavator_transactions', 'notes', "TEXT DEFAULT ''");
    await v20EnsureColumn('excavator_transactions', 'metadata', "TEXT DEFAULT ''");
    await v20EnsureColumn('excavator_transactions', 'created_by', 'INTEGER');
    await v20EnsureColumn('notifications', 'read_at', 'TEXT');
  } catch (e) {
    console.error('V20 database migration:', e.message);
  }

  // V14 Excavator lifecycle and transaction layer
  try {void 0;










































  } catch (e) {console.error('V14 schema', e.message);}

  // V26.5 traceability schema
  for (const [t, c, d] of [['finance_entries', 'void_reason', "TEXT DEFAULT ''"], ['finance_entries', 'voided_by', 'INTEGER'], ['finance_entries', 'voided_at', 'TEXT'], ['notifications', 'business_unit_id', 'INTEGER'], ['notifications', 'entity_type', "TEXT DEFAULT ''"], ['notifications', 'entity_id', 'INTEGER'], ['notifications', 'action_view', "TEXT DEFAULT ''"], ['notifications', 'action_id', 'INTEGER'], ['excavator_buyer_payments', 'status', "TEXT DEFAULT 'Active'"]]) {try {void 0;} catch (_) {}}
  try {void 0;} catch (e) {}
  try {void 0;} catch (e) {}

  // V27.4 — finance verification/source integrity indexes. Keep source uniqueness scoped by business unit.
  try {void 0;} catch (e) {}
  try {void 0;} catch (e) {}

  try {[];} catch (_) {}


  // V24.4 schema
  try {void 0;























  } catch (e) {console.error('V24.4 schema', e.message);}

  // V26 Buyer management schema
  try {void 0;










































































































  } catch (e) {console.error('V26 buyer schema', e.message);}
  // V26.7: Buyer-payment status migration must run AFTER the buyer-payment table exists.
  // The older V26.5 migration ran before this table was created on a fresh database,
  // leaving the status column missing and causing the Buyers API queries to fail.
  try {void 0;} catch (e) {}
  try {await db.exec("UPDATE excavator_buyer_payments SET status='Active' WHERE status IS NULL OR status=''");} catch (e) {}
  try {void 0;} catch (e) {}
  try {void 0;} catch (e) {}
  try {void 0;} catch (e) {}
  try {await db.exec("UPDATE excavator_buyers SET buyer_type=CASE WHEN lower(country)='south korea' OR lower(country)='korea' OR lower(country)='republic of korea' THEN 'Local' ELSE 'International' END WHERE buyer_type IS NULL OR buyer_type=''");} catch (e) {}
  try {void 0;} catch (e) {}
  try {void 0;} catch (e) {}
  try {const legacy = await db.prepare("SELECT id,buyer_id,asset_id,krw_amount,created_by FROM excavator_buyer_payments WHERE asset_id IS NOT NULL").all();const ins = db.prepare("INSERT INTO excavator_buyer_payment_allocations(payment_id,buyer_id,asset_id,amount_krw,allocation_date,created_by,notes) VALUES(?,?,?, ?,bom.utc_now(),?,?)");for (const p of legacy) {const exists = await db.prepare("SELECT 1 FROM excavator_buyer_payment_allocations WHERE payment_id=? AND asset_id=?").get(p.id, p.asset_id);if (!exists) await ins.run(p.id, p.buyer_id, p.asset_id, p.krw_amount, p.created_by, "Migrated from legacy payment allocation");}} catch (e) {console.error('Buyer allocation migration', e.message);}
  try {void 0;} catch (e) {}
  // V28 keeps historical buyer-payment constraints in place. Required payment date,
  // reference and evidence are enforced by the API without rebuilding or dropping tables.

  for (const [t, c, d] of [['finance_entries', 'verification_status', "TEXT DEFAULT 'Pending Verification'"], ['finance_entries', 'verified_by', 'INTEGER'], ['finance_entries', 'verified_at', 'TEXT'], ['finance_entries', 'verification_note', "TEXT DEFAULT ''"], ['finance_entries', 'source_type', "TEXT DEFAULT 'Manual'"], ['finance_entries', 'source_id', 'INTEGER'], ['excavator_assets', 'supplier_id', 'INTEGER'], ['excavator_assets', 'purchase_token', 'REAL DEFAULT 0'], ['excavator_assets', 'purchase_balance', 'REAL DEFAULT 0'], ['excavator_assets', 'purchase_payment_status', "TEXT DEFAULT 'Pending'"]]) {try {void 0;} catch (e) {}}

  // V27.0 — configurable approvals, people/performance, structured reporting,
  // sale-update traceability and final compatibility migrations.
  async function v27EnsureColumn(table, column, definition) {
    try {
      const cols = (await db.columns(table)).map((x) => x.name);
      if (cols.length && !cols.includes(column)) void 0;
    } catch (e) {console.error(`V27 migration ${table}.${column}:`, e.message);}
  }

  // Retain compatibility columns through additive migrations only.
  // Re-assert it at the end of all buyer-payment migrations.
  await v27EnsureColumn('excavator_buyer_payments', 'status', "TEXT DEFAULT 'Active'");
  try {await db.exec("UPDATE excavator_buyer_payments SET status='Active' WHERE status IS NULL OR status=''");} catch (e) {}

  for (const [t, c, d] of [
  ['finance_entries', 'updated_at', 'TEXT'],
  ['finance_entries', 'transaction_date', 'TEXT'],
  ['finance_entries', 'original_amount', 'REAL'],
  ['finance_entries', 'original_currency', "TEXT DEFAULT 'KRW'"],
  ['finance_entries', 'fx_rate', 'REAL DEFAULT 1'],
  ['finance_entries', 'krw_amount', 'REAL'],
  ['finance_entries', 'source_record_id', 'INTEGER'],
  ['finance_entries', 'source_payment_id', 'INTEGER'],
  ['finance_entries', 'source_label', "TEXT DEFAULT ''"],
  ['finance_entries', 'correction_reason', "TEXT DEFAULT ''"],
  ['finance_entries', 'submitted_at', 'TEXT'],
  ['finance_entries', 'resubmitted_at', 'TEXT'],
  ['audit_log', 'business_unit_id', 'INTEGER'],
  ['sales', 'void_reason', "TEXT DEFAULT ''"],
  ['sales', 'voided_by', 'INTEGER'],
  ['sales', 'voided_at', 'TEXT'],
  ['approvals', 'action_key', "TEXT DEFAULT 'general.request'"],
  ['approvals', 'source_entity', "TEXT DEFAULT ''"],
  ['approvals', 'source_id', 'INTEGER'],
  ['approvals', 'priority', "TEXT DEFAULT 'Normal'"],
  ['approvals', 'required_level', 'INTEGER DEFAULT 2'],
  ['approvals', 'current_level', 'INTEGER DEFAULT 0'],
  ['approvals', 'decision_note', "TEXT DEFAULT ''"],
  ['approvals', 'updated_at', 'TEXT'],
  ['approvals', 'executed_at', 'TEXT'],
  ['tasks', 'description', "TEXT DEFAULT ''"],
  ['tasks', 'complexity', "TEXT DEFAULT 'Medium'"],
  ['tasks', 'work_points', 'REAL DEFAULT 2'],
  ['tasks', 'progress_percent', 'REAL DEFAULT 0'],
  ['tasks', 'start_date', 'TEXT'],
  ['tasks', 'completed_at', 'TEXT'],
  ['tasks', 'related_module', "TEXT DEFAULT ''"],
  ['tasks', 'related_entity_type', "TEXT DEFAULT ''"],
  ['tasks', 'related_entity_id', 'INTEGER'],
  ['tasks', 'attachments_json', "TEXT DEFAULT '[]'"],
  ['tasks', 'review_required', 'INTEGER DEFAULT 0'],
  ['tasks', 'review_status', "TEXT DEFAULT 'Not Required'"],
  ['tasks', 'reviewed_by', 'INTEGER'],
  ['tasks', 'reviewed_at', 'TEXT'],
  ['tasks', 'assigned_by', 'INTEGER'],
  ['tasks', 'updated_at', 'TEXT'],
  ['tasks', 'returned_count', 'INTEGER DEFAULT 0'],
  ['excavator_transactions', 'updated_by', 'INTEGER'],
  ['excavator_transactions', 'updated_at', 'TEXT'],
  ['excavator_buyer_payment_allocations', 'status', "TEXT DEFAULT 'Active'"],
  ['excavator_buyer_payment_allocations', 'void_reason', "TEXT DEFAULT ''"],
  ['excavator_buyer_payment_allocations', 'voided_by', 'INTEGER'],
  ['excavator_buyer_payment_allocations', 'voided_at', 'TEXT'],
  ['documents', 'workflow_status', "TEXT DEFAULT 'Draft'"],
  ['documents', 'reviewed_by', 'INTEGER'],
  ['documents', 'reviewed_at', 'TEXT'],
  ['documents', 'workflow_note', "TEXT DEFAULT ''"]])
  await v27EnsureColumn(t, c, d);

  try {void 0;


















































































































































































  } catch (e) {console.error('V27 schema:', e.message);}

  try {await v27EnsureColumn('work_reports', 'attachments_json', "TEXT DEFAULT '[]'");} catch (e) {}

  // Seed editable unit-specific defaults. They are intentionally independent per unit.
  try {
    const units27 = await db.prepare("SELECT id FROM business_units WHERE status!='Archived'").all();
    const addRule = db.prepare(`INSERT INTO approval_rules
    (business_unit_id,action_key,action_name,condition_type,threshold_amount,approver_level,require_dual,notes)
    VALUES(?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING`);
    const defaults = [
    ['finance.large_payment', 'Large Payment / Expense', 'Amount Above', 5000000, 3, 0, 'Finance review for high-value payments.'],
    ['finance.verified_change', 'Verified Finance Change', 'Always', 0, 3, 0, 'Finance approval before a verified transaction is reopened for correction.'],
    ['excavator.machine_purchase', 'Large Machine Purchase', 'Amount Above', 20000000, 4, 0, 'CEO approval above configured purchase threshold.'],
    ['sale.loss_or_low_margin', 'Loss / Below-Margin Sale', 'Exception', 0, 4, 0, 'CEO approval for loss-making or exceptional sales.'],
    ['payment.void', 'Payment Void / Reversal', 'Always', 0, 5, 1, 'Dual Finance + CEO approval before financial reversal.'],
    ["completed_sale.update", "Completed Sale Update", 'Always', 0, 4, 0, "Controlled update of a completed sale."],
    ["document.delete", "Important Document Delete", 'Always', 0, 4, 0, 'High-risk document deletion.'],
    ['inventory.writeoff', 'Inventory Write-off', 'Amount Above', 1000000, 2, 0, 'Manager approval above unit threshold.'],
    ['buyer.advance_refund', 'Buyer Advance Refund', 'Amount Above', 5000000, 5, 1, 'Dual approval for material buyer refunds.']];

    for (const u of units27) for (const r of defaults) await addRule.run(u.id, ...r);

    const addKpi = db.prepare(`INSERT INTO performance_kpi_rules
    (business_unit_id,role,name,metric_key,weight,target,direction) VALUES(?,?,?,?,?,?,?) ON CONFLICT DO NOTHING`);
    const roleWeights = {
      '*': [['Productivity', 'productivity', 30], ['Quality / First-pass Accuracy', 'quality', 25], ['Timeliness', 'timeliness', 20], ['Reliability', 'reliability', 15], ['Business Results', 'business_results', 10]],
      'Finance / Admin': [['Productivity', 'productivity', 20], ['Quality / Accuracy', 'quality', 35], ['Timeliness', 'timeliness', 25], ['Reliability', 'reliability', 20], ['Business Results', 'business_results', 0]],
      'Sales / Business Development': [['Productivity', 'productivity', 25], ['Quality', 'quality', 15], ['Timeliness', 'timeliness', 15], ['Reliability', 'reliability', 10], ['Business Results', 'business_results', 35]]
    };
    for (const u of units27) for (const [role, rows] of Object.entries(roleWeights)) for (const [name, key, weight] of rows) await addKpi.run(u.id, role, name, key, weight, 100, 'Higher Is Better');
  } catch (e) {console.error('V27 seed:', e.message);}


  // V27.3 — full meeting management on the existing Meetings module.
  for (const [t, c, d] of [
  ['meetings', 'organizer_id', 'INTEGER'], ['meetings', 'meeting_type', "TEXT DEFAULT 'Unit Meeting'"],
  ['meetings', 'start_time', 'TEXT'], ['meetings', 'duration_minutes', 'INTEGER DEFAULT 60'],
  ['meetings', 'location', "TEXT DEFAULT ''"], ['meetings', 'online_link', "TEXT DEFAULT ''"],
  ['meetings', 'agenda', "TEXT DEFAULT ''"], ['meetings', 'minutes', "TEXT DEFAULT ''"],
  ['meetings', 'decisions', "TEXT DEFAULT ''"], ['meetings', 'status', "TEXT DEFAULT 'Draft'"],
  ['meetings', 'scope_mode', "TEXT DEFAULT 'Unit'"], ['meetings', 'priority', "TEXT DEFAULT 'Normal'"],
  ['meetings', 'recurrence', "TEXT DEFAULT 'None'"], ['meetings', 'attachments_json', "TEXT DEFAULT '[]'"],
  ['meetings', 'updated_at', 'TEXT'], ['meeting_actions', 'task_id', 'INTEGER'],
  ['meeting_actions', 'notes', "TEXT DEFAULT ''"], ['meeting_actions', 'created_by', 'INTEGER'],
  ['meeting_actions', 'created_at', "TEXT DEFAULT bom.utc_now()"]])
  await v27EnsureColumn(t, c, d);
  try {void 0;













  } catch (e) {console.error('V27.3 meeting schema:', e.message);}

  // V27.5 — bilingual UI preference and Finance review workflow compatibility.
  await v27EnsureColumn('users', 'preferred_language', "TEXT DEFAULT 'ko'");
  try {await db.exec("UPDATE users SET preferred_language='ko' WHERE preferred_language IS NULL OR preferred_language NOT IN ('en','ko')");} catch (e) {console.error('V27.5 language migration:', e.message);}
  try {void 0;} catch (e) {}

  // V27.8 — Korean is the company default. Existing inherited defaults migrate once;
  // a language explicitly chosen by a user is preserved thereafter.
  await v27EnsureColumn('users', 'language_explicit', "INTEGER DEFAULT 0");
  try {await db.exec("UPDATE users SET preferred_language='ko' WHERE COALESCE(language_explicit,0)=0; UPDATE users SET preferred_language='ko' WHERE preferred_language IS NULL OR preferred_language NOT IN ('en','ko')");} catch (e) {console.error('V27.8 Korean-first language migration:', e.message);}

  // V28.0 — mobile-first operations, structured buyer requirements, mandatory
  // Excavator payment evidence, and a complete Finance correction work queue.
  for (const [table, column, definition] of [
  ['excavator_buyer_requirements', 'machine_name', "TEXT DEFAULT ''"],
  ['excavator_buyer_requirements', 'serial_no', "TEXT DEFAULT ''"],
  ['excavator_buyer_requirements', 'condition_status', "TEXT DEFAULT ''"],
  ['excavator_buyer_requirements', 'location', "TEXT DEFAULT ''"],
  ['excavator_payments', 'receipt_file', "TEXT DEFAULT ''"],
  ['excavator_payments', 'receipt_document_id', 'INTEGER'],
  ['excavator_parts', 'attachment_file', "TEXT DEFAULT ''"]])
  await v27EnsureColumn(table, column, definition);
  try {void 0;





























  } catch (e) {console.error('V28 Finance correction schema:', e.message);}

  // V28.1 — live action queues, aligned machine requirements, smart matching,
  // exchange proposals, and complete creator-owned Finance correction history.
  for (const [table, column, definition] of [
  ['excavator_supplier_requirements', 'machine_name', "TEXT DEFAULT ''"],
  ['excavator_supplier_requirements', 'budget_min', 'REAL DEFAULT 0'],
  ['excavator_supplier_requirements', 'quantity', 'REAL DEFAULT 1'],
  ['excavator_supplier_requirements', 'updated_at', 'TEXT'],
  ['excavator_buyer_requirements', 'budget_min', 'REAL DEFAULT 0'],
  ['excavator_buyer_requirements', 'action_type', "TEXT DEFAULT 'Buy'"],
  ['excavator_buyer_requirements', 'exchange_machine', "TEXT DEFAULT ''"],
  ['excavator_buyer_requirements', 'updated_at', 'TEXT'],
  ['finance_correction_requests', 'task_id', 'INTEGER'],
  ['finance_correction_requests', 'replacement_finance_entry_id', 'INTEGER REFERENCES finance_entries(id)'],
  ['finance_correction_requests', 'reminder_count', 'INTEGER DEFAULT 0'],
  ['finance_correction_requests', 'last_reminder_at', 'TEXT'],
  ['finance_correction_requests', 'source_snapshot_json', "TEXT DEFAULT '{}'"],
  ['finance_correction_requests', 'changed_fields_json', "TEXT DEFAULT '[]'"]])
  await v27EnsureColumn(table, column, definition);
  try {void 0;


































































  } catch (e) {console.error('V28.1 workflow schema:', e.message);}

  // V28.2 — simplified approval decisions, immutable request snapshots,
  // creator-owned change cycles, reminders and controlled execution/void history.
  for (const [table, column, definition] of [
  ['approvals', 'request_snapshot_json', "TEXT DEFAULT '{}'"],
  ['approvals', 'original_snapshot_json', "TEXT DEFAULT '{}'"],
  ['approvals', 'payload_hash', "TEXT DEFAULT ''"],
  ['approvals', 'changed_fields_json', "TEXT DEFAULT '[]'"],
  ['approvals', 'revision_count', 'INTEGER DEFAULT 0'],
  ['approvals', 'parent_approval_id', 'INTEGER'],
  ['approvals', 'change_task_id', 'INTEGER'],
  ['approvals', 'reminder_count', 'INTEGER DEFAULT 0'],
  ['approvals', 'last_reminder_at', 'TEXT'],
  ['approvals', 'cancelled_by', 'INTEGER'],
  ['approvals', 'cancelled_at', 'TEXT'],
  ['approvals', 'voided_by', 'INTEGER'],
  ['approvals', 'voided_at', 'TEXT'],
  ['approvals', 'execution_result_json', "TEXT DEFAULT '{}'"],
  ['approvals', 'execution_error', "TEXT DEFAULT ''"]])
  await v27EnsureColumn(table, column, definition);
  try {void 0;



  } catch (e) {console.error('V28.2 approval workflow schema:', e.message);}

  // V28.3 — revision-aware approval execution, CEO direct authorization and
  // evidence-backed buyer advance refunds. All migrations are additive: no
  // development or operational data is removed automatically.
  for (const [table, column, definition] of [
  ['approvals', 'finance_approved_revision', 'INTEGER DEFAULT -1'],
  ['approvals', 'ceo_approved_revision', 'INTEGER DEFAULT -1'],
  ['approvals', 'direct_authorization', 'INTEGER DEFAULT 0'],
  ['approvals', 'direct_authorization_note', "TEXT DEFAULT ''"]])
  await v27EnsureColumn(table, column, definition);
  try {void 0;






























  } catch (e) {console.error('V28.3 approval/refund schema:', e.message);}
  try {
    await db.exec(`UPDATE approvals SET finance_approved_revision=COALESCE(revision_count,0)
    WHERE COALESCE(finance_approved_revision,-1)<0
      AND EXISTS(SELECT 1 FROM approval_history h WHERE h.approval_id=approvals.id AND h.action='Finance Approved')`);
  } catch (e) {console.error('V28.3 approval revision backfill:', e.message);}

  // Development/test accounts are opt-in and additive. Re-running a build never
  // deletes or resets them. The password must be supplied through the environment.
  try {
    const developmentPassword = String(process.env.DEMO_USER_PASSWORD || '');
    if (process.env.SEED_DEMO_USERS === 'true' && developmentPassword.length >= 12) {
      const demoUsers = [
      ['Ahmed Khan', 'Business Unit Manager', 'MIMI Resturant', 'ahmed.khan@blueocean.local'],
      ['Bilal Ahmed', 'Finance / Admin', 'Excavator', 'bilal.ahmed@blueocean.local'],
      ['Farhan Malik', 'Finance / Admin', 'Excavator', 'farhan.malik@blueocean.local'],
      ['Hassan Raza · Excavator', 'Sales / Business Development', 'Excavator', 'hassan.excavator@blueocean.local'],
      ['Usman Ali', 'Business Unit Manager', 'Pink Salt', 'usman.ali@blueocean.local'],
      ['Sara Ali', 'Staff Member', 'MIMI Resturant', 'sara.ali@blueocean.local']];

      const insertDemo = db.prepare("INSERT INTO users(name,email,password_hash,role,business_unit_id) VALUES(?,?,?,?,?) ON CONFLICT DO NOTHING");
      for (const [name, role, unit, email] of demoUsers) await insertDemo.run(name, email, bcrypt.hashSync(developmentPassword, 12), role, await unitId(unit));
    }
  } catch (e) {console.error('V28.3 development user seed:', e.message);}

  // Optional, clearly-labelled sample records for the development/testing phase.
  // They are inserted only when missing and are never used to reset real data.
  try {
    if (process.env.SEED_DEMO_DATA === 'true') {
      const businessUnitId = await unitId('Excavator'),creator = (await db.prepare("SELECT id FROM users WHERE business_unit_id=? AND active=1 ORDER BY CASE role WHEN 'Sales / Business Development' THEN 0 WHEN 'Business Unit Manager' THEN 1 ELSE 2 END,id LIMIT 1").get(businessUnitId))?.id || (await db.prepare("SELECT id FROM users WHERE role='CEO / Owner' AND active=1 ORDER BY id LIMIT 1").get())?.id || null;
      if (businessUnitId) {
        let supplier = await db.prepare("SELECT id FROM excavator_suppliers WHERE business_unit_id=? AND name='DEMO · Seoul Heavy Equipment'").get(businessUnitId);if (!supplier) {const r = await db.prepare("INSERT INTO excavator_suppliers(business_unit_id,name,location,contact_person,phone,email,notes,created_by) VALUES(?,?,?,?,?,?,?,?)").run(businessUnitId, 'DEMO · Seoul Heavy Equipment', 'Incheon', 'Demo Contact', '010-0000-1001', 'demo.supplier@blueocean.local', 'DEVELOPMENT TEST DATA — safe to archive after testing.', creator);supplier = { id: Number(r.lastInsertRowid) };}
        if (!(await db.prepare("SELECT id FROM excavator_supplier_machines WHERE supplier_id=? AND serial_no='DEMO-DX225-001'").get(supplier.id))) await db.prepare("INSERT INTO excavator_supplier_machines(supplier_id,machine_name,machine_type,make,model,year,serial_no,condition_status,asking_price,location,status,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)").run(supplier.id, 'Crawler Excavator', 'Excavator', 'Doosan', 'DX225LC', 2021, 'DEMO-DX225-001', 'Used', 95000000, 'Incheon', 'Available', 'DEVELOPMENT TEST DATA', creator);
        let buyer = await db.prepare("SELECT id FROM excavator_buyers WHERE business_unit_id=? AND name='DEMO · Overseas Buyer'").get(businessUnitId);if (!buyer) {const r = await db.prepare("INSERT INTO excavator_buyers(business_unit_id,name,country,location,contact_person,phone,email,payment_terms,notes,buyer_type,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(businessUnitId, 'DEMO · Overseas Buyer', 'Pakistan', 'Lahore', 'Demo Buyer', '0300-0000000', 'demo.buyer@blueocean.local', 'Advance before allocation', 'DEVELOPMENT TEST DATA — safe to archive after testing.', 'International', creator);buyer = { id: Number(r.lastInsertRowid) };}
        if (!(await db.prepare("SELECT id FROM excavator_buyer_requirements WHERE buyer_id=? AND requirement='DEMO · Doosan DX225 requirement'").get(buyer.id))) await db.prepare("INSERT INTO excavator_buyer_requirements(buyer_id,requirement,machine_name,machine_type,make,model,min_year,max_year,condition_status,budget_min,budget_max,quantity,action_type,status,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(buyer.id, 'DEMO · Doosan DX225 requirement', 'Crawler Excavator', 'Excavator', 'Doosan', 'DX225LC', 2020, 2023, 'Used', 85000000, 105000000, 1, 'Buy', 'Active', 'DEVELOPMENT TEST DATA', creator);
      }
    }
  } catch (e) {console.error('V28.3 development sample data seed:', e.message);}


  // V28.6 — machine-sale payment-source linkage and payment-status synchronization.
  // Additive only: these columns/indexes never reset or delete existing development data.
  for (const [table, column, definition] of [
  ['excavator_payments', 'source_type', "TEXT DEFAULT ''"],
  ['excavator_payments', 'source_id', 'INTEGER'],
  ['excavator_payments', 'buyer_id', 'INTEGER'],
  ['excavator_payments', 'payment_source', "TEXT DEFAULT ''"],
  ['excavator_buyer_payments', 'source_type', "TEXT DEFAULT ''"],
  ['excavator_buyer_payments', 'source_id', 'INTEGER']])
  await v27EnsureColumn(table, column, definition);
  try {void 0;








  } catch (e) {console.error('V28.6 sale payment linkage schema:', e.message);}

  // Backfill only the missing machine-side Sale payment representation for already-completed
  // deals whose buyer advance allocations already prove that the sale is fully paid.
  // No Finance entry and no new buyer cash receipt are created by this backfill.
  try {
    const completedSales = await db.prepare(`
    SELECT a.id asset_id,a.buyer_id,t.id sale_id,t.amount,t.transaction_date,t.created_by
    FROM excavator_assets a
    JOIN excavator_transactions t ON t.id=(
      SELECT t2.id FROM excavator_transactions t2
      WHERE t2.asset_id=a.id AND t2.type IN ('Local Sale','Export Sale') AND t2.status!='Cancelled'
      ORDER BY t2.id DESC LIMIT 1
    )
    WHERE a.lifecycle_stage='Sold / Completed'
  `).all();
    const allocationTotal = db.prepare(`
    SELECT COALESCE(SUM(al.amount_krw),0) v
    FROM excavator_buyer_payment_allocations al
    JOIN excavator_buyer_payments p ON p.id=al.payment_id
    WHERE al.asset_id=? AND COALESCE(al.status,'Active')='Active'
      AND COALESCE(p.status,'Active')!='Voided'
  `);
    const otherSalePaid = db.prepare(`
    SELECT COALESCE(SUM(amount),0) v FROM excavator_payments
    WHERE asset_id=? AND payment_type='Sale' AND status='Paid'
      AND NOT (source_type='Excavator Sale' AND source_id=?)
  `);
    const linkedSalePayment = db.prepare(`
    SELECT * FROM excavator_payments
    WHERE asset_id=? AND source_type='Excavator Sale' AND source_id=?
    ORDER BY id DESC LIMIT 1
  `);
    const updateSalePayment = db.prepare(`
    UPDATE excavator_payments
    SET payment_type='Sale',amount=?,paid_date=?,status='Paid',method='Buyer Advance',
        reference=CASE WHEN COALESCE(reference,'')='' THEN 'Buyer advance allocation' ELSE reference END,
        notes=CASE WHEN COALESCE(notes,'')='' THEN 'V28.6 synchronized from buyer advance allocation; original evidence remains on buyer advance payment(s).' ELSE notes END,
        buyer_id=?,payment_source='buyer_advance'
    WHERE id=?
  `);
    const insertSalePayment = db.prepare(`
    INSERT INTO excavator_payments(
      asset_id,payment_type,amount,due_date,paid_date,status,method,reference,notes,created_by,
      source_type,source_id,buyer_id,payment_source
    ) VALUES(?,'Sale',?,NULL,?,'Paid','Buyer Advance','Buyer advance allocation',
      'V28.6 synchronized from buyer advance allocation; original evidence remains on buyer advance payment(s).',
      ?,'Excavator Sale',?,?, 'buyer_advance')
  `);
    for (const row of completedSales) {
      const saleAmount = Number(row.amount || 0);if (!(saleAmount > 0)) continue;
      const allocated = Number((await allocationTotal.get(row.asset_id))?.v || 0);if (allocated + 0.005 < saleAmount) continue;
      const linked = await linkedSalePayment.get(row.asset_id, row.sale_id);
      const otherPaid = Number((await otherSalePaid.get(row.asset_id, row.sale_id))?.v || 0);
      const mirrorAmount = Math.max(0, saleAmount - otherPaid);
      if (mirrorAmount <= 0) continue;
      if (linked) await updateSalePayment.run(mirrorAmount, row.transaction_date || null, row.buyer_id || null, linked.id);else
      await insertSalePayment.run(row.asset_id, mirrorAmount, row.transaction_date || null, row.created_by || null, row.sale_id, row.buyer_id || null);
    }
  } catch (e) {console.error('V28.6 completed-sale payment backfill:', e.message);}

  // V28.5 LOCAL TEST LOGIN BOOTSTRAP
  // Enabled only when LOCAL_TEST_MODE=true. It never deletes or resets operational/test data.
  // It keeps one predictable CEO login for localhost builds so testers are not locked out
  // when carrying an existing development SQLite database forward from an earlier build.
  try {
    if (process.env.LOCAL_TEST_MODE === 'true') {
      const localEmail = String(process.env.LOCAL_TEST_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@blueocean.local').trim().toLowerCase();
      const localPassword = String(process.env.LOCAL_TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '');
      if (localEmail && localPassword.length >= 12) {
        const ceo = await db.prepare("SELECT id,email FROM users WHERE role='CEO / Owner' ORDER BY id LIMIT 1").get();
        if (ceo) {
          const emailOwner = await db.prepare("SELECT id FROM users WHERE lower(email)=lower(?) AND id<>? LIMIT 1").get(localEmail, ceo.id);
          if (!emailOwner) {
            await db.prepare("UPDATE users SET email=?,password_hash=?,active=1 WHERE id=?").run(localEmail, bcrypt.hashSync(localPassword, 12), ceo.id);
          } else {
            await db.prepare("UPDATE users SET password_hash=?,active=1 WHERE id=?").run(bcrypt.hashSync(localPassword, 12), ceo.id);
            console.warn(`V28.5 local test: ${localEmail} belongs to another user; CEO password was refreshed but email was kept as ${ceo.email}.`);
          }
        }
        console.log(`V28.5 local test CEO login: ${localEmail} / ${localPassword}`);
      }
    }
  } catch (e) {console.error('V28.5 local test CEO bootstrap:', e.message);}

  // V30.39 — targeted high-volume list indexes. These support the permanent
  // search/filter/sort-before-pagination rule and are safe on existing databases.
  try {void 0;








  } catch (e) {console.warn('V30.39 list index setup:', e.message);}


  // V30.39.1 — indexes aligned to the progressive Excavator summary/page query paths.
  // Additive only; each index supports an actual asset/profile correlation used by V30.39.1.
  try {void 0;










  } catch (e) {console.warn('V30.39.1 query-path index setup:', e.message);}
  try {[];} catch (_) {}

  return db;})();
