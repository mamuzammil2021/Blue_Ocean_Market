const crypto=require('crypto');
const jwt=require('jsonwebtoken');
const realExpress=require('express');
const db=require('./db');

const VERSION='28.4.0';
const SECRET=String(process.env.JWT_SECRET||'');
let appRef=null;
let deferredCatchAll=null;

// V28.4 is additive. Never delete or reset historical/development data.
db.exec(`
CREATE TABLE IF NOT EXISTS request_idempotency(
  idempotency_key TEXT NOT NULL,
  method TEXT NOT NULL,
  request_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  response_status INTEGER,
  response_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  PRIMARY KEY(idempotency_key,method,request_path)
);
CREATE INDEX IF NOT EXISTS idx_request_idempotency_created ON request_idempotency(created_at);
`);
try{
  db.exec(`CREATE TRIGGER IF NOT EXISTS prevent_duplicate_buyer_resale_share
    BEFORE INSERT ON excavator_buyer_resale_shares
    WHEN EXISTS(
      SELECT 1 FROM excavator_buyer_resale_shares
      WHERE buyer_id=NEW.buyer_id AND asset_id=NEW.asset_id
    )
    BEGIN
      SELECT RAISE(ABORT,'Resale record already exists for this buyer and machine');
    END;`);
}catch(e){console.error('V28.4 resale duplicate trigger:',e.message)}
try{db.prepare("DELETE FROM request_idempotency WHERE datetime(created_at)<datetime('now','-2 days')").run()}catch(_){}

function safeJson(value){try{return JSON.stringify(value)}catch(_){return JSON.stringify({ok:true})}}
function idempotency(req,res,next){
  const key=String(req.headers['x-idempotency-key']||'').trim().slice(0,160);
  if(!key)return next();
  const method=String(req.method||'POST').toUpperCase(),requestPath=String(req.path||req.originalUrl||'').slice(0,500);
  let inserted=false;
  try{
    const result=db.prepare('INSERT OR IGNORE INTO request_idempotency(idempotency_key,method,request_path,status) VALUES(?,?,?,\'processing\')').run(key,method,requestPath);
    inserted=!!result.changes;
    if(!inserted){
      const old=db.prepare('SELECT * FROM request_idempotency WHERE idempotency_key=? AND method=? AND request_path=?').get(key,method,requestPath);
      if(old?.status==='completed'&&old.response_json){
        let body={};try{body=JSON.parse(old.response_json)}catch(_){body={ok:true,replayed:true}}
        res.set('X-Idempotency-Replayed','1');
        return res.status(Number(old.response_status||200)).json(body);
      }
      return res.status(409).json({error:'This action is already being processed. Please wait.',duplicate_prevented:true,idempotency_key:key});
    }
  }catch(e){console.error('V28.4 idempotency start:',e.message);return next()}
  const originalJson=res.json.bind(res);
  res.json=(body)=>{
    try{
      const code=Number(res.statusCode||200);
      if(code<500)db.prepare("UPDATE request_idempotency SET status='completed',response_status=?,response_json=?,completed_at=CURRENT_TIMESTAMP WHERE idempotency_key=? AND method=? AND request_path=?").run(code,safeJson(body),key,method,requestPath);
      else db.prepare('DELETE FROM request_idempotency WHERE idempotency_key=? AND method=? AND request_path=?').run(key,method,requestPath);
    }catch(e){console.error('V28.4 idempotency finish:',e.message)}
    return originalJson(body);
  };
  next();
}

function resaleDuplicateGuard(req,res,next){
  try{
    const buyerId=Number(req.params.id||0),assetId=Number(req.body.asset_id||0);
    if(!buyerId||!assetId)return next();
    const buyer=db.prepare('SELECT id,business_unit_id,country FROM excavator_buyers WHERE id=?').get(buyerId);
    if(!buyer)return res.status(404).json({error:'Buyer not found'});
    const asset=db.prepare("SELECT id,buyer_id,lifecycle_stage FROM excavator_assets WHERE id=? AND business_unit_id=?").get(assetId,buyer.business_unit_id);
    if(!asset||Number(asset.buyer_id)!==buyerId||asset.lifecycle_stage!=='Sold / Completed')return res.status(400).json({error:'Select a sold machine that belongs to this buyer.'});
    const existing=db.prepare('SELECT id FROM excavator_buyer_resale_shares WHERE buyer_id=? AND asset_id=? LIMIT 1').get(buyerId,assetId);
    if(existing)return res.status(409).json({error:'A Pakistan resale profit-share record already exists for this machine. Edit the existing record instead.',duplicate_prevented:true,existing_record_id:existing.id});
    next();
  }catch(e){res.status(400).json({error:e.message||'Resale record could not be validated.'})}
}

