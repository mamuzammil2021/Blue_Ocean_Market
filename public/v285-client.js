// Blue Ocean Market V28.5.1 — system-wide UI/UX refinement layer.
(function(){
  'use strict';
  const VERSION='28.5.1';
  window.__BLUE_OCEAN_V285_ACTIVE=true;

  try{if(typeof KO!=='undefined')Object.assign(KO,{
    'Back to Buyers':'구매자 목록으로','Back to Supplier':'공급업체로','Back':'뒤로','Forward':'앞으로',
    'Pakistan Resale Summary':'파키스탄 재판매 요약','Machines with Records':'기록된 장비','Testing Login':'테스트 로그인',
    'e.g. Advance before purchase':'예: 구매 전 선결제','e.g. Akmal Abdullah':'예: 홍길동','e.g. +82 10-1234-5678':'예: +82 10-1234-5678',
    'e.g. buyer@example.com':'예: buyer@example.com','e.g. Talagang, Punjab':'예: 탈라강, 펀자브','e.g. Street, city, province / state':'예: 도로명, 도시, 지역',
    'e.g. BANK-2026-001':'예: BANK-2026-001','Add useful notes or context':'필요한 메모나 설명을 입력하세요','Describe what is required':'필요한 내용을 설명하세요',
    'e.g. Volvo EC220':'예: Volvo EC220','e.g. Volvo':'예: Volvo','e.g. EC220':'예: EC220','e.g. VCEC220ABC123':'예: VCEC220ABC123',
    'e.g. Seoul Heavy Equipment':'예: 서울 중장비','e.g. Payment for EX-2026-001':'예: EX-2026-001 결제','e.g. Monthly management meeting':'예: 월간 운영 회의',
    'e.g. Review finance, operations and pending decisions':'예: 재무, 운영 및 미결 사항 검토','Enter the expected result or acceptance criteria':'예상 결과 또는 완료 기준을 입력하세요',
    'e.g. https://meet.example.com/...':'예: https://meet.example.com/...','e.g. Customer / supplier / employee name':'예: 고객 / 공급업체 / 직원 이름'
  })}catch(_){ }

  const style=document.createElement('style');
  style.id='v285-ui';
  style.textContent=`
    /* Global page-header alignment */
    .titlebar{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:18px!important;flex-wrap:wrap!important}
    .titlebar>div:first-child{flex:1 1 460px;min-width:0}.v285-page-actions{margin-left:auto;display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap;flex:0 1 auto}
    .v285-page-actions>.btn{white-space:nowrap}.section-title{gap:12px;flex-wrap:wrap}.section-title>div:first-child,.section-title>h2,.section-title>h3{min-width:0}.v285-section-actions{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}

    /* Cards / KPIs / general detail readability */
    .card{overflow-wrap:anywhere}.card.stat{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:6px;min-height:128px}.card.stat small,.card.stat .label{display:block;color:var(--muted);font-weight:750;line-height:1.25}.card.stat>b,.card.stat .value{display:block;margin:0!important;font-size:28px;line-height:1.15;letter-spacing:-.02em;max-width:100%}.card.stat .hint{line-height:1.35}
    .grid>*,.card .grid>*{min-width:0}.card b,.card strong{overflow-wrap:anywhere}.card small{line-height:1.35}.row{gap:14px;align-items:flex-start}.row>span{min-width:0;overflow-wrap:anywhere}
    .table-wrap{border-radius:10px}.finance-filterbar{align-items:center}.finance-filterbar>*{min-height:44px}.finance-tabs{padding-bottom:3px}.finance-tabs .btn{white-space:nowrap}

    /* Modals / subviews */
    .modal{position:relative}.modal>.section-title:first-of-type{align-items:flex-start}.v285-modal-close{margin-left:0!important;flex:0 0 auto;min-width:46px;min-height:46px;display:inline-grid!important;place-items:center;padding:0!important;font-size:23px;line-height:1}.v285-modal-actions{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.v285-subview-nav{display:flex;align-items:center;gap:8px;margin:0 0 12px;padding:0 0 12px;border-bottom:1px solid var(--line)}.v285-subview-nav .btn{min-height:38px}.v285-subview-spacer{flex:1}

    /* Buyer detail */
    .v285-buyer-modal>.section-title:first-of-type{padding-bottom:4px}.v285-buyer-kpis{margin:14px 0 18px!important}.v285-buyer-kpis>.card{min-height:124px}.v285-buyer-detail-card .v285-detail-grid{gap:10px!important}.v285-buyer-detail-card .v285-detail-grid>div{display:flex;flex-direction:column;gap:5px;padding:11px 12px;border:1px solid var(--line);border-radius:10px;background:#fbfcfe;min-height:76px}.v285-buyer-detail-card .v285-detail-grid small{color:var(--muted);font-weight:750}.v285-buyer-detail-card .v285-detail-grid b{font-size:15px;line-height:1.35}.v285-divider{height:1px;background:var(--line);margin:8px 0 18px}.v285-resale-card{border-color:#cfe0f7!important;background:linear-gradient(180deg,#fbfdff,#f7fbff);box-shadow:0 8px 26px rgba(24,76,140,.06)!important}.v285-resale-card>.section-title{margin-bottom:8px}.v285-resale-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0}.v285-resale-summary-grid>div{padding:12px;border:1px solid #dbe7f6;border-radius:10px;background:#fff}.v285-resale-summary-grid small{display:block;color:var(--muted);font-weight:750;margin-bottom:5px}.v285-resale-summary-grid b{display:block;font-size:18px;line-height:1.25}.v285-resale-card>.card{background:#fff}.v285-resale-only-note{font-size:12px;color:var(--muted)}

    /* Contextual hints */
    input::placeholder,textarea::placeholder{color:#8994a7;opacity:1;font-weight:400}.field input,.field textarea,.field select{transition:border-color .15s ease,box-shadow .15s ease,background .15s ease}.field input:focus,.field textarea:focus,.field select:focus{background:#fff}.v285-hint-ready::placeholder{font-style:normal}

    /* Responsive */
    @media(max-width:900px){.titlebar{align-items:stretch!important}.titlebar>div:first-child{flex-basis:100%}.v285-page-actions{width:100%;justify-content:flex-start;margin-left:0}.v285-page-actions>.btn{flex:0 1 auto}.v285-resale-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.v285-modal-actions{margin-left:0}.v285-buyer-detail-card .v285-detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
    @media(max-width:560px){.v285-page-actions{display:grid;grid-template-columns:1fr 1fr}.v285-page-actions>.btn{width:100%}.v285-resale-summary-grid,.v285-buyer-detail-card .v285-detail-grid{grid-template-columns:minmax(0,1fr)!important}.v285-modal-actions{width:100%;justify-content:flex-start}.v285-modal-close{margin-left:auto!important}.v285-subview-nav{overflow-x:auto}.card.stat>b,.card.stat .value{font-size:24px}}
  `;
  document.head.appendChild(style);

  // V30.11 context integrity: hints must follow the selected business unit.
  // Explicit placeholders authored by a module are preserved and are never replaced by this generic helper.
  const EXCAVATOR_HINTS={
    payment_terms:['e.g. Advance before purchase','e.g. Advance before purchase'],contact_person:['e.g. Sales / yard contact','e.g. Sales / yard contact'],contact:['e.g. Sales / yard contact','e.g. Sales / yard contact'],
    phone:['e.g. +82 10-1234-5678','e.g. +82 10-1234-5678'],whatsapp:['e.g. +82 10-1234-5678','e.g. +82 10-1234-5678'],email:['e.g. supplier@example.com','e.g. supplier@example.com'],
    location:['e.g. Incheon, South Korea','e.g. Incheon, South Korea'],address:['e.g. Street, city, province / state','e.g. Street, city, province / state'],reference:['e.g. BANK-2026-001','e.g. BANK-2026-001'],
    notes:['Add Excavator-related notes or context','Add Excavator-related notes or context'],description:['e.g. Payment for EX-2026-001','e.g. Payment for EX-2026-001'],requirement:['Describe the required machine / deal','Describe the required machine / deal'],
    machine_name:['e.g. Volvo EC220','e.g. Volvo EC220'],make:['e.g. Volvo','e.g. Volvo'],model:['e.g. EC220','e.g. EC220'],serial_no:['e.g. VCEC220ABC123','e.g. VCEC220ABC123'],
    supplier:['e.g. Seoul Heavy Equipment','e.g. Seoul Heavy Equipment'],supplier_name:['e.g. Seoul Heavy Equipment','e.g. Seoul Heavy Equipment'],name:['e.g. Machine / buyer / supplier name','e.g. Machine / buyer / supplier name'],
    title:['e.g. Excavator operations review','e.g. Excavator operations review'],purpose:['e.g. Review purchases, repairs, sales and pending decisions','e.g. Review purchases, repairs, sales and pending decisions'],agenda:['e.g. Review purchases, repairs, sales and pending decisions','e.g. Review purchases, repairs, sales and pending decisions'],
    expected_result:['Enter the expected result or acceptance criteria','Enter the expected result or acceptance criteria'],meeting_link:['e.g. https://meet.example.com/...','e.g. https://meet.example.com/...'],online_link:['e.g. https://meet.example.com/...','e.g. https://meet.example.com/...']
  };
  const PINK_SALT_HINTS={
    payment_terms:['e.g. 30% advance, balance before shipment','e.g. 30% advance, balance before shipment'],contact_person:['e.g. Export / sales contact','e.g. Export / sales contact'],contact:['e.g. Export / sales contact','e.g. Export / sales contact'],
    phone:['e.g. +92 300 1234567','e.g. +92 300 1234567'],whatsapp:['e.g. +92 300 1234567','e.g. +92 300 1234567'],email:['e.g. sales@supplier.com','e.g. sales@supplier.com'],
    location:['e.g. Khewra, Punjab, Pakistan','e.g. Khewra, Punjab, Pakistan'],address:['e.g. Industrial Area, Khewra, Punjab, Pakistan','e.g. Industrial Area, Khewra, Punjab, Pakistan'],reference:['e.g. PK-SALT-2026-001','e.g. PK-SALT-2026-001'],
    notes:['Add Pink Salt-related notes or context','Add Pink Salt-related notes or context'],description:['e.g. Pink Salt import / packaging / production expense','e.g. Pink Salt import / packaging / production expense'],requirement:['Describe the required Pink Salt product / order','Describe the required Pink Salt product / order'],
    supplier:['e.g. Himalayan Salt Exporters','e.g. Himalayan Salt Exporters'],supplier_name:['e.g. Himalayan Salt Exporters','e.g. Himalayan Salt Exporters'],name:['e.g. Pink Salt product / supplier / customer name','e.g. Pink Salt product / supplier / customer name'],
    title:['e.g. Pink Salt operations review','e.g. Pink Salt operations review'],purpose:['e.g. Review imports, production, stock, sales and pending decisions','e.g. Review imports, production, stock, sales and pending decisions'],agenda:['e.g. Review imports, production, stock, sales and pending decisions','e.g. Review imports, production, stock, sales and pending decisions'],
    expected_result:['Enter the expected result or acceptance criteria','Enter the expected result or acceptance criteria'],meeting_link:['e.g. https://meet.example.com/...','e.g. https://meet.example.com/...'],online_link:['e.g. https://meet.example.com/...','e.g. https://meet.example.com/...']
  };
  const RESTAURANT_HINTS={
    payment_terms:['e.g. Weekly supplier settlement','e.g. Weekly supplier settlement'],contact_person:['e.g. Restaurant supplier contact','e.g. Restaurant supplier contact'],contact:['e.g. Restaurant supplier contact','e.g. Restaurant supplier contact'],
    phone:['e.g. +82 10-1234-5678','e.g. +82 10-1234-5678'],whatsapp:['e.g. +82 10-1234-5678','e.g. +82 10-1234-5678'],email:['e.g. supplier@example.com','e.g. supplier@example.com'],
    location:['e.g. Seoul, South Korea','e.g. Seoul, South Korea'],address:['e.g. Street, district, Seoul','e.g. Street, district, Seoul'],reference:['e.g. REST-2026-001','e.g. REST-2026-001'],
    notes:['Add restaurant-related notes or context','Add restaurant-related notes or context'],description:['e.g. Ingredient purchase / menu / service note','e.g. Ingredient purchase / menu / service note'],requirement:['Describe the menu / stock / service requirement','Describe the menu / stock / service requirement'],
    name:['e.g. Menu item / supplier / customer name','e.g. Menu item / supplier / customer name'],title:['e.g. Restaurant operations review','e.g. Restaurant operations review'],purpose:['e.g. Review menu, stock, POS and service issues','e.g. Review menu, stock, POS and service issues'],agenda:['e.g. Review menu, stock, POS and service issues','e.g. Review menu, stock, POS and service issues'],
    expected_result:['Enter the expected result or acceptance criteria','Enter the expected result or acceptance criteria'],meeting_link:['e.g. https://meet.example.com/...','e.g. https://meet.example.com/...'],online_link:['e.g. https://meet.example.com/...','e.g. https://meet.example.com/...']
  };
  const NEUTRAL_HINTS={
    payment_terms:['e.g. Agreed payment terms','e.g. Agreed payment terms'],contact_person:['e.g. Contact person name','e.g. Contact person name'],contact:['e.g. Contact person name','e.g. Contact person name'],
    phone:['e.g. Contact phone number','e.g. Contact phone number'],whatsapp:['e.g. WhatsApp number','e.g. WhatsApp number'],email:['e.g. contact@example.com','e.g. contact@example.com'],location:['e.g. City / region','e.g. City / region'],address:['e.g. Street, city, region','e.g. Street, city, region'],reference:['e.g. Reference number','e.g. Reference number'],
    notes:['Add relevant notes or context','Add relevant notes or context'],description:['Describe this record','Describe this record'],requirement:['Describe what is required','Describe what is required'],name:['e.g. Record name','e.g. Record name'],title:['e.g. Meeting / task title','e.g. Meeting / task title'],purpose:['Describe the purpose','Describe the purpose'],agenda:['Describe the agenda','Describe the agenda'],
    expected_result:['Enter the expected result or acceptance criteria','Enter the expected result or acceptance criteria'],meeting_link:['e.g. https://meet.example.com/...','e.g. https://meet.example.com/...'],online_link:['e.g. https://meet.example.com/...','e.g. https://meet.example.com/...']
  };
  function language(){try{return typeof currentLanguage!=='undefined'&&currentLanguage==='ko'?'ko':'en'}catch(_){return 'en'}}
  function selectedBusinessName(){try{return unitOptions?.find(x=>String(x.id)===String(selectedUnitId))?.name||''}catch(_){return ''}}
  function contextHints(){const name=selectedBusinessName();if(name==='Pink Salt')return PINK_SALT_HINTS;if(name==='Excavator')return EXCAVATOR_HINTS;if(name==='MIMI Resturant'||name==='MIMI Restaurant')return RESTAURANT_HINTS;return NEUTRAL_HINTS}
  function labelText(el){return String(el.closest('.field')?.querySelector('label')?.textContent||'').replace(/\*/g,'').trim().toLowerCase()}
  function hintFor(el){
    const hints=contextHints(),key=String(el.name||el.id||'').toLowerCase().replace(/[^a-z0-9_]/g,'_');
    let h=hints[key];
    if(!h){const label=labelText(el);for(const [k,v] of Object.entries(hints)){if(label.includes(k.replace(/_/g,' '))){h=v;break}}}
    if(!h&&el.tagName==='TEXTAREA')h=hints.notes||NEUTRAL_HINTS.notes;
    if(!h)return '';
    const raw=language()==='ko'?h[1]:h[0];try{return typeof t==='function'?t(raw):raw}catch(_){return raw}
  }
  function contextualExplicitPlaceholder(el){
    const name=selectedBusinessName(),key=String(el.name||el.id||'').trim();
    const byContext=name==='Pink Salt'?{
      financeSearch:'Search import, supplier, order, customer, reference…',
      related_entity_type:'import, supplier, product, order...',
      linked_records:'Task #, Import #, Product SKU, Order #, Finance record...'
    }:(name==='MIMI Resturant'||name==='MIMI Restaurant')?{
      financeSearch:'Search order, supplier, menu item, reference…',
      related_entity_type:'order, menu item, table, supplier...',
      linked_records:'Task #, Order #, Menu item, Table, Finance record...'
    }:name==='Excavator'?{}:{
      financeSearch:'Search source, reference, customer/supplier…',
      related_entity_type:'record type...',
      linked_records:'Task #, Record #, Finance record...'
    };
    const raw=byContext[key];if(!raw)return '';
    try{return typeof t==='function'?t(raw):raw}catch(_){return raw}
  }
  function applyHint(el){
    if(!el||el.dataset.v285HintBound==='1')return;
    if(!['INPUT','TEXTAREA'].includes(el.tagName))return;
    const type=String(el.type||'text').toLowerCase();if(['file','password','date','datetime-local','time','number','checkbox','radio','hidden','color','range'].includes(type))return;
    if(type==='search'&&el.placeholder)return;
    // Shared forms receive a business-unit-aware placeholder where the same field exists across units.
    const contextual=contextualExplicitPlaceholder(el);if(contextual){el.placeholder=contextual;el.dataset.v285HintBound='1';el.dataset.v285ExplicitPlaceholder='1';return}
    // Module-authored placeholders carry more precise workflow context. Never replace them.
    if(String(el.getAttribute('placeholder')||'').trim()){el.dataset.v285HintBound='1';el.dataset.v285ExplicitPlaceholder='1';return}
    const hint=hintFor(el);if(!hint)return;
    el.dataset.v285HintBound='1';el.dataset.v285Hint=hint;el.classList.add('v285-hint-ready');if(!el.value)el.placeholder=hint;
    el.addEventListener('focus',()=>{if(!el.value)el.placeholder=''});
    el.addEventListener('blur',()=>{if(!el.value){const fresh=hintFor(el)||el.dataset.v285Hint||'';el.dataset.v285Hint=fresh;el.placeholder=fresh}});
  }
  function refreshHints(root=document){root.querySelectorAll?.('input,textarea').forEach(el=>{if(el.dataset.v285ExplicitPlaceholder==='1')return;if(el.dataset.v285HintBound==='1'){const h=hintFor(el)||el.dataset.v285Hint||'';el.dataset.v285Hint=h;if(document.activeElement!==el&&!el.value)el.placeholder=h}else applyHint(el)})}

  function groupPageHeader(header){
    if(!header)return;
    const children=[...header.children];if(children.length<2)return;
    let actions=header.querySelector(':scope > .v285-page-actions');
    const rest=children.slice(1).filter(x=>x!==actions);
    if(!rest.length)return;
    if(!actions){actions=document.createElement('div');actions.className='v285-page-actions';header.appendChild(actions)}
    rest.forEach(x=>actions.appendChild(x));
  }
  function groupSectionActions(section){
    if(!section)return;
    let wrap=section.querySelector(':scope > .v285-section-actions');
    const direct=[...section.children];
    const actionEls=direct.filter((x,i)=>i>0&&x!==wrap&&!isCloseButton(x)&&!x.classList?.contains('v285-modal-actions')&&!x.classList?.contains('v285-page-actions')&&(x.matches?.('button,a.btn')||x.classList?.contains('actions')));
    if(!actionEls.length)return;
    if(!wrap){wrap=document.createElement('div');wrap.className='v285-section-actions';section.appendChild(wrap)}
    actionEls.forEach(x=>{
      if(x.classList?.contains('actions')){[...x.children].forEach(y=>{if(!isCloseButton(y))wrap.appendChild(y)});if(!x.children.length)x.remove()}
      else wrap.appendChild(x);
    });
  }
  function isCloseButton(btn){const txt=String(btn.textContent||'').trim(),onclick=String(btn.getAttribute('onclick')||'');return ['✕','×','X'].includes(txt)||(onclick.includes('closeModal')&&txt.length<=2)}
  function enhanceModal(box){
    if(!box)return;
    const header=[...box.children].find(x=>x.classList?.contains('section-title'))||box.querySelector('.section-title');
    if(!header)return;
    const close=[...box.querySelectorAll('button')].find(isCloseButton);
    if(close){
      close.classList.add('v285-modal-close');close.setAttribute('aria-label',language()==='ko'?'닫기':'Close');
      // Move only when needed. Re-appending an already-positioned button caused a MutationObserver loop in V28.5.0.
      if(close.parentElement!==header||header.lastElementChild!==close)header.appendChild(close);
    }
    groupSectionActions(header);
    // groupSectionActions intentionally excludes the close control; keep it as the final direct header child.
    if(close&&(close.parentElement!==header||header.lastElementChild!==close))header.appendChild(close);
  }
  function enhanceAll(root=document){
    root.querySelectorAll?.('.titlebar').forEach(groupPageHeader);
    root.querySelectorAll?.('.section-title').forEach(groupSectionActions);
    root.querySelectorAll?.('.modal').forEach(enhanceModal);
    refreshHints(root);
  }

  function pakistanBuyer(b){return String(b?.country||'').trim().toLowerCase()==='pakistan'}
  function moneySafe(v){try{return money(Number(v||0))}catch(_){return Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}}
  async function refineBuyerDetail(id){
    const root=document.getElementById('modalRoot');let box=root?.querySelector('.modal');if(!box)return;
    box.classList.add('v285-buyer-modal');box.dataset.v285BuyerId=String(id);
    const d=await api('/api/excavator/buyers/'+id);
    box=root?.querySelector('.modal');if(!box||String(box.dataset.v285BuyerId||'')!==String(id))return;
    const b=d.buyer||{};
    const topHeader=[...box.children].find(x=>x.classList?.contains('section-title'))||box.querySelector('.section-title');
    if(topHeader){
      const close=[...topHeader.querySelectorAll('button')].find(isCloseButton)||[...box.querySelectorAll('button')].find(isCloseButton);
      const statement=[...box.querySelectorAll('button')].find(x=>String(x.textContent||'').trim()===String(typeof t==='function'?t('Buyer Statement'):'Buyer Statement'))||box.querySelector('[data-v284-buyer-statement]');
      let actions=topHeader.querySelector('.v285-modal-actions');if(!actions){actions=document.createElement('div');actions.className='v285-modal-actions';topHeader.appendChild(actions)}
      if(statement)actions.appendChild(statement);if(close){close.classList.add('v285-modal-close');topHeader.appendChild(close)}
    }
    if(!box.querySelector('.v285-subview-nav')){
      const nav=document.createElement('div');nav.className='v285-subview-nav';nav.innerHTML=`<button class="btn small" onclick="closeModal()">← ${typeof t==='function'?esc(t('Back to Buyers')):'Back to Buyers'}</button><span class="v285-subview-spacer"></span>`;box.insertBefore(nav,box.firstChild);
    }
    const grids=[...box.children].filter(x=>x.classList?.contains('grid')&&x.classList.contains('g4'));const kpis=grids[0];if(kpis)kpis.classList.add('v285-buyer-kpis');
    const detailsCard=[...box.querySelectorAll('.card')].find(c=>String(c.querySelector('h3')?.textContent||'').trim()==='Buyer Details'||String(c.querySelector('h3')?.textContent||'').trim()===(typeof t==='function'?t('Buyer Details'):'Buyer Details'));
    if(detailsCard){detailsCard.classList.add('v285-buyer-detail-card');detailsCard.querySelector('.grid.g3')?.classList.add('v285-detail-grid')}

    // Remove V28.4 duplicate summary and all Pakistan-resale content for non-Pakistani buyers.
    box.querySelectorAll('[data-v284-resale-summary]').forEach(x=>x.remove());
    const resaleCards=[...box.querySelectorAll('.card')].filter(c=>String(c.querySelector('h3')?.textContent||'').trim()==='Pakistan Resale Profit Share'||String(c.querySelector('h3')?.textContent||'').trim()===(typeof t==='function'?t('Pakistan Resale Profit Share'):'Pakistan Resale Profit Share'));
    if(!pakistanBuyer(b)){resaleCards.forEach(x=>x.remove());box.querySelectorAll('.v285-divider[data-resale-divider]').forEach(x=>x.remove());return}
    const resale=resaleCards[0];if(!resale||!kpis)return;
    resaleCards.slice(1).forEach(x=>x.remove());resale.classList.add('v285-resale-card');
    let divider=box.querySelector('.v285-divider[data-resale-divider]');if(!divider){divider=document.createElement('div');divider.className='v285-divider';divider.dataset.resaleDivider='1'}
    kpis.insertAdjacentElement('afterend',divider);divider.insertAdjacentElement('afterend',resale);
    const shares=d.resale_shares||[],company=shares.reduce((n,x)=>n+Number(x.our_share_pkr||0),0),received=shares.reduce((n,x)=>n+Number(x.amount_received_pkr||0),0),outstanding=shares.reduce((n,x)=>n+Number(x.outstanding_pkr??Math.max(0,Number(x.our_share_pkr||0)-Number(x.amount_received_pkr||0))),0);
    let summary=resale.querySelector('.v285-resale-summary-grid');if(summary)summary.remove();summary=document.createElement('div');summary.className='v285-resale-summary-grid';summary.innerHTML=`<div><small>${esc(typeof t==='function'?t('Machines with Resale Records'):'Machines with Resale Records')}</small><b>${shares.length}</b></div><div><small>${esc(typeof t==='function'?t('Total Company Share'):'Total Company Share')}</small><b>PKR ${moneySafe(company)}</b></div><div><small>${esc(typeof t==='function'?t('Total Received'):'Total Received')}</small><b>PKR ${moneySafe(received)}</b></div><div><small>${esc(typeof t==='function'?t('Total Outstanding'):'Total Outstanding')}</small><b>PKR ${moneySafe(outstanding)}</b></div>`;
    const muted=resale.querySelector('.muted');if(muted)muted.insertAdjacentElement('afterend',summary);else resale.querySelector('.section-title')?.insertAdjacentElement('afterend',summary);
    const resaleHead=resale.querySelector('.section-title');if(resaleHead){
      const add=[...resaleHead.querySelectorAll('button')].find(x=>String(x.textContent||'').includes('Add Resale'));
      let view=resaleHead.querySelector('[data-v285-resale-statement]');if(!view){view=document.createElement('button');view.className='btn small';view.dataset.v285ResaleStatement='1';view.textContent=typeof t==='function'?t('View Statement'):'View Statement';view.onclick=()=>v284ResaleStatement(id)}
      let actions=resaleHead.querySelector('.v285-section-actions');if(!actions){actions=document.createElement('div');actions.className='v285-section-actions';resaleHead.appendChild(actions)}if(view)actions.appendChild(view);if(add)actions.appendChild(add);
    }
    enhanceAll(box);
  }

  if(typeof window.excavatorBuyerDetail==='function'){
    const previous=window.excavatorBuyerDetail;
    window.excavatorBuyerDetail=async function(id){const result=await previous(id);refineBuyerDetail(id).catch(e=>console.warn('V28.5 buyer layout:',e.message));return result};
  }

  // Useful Back navigation for nested statement views.
  if(typeof window.v284BuyerStatement==='function'){
    const buyerStatement=window.v284BuyerStatement;window.v284BuyerStatement=function(id){window.__v285StatementBack={label:'Back to Buyers',run:()=>excavatorBuyerDetail(id)};return buyerStatement(id)};
  }
  if(typeof window.v284ResaleStatement==='function'){
    const resaleStatement=window.v284ResaleStatement;window.v284ResaleStatement=function(id){window.__v285StatementBack={label:'Back to Buyers',run:()=>excavatorBuyerDetail(id)};return resaleStatement(id)};
  }
  if(typeof window.v284SupplierStatement==='function'){
    const supplierStatement=window.v284SupplierStatement;window.v284SupplierStatement=function(id){window.__v285StatementBack={label:'Back to Supplier',run:()=>excavatorSupplierMachines(id)};return supplierStatement(id)};
  }
  if(typeof window.v284FinanceStatement==='function'){
    const financeStatement=window.v284FinanceStatement;window.v284FinanceStatement=function(){window.__v285StatementBack=null;return financeStatement()};
  }

  function injectStatementBack(){
    const ctx=window.__v285StatementBack,box=document.querySelector('#modalRoot .modal');if(!ctx||!box||box.querySelector('.v285-statement-back'))return;
    const h=box.querySelector('.section-title');if(!h)return;const b=document.createElement('button');b.className='btn small v285-statement-back';b.textContent='← '+(typeof t==='function'?t(ctx.label):ctx.label);b.onclick=()=>{closeModal(true);ctx.run()};let nav=box.querySelector('.v285-subview-nav');if(!nav){nav=document.createElement('div');nav.className='v285-subview-nav';box.insertBefore(nav,box.firstChild)}nav.prepend(b);
  }

  // Keep close buttons on the right, page actions grouped, hints present, and nested navigation consistent as the SPA redraws.
  let queued=false;
  function scheduleEnhance(){
    if(queued)return;queued=true;
    const run=()=>{queued=false;try{enhanceAll(document);injectStatementBack()}catch(e){console.warn('V28.5 UI observer:',e.message)}};
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(run);else setTimeout(run,0);
  }
  const observer=new MutationObserver(mutations=>{if(mutations.some(m=>m.addedNodes&&m.addedNodes.length))scheduleEnhance()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  enhanceAll(document);

  try{if(typeof window.setLanguage==='function'){const old=window.setLanguage;window.setLanguage=function(...args){const r=old.apply(this,args);setTimeout(()=>refreshHints(document),20);return r}}}catch(_){ }
  console.info('Blue Ocean Market V28.5.1 UI refinement loaded');
})();
