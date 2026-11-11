/* Shared dashboard period controls and recorded cash activity. */
(() => {
  'use strict';

  const dayMs = 86400000;
  const localized = (en, ko) => currentLanguage === 'ko' ? ko : en;
  const dateText = date => date.toISOString().slice(0, 10);
  const amount = value => new Intl.NumberFormat(currentLanguage === 'ko' ? 'ko-KR' : 'en-KR', {
    style: 'currency', currency: 'KRW', maximumFractionDigits: 2
  }).format(value);
  const metrics = {
    machines: ['Machines purchased', '구매 장비'],
    orders: ['Completed orders', '완료 주문'],
    pos: ['Completed POS sales', '완료 POS 매출 건수'],
    sales: ['Completed sales', '완료 매출 건수']
  };
  const series = [
    ['cash_in', 'Cash in', '자금 유입'],
    ['cash_out', 'Cash out', '자금 유출'],
    ['net', 'Net cash movement', '순자금 이동']
  ];

  function dateRange(preset) {
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
    const end = new Date(today+'T00:00:00Z');
    const start = new Date(end);
    if (preset === 'week') start.setUTCDate(end.getUTCDate() - 6);
    if (preset === 'month') start.setUTCDate(1);
    if (preset === 'year') start.setUTCMonth(0, 1);
    return { from: dateText(start), to: today };
  }

  function card(label, value, tone='') {
    return `<div class="card stat ${tone}"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div></div>`;
  }

  function chart(rows, from, to, columns=series, heading=['Recorded cash movement','기록된 자금 이동'], currency=true, style='line') {
    const format = currency ? amount : value=>Number(value).toLocaleString(currentLanguage==='ko'?'ko-KR':'en-KR');
    const start = Date.parse(from), end = Date.parse(to);
    const days = (end-start)/dayMs+1;
    const interval = days > 60 ? 7 : 1;
    const points = Array.from({ length: Math.ceil(days / interval) }, (_,i) => ({
      day: dateText(new Date(start+i*interval*dayMs)), ...Object.fromEntries(columns.map(([key])=>[key,0]))
    }));
    for (const row of rows) {
      const point = points[Math.floor((Date.parse(row.day)-start)/dayMs/interval)];
      if (!point) continue;
      for (const [key] of columns) point[key]+=Number(key==='net'?Number(row.cash_in)-Number(row.cash_out):row[key]||0);
    }
    const values = points.flatMap(row => columns.map(([key]) => row[key]));
    const lower = Math.min(0,...values), upper = Math.max(0,...values);
    const tick = new Intl.NumberFormat(currentLanguage==='ko'?'ko-KR':'en-KR',{notation:'compact',maximumFractionDigits:1});
    const ticks = [...new Set([upper,0,lower])];
    const x = i => style==='bars' ? (i+.5)*720/points.length : points.length===1 ? 360 : 16+i*688/(points.length-1);
    const y = value => 142 - (value-lower)*126/((upper-lower)||1);
    const lines = columns.map(([key,en,ko],index) => {
      const coords = points.map((point,i) => `${x(i)},${y(point[key])}`).join(' ');
      const last = points[points.length-1];
      if(style==='bars'||points.length===1){
        const width=Math.min(52,600/points.length/columns.length);
        return points.map((point,i)=>{
          const left=x(i)+(index-columns.length/2)*width+1;
          const baseline=y(0), value=y(point[key]);
          return `<rect class="bom-chart-column bom-series-${key}" x="${left}" y="${Math.min(baseline,value)}" width="${Math.max(1,width-2)}" height="${Math.abs(value-baseline)}" rx="2"><title>${point.day} · ${esc(localized(en,ko))} ${esc(format(point[key]))}</title></rect>`;
        }).join('');
      }
      const fill=style==='area'?`<polygon class="bom-chart-area" points="${x(0)},${y(0)} ${coords} ${x(points.length-1)},${y(0)}"/>`:'';
      return `<g class="bom-series-${key}">${fill}<polyline points="${coords}"/><circle cx="${x(points.length-1)}" cy="${y(last[key])}" r="3"><title>${esc(localized(en,ko))} ${esc(format(last[key]))}</title></circle></g>`;
    }).join('');
    const label = localized(...heading);
    return `<figure class="bom-dashboard-chart">
      <figcaption>${esc(label)} <small>${currency?'KRW':localized('Count','건수')} ${interval===7?' · '+localized('7-day intervals','7일 간격'):''}</small></figcaption>
      <div class="bom-dashboard-legend">${columns.map(([key,en,ko])=>`<span class="bom-series-${key}">${esc(localized(en,ko))}</span>`).join('')}</div>
      <div class="bom-dashboard-plot">
        <div class="bom-dashboard-scale" aria-hidden="true">${ticks.map(value=>`<span style="top:${y(value)/154*100}%">${esc(tick.format(value))}</span>`).join('')}</div>
        <svg role="img" aria-label="${esc(label)}" viewBox="0 0 720 154" preserveAspectRatio="none">
          ${ticks.map(value=>`<line x1="0" x2="720" y1="${y(value)}" y2="${y(value)}" class="${value===0?'bom-chart-zero':'bom-chart-guide'}"/>`).join('')}${lines}
        </svg>
        <div class="bom-dashboard-axis">${from===to?`<span class="bom-dashboard-day">${from}</span>`:`<span>${from}</span><span>${to}</span>`}</div>
      </div>
      <details><summary>${localized('View chart data','차트 데이터 보기')}</summary>
      <div class="table-wrap"><table class="table"><thead><tr><th>${localized('Date','날짜')}</th>${columns.map(([,en,ko])=>`<th>${localized(en,ko)}</th>`).join('')}</tr></thead>
      <tbody>${points.map(row=>`<tr><td>${row.day}</td>${columns.map(([key])=>`<td>${esc(format(row[key]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>
    </figure>`;
  }

  const salesColumn=['sales','Sales','매출'];
  const profitColumn=['profit','Realized gross profit','실현 매출총이익'];
  const productionColumn=['units','Finished units','완제품 수량'];
  const count=value=>Number(value||0).toLocaleString(currentLanguage==='ko'?'ko-KR':'en-KR');
  const sum=(rows,key)=>rows.reduce((total,row)=>total+Number(row[key]||0),0);

  function linkedCard(en, ko, value, route, filter, tone='') {
    const label=localized(en,ko);
    const content=`<span class="label">${esc(label)}</span><span class="value">${esc(value)}</span>`;
    if (!route || !allowed(route)) return card(label,value,tone);
    const url='#'+route+'?'+new URLSearchParams({unit:String(selectedUnitId||'all'),...(filter?{filter}:{})});
    return `<a class="card stat bom-dashboard-link ${tone}" href="${esc(url)}">${content}<span aria-hidden="true">↗</span></a>`;
  }

  function position(items) {
    return `<section class="bom-current-position" data-no-i18n><h2>${localized('Current Position','현재 현황')}</h2>
      <div class="bom-dashboard-kpis bom-record-summary" data-bom-summary>
        ${items.map(([en,ko,value,route,filter,currency])=>linkedCard(en,ko,currency?amount(Number(value||0)):count(value),route,filter,
          /Low|Pending|payables/.test(en)?'warn':'')).join('')}
      </div></section>`;
  }

  function comparison(title, items, format=count) {
    const max=Math.max(1,...items.map(([,value])=>Math.abs(value)));
    return `<figure class="bom-dashboard-chart"><figcaption>${esc(title)}</figcaption>
      ${items.length?`<ul class="bom-dashboard-comparison">${items.map(([label,value])=>`<li>
        <span>${esc(label)}</span><strong>${esc(format(value))}</strong>
        <span class="bom-comparison-track" aria-hidden="true"><span style="width:${Math.abs(value)/max*100}%"></span></span></li>`).join('')}</ul>`:
        `<p class="empty">${localized('No records in this date range.','이 날짜 범위에 기록이 없습니다.')}</p>`}
      </figure>`;
  }

  function unitActivity(body, kind, details, operation, cash, from, to) {
    const excavator=kind==='excavator';
    const profit=sum(details.sales||[],'profit');
    const cards=excavator?[
      linkedCard('Machines purchased','구매 장비',count(operation.count),'excavator'),
      linkedCard('Machines sold','판매 장비',count(sum(details.sales,'sold')),'excavator','Sold / Completed','good'),
      card(localized('Sales','매출'),amount(sum(details.sales,'sales'))),
      card(localized(...profitColumn.slice(1)),amount(profit),profit<0?'bad':'good')
    ]:kind==='pink'?[
      linkedCard('Imports received','입고 완료 수입',count(details.imports),'psImports'),
      linkedCard('Finished units produced','생산 완제품 수량',count(sum(details.production,'units')),'psProduction',null,'good'),
      linkedCard('Completed orders','완료 주문',count(sum(details.sales,'orders')),'psSales'),
      card(localized('Sales','매출'),amount(sum(details.sales,'sales')),'good')
    ]:kind==='ceo'?[
      card(localized('Cash in','자금 유입'),amount(sum(cash,'cash_in')),'good'),
      card(localized('Cash out','자금 유출'),amount(sum(cash,'cash_out')),'warn'),
      card(localized('Net cash movement','순자금 이동'),amount(sum(cash,'cash_in')-sum(cash,'cash_out')),
        sum(cash,'cash_in')>=sum(cash,'cash_out')?'good':'bad')
    ]:[
      linkedCard(kind==='mimi'?'Completed POS sales':'Completed sales',kind==='mimi'?'완료 POS 매출 건수':'완료 매출 건수',
        count(sum(details.sales,'orders')),kind==='mimi'?'restaurant':'sales'),
      card(localized('Sales','매출'),amount(sum(details.sales,'sales'))),
      card(localized('Gross profit','매출총이익'),amount(profit),profit<0?'bad':'good'),
      card(localized('Average sale','평균 매출액'),amount(sum(details.sales,'sales')/(sum(details.sales,'orders')||1)))
    ];
    const cashTitle=['Cash movement','자금 이동'];
    const salesRows=details.sales||[];
    const orders=kind==='pink'||kind==='mimi'||kind==='mango'||kind==='sales';
    const chartCards=[];
    const empty=label=>`<figure class="bom-dashboard-chart"><figcaption>${esc(localized(...label))}</figcaption>
      <p class="empty">${localized('No records in this date range.','이 날짜 범위에 기록이 없습니다.')}</p></figure>`;
    const addChart=(key,label,data,columns,currency,style)=>{
      chartCards.push(`<section class="card bom-trend-panel" data-chart="${key}">${data.length?
        chart(data,from,to,columns,label,currency,style):empty(label)}</section>`);
    };
    if(kind==='ceo'){
      addChart('net',['Net cash movement','순자금 이동'],cash,[series[2]],true,'area');
      addChart('cash',cashTitle,cash,series.slice(0,2),true,'bars');
      const byUnit=details.units.map(unit=>[unit.name?t(unit.name):localized('Company / Shared','회사 / 공통'),
        Math.abs(Number(unit.cash_in))+Math.abs(Number(unit.cash_out))]).sort((a,b)=>b[1]-a[1]);
      chartCards.push(`<section class="card bom-trend-panel">${comparison(localized('Cash activity by business unit','사업부별 자금 활동'),byUnit.slice(0,8),amount)}</section>`);
    } else {
      addChart('sales',['Sales trend','매출 추이'],salesRows,kind==='pink'?[salesColumn]:
        [salesColumn,excavator?profitColumn:['profit','Gross profit','매출총이익']],true,'line');
      addChart('cash',cashTitle,cash,series.slice(0,2),true,'bars');
      if(kind==='pink')addChart('production',['Production trend','생산 추이'],details.production,[productionColumn],false,'area');
      if(orders)addChart('orders',['Completed sales volume','완료 판매 건수'],salesRows,[['orders','Completed','완료']],false,'area');
      if(excavator)chartCards.push(`<section class="card bom-trend-panel">${comparison(localized('Machine activity','장비 거래 건수'),[
        [localized('Purchased','구매'),Number(operation.count)],[localized('Sold','판매'),sum(salesRows,'sold')]
      ])}</section>`);
    }
    body.innerHTML=`<div class="bom-dashboard-kpis bom-record-summary bom-period-kpis" data-bom-summary>${cards.join('')}</div>
      <div class="bom-dashboard-charts" data-dashboard-chart>${chartCards.join('')}</div>
      ${kind==='ceo'&&details.units.length?`<section class="card bom-trend-panel" style="margin-top:12px"><h2>${localized('Cash movement by business unit','사업부별 자금 이동')}</h2>
      <div class="table-wrap"><table class="table"><thead><tr><th>${localized('Business unit','사업부')}</th>
      ${series.map(([,en,ko])=>`<th>${localized(en,ko)}</th>`).join('')}</tr></thead><tbody>
      ${details.units.map(unit=>`<tr><td>${unit.id?`<a href="#dashboard?unit=${encodeURIComponent(unit.id)}&amp;from=${from}&amp;to=${to}">${esc(t(unit.name))}</a>`:esc(localized('Company / Shared','회사 / 공통'))}</td>
      <td>${esc(amount(Number(unit.cash_in)))}</td><td>${esc(amount(Number(unit.cash_out)))}</td>
      <td>${esc(amount(Number(unit.cash_in)-Number(unit.cash_out)))}</td></tr>`).join('')}</tbody></table></div></section>`:''}`;
  }

  function mount(content, kind=null) {
    const heading=content.querySelector('.titlebar');
    if (!heading || content.querySelector('[data-dashboard-activity]')) return;
    const route = window.BOMRouter?.parse();
    const host=document.createElement('section');
    host.className=kind?'bom-dashboard-integrated bom-dashboard-'+kind:'card bom-dashboard-activity';
    host.dataset.dashboardActivity='1';
    host.setAttribute('data-no-i18n','');
    const range = { ...dateRange('month') };
    for (const key of ['from','to']) {
      const value=route?.params.get(key);
      if (/^\d{4}-\d{2}-\d{2}$/.test(value||'')) range[key]=value;
    }
    host.innerHTML=`<div class="bom-dashboard-head">${kind?'':`<h2>${localized('Period activity','기간별 활동')}</h2>`}
      <form class="bom-dashboard-dates" data-bom-no-review="1">
        <div class="bom-dashboard-presets">${[['today','Today','오늘'],['week','Last 7 days','최근 7일'],['month','This month','이번 달'],['year','This year','올해']].map(([key,en,ko])=>`<button type="button" class="btn small" data-period="${key}">${localized(en,ko)}</button>`).join('')}</div>
        <label><span>${localized('From','시작일')}</span><input required type="date" name="from" value="${range.from}"></label>
        <label><span>${localized('To','종료일')}</span><input required type="date" name="to" value="${range.to}"></label>
        <button class="btn primary" type="submit">${localized('Apply','적용')}</button>
      </form></div><div data-activity-results aria-live="polite"></div>`;
    heading.after(host);
    const form=host.querySelector('form'), body=host.querySelector('[data-activity-results]');
    let request;
    if(kind){
      heading.classList.add('bom-dashboard-hero','bom-dashboard-'+kind);
      const rangeControl=document.createElement('details');
      rangeControl.className='bom-dashboard-range';
      rangeControl.innerHTML=`<summary class="btn">${localized('Date range','날짜 범위')}</summary>`;
      const toolbar=document.createElement('div');
      toolbar.className='bom-dashboard-toolbar';
      const presets=form.querySelector('.bom-dashboard-presets');
      toolbar.append(presets,rangeControl);
      form.prepend(presets.cloneNode(true));
      rangeControl.append(form);
      heading.append(toolbar);
      host.querySelector('.bom-dashboard-head').remove();
    }

    async function load() {
      request?.abort();
      const controller=new AbortController();
      request=controller;
      const { from, to } = Object.fromEntries(new FormData(form));
      const days=(Date.parse(to)-Date.parse(from))/dayMs;
      if (!Number.isFinite(days)||days<0||days>365) {
        body.innerHTML=`<p role="alert">${localized('Choose a valid date range of up to 366 days.','최대 366일의 유효한 날짜 범위를 선택하세요.')}</p>`;
        return;
      }
      if(kind) {
        heading.querySelector('.bom-dashboard-range summary').textContent=`${localized('Date range','날짜 범위')} · ${from} – ${to}`;
        heading.querySelector('.bom-dashboard-range').open=false;
      }
      window.BOMRouter?.state({from,to});
      for (const button of (kind?heading:form).querySelectorAll('[data-period]')) {
        const range=dateRange(button.dataset.period);
        button.setAttribute('aria-pressed',String(range.from===from && range.to===to));
      }
      body.innerHTML=`<p role="status">${localized('Loading period activity…','기간별 활동을 불러오는 중…')}</p>`;
      try {
        const { rows, operation, details }=await api('/api/dashboard/activity?'+new URLSearchParams({from,to}),{signal:controller.signal});
        if (controller.signal.aborted || !host.isConnected) return;
        if(kind&&details){
          unitActivity(body,kind,details,operation,rows,from,to);
          return;
        }
        const cashIn=rows.reduce((sum,row)=>sum+Number(row.cash_in),0);
        const cashOut=rows.reduce((sum,row)=>sum+Number(row.cash_out),0);
        const measure=metrics[operation?.key];
        body.innerHTML=`<div class="bom-dashboard-kpis bom-record-summary" data-bom-summary>
          ${card(localized('Cash in','자금 유입'),amount(cashIn),'good')}
          ${card(localized('Cash out','자금 유출'),amount(cashOut),'warn')}
          ${card(localized('Net cash movement','순자금 이동'),amount(cashIn-cashOut),cashIn>=cashOut?'good':'bad')}
          ${measure?card(localized(...measure),Number(operation.count).toLocaleString()):''}
        </div>${rows.length?chart(rows,from,to):`<p class="empty">${localized('No recorded cash movement in this period.','이 기간에 기록된 자금 이동이 없습니다.')}</p>`}`;
      } catch (error) {
        if (controller.signal.aborted || !host.isConnected || error.name==='AbortError') return;
        body.innerHTML=`<p role="alert">${localized('Period activity could not be loaded.','기간별 활동을 불러올 수 없습니다.')}</p>
          <button class="btn" type="button">${localized('Retry','다시 시도')}</button>`;
        body.querySelector('button').onclick=load;
      }
    }

    form.onsubmit=event=>{event.preventDefault();void load()};
    for (const button of (kind?heading:form).querySelectorAll('[data-period]')) button.onclick=()=>{
      const dates=dateRange(button.dataset.period);
      form.elements.from.value=dates.from;
      form.elements.to.value=dates.to;
      void load();
    };
    void load();

    if(kind)return;
    const snapshot=document.createElement('h2');
    snapshot.className='bom-dashboard-snapshot';
    snapshot.textContent=localized('Workspace overview','워크스페이스 개요');
    host.after(snapshot);
  }

  window.BOMDashboardActivity=Object.freeze({mount,position});
})();
