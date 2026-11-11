'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { fixture } = require('./fx_fixture.cjs');

(async () => {
  const f = await fixture();
  let browser;
  try {
    const units = await f.db.prepare('SELECT id,name FROM business_units').all();
    const mimi=units.find(unit=>unit.name==='MIMI Resturant').id;
    const mango=units.find(unit=>unit.name==='Mango / Seasonal').id;
    for(const [unit,total,gross] of [[mimi,14000,4500],[mango,8000,2500]]) {
      await f.ins('sales',{business_unit_id:unit,invoice_no:'QA-DASH-'+unit,total,gross_profit:gross,
        status:'Completed',created_at:'2026-01-10 12:00:00'});
      await f.ins('sales',{business_unit_id:unit,invoice_no:'QA-VOID-'+unit,total:90000,gross_profit:60000,
        status:'Voided',created_at:'2026-01-10 12:00:00'});
    }
    const supplier = await f.ins('excavator_suppliers', { business_unit_id: f.excavator, name: 'QA Excavator Supplier' });
    await f.ins('excavator_buyers', { business_unit_id: f.excavator, name: 'QA Excavator Buyer' });
    const asset = await f.ins('excavator_assets', {
      business_unit_id: f.excavator, asset_no: 'QA-LAYOUT-001', machine_name: 'QA Machine', supplier_id: supplier,
      purchase_price: 10000, purchase_date: '2026-01-10'
    });
    await f.ins('excavator_transactions', { asset_id: asset, stage: 'Sale', type: 'Local Sale', amount: 17000,
      transaction_date: '2026-01-10', status: 'Completed' });
    await f.db.prepare("UPDATE pink_salt_orders SET order_date='2026-01-10' WHERE id=?").run(f.order);
    const financeRow = (business_unit_id, amount, cash_effect, transaction_date, status = 'Recorded') =>
      f.ins('finance_entries', { business_unit_id, amount, cash_effect, transaction_date, status,
        type: cash_effect < 0 ? 'Expense' : 'Revenue', category: 'QA Layout', source_type: 'Manual' });
    await financeRow(f.excavator, 19000, 1, '2026-01-10');
    await financeRow(f.excavator, 7000, -1, '2026-01-10');
    await financeRow(f.excavator, 1000, 0, '2026-01-10');
    await financeRow(f.excavator, 3000, 1, '2026-01-10', 'Voided');
    await financeRow(f.excavator, 2000, 1, '2026-01-09');
    await financeRow(f.pink, 9000, 1, '2026-01-10');

    const range = 'from=2026-01-10&to=2026-01-10';
    const activity = async (unit, query = range) =>
      f.api('GET', '/api/dashboard/activity?' + query, undefined, { 'x-business-unit-id': String(unit) });
    const result = await activity(f.excavator);
    assert.equal(result.status, 200, JSON.stringify(result.j));
    assert.deepEqual(result.j.rows.map(x => [x.day, Number(x.cash_in), Number(x.cash_out)]), [['2026-01-10', 19000, 7000]]);
    assert.deepEqual(result.j.operation, { key: 'machines', count: 1 });
    assert.equal(Number(result.j.details.sales[0].sales), 17000);
    assert.equal(Number(result.j.details.sales[0].profit), 7000);
    const pinkActivity=await activity(f.pink);
    assert.equal(Number(pinkActivity.j.rows[0].cash_in), 9000);
    assert.equal(Number(pinkActivity.j.details.sales[0].orders),1);
    for (const query of ['from=2026-02-30&to=2026-03-01', 'from=2026-01-02&to=2026-01-01', 'from=2025-01-01&to=2026-01-02']) {
      assert.equal((await activity(f.excavator, query)).status, 400);
    }
    assert.equal(Number((await activity(mimi)).j.details.sales[0].sales),14000);
    assert.equal(Number((await activity(mango)).j.details.sales[0].sales),8000);
    const all=await f.api('GET','/api/dashboard/activity?'+range,undefined,{'x-business-unit-id':''});
    assert.equal(all.status,200,JSON.stringify(all.j));
    assert.equal(Number(all.j.rows[0].cash_in),28000);
    assert.equal(all.j.details.units.length,2);
    console.log('PASS Dashboard range, KRW amounts, BU scope, non-cash, voids and invalid dates');

    browser = await chromium.launch({ executablePath: process.env.BOM_CHROMIUM || chromium.executablePath(),
      args: ['--no-sandbox', '--single-process', '--no-zygote', '--disable-dev-shm-usage'] });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.addInitScript(token => localStorage.setItem('bo_token', token), f.login.token);
    const open = (view, unit, suffix = '') => page.goto(f.base + '/#' + view + '?unit=' + unit + suffix);
    const viewport = async (width) => {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, 'page overflow at ' + width);
    };
    for (const unit of [...units.map(x => x.id), 'all']) {
      await open('dashboard', unit, '&' + range);
      await page.locator('[data-activity-results] .bom-dashboard-kpis').waitFor();
      await page.locator('.bom-dashboard-hero .bom-dashboard-range').waitFor();
      await page.locator('.bom-current-position').waitFor();
      assert.equal(await page.locator('.bom-dashboard-charts > section').count(),String(unit)===String(f.pink)?4:3);
      assert.equal(await page.locator('[data-bom-currency-note]').count(),0);
      if(String(unit)===String(mimi)||String(unit)===String(mango)){
        assert.match(await page.locator('.bom-period-kpis').innerText(),String(unit)===String(mimi)?/14,000/:/8,000/);
        await page.locator('[data-chart=cash] .empty').waitFor();
      }
      if(unit==='all'){
        assert.match(await page.locator('.bom-period-kpis').innerText(),/28,000/);
        await page.locator('[data-activity-results] a[href*="#dashboard?unit="]').filter({hasText:/Excavator|굴착기/}).waitFor();
      }
      await viewport(390);
      await viewport(1440);
      assert.equal(await page.locator('.bom-dashboard-dates [name=from]').inputValue(), '2026-01-10');
      if (String(unit) === String(f.excavator)) {
        await page.locator('[data-chart=sales] svg').waitFor();
        assert.match(await page.locator('.bom-period-kpis').innerText(), /17,000/);
        assert.match(await page.locator('[data-chart=cash] svg').textContent(), /19,000/);
        await page.locator('.bom-dashboard-toolbar > .bom-dashboard-presets [data-period=week]').click();
        await page.waitForFunction(() => !location.hash.includes('2026-01-10') && document.querySelector('.bom-dashboard-kpis'));
        await page.locator('.bom-dashboard-range summary').click();
        const start=page.locator('.bom-dashboard-dates [name=from]');
        await start.fill('2026-01-09');
        await start.press('Alt+ArrowDown');
        await page.locator('.bom-calendar [data-date="2026-01-09"]').press('ArrowRight');
        await page.locator('.bom-calendar [data-date="2026-01-10"]').press('Enter');
        assert.equal(await start.inputValue(),'2026-01-10');
        await page.locator('[name=to]').fill('2026-01-10');
        await page.locator('.bom-dashboard-dates button[type=submit]').click();
        await page.locator('[data-chart=sales] svg').waitFor();
        await page.reload();
        await page.locator('[data-chart=sales] svg').waitFor();
        assert.equal(await page.locator('[data-warehouses-nav]').count(), 0);
        await page.locator('.bom-current-position a[href*="Under+Repair"]').click();
        await page.locator('.bom-machine-controls summary').click();
        await page.locator('#excavatorMachineFilter').waitFor();
        const sidebar=page.locator('.sidebar-toggle');
        await sidebar.click();
        assert.equal(await sidebar.getAttribute('aria-expanded'),'false');
        assert.equal(await page.locator('.nav [data-nav-key=excavator]').getAttribute('aria-current'),'page');
        await sidebar.click();
        assert.equal(await sidebar.getAttribute('aria-expanded'),'true');
        assert.equal(await page.locator('#excavatorMachineFilter').inputValue(),'Under Repair');
      }
      if (String(unit) === String(f.pink)) {
        await page.locator('[data-warehouses-nav]').waitFor({ state: 'attached' });
        await page.locator('.bom-current-position').waitFor();
        await page.locator('[data-chart=production] .empty').waitFor();
        await page.locator('[data-chart=cash] svg').waitFor();
        await viewport(390);
        await page.locator('.bom-dashboard-range summary').click();
        await page.locator('.bom-dashboard-range [data-period=month]').waitFor();
        await viewport(390);
        await viewport(1440);
        await page.locator('.bom-current-position a[href^="#psFinished"]').click();
        await page.waitForFunction(() => location.hash.startsWith('#psFinished?')&&window.BOMRouter.diagnostics().phase==='ready');
      }
    }
    console.log('PASS All workspace dashboards, presets, custom range, refresh and Excavator-only navigation');

    for (const [view, selector, value] of [
      ['excavatorSuppliers', '#excavatorSupplierSearch', 'QA Excavator Supplier'],
      ['excavatorBuyers', '#buyerSearch', 'QA Excavator Buyer'],
      ['excavator', '#excavatorMachineSearch', 'QA Machine'],
      ['finance', '#financeSearch', 'QA Layout'],
      ['accounting/control', '#v360Search', 'QA Layout']
    ]) {
      await open(view, f.excavator);
      await page.waitForFunction(() => window.BOMRouter?.diagnostics().phase === 'ready');
      const input = page.locator('.bom-page-header ' + selector);
      await input.fill(value);
      await page.waitForFunction(q => new URLSearchParams(location.hash.split('?')[1]).get('search') === q, value, { timeout: 6000 })
        .catch(async error => { throw Error(view + ' search failed on ' + page.url() + ': ' + errors.join(', '), { cause: error }); });
      await page.reload();
      await input.waitFor();
      assert.equal(await input.inputValue(), value, view + ' search after reload');
      if (view === 'excavator') await page.locator('.bom-compact-machine').waitFor();
      if(view==='finance'){
        const dates=await page.locator('.finance-filterbar input[type=date]').evaluateAll(fields=>fields.map(x=>Math.round(x.getBoundingClientRect().top)));
        assert.equal(dates.length,2);
        assert.equal(dates[0],dates[1]);
        const input=page.locator('.finance-filterbar input[type=date]').first();
        await input.fill('2026-01-10');
        const bounds=await input.boundingBox();
        await input.click({position:{x:bounds.width-14,y:bounds.height/2}});
        await page.locator('.bom-calendar [data-date="2026-01-11"]').click();
        assert.equal(await input.inputValue(),'2026-01-11');
      }
      if (view === 'accounting/control') {
        const toolbar=await page.locator('.bom-posting-toolbar').evaluate(node=>{
          const tabs=node.querySelector('.v318-control-tabs').getBoundingClientRect();
          const actions=node.querySelector('.bom-posting-actions').getBoundingClientRect();
          return {same:Math.abs(tabs.top-actions.top)<4, ordered:tabs.left<actions.left};
        });
        assert.deepEqual(toolbar,{same:true,ordered:true});
        const rows = await page.locator('.bom-posting-kpis > *').evaluateAll(cards => cards.map(card => Math.round(card.getBoundingClientRect().top)));
        assert.equal(rows.length, 5);
        assert.equal(new Set(rows).size, 1);
      }
      await viewport(820);
      await viewport(390);
      await viewport(1440);
      console.log('PASS ' + view + ' header, search and responsive layout');
    }
    await open('accounting', f.excavator);
    await page.locator('#accounting-group-0').waitFor();
    await page.locator('#accounting-group-0').click();
    await page.locator('.v356-grid[data-bom-summary]').waitFor();
    assert.equal(await page.locator('#v357AccountingSidebar [data-workspace-panel="0"]').count(), 0);
    assert.equal(await page.locator('.v357-workspace-header').isVisible(), false);
    await page.locator('#accounting-group-1').click();
    await page.locator('#accounting-panel-1').waitFor();
    await page.locator('#accounting-group-0').click();
    await page.locator('#accounting-panel-1').waitFor({state:'hidden'});
    await viewport(390);
    await open('dashboard', f.excavator, '&'+range);
    await page.locator('[data-chart=sales] svg').waitFor();
    await page.evaluate(() => setLanguage('ko'));
    await page.getByText('현재 현황', {exact: true}).waitFor();
    await page.locator('[data-chart=sales] svg').waitFor();
    await viewport(390);
    assert.deepEqual(errors, []);
    await page.locator('.bom-dashboard-range summary').click();
    const koreanDate=page.locator('.bom-dashboard-dates [name=from]');
    await koreanDate.press('Alt+ArrowDown');
    await page.getByRole('button',{name:'다음 달'}).waitFor();
    await page.keyboard.press('Escape');
    await page.locator('.bom-calendar').waitFor({state:'detached'});
    console.log('PASS Shared headers, persistent search, responsive layouts, posting KPIs, Accounting navigation and Korean dashboard');
  } finally {
    await browser?.close();
    await f.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
