'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { fixture } = require('./fx_fixture.cjs');
const { chromium } = require('playwright');

async function run() {
  const f = await fixture();
  let browser;
  const checks = [];
  const pass = text => { checks.push(text); console.log('PASS ' + text); };
  const date = new Date().toISOString().slice(0, 10);
  const base = '/api/excavator/assets';
  const api = (method, url, data, unit = f.excavator) => f.api(method, url, data, {
    'x-business-unit-id': String(unit), 'x-ceo-confirmed': '1',
  });
  const ok = async (...args) => {
    const result = await api(...args);
    assert(result.ok, JSON.stringify(result));
    return result.j;
  };
  try {
    const supplier = await f.ins('excavator_suppliers', { business_unit_id: f.excavator, name: 'QA709 Supplier' });
    const ledger = await f.db.prepare("SELECT id FROM accounting_accounts WHERE system_key='CASH_ON_HAND'").get();
    const bank = await f.ins('accounting_payment_accounts', {
      business_unit_id: f.excavator, name: 'QA709 Bank', currency: 'KRW', account_country: 'South Korea',
      payment_type: 'Bank', financial_account_type: 'Bank', ledger_account_id: ledger.id, active: 1, status: 'Active',
    });
    const receiver = await f.ins('counterparty_payment_accounts', {
      business_unit_id: f.excavator, entity_type: 'excavator_supplier', entity_id: supplier,
      label: 'QA709 Receiver', currency: 'KRW', method_type: 'Bank', active: 1,
    });
    async function buy(number, token = 2000, extra = {}) {
      const data = new FormData();
      const fields = {
        asset_no: 'QA709-' + number, machine_name: 'QA709 Excavator ' + number, type: 'Excavator',
        purchase_date: date, purchase_price: 5000, supplier_id: supplier, purchase_token: token,
        token_payment_method: 'Bank', token_payment_reference: 'QA709-TOKEN-' + number,
        token_payment_account_id: bank, token_receiver_account_id: receiver, ...extra,
      };
      for (const [name, value] of Object.entries(fields)) data.set(name, String(value));
      if (token) data.set('payment_evidence', new Blob(['%PDF-1.4 QA synthetic evidence'], { type: 'application/pdf' }), 'qa.pdf');
      return (await ok('POST', base, data)).id;
    }
    const preview = id => ok('GET', base + '/' + id + '/deletion-preview');
    const remove = (id, fingerprint) => ok('DELETE', base + '/' + id, { fingerprint });
    const finance = id => f.db.prepare('SELECT * FROM finance_entries WHERE id=?').get(id);
    const asset = id => f.db.prepare('SELECT * FROM excavator_assets WHERE id=?').get(id);
    const verify = id => ok('PUT', '/api/finance/' + id + '/verify', {
      verification_status: 'Verified / Correct', verification_note: 'QA709 evidence verified',
    });
    async function proposal(id) {
      for (let i = 0; i < 100; i++) {
        const row = await f.db.prepare("SELECT * FROM accounting_journal_entries WHERE finance_entry_id=? AND status='Pending Review'").get(id);
        if (row) return row;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      throw new Error('No pending Accounting proposal for token ' + id);
    }

    const first = await buy('unverified');
    assert.equal((await asset(first)).make, '');
    assert.equal((await asset(first)).model, '');
    const oneField = await buy('one-field', 0, { make: 'Test' });
    assert.equal((await asset(oneField)).model, '');
    pass('Buy Machine accepts both omitted fields and one omitted field');

    const unverified = await preview(first);
    assert.equal(unverified.finance.length, 1);
    assert.equal(unverified.finance[0].action, 'void-unverified');
    assert.equal((await api('DELETE', base + '/' + first, {})).status, 409);
    assert.equal((await api('GET', base + '/' + first + '/deletion-preview', undefined, f.pink)).ok, false);
    const deleted = await remove(first, unverified.fingerprint);
    assert.equal(deleted.reversal_pending, false);
    assert.equal(await asset(first), undefined);
    assert.equal((await finance(unverified.finance[0].id)).status, 'Voided');
    assert.equal((await api('DELETE', base + '/' + first, { fingerprint: unverified.fingerprint })).status, 404);
    pass('Unverified token voids with its purchase, preview is scoped, and retry does not duplicate effects');

    const pending = await buy('pending');
    const beforeVerify = await preview(pending);
    const pendingFinance = beforeVerify.finance[0].id;
    await verify(pendingFinance);
    const unpostedJournal = await proposal(pendingFinance);
    assert.equal((await api('DELETE', base + '/' + pending, { fingerprint: beforeVerify.fingerprint })).status, 409);
    assert(await asset(pending));
    const afterVerify = await preview(pending);
    assert.equal(afterVerify.finance[0].action, 'cancel-verified');
    assert.equal((await remove(pending, afterVerify.fingerprint)).reversal_pending, false);
    assert.equal((await finance(pendingFinance)).status, 'Voided');
    assert.equal((await f.db.prepare('SELECT status FROM accounting_journal_entries WHERE id=?').get(unpostedJournal.id)).status, 'Cancelled');
    pass('Verified unposted token cancels its Accounting proposal and a stale preview cannot delete');

    const posted = await buy('posted');
    const postedFinance = (await preview(posted)).finance[0].id;
    await verify(postedFinance);
    const original = await proposal(postedFinance);
    const posting = id => ok('POST', '/api/accounting/posting-control/' + id + '/post', { note: 'QA709 controlled post' });
    await posting(original.id);
    const review = await preview(posted);
    assert.equal(review.finance[0].action, 'reverse-posted');
    assert.equal(review.finance[0].journal.id, original.id);
    assert.equal((await remove(posted, review.fingerprint)).reversal_pending, true);
    const reversal = await f.db.prepare('SELECT * FROM accounting_journal_entries WHERE reversal_of_id=?').get(original.id);
    assert.equal(reversal.status, 'Pending Review');
    assert.equal((await finance(postedFinance)).status, 'Voided');
    const totals = id => f.db.prepare('SELECT SUM(debit_krw) debit,SUM(credit_krw) credit FROM accounting_journal_lines WHERE journal_entry_id=?').get(id);
    const oldTotals = await totals(original.id);
    const newTotals = await totals(reversal.id);
    assert.equal(newTotals.debit, oldTotals.credit);
    assert.equal(newTotals.credit, oldTotals.debit);
    await posting(reversal.id);
    assert.equal((await f.db.prepare('SELECT status FROM accounting_journal_entries WHERE id=?').get(reversal.id)).status, 'Posted');
    assert.equal((await f.db.prepare('SELECT status FROM accounting_journal_entries WHERE id=?').get(original.id)).status, 'Reversed');
    pass('Posted token creates one balanced controlled reversal and Posting Control finalizes it');

    const protectedAsset = await buy('protected');
    await f.ins('excavator_repairs', { asset_id: protectedAsset, amount: 300, description: 'QA protected repair' });
    assert.equal((await api('GET', base + '/' + protectedAsset + '/deletion-preview')).status, 409);
    assert(await asset(protectedAsset));
    pass('Unrelated linked machine activity blocks deletion');

    const saleAsset = await buy('sale', 5000);
    await f.db.prepare("UPDATE users SET preferred_language='en' WHERE id=1").run();
    browser = await chromium.launch({
      executablePath: process.env.BOM_CHROMIUM || chromium.executablePath(),
      args: ['--no-sandbox', '--single-process', '--no-zygote', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(token => {
      localStorage.setItem('bo_token', token);
      localStorage.setItem('bo_language', 'en');
    }, f.login.token);
    await page.goto(f.base + '/#excavatorSuppliers?unit=' + f.excavator);
    const actions = page.locator('td.bom-record-action-column').filter({ has: page.getByRole('button', { name: 'Delete', exact: true }) }).first();
    await actions.waitFor();
    assert.equal(await actions.locator('button.bom-record-action').count(), 3);
    const width = await actions.evaluate(cell => ({
      cell: cell.getBoundingClientRect().width,
      controls: [...cell.querySelectorAll('button')].reduce((sum, el) => sum + el.getBoundingClientRect().width + 4, 0),
    }));
    assert(width.cell <= width.controls + 32, JSON.stringify(width));
    const del = actions.getByRole('button', { name: 'Delete', exact: true });
    await del.hover();
    assert.equal(await page.locator('.bom-record-tooltip:visible').innerText(), 'Delete');
    await del.click();
    await page.locator('#confirmRoot').getByText('Delete Supplier', { exact: true }).first().waitFor();
    await page.locator('#confirmCancel').click();
    pass('Supplier Open, Edit and Delete are compact icons and Delete still opens confirmation');

    // Open the purchase workflow from Suppliers, then save without Make or Model.
    await page.evaluate(() => { void excavatorNewMachine(); });
    const form = page.locator('form[onsubmit*="saveSimpleExcavatorMachine"]');
    await form.waitFor();
    await page.evaluate(id => chooseBuySupplier(id), supplier);
    assert.equal(await form.locator('[name=make]').getAttribute('required'), null);
    assert.equal(await form.locator('[name=model]').getAttribute('required'), null);
    await form.locator('[name=machine_name]').fill('QA709 Browser Purchase');
    await form.locator('[name=purchase_date]').fill(date);
    await form.locator('[name=purchase_price]').fill('5000');
    assert(await form.evaluate(el => el.checkValidity()));
    await form.getByRole('button', { name: 'Save Machine', exact: true }).click();
    const reviewButtons = '#confirmRoot :is(#confirmOk, #bom314FormConfirm, #bom314Confirm)';
    for (let i = 0; i < 2; i++) {
      await page.waitForFunction(selector => document.querySelector(selector) || BOMRouter.parse().view === 'excavator', reviewButtons);
      const confirm = page.locator(reviewButtons);
      if (!await confirm.isVisible()) break;
      await confirm.click();
    }
    await page.waitForFunction(() => BOMRouter.parse().view === 'excavator' && !BOMRouter.parse().kind && BOMRouter.diagnostics().phase === 'ready' && !document.querySelector('form[onsubmit*=saveSimpleExcavatorMachine]'));
    assert(await f.db.prepare("SELECT id FROM excavator_assets WHERE machine_name='QA709 Browser Purchase'").get());
    pass('Successful browser purchase from Suppliers opens the Excavator Machine List');

    const previewAsset = await buy('browser-preview');
    const previewFinance = (await preview(previewAsset)).finance[0].id;
    await verify(previewFinance);
    await proposal(previewFinance);
    const previewResponse = page.waitForResponse(response => response.url().endsWith('/' + previewAsset + '/deletion-preview'));
    await page.evaluate(id => { void deleteExcavatorAsset(id); }, previewAsset);
    const received = await previewResponse;
    assert(received.ok(), await received.text());
    const deletion = page.locator('#confirmRoot');
    await deletion.getByText('Void token and cancel any unposted Accounting proposal', { exact: true }).waitFor();
    assert.match(await deletion.innerText(), /QA709-browser-preview/);
    assert.match(await deletion.innerText(), /KRW 2,000/);
    await page.locator('#confirmCancel').click();
    assert(await asset(previewAsset));
    pass('Machine deletion confirmation names the deal and shows the token amount and action');

    await page.evaluate(id => { void excavatorSell(id); }, saleAsset);
    const saleType = page.locator('#excavatorSaleForm [name=sale_type]');
    await saleType.waitFor();
    const country = page.locator('#excavatorSaleForm [name=destination_country]');
    for (const type of ['Export Sale', 'Local Sale', 'Export Sale', 'Local Sale']) {
      await saleType.selectOption(type);
      assert.equal(await country.isEnabled(), type === 'Export Sale');
      assert.equal(await country.isVisible(), type === 'Export Sale');
      const mutations = await page.evaluate(() => new Promise(resolve => {
        let count = 0;
        const observer = new MutationObserver(rows => { count += rows.length; });
        observer.observe(document.getElementById('excavatorSaleForm'), { subtree: true, attributes: true, childList: true });
        setTimeout(() => { observer.disconnect(); resolve(count); }, 400);
      }));
      assert(mutations < 300, 'Unbounded sale form mutations: ' + mutations);
    }
    assert.deepEqual(errors, []);
    pass('Repeated Sale Type changes keep the form responsive and enable destination fields only for export');

    fs.writeFileSync('qa/evidence/nov9-excavator.json', JSON.stringify({
      version: require('../../package.json').version, status: 'PASS', checks,
      tested_at: new Date().toISOString(),
    }, null, 2) + '\n');
  } finally {
    await browser?.close();
    await f.close();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
