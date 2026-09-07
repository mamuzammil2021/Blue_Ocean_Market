// Blue Ocean Market V30.4.0 — Finance integrity + active-state + Pink Salt context cleanup.
(function(){
  'use strict';
  window.__BLUE_OCEAN_V302_ACTIVE=true;
  try{Object.assign(KO,{
    'Purchase / Payable':'구매 / 미지급금','Supplier Payment / Settlement':'공급업체 지급 / 정산','Import Cost Payment':'수입 비용 지급','Packaging Purchase Payment':'포장재 구매 지급','Sale / Revenue':'판매 / 수익','Customer Receipt':'고객 수금','Customer Refund':'고객 환불','Marketplace Fee Payment':'마켓플레이스 수수료 지급','Inventory Loss':'재고 손실','Payment / Settlement':'지급 / 정산','Cash Movement':'현금 이동','No Cash Movement':'현금 이동 없음','Customer Money Held in Advance':'보유 고객 선급금','Purchase created — no cash counted twice':'구매 기록 생성 — 현금은 중복 집계되지 않음','Payment settles the linked payable':'지급은 연결된 미지급금을 정산합니다.','Finance Integrity':'재무 무결성','Duplicate Active Sources':'중복 활성 원본','Repair Duplicates':'중복 정리','Source-linked record':'원본 연결 기록','Cash In':'현금 유입','Cash Out':'현금 유출','Supporting Docs Missing':'지원 문서 누락','One business event = one source-linked Finance record':'하나의 업무 이벤트 = 하나의 원본 연결 재무 기록','Operational records and their cash settlements are linked, not duplicated.':'운영 기록과 현금 정산은 연결되며 중복 기록되지 않습니다.','Customer Advances':'고객 선급금'
  })}catch(_){ }

  const style=document.createElement('style');style.id='v302-ui';style.textContent=`
    .finance-role{display:inline-flex;margin-top:5px}.finance-no-cash{background:#eef3f8;color:#526074}.finance-cash-in{background:#e6f7ef;color:#08764a}.finance-cash-out{background:#fff3db;color:#9a6700}
    .v302-finance-note{display:flex;gap:10px;align-items:flex-start;padding:11px 13px;border:1px solid #d8e5f4;border-radius:12px;background:#f7fbff;margin:0 0 12px;color:#35506f}.v302-finance-note b{display:block}.v302-finance-note span{font-size:12px;color:#617086}
    .v290-tabs .btn.active,.v290-tabs .btn[data-v302-active="1"]{background:var(--brand)!important;color:#fff!important;border-color:var(--brand)!important}
    @media(max-width:700px){.v302-finance-note{display:block}}
  `;document.head.appendChild(style);

  function selectedName(){try{return (unitOptions||[]).find(x=>Number(x.id)===Number(selectedUnitId||me?.business_unit_id||0))?.name||''}catch(_){return ''}}
  function cashClass(x){return Number(x.cash_effect||0)>0?'finance-cash-in':Number(x.cash_effect||0)<0?'finance-cash-out':'finance-no-cash'}
  function cashLabel(x){return Number(x.cash_effect||0)>0?'Cash In':Number(x.cash_effect||0)<0?'Cash Out':'No Cash Movement'}

  window.financeRowHtml=function(x){
    const amount=financeAmount(x),status=financeStatusLabel(x),source=(x.source_label||x.source_type||'Manual')+(x.source_id?' #'+x.source_id:''),linkedEvidence=Number(x.linked_evidence_count||0),hasEvidence=Number(x.attachment_count||0)>0||!!x.receipt_file||linkedEvidence>0,bulkEligible=financeCanVerify()&&['Pending Verification','Resubmitted'].includes(status)&&amount<=5000000&&hasEvidence&&x.status!=='Voided',role=x.finance_role||x.type||'Financial Record',cash=cashLabel(x),evidenceText=x.source_type?.startsWith('Pink Salt')?'Linked Source Evidence':x.source_type==='Excavator Sale'?'Buyer Advance':'Linked Evidence';
    return `<tr data-finance-id="${x.id}" data-status="${esc(status)}" data-type="${esc(x.type||'')}" data-role="${esc(role)}" data-cash="${Number(x.cash_effect||0)}" data-evidence="${hasEvidence?'yes':'no'}" data-request="${Number(x.open_request_count||0)>0?'yes':'no'}" data-text="${esc((source+' '+(x.reference||'')+' '+role+' '+(x.category||'')+' '+(x.description||'')+' '+(x.business_unit||'')).toLowerCase())}">${financeCanVerify()?`<td class="check-col">${bulkEligible?`<input class="finance-bulk" type="checkbox" value="${x.id}" aria-label="Select Finance #${x.id}">`:''}</td>`:''}<td>${esc(x.transaction_date||x.created_at||'')}</td><td data-no-i18n>${esc(x.business_unit||'')}</td><td><button class="link-btn" onclick="financeOpen(${x.id})"><b>${esc(source)}</b></button><div class="muted" data-no-i18n>${esc(x.description||'')}</div></td><td><b>${esc(t(role))}</b><div class="muted">${esc(x.category||'')}</div><span class="pill finance-role ${cashClass(x)}">${esc(t(cash))}</span></td><td><b>₩ ${money(amount)}</b>${x.original_currency&&x.original_currency!=='KRW'?`<div class="muted">${money(x.original_amount)} ${esc(x.original_currency)} @ ${esc(x.fx_rate||1)}</div>`:''}</td><td data-no-i18n>${esc(x.reference||'—')}</td><td>${linkedEvidence>0?`<span class="pill good">${esc(t(evidenceText))} · ${linkedEvidence}</span>`:hasEvidence?`<span class="pill good">${esc(t('Evidence'))} ${Number(x.attachment_count||0)+(x.receipt_file?1:0)}</span>`:`<span class="pill warn">⚠ ${esc(t(Number(x.cash_effect||0)===0?'Supporting Docs Missing':'Missing Evidence'))}</span>`}</td><td><span class="pill ${financeStatusClass(status)}">${esc(t(status))}</span>${Number(x.open_request_count||0)>0?`<div><span class="pill warn">${esc(t('Control Request Open'))}</span></div>`:''}</td><td><button class="btn small primary" onclick="financeOpen(${x.id})">${esc(t('Open Verification'))}</button></td></tr>`
  };

  function fixFinanceContext(){
    const c=document.getElementById('content');if(!c||view!=='finance')return;const pink=selectedName()==='Pink Salt';
    const search=document.getElementById('financeSearch');if(search)search.placeholder=pink?'Search import, supplier, order, customer, reference…':'Search source, reference, payment, customer/supplier…';
    const panel=document.getElementById('financeRecordsPanel');if(panel&&!panel.querySelector('.v302-finance-note'))panel.insertAdjacentHTML('afterbegin',`<div class="v302-finance-note"><div>✓</div><div><b>${esc(t('One business event = one source-linked Finance record'))}</b><span>${esc(t(pink?'Purchase created — no cash counted twice':'Operational records and their cash settlements are linked, not duplicated.'))} ${esc(t('Payment settles the linked payable'))}</span></div></div>`);
    const type=document.getElementById('financeTypeFilter');if(type&&type.options.length<=3){type.innerHTML=`<option value="">${esc(t('All types'))}</option><option value="Revenue">${esc(t('Revenue'))}</option><option value="Expense">${esc(t('Expense'))}</option><option value="Inventory">${esc(t('Inventory'))}</option><option value="Payment">${esc(t('Payment'))}</option><option value="Receipt">${esc(t('Receipt'))}</option><option value="Refund">${esc(t('Refund'))}</option><option value="Inventory Cost">${esc(t('Inventory Cost'))}</option>`}
    try{translateElement(c)}catch(_){ }
  }

  // Keep Advanced Accounting tab highlight synchronized with the body content.
  if(typeof window.accountingTabV29==='function'){
    const old=window.accountingTabV29;window.accountingTabV29=async function(x){await old(x);const tabs=document.querySelectorAll('.v290-tabs .btn');tabs.forEach(b=>b.classList.remove('active'));const map={overview:'Financial Control Center',journal:'General Ledger',accounts:'Chart of Accounts',cash:'Cash & Bank Accounts',reports:'Reports',reconciliation:'Bank Reconciliation',periods:'Accounting Periods',budgets:'Budgets',transfers:'Inter-BU Transfers'};for(const b of tabs){if((b.textContent||'').trim()===t(map[x]||map.overview)){b.classList.add('active');b.dataset.v302Active='1'}else delete b.dataset.v302Active}}
  }
  function syncAccountingActiveFromBody(){if(view!=='accounting')return;const body=document.getElementById('accountingV29Body');if(!body)return;const h=(body.querySelector('h3')?.textContent||'').trim(),tabs=[...document.querySelectorAll('.v290-tabs .btn')];if(!h||!tabs.length)return;tabs.forEach(b=>{const active=(b.textContent||'').trim()===h;b.classList.toggle('active',active);if(active)b.dataset.v302Active='1';else delete b.dataset.v302Active})}

  const baseLoad=window.loadView;if(typeof baseLoad==='function')window.loadView=async function(){const r=await baseLoad.apply(this,arguments);setTimeout(()=>{fixFinanceContext();syncAccountingActiveFromBody();pinkSaltContextCleanup()},0);return r};
  const baseRefresh=window.refreshCurrentView;if(typeof baseRefresh==='function')window.refreshCurrentView=async function(){const r=await baseRefresh.apply(this,arguments);setTimeout(()=>{fixFinanceContext();syncAccountingActiveFromBody();pinkSaltContextCleanup()},0);return r};

  function pinkSaltContextCleanup(){if(selectedName()!=='Pink Salt')return;const c=document.getElementById('content');if(!c)return;
    const replacements=[['Buyer Money Held in Advance','Customer Money Held in Advance'],['Buyer Advances','Customer Advances']];
    const walker=document.createTreeWalker(c,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const n of nodes){if(n.parentElement?.hasAttribute('data-no-i18n'))continue;let s=n.nodeValue;for(const [a,b] of replacements)s=s.replaceAll(a,t(b));n.nodeValue=s}
    const search=document.getElementById('financeSearch');if(search)search.placeholder='Search import, supplier, order, customer, reference…';
  }
  setTimeout(()=>{try{fixFinanceContext();syncAccountingActiveFromBody();pinkSaltContextCleanup()}catch(_){}},150);
  console.info('Blue Ocean Market V30.4.0 Finance integrity UI loaded');
})();
