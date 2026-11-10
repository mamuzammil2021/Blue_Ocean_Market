'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { fixture } = require('./fx_fixture.cjs');

(async () => {
  const f = await fixture();
  let browser;
  const checks = [];
  const pass = message => { checks.push(message); console.log('PASS ' + message); };
  try {
    const headers = unit => ({ 'x-business-unit-id': String(unit), 'x-ceo-confirmed': '1' });
    const request = (method, url, data, unit = f.excavator) => f.api(method, url, data, headers(unit));
    const ok = async (...args) => {
      const response = await request(...args);
      assert(response.ok, JSON.stringify(response));
      return response.j;
    };
    const evidence = body => {
      const form = new FormData();
      for (const [key, value] of Object.entries(body)) form.set(key, String(value));
      form.set('evidence', new Blob(['%PDF-1.4 synthetic QA evidence'], { type: 'application/pdf' }), 'qa.pdf');
      return form;
    };
    const assetData = {
      business_unit_id: f.excavator, purchase_price: 5000000, lifecycle_stage: 'Purchased', status: 'Available',
    };
    const asset = await f.ins('excavator_assets', { ...assetData, asset_no: 'AUDIT-7010', machine_name: 'QA repaired machine' });
    await f.ins('excavator_assets', { ...assetData, asset_no: 'AUDIT-ELIGIBLE', machine_name: 'QA unsold purchase' });
    const base = '/api/excavator/assets/' + asset;
    const assetState = () => f.db.prepare('SELECT lifecycle_stage,status,buyer_id,selling_price FROM excavator_assets WHERE id=?').get(asset);
    const initial = await assetState();
    for (const route of [base, base + '/lifecycle']) {
      for (const [body, status] of [[{ lifecycle_stage: 'Sold / Completed', status: 'Sold' }, 409],
        [{ lifecycle_stage: 'Bad stage' }, 400], [{ status: 'Bad status' }, 400]]) {
        assert.equal((await request('PUT', route, body)).status, status);
      }
    }
    assert.deepEqual(await assetState(), initial);
    assert.equal((await ok('PUT', base + '/lifecycle', { lifecycle_stage: 'Transport to Yard' })).lifecycle_stage, 'Transport Pending');
    await ok('PUT', base + '/lifecycle', { lifecycle_stage: 'Under Repair', note: 'QA stage history' });
    const history = await f.db.prepare('SELECT to_stage,note FROM excavator_lifecycle_events WHERE asset_id=? ORDER BY id').all(asset);
    assert.equal(history.at(-1).note, 'QA stage history');
    assert.equal(history.at(-1).to_stage, 'Under Repair');
    pass('Both machine update endpoints reject invalid and direct sale stages while recording legitimate operational transitions');

    const repair = await ok('POST', base + '/repairs', evidence({ amount: 10000, description: 'QA repair' }));
    const freight = await ok('POST', base + '/logistics', evidence({ amount: 15000, provider: 'QA freight', destination: 'Karachi' }));
    const active = () => f.db.prepare(`SELECT id,source_type,source_id,amount,status FROM finance_entries
      WHERE business_unit_id=? AND status!='Voided' ORDER BY id`).all(f.excavator);
    const before = await active();
    assert.deepEqual(before.map(row => Number(row.amount)), [10000, 15000]);
    assert.deepEqual(before.map(row => Number(row.source_id)), [Number(repair.id), Number(freight.id)]);
    for (let i = 0; i < 2; i++) {
      await f.restart();
      assert.deepEqual(await active(), before);
    }
    pass('Repair and freight preserve their original Finance IDs and amounts across two restarts');

    const repairTx = await f.db.prepare("SELECT id FROM excavator_transactions WHERE asset_id=? AND type='Repair'").get(asset);
    const duplicate = await f.ins('finance_entries', {
      business_unit_id: f.excavator, type: 'Expense', category: 'Repair', amount: 10000, status: 'Recorded',
      source_type: 'Excavator Cost Transaction', source_id: repairTx.id, created_by: 1,
    });
    const expectedExisting = await active();
    await f.restart();
    assert.deepEqual(await active(), expectedExisting);
    const diagnostic = (await ok('GET', '/api/system/integrity')).checks.find(row => row.code === 'excavator_duplicate_cost_mirrors');
    assert.equal(diagnostic.count, 1);
    assert((await active()).some(row => Number(row.id) === duplicate));
    pass('Existing duplicate Finance history is preserved and identified by the read-only integrity check');

    const rows = (await ok('GET', '/api/excavator/assets?paged=1')).rows;
    assert(rows.find(row => row.id === asset).purchase_deletion_block);
    assert.equal(rows.find(row => row.asset_no === 'AUDIT-ELIGIBLE').purchase_deletion_block, '');
    assert.equal((await request('GET', base + '/deletion-preview')).status, 409);
    pass('Machine list and deletion preview agree on protected machines');

    const shipment = await f.db.prepare('SELECT import_no FROM pink_salt_imports WHERE id=?').get(f.imports[0]);
    const search = '/api/v350/pink-salt/imports/page?search=';
    for (const term of [shipment.import_no.toLowerCase(), shipment.import_no.toUpperCase()]) {
      const result = await ok('GET', search + encodeURIComponent(term), undefined, f.pink);
      assert.equal(result.pagination.total, 1);
      assert.equal(result.rows[0].id, f.imports[0]);
    }
    pass('Pink Salt import search matches shipment references in either case');

    const material = await ok('POST', '/api/pink-salt/packaging-v36/materials',
      { idempotency_key: 'qa-7010-pack', sku: 'QA-7010-PACK', name: 'QA audit pouch', name_ko: '시험 파우치', unit: 'pcs' }, f.pink);
    await f.ins('pink_salt_bom_lines', { product_id: f.product, packaging_item_id: material.id, quantity_per_unit: 2 });

    await f.db.prepare("UPDATE users SET preferred_language='en' WHERE id=1").run();
    browser = await chromium.launch({
      executablePath: process.env.BOM_CHROMIUM || chromium.executablePath(),
      args: ['--no-sandbox', '--single-process', '--no-zygote', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(token => {
      if (location.protocol !== 'http:') return;
      localStorage.setItem('bo_token', token);
      localStorage.setItem('bo_language', 'en');
    }, f.login.token);
    async function visit(route, unit) {
      await page.goto(f.base + '/#' + route + '?unit=' + unit);
      await page.waitForFunction(() => window.BOMRouter?.diagnostics().phase === 'ready');
      await page.evaluate(() => window.closeMobileSidebar?.());
    }
    await visit('excavator', f.excavator);
    await page.locator('.titlebar').getByRole('button', { name: '+ Buy Machine', exact: true }).waitFor();
    const summary = page.locator('#v3391MachineStats .bom-record-summary');
    await summary.waitFor();
    assert.equal(await summary.evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length), 2);
    await page.setViewportSize({ width: 1440, height: 900 });
    const protectedCard = page.locator('.machine-card').filter({ hasText: 'AUDIT-7010' });
    const protectedDelete = protectedCard.getByRole('button', { name: 'Delete', exact: true });
    await protectedDelete.waitFor();
    assert.equal(await protectedDelete.getAttribute('aria-disabled'), 'true');
    assert.equal(await protectedDelete.getAttribute('onclick'), null);
    assert(await protectedCard.locator('.bom-machine-action-note').isVisible());
    assert(await protectedCard.locator('.bom-record-action').count() >= 2);
    pass('Operations exposes Buy Machine in the heading, two mobile KPI columns and an explained disabled Delete');

    await visit('psSuppliers', f.pink);
    for (const id of ['ps315SupplierType', 'ps315SupplierPosition', 'ps315SupplierSort']) {
      assert(await page.locator('#' + id).getAttribute('aria-label'));
    }
    await page.locator('td .bom-record-action').filter({ hasText: 'Open Supplier' }).first().waitFor();
    await visit('psImports/import/' + f.imports[0], f.pink);
    const breakdown = page.locator('details[data-import-part=breakdown]');
    await breakdown.getByText('Payment breakdown', { exact: true }).waitFor();
    assert.equal(await breakdown.getAttribute('open'), null);
    await breakdown.locator('summary').click();
    assert.equal(await breakdown.evaluate(node => node.open), true);
    await visit('psSales/order/' + f.order, f.pink);
    await page.locator('[data-sales-channel-detail]').getByText('Fulfillment', { exact: true }).waitFor();
    assert.equal(await page.locator('select[onchange*="psFulfillmentV366"]').getAttribute('aria-label'), 'Fulfillment Status');
    await visit('psProduction/new', f.pink);
    await page.locator('#psProdOutputs select').first().selectOption(String(f.product));
    await page.locator('#psProdOutputs input[type=number]').first().fill('3');
    const availability = page.locator('#psProdRequirements');
    await availability.getByText('Packaging availability', { exact: true }).waitFor();
    assert.match(await availability.innerText(), /QA audit pouch[\s\S]*6[\s\S]*Insufficient stock/);
    pass('Repacking displays required packaging and shortages before confirmation');

    await page.goto('about:blank');
    await visit('psPackaging/materials', f.pink);
    await page.locator('[data-material-row]').first().waitFor();
    await page.evaluate(() => setLanguage('ko'));
    await page.locator('[data-material-row] .bom-record-action[data-bom-action=edit]').waitFor();
    pass('Packaging material Edit remains a compact icon in Korean');
    assert.deepEqual(errors, []);
    pass('Supplier filters and order fulfillment are labeled and the import payment breakdown is expandable');
    fs.writeFileSync('qa/evidence/audit7010.json', JSON.stringify({ status: 'PASS', checks }, null, 2));
  } finally {
    await browser?.close();
    await f.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
