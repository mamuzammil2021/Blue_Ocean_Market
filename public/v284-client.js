// Blue Ocean Market V28.4.0 — global duplicate-submit protection and reusable statement UI.
(()=>{
'use strict';
const V='28.4.0',pending=new Map(),nativeFetch=window.fetch.bind(window);
const K={
  Statement:'명세서','Download PDF':'PDF 다운로드','Buyer Statement':'구매자 명세서','Supplier Statement':'공급업체 명세서','Financial Statement':'재무 명세서','Pakistan Resale Statement':'파키스탄 재판매 명세서','Statement Period':'명세 기간','From':'시작일','To':'종료일','Apply':'적용','Profile Summary':'프로필 요약','Opening Balance':'기초 잔액','Closing Balance':'기말 잔액','Total Debit':'총 차변','Total Credit':'총 대변','Total Company Share':'회사 지분 합계','Total Received':'총 수령액','Total Outstanding':'총 미수금','Machines with Resale Records':'재판매 기록 장비','Resale Recorded':'재판매 기록됨','Resale Not Recorded':'재판매 미기록','Partially Received':'일부 수령','Pending':'대기 중','Received':'수령 완료','Original Sale':'원 판매가','Pakistan Resale':'파키스탄 재판매가','Manual Profit':'수동 이익','Our Share':'당사 지분','Outstanding':'미수금','No machine is available for a new resale record. Every sold machine already has a resale record.':'새 재판매 기록을 추가할 장비가 없습니다. 판매된 모든 장비에 이미 재판매 기록이 있습니다.','Already recorded':'이미 기록됨','This action is already being processed. Please wait.':'이 작업은 이미 처리 중입니다. 잠시 기다려 주세요.'
};
const lang=()=>localStorage.getItem('bo_language')==='en'?'en':'ko';
const tx=s=>lang()==='ko'?(K[s]||s):s;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
function uuid(){return (crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2))}
function bodySignature(body){
  if(!body)return '';
  if(typeof body==='string')return body;
  if(body instanceof URLSearchParams)return body.toString();
  if(body instanceof FormData){const a=[];for(const [k,v] of body.entries())a.push(k+'='+(v instanceof File?`file:${v.name}:${v.size}:${v.lastModified}`:String(v)));return a.join('&')}
  return Object.prototype.toString.call(body);
}
window.fetch=function(input,init={}){
  const method=String(init.method||(input instanceof Request?input.method:'GET')||'GET').toUpperCase();
  if(!['POST','PUT','PATCH','DELETE'].includes(method))return nativeFetch(input,init);
  const url=typeof input==='string'?input:input.url,signature=method+'|'+url+'|'+bodySignature(init.body);
  const old=pending.get(signature);if(old)return old.then(r=>r.clone());
  const headers=new Headers(init.headers||(input instanceof Request?input.headers:undefined));
  if(!headers.has('X-Idempotency-Key'))headers.set('X-Idempotency-Key','bo-'+uuid());
  const promise=nativeFetch(input,{...init,headers});pending.set(signature,promise);
  promise.then(()=>setTimeout(()=>pending.delete(signature),1800),()=>pending.delete(signature));
  return promise.then(r=>r.clone());
};

// Disable only actual form submitters while an existing network mutation is in flight.
document.addEventListener('submit',e=>{const form=e.target;if(!(form instanceof HTMLFormElement))return;const b=e.submitter;if(!b)return;b.dataset.v284OldText=b.textContent;b.disabled=true;b.setAttribute('aria-busy','true');setTimeout(()=>{if(document.contains(b)){b.disabled=false;b.removeAttribute('aria-busy');if(b.dataset.v284OldText)b.textContent=b.dataset.v284OldText}},2500)},true);

function authHeaders(){const h=new Headers(),token=localStorage.getItem('bo_token'),unit=localStorage.getItem('bo_unit');if(token)h.set('Authorization','Bearer '+token);if(unit)h.set('X-Business-Unit-Id',unit);h.set('X-Language',lang());return h}
async function getJson(url){const r=await nativeFetch(url,{headers:authHeaders(),cache:'no-store'});let d={};try{d=await r.json()}catch(_){}if(!r.ok)throw new Error(d.error||'Unable to load statement');return d}
async function downloadPdf(url,name){const u=new URL(url,location.origin);u.searchParams.set('lang',lang());const r=await nativeFetch(u.toString(),{headers:authHeaders(),cache:'no-store'});if(!r.ok){let d={};try{d=await r.json()}catch(_){}throw new Error(d.error||'Unable to download PDF')}const blob=await r.blob(),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
function rangeQuery(from,to){const q=new URLSearchParams();if(from)q.set('from',from);if(to)q.set('to',to);return q.toString()?'?'+q:''}
function profileHtml(p){return `<div class="card" style="margin:10px 0"><h3>${esc(tx('Profile Summary'))}</h3><div class="grid g3">${Object.entries(p||{}).filter(([,v])=>v!==''&&v!=null).map(([k,v])=>`<div><small>${esc(k)}</small><b data-no-i18n>${esc(v)}</b></div>`).join('')}</div></div>`}
function summaryHtml(s){return `<div class="grid g4" style="margin:10px 0">${Object.entries(s||{}).map(([k,v])=>`<div class="card stat"><small>${esc(tx(k))}</small><b data-no-i18n>${typeof v==='number'?fmt(v):esc(v)}</b></div>`).join('')}</div>`}
function rowsHtml(rows){return `<div class="table-wrap"><table class="table"><tr><th>${esc(tx('Date'))}</th><th>${esc(tx('Description'))}</th><th>${esc(tx('Reference'))}</th><th>Debit</th><th>Credit</th><th>${esc(tx('Balance'))}</th></tr>${(rows||[]).map(r=>`<tr><td>${esc(String(r.date||'').slice(0,10))}</td><td>${esc(r.description||'')}${r.machine?`<div class="muted" data-no-i18n>${esc(r.machine)}</div>`:''}</td><td data-no-i18n>${esc(r.reference||'')}</td><td data-no-i18n>${r.debit?fmt(r.debit):'—'}</td><td data-no-i18n>${r.credit?fmt(r.credit):'—'}</td><td data-no-i18n><b>${fmt(r.balance)}</b></td></tr>`).join('')||'<tr><td colspan="6" class="empty">No transactions in this period.</td></tr>'}</table></div>`}
async function openStatement(endpoint,title,file){
  try{
    const today=new Date().toISOString().slice(0,10),from=new Date(new Date().setDate(new Date().getDate()-30)).toISOString().slice(0,10);
    const draw=async(f=from,t=today)=>{const d=await getJson(endpoint+rangeQuery(f,t));window.modal(`<div class="section-title"><div><h2>${esc(tx(title))}</h2><div class="muted">${esc(tx('Statement Period'))}: ${esc(f)} — ${esc(t)}</div></div><button class="btn" onclick="closeModal()">✕</button></div><div class="grid g3"><div class="field"><label>${esc(tx('From'))}</label><input id="v284StatementFrom" type="date" value="${esc(f)}"></div><div class="field"><label>${esc(tx('To'))}</label><input id="v284StatementTo" type="date" value="${esc(t)}"></div><div class="actions" style="align-items:end"><button class="btn" id="v284ApplyStatement">${esc(tx('Apply'))}</button><button class="btn primary" id="v284PdfStatement">${esc(tx('Download PDF'))}</button></div></div>${profileHtml(d.profile)}${summaryHtml(d.summary)}${rowsHtml(d.rows)}`,'wide');
      setTimeout(()=>{document.getElementById('v284ApplyStatement')?.addEventListener('click',()=>draw(document.getElementById('v284StatementFrom').value,document.getElementById('v284StatementTo').value));document.getElementById('v284PdfStatement')?.addEventListener('click',()=>downloadPdf(endpoint+'.pdf'+rangeQuery(document.getElementById('v284StatementFrom').value,document.getElementById('v284StatementTo').value),file).catch(e=>window.toast?.(e.message)))},0)};
    await draw();
  }catch(e){window.toast?.(e.message)}
}
window.v284FinanceStatement=()=>openStatement('/api/statements/finance','Financial Statement','blue-ocean-finance-statement.pdf');
window.v284BuyerStatement=id=>openStatement(`/api/excavator/buyers/${id}/statement`,'Buyer Statement',`buyer-${id}-statement.pdf`);
window.v284SupplierStatement=id=>openStatement(`/api/excavator/suppliers/${id}/statement`,'Supplier Statement',`supplier-${id}-statement.pdf`);
window.v284ResaleStatement=id=>openStatement(`/api/excavator/buyers/${id}/resale-statement`,'Pakistan Resale Statement',`buyer-${id}-pakistan-resale-statement.pdf`);

function addButton(container,label,handler,primary=false){if(!container||container.querySelector(`[data-v284="${label}"]`))return;const b=document.createElement('button');b.className='btn small'+(primary?' primary':'');b.dataset.v284=label;b.textContent=tx(label);b.onclick=handler;container.appendChild(b)}
function headingCard(text){return [...document.querySelectorAll('h1,h2,h3')].find(h=>h.textContent.trim()===text||h.textContent.includes(text))?.closest('.card')||null}
function financeEnhance(){const h=[...document.querySelectorAll('h1')].find(x=>/Finance|재무/.test(x.textContent));if(!h)return;const bar=h.closest('.titlebar');if(bar)addButton(bar,'Statement',()=>window.v284FinanceStatement(),true)}

async function enrichBuyerDetail(id){
  try{
    const [detail,resale]=await Promise.all([getJson(`/api/excavator/buyers/${id}`),detailCountry(id)]);void resale;
    const buyerCard=headingCard('Buyer Details');if(buyerCard){const actions=buyerCard.querySelector('.section-title')||buyerCard;addButton(actions,'Statement',()=>window.v284BuyerStatement(id))}
    const resaleCard=headingCard('Pakistan Resale Profit Share');if(!resaleCard)return;
    const data=await getJson(`/api/excavator/buyers/${id}/resale-statement`);
    const section=resaleCard.querySelector('.section-title')||resaleCard;addButton(section,'Statement',()=>window.v284ResaleStatement(id));addButton(section,'Download PDF',()=>downloadPdf(`/api/excavator/buyers/${id}/resale-statement.pdf`, `buyer-${id}-pakistan-resale-statement.pdf`).catch(e=>window.toast?.(e.message)));
    if(!resaleCard.querySelector('[data-v284-resale-summary]')){const wrap=document.createElement('div');wrap.dataset.v284ResaleSummary='1';wrap.innerHTML=summaryHtml({'Machines with Resale Records':Number(data.records?.length||0),'Total Company Share':Number(data.summary?.['Total Company Share']||0),'Total Received':Number(data.summary?.['Total Received']||0),'Total Outstanding':Number(data.summary?.['Total Outstanding']||0)})+`<div class="table-wrap"><table class="table"><tr><th>Machine / Deal</th><th>${esc(tx('Original Sale'))}</th><th>${esc(tx('Pakistan Resale'))}</th><th>${esc(tx('Manual Profit'))}</th><th>${esc(tx('Our Share'))}</th><th>${esc(tx('Received'))}</th><th>${esc(tx('Outstanding'))}</th><th>Status</th></tr>${(data.records||[]).map(r=>`<tr><td data-no-i18n>${esc(r.machine)}</td><td data-no-i18n>₩ ${fmt(r['Original Sale Price'])}</td><td data-no-i18n>PKR ${fmt(r['Pakistan Resale Price'])}</td><td data-no-i18n>PKR ${fmt(r['Manual Resale Profit'])}</td><td data-no-i18n>PKR ${fmt(r['Our Share'])}</td><td data-no-i18n>PKR ${fmt(r.Received)}</td><td data-no-i18n>PKR ${fmt(r.Outstanding)}</td><td><span class="pill ${r.Status==='Received'?'good':r.Status==='Partially Received'?'warn':'blue'}">${esc(tx(r.Status))}</span></td></tr>`).join('')}</table></div>`;const muted=resaleCard.querySelector('.muted');(muted||section).insertAdjacentElement('afterend',wrap)}
    const recordByAsset=new Map((data.records||[]).map(r=>[Number(r.asset_id),r]));const machinesCard=headingCard('Machines Sold');if(machinesCard){for(const row of machinesCard.querySelectorAll('.row')){const txt=row.textContent;const m=(detail.machines||[]).find(x=>txt.includes(x.asset_no));if(!m||row.querySelector('[data-v284-machine-resale]'))continue;const r=recordByAsset.get(Number(m.id)),badge=document.createElement('span');badge.dataset.v284MachineResale='1';badge.className='pill '+(r?(r.Status==='Received'?'good':'warn'):'blue');badge.style.marginLeft='8px';badge.textContent=r?`${tx('Resale Recorded')} · PKR ${fmt(r['Our Share'])} · ${tx(r.Status)}`:tx('Resale Not Recorded');row.appendChild(badge)}}
  }catch(e){console.warn('V28.4 buyer enrichment:',e.message)}
}
async function detailCountry(){return true}

function enhanceSupplierList(){for(const row of document.querySelectorAll('#excavatorSupplierTable tr[data-search]')){if(row.querySelector('[data-v284-supplier-statement]'))continue;const machines=[...row.querySelectorAll('button')].find(b=>(b.getAttribute('onclick')||'').includes('excavatorSupplierMachines('));if(!machines)continue;const m=(machines.getAttribute('onclick')||'').match(/excavatorSupplierMachines\((\d+)\)/);if(!m)continue;const b=document.createElement('button');b.className='btn small';b.dataset.v284SupplierStatement='1';b.textContent=tx('Statement');b.onclick=()=>window.v284SupplierStatement(Number(m[1]));row.lastElementChild?.appendChild(b)}}
function enhanceSupplierMachineModal(id){const h=[...document.querySelectorAll('h2')].find(x=>x.textContent.includes('Machines'));if(!h)return;const parent=h.parentElement;addButton(parent,'Statement',()=>window.v284SupplierStatement(id),true)}

const oldBuyerDetail=window.excavatorBuyerDetail;if(typeof oldBuyerDetail==='function')window.excavatorBuyerDetail=async function(id){const r=await oldBuyerDetail.apply(this,arguments);setTimeout(()=>enrichBuyerDetail(Number(id)),20);return r};
const oldResaleForm=window.excavatorBuyerResaleForm;if(typeof oldResaleForm==='function')window.excavatorBuyerResaleForm=async function(id,recordId){const r=await oldResaleForm.apply(this,arguments);if(recordId)return r;try{const d=await getJson(`/api/excavator/buyers/${id}`),used=new Set((d.resale_shares||[]).map(x=>Number(x.asset_id))),sel=document.querySelector('form select[name="asset_id"]');if(sel){for(const o of [...sel.options])if(used.has(Number(o.value)))o.remove();if(!sel.options.length){sel.disabled=true;const form=sel.closest('form'),submit=form?.querySelector('button[type="submit"],button.btn.primary:not([type="button"])');if(submit)submit.disabled=true;const n=document.createElement('div');n.className='review-warning';n.textContent=tx('No machine is available for a new resale record. Every sold machine already has a resale record.');sel.closest('.field')?.appendChild(n)}}}catch(e){console.warn('V28.4 resale form:',e.message)}return r};
const oldSuppliers=window.excavatorSuppliers;if(typeof oldSuppliers==='function')window.excavatorSuppliers=async function(){const r=await oldSuppliers.apply(this,arguments);setTimeout(enhanceSupplierList,20);return r};
const oldSupplierMachines=window.excavatorSupplierMachines;if(typeof oldSupplierMachines==='function')window.excavatorSupplierMachines=async function(id){const r=await oldSupplierMachines.apply(this,arguments);setTimeout(()=>enhanceSupplierMachineModal(Number(id)),20);return r};

const observer=new MutationObserver(()=>{financeEnhance();enhanceSupplierList()});observer.observe(document.documentElement,{childList:true,subtree:true});
window.BOM_V284={version:V,openStatement,duplicateSubmitProtection:true};
})();
