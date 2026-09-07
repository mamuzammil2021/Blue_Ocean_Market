const fs=require('fs');
const path=require('path');
const os=require('os');
const {execFileSync}=require('child_process');

const VERSION='30.10.0';

function install({app,db,auth,allow,currentUnit,enforceUnit,audit,uploads}){
  const num=v=>Number(v||0), text=v=>String(v??'').trim();
  const pinkUnit=()=>db.prepare("SELECT id FROM business_units WHERE name='Pink Salt' AND status!='Archived'").get()?.id||null;
  function guard(req,res){const bu=Number(pinkUnit()||0),selected=Number(currentUnit(req)||0);if(!bu){res.status(409).json({error:'Pink Salt business unit is not available.'});return null}if(!selected||selected!==bu||!enforceUnit(req,bu)){res.status(403).json({error:'Select the Pink Salt business unit to use this workspace.'});return null}return bu}
  function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  db.exec(`CREATE TABLE IF NOT EXISTS pink_salt_production_documents(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_unit_id INTEGER NOT NULL,
    production_batch_id INTEGER NOT NULL,
    document_type TEXT NOT NULL DEFAULT 'Production Batch PDF',
    language TEXT NOT NULL,
    file_name TEXT NOT NULL,
    generated_by INTEGER,
    generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(production_batch_id,document_type,language),
    FOREIGN KEY(business_unit_id) REFERENCES business_units(id),
    FOREIGN KEY(production_batch_id) REFERENCES pink_salt_production_batches(id) ON DELETE CASCADE
  );`);

  function productionData(id,bu){
    const batch=db.prepare(`SELECT b.*,u.name completed_by_name,c.name created_by_name
      FROM pink_salt_production_batches b
      LEFT JOIN users u ON u.id=b.completed_by
      LEFT JOIN users c ON c.id=b.created_by
      WHERE b.id=? AND b.business_unit_id=?`).get(Number(id),bu);
    if(!batch)return null;
    const inputs=db.prepare(`SELECT pi.*,i.import_no,i.container_no,i.supplier_name,x.specification,x.storage_location
      FROM pink_salt_production_inputs pi
      JOIN pink_salt_import_items x ON x.id=pi.import_item_id
      JOIN pink_salt_imports i ON i.id=x.import_id
      WHERE pi.production_batch_id=? ORDER BY pi.id`).all(batch.id);
    const outputs=db.prepare(`SELECT o.*,p.sku,p.name,p.packaging_style,p.pack_weight_g,p.gift_pouch_weight_g,p.salt_grade
      FROM pink_salt_production_outputs o JOIN pink_salt_products p ON p.id=o.product_id
      WHERE o.production_batch_id=? ORDER BY o.id`).all(batch.id);
    for(const o of outputs){
      o.gift_components=db.prepare('SELECT salt_grade,pouches_per_box FROM pink_salt_gift_box_components WHERE product_id=? ORDER BY id').all(o.product_id);
      o.bom=db.prepare(`SELECT b.quantity_per_unit,p.sku,p.name,p.category,p.unit FROM pink_salt_bom_lines b JOIN pink_salt_packaging_items p ON p.id=b.packaging_item_id WHERE b.product_id=? ORDER BY p.name`).all(o.product_id);
    }
    const packaging=db.prepare(`SELECT x.*,p.sku,p.name,p.category,p.unit FROM pink_salt_production_packaging x JOIN pink_salt_packaging_items p ON p.id=x.packaging_item_id WHERE x.production_batch_id=? ORDER BY x.id`).all(batch.id);
    const attachments=db.prepare(`SELECT a.*,u.name uploaded_by_name FROM pink_salt_attachments a LEFT JOIN users u ON u.id=a.uploaded_by WHERE a.entity_type='Production' AND a.entity_id=? ORDER BY a.id`).all(batch.id);
    const rawMovements=db.prepare(`SELECT m.*,x.salt_grade,i.import_no FROM pink_salt_raw_stock_movements m JOIN pink_salt_import_items x ON x.id=m.import_item_id JOIN pink_salt_imports i ON i.id=x.import_id WHERE m.reference_type='Production' AND m.reference_id=? ORDER BY m.id`).all(batch.id);
    const packagingMovements=db.prepare(`SELECT m.*,p.sku,p.name FROM pink_salt_packaging_movements m JOIN pink_salt_packaging_items p ON p.id=m.packaging_item_id WHERE m.reference_type='Production' AND m.reference_id=? ORDER BY m.id`).all(batch.id);
    const finishedMovements=db.prepare(`SELECT m.*,p.sku,p.name FROM pink_salt_finished_stock_movements m JOIN pink_salt_products p ON p.id=m.product_id WHERE (m.production_batch_id=? OR (m.reference_type='Production' AND m.reference_id=?)) ORDER BY m.id`).all(batch.id,batch.id);
    return {batch,inputs,outputs,packaging,attachments,rawMovements,packagingMovements,finishedMovements};
  }

  function T(lang){const ko=lang==='ko';return {
    title:ko?'재포장 / 생산 배치 보고서':'Repacking / Production Batch Report',batch:ko?'생산 배치':'Production Batch',date:ko?'생산일':'Production Date',status:ko?'상태':'Status',completed:ko?'완료':'Completed',operator:ko?'작업자':'Operator',created:ko?'생성일':'Created',completedAt:ko?'완료 시간':'Completed At',notes:ko?'메모':'Notes',
    summary:ko?'생산 요약':'Production Summary',inputWeight:ko?'총 투입 중량 (kg)':'Total Input Weight (kg)',outputWeight:ko?'총 완제품 중량 (kg)':'Total Finished Output (kg)',wasteWeight:ko?'폐기 / 손실 중량 (kg)':'Waste / Loss Weight (kg)',wasteReason:ko?'폐기 / 손실 사유':'Waste / Loss Reason',
    rawInputs:ko?'원소금 투입 내역':'Raw Salt Inputs',sourceImport:ko?'원소금 / 수입 배치':'Raw Salt / Import Batch',grade:ko?'소금 등급 / 카테고리':'Salt Grade / Category',input:ko?'투입 중량 (kg)':'Input Weight (kg)',required:ko?'완제품 필요 중량 (kg)':'Required Output Weight (kg)',loss:ko?'손실 중량 (kg)':'Loss Weight (kg)',unitCost:ko?'단가 (KRW)':'Unit Cost (KRW)',
    outputs:ko?'완제품 생산 내역':'Finished Outputs',sku:ko?'제품 SKU':'Product SKU',product:ko?'완제품':'Finished Product',packagingStyle:ko?'포장 형태':'Packaging Style',packSpec:ko?'포장 구성':'Pack Specification',quantity:ko?'생산 수량':'Quantity Units',weight:ko?'생산 중량 (kg)':'Output Weight (kg)',
    packaging:ko?'사용 포장재':'Packaging Materials Used',material:ko?'포장재':'Material',category:ko?'카테고리':'Category',used:ko?'사용 수량':'Quantity Used',packCost:ko?'포장재 비용 (KRW)':'Packaging Cost (KRW)',
    evidence:ko?'생산 증빙':'Production Evidence',file:ko?'파일':'File',uploadedBy:ko?'업로드 사용자':'Uploaded By',
    movements:ko?'재고 이동':'Stock Movements',movementType:ko?'이동 유형':'Movement Type',reference:ko?'참조':'Reference',stockItem:ko?'재고 품목':'Stock Item',movementQty:ko?'수량 변화':'Quantity Change',
    generated:ko?'PDF 생성일':'PDF Generated',raw:ko?'원소금':'Raw Salt',pack:ko?'포장재':'Packaging',finished:ko?'완제품':'Finished Goods'
  }}
  function money(v){return Math.round(num(v)).toLocaleString('en-US')}
  function qty(v,d=3){return num(v).toLocaleString('en-US',{maximumFractionDigits:d})}
  function dv(lang,v){if(lang!=='ko')return String(v??'');const m={
    'Completed':'완료','Draft':'초안','Gift Box / Set':'선물 상자 / 세트','Retail Pack':'소매 포장','Bulk Pack':'대용량 포장',
    'Pouch / Bag':'파우치 / 봉투','Gift Box':'선물 상자','Carton / Box':'카톤 / 박스','Label / Sticker':'라벨 / 스티커','Other':'기타',
    'Production Consumption':'생산 사용','Production Output':'생산 입고','Waste':'폐기 / 손실','Adjustment':'조정',
    'Production / Repacking Evidence':'생산 / 재포장 증빙','pcs':'개','piece':'개','pieces':'개','unit':'개','units':'개','pouch':'파우치','pouches':'파우치','box':'박스','boxes':'박스'
  };return m[String(v??'')]||String(v??'')}
  function packSpec(o,lang){
    if(o.packaging_style==='Gift Box / Set'&&o.gift_components?.length){const pouchWord=lang==='ko'?'파우치':'pouches';return `${qty(o.gift_pouch_weight_g,0)}g × ${o.gift_components.reduce((n,x)=>n+num(x.pouches_per_box),0)} ${pouchWord} · ${o.gift_components.map(x=>`${x.salt_grade} × ${qty(x.pouches_per_box,0)}`).join(' · ')}`}
    const bom=(o.bom||[]).map(x=>`${x.name} × ${qty(x.quantity_per_unit,2)} ${dv(lang,x.unit||'')}`.trim()).join(' · ');
    return `${qty(o.pack_weight_g,0)}g${bom?' · '+bom:''}`;
  }
  function htmlReport(d,lang){const tr=T(lang),b=d.batch;const movementRows=[
    ...d.rawMovements.map(x=>({kind:tr.raw,item:`${x.import_no} · ${x.salt_grade}`,type:dv(lang,x.movement_type),qty:`${qty(x.quantity_kg)} kg`,ref:x.reference})),
    ...d.packagingMovements.map(x=>({kind:tr.pack,item:`${x.sku} · ${x.name}`,type:dv(lang,x.movement_type),qty:`${qty(x.quantity)} ${dv(lang,'units')}`,ref:x.reference})),
    ...d.finishedMovements.map(x=>({kind:tr.finished,item:`${x.sku} · ${x.name}`,type:dv(lang,x.movement_type),qty:`${qty(x.quantity_units,0)} ${dv(lang,'units')}`,ref:x.reference}))
  ];return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>@page{size:A4;margin:13mm}body{font-family:"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",Arial,sans-serif;color:#172033;font-size:10.5px}h1{font-size:21px;margin:0 0 4px}.sub{color:#64748b;margin-bottom:12px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:10px 0}.box{border:1px solid #dfe5ee;border-radius:7px;padding:7px;min-width:0}.box small{display:block;color:#64748b}.box b{font-size:12px;overflow-wrap:anywhere}.section{margin-top:14px;page-break-inside:auto}h2{font-size:13px;border-bottom:1px solid #dfe5ee;padding-bottom:4px;margin-bottom:5px}table{width:100%;border-collapse:collapse;margin-top:5px;page-break-inside:auto}tr{page-break-inside:avoid}th,td{border:1px solid #dfe5ee;padding:4px;text-align:left;vertical-align:top}th{background:#f5f7fa;font-size:9.5px}.right{text-align:right}.status{display:inline-block;background:#e8f7ee;color:#0b7a46;padding:3px 7px;border-radius:20px;font-weight:bold}.muted{color:#64748b}.footer{margin-top:18px;color:#64748b;font-size:8.5px}.wrap{overflow-wrap:anywhere}</style></head><body>
  <h1>${esc(tr.title)}</h1><div class="sub">Blue Ocean Market · ${lang==='ko'?'핑크 솔트':'Pink Salt'}</div>
  <div class="grid"><div class="box"><small>${esc(tr.batch)}</small><b>${esc(b.batch_no)}</b></div><div class="box"><small>${esc(tr.date)}</small><b>${esc(b.production_date)}</b></div><div class="box"><small>${esc(tr.status)}</small><b class="status">${esc(lang==='ko'&&b.status==='Completed'?tr.completed:b.status)}</b></div><div class="box"><small>${esc(tr.operator)}</small><b>${esc(b.completed_by_name||b.created_by_name||'—')}</b></div></div>
  <div class="section"><h2>${esc(tr.summary)}</h2><div class="grid"><div class="box"><small>${esc(tr.inputWeight)}</small><b>${qty(b.input_weight_kg)} kg</b></div><div class="box"><small>${esc(tr.outputWeight)}</small><b>${qty(b.actual_output_weight_kg)} kg</b></div><div class="box"><small>${esc(tr.wasteWeight)}</small><b>${qty(b.waste_weight_kg)} kg</b></div><div class="box"><small>${esc(tr.wasteReason)}</small><b>${esc(b.waste_reason||'—')}</b></div><div class="box"><small>${esc(tr.created)}</small><b>${esc(b.created_at||'—')}</b></div><div class="box"><small>${esc(tr.completedAt)}</small><b>${esc(b.completed_at||'—')}</b></div><div class="box" style="grid-column:span 2"><small>${esc(tr.notes)}</small><b>${esc(b.notes||'—')}</b></div></div></div>
  <div class="section"><h2>${esc(tr.rawInputs)}</h2><table><tr><th>${esc(tr.sourceImport)}</th><th>${esc(tr.grade)}</th><th>${esc(tr.input)}</th><th>${esc(tr.required)}</th><th>${esc(tr.loss)}</th><th>${esc(tr.unitCost)}</th></tr>${d.inputs.map(x=>`<tr><td>${esc(x.import_no)}${x.container_no?`<br><span class="muted">${esc(x.container_no)}</span>`:''}</td><td>${esc(x.salt_grade)}</td><td class="right">${qty(x.input_weight_kg)}</td><td class="right">${qty(x.required_output_weight_kg)}</td><td class="right">${qty(x.waste_weight_kg)}</td><td class="right">₩ ${money(x.raw_unit_cost_krw)}</td></tr>`).join('')||`<tr><td colspan="6">—</td></tr>`}</table></div>
  <div class="section"><h2>${esc(tr.outputs)}</h2><table><tr><th>${esc(tr.sku)}</th><th>${esc(tr.product)}</th><th>${esc(tr.packagingStyle)}</th><th>${esc(tr.packSpec)}</th><th>${esc(tr.quantity)}</th><th>${esc(tr.weight)}</th><th>${esc(tr.unitCost)}</th></tr>${d.outputs.map(x=>`<tr><td>${esc(x.sku)}</td><td>${esc(x.name)}</td><td>${esc(dv(lang,x.packaging_style))}</td><td class="wrap">${esc(packSpec(x,lang))}</td><td class="right">${qty(x.quantity_units,0)}</td><td class="right">${qty(x.output_weight_kg)}</td><td class="right">₩ ${money(x.unit_cost_krw)}</td></tr>`).join('')||`<tr><td colspan="7">—</td></tr>`}</table></div>
  <div class="section"><h2>${esc(tr.packaging)}</h2><table><tr><th>${esc(tr.material)}</th><th>${esc(tr.category)}</th><th>${esc(tr.used)}</th><th>${esc(tr.unitCost)}</th><th>${esc(tr.packCost)}</th></tr>${d.packaging.map(x=>`<tr><td>${esc(x.sku)} · ${esc(x.name)}</td><td>${esc(dv(lang,x.category))}</td><td class="right">${qty(x.quantity_used)} ${esc(dv(lang,x.unit||''))}</td><td class="right">₩ ${money(x.unit_cost_krw)}</td><td class="right">₩ ${money(num(x.quantity_used)*num(x.unit_cost_krw))}</td></tr>`).join('')||`<tr><td colspan="5">—</td></tr>`}</table></div>
  <div class="section"><h2>${esc(tr.evidence)}</h2><table><tr><th>${esc(tr.file)}</th><th>${esc(tr.uploadedBy)}</th><th>${esc(tr.created)}</th></tr>${d.attachments.map(x=>`<tr><td>${esc(x.original_name||dv(lang,x.title)||path.basename(x.file_path||''))}</td><td>${esc(x.uploaded_by_name||'—')}</td><td>${esc(x.created_at||'—')}</td></tr>`).join('')||`<tr><td colspan="3">—</td></tr>`}</table></div>
  <div class="section"><h2>${esc(tr.movements)}</h2><table><tr><th>${esc(tr.category)}</th><th>${esc(tr.stockItem)}</th><th>${esc(tr.movementType)}</th><th>${esc(tr.movementQty)}</th><th>${esc(tr.reference)}</th></tr>${movementRows.map(x=>`<tr><td>${esc(x.kind)}</td><td>${esc(x.item)}</td><td>${esc(x.type)}</td><td class="right">${esc(x.qty)}</td><td>${esc(x.ref||b.batch_no)}</td></tr>`).join('')||`<tr><td colspan="5">—</td></tr>`}</table></div>
  <div class="footer">${esc(tr.generated)}: ${esc(new Date().toLocaleString(lang==='ko'?'ko-KR':'en-US'))}</div></body></html>`}

  function chromePath(){const c=[process.env.CHROME_PATH,process.env.GOOGLE_CHROME_BIN,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Chromium.app/Contents/MacOS/Chromium','/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/usr/bin/google-chrome-stable'];return c.find(x=>x&&fs.existsSync(x))||''}
  function pdfPath(id,lang){return path.join(uploads,`pink_salt_production_${Number(id)}_${lang}.pdf`)}
  function upsertDoc(batch,lang,out,userId){db.prepare(`INSERT INTO pink_salt_production_documents(business_unit_id,production_batch_id,document_type,language,file_name,generated_by,generated_at,updated_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT(production_batch_id,document_type,language) DO UPDATE SET file_name=excluded.file_name,generated_by=excluded.generated_by,generated_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`).run(batch.business_unit_id,batch.id,'Production Batch PDF',lang,path.basename(out),userId||null)}
  function renderPdf(id,bu,lang,userId=null){const d=productionData(id,bu);if(!d)throw new Error('Production batch not found.');if(d.batch.status!=='Completed')throw new Error('Production Batch PDF is available only after repacking is completed.');const chrome=chromePath();if(!chrome)throw new Error('PDF generation requires Google Chrome or Chromium on the server. Set CHROME_PATH if Chrome is installed in a custom location.');const tmp=path.join(os.tmpdir(),`bom-production-${id}-${lang}-${Date.now()}.html`),out=pdfPath(id,lang);fs.writeFileSync(tmp,htmlReport(d,lang),'utf8');try{execFileSync(chrome,['--headless','--no-sandbox','--disable-gpu',`--print-to-pdf=${out}`,`file://${tmp}`],{stdio:'ignore',timeout:30000})}finally{try{fs.unlinkSync(tmp)}catch(_){}}if(!fs.existsSync(out)||fs.statSync(out).size<500)throw new Error('PDF generation failed. Chrome/Chromium could not render the production report.');upsertDoc(d.batch,lang,out,userId);return {out,batch:d.batch}}

  app.post('/api/pink-salt/production/:id/pdf-v308/generate',auth,allow('inventory','purchases','dashboard','finance'),(req,res)=>{const bu=guard(req,res);if(!bu)return;try{const en=renderPdf(req.params.id,bu,'en',req.user.id),ko=renderPdf(req.params.id,bu,'ko',req.user.id);audit(req.user,'pink_salt_production',Number(req.params.id),'generate-production-pdf',JSON.stringify({en:path.basename(en.out),ko:path.basename(ko.out)}));res.json({ok:true,en:path.basename(en.out),ko:path.basename(ko.out)})}catch(e){res.status(409).json({error:e.message})}});
  app.get('/api/pink-salt/production/:id/pdf-v308',auth,allow('inventory','purchases','dashboard','finance'),(req,res)=>{const bu=guard(req,res);if(!bu)return;const lang=String(req.query.lang||req.headers['x-language']||'en').toLowerCase().startsWith('ko')?'ko':'en';try{let out=pdfPath(req.params.id,lang),batch=db.prepare('SELECT * FROM pink_salt_production_batches WHERE id=? AND business_unit_id=?').get(req.params.id,bu);if(!batch)return res.status(404).json({error:'Production batch not found.'});if(batch.status!=='Completed')return res.status(409).json({error:'Production Batch PDF is available only after repacking is completed.'});if(!fs.existsSync(out)){const r=renderPdf(req.params.id,bu,lang,req.user.id);out=r.out;batch=r.batch}else upsertDoc(batch,lang,out,req.user.id);res.download(out,`${String(batch.batch_no||'production_batch').replace(/[^a-z0-9_-]+/gi,'_')}_${lang}.pdf`)}catch(e){res.status(409).json({error:e.message})}});

  console.info('Blue Ocean Market V30.9.0 production workflow + PDF backend loaded');
  return {VERSION};
}
module.exports={install,VERSION};
