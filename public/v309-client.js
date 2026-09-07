// Blue Ocean Market V30.9.0 — packaging composition integrity and carton raw-salt calculations.
(()=>{
  const n=v=>Number(v||0);
  Object.assign(KO,{
    'A gift box requires at least one salt category.':'선물 상자에는 최소 한 개의 소금 카테고리가 필요합니다.',
    'A gift box must contain more than one pouch.':'선물 상자에는 두 개 이상의 파우치가 들어가야 합니다.',
    'Each gift-box salt category can only be added once.':'선물 상자의 각 소금 카테고리는 한 번만 추가할 수 있습니다.',
    'Gift-box pouches per category must be a whole number.':'선물 상자의 카테고리별 파우치 수는 정수여야 합니다.',
    'Raw salt requirements are calculated from the complete finished-product composition, including carton pouch count and gift-box categories.':'필요 원소금은 카톤 파우치 수와 선물 상자 카테고리를 포함한 완제품 전체 구성으로 계산됩니다.',
    'Salt per Finished Unit':'완제품 단위당 소금 중량',
    'pouches':'파우치'
  });

  function bulkPouchCount(p){
    if(!p||p.packaging_style!=='Bulk Pack')return 0;
    return (p.bom||[]).filter(b=>String(b.packaging_category||'')==='Pouch / Bag').reduce((sum,b)=>sum+n(b.quantity_per_unit),0);
  }
  function productRequirementLines(p,units){
    const rows=[];
    if(!p||units<=0)return rows;
    if(p.packaging_style==='Gift Box / Set'&&Array.isArray(p.gift_components)&&p.gift_components.length){
      for(const c of p.gift_components){
        const kg=units*n(c.pouches_per_box)*n(p.gift_pouch_weight_g)/1000;
        if(c.salt_grade&&kg>0)rows.push([c.salt_grade,kg]);
      }
    }else{
      const pouches=bulkPouchCount(p),multiplier=pouches>0?pouches:1;
      const kg=units*multiplier*n(p.pack_weight_g)/1000;
      if(p.salt_grade&&kg>0)rows.push([p.salt_grade,kg]);
    }
    return rows;
  }

  // The production form and the backend now share the same carton/gift-box calculation rule.
  window.psProdRequirements=function(){
    const map=new Map();
    for(const o of window.psProdOutputs||[]){
      const p=(window.psProdProducts||[]).find(x=>String(x.id)===String(o.product_id)),units=n(o.quantity_units);
      for(const [grade,kg] of productRequirementLines(p,units))map.set(grade,(map.get(grade)||0)+kg);
    }
    return map;
  };

  const oldProductionForm=window.psProductionForm;
  if(oldProductionForm)window.psProductionForm=async function(){
    await oldProductionForm();
    const note=document.querySelector('#modalRoot .ps-info-note');
    if(note){note.textContent=t('Raw salt requirements are calculated from the complete finished-product composition, including carton pouch count and gift-box categories.');translateElement(note)}
  };

  // A Gift Box may have one salt category, but must contain at least two total pouches.
  window.psProductStyleChanged=function(style){
    const gift=style==='Gift Box / Set',grade=document.getElementById('psStandardGrade'),weight=document.getElementById('psStandardWeight'),box=document.getElementById('psGiftBoxConfig');
    if(grade)grade.style.display=gift?'none':'';
    if(weight)weight.style.display=gift?'none':'';
    if(box)box.style.display=gift?'block':'none';
    if(gift&&!(window.psGiftComponents||[]).length)window.psGiftComponents=[{salt_grade:(window.psGiftGrades||[])[0]||'Mesh',pouches_per_box:2}];
    if(typeof psDrawGiftComponents==='function')psDrawGiftComponents();
  };

  window.psGiftSummary=function(){
    const form=document.querySelector('#modalRoot form'),weight=n(form?.gift_pouch_weight_g?.value),pouches=(window.psGiftComponents||[]).reduce((sum,x)=>sum+n(x.pouches_per_box),0),box=document.getElementById('psGiftSummary');
    if(box)box.innerHTML=`<small>${esc(t('Total Pouches per Box'))}</small><b>${qty(pouches,0)}</b><small>${esc(t('Total Salt Weight per Box'))}</small><b>${qty(weight*pouches,0)}g</b>${pouches<=1?`<small style="grid-column:1/-1;color:#b4234d">${esc(t('A gift box must contain more than one pouch.'))}</small>`:''}`;
  };

  window.psSaveProduct=async function(e,id){
    e.preventDefault();
    try{
      const o=Object.fromEntries(new FormData(e.target));
      o.bom=window.psBom||[];
      o.gift_components=o.packaging_style==='Gift Box / Set'?(window.psGiftComponents||[]):[];
      if(o.packaging_style==='Gift Box / Set'){
        const clean=o.gift_components.filter(c=>String(c.salt_grade||'').trim()&&n(c.pouches_per_box)>0);
        if(!clean.length)throw new Error(t('A gift box requires at least one salt category.'));
        if(clean.some(c=>!Number.isInteger(n(c.pouches_per_box))))throw new Error(t('Gift-box pouches per category must be a whole number.'));
        const names=clean.map(c=>String(c.salt_grade).trim().toLowerCase());
        if(new Set(names).size!==names.length)throw new Error(t('Each gift-box salt category can only be added once.'));
        if(clean.reduce((sum,c)=>sum+n(c.pouches_per_box),0)<=1)throw new Error(t('A gift box must contain more than one pouch.'));
        o.gift_components=clean;
      }
      await api(id?'/api/pink-salt/products/'+id:'/api/pink-salt/products',{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(o)});
      closeModalAfterSave();toast(t('Finished product saved'));loadView();
    }catch(err){toast(err.message||t('Request failed'))}
  };

  // Make carton composition explicit in the production selector so the operator can verify the salt requirement before completing a batch.
  const oldDrawProdOutputs=window.psDrawProdOutputs;
  window.psDrawProdOutputs=function(){
    if(typeof oldDrawProdOutputs==='function')oldDrawProdOutputs();
    const el=document.getElementById('psProdOutputs');if(!el)return;
    const selects=[...el.querySelectorAll('.ps-output-line select')];
    selects.forEach(select=>{
      [...select.options].forEach(opt=>{
        if(!opt.value)return;
        const p=(window.psProdProducts||[]).find(x=>String(x.id)===String(opt.value));
        const count=bulkPouchCount(p);
        if(p?.packaging_style==='Bulk Pack'&&count>1&&!opt.dataset.v309){
          opt.textContent=`${p.sku} · ${p.name} · ${p.salt_grade} · ${qty(p.pack_weight_g,0)}g × ${qty(count,0)} ${t('pouches')} = ${qty(n(p.pack_weight_g)*count/1000,3)} kg ${t('Salt per Finished Unit')}`;
          opt.dataset.v309='1';
        }
      });
    });
  };

  console.info('Blue Ocean Market V30.9.0 packaging integrity UI loaded');
})();