function duplicateBuyerGuard(req,res,next){
  try{
    const name=String(req.body.name||'').trim().toLowerCase(),country=(String(req.body.buyer_type||'International')==='Local'?'South Korea':String(req.body.country||'')).trim().toLowerCase();
    if(!name)return next();
    const phone=String(req.body.phone||'').replace(/\D/g,''),email=String(req.body.email||'').trim().toLowerCase();
    const recent=db.prepare(`SELECT id,name FROM excavator_buyers WHERE lower(trim(name))=? AND lower(trim(country))=?
      AND ((?<>'' AND replace(replace(replace(replace(COALESCE(phone,''),' ',''),'-',''),'(',''),')','') LIKE '%'||?) OR (?<>'' AND lower(trim(COALESCE(email,'')))=?))
      AND datetime(created_at)>=datetime('now','-2 minutes') ORDER BY id DESC LIMIT 1`).get(name,country,phone,phone,email,email);
    if(recent)return res.status(409).json({error:'This buyer appears to have just been added already. Open the existing buyer instead of creating a duplicate.',duplicate_prevented:true,existing_buyer_id:recent.id});
  }catch(_){}
  next();
}

function wrapApp(app){
  appRef=app;
  for(const method of ['post','put','patch','delete']){
    const original=app[method].bind(app);
    app[method]=(route,...handlers)=>{
      const hs=[...handlers];
      if(method==='post'&&route==='/api/excavator/buyers/:id/resale-shares'&&hs.length)hs.splice(Math.max(0,hs.length-1),0,resaleDuplicateGuard);
      if(method==='post'&&route==='/api/excavator/buyers'&&hs.length)hs.splice(Math.max(0,hs.length-1),0,duplicateBuyerGuard);
      return original(route,idempotency,...hs);
    };
  }
  const realGet=app.get.bind(app);
  app.get=(route,...handlers)=>{
    if(route instanceof RegExp){deferredCatchAll=[route,...handlers];return app}
    if(route==='/api/health')return realGet(route,(req,res)=>res.json({ok:true,version:VERSION}));
    return realGet(route,...handlers);
  };
  return app;
}
function wrappedExpress(...args){return wrapApp(realExpress(...args))}
Object.assign(wrappedExpress,realExpress);
require.cache[require.resolve('express')].exports=wrappedExpress;
require('./server');
const app=appRef;
if(!app)throw new Error('V28.4 bootstrap could not capture Express application');

