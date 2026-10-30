'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {uploadDir}=require('./runtime-storage');
const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const parse=(s,d={})=>{try{return JSON.parse(s||'null')||d}catch{return d}};
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status})};
async function branding(db,bu){
 const rows=await db.prepare("SELECT * FROM system_settings WHERE section IN ('company_profile_branding','document_branding') AND (lower(scope_type) IN ('global','company') OR (lower(scope_type) IN ('bu','business_unit') AND scope_id=?))").all(bu);
 let out={company_name:'Blue Ocean Market'};
 for(const scope of ['company','bu'])for(const section of ['company_profile_branding','document_branding'])for(const row of rows.filter(x=>x.section===section&&(scope==='company'?['company','global'].includes(x.scope_type.toLowerCase()):Number(x.scope_id)===Number(bu))))out={...out,...parse(row.settings_json)};
 return out;
}
function assetData(asset){
 if(!asset?.file||!['image/png','image/jpeg','image/webp'].includes(asset.mime))return '';
 const file=path.join(uploadDir,path.basename(asset.file));if(!fs.existsSync(file))return '';
 return 'data:'+asset.mime+';base64,'+fs.readFileSync(file).toString('base64');
}
function brandHtml(markup,b){
 markup=markup.replace('</style>',require('./pdf-fonts').style(markup)+'</style>');
 const logo=assetData(b.logo),header=assetData(b.header),footer=assetData(b.footer);
 const top=`<header class="company-header">${header?`<img class="letterhead" src="${header}">`:''}${logo?`<img class="company-logo" src="${logo}">`:''}<div><b>${E(b.company_name||'Blue Ocean Market')}</b><p>${E(b.address||'')}</p><p>${E([b.contact_phone,b.contact_email,b.registration_number].filter(Boolean).join(' · '))}</p></div></header>`;
 return markup.replace('<div class="brand">BLUE OCEAN MARKET</div>',top).replace('</style>','.company-header{display:flex;gap:18px;flex-wrap:wrap;align-items:center;border-bottom:1px solid #ccd7e6;padding-bottom:12px}.company-header p{margin:4px 0}.company-logo{max-height:64px;max-width:150px}.letterhead{width:100%;max-height:110px;object-fit:contain}.company-footer{clear:both;break-inside:avoid;padding-top:14px}img{object-fit:contain}</style>').replace('</html>',`<div class="company-footer">${footer?`<img class="letterhead" src="${footer}">`:''}<p>${E(b.footer_text||b.company_name||'Blue Ocean Market')}</p></div></html>`);
}
async function install({app,db,auth,allow,currentUnit,enforceUnit,audit,access,upload,accounting}){
 const scope=req=>{const bu=Number(currentUnit(req));if(!bu||!enforceUnit(req,bu))fail('Select an authorized business unit.',403);return bu};
 const can=async(req,module,action='edit')=>req.user.role==='CEO / Owner'||await access.canAction(req.user.id,module,action,scope(req));
 const admin=async req=>{if(req.user.role!=='CEO / Owner'&&!await access.can(req.user.id,'sensitive.system_admin',scope(req)))fail('System Administrator access is required.',403)};
 const localError=(req,e)=>String(req.headers['x-language']||'en').startsWith('ko')?({'Customer not found.':'고객을 찾을 수 없습니다.','An archive reason is required.':'보관 사유를 입력하세요.','Attachment not found.':'첨부파일을 찾을 수 없습니다.','Document owner not found.':'문서의 연결된 기록을 찾을 수 없습니다.','Payment evidence cannot be archived directly.':'결제 증빙은 직접 보관 처리할 수 없습니다.','Payment evidence cannot be archived directly. Use the linked financial correction workflow.':'결제 증빙은 직접 보관 처리할 수 없습니다. 연결된 재무 수정 절차를 사용하세요.','Insufficient stock at the source warehouse.':'출발 창고의 재고가 부족합니다.','Transfer quantity exceeds unreserved finished stock.':'이동 수량이 예약되지 않은 완제품 재고를 초과합니다.','This accounting period is closed.':'이 회계 기간은 마감되었습니다.','Select an authorized business unit.':'권한이 있는 사업부를 선택하세요.','System Administrator access is required.':'시스템 관리자 권한이 필요합니다.','Choose active warehouses in this business unit.':'이 사업부의 활성 창고를 선택하세요.','Maximum file size is 10 MB.':'최대 파일 크기는 10MB입니다.','Sale not found.':'매출 기록을 찾을 수 없습니다.'}[e.message]||'요청을 처리할 수 없습니다. 입력값과 권한을 확인한 후 다시 시도하세요.'):e.message;
 const safe=fn=>async(req,res)=>{try{await fn(req,res)}catch(e){if(!res.headersSent)res.status(e.status||400).json({error:localError(req,e)})}};
 app.get('/api/pink-salt/customers/:id/profile-v701',auth,allow('sales','finance'),safe(async(req,res)=>{
  const x=await db.prepare('SELECT * FROM pink_salt_customers WHERE id=? AND business_unit_id=?').get(Number(req.params.id),scope(req));if(!x)fail('Customer not found.',404);res.json(x);
 }));
 app.get('/api/pink-salt/attachments-v701',auth,allow('documents','purchases','inventory','sales'),safe(async(req,res)=>{
  const bu=scope(req),type=String(req.query.type),id=Number(req.query.id),tables={'Import':'pink_salt_imports','Packaging Purchase':'pink_pack_purchases','Production':'pink_salt_production_batches','Order':'pink_salt_orders','Supplier':'pink_salt_suppliers'},table=tables[type];
  if(!table||!await db.prepare(`SELECT id FROM ${table} WHERE id=? AND business_unit_id=?`).get(id,bu))fail('Document owner not found.',404);
  const rows=await db.prepare('SELECT a.*,u.name uploaded_by_name FROM pink_salt_attachments a LEFT JOIN users u ON u.id=a.uploaded_by WHERE a.entity_type=? AND a.entity_id=? AND a.business_unit_id=? AND a.archived_at IS NULL ORDER BY a.id DESC').all(type,id,bu);
  const module=type==='Order'?'sales':type==='Production'?'inventory':'purchases',mayArchive=await can(req,module,'delete')||await can(req,'documents','delete');
  for(const a of rows){a.can_archive=mayArchive;const file=path.basename(a.file_path);for(const table of ['finance_entries','pink_fx_transactions','pink_salt_import_payments','pink_salt_import_costs','pink_salt_supplier_advances','pink_salt_supplier_advance_refunds','pink_salt_customer_payments','pink_salt_customer_receipts','pink_salt_customer_refunds'])if(await db.prepare(`SELECT id FROM ${table} WHERE receipt_file=? LIMIT 1`).get(file))a.can_archive=false;if(await db.prepare('SELECT id FROM finance_attachments WHERE file_path=? LIMIT 1').get(a.file_path))a.can_archive=false;}
  res.json(rows);
 }));
 app.post('/api/pink-salt/attachments/:id/archive',auth,allow('documents','purchases','inventory','sales'),safe(async(req,res)=>{
  const bu=scope(req),reason=String(req.body.reason||'').trim();if(!reason)fail('An archive reason is required.');
  await db.atomic(async()=>{
   const a=await db.prepare('SELECT * FROM pink_salt_attachments WHERE id=? AND business_unit_id=? FOR UPDATE').get(Number(req.params.id),bu);if(!a)fail('Attachment not found.',404);
   const module=a.entity_type==='Order'?'sales':a.entity_type==='Production'?'inventory':'purchases';if(!await can(req,module,'delete')&&!await can(req,'documents','delete'))fail('You do not have permission to archive this document.',403);
   if(!['Import','Packaging Purchase','Production','Order','Supplier'].includes(a.entity_type))fail('Payment evidence cannot be archived directly.',409);
   const file=path.basename(a.file_path);
   for(const table of ['finance_entries','pink_fx_transactions','pink_salt_import_payments','pink_salt_import_costs','pink_salt_supplier_advances','pink_salt_supplier_advance_refunds','pink_salt_customer_payments','pink_salt_customer_receipts','pink_salt_customer_refunds']){
    if(await db.prepare(`SELECT id FROM ${table} WHERE receipt_file=? LIMIT 1`).get(file))fail('Payment evidence cannot be archived directly. Use the linked financial correction workflow.',409);
   }
   if(await db.prepare('SELECT id FROM finance_attachments WHERE file_path=? LIMIT 1').get(a.file_path))fail('Payment evidence cannot be archived directly.',409);
   if(a.archived_at)return;
   await db.prepare('UPDATE pink_salt_attachments SET archived_at=bom.utc_now(),archived_by=?,archive_reason=? WHERE id=?').run(req.user.id,reason,a.id);
   await audit(req.user,'pink_salt_attachment',a.id,'archive',JSON.stringify({reason,before:a}));
  })();res.json({ok:true});
 }));
 app.get('/api/document-branding-v701',auth,safe(async(req,res)=>{await admin(req);const level=req.query.scope==='global'?'global':'bu',bu=level==='global'?(Number(currentUnit(req))||0):scope(req);const r=await db.prepare("SELECT settings_json FROM system_settings WHERE scope_type=? AND scope_id=? AND section='document_branding'").get(level,level==='global'?0:bu);res.json({scope:level,settings:parse(r?.settings_json),effective:await branding(db,bu)})}));
 async function saveBrand(req,data){await admin(req);const level=req.body.scope==='global'?'global':'bu',bu=level==='global'?(Number(currentUnit(req))||0):scope(req),id=level==='global'?0:bu;await db.atomic(async()=>{
  const old=await db.prepare("SELECT * FROM system_settings WHERE scope_type=? AND scope_id=? AND section='document_branding'").get(level,id),before=parse(old?.settings_json),next={...before,...data};
  await db.prepare("INSERT INTO system_settings(scope_type,scope_id,section,settings_json,updated_by) VALUES(?,?,'document_branding',?,?) ON CONFLICT(scope_type,scope_id,section) DO UPDATE SET settings_json=excluded.settings_json,updated_by=excluded.updated_by,updated_at=bom.utc_now()").run(level,id,JSON.stringify(next),req.user.id);
  await audit(req.user,'document_branding',id,'update',JSON.stringify({scope:level,before,after:next}));
 })();}
 app.put('/api/document-branding-v701',auth,safe(async(req,res)=>{const data={};for(const key of ['company_name','address','contact_phone','contact_email','registration_number','footer_text']){if(key in req.body){data[key]=String(req.body[key]).trim();if(data[key].length>2000)fail('Branding text is too long.')}}await saveBrand(req,data);res.json({ok:true})}));
 app.post('/api/document-branding-v701/assets',auth,async(req,res,next)=>{try{await admin(req);next()}catch(e){res.status(e.status||403).json({error:localError(req,e)})}},upload.single('file'),safe(async(req,res)=>{
  const file=req.file;try{
   if(!file)fail('Select a file.');if(file.size>10*1024*1024)fail('Maximum file size is 10 MB.');
   const kind=String(req.body.kind),bytes=fs.readFileSync(file.path),image=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':bytes[0]===255&&bytes[1]===216?'image/jpeg':bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'?'image/webp':'';
   if(!['logo','header','footer','sample','registration','terms'].includes(kind))fail('Unsupported company document type.');
   let mime=image;if(!mime&&bytes.toString('ascii',0,5)==='%PDF-')mime='application/pdf';if(!mime)fail('Upload a PNG, JPEG, WebP image or PDF.');if(['logo','header','footer'].includes(kind)&&!image)fail('For printable logo/header/footer use an image; upload PDF layouts as a reference sample.');
   await saveBrand(req,{[kind]:{file:file.filename,name:file.originalname,mime,size:file.size}});res.json({ok:true});
  }catch(e){if(file)fs.rmSync(file.path,{force:true});throw e}
 }));
 app.get('/api/warehouses-v701',auth,allow('inventory','purchases','sales'),safe(async(req,res)=>{
  const bu=scope(req),locations=await db.prepare('SELECT * FROM pink_salt_storage_locations WHERE business_unit_id=? ORDER BY active DESC,warehouse,zone,rack_bin').all(bu),loc=Number(req.query.location_id)||0,search='%'+String(req.query.search||'').trim()+'%';
  const raw=await db.prepare("SELECT 'raw' stock_type,x.id stock_id,NULL lot_id,x.salt_grade name,'kg' unit,m.location_id,SUM(m.quantity_kg) quantity FROM pink_salt_raw_stock_movements m JOIN pink_salt_import_items x ON x.id=m.import_item_id WHERE m.business_unit_id=? AND (?=0 OR m.location_id=?) AND x.salt_grade ILIKE ? GROUP BY x.id,m.location_id HAVING SUM(m.quantity_kg)>0").all(bu,loc,loc,search);
  const finished=await db.prepare("SELECT 'finished' stock_type,p.id stock_id,m.lot_id,m.production_batch_id,p.sku||' · '||p.name name,'unit' unit,m.location_id,SUM(m.quantity_units) quantity FROM pink_salt_finished_stock_movements m JOIN pink_salt_products p ON p.id=m.product_id WHERE m.business_unit_id=? AND (?=0 OR m.location_id=?) AND (p.name ILIKE ? OR p.sku ILIKE ?) GROUP BY p.id,m.lot_id,m.production_batch_id,m.location_id HAVING SUM(m.quantity_units)>0").all(bu,loc,loc,search,search);
  const packaging=await db.prepare("SELECT 'packaging' stock_type,p.id stock_id,NULL lot_id,p.sku||' · '||p.name name,p.unit,m.location_id,SUM(m.quantity) quantity FROM pink_salt_packaging_movements m JOIN pink_salt_packaging_items p ON p.id=m.packaging_item_id WHERE m.business_unit_id=? AND COALESCE(m.status,'Active')!='Voided' AND (?=0 OR m.location_id=?) AND (p.name ILIKE ? OR p.sku ILIKE ?) GROUP BY p.id,m.location_id HAVING SUM(m.quantity)>0").all(bu,loc,loc,search,search);
  res.json({locations,stock:[...raw,...finished,...packaging],transfers:await db.prepare('SELECT * FROM warehouse_transfers WHERE business_unit_id=? ORDER BY id DESC LIMIT 100').all(bu)});
 }));
 app.post('/api/warehouses-v701/transfers',auth,allow('inventory'),safe(async(req,res)=>{
  const bu=scope(req);if(!await can(req,'inventory'))fail('Inventory edit permission is required.',403);
  const b=req.body,type=b.stock_type,quantity=Number(b.quantity),id=Number(b.stock_id),from=Number(b.from_location_id)||null,to=Number(b.to_location_id),lot=Number(b.lot_id)||null,batch=Number(b.production_batch_id)||null,key=String(b.idempotency_key||''),reason=String(b.reason||'').trim(),date=String(b.movement_date||'');
  if(!['raw','finished'].includes(type)||!id||!Number.isFinite(quantity)||quantity<=0||Math.abs(quantity*10000-Math.round(quantity*10000))>1e-7||!to||from===to||!reason||!key||key.length>100||!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date).toISOString().slice(0,10)!==date)fail('Enter valid stock, distinct locations, quantity, date and reason.');
  if(type==='finished'&&!Number.isInteger(quantity))fail('Finished products must use whole units.');
  const hash=crypto.createHash('sha256').update(JSON.stringify({type,quantity,id,from,to,lot,batch,reason,date})).digest('hex');
  const result=await db.atomic(async()=>{
   await db.prepare('SELECT pg_advisory_xact_lock(CAST(? AS INTEGER),CAST(? AS INTEGER))').get(type==='raw'?701001:701002,id);if(await accounting.isPeriodClosed(bu,date))fail('This accounting period is closed.',409);
   const replay=await db.prepare('SELECT * FROM warehouse_transfers WHERE business_unit_id=? AND idempotency_key=?').get(bu,key);if(replay){if(replay.payload_hash!==hash)fail('This request key was already used with different details.',409);return {id:replay.id,replayed:true}}
   for(const lid of [from,to].filter(Boolean))if(!await db.prepare('SELECT id FROM pink_salt_storage_locations WHERE id=? AND business_unit_id=? AND active=1').get(lid,bu))fail('Choose active warehouses in this business unit.');
   const raw=type==='raw',table=raw?'pink_salt_raw_stock_movements':'pink_salt_finished_stock_movements',col=raw?'import_item_id':'product_id',q=raw?'quantity_kg':'quantity_units';
   const rows=await db.prepare(`SELECT * FROM ${table} WHERE business_unit_id=? AND ${col}=? AND COALESCE(location_id,0)=? ${raw?'':'AND COALESCE(lot_id,0)=? AND COALESCE(production_batch_id,0)=?'} FOR UPDATE`).all(bu,id,from||0,...(raw?[]:[lot||0,batch||0]));
   const net=Number((await db.prepare(`SELECT COALESCE(SUM(${q}),0) n FROM ${table} WHERE business_unit_id=? AND ${col}=?`).get(bu,id)).n),balance=Math.min(net,rows.reduce((n,r)=>n+Number(r[q]),0));if(quantity>balance+1e-8)fail('Insufficient stock at the source warehouse.',409);
   // Until location reservations are introduced, a reserved product cannot be transferred.
   if(!raw){const reserved=Number((await db.prepare("SELECT COALESCE(SUM(i.quantity_units),0) n FROM pink_salt_order_items i JOIN pink_salt_orders o ON o.id=i.order_id WHERE i.product_id=? AND o.business_unit_id=? AND o.status='Reserved'").get(id,bu)).n);if(quantity>Math.max(0,net-reserved))fail('Transfer quantity exceeds unreserved finished stock.',409);}
   const transfer=Number((await db.prepare('INSERT INTO warehouse_transfers(business_unit_id,idempotency_key,payload_hash,stock_type,stock_id,lot_id,production_batch_id,from_location_id,to_location_id,quantity,movement_date,reason,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(bu,key,hash,type,id,lot,batch,from,to,quantity,date,reason,req.user.id)).lastInsertRowid);
   const cost=raw?0:Number(rows.find(r=>Number(r.unit_cost_krw)>0)?.unit_cost_krw||0);
   for(const [location,amount] of [[from,-quantity],[to,quantity]]){
    const data={business_unit_id:bu,[col]:id,movement_date:date,movement_type:'Warehouse Transfer',[q]:amount,reference_type:'Warehouse Transfer',reference_id:transfer,reference:'WHT-'+transfer,notes:reason,created_by:req.user.id,location_id:location,...(!raw?{lot_id:lot,production_batch_id:batch,unit_cost_krw:cost}:{})};
    await db.prepare(`INSERT INTO ${table}(${Object.keys(data).join(',')}) VALUES(${Object.keys(data).map(()=>'?')})`).run(...Object.values(data));
   }
   await audit(req.user,'warehouse_transfer',transfer,'create',JSON.stringify(b));return {id:transfer};
  })();res.json({ok:true,...result});
 }));
 app.get('/api/pink-salt/orders/:id/invoice.pdf',auth,allow('sales','finance','inventory'),safe(async(req,res)=>{
  const bu=scope(req),o=await db.prepare('SELECT o.*,COALESCE(c.name,o.customer_name) customer,c.address customer_address,c.email customer_email,c.phone customer_phone FROM pink_salt_orders o LEFT JOIN pink_salt_customers c ON c.id=o.customer_id WHERE o.id=? AND o.business_unit_id=?').get(Number(req.params.id),bu);if(!o)fail('Sale not found.',404);
  const items=await db.prepare('SELECT i.*,p.sku,p.name FROM pink_salt_order_items i JOIN pink_salt_products p ON p.id=i.product_id WHERE i.order_id=? ORDER BY i.id').all(o.id);
  // Reuse the exact purchase invoice table and company branding renderer.
  const unit=await db.prepare('SELECT name FROM business_units WHERE id=?').get(bu),ko=String(req.query.lang||req.headers['x-language']||'en').startsWith('ko'),N=x=>Number(x||0).toLocaleString(ko?'ko-KR':'en-US');
  const receipt=await app.locals.bomPinkFX?.context(req,'order',o.id);
  const p={purchase_no:o.order_no,status:o.status,revision:1,purchase_date:o.order_date,invoice_reference:o.order_no,supplier_snapshot:JSON.stringify({name:o.customer,address:o.customer_address,email:o.customer_email,phone:o.customer_phone}),costs_json:JSON.stringify(Number(o.delivery_fee_krw)?[{description:ko?'배송비':'Delivery Fee',amount:o.delivery_fee_krw,treatment:'operating'}]:[]),currency:'KRW',recognition_rate:1,invoice_discount:Number(o.discount_krw||0),subtotal:Number(o.subtotal_krw||0)-Number(o.discount_krw||0),tax_total:0,total_amount:o.total_krw,total_krw:o.total_krw,payment_terms:o.credit_terms_days+' '+(ko?'일':'days'),expected_date:o.due_date,destination:o.customer_address||'',notes:o.notes,financial:{advance_krw:0,paid_krw:0,outstanding_invoice:o.total_krw},lines:items.map((l,i)=>({quantity:l.quantity_units,purchase_unit:ko?'개':'units',unit_price:l.unit_price_krw,discount:0,tax_amount:0,tax_percent:0,total_amount:Number(l.quantity_units)*Number(l.unit_price_krw),base_quantity:l.quantity_units,snapshot:{sku:l.sku,name:l.name,unit:ko?'개':'units'}}))};
  if(receipt){p.financial.outstanding_invoice=receipt.outstanding_krw;p.financial.paid_krw=Math.max(0,Number(o.total_krw)-Number(receipt.outstanding_krw))}
  let markup=require('./qa43').invoiceHtml(p,unit,ko);
  for(const [a,b] of ko?[['포장재 구매 송장','매출 송장'],['예상 납품일','결제 기한'],['배송지','배송 주소'],['공급업체 주소','고객 주소'],['공급업체 참조','송장 번호'],['공급업체','고객'],['자재 / 규격','제품'],['구매일','판매일'],['총 지급액','청구 합계']]:[['Packaging Purchase Invoice','Sales Invoice'],['Expected Delivery','Due Date'],['Delivery Destination','Delivery Address'],['Supplier Address','Customer Address'],['Supplier Reference','Invoice Number'],['Supplier','Customer'],['Material / Specification','Product'],['Purchase Date','Sale Date'],['Total Payable','Invoice Total']])markup=markup.split(a).join(b);
  markup=markup.replace(/<footer class="muted">[\s\S]*?<\/footer>/,`<footer class="muted">${E(ko?'기록된 매출에서 생성되었습니다. 결제 상태는 기록된 수령액을 기준으로 합니다.':'Generated from the saved sale. Payment status follows recorded customer receipts.')} · ${E(ko?'상태':'Status')}: ${E(ko?({Completed:'판매 완료',Reserved:'예약됨',Cancelled:'취소됨'}[o.status]||o.status):o.status)} · ${N(p.financial.outstanding_invoice)} KRW ${E(ko?'미결제':'outstanding')}</footer>`);
  markup=brandHtml(markup,await branding(db,bu));
  if(req.query.format==='html')return res.type('html').send(markup);
  const bytes=await app.locals.bomInvoice43.render(markup);res.type('pdf').set('Cache-Control','private, no-store').set('Content-Disposition',`attachment; filename="${o.order_no.replace(/[^a-z0-9_-]/gi,'_')}_invoice.pdf"`).send(bytes);
 }));
 app.locals.bomDocumentBranding={get:bu=>branding(db,bu),apply:brandHtml};
}
async function reportHtml(db,bu,markup){
 const b=await branding(db,Number(bu)||0);let html=String(markup);
 if(!html.includes('<div class="brand">BLUE OCEAN MARKET</div>')){
  if(/<body[^>]*>/i.test(html))html=html.replace(/<body[^>]*>/i,m=>m+'<div class="brand">BLUE OCEAN MARKET</div>');
  else if(/<h1[ >]/i.test(html))html=html.replace(/<h1/i,'<div class="brand">BLUE OCEAN MARKET</div><h1');
 }
 return brandHtml(html,b);
}
async function reportBrandKey(db,bu){return crypto.createHash('sha256').update(JSON.stringify(await branding(db,bu))).digest('hex')}
async function markReport(db,bu,file){fs.writeFileSync(file+'.branding',await reportBrandKey(db,bu))}
async function reportFresh(db,bu,file){try{return fs.readFileSync(file+'.branding','utf8')===await reportBrandKey(db,bu)}catch{return false}}
module.exports={install,branding,brandHtml,reportHtml,markReport,reportFresh};
