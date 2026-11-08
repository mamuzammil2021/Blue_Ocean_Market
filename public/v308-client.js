// Blue Ocean Market V30.8.0 — repacking completion reliability, production PDF, bulk-pack detail polish.
(()=>{
  const n=v=>Number(v||0), lang=()=>currentLanguage==='ko'?'ko':'en';
  Object.assign(KO,{
    'Generate / Download PDF':'PDF 생성 / 다운로드','Production Batch PDF':'생산 배치 PDF','Completing Repacking...':'재포장 완료 처리 중...','Production completed':'생산 완료','Select a finished product and enter a quantity for every output.':'각 생산 항목의 완제품과 수량을 선택하세요.','Select a raw salt batch for every required salt category.':'필요한 모든 소금 카테고리에 원소금 배치를 선택하세요.','Raw salt input must cover the required output weight.':'원소금 투입 중량은 필요한 생산 중량 이상이어야 합니다.','Production completed, but accounting synchronization needs review.':'생산은 완료되었지만 회계 동기화를 확인해야 합니다.'
  });

  function productionError(message){
    if(currentLanguage!=='ko')return message;
    let m=String(message).match(/^Not enough packaging material: (.+)\. Required (.+), available (.+)\.$/);
    if(m)return `포장재가 부족합니다: ${m[1]}. 필요 수량 ${m[2]}, 가용 수량 ${m[3]}.`;
    m=String(message).match(/^Production input exceeds available (.+) raw salt in (.+)\.$/);
    if(m)return `${m[2]}의 ${m[1]} 원염 가용 재고보다 투입량이 많습니다.`;
    const messages={'Every output requires a valid finished product and whole-number quantity.':'각 생산 항목에 유효한 완제품과 정수 수량을 입력하세요.','This accounting period is closed. Reopen the period before completing this repacking batch.':'회계 기간이 마감되었습니다. 이 재포장 배치를 완료하기 전에 기간을 다시 여세요.','Raw stock changed. Review available quantities.':'원염 재고가 변경되었습니다. 가용 수량을 확인하세요.','Insufficient raw stock at storage locations.':'보관 위치의 원염 재고가 부족합니다.'};
    return messages[message]||t(message);
  }
  // V30.8: always surface validation/API errors and read the latest values directly from the visible form.
  window.psSaveProduction=async function(e){
    e.preventDefault();
    const form=e.target;if(form.dataset.productionSaving==='1')return;form.dataset.productionSaving='1';let errorBox=form.querySelector('[data-production-error]');if(!errorBox){errorBox=document.createElement('p');errorBox.dataset.productionError='1';errorBox.setAttribute('role','alert');errorBox.className='pack-error';form.querySelector('.actions:last-child')?.before(errorBox)}errorBox.textContent='';const button=form.querySelector('button:not([type="button"]).primary')||form.querySelector('button.primary:last-child');
    const oldText=button?.textContent||t('Complete Repacking');
    try{
      const outputLines=[...form.querySelectorAll('#psProdOutputs .ps-output-line')];
      window.psProdOutputs=outputLines.map(line=>({product_id:line.querySelector('select')?.value||'',quantity_units:n(line.querySelector('input[type="number"]')?.value)}));
      if(!window.psProdOutputs.length||window.psProdOutputs.some(x=>!x.product_id||!Number.isSafeInteger(x.quantity_units)||x.quantity_units<=0))throw new Error(t('Select a finished product and enter a quantity for every output.'));
      const requirements=typeof psProdRequirements==='function'?psProdRequirements():new Map();
      if(!requirements.size)throw new Error(t('Select a finished product and enter a quantity for every output.'));
      const inputLines=[...form.querySelectorAll('#psProdInputs .ps-raw-input')];
      window.psProdInputs=inputLines.map(line=>({salt_grade:line.querySelector('input[readonly]')?.value||'',import_item_id:line.querySelector('select')?.value||'',input_weight_kg:n(line.querySelector('input[type="number"]')?.value)}));
      for(const [grade,required] of requirements){
        const rows=window.psProdInputs.filter(x=>x.salt_grade===grade);
        if(!rows.length||rows.some(x=>!x.import_item_id||x.input_weight_kg<=0))throw new Error(`${t('Select a raw salt batch for every required salt category.')} (${grade})`);
        const supplied=rows.reduce((sum,x)=>sum+n(x.input_weight_kg),0);
        if(supplied+0.005<n(required))throw new Error(`${t('Raw salt input must cover the required output weight.')} ${grade}: ${qty(supplied,3)} / ${qty(required,3)} kg`);
      }
      if(button){button.disabled=true;button.textContent=t('Completing Repacking...')}
      const fd=new FormData(form),out=new FormData();
      for(const [k,v] of fd.entries())if(k!=='attachments')out.append(k,v);
      out.set('outputs',JSON.stringify(window.psProdOutputs));out.set('inputs',JSON.stringify(window.psProdInputs));
      for(const f of form.attachments?.files||[])out.append('attachments',f);
      const signature=JSON.stringify([...out.entries()].map(([k,v])=>[k,v instanceof File?{name:v.name,size:v.size,modified:v.lastModified}:v]));if(form.dataset.productionPayload!==signature){form.dataset.productionPayload=signature;form.dataset.productionKey=crypto.randomUUID()}out.set('idempotency_key',form.dataset.productionKey);
      const d=await api('/api/pink-salt/production',{method:'POST',headers:{'X-Idempotency-Key':form.dataset.productionKey},body:out});
      closeModalAfterSave();
      toast(`${t('Production completed')} · ${(d.salt_categories||[]).join(' + ')} · ${t('Waste Weight')} ${qty(d.waste_weight_kg)} kg`);
      if(d.accounting_sync_warning)setTimeout(()=>toast(t('Production completed, but accounting synchronization needs review.')),350);
      await BOMRouter.navigate('psProduction','','','',{mutationCommitted:true});
    }catch(err){errorBox.textContent=productionError(err.message||t('Request failed'));toast(errorBox.textContent)}
    finally{delete form.dataset.productionSaving;if(button&&document.body.contains(button)){button.disabled=false;button.textContent=oldText}}
  };

  const oldProductionDetail=window.psProductionDetail;
  if(oldProductionDetail)window.psProductionDetail=async function(id){
    try{await oldProductionDetail(id);const root=workflowSurfaceV324();if(root){const actions=root.querySelector('.actions');if(actions&&!actions.querySelector('.v308-production-pdf')){const b=document.createElement('button');b.className='btn primary v308-production-pdf';b.textContent='📄 '+t('Generate / Download PDF');b.onclick=()=>psDownloadProductionPdf(id);actions.insertBefore(b,actions.firstChild)}translateElement(root)}}catch(err){toast(err.message)}
  };

  window.psDownloadProductionPdf=async function(id){
    try{
      const headers={'X-Language':lang()};if(token)headers.Authorization='Bearer '+token;if(me?.role==='CEO / Owner'&&selectedUnitId)headers['X-Business-Unit-ID']=selectedUnitId;else if(me?.business_unit_id)headers['X-Business-Unit-ID']=me.business_unit_id;
      const r=await fetch(`/api/pink-salt/production/${id}/pdf-v308?lang=${lang()}`,{headers});if(!r.ok){let d={};try{d=await r.json()}catch{}throw new Error(t(d.error||'PDF download failed'))}
      const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(r.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/)?.[1]||`production_batch_${id}_${lang()}.pdf`);document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
    }catch(err){toast(err.message)}
  };

  console.info('Blue Ocean Market V30.8.0 production workflow UI loaded');
})();
