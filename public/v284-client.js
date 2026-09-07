// Blue Ocean Market V28.4.0 — local-test extension
// Global duplicate-submit protection + financial statements + Pakistan resale integrity.
(function(){
  'use strict';
  const VERSION='28.4.0';
  const pending=new Map();
  const realFetch=window.fetch.bind(window);

  function tinyHash(input){let h=2166136261>>>0;for(let i=0;i<input.length;i++){h^=input.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')}
  function bodySignature(body){
    if(body==null)return '';
    if(typeof body==='string')return body;
    if(body instanceof URLSearchParams)return body.toString();
    if(body instanceof FormData){const parts=[];for(const [k,v] of body.entries()){if(v instanceof File)parts.push(`${k}=file:${v.name}:${v.size}:${v.type}:${v.lastModified}`);else parts.push(`${k}=${String(v)}`)}return parts.join('&')}
    try{return JSON.stringify(body)}catch(_){return String(body)}
  }
  function headerValue(headers,name){try{return new Headers(headers||{}).get(name)||''}catch(_){return ''}}
  window.fetch=async function v284Fetch(input,init={}){
    const url=typeof input==='string'?input:String(input?.url||input||''),method=String(init.method||input?.method||'GET').toUpperCase();
    const mutation=url.includes('/api/')&&['POST','PUT','PATCH','DELETE'].includes(method)&&!url.includes('/api/auth/');
    if(!mutation)return realFetch(input,init);
    const bodySig=bodySignature(init.body),ceo=headerValue(init.headers,'X-CEO-Confirmed'),user=typeof me!=='undefined'&&me?.id?me.id:0;
    const signature=`${user}|${method}|${url}|${ceo}|${bodySig}`,fingerprint=`v284-${tinyHash(signature)}`;
    if(pending.has(signature)){
      const response=await pending.get(signature);return response.clone();
    }
    const headers=new Headers(init.headers||{});
    if(!headers.has('X-Idempotency-Key'))headers.set('X-Idempotency-Key',`v284-${user}-${Date.now()}-${Math.random().toString(36).slice(2,12)}`);
    headers.set('X-Request-Fingerprint',fingerprint);
    const promise=realFetch(input,{...init,headers}).then(r=>{setTimeout(()=>pending.delete(signature),2500);return r}).catch(e=>{pending.delete(signature);throw e});
    pending.set(signature,promise);
    const response=await promise;return response.clone();
  };

  try{if(typeof KO!=='undefined')Object.assign(KO,{
    'Statement':'명세서','View Statement':'명세서 보기','Financial Statement':'재무 명세서','Buyer Statement':'구매자 명세서','Supplier Statement':'공급업체 명세서','Pakistan Resale Profit Share Statement':'파키스탄 재판매 이익 배분 명세서','Statement Period':'명세 기간','From':'시작일','To':'종료일','Apply':'적용','Download PDF':'PDF 다운로드','Profile Summary':'프로필 요약','Opening Balance':'기초 잔액','Closing Balance':'기말 잔액','Total Debit':'총 차변','Total Credit':'총 대변','Total Paid':'총 수령액','Allocated':'배정액','Refunded':'환불액','Available Advance':'사용 가능 선급금','Machines Sold':'판매 장비','Machines Purchased':'구매 장비','Total Purchases':'총 구매액','Total Paid to Supplier':'공급업체 지급액','Outstanding Payable':'미지급금','Total Company Share':'회사 지분 합계','Total Received':'총 수령액','Total Outstanding':'총 미수금','Machines with Resale Records':'재판매 기록 장비','Original Sale':'원 판매','Pakistan Resale':'파키스탄 재판매','Manual Profit':'수동 이익','Resale Recorded':'재판매 기록됨','Resale Not Recorded':'재판매 미기록','Every sold machine already has a resale record.':'판매 완료된 모든 장비에 이미 재판매 기록이 있습니다.','Duplicate submission prevented.':'중복 제출이 방지되었습니다.','A Pakistan resale profit-share record already exists for this machine. Edit the existing record instead.':'이 장비에는 이미 파키스탄 재판매 이익 배분 기록이 있습니다. 기존 기록을 수정하세요.','Select a sold machine that belongs to this buyer.':'이 구매자에게 판매 완료된 장비를 선택하세요.','This buyer appears to have just been added already. Open the existing buyer instead of creating a duplicate.':'이 구매자가 방금 이미 추가된 것으로 보입니다. 중복 생성 대신 기존 구매자 기록을 여세요.','This action is already being processed. Please wait.':'이 작업은 이미 처리 중입니다. 잠시 기다려 주세요.','You cannot access another business unit buyer':'다른 사업부의 구매자에 접근할 수 없습니다.','You cannot access another business unit supplier':'다른 사업부의 공급업체에 접근할 수 없습니다.'})}catch(_){ }

  const style=document.createElement('style');style.id='v284-ui';style.textContent=`
    .v284-statement-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.v284-statement-actions input{min-height:42px;border:1px solid var(--line);border-radius:9px;padding:8px 10px}.v284-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:12px 0}.v284-summary-grid .card b{display:block;font-size:18px;margin-top:5px;overflow-wrap:anywhere}.v284-profile-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.v284-profile-grid>div{border:1px solid var(--line);border-radius:10px;padding:10px;min-width:0}.v284-profile-grid small{display:block;color:var(--muted);font-weight:700;margin-bottom:4px}.v284-profile-grid b{overflow-wrap:anywhere}.v284-resale-summary{border-color:#d4e4f8;background:#f8fbff}.v284-resale-machine-grid{display:grid;gap:8px;margin-top:10px}.v284-resale-machine{display:grid;grid-template-columns:1.2fr repeat(4,minmax(100px,.8fr));gap:8px;align-items:center;padding:10px;border:1px solid var(--line);border-radius:10px;background:#fff}.v284-resale-machine small{display:block;color:var(--muted)}
    @media(max-width:900px){.v284-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.v284-profile-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.v284-resale-machine{grid-template-columns:1fr 1fr}.v284-statement-actions{width:100%}}
    @media(max-width:560px){.v284-summary-grid,.v284-profile-grid,.v284-resale-machine{grid-template-columns:1fr}.v284-statement-actions>*{flex:1 1 100%}}
  `;document.head.appendChild(style);

  function statementCurrency(d,v){const c=d.currency||'KRW';return c==='KRW'?`₩ ${money(v)}`:`${c} ${money(v)}`}
  function statementUrl(base){const from=document.getElementById('v284StatementFrom')?.value||'',to=document.getElementById('v284StatementTo')?.value||'',q=new URLSearchParams();if(from)q.set('from',from);if(to)q.set('to',to);return base+(q.toString()?'?'+q.toString():'')}
  function statementHtml(d){
    const profile=Object.entries(d.profile||{}).filter(([,v])=>v!==''&&v!=null).map(([k,v])=>`<div><small>${esc(t(k))}</small><b data-no-i18n>${esc(v)}</b></div>`).join('');
    const countKeys=new Set(['Machines Sold','Machines Purchased']);const summary=Object.entries(d.summary||{}).map(([k,v])=>`<div class="card"><small>${esc(t(k))}</small><b>${typeof v==='number'?(countKeys.has(k)?money(v):statementCurrency(d,v)):esc(t(String(v)))}</b></div>`).join('');
    const rows=(d.rows||[]).map(r=>`<tr><td data-no-i18n>${esc(r.date||'')}</td><td><b>${esc(t(r.description||''))}</b>${r.machine?`<div class="muted" data-no-i18n>${esc(r.machine)}</div>`:''}</td><td data-no-i18n>${esc(r.reference||'')}</td><td>${r.debit?statementCurrency(d,r.debit):'—'}</td><td>${r.credit?statementCurrency(d,r.credit):'—'}</td><td><b>${statementCurrency(d,r.balance)}</b></td></tr>`).join('');
    return `<div class="section-title"><div><h2>${esc(t(d.title||'Statement'))}</h2><div class="muted">${esc(t('Statement Period'))}: <span data-no-i18n>${esc(d.period?.from||'Beginning')} → ${esc(d.period?.to||'Current')}</span></div></div><button class="btn" onclick="closeModal()">✕</button></div><div class="v284-statement-actions"><label>${esc(t('From'))} <input id="v284StatementFrom" type="date" value="${esc(d.period?.from||'')}"></label><label>${esc(t('To'))} <input id="v284StatementTo" type="date" value="${esc(d.period?.to||'')}"></label><button class="btn primary" onclick="v284ReloadStatement()">${esc(t('Apply'))}</button><button class="btn" onclick="v284DownloadStatementPdf()">${esc(t('Download PDF'))}</button></div>${profile?`<div class="card" style="margin-top:12px"><h3>${esc(t('Profile Summary'))}</h3><div class="v284-profile-grid">${profile}</div></div>`:''}<div class="v284-summary-grid">${summary}</div><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>${esc(t('Date'))}</th><th>${esc(t('Description'))}</th><th>${esc(t('Reference'))}</th><th>${esc(t('Debit'))}</th><th>${esc(t('Credit'))}</th><th>${esc(t('Balance'))}</th></tr></thead><tbody>${rows||`<tr><td colspan="6" class="empty">${esc(t('No records.'))}</td></tr>`}</tbody></table></div></div>`;
  }
  window.v284StatementContext=null;
  window.v284OpenStatement=async function(endpoint,pdfEndpoint){try{window.v284StatementContext={endpoint,pdfEndpoint};const d=await api(statementUrl(endpoint));modal(statementHtml(d),'wide');translateElement(document.getElementById('modalRoot'))}catch(e){toast(e.message)}};
  window.v284ReloadStatement=async function(){const c=window.v284StatementContext;if(!c)return;try{const d=await api(statementUrl(c.endpoint));const from=document.getElementById('v284StatementFrom')?.value||'',to=document.getElementById('v284StatementTo')?.value||'';d.period=d.period||{};d.period.from=from;d.period.to=to;modal(statementHtml(d),'wide');translateElement(document.getElementById('modalRoot'))}catch(e){toast(e.message)}};
  window.v284DownloadStatementPdf=async function(){const c=window.v284StatementContext;if(!c)return;try{let url=statementUrl(c.pdfEndpoint),sep=url.includes('?')?'&':'?';url+=`${sep}lang=${encodeURIComponent(currentLanguage==='en'?'en':'ko')}`;const headers={'X-Language':currentLanguage==='en'?'en':'ko'};if(token)headers.Authorization='Bearer '+token;if(me?.role==='CEO / Owner'&&selectedUnitId)headers['X-Business-Unit-ID']=selectedUnitId;else if(me?.role!=='CEO / Owner'&&me?.business_unit_id)headers['X-Business-Unit-ID']=me.business_unit_id;const r=await realFetch(url,{headers});if(!r.ok){let d={};try{d=await r.json()}catch{}throw new Error(d.error||'PDF could not be generated')}const blob=await r.blob(),href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download=(c.pdfEndpoint.split('/').filter(Boolean).slice(-2).join('_')||'statement')+'.pdf';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),5000)}catch(e){toast(e.message)}};
  window.v284FinanceStatement=()=>v284OpenStatement('/api/statements/finance','/api/statements/finance.pdf');
  window.v284BuyerStatement=id=>v284OpenStatement(`/api/excavator/buyers/${id}/statement`,`/api/excavator/buyers/${id}/statement.pdf`);
  window.v284SupplierStatement=id=>v284OpenStatement(`/api/excavator/suppliers/${id}/statement`,`/api/excavator/suppliers/${id}/statement.pdf`);
  window.v284ResaleStatement=id=>v284OpenStatement(`/api/excavator/buyers/${id}/resale-statement`,`/api/excavator/buyers/${id}/resale-statement.pdf`);

  if(typeof window.finance==='function'){
    const originalFinance=window.finance;
    window.finance=async function(c){const r=await originalFinance(c);try{const titlebar=c?.querySelector('.titlebar');if(titlebar&&!titlebar.querySelector('[data-v284-finance-statement]')){const b=document.createElement('button');b.className='btn';b.dataset.v284FinanceStatement='1';b.textContent=t('Financial Statement');b.onclick=()=>v284FinanceStatement();titlebar.appendChild(b);translateElement(titlebar)}}catch(e){console.warn('V28.4 Finance statement button:',e.message)}return r};
  }

  if(typeof window.excavatorBuyerDetail==='function'){
    const originalBuyerDetail=window.excavatorBuyerDetail;
    window.excavatorBuyerDetail=async function(id){
      const r=await originalBuyerDetail(id);
      try{
        const root=document.getElementById('modalRoot'),modalBox=root?.querySelector('.modal');
        if(!modalBox)return r;
        const head=modalBox.querySelector('.section-title');
        if(head&&!head.querySelector('[data-v284-buyer-statement]')){
          const actions=document.createElement('div');actions.className='actions';actions.style.marginTop='0';
          actions.innerHTML=`<button class="btn small" data-v284-buyer-statement onclick="v284BuyerStatement(${Number(id)})">${esc(t('Buyer Statement'))}</button>`;
          head.appendChild(actions);
        }
        if(window.__BLUE_OCEAN_V285_ACTIVE)return r;
        const d=await api('/api/excavator/buyers/'+id);
        if(d.resale_profit_eligible){
          const shares=d.resale_shares||[],share=shares.reduce((n,x)=>n+Number(x.our_share_pkr||0),0),received=shares.reduce((n,x)=>n+Number(x.amount_received_pkr||0),0),outstanding=Math.max(0,share-received);
          if(!modalBox.querySelector('[data-v284-resale-summary]')){
            const section=document.createElement('section');section.className='card v284-resale-summary';section.dataset.v284ResaleSummary='1';section.style.marginBottom='12px';
            section.innerHTML=`<div class="section-title"><div><h3>${esc(t('Pakistan Resale Profit Share'))}</h3><div class="muted">${shares.length} ${esc(t('Machines with Resale Records'))}</div></div><button class="btn small" onclick="v284ResaleStatement(${Number(id)})">${esc(t('View Statement'))}</button></div><div class="grid g3"><div><small>${esc(t('Total Company Share'))}</small><b>PKR ${money(share)}</b></div><div><small>${esc(t('Total Received'))}</small><b>PKR ${money(received)}</b></div><div><small>${esc(t('Total Outstanding'))}</small><b>PKR ${money(outstanding)}</b></div></div><div class="v284-resale-machine-grid">${shares.map(x=>`<div class="v284-resale-machine"><div><b data-no-i18n>${esc(x.asset_no||'')} · ${esc(x.machine_name||'Machine')}</b><small>${esc(t(x.received?'Received':'Outstanding'))}</small></div><div><small>${esc(t('Original Sale'))}</small><b>₩ ${money(x.selling_price||0)}</b></div><div><small>${esc(t('Pakistan Resale'))}</small><b>PKR ${money(x.resale_price_pkr||0)}</b></div><div><small>${esc(t('Manual Profit'))}</small><b>PKR ${money(x.resale_profit_pkr||0)}</b></div><div><small>${esc(t('Outstanding'))}</small><b>PKR ${money(x.outstanding_pkr||Math.max(0,Number(x.our_share_pkr||0)-Number(x.amount_received_pkr||0)))}</b></div></div>`).join('')||`<div class="muted">${esc(t('No records.'))}</div>`}</div>`;
            const firstCard=modalBox.querySelector('.card');if(firstCard?.parentNode)firstCard.parentNode.insertBefore(section,firstCard);else modalBox.appendChild(section);
          }
        }
        translateElement(modalBox);
      }catch(e){console.warn('V28.4 Buyer enhancements:',e.message)}
      return r;
    };
  }

  if(typeof window.excavatorBuyerResaleForm==='function'){
    const originalResaleForm=window.excavatorBuyerResaleForm;
    window.excavatorBuyerResaleForm=async function(id,recordId){const r=await originalResaleForm(id,recordId);if(recordId)return r;try{const d=await api('/api/excavator/buyers/'+id),used=new Set((d.resale_shares||[]).map(x=>Number(x.asset_id))),select=document.querySelector('#modalRoot form [name="asset_id"]');if(select){[...select.options].forEach(o=>{if(used.has(Number(o.value)))o.remove()});if(!select.options.length){select.disabled=true;const form=select.closest('form'),submit=form?.querySelector('button[type="submit"],.btn.primary');if(submit)submit.disabled=true;const note=document.createElement('div');note.className='review-warning';note.textContent=t('Every sold machine already has a resale record.');select.closest('.field')?.appendChild(note)}}}catch(e){console.warn('V28.4 resale selector:',e.message)}return r};
  }

  if(typeof window.excavatorSupplierMachines==='function'){
    const originalSupplierMachines=window.excavatorSupplierMachines;
    window.excavatorSupplierMachines=async function(id){const r=await originalSupplierMachines(id);try{const modalBox=document.querySelector('#modalRoot .modal');if(modalBox&&!modalBox.querySelector('[data-v284-supplier-statement]')){const h=modalBox.querySelector('h2');if(h){const b=document.createElement('button');b.className='btn small';b.dataset.v284SupplierStatement='1';b.textContent=t('Supplier Statement');b.onclick=()=>v284SupplierStatement(id);h.insertAdjacentElement('afterend',b)}}}catch(e){console.warn('V28.4 Supplier statement button:',e.message)}return r};
  }

  console.info('Blue Ocean Market V28.4.0 client controls loaded');
})();
