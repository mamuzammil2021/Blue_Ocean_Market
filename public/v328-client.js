// Blue Ocean Market V30.28.0 — QA/data-integrity refinements.
(()=>{
'use strict';
const VERSION='30.28.0';
try{Object.assign(KO,{
  'Search country or code':'국가명 또는 국가번호 검색',
  'Type a country name or dialing code':'국가명 또는 국제전화 국가번호를 입력하세요',
  'Official Posted Accounting':'공식 전기 회계',
  'Revenue, expenses, assets and liabilities below are based on posted journals. Operational cards show current subledger balances and may differ while Finance verification or Posting Control is pending.':'아래의 수익, 비용, 자산 및 부채는 전기 완료된 분개를 기준으로 합니다. 운영 카드는 현재 보조원장 잔액을 표시하며 재무 검증 또는 전기 통제 대기 중에는 차이가 있을 수 있습니다.',
  'Buyer Advances · Operational':'구매자 선수금 · 운영 잔액',
  'Supplier Payable · Operational':'공급업체 미지급금 · 운영 잔액',
  'Excavator Buyer Advances · Operational':'굴착기 구매자 선수금 · 운영 잔액',
  'Excavator Supplier Payable · Operational':'굴착기 공급업체 미지급금 · 운영 잔액',
  'Liabilities · Posted':'부채 · 전기 완료',
  'Equity · Posted':'자본 · 전기 완료',
  'Posted GL':'전기된 총계정원장',
  'Posting / reconciliation pending':'전기 / 조정 대기',
  'Machine Inventory / Capitalized Costs':'장비 재고 / 자본화 원가',
  'Excavator Machine Inventory / Capitalized Costs':'굴착기 장비 재고 / 자본화 원가',
  'unsold machines':'미판매 장비',
  'Pending Accounting':'회계 전기 대기',
  'Pending Review / Correction Required':'검토 대기 / 수정 필요',
  'Finance Awaiting Verification':'재무 검증 대기',
  'Accounting integrity controls':'회계 무결성 통제',
  'Pre-sale machine costs are capitalized into Excavator Inventory. They move to COGS / Expense when the machine sale is completed.':'판매 전 장비 원가는 굴착기 재고에 자본화됩니다. 장비 판매가 완료되면 매출원가 / 비용으로 이동합니다.'
})}catch(_){ }

const css=document.createElement('style');css.id='v328-style';css.textContent=`
.v328-country-search-wrap{display:grid;gap:5px;min-width:0}.v328-country-search{width:100%;min-width:0;font-size:13px}.v328-country-search::placeholder{color:var(--muted)}
.v326-invalid-field label{color:#b42318!important}.v326-invalid-field input,.v326-invalid-field select,.v326-invalid-field textarea{outline:2px solid rgba(220,38,38,.10)}
`;document.head.appendChild(css);

function enhanceCountryCodeSearch(select){
  if(!select||select.dataset.v328Search==='1')return;select.dataset.v328Search='1';
  const source=[...select.options].map(o=>({value:o.value,text:o.textContent||'',dial:o.dataset.dial||''}));
  if(!source.length)return;
  const parent=select.parentElement;if(!parent)return;
  const box=document.createElement('div');box.className='v328-country-search-wrap';
  const search=document.createElement('input');search.type='search';search.className='v328-country-search';search.placeholder=t('Search country or code');search.setAttribute('aria-label',t('Type a country name or dialing code'));search.autocomplete='off';
  select.before(box);box.append(search,select);
  const render=()=>{
    const q=String(search.value||'').trim().toLowerCase().replace(/\s+/g,' '),current=select.value;
    const matches=!q?source:source.filter(x=>x.text.toLowerCase().includes(q)||x.value.toLowerCase().includes(q)||('+'+x.dial).includes(q)||x.dial===q.replace(/^\+/,''));
    select.innerHTML='';for(const x of matches){const o=document.createElement('option');o.value=x.value;o.textContent=x.text;o.dataset.dial=x.dial;select.appendChild(o)}
    if(matches.some(x=>x.value===current))select.value=current;else if(matches.length){select.value=matches[0].value;select.dispatchEvent(new Event('change',{bubbles:true}))}
  };
  search.addEventListener('input',render);search.addEventListener('keydown',e=>{if(e.key==='Escape'){search.value='';render();search.blur()}if(e.key==='Enter'){e.preventDefault();select.focus()}});
}
function enhanceCountrySearches(root=document){root.querySelectorAll?.('select.v321-country-code').forEach(enhanceCountryCodeSearch)}

// Defensive dedupe in case several legacy enhancement passes touch Buyer Detail.
function dedupePakistanResales(root=document){
  const wf=document.getElementById('v324WorkflowSurface');if(!wf)return;
  const header=wf.querySelector('.section-title .actions');if(!header)return;
  const buttons=[...header.querySelectorAll('button')].filter(b=>String(b.textContent||'').trim()===t('Pakistan Resales')||String(b.textContent||'').trim()==='Pakistan Resales'||b.dataset.v327PakistanResales==='1');
  buttons.slice(1).forEach(b=>b.remove());
}

// Keep required-field error styling synchronized while the user corrects Sell Machine fields.
document.addEventListener('input',e=>{const f=e.target.closest?.('#excavatorSaleForm .field');if(f&&e.target.checkValidity?.())f.classList.remove('v326-invalid-field')},true);
document.addEventListener('change',e=>{const f=e.target.closest?.('#excavatorSaleForm .field');if(f&&e.target.checkValidity?.())f.classList.remove('v326-invalid-field')},true);

const obs=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1){enhanceCountrySearches(n);dedupePakistanResales(n)}});obs.observe(document.documentElement,{childList:true,subtree:true});enhanceCountrySearches(document);dedupePakistanResales(document);
console.info(`Blue Ocean Market V${VERSION} QA/data-integrity UI loaded`);window.__BOM_V328={version:VERSION};
})();
