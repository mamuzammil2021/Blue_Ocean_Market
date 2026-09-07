'use strict';

const crypto=require('crypto');
const jwt=require('jsonwebtoken');

const VERSION='28.6.0';

function install({app,db,auth,allow,currentUnit,enforceUnit,isFinanceReviewer}){
  // Additive only: never reset or delete operational/development data.
  db.exec(`
    CREATE TABLE IF NOT EXISTS request_idempotency(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idempotency_key TEXT NOT NULL,
      request_fingerprint TEXT DEFAULT '',
      user_id INTEGER DEFAULT 0,
      method TEXT NOT NULL,
      request_path TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'processing',
      response_status INTEGER,
      response_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      UNIQUE(idempotency_key,method,request_path)
    );
    CREATE INDEX IF NOT EXISTS idx_request_idempotency_created_v284 ON request_idempotency(created_at);
    CREATE INDEX IF NOT EXISTS idx_request_idempotency_fingerprint_v284 ON request_idempotency(request_fingerprint,method,request_path,created_at);
  `);
  try{db.exec("ALTER TABLE request_idempotency ADD COLUMN request_fingerprint TEXT DEFAULT ''")}catch(_){ }
  try{db.exec("ALTER TABLE request_idempotency ADD COLUMN user_id INTEGER DEFAULT 0")}catch(_){ }
  try{db.exec(`CREATE TRIGGER IF NOT EXISTS prevent_duplicate_buyer_resale_share
    BEFORE INSERT ON excavator_buyer_resale_shares
    WHEN EXISTS(
      SELECT 1 FROM excavator_buyer_resale_shares
      WHERE buyer_id=NEW.buyer_id AND asset_id=NEW.asset_id
    )
    BEGIN
      SELECT RAISE(ABORT,'Resale record already exists for this buyer and machine');
    END;`)}catch(e){console.error('V28.4 resale duplicate trigger:',e.message)}
  try{db.prepare("DELETE FROM request_idempotency WHERE datetime(created_at)<datetime('now','-2 days')").run()}catch(_){ }

  function safeJson(value){try{return JSON.stringify(value)}catch(_){return JSON.stringify({ok:true})}}
  function mutationIdempotency(req,res,next){
    const method=String(req.method||'GET').toUpperCase();
    if(!['POST','PUT','PATCH','DELETE'].includes(method) || String(req.originalUrl||'').startsWith('/api/auth/'))return next();
    const key=String(req.headers['x-idempotency-key']||'').trim().slice(0,180);
    const fingerprint=String(req.headers['x-request-fingerprint']||'').trim().slice(0,180);
    if(!key&&!fingerprint)return next();
    const requestPath=String(req.path||req.originalUrl||'').slice(0,500);
    let userId=0;
    try{const h=String(req.headers.authorization||'');if(!h.startsWith('Bearer '))return next();userId=Number(jwt.verify(h.slice(7),String(process.env.JWT_SECRET||'')).id||0);if(!userId)return next()}catch(_){return next()}
    try{
      let old=null;
      if(fingerprint){
        old=db.prepare(`SELECT * FROM request_idempotency
          WHERE request_fingerprint=? AND user_id=? AND method=? AND request_path=?
            AND datetime(created_at)>=datetime('now','-15 seconds')
          ORDER BY id DESC LIMIT 1`).get(fingerprint,userId,method,requestPath);
      }
      if(old){
        if(old.status==='completed'&&old.response_json){
          let body={};try{body=JSON.parse(old.response_json)}catch(_){body={ok:true,replayed:true}}
          res.set('X-Idempotency-Replayed','1');
          return res.status(Number(old.response_status||200)).json(body);
        }
        return res.status(409).json({error:'This action is already being processed. Please wait.',duplicate_prevented:true});
      }
      const idKey=key||`fingerprint:${fingerprint}`;
      const inserted=db.prepare(`INSERT OR IGNORE INTO request_idempotency
        (idempotency_key,request_fingerprint,user_id,method,request_path,status)
        VALUES(?,?,?,?,?,'processing')`).run(idKey,fingerprint,userId,method,requestPath);
      if(!inserted.changes){
        const same=db.prepare('SELECT * FROM request_idempotency WHERE idempotency_key=? AND user_id=? AND method=? AND request_path=? ORDER BY id DESC LIMIT 1').get(idKey,userId,method,requestPath);
        if(same?.status==='completed'&&same.response_json){
          let body={};try{body=JSON.parse(same.response_json)}catch(_){body={ok:true,replayed:true}}
          res.set('X-Idempotency-Replayed','1');
          return res.status(Number(same.response_status||200)).json(body);
        }
        return res.status(409).json({error:'This action is already being processed. Please wait.',duplicate_prevented:true});
      }
      const rowId=Number(inserted.lastInsertRowid);
      const originalJson=res.json.bind(res);
      res.json=(body)=>{
        try{
          const code=Number(res.statusCode||200);
          // Only successful commits are replayable. Validation/auth/CEO-confirmation errors must be retryable.
          if(code>=200&&code<400){
            db.prepare("UPDATE request_idempotency SET status='completed',response_status=?,response_json=?,completed_at=CURRENT_TIMESTAMP WHERE id=?").run(code,safeJson(body),rowId);
          }else{
            db.prepare('DELETE FROM request_idempotency WHERE id=?').run(rowId);
          }
        }catch(e){console.error('V28.4 idempotency finish:',e.message)}
        return originalJson(body);
      };
      res.on('close',()=>{if(!res.writableEnded){try{db.prepare("DELETE FROM request_idempotency WHERE id=? AND status='processing'").run(rowId)}catch(_){}}});
      next();
    }catch(e){console.error('V28.4 idempotency:',e.message);next()}
  }

  // Registered before all legacy API routes.
  app.use('/api',mutationIdempotency);

  // First matching route wins over the legacy health route.
  // This historical module is installed before the current application
  // routes, so its diagnostic endpoint must not shadow /api/health.
  app.get('/api/v284/health',(req,res)=>res.json({ok:true,version:VERSION}));

  function dateOnly(v){return String(v||'').slice(0,10)}
  function normalizePeriod(req){
    let from=dateOnly(req.query.from||''),to=dateOnly(req.query.to||'');
    if(from&&to&&from>to){const t=from;from=to;to=t}
    return {from,to};
  }
  function inPeriod(date,from,to){const d=dateOnly(date);return (!from||d>=from)&&(!to||d<=to)}
  function beforePeriod(date,from){return !!from&&dateOnly(date)<from}
  function sum(rows,key){return rows.reduce((n,r)=>n+Number(r[key]||0),0)}
  function buildRunningRows(allRows,{from='',to='',opening=0,mode='credit-minus-debit'}={}){
    let balance=Number(opening||0);
    return allRows.filter(r=>inPeriod(r.date,from,to)).sort((a,b)=>String(a.date).localeCompare(String(b.date))||Number(a.order||0)-Number(b.order||0)).map(r=>{
      const debit=Number(r.debit||0),credit=Number(r.credit||0);
      balance+=mode==='debit-minus-credit'?debit-credit:credit-debit;
      return {...r,debit,credit,balance};
    });
  }
  function statementSummary(rows,opening){
    const totalDebit=sum(rows,'debit'),totalCredit=sum(rows,'credit');
    const closing=rows.length?Number(rows[rows.length-1].balance||0):Number(opening||0);
    return {'Opening Balance':Number(opening||0),'Total Debit':totalDebit,'Total Credit':totalCredit,'Closing Balance':closing};
  }
  function unitAccess(req,unitId){return enforceUnit(req,unitId)}
  function requireBuyer(req,res){
    const id=Number(req.params.id||0),buyer=db.prepare('SELECT * FROM excavator_buyers WHERE id=?').get(id);
    if(!buyer)return res.status(404).json({error:'Buyer not found'}),null;
    if(!unitAccess(req,buyer.business_unit_id))return res.status(403).json({error:'You cannot access another business unit buyer'}),null;
    return buyer;
  }
  function requireSupplier(req,res){
    const id=Number(req.params.id||0),supplier=db.prepare('SELECT * FROM excavator_suppliers WHERE id=?').get(id);
    if(!supplier)return res.status(404).json({error:'Supplier not found'}),null;
    if(!unitAccess(req,supplier.business_unit_id))return res.status(403).json({error:'You cannot access another business unit supplier'}),null;
    return supplier;
  }

  function financeStatement(req){
    const {from,to}=normalizePeriod(req),unit=currentUnit(req),args=[];
    let q=`SELECT f.*,b.name business_unit FROM finance_entries f JOIN business_units b ON b.id=f.business_unit_id WHERE f.status!='Voided'`;
    if(unit){q+=' AND f.business_unit_id=?';args.push(unit)}
    if(!isFinanceReviewer(req.user)){q+=' AND f.created_by=?';args.push(req.user.id)}
    const records=db.prepare(q+' ORDER BY COALESCE(f.transaction_date,f.created_at),f.id').all(...args);
    const all=records.map(f=>({
      date:dateOnly(f.transaction_date||f.created_at),order:f.id,
      description:`${f.business_unit||''}${f.business_unit?' · ':''}${f.category||f.type||'Finance'}${f.description?' · '+f.description:''}`,
      reference:f.reference||`FIN-${f.id}`,
      debit:String(f.type||'').toLowerCase()==='expense'?Number(f.krw_amount||f.amount||0):0,
      credit:String(f.type||'').toLowerCase()==='revenue'?Number(f.krw_amount||f.amount||0):0,
      source:f.source_type||'Manual'
    }));
    const opening=all.filter(r=>beforePeriod(r.date,from)).reduce((n,r)=>n+Number(r.credit||0)-Number(r.debit||0),0),rows=buildRunningRows(all,{from,to,opening});
    const selectedUnit=unit?db.prepare('SELECT name FROM business_units WHERE id=?').get(unit)?.name:'All Business Units';
    return {title:'Financial Statement',currency:'KRW',period:{from,to},profile:{'Business Unit':selectedUnit||'Business Unit'},summary:statementSummary(rows,opening),rows};
  }

  function buyerStatement(req,res){
    const buyer=requireBuyer(req,res);if(!buyer)return null;const {from,to}=normalizePeriod(req);
    const payments=db.prepare(`SELECT p.*,a.asset_no,a.machine_name FROM excavator_buyer_payments p LEFT JOIN excavator_assets a ON a.id=p.asset_id WHERE p.buyer_id=? AND p.status='Active' ORDER BY p.payment_date,p.id`).all(buyer.id);
    const allocations=db.prepare(`SELECT al.*,p.reference,a.asset_no,a.machine_name FROM excavator_buyer_payment_allocations al JOIN excavator_buyer_payments p ON p.id=al.payment_id AND p.status='Active' JOIN excavator_assets a ON a.id=al.asset_id WHERE al.buyer_id=? AND COALESCE(al.status,'Active')='Active' ORDER BY al.allocation_date,al.id`).all(buyer.id);
    const legacyAllocated=db.prepare(`SELECT p.*,a.asset_no,a.machine_name FROM excavator_buyer_payments p JOIN excavator_assets a ON a.id=p.asset_id WHERE p.buyer_id=? AND p.status='Active' AND p.asset_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM excavator_buyer_payment_allocations al WHERE al.payment_id=p.id AND COALESCE(al.status,'Active')='Active') ORDER BY p.payment_date,p.id`).all(buyer.id);
    const refunds=db.prepare("SELECT * FROM excavator_buyer_refunds WHERE buyer_id=? AND status='Completed' ORDER BY refund_date,id").all(buyer.id);
    const all=[];
    payments.forEach(p=>all.push({date:dateOnly(p.payment_date||p.created_at),order:p.id*10+1,description:`Buyer Payment · ${p.payment_type||'Payment'}${p.currency&&p.currency!=='KRW'?` · ${Number(p.original_amount||0).toLocaleString()} ${p.currency}`:''}`,reference:p.reference||`PAY-${p.id}`,debit:0,credit:Number(p.krw_amount||0),machine:p.asset_no?`${p.asset_no} · ${p.machine_name||''}`:''}));
    allocations.forEach(a=>all.push({date:dateOnly(a.allocation_date),order:a.id*10+2,description:'Advance Allocation to Machine',reference:a.reference||`ALLOC-${a.id}`,debit:Number(a.amount_krw||0),credit:0,machine:`${a.asset_no||''} · ${a.machine_name||''}`}));
    legacyAllocated.forEach(p=>all.push({date:dateOnly(p.payment_date||p.created_at),order:p.id*10+3,description:'Legacy Direct Machine Allocation',reference:p.reference||`ALLOC-${p.id}`,debit:Number(p.krw_amount||0),credit:0,machine:`${p.asset_no||''} · ${p.machine_name||''}`}));
    refunds.forEach(r=>all.push({date:dateOnly(r.refund_date||r.created_at),order:r.id*10+4,description:'Buyer Advance Refund',reference:r.reference||`REF-${r.id}`,debit:Number(r.krw_amount||0),credit:0}));
    const opening=all.filter(r=>beforePeriod(r.date,from)).reduce((n,r)=>n+Number(r.credit||0)-Number(r.debit||0),0),rows=buildRunningRows(all,{from,to,opening});
    const totalPaid=payments.reduce((n,p)=>n+Number(p.krw_amount||0),0),allocated=allocations.reduce((n,a)=>n+Number(a.amount_krw||0),0)+legacyAllocated.reduce((n,p)=>n+Number(p.krw_amount||0),0),refunded=refunds.reduce((n,r)=>n+Number(r.krw_amount||0),0),available=Math.max(0,totalPaid-allocated-refunded),machines=db.prepare('SELECT COUNT(*) c FROM excavator_assets WHERE buyer_id=? AND business_unit_id=?').get(buyer.id,buyer.business_unit_id).c;
    return {title:'Buyer Statement',currency:'KRW',period:{from,to},profile:{Name:buyer.name,'Buyer Type':buyer.buyer_type||'International',Country:buyer.country||'',Location:buyer.location||'','Contact Person':buyer.contact_person||'',Phone:buyer.phone||'',Email:buyer.email||'',Address:buyer.address||'','Payment Terms':buyer.payment_terms||''},summary:{...statementSummary(rows,opening),'Total Paid':totalPaid,Allocated:allocated,Refunded:refunded,'Available Advance':available,'Machines Sold':Number(machines||0)},rows};
  }

  function supplierStatement(req,res){
    const supplier=requireSupplier(req,res);if(!supplier)return null;const {from,to}=normalizePeriod(req);
    const assets=db.prepare('SELECT id,asset_no,machine_name,make,model,purchase_date,purchase_price FROM excavator_assets WHERE supplier_id=? AND business_unit_id=? ORDER BY purchase_date,id').all(supplier.id,supplier.business_unit_id);
    const payments=db.prepare(`SELECT p.*,a.asset_no,a.machine_name FROM excavator_payments p JOIN excavator_assets a ON a.id=p.asset_id WHERE a.supplier_id=? AND a.business_unit_id=? AND p.payment_type='Purchase' AND p.status='Paid' ORDER BY COALESCE(p.paid_date,p.created_at),p.id`).all(supplier.id,supplier.business_unit_id);
    const all=[];
    assets.forEach(a=>all.push({date:dateOnly(a.purchase_date),order:a.id*10+1,description:`Machine Purchase · ${a.asset_no} · ${a.machine_name||[a.make,a.model].filter(Boolean).join(' ')}`,reference:a.asset_no||`ASSET-${a.id}`,debit:0,credit:Number(a.purchase_price||0),machine:`${a.asset_no||''} · ${a.machine_name||''}`}));
    payments.forEach(p=>all.push({date:dateOnly(p.paid_date||p.created_at),order:p.id*10+2,description:`Payment to Supplier · ${p.asset_no||''}`,reference:p.reference||`PAY-${p.id}`,debit:Number(p.amount||0),credit:0,machine:`${p.asset_no||''} · ${p.machine_name||''}`}));
    const opening=all.filter(r=>beforePeriod(r.date,from)).reduce((n,r)=>n+Number(r.credit||0)-Number(r.debit||0),0),rows=buildRunningRows(all,{from,to,opening});
    const purchases=assets.reduce((n,a)=>n+Number(a.purchase_price||0),0),paid=payments.reduce((n,p)=>n+Number(p.amount||0),0),outstanding=Math.max(0,purchases-paid);
    return {title:'Supplier Statement',currency:'KRW',period:{from,to},profile:{Supplier:supplier.name,Location:supplier.location||'','Contact Person':supplier.contact_person||'',Phone:supplier.phone||'',Email:supplier.email||'',Address:supplier.address||''},summary:{...statementSummary(rows,opening),'Machines Purchased':assets.length,'Total Purchases':purchases,'Total Paid to Supplier':paid,'Outstanding Payable':outstanding},rows};
  }

  function resaleStatement(req,res){
    const buyer=requireBuyer(req,res);if(!buyer)return null;if(String(buyer.country||'').trim().toLowerCase()!=='pakistan'){res.status(403).json({error:'Pakistan Resale Profit Share is available only for Pakistani buyers.'});return null}const {from,to}=normalizePeriod(req);
    const records=db.prepare(`SELECT r.*,a.asset_no,a.machine_name,a.selling_price FROM excavator_buyer_resale_shares r JOIN excavator_assets a ON a.id=r.asset_id WHERE r.buyer_id=? AND a.business_unit_id=? ORDER BY COALESCE(r.received_date,r.created_at),r.id`).all(buyer.id,buyer.business_unit_id);
    const all=records.map(r=>({date:dateOnly(r.received_date||r.created_at),order:r.id,description:`Resale Share · ${r.asset_no} · ${r.machine_name||'Machine'}`,reference:r.reference||`RESALE-${r.id}`,debit:Number(r.amount_received_pkr||0),credit:Number(r.our_share_pkr||0),machine:`Original Sale KRW ${Number(r.selling_price||0).toLocaleString()} · Pakistan Resale PKR ${Number(r.resale_price_pkr||0).toLocaleString()} · Manual Profit PKR ${Number(r.resale_profit_pkr||0).toLocaleString()}`,status:r.received?'Received':'Outstanding'}));
    const opening=all.filter(r=>beforePeriod(r.date,from)).reduce((n,r)=>n+Number(r.credit||0)-Number(r.debit||0),0),rows=buildRunningRows(all,{from,to,opening});
    const share=records.reduce((n,r)=>n+Number(r.our_share_pkr||0),0),received=records.reduce((n,r)=>n+Number(r.amount_received_pkr||0),0),outstanding=Math.max(0,share-received);
    return {title:'Pakistan Resale Profit Share Statement',currency:'PKR',period:{from,to},profile:{Name:buyer.name,'Buyer Type':buyer.buyer_type||'International',Country:buyer.country||'',Location:buyer.location||'','Contact Person':buyer.contact_person||'',Phone:buyer.phone||'',Email:buyer.email||''},summary:{...statementSummary(rows,opening),'Total Company Share':share,'Total Received':received,'Total Outstanding':outstanding},rows};
  }

  const KO={
    'Financial Statement':'재무 명세서','Buyer Statement':'구매자 명세서','Supplier Statement':'공급업체 명세서','Pakistan Resale Profit Share Statement':'파키스탄 재판매 이익 배분 명세서','Statement Period':'명세 기간','Profile Summary':'프로필 요약','Opening Balance':'기초 잔액','Closing Balance':'기말 잔액','Total Debit':'총 차변','Total Credit':'총 대변','Total Paid':'총 수령액','Allocated':'배정액','Refunded':'환불액','Available Advance':'사용 가능 선급금','Machines Sold':'판매 장비','Machines Purchased':'구매 장비','Total Purchases':'총 구매액','Total Paid to Supplier':'공급업체 지급액','Outstanding Payable':'미지급금','Total Company Share':'회사 지분 합계','Total Received':'총 수령액','Total Outstanding':'총 미수금','Business Unit':'사업부','Buyer Type':'구매자 유형','Country':'국가','Location':'위치','Contact Person':'담당자','Phone':'전화','Email':'이메일','Address':'주소','Payment Terms':'결제 조건','Supplier':'공급업체','Date':'날짜','Description':'설명','Reference':'참조','Debit':'차변','Credit':'대변','Balance':'잔액','Generated':'생성일'
  };
  function tr(s,lang){return lang==='ko'?(KO[s]||s):s}
  function escPdf(s){return String(s??'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' ')}
  function unicodeHex(s){const le=Buffer.from('\uFEFF'+String(s??''),'utf16le');for(let i=0;i<le.length;i+=2){const x=le[i];le[i]=le[i+1];le[i+1]=x}return '<'+le.toString('hex').toUpperCase()+'>'}
  function pdfTextToken(s,lang){const v=tr(String(s??''),lang);return /[^\x20-\x7e]/.test(v)?unicodeHex(v):`(${escPdf(v)})`}
  function money(n){return Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
  function statementPdf(statement,lang='ko'){
    lang=lang==='en'?'en':'ko';const W=612,H=792,M=34;let pages=[],lines=[],y=748;
    function begin(){if(lines.length){lines.push('ET');pages.push(lines.join('\n'))}lines=['BT','0.10 0.14 0.22 rg'];y=748}
    function text(x,yy,value,size=8,bold=false){const translated=tr(String(value??''),lang),unicode=/[^\x20-\x7e]/.test(translated),font=unicode?(bold?'F4':'F3'):(bold?'F2':'F1');lines.push(`/${font} ${size} Tf`,`1 0 0 1 ${x} ${yy} Tm ${pdfTextToken(value,lang)} Tj`)}
    function ensure(h=16){if(y-h<42){begin();header(false)}}
    function line(label,value){ensure(16);text(M,y,label,7,true);text(M+145,y,String(value??''),7);y-=13}
    function header(withProfile=true){text(M,y,'BLUE OCEAN MARKET',14,true);y-=19;text(M,y,statement.title,12,true);y-=18;text(M,y,'Statement Period',7,true);text(M+145,y,`${statement.period.from||'Beginning'} - ${statement.period.to||'Current'}`,7);y-=18;if(withProfile&&statement.profile){text(M,y,'Profile Summary',9,true);y-=14;for(const [k,v] of Object.entries(statement.profile)){if(v!==''&&v!=null)line(k,v)}y-=4}}
    begin();header(true);
    if(statement.summary){for(const [k,v] of Object.entries(statement.summary)){if(v!==''&&v!=null)line(k,typeof v==='number'?`${statement.currency||''} ${money(v)}`:v)}y-=5}
    ensure(28);const xs=[M,M+58,M+266,M+363,M+425,M+487];['Date','Description','Reference','Debit','Credit','Balance'].forEach((h,i)=>text(xs[i],y,h,6.5,true));y-=12;
    for(const r of statement.rows||[]){ensure(r.machine?28:17);text(xs[0],y,dateOnly(r.date),6.3);text(xs[1],y,String(r.description||'').slice(0,42),6.3);text(xs[2],y,String(r.reference||'').slice(0,17),6.3);text(xs[3],y,r.debit?money(r.debit):'',6.3);text(xs[4],y,r.credit?money(r.credit):'',6.3);text(xs[5],y,money(r.balance),6.3);y-=11;if(r.machine){text(xs[1],y,String(r.machine).slice(0,76),5.6);y-=9}}
    lines.push('ET');pages.push(lines.join('\n'));
    const objects=[];objects.push('<< /Type /Catalog /Pages 2 0 R >>');objects.push('');objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');objects.push('<< /Type /Font /Subtype /Type0 /BaseFont /HYSMyeongJo-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [7 0 R] >>');objects.push('<< /Type /Font /Subtype /Type0 /BaseFont /HYGoThic-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [8 0 R] >>');objects.push('<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYSMyeongJo-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> >>');objects.push('<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYGoThic-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> >>');
    const pageIds=[];
    for(const stream of pages){const contentId=objects.length+1;objects.push(`<< /Length ${Buffer.byteLength(stream,'utf8')} >>\nstream\n${stream}\nendstream`);const pageId=objects.length+1;objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents ${contentId} 0 R >>`);pageIds.push(pageId)}
    objects[1]=`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map(id=>id+' 0 R').join(' ')}] >>`;
    let out='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n',offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(out,'binary'));out+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`}const xref=Buffer.byteLength(out,'binary');out+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let i=1;i<offsets.length;i++)out+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';out+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return Buffer.from(out,'binary');
  }
  function sendPdf(req,res,statement,name){const lang=String(req.query.lang||req.headers['x-language']||'ko').toLowerCase()==='en'?'en':'ko',buf=statementPdf(statement,lang);res.set('Content-Type','application/pdf');res.set('Content-Disposition',`attachment; filename="${name}.pdf"`);res.set('Cache-Control','no-store');res.send(buf)}

  app.get('/api/statements/finance',auth,allow('dashboard','finance'),(req,res)=>res.json(financeStatement(req)));
  app.get('/api/statements/finance.pdf',auth,allow('dashboard','finance'),(req,res)=>sendPdf(req,res,financeStatement(req),'Blue_Ocean_Financial_Statement'));
  app.get('/api/excavator/buyers/:id/statement',auth,allow('dashboard','sales','purchases','finance'),(req,res)=>{const s=buyerStatement(req,res);if(s)res.json(s)});
  app.get('/api/excavator/buyers/:id/statement.pdf',auth,allow('dashboard','sales','purchases','finance'),(req,res)=>{const s=buyerStatement(req,res);if(s)sendPdf(req,res,s,`Buyer_Statement_${req.params.id}`)});
  app.get('/api/excavator/suppliers/:id/statement',auth,allow('dashboard','sales','purchases','finance'),(req,res)=>{const s=supplierStatement(req,res);if(s)res.json(s)});
  app.get('/api/excavator/suppliers/:id/statement.pdf',auth,allow('dashboard','sales','purchases','finance'),(req,res)=>{const s=supplierStatement(req,res);if(s)sendPdf(req,res,s,`Supplier_Statement_${req.params.id}`)});
  app.get('/api/excavator/buyers/:id/resale-statement',auth,allow('dashboard','sales','purchases','finance'),(req,res)=>{const s=resaleStatement(req,res);if(s)res.json(s)});
  app.get('/api/excavator/buyers/:id/resale-statement.pdf',auth,allow('dashboard','sales','purchases','finance'),(req,res)=>{const s=resaleStatement(req,res);if(s)sendPdf(req,res,s,`Pakistan_Resale_Statement_${req.params.id}`)});

  return {version:VERSION};
}

module.exports={install,VERSION};
