'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { fixture } = require('./fx_fixture.cjs');

(async () => {
  const f = await fixture();
  const checks = [];
  let browser;
  const pass = message => { checks.push(message); console.log('PASS ' + message); };
  try {
    const call = (method, route, body, unit = f.excavator) =>
      f.api(method, route, body, { 'x-business-unit-id': String(unit), 'x-ceo-confirmed': '1' });
    const ok = async (...args) => {
      const r = await call(...args);
      assert(r.ok, JSON.stringify(r.j));
      return r.j;
    };
    const id = await f.ins('excavator_assets', {
      business_unit_id: f.excavator, asset_no: 'QA-7011', machine_name: 'QA legacy machine',
      purchase_price: 50000000, lifecycle_stage: 'Purchased', status: 'Available',
    });
    const root = '/api/excavator/assets/' + id;
    const stage = root + '/lifecycle';
    assert.equal((await call('PUT', stage, { lifecycle_stage: 'Cancelled', status: 'Available' })).status, 400);
    assert.equal((await ok('PUT', stage, { lifecycle_stage: 'Cancelled' })).status, 'Cancelled');
    assert.equal((await call('PUT', stage, { lifecycle_stage: 'Purchased' })).status, 409);
    assert.equal((await call('PUT', root, { lifecycle_stage: 'Purchased', status: 'Available' })).status, 409);
    const reopened = await ok('PUT', stage, { lifecycle_stage: 'Purchased', reopen: true, note: 'QA reopen reason' });
    assert.equal(reopened.status, 'Available');
    assert.equal(reopened.lifecycle_stage, 'Purchased');
    const event = await f.db.prepare('SELECT note FROM excavator_lifecycle_events WHERE asset_id=? ORDER BY id DESC LIMIT 1').get(id);
    assert.equal(event.note, 'QA reopen reason');
    pass('Cancellation remains consistent and explicit reopening records a reason and restores Available');

    const evidence = new FormData();
    evidence.set('amount', '10000');
    evidence.set('description', 'QA original repair');
    evidence.set('repair_date', '2026-11-10');
    evidence.set('evidence', new Blob(['%PDF-1.4 synthetic QA'], { type: 'application/pdf' }), 'qa.pdf');
    const repair = await ok('POST', root + '/repairs', evidence);
    const [transaction] = (await ok('GET', root + '/transactions')).filter(r => r.type === 'Repair');
    const edit = root + '/transactions/' + transaction.id;
    const finance = () => f.db.prepare("SELECT id,source_type,source_id,amount,verification_status FROM finance_entries WHERE business_unit_id=? AND status!='Voided' ORDER BY id").all(f.excavator);
    const [original] = await finance();
    const ledger = (await f.db.prepare("SELECT id FROM accounting_accounts WHERE system_key='CASH_ON_HAND'").get()).id;
    const cash = await f.ins('accounting_payment_accounts', {
      business_unit_id: f.excavator, name: 'QA Excavator Cash', account_country: 'South Korea', currency: 'KRW',
      payment_type: 'Cash', financial_account_type: 'Cash', ledger_account_id: ledger, active: 1, status: 'Active',
    });
    const payment = { payment_amount: 12000, payment_method: 'Cash', payment_account_id: cash, notes: 'QA correction' };
    const mark = status => f.db.prepare('UPDATE finance_entries SET verification_status=? WHERE id=?').run(status, original.id);
    await mark('Verified / Correct');
    const read = (await ok('GET', root + '/transactions')).find(x => x.id === transaction.id);
    assert.equal(read.finance_entry_id, original.id);
    assert.equal(read.finance_verification_status, 'Verified / Correct');
    assert.equal((await call('PUT', edit, payment)).status, 409);
    assert.equal((await call('DELETE', edit, { reason: 'QA mirror void' })).status, 409);
    assert.equal((await finance()).length, 1);
    assert.equal(Number((await finance())[0].amount), 10000);
    pass('Verified canonical cost is shown as verified on its mirror and cannot be edited or voided through it');

    await mark('Pending Verification');
    await ok('PUT', edit, payment);
    const after = await finance();
    assert.equal(after.length, 1);
    assert.equal(after[0].id, original.id);
    assert.equal(after[0].source_type, 'Excavator Repair');
    assert.equal(Number(after[0].amount), 12000);
    assert.equal(Number((await f.db.prepare('SELECT amount FROM excavator_repairs WHERE id=?').get(repair.id)).amount), 12000);
    assert.equal(Number((await f.db.prepare('SELECT amount FROM excavator_transactions WHERE id=?').get(transaction.id)).amount), 12000);
    await f.restart();
    assert.deepEqual(await finance(), after);
    pass('A permitted repair edit reconciles both cost records and preserves the Finance identity after restart');

    const summary = await ok('GET', root + '/summary');
    const row = (await ok('GET', '/api/excavator/assets?paged=1')).rows.find(a => a.id === id);
    assert.equal(Number(summary.total_cost), 50012000);
    assert.equal(summary.total_cost, row.total_cost);
    assert.equal((await call('GET', root + '/summary', undefined, f.pink)).ok, false);
    pass('Machine Detail and Operations share the legacy purchase-price fallback and unit scope');

    const freightEvidence = new FormData();
    freightEvidence.set('amount', '5000');
    freightEvidence.set('evidence', new Blob(['%PDF-1.4 synthetic QA'], { type: 'application/pdf' }), 'freight.pdf');
    const freight = await ok('POST', root + '/logistics', freightEvidence);
    const partEvidence = new FormData();
    partEvidence.set('part_name', 'QA filter');
    partEvidence.set('cost', '2000');
    partEvidence.set('quantity', '2');
    partEvidence.set('evidence', new Blob(['%PDF-1.4 synthetic QA'], { type: 'application/pdf' }), 'part.pdf');
    const part = await ok('POST', root + '/parts', partEvidence);
    const partTransaction = await f.ins('excavator_transactions', {
      asset_id: id, type: 'Part Purchase', stage: 'Purchased', amount: 4000, currency: 'KRW',
      status: 'Completed', metadata: JSON.stringify({ part_id: part.id, include_in_machine_cost: true }),
    });
    const freightFinance = (await finance()).find(row => row.source_type === 'Excavator Logistics');
    const partFinance = (await finance()).find(row => row.source_type === 'Excavator Part');
    await f.db.prepare("UPDATE finance_entries SET accounting_status='Posted' WHERE id=?").run(freightFinance.id);
    assert.equal((await call('PUT', root + '/transactions/' + freight.transaction_id, payment)).status, 409);
    await ok('PUT', root + '/transactions/' + partTransaction, { ...payment, payment_amount: 6000 });
    assert.equal(Number((await f.db.prepare('SELECT cost FROM excavator_parts WHERE id=?').get(part.id)).cost), 3000);
    const afterParts = await finance();
    assert.equal(afterParts.length, 3);
    assert.equal(Number(afterParts.find(row => row.id === partFinance.id).amount), 6000);
    pass('Posted freight stays locked and a pending parts edit preserves its Finance identity and per-unit cost');

    await f.db.prepare("UPDATE pink_salt_suppliers SET supplier_categories_json=? WHERE id=?")
      .run('["Packaging Material Supplier","Import / Raw Salt Supplier"]', f.supplier);
    const pack = '/api/pink-salt/packaging-v36';
    const material = await ok('POST', pack + '/materials', { idempotency_key: 'qa-7011-material', sku: 'QA-7011-PACK', name: 'QA pouch', unit: 'pcs' }, f.pink);
    const purchase = await ok('POST', pack + '/purchases', {
      idempotency_key: 'qa-7011-purchase', supplier_id: f.supplier, purchase_date: '2026-11-10', currency: 'KRW',
      lines: [{ material_id: material.id, quantity: 10, unit_price: 100, purchase_unit: 'pcs', conversion_to_base: 1 }],
    }, f.pink);
    await f.db.prepare("UPDATE users SET preferred_language='en' WHERE id=1").run();
    browser = await chromium.launch({ executablePath: process.env.BOM_CHROMIUM || chromium.executablePath(), args: ['--no-sandbox','--single-process','--no-zygote','--disable-dev-shm-usage'] });
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await page.addInitScript(token => { if(location.protocol==='http:') { localStorage.setItem('bo_token',token);localStorage.setItem('bo_language','en'); } }, f.login.token);
    async function open(path, unit) {
      await page.goto(f.base + '/#' + path + '?unit=' + unit);
      await page.waitForFunction(() => window.BOMRouter?.diagnostics().phase === 'ready');
      await page.evaluate(() => window.closeMobileSidebar?.());
    }
    await open('excavator/machine/' + id, f.excavator);
    await page.getByText('Record the remaining purchase payment before selling.', { exact: false }).first().waitFor();
    assert.equal(await page.getByRole('button', { name: 'Sell Machine', exact: true }).count(), 0);
    pass('The unpaid Machine Detail offers Payments and omits all Sell Machine actions');

    await open('psPackaging/purchases', f.pink);
    const card = page.locator('[data-purchase-row="' + purchase.id + '"]');
    await card.waitFor();
    assert.equal(await card.evaluate(node => getComputedStyle(node).display), 'grid');
    for (const label of ['Total / Outstanding', 'Receiving', 'Payment']) {
      const cell = card.locator('[data-pack-label="' + label + '"]');
      assert(await cell.isVisible());
      const bounds = await cell.boundingBox();
      assert(bounds.x >= 0 && bounds.x + bounds.width <= 391);
    }
    await card.getByText('More actions', { exact: true }).click();
    await card.getByRole('button', { name: 'Payments', exact: true }).waitFor();
    await page.setViewportSize({ width: 1440, height: 900 });
    assert.equal(await card.evaluate(node => getComputedStyle(node).display), 'table-row');
    assert.equal(await card.getByRole('button', { name: 'Payments', exact: true }).count(), 1);
    pass('Populated Packaging Purchases renders readable phone cards and a desktop table with accessible secondary actions');

    await page.setViewportSize({ width: 390, height: 900 });
    await open('psImports/import/' + f.imports[0], f.pink);
    await page.locator('.pack-receiving-blocker').waitFor();
    assert.match(await page.locator('.pack-receiving-blocker').innerText(), /Supplier Payment.*Finance verification/);
    await page.getByRole('button', { name: '+ Supplier Payment', exact: true }).waitFor();
    const importMore = page.locator('[data-import-more]');
    await importMore.locator('summary').click();
    await importMore.getByRole('button', { name: '+ Add Document', exact: true }).waitFor();
    await importMore.getByRole('button', { name: 'View History', exact: true }).waitFor();
    assert.equal(await importMore.getByRole('button', { name: '+ Supplier Payment', exact: true }).count(), 0);
    pass('The unpaid import explains the receiving lock, keeps Supplier Payment visible and groups document and history actions');
    fs.writeFileSync('qa/evidence/reaudit7011.json', JSON.stringify({ status: 'PASS', checks }, null, 2));
  } finally {
    await browser?.close();
    await f.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
