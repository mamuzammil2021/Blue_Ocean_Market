// Blue Ocean Market V29.1.0 — Finance & Accounting usability refinement.
// Keeps the V29 accounting engine intact while presenting a simpler default workspace.
(function(){
  'use strict';
  window.__BLUE_OCEAN_V291_ACTIVE=true;
  const V='29.1.0';

  try{Object.assign(KO,{
    'Accounts & Finance':'회계 및 재무','Simple View':'간단 보기','Advanced Accounting':'고급 회계','Open Advanced Accounting':'고급 회계 열기','Back to Simple View':'간단 보기로 돌아가기',
    'Financial Summary':'재무 요약','Business Reports':'사업 보고서','Cash & Banks':'현금 및 은행','Financial Health':'재무 상태','Everything looks balanced':'회계 상태가 정상입니다','Needs Attention':'확인 필요',
    'Sales / Revenue':'매출 / 수익','Business Expenses':'사업 비용','Net Profit':'순이익','Buyer Money Held in Advance':'보유 구매자 선급금','Amount Owed to Suppliers':'공급업체 미지급금',
    'What We Own':'보유 자산','What We Owe':'부채','Company Value / Equity':'회사 자본','Accounting is working in the background':'회계는 백그라운드에서 자동 처리됩니다',
    'Staff enter business transactions once. Blue Ocean posts the accounting automatically.':'직원은 업무 거래를 한 번만 입력하면 Blue Ocean이 회계를 자동으로 반영합니다.',
    'Use Finance for daily payments, expenses, evidence and corrections. Use Accounts for company reports and financial control.':'일상 결제, 비용, 증빙 및 수정은 재무에서 처리하고 회사 보고서와 재무 통제는 회계에서 확인합니다.',
    'Profit & Loss Report':'손익 보고서','Balance Sheet Report':'재무상태 보고서','Accounting Check':'회계 점검','Choose Report':'보고서 선택','This Month':'이번 달','This Year':'올해','All Time':'전체 기간',
    'No accounting problems found.':'회계 문제가 발견되지 않았습니다.','Accounting needs review before period closing.':'기간 마감 전에 회계 검토가 필요합니다.',
    'Daily Finance':'일상 재무','Accounts & Reports':'회계 및 보고서','More Filters':'추가 필터','Hide Extra Filters':'추가 필터 숨기기','Quick Guide':'빠른 안내',
    'Transactions & Evidence':'거래 및 증빙','Corrections':'수정 요청','Verified Records':'검증 완료 기록','Money Owed to Us':'받을 금액','Money We Owe':'지급할 금액',
    'Advanced tools are intended for CEO / Owner and Finance / Admin.':'고급 도구는 CEO / Owner 및 Finance / Admin용입니다.',
    'General Ledger, Chart of Accounts, reconciliation, periods, budgets and transfers.':'총계정원장, 계정과목표, 은행 조정, 회계 기간, 예산 및 사업부 간 이체입니다.',
    'Open Finance':'재무 열기','Refresh Summary':'요약 새로고침','Accounting Problems':'회계 문제','Waiting to Sync':'동기화 대기','Bank Items to Match':'은행 대조 대기',
    'Daily work':'일상 업무','Management':'경영 관리','Advanced':'고급','Use this page mainly for company results and financial health.':'이 페이지는 주로 회사 실적과 재무 상태 확인에 사용합니다.'
  })}catch(_){ }

  const style=document.createElement('style'); style.id='v291-ui'; style.textContent=`
    .v291-title-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}
    .v291-guide{display:flex;justify-content:space-between;gap:18px;align-items:center;padding:14px 16px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(135deg,#f8fbff,#fff);margin:0 0 16px}
    .v291-guide b{display:block;margin-bottom:3px}.v291-guide .muted{max-width:820px}
    .v291-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:14px}
    .v291-kpi{border:1px solid var(--line);border-radius:14px;padding:14px;background:#fff;min-width:0}
    .v291-kpi .label{font-size:12px;color:var(--muted);font-weight:800;margin-bottom:7px}.v291-kpi .value{font-size:22px;font-weight:900;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
    .v291-kpi.good{border-left:4px solid #19945f}.v291-kpi.warn{border-left:4px solid #d59b1c}.v291-kpi.bad{border-left:4px solid #d64545}
    .v291-simple-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}.v291-simple-tabs .btn.active{background:var(--brand);border-color:var(--brand);color:#fff}
    .v291-health{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,.75fr);gap:12px}.v291-health-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px}
    .v291-health-item{padding:11px;border:1px solid var(--line);border-radius:11px;background:#fbfcfe}.v291-health-item small{display:block;color:var(--muted);font-weight:700}.v291-health-item b{display:block;margin-top:3px;font-size:18px}
    .v291-report-controls{display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap}.v291-report-controls .field{margin:0;min-width:150px}.v291-report-table td:last-child,.v291-report-table th:last-child{text-align:right}.v291-report-table td:last-child{font-variant-numeric:tabular-nums}
    .v291-cash-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.v291-cash-card{border:1px solid var(--line);border-radius:12px;padding:13px;background:#fff}.v291-cash-card b{display:block;font-size:15px}.v291-cash-card small{display:block;color:var(--muted);margin-top:4px}
    .v291-advanced-return{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid #cfe1f6;background:#f7fbff;border-radius:12px;margin-bottom:12px}
    .finance-v291 .titlebar{align-items:flex-start}.finance-v291 .titlebar>div:last-child,.finance-v291 .v285-page-actions{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
    .finance-v291 .finance-tabs{display:flex;gap:8px;flex-wrap:wrap;padding:10px 0 4px}.finance-v291 .finance-tabs .v291-extra-finance-tab{display:none}.finance-v291.v291-show-extra .finance-tabs .v291-extra-finance-tab{display:inline-flex}
    .finance-v291 .finance-filterbar{display:grid;grid-template-columns:minmax(260px,2fr) repeat(3,minmax(140px,1fr));gap:9px;align-items:center}
    .finance-v291 .finance-head{align-items:flex-start}.finance-v291 .finance-table td,.finance-v291 .finance-table th{vertical-align:top}
    .finance-v291 .finance-table td:nth-child(6){font-variant-numeric:tabular-nums;white-space:nowrap;font-weight:800}
    .finance-v291 .finance-table td:nth-child(3),.finance-v291 .finance-table td:nth-child(4){min-width:150px}
    .finance-v291 .v291-finance-guide{margin-top:0}
    @media(max-width:1000px){.v291-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.v291-health{grid-template-columns:1fr}.v291-cash-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.finance-v291 .finance-filterbar{grid-template-columns:1fr 1fr}}
    @media(max-width:620px){.v291-guide{align-items:flex-start;flex-direction:column}.v291-kpis,.v291-health-list,.v291-cash-grid{grid-template-columns:1fr}.v291-simple-tabs{overflow-x:auto;flex-wrap:nowrap;padding-bottom:3px}.v291-simple-tabs .btn{flex:0 0 auto}.finance-v291 .finance-filterbar{grid-template-columns:1fr}.finance-v291 .titlebar{gap:10px}.finance-v291 .titlebar>div:last-child,.finance-v291 .v285-page-actions{width:100%;justify-content:flex-start}.finance-v291 .finance-head{flex-direction:column}.finance-v291 .finance-head>button{align-self:flex-start}}
  `;document.head.appendChild(style);

  const canAdvanced=()=>!!me&&['CEO / Owner','Finance / Admin'].includes(me.role);
  let simpleAccountingTab='summary';
  let simpleReport='pnl';
  const _loadViewV290=loadView;
  const _financeV290=finance;

  function krw291(v){return '₩ '+money(Number(v||0))}
  function badge291(text,kind=''){return `<span class="v290-badge ${kind}">${esc(t(text))}</span>`}
  function simpleTabs291(){return `<div class="v291-simple-tabs"><button class="btn small ${simpleAccountingTab==='summary'?'active':''}" onclick="accountingSimpleTabV291('summary')">${esc(t('Financial Summary'))}</button><button class="btn small ${simpleAccountingTab==='reports'?'active':''}" onclick="accountingSimpleTabV291('reports')">${esc(t('Business Reports'))}</button><button class="btn small ${simpleAccountingTab==='cash'?'active':''}" onclick="accountingSimpleTabV291('cash')">${esc(t('Cash & Banks'))}</button></div>`}

  async function accountingSimpleV291(c){
    const action=`<div class="v291-title-actions"><button class="btn" onclick="go('finance')">${esc(t('Open Finance'))}</button>${canAdvanced()?`<button class="btn primary" onclick="accountingAdvancedV291()">${esc(t('Open Advanced Accounting'))}</button>`:''}</div>`;
    c.innerHTML=title('Accounts & Finance','Use this page mainly for company results and financial health.',action)+
      `<div class="v291-guide"><div><b>${esc(t('Accounting is working in the background'))}</b><div class="muted">${esc(t('Staff enter business transactions once. Blue Ocean posts the accounting automatically.'))}</div></div><div>${badge291('Simple View','good')}</div></div>`+
      simpleTabs291()+`<div id="accountingSimpleBodyV291"><div class="card">Loading…</div></div>`;
    await loadAccountingSimpleTabV291();
  }
  window.accountingSimpleTabV291=async tab=>{simpleAccountingTab=tab;const c=document.getElementById('content');if(!c)return;await accountingSimpleV291(c)};

  async function loadAccountingSimpleTabV291(){const b=document.getElementById('accountingSimpleBodyV291');if(!b)return;if(simpleAccountingTab==='reports')return reportsSimpleV291(b);if(simpleAccountingTab==='cash')return cashSimpleV291(b);return summarySimpleV291(b)}

  async function summarySimpleV291(b){
    const [d,i,e]=await Promise.all([api('/api/accounting/overview'),api('/api/accounting/integrity'),api('/api/accounting/exceptions')]);
    const issueCount=Number(i.open_exceptions||0)+Number(i.sync_queue||0)+Number(i.unbalanced_journals||0)+Number(i.finance_not_posted||0);
    b.innerHTML=`<div class="v291-kpis">
      <div class="v291-kpi"><div class="label">${esc(t('Sales / Revenue'))}</div><div class="value">${krw291(d.revenue)}</div></div>
      <div class="v291-kpi"><div class="label">${esc(t('Business Expenses'))}</div><div class="value">${krw291(d.expense)}</div></div>
      <div class="v291-kpi ${Number(d.profit)>=0?'good':'bad'}"><div class="label">${esc(t('Net Profit'))}</div><div class="value">${krw291(d.profit)}</div></div>
      <div class="v291-kpi"><div class="label">${esc(t('Buyer Money Held in Advance'))}</div><div class="value">${krw291(d.buyer_advances)}</div></div>
    </div>
    <div class="v291-kpis">
      <div class="v291-kpi"><div class="label">${esc(t('What We Own'))}</div><div class="value">${krw291(d.assets)}</div></div>
      <div class="v291-kpi"><div class="label">${esc(t('What We Owe'))}</div><div class="value">${krw291(d.liabilities)}</div></div>
      <div class="v291-kpi"><div class="label">${esc(t('Amount Owed to Suppliers'))}</div><div class="value">${krw291(d.supplier_payable)}</div></div>
      <div class="v291-kpi"><div class="label">${esc(t('Company Value / Equity'))}</div><div class="value">${krw291(d.equity)}</div></div>
    </div>
    <div class="v291-health">
      <div class="card ${issueCount?'v290-integrity-bad':'v290-integrity-good'}"><div class="section-title"><div><h3>${esc(t('Financial Health'))}</h3><div class="muted">${esc(t(issueCount?'Accounting needs review before period closing.':'No accounting problems found.'))}</div></div>${canAdvanced()?`<button class="btn small" onclick="accountingAdvancedV291()">${esc(t('Advanced'))}</button>`:''}</div>
        <div class="v291-health-list"><div class="v291-health-item"><small>${esc(t('Accounting Problems'))}</small><b>${Number(i.open_exceptions||0)+Number(i.unbalanced_journals||0)}</b></div><div class="v291-health-item"><small>${esc(t('Waiting to Sync'))}</small><b>${Number(i.sync_queue||0)+Number(i.finance_not_posted||0)}</b></div><div class="v291-health-item"><small>${esc(t('Bank Items to Match'))}</small><b>${Number(d.unreconciled||0)}</b></div></div>
      </div>
      <div class="card"><h3>${esc(t('Quick Guide'))}</h3><div class="order-row"><span><b>${esc(t('Daily work'))}</b><small>${esc(t('Transactions & Evidence'))}</small></span><button class="btn small" onclick="go('finance')">${esc(t('Open Finance'))}</button></div><div class="order-row"><span><b>${esc(t('Management'))}</b><small>${esc(t('Business Reports'))}</small></span><button class="btn small" onclick="accountingSimpleTabV291('reports')">${esc(t('Open'))}</button></div>${canAdvanced()?`<div class="order-row"><span><b>${esc(t('Advanced'))}</b><small>${esc(t('Advanced tools are intended for CEO / Owner and Finance / Admin.'))}</small></span><button class="btn small" onclick="accountingAdvancedV291()">${esc(t('Open'))}</button></div>`:''}</div>
    </div>
    ${e.length?`<div class="card" style="margin-top:14px"><div class="section-title"><h3>${esc(t('Needs Attention'))}</h3>${badge291(String(e.length),'warn')}</div>${e.slice(0,6).map(x=>`<div class="order-row"><span><b>${esc(x.code||'Accounting')}</b><small class="v290-source">${esc(x.message||'')}</small></span>${badge291(x.severity||'Warning',x.severity==='Critical'?'bad':'warn')}</div>`).join('')}</div>`:''}`;
    try{translateElement(b)}catch(_){ }
  }

  function reportRange291(mode){const now=new Date(),to=now.toISOString().slice(0,10);if(mode==='year')return [now.getFullYear()+'-01-01',to];if(mode==='month')return [to.slice(0,7)+'-01',to];return ['','']}
  async function reportsSimpleV291(b){
    const [from,to]=reportRange291(window.__v291ReportRange||'month');
    b.innerHTML=`<div class="card"><div class="section-title"><div><h3>${esc(t('Business Reports'))}</h3><div class="muted">${esc(t('Choose Report'))} · KRW</div></div><div class="v291-report-controls"><div class="field"><label>${esc(t('Choose Report'))}</label><select id="v291ReportType" onchange="simpleReport=this.value;loadSimpleReportV291()"><option value="pnl" ${simpleReport==='pnl'?'selected':''}>${esc(t('Profit & Loss Report'))}</option><option value="balance" ${simpleReport==='balance'?'selected':''}>${esc(t('Balance Sheet Report'))}</option><option value="trial" ${simpleReport==='trial'?'selected':''}>${esc(t('Accounting Check'))}</option></select></div><div class="field"><label>${esc(t('Period'))}</label><select id="v291ReportRange" onchange="window.__v291ReportRange=this.value;loadSimpleReportV291()"><option value="month" ${(window.__v291ReportRange||'month')==='month'?'selected':''}>${esc(t('This Month'))}</option><option value="year" ${window.__v291ReportRange==='year'?'selected':''}>${esc(t('This Year'))}</option><option value="all" ${window.__v291ReportRange==='all'?'selected':''}>${esc(t('All Time'))}</option></select></div><button class="btn" onclick="loadSimpleReportV291()">${esc(t('Refresh Summary'))}</button></div></div><div id="v291ReportBody">Loading…</div></div>`;
    await loadSimpleReportV291();
  }
  window.loadSimpleReportV291=async()=>{const body=document.getElementById('v291ReportBody');if(!body)return;simpleReport=document.getElementById('v291ReportType')?.value||simpleReport;const mode=document.getElementById('v291ReportRange')?.value||window.__v291ReportRange||'month';window.__v291ReportRange=mode;const [from,to]=reportRange291(mode),qs=new URLSearchParams();if(from)qs.set('from',from);if(to)qs.set('to',to);body.innerHTML='Loading…';try{if(simpleReport==='pnl'){const d=await api('/api/accounting/pnl?'+qs);body.innerHTML=`<div class="v291-kpis" style="margin-top:12px"><div class="v291-kpi"><div class="label">${esc(t('Sales / Revenue'))}</div><div class="value">${krw291(d.revenue)}</div></div><div class="v291-kpi"><div class="label">${esc(t('Business Expenses'))}</div><div class="value">${krw291(d.expense)}</div></div><div class="v291-kpi ${Number(d.profit)>=0?'good':'bad'}"><div class="label">${esc(t('Net Profit'))}</div><div class="value">${krw291(d.profit)}</div></div></div>${simpleReportRows291(d.rows)}`;}
      else if(simpleReport==='balance'){const d=await api('/api/accounting/balance-sheet?'+qs);body.innerHTML=`<div class="v291-kpis" style="margin-top:12px"><div class="v291-kpi"><div class="label">${esc(t('What We Own'))}</div><div class="value">${krw291(d.assets)}</div></div><div class="v291-kpi"><div class="label">${esc(t('What We Owe'))}</div><div class="value">${krw291(d.liabilities)}</div></div><div class="v291-kpi"><div class="label">${esc(t('Company Value / Equity'))}</div><div class="value">${krw291(Number(d.equity||0)+Number(d.current_profit||0))}</div></div></div>${simpleReportRows291(d.rows)}`;}
      else {const d=await api('/api/accounting/trial-balance?'+qs);const ok=Math.abs(Number(d.difference||0))<0.01;body.innerHTML=`<div class="v291-guide" style="margin-top:12px"><div><b>${esc(t(ok?'Everything looks balanced':'Needs Attention'))}</b><div class="muted">${esc(t('Accounting Check'))}: ${krw291(Math.abs(Number(d.difference||0)))}</div></div>${badge291(ok?'Everything looks balanced':'Needs Attention',ok?'good':'bad')}</div>${simpleReportRows291(d.rows,true)}`;}}
    catch(e){body.innerHTML=`<div class="review-warning critical"><b>${esc(t('Error'))}</b><span>${esc(e.message)}</span></div>`}try{translateElement(body)}catch(_){ }};
  function simpleReportRows291(rows,trial=false){const used=(rows||[]).filter(r=>Math.abs(Number(r.balance||0))>.005||Math.abs(Number(r.debit||0))>.005||Math.abs(Number(r.credit||0))>.005);return `<div class="table-wrap"><table class="table v291-report-table"><tr><th>${esc(t('Account'))}</th><th>${esc(t('Type'))}</th>${trial?`<th>${esc(t('Debit'))}</th><th>${esc(t('Credit'))}</th>`:`<th>${esc(t('Amount'))}</th>`}</tr>${used.map(r=>`<tr><td><b>${esc(r.name)}</b><div class="v290-source">${esc(r.code)}</div></td><td>${esc(t(r.account_type))}</td>${trial?`<td>${krw291(r.debit)}</td><td>${krw291(r.credit)}</td>`:`<td>${krw291(r.balance)}</td>`}</tr>`).join('')||`<tr><td colspan="${trial?4:3}"><div class="empty">${esc(t('No activity in this period.'))}</div></td></tr>`}</table></div>`}

  async function cashSimpleV291(b){
    try{const rows=await api('/api/accounting/payment-accounts');b.innerHTML=`<div class="card"><div class="section-title"><div><h3>${esc(t('Cash & Banks'))}</h3><div class="muted">${esc(t('Map operational payments to the actual bank, cash or gateway account.'))}</div></div>${canAdvanced()?`<button class="btn" onclick="accountingAdvancedV291()">${esc(t('Advanced'))}</button>`:''}</div><div class="v291-cash-grid">${rows.map(p=>`<div class="v291-cash-card"><b>${esc(p.name)}</b><small>${esc(p.payment_type)} · ${esc(p.currency)}</small><small>${esc(p.business_unit||t('Company / Shared'))}</small>${p.bank_name||p.account_last4?`<small>${esc(p.bank_name||'')}${p.account_last4?' · ••••'+esc(p.account_last4):''}</small>`:''}<small>${esc(p.ledger_name||'')}</small>${p.is_default?`<div style="margin-top:8px">${badge291('Default','good')}</div>`:''}</div>`).join('')||`<div class="empty">—</div>`}</div></div>`;translateElement(b)}catch(e){b.innerHTML=`<div class="review-warning critical"><b>${esc(t('Error'))}</b><span>${esc(e.message)}</span></div>`}}

  window.accountingAdvancedV291=async()=>{if(!canAdvanced())return;localStorage.setItem('blueOceanAccountingMode','advanced');await loadView()};
  window.accountingSimpleV291=async()=>{localStorage.setItem('blueOceanAccountingMode','simple');await loadView()};
  function enhanceAdvancedAccountingV291(){const c=document.getElementById('content');if(!c)return;const bar=document.createElement('div');bar.className='v291-advanced-return';bar.innerHTML=`<div><b>${esc(t('Advanced Accounting'))}</b><div class="muted">${esc(t('General Ledger, Chart of Accounts, reconciliation, periods, budgets and transfers.'))}</div></div><button class="btn primary" onclick="accountingSimpleV291()">← ${esc(t('Back to Simple View'))}</button>`;const first=c.firstElementChild;if(first)first.insertAdjacentElement('afterend',bar);else c.prepend(bar);try{translateElement(bar)}catch(_){ }}

  loadView=async function(){
    if(view==='accounting'){
      const c=document.getElementById('content');c.innerHTML='<div class="card">Loading…</div>';
      const advanced=canAdvanced()&&localStorage.getItem('blueOceanAccountingMode')==='advanced';
      if(advanced){await _loadViewV290();enhanceAdvancedAccountingV291();return}
      try{return await accountingSimpleV291(c)}catch(e){c.innerHTML='<div class="card"><b>Error</b><p class="muted">'+esc(e.message)+'</p></div>';return}
    }
    return _loadViewV290();
  };

  finance=async function(c){
    await _financeV290(c);
    c.classList.add('finance-v291');
    const titlebar=c.querySelector('.titlebar');
    if(titlebar){const h=titlebar.querySelector('h1');if(h)h.textContent=t('Daily Finance');const sub=titlebar.querySelector('.muted');if(sub)sub.textContent=t('Use Finance for daily payments, expenses, evidence and corrections. Use Accounts for company reports and financial control.');let actions=titlebar.querySelector('.v285-page-actions,.v291-title-actions');if(!actions){actions=document.createElement('div');actions.className='v291-title-actions';[...titlebar.children].slice(1).forEach(el=>actions.appendChild(el));titlebar.appendChild(actions)}else actions.classList.add('v291-title-actions');if(!actions.querySelector('[data-v291-accounts]'))actions.insertAdjacentHTML('beforeend',`<button class="btn" data-v291-accounts onclick="go('accounting')">${esc(t('Accounts & Reports'))}</button>`)}
    const tabs=c.querySelector('#financeTabs');if(tabs){const keep=new Set(['all','correctionQueue','pending','correction']);[...tabs.querySelectorAll('[data-mode]')].forEach(btn=>{if(!keep.has(btn.dataset.mode))btn.classList.add('v291-extra-finance-tab')});if(!tabs.querySelector('[data-v291-more]'))tabs.insertAdjacentHTML('beforeend',`<button class="btn small" data-v291-more onclick="financeMoreFiltersV291(this)">${esc(t('More Filters'))}</button>`)}
    const records=c.querySelector('#financeRecordsPanel');if(records&&!c.querySelector('.v291-finance-guide'))records.insertAdjacentHTML('beforebegin',`<div class="v291-guide v291-finance-guide"><div><b>${esc(t('Daily Finance'))}</b><div class="muted">${esc(t('Transactions & Evidence'))} · ${esc(t('Corrections'))} · ${esc(t('Pending Review'))}</div></div><button class="btn" onclick="go('accounting')">${esc(t('Accounts & Reports'))}</button></div>`);
    try{translateElement(c)}catch(_){ }
  };
  window.financeMoreFiltersV291=btn=>{const c=document.getElementById('content');if(!c)return;c.classList.toggle('v291-show-extra');if(btn)btn.textContent=t(c.classList.contains('v291-show-extra')?'Hide Extra Filters':'More Filters')};

  // Re-render after this extension loads so authenticated users immediately receive the simplified UI.
  setTimeout(()=>{try{if(me)render()}catch(e){console.warn('V29.1 post-load render:',e.message)}},0);
  console.info('Blue Ocean Market V29.1.0 finance usability UI loaded');
})();
