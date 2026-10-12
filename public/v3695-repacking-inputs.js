/* Blue Ocean Market V30.69.5 — Pink Salt repacking actual-input + requirement integrity */
(()=>{
  'use strict';
  const n=v=>Number(v||0);
  try{Object.assign(KO,{
    'Actual Entered':'실제 입력량','Difference':'차이','Remaining to Allocate':'추가 배정 필요량',
    'Enter actual raw salt used':'실제 사용한 원염 중량을 입력하세요',
    'Actual input is entered manually and is never auto-filled from the theoretical requirement.':'실제 투입량은 사용자가 직접 입력하며 이론상 필요량에서 자동 입력되지 않습니다.',
    'Actual input changed after output requirements changed. Review the entered weight before completing.':'생산 요구량 변경 후 실제 투입량을 확인하세요.'
  })}catch(_){ }

  function productRequirementEntries(product, units){
    const result=new Map(),qtyUnits=n(units);
    if(!product||qtyUnits<=0)return result;
    const style=String(product.packaging_style||'');
    const components=Array.isArray(product.gift_components)?product.gift_components:[];
    if(style==='Gift Box / Set'&&components.length&&n(product.gift_pouch_weight_g)>0){
      for(const c of components){
        const grade=String(c.salt_grade||'').trim(),count=n(c.pouches_per_box);
        if(!grade||count<=0)continue;
        result.set(grade,(result.get(grade)||0)+(qtyUnits*count*n(product.gift_pouch_weight_g)/1000));
      }
      return result;
    }
    let multiplier=1;
    if(style==='Bulk Pack'){
      const bom=Array.isArray(product.bom)?product.bom:[];
      const pouchCount=bom.filter(x=>String(x.packaging_category||'')==='Pouch / Bag').reduce((sum,x)=>sum+n(x.quantity_per_unit),0);
      if(pouchCount>0)multiplier=pouchCount;
    }
    const grade=String(product.salt_grade||'').trim(),kg=qtyUnits*multiplier*n(product.pack_weight_g)/1000;
    if(grade&&kg>0)result.set(grade,kg);
    return result;
  }

  // Keep the browser calculation aligned with server/v309-calculations.js.
  window.psProdRequirements=function(){
    const map=new Map();
    for(const o of window.psProdOutputs||[]){
      const p=(window.psProdProducts||[]).find(x=>String(x.id)===String(o.product_id)),units=n(o.quantity_units);
      if(!p||units<=0)continue;
      for(const [grade,kg] of productRequirementEntries(p,units))map.set(grade,(map.get(grade)||0)+kg);
    }
    return map;
  };

  function inputActualByGrade(grade){
    return (window.psProdInputs||[]).filter(x=>x.salt_grade===grade).reduce((sum,x)=>sum+n(x.input_weight_kg),0);
  }
  function renderRequirementSummary(){
    const req=window.psProdRequirements(),summary=document.getElementById('psProdRequirements');
    if(!summary)return;
    if(!req.size){summary.innerHTML=`<span class="muted">${esc(t('No salt input is required until an output product and quantity are selected.'))}</span>`;return}
    summary.innerHTML=`<b>${esc(t('Salt required by selected outputs'))}</b><div class="v3695-requirement-list">${[...req].map(([g,kg])=>{
      const actual=inputActualByGrade(g),diff=actual-kg,remaining=Math.max(0,kg-actual);
      return `<div class="v3695-requirement-row"><span><b>${esc(g)}</b></span><span>${esc(t('Required Salt Weight'))}: <b>${qty(kg,3)} kg</b></span><span>${esc(t('Actual Entered'))}: <b>${actual>0?qty(actual,3)+' kg':'—'}</b></span><span>${esc(t('Difference'))}: <b>${actual>0?(diff>=0?'+':'')+qty(diff,3)+' kg':'—'}</b></span>${remaining>0&&actual>0?`<span>${esc(t('Remaining to Allocate'))}: <b>${qty(remaining,3)} kg</b></span>`:''}</div>`}).join('')}</div>`;
    translateElement(summary);
  }

  window.psRebuildProdInputs=function(){
    const req=window.psProdRequirements(),keep=[];
    for(const [grade] of req){
      const existing=(window.psProdInputs||[]).filter(x=>x.salt_grade===grade);
      if(existing.length)keep.push(...existing);
      else keep.push({salt_grade:grade,import_item_id:'',input_weight_kg:''}); // actual input is manual by design
    }
    window.psProdInputs=keep;
    renderRequirementSummary();
    window.psDrawProdInputs();
  };

  window.psProdInputChanged=function(index,value){
    if(!window.psProdInputs?.[index])return;
    window.psProdInputs[index].input_weight_kg=value;
    renderRequirementSummary();
  };

  window.psDrawProdInputs=function(){
    const el=document.getElementById('psProdInputs');if(!el)return;
    const req=window.psProdRequirements();
    el.innerHTML=(window.psProdInputs||[]).map((x,i)=>{
      const required=n(req.get(x.salt_grade)),actual=n(x.input_weight_kg),diff=actual-required;
      return `<div class="ps-line ps-raw-input"><div class="field"><label>${esc(t('Salt Grade / Category'))}</label><input value="${esc(x.salt_grade)}" readonly></div><div class="field"><label>${esc(t('Raw Salt Batch'))}</label><select onchange="psProdInputs[${i}].import_item_id=this.value"><option value="">—</option>${(window.psProdRaw||[]).filter(r=>r.salt_grade===x.salt_grade).map(r=>`<option value="${r.id}" ${String(x.import_item_id)===String(r.id)?'selected':''}>${esc(r.import_no)} · ${esc(r.salt_grade)} · ${qty(r.available_kg,3)} kg ${esc(t('Available'))}</option>`).join('')}</select></div><div class="field"><label>${esc(t('Actual Input Weight (kg)'))}</label><input type="number" step="0.001" min="0.001" value="${x.input_weight_kg||''}" placeholder="${esc(t('Enter actual raw salt used'))}" oninput="psProdInputChanged(${i},this.value)" onchange="psProdInputChanged(${i},this.value)"></div><button type="button" class="btn danger ps-remove" onclick="psProdInputs.splice(${i},1);psDrawProdInputs();renderV3695RequirementSummary()">×</button></div><div class="v3695-input-meta"><span>${esc(t('Required Salt Weight'))}: <b>${qty(required,3)} kg</b></span><span>${esc(t('Actual Entered'))}: <b>${actual>0?qty(actual,3)+' kg':'—'}</b></span><span>${esc(t('Difference'))}: <b>${actual>0?(diff>=0?'+':'')+qty(diff,3)+' kg':'—'}</b></span><button type="button" class="btn small" onclick="psAddProdInputByIndex(${i})">+ ${esc(t('Add Raw Batch'))}</button></div>`;
    }).join('')||`<div class="empty">${esc(t('No salt input is required until an output product and quantity are selected.'))}</div>`;
    translateElement(el);renderRequirementSummary();
  };
  window.renderV3695RequirementSummary=renderRequirementSummary;

  const oldAdd=window.psAddProdInputByIndex;
  if(oldAdd)window.psAddProdInputByIndex=function(i){oldAdd(i);const last=(window.psProdInputs||[]).length-1;if(last>=0&&window.psProdInputs[last])window.psProdInputs[last].input_weight_kg='';window.psDrawProdInputs()};

  const css=document.createElement('style');css.id='v3695-repacking-inputs';css.textContent=`
    .v3695-requirement-list{display:grid;gap:8px;margin-top:8px}.v3695-requirement-row{display:flex;gap:14px;flex-wrap:wrap;align-items:center;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:#fff}.v3695-input-meta{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin:-3px 0 10px;color:var(--muted);font-size:12px}.v3695-input-meta .btn{margin-left:auto}@media(max-width:700px){.v3695-input-meta .btn{margin-left:0}}
  `;document.head.appendChild(css);

  console.info('Blue Ocean Market V30.69.5 repacking input integrity loaded');
})();