function auth284(req,res,next){
  const h=String(req.headers.authorization||'');
  if(!h.startsWith('Bearer '))return res.status(401).json({error:'Authentication required'});
  try{
    const token=jwt.verify(h.slice(7),SECRET),user=db.prepare('SELECT id,name,email,role,business_unit_id,active FROM users WHERE id=? AND active=1').get(token.id);
    if(!user)return res.status(401).json({error:'User is no longer active'});
    req.v284User=user;
    const requested=Number(req.headers['x-business-unit-id']||0)||null;
    req.v284Unit=user.role==='CEO / Owner'?(requested||null):(Number(user.business_unit_id||0)||null);
    next();
  }catch(e){res.status(401).json({error:'Invalid or expired session'})}
}
function canUnit(req,unitId){return req.v284User.role==='CEO / Owner'?(!req.v284Unit||Number(req.v284Unit)===Number(unitId)):Number(req.v284User.business_unit_id)===Number(unitId)}
function dateValue(v){return String(v||'').slice(0,10)}
function inRange(date,from,to){const d=dateValue(date);return (!from||d>=from)&&(!to||d<=to)}
function beforeRange(date,from){return !!from&&dateValue(date)<from}
function statementRows(rows,{from='',to='',opening=0,balanceMode='credit-minus-debit'}={}){
  let balance=Number(opening||0);
  return rows.filter(r=>inRange(r.date,from,to)).sort((a,b)=>String(a.date).localeCompare(String(b.date))||Number(a.order||0)-Number(b.order||0)).map(r=>{
    const debit=Number(r.debit||0),credit=Number(r.credit||0);
    balance+=balanceMode==='debit-minus-credit'?debit-credit:credit-debit;
    return {...r,debit,credit,balance};
  });
}
function money(n){return Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
const KO={Statement:'명세서','Financial Statement':'재무 명세서','Buyer Statement':'구매자 명세서','Supplier Statement':'공급업체 명세서','Pakistan Resale Profit Share Statement':'파키스탄 재판매 이익 배분 명세서','Profile Summary':'프로필 요약','Statement Period':'명세 기간','Opening Balance':'기초 잔액','Closing Balance':'기말 잔액','Total Debit':'총 차변','Total Credit':'총 대변','Total Received':'총 수령액','Total Outstanding':'총 미수금','Total Company Share':'회사 지분 합계','Date':'날짜','Description':'설명','Reference':'참조','Debit':'차변','Credit':'대변','Balance':'잔액','Name':'이름','Country':'국가','Buyer Type':'구매자 유형','Contact Person':'담당자','Phone':'전화','Email':'이메일','Address':'주소','Location':'위치','Payment Terms':'결제 조건','Business Unit':'사업부','Machines Sold':'판매 장비','Available Advance':'사용 가능 선급금','Total Paid':'총 수령액','Allocated':'배정액','Refunded':'환불액','Supplier':'공급업체','Machines Purchased':'구매 장비','Total Purchases':'총 구매액','Total Paid to Supplier':'공급업체 지급액','Outstanding Payable':'미지급금','Machine / Deal':'장비 / 거래','Original Sale Price':'원 판매 가격','Pakistan Resale Price':'파키스탄 재판매 가격','Manual Resale Profit':'수동 재판매 이익','Our Share':'당사 지분','Received':'수령','Outstanding':'미수','Status':'상태','Generated':'생성일'};
function tr(s,lang){return lang==='ko'?(KO[s]||s):s}
function escPdf(s){return String(s??'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' ')}
function unicodeHex(s){const le=Buffer.from('\uFEFF'+String(s??''),'utf16le');for(let i=0;i<le.length;i+=2){const x=le[i];le[i]=le[i+1];le[i+1]=x}return '<'+le.toString('hex').toUpperCase()+'>'}
function pdfToken(s,lang){const v=tr(String(s??''),lang);return /[^\x20-\x7e]/.test(v)?unicodeHex(v):`(${escPdf(v)})`}
function statementPdf(statement,lang='ko'){
  lang=lang==='en'?'en':'ko';const W=612,H=792,M=38;let pages=[],c=[],y=742,page=0;
  const begin=()=>{if(c.length){c.push('ET');pages.push(c.join('\n'))}page++;c=['BT',`/F${lang==='ko'?3:1} 9 Tf`,'0.1 0.14 0.22 rg'];y=742};
  const text=(x,yy,val,size=9,bold=false)=>{const v=tr(val,lang),u=/[^\x20-\x7e]/.test(v);c.push(`/F${u?(bold?4:3):(bold?2:1)} ${size} Tf`,`1 0 0 1 ${x} ${yy} Tm ${pdfToken(val,lang)} Tj`)};
  const ensure=h=>{if(y-h<42)begin()};
  const line=(label,value)=>{ensure(16);text(M,y,label,8,true);text(M+150,y,String(value??''),8,false);y-=14};
  const title=()=>{text(M,y,'BLUE OCEAN MARKET',15,true);y-=20;text(M,y,statement.title,14,true);y-=20;text(M,y,'Statement Period',8,true);text(M+150,y,`${statement.period.from||'Beginning'} - ${statement.period.to||'Current'}`,8);y-=22};
  begin();title();
  if(statement.profile){text(M,y,'Profile Summary',10,true);y-=16;for(const [k,v] of Object.entries(statement.profile)){if(v!==''&&v!=null)line(k,v)}y-=5}
  if(statement.summary){for(const [k,v] of Object.entries(statement.summary)){if(v!==''&&v!=null)line(k,typeof v==='number'?money(v):v)}y-=6}
  const headers=['Date','Description','Reference','Debit','Credit','Balance'];ensure(30);headers.forEach((h,i)=>text([M,M+60,M+270,M+370,M+425,M+480][i],y,h,7,true));y-=14;
  for(const r of statement.rows){ensure(28);text(M,y,dateValue(r.date),7);text(M+60,y,String(r.description||'').slice(0,42),7);text(M+270,y,String(r.reference||'').slice(0,18),7);text(M+370,y,r.debit?money(r.debit):'',7);text(M+425,y,r.credit?money(r.credit):'',7);text(M+480,y,money(r.balance),7);y-=13;if(r.machine){text(M+60,y,String(r.machine).slice(0,55),6);y-=10}}
  c.push('ET');pages.push(c.join('\n'));
  const objs=[null,null,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>','<< /Type /Font /Subtype /Type0 /BaseFont /HYSMyeongJo-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [7 0 R] >>','<< /Type /Font /Subtype /Type0 /BaseFont /HYGoThic-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [8 0 R] >>','<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYSMyeongJo-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> >>','<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYGoThic-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> >>'],pageIds=[];
  for(const stream of pages){const content=objs.length+1,pid=objs.length+2;objs.push(`<< /Length ${Buffer.byteLength(stream,'binary')} >>\nstream\n${stream}\nendstream`);objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents ${content} 0 R >>`);pageIds.push(pid)}
  objs[0]='<< /Type /Catalog /Pages 2 0 R >>';objs[1]=`<< /Type /Pages /Kids [${pageIds.map(x=>x+' 0 R').join(' ')}] /Count ${pageIds.length} >>`;
  let out='%PDF-1.4\n',offset=[0];for(let i=0;i<objs.length;i++){offset[i+1]=Buffer.byteLength(out,'binary');out+=`${i+1} 0 obj\n${objs[i]}\nendobj\n`}const xref=Buffer.byteLength(out,'binary');out+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;for(let i=1;i<offset.length;i++)out+=String(offset[i]).padStart(10,'0')+' 00000 n \n';out+=`trailer\n<< /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return Buffer.from(out,'binary');
}
function sendPdf(res,statement,lang,file){const pdf=statementPdf(statement,lang);res.set('Content-Type','application/pdf');res.set('Content-Disposition',`attachment; filename="${file}"`);res.send(pdf)}
function financeStatement(req){
  const from=dateValue(req.query.from),to=dateValue(req.query.to),unit=req.v284Unit;
  if(req.v284User.role!=='CEO / Owner'&&!unit)throw new Error('No business unit is assigned to this user.');
  let q="SELECT f.*,b.name business_unit_name FROM finance_entries f LEFT JOIN business_units b ON b.id=f.business_unit_id WHERE f.status!='Voided'",args=[];
  if(unit){q+=' AND f.business_unit_id=?';args.push(unit)}
  const all=db.prepare(q+' ORDER BY COALESCE(f.transaction_date,date(f.created_at)),f.id').all(...args).map(f=>({date:f.transaction_date||f.created_at,description:`${f.category||f.type}${f.description?' · '+f.description:''}`,reference:f.reference||'',debit:f.type==='Expense'?Number(f.krw_amount||f.amount||0):0,credit:f.type==='Revenue'?Number(f.krw_amount||f.amount||0):0,status:f.verification_status||f.status,currency:f.original_currency||'KRW',business_unit:f.business_unit_name,order:f.id}));
  const opening=all.filter(r=>beforeRange(r.date,from)).reduce((n,r)=>n+r.credit-r.debit,0),rows=statementRows(all,{from,to,opening}),td=rows.reduce((n,r)=>n+r.debit,0),tc=rows.reduce((n,r)=>n+r.credit,0);
  return {title:'Financial Statement',period:{from,to},profile:unit?{'Business Unit':db.prepare('SELECT name FROM business_units WHERE id=?').get(unit)?.name||unit}:{'Business Unit':'All Business Units'},summary:{'Opening Balance':opening,'Total Debit':td,'Total Credit':tc,'Closing Balance':opening+tc-td},rows};
}
function buyerStatement(req,buyerId){
  const buyer=db.prepare('SELECT x.*,b.name business_unit_name FROM excavator_buyers x LEFT JOIN business_units b ON b.id=x.business_unit_id WHERE x.id=?').get(buyerId);if(!buyer)throw new Error('Buyer not found');if(!canUnit(req,buyer.business_unit_id))throw new Error('You cannot access another business unit buyer.');const from=dateValue(req.query.from),to=dateValue(req.query.to),events=[];
  db.prepare("SELECT * FROM excavator_buyer_payments WHERE buyer_id=? AND status='Active'").all(buyerId).forEach(p=>events.push({date:p.payment_date||p.created_at,description:`Buyer payment · ${p.payment_type||'Advance'}`,reference:p.reference||'',credit:Number(p.krw_amount||0),debit:0,order:p.id*10+1}));
  db.prepare(`SELECT al.*,p.reference,p.payment_date,a.asset_no,a.machine_name,a.make,a.model FROM excavator_buyer_payment_allocations al JOIN excavator_buyer_payments p ON p.id=al.payment_id JOIN excavator_assets a ON a.id=al.asset_id WHERE al.buyer_id=? AND COALESCE(al.status,'Active')='Active' AND p.status='Active'`).all(buyerId).forEach(x=>events.push({date:x.allocation_date||x.payment_date,description:'Machine advance allocation',reference:x.reference||x.asset_no||'',debit:Number(x.amount_krw||0),credit:0,machine:`${x.asset_no||''} · ${x.machine_name||[x.make,x.model].filter(Boolean).join(' ')}`,order:x.id*10+2}));
  db.prepare("SELECT * FROM excavator_buyer_refunds WHERE buyer_id=? AND status='Completed'").all(buyerId).forEach(r=>events.push({date:r.refund_date||r.created_at,description:'Buyer advance refund',reference:r.reference||'',debit:Number(r.krw_amount||0),credit:0,order:r.id*10+3}));
  const opening=events.filter(r=>beforeRange(r.date,from)).reduce((n,r)=>n+r.credit-r.debit,0),rows=statementRows(events,{from,to,opening}),paid=events.reduce((n,r)=>n+r.credit,0),used=events.reduce((n,r)=>n+r.debit,0),machines=db.prepare('SELECT COUNT(*) c FROM excavator_assets WHERE buyer_id=? AND business_unit_id=?').get(buyerId,buyer.business_unit_id).c;
  return {title:'Buyer Statement',period:{from,to},profile:{Name:buyer.name,'Buyer Type':buyer.buyer_type,Country:buyer.country,'Contact Person':buyer.contact_person,Phone:buyer.phone,Email:buyer.email,Address:buyer.address,Location:buyer.location,'Payment Terms':buyer.payment_terms,'Business Unit':buyer.business_unit_name},summary:{'Machines Sold':Number(machines||0),'Total Paid':paid,Allocated:used,'Available Advance':Math.max(0,paid-used),'Opening Balance':opening,'Closing Balance':rows.length?rows[rows.length-1].balance:opening},rows};
}
function supplierStatement(req,supplierId){
  const s=db.prepare('SELECT s.*,b.name business_unit_name FROM excavator_suppliers s LEFT JOIN business_units b ON b.id=s.business_unit_id WHERE s.id=?').get(supplierId);if(!s)throw new Error('Supplier not found');if(!canUnit(req,s.business_unit_id))throw new Error('You cannot access another business unit supplier.');const from=dateValue(req.query.from),to=dateValue(req.query.to),events=[];
  const assets=db.prepare('SELECT * FROM excavator_assets WHERE supplier_id=? AND business_unit_id=?').all(s.id,s.business_unit_id);for(const a of assets){events.push({date:a.purchase_date||a.created_at,description:'Machine purchase',reference:a.asset_no||'',debit:0,credit:Number(a.purchase_price||0),machine:`${a.asset_no||''} · ${a.machine_name||[a.make,a.model].filter(Boolean).join(' ')}`,order:a.id*10+1});db.prepare("SELECT * FROM excavator_payments WHERE asset_id=? AND payment_type='Purchase' AND status='Paid'").all(a.id).forEach(p=>events.push({date:p.paid_date||p.created_at,description:'Payment to supplier',reference:p.reference||a.asset_no||'',debit:Number(p.amount||0),credit:0,machine:a.asset_no||'',order:p.id*10+2}))}
  const opening=events.filter(r=>beforeRange(r.date,from)).reduce((n,r)=>n+r.credit-r.debit,0),rows=statementRows(events,{from,to,opening}),purchases=events.reduce((n,r)=>n+r.credit,0),paid=events.reduce((n,r)=>n+r.debit,0);
  return {title:'Supplier Statement',period:{from,to},profile:{Supplier:s.name,'Contact Person':s.contact_person,Phone:s.phone,Email:s.email,Address:s.address,Location:s.location,'Business Unit':s.business_unit_name},summary:{'Machines Purchased':assets.length,'Total Purchases':purchases,'Total Paid to Supplier':paid,'Outstanding Payable':Math.max(0,purchases-paid),'Opening Balance':opening,'Closing Balance':rows.length?rows[rows.length-1].balance:opening},rows};
}
function resaleStatement(req,buyerId){
  const buyer=db.prepare('SELECT x.*,b.name business_unit_name FROM excavator_buyers x LEFT JOIN business_units b ON b.id=x.business_unit_id WHERE x.id=?').get(buyerId);if(!buyer)throw new Error('Buyer not found');if(!canUnit(req,buyer.business_unit_id))throw new Error('You cannot access another business unit buyer.');if(String(buyer.country||'').trim().toLowerCase()!=='pakistan')throw new Error('Pakistan Resale Profit Share is available only for Pakistani buyers.');const from=dateValue(req.query.from),to=dateValue(req.query.to),events=[];
  const records=db.prepare(`SELECT r.*,a.asset_no,a.machine_name,a.make,a.model,a.selling_price FROM excavator_buyer_resale_shares r JOIN excavator_assets a ON a.id=r.asset_id WHERE r.buyer_id=? AND a.business_unit_id=? ORDER BY r.id`).all(buyer.id,buyer.business_unit_id);
  for(const r of records){const machine=`${r.asset_no||''} · ${r.machine_name||[r.make,r.model].filter(Boolean).join(' ')}`;events.push({date:r.created_at,description:`Profit share due · ${r.share_percent||0}% · Resale PKR ${money(r.resale_price_pkr)}`,reference:r.reference||r.asset_no||'',debit:Number(r.our_share_pkr||0),credit:0,machine,order:r.id*10+1});if(Number(r.amount_received_pkr||0)>0)events.push({date:r.received_date||r.created_at,description:'Profit share received',reference:r.reference||'',debit:0,credit:Number(r.amount_received_pkr||0),machine,order:r.id*10+2})}
  const opening=events.filter(r=>beforeRange(r.date,from)).reduce((n,r)=>n+r.debit-r.credit,0),rows=statementRows(events,{from,to,opening,balanceMode:'debit-minus-credit'}),share=records.reduce((n,r)=>n+Number(r.our_share_pkr||0),0),received=records.reduce((n,r)=>n+Number(r.amount_received_pkr||0),0);
  return {title:'Pakistan Resale Profit Share Statement',period:{from,to},profile:{Name:buyer.name,Country:buyer.country,'Contact Person':buyer.contact_person,Phone:buyer.phone,Email:buyer.email,'Business Unit':buyer.business_unit_name},summary:{'Machines Sold':records.length,'Total Company Share':share,'Total Received':received,'Total Outstanding':Math.max(0,share-received),'Opening Balance':opening,'Closing Balance':rows.length?rows[rows.length-1].balance:opening},rows,records:records.map(r=>({asset_id:r.asset_id,machine:`${r.asset_no} · ${r.machine_name||[r.make,r.model].filter(Boolean).join(' ')}`,'Original Sale Price':Number(r.selling_price||0),'Pakistan Resale Price':Number(r.resale_price_pkr||0),'Manual Resale Profit':Number(r.resale_profit_pkr||0),'Our Share':Number(r.our_share_pkr||0),Received:Number(r.amount_received_pkr||0),Outstanding:Number(r.outstanding_pkr||0),Status:Number(r.outstanding_pkr||0)<=0?'Received':Number(r.amount_received_pkr||0)>0?'Partially Received':'Pending'}))};
}
function routeStatement(path,builder,filePrefix){
  app.get(path,auth284,(req,res)=>{try{res.json(builder(req,Number(req.params.id||0)))}catch(e){res.status(/another business unit/.test(e.message)?403:400).json({error:e.message})}});
  app.get(path+'.pdf',auth284,(req,res)=>{try{const st=builder(req,Number(req.params.id||0)),lang=req.query.lang==='en'||req.headers['x-language']==='en'?'en':'ko';sendPdf(res,st,lang,`${filePrefix}-${Date.now()}.pdf`)}catch(e){res.status(/another business unit/.test(e.message)?403:400).json({error:e.message})}});
}
routeStatement('/api/statements/finance',req=>financeStatement(req),'finance-statement');
routeStatement('/api/excavator/buyers/:id/statement',buyerStatement,'buyer-statement');
routeStatement('/api/excavator/suppliers/:id/statement',supplierStatement,'supplier-statement');
routeStatement('/api/excavator/buyers/:id/resale-statement',resaleStatement,'pakistan-resale-profit-share-statement');

if(deferredCatchAll)app.get(...deferredCatchAll);
console.log('Blue Ocean Market V28.4.0 extensions loaded: global idempotency, statements and resale integrity.');
