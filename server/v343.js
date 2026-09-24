// Blue Ocean Market V30.43.0 — QA workflow/navigation refinements + account statements.
'use strict';
const VERSION='30.43.0';

function install({app,db,auth,allow,audit,currentUnit,enforceUnit,access,accounting}){
  const text=v=>String(v??'').trim(), num=v=>Number(v||0), round2=v=>Math.round((num(v)+Number.EPSILON)*100)/100;
  const tableExists=n=>!!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(n);
  const ensureColumn=(table,column,definition)=>{try{if(!tableExists(table))return;const cols=db.prepare(`PRAGMA table_info(${table})`).all().map(x=>x.name);if(!cols.includes(column))db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)}catch(e){console.error('V30.43 migration',table,column,e.message)}};
  ensureColumn('excavator_buyer_payments','buyer_sender_account_id','INTEGER');

  db.exec(`
    CREATE TABLE IF NOT EXISTS accounting_account_transfers_v343(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_no TEXT NOT NULL UNIQUE,
      business_unit_id INTEGER,
      from_payment_account_id INTEGER NOT NULL,
      to_payment_account_id INTEGER NOT NULL,
      source_amount REAL NOT NULL,
      source_currency TEXT NOT NULL DEFAULT 'KRW',
      fx_rate_to_krw REAL NOT NULL DEFAULT 1,
      amount_krw REAL NOT NULL,
      destination_amount REAL NOT NULL,
      destination_currency TEXT NOT NULL DEFAULT 'KRW',
      transfer_date TEXT NOT NULL,
      reference TEXT NOT NULL,
      description TEXT DEFAULT '',
      journal_entry_id INTEGER,
      status TEXT NOT NULL DEFAULT 'Active',
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_account_transfer_v343_from ON accounting_account_transfers_v343(from_payment_account_id,transfer_date,id);
    CREATE INDEX IF NOT EXISTS idx_account_transfer_v343_to ON accounting_account_transfers_v343(to_payment_account_id,transfer_date,id);
  `);

  function accountRow(id){
    return db.prepare(`SELECT p.*,b.name business_unit,a.code ledger_code,a.name ledger_name,a.account_type ledger_type,a.normal_balance ledger_normal_balance
      FROM accounting_payment_accounts p
      LEFT JOIN business_units b ON b.id=p.business_unit_id
      LEFT JOIN accounting_accounts a ON a.id=p.ledger_account_id
      WHERE p.id=?`).get(Number(id));
  }
  function canSeeAccount(req,a){
    if(!a)return false;if(req.user.role==='CEO / Owner')return true;
    if(a.business_unit_id&& !enforceUnit(req,a.business_unit_id))return false;
    const bu=Number(a.business_unit_id||req.selected_business_unit_id||req.user.business_unit_id||0)||null;
    return !!(access?.canAction?.(req.user.id,'accounting','view',bu)||access?.canAction?.(req.user.id,'finance','view',bu)||access?.can?.(req.user.id,'module.accounting.view',bu)||access?.can?.(req.user.id,'module.finance.view',bu));
  }
  function canTransfer(req,a){
    if(req.user.role==='CEO / Owner')return true;const bu=Number(a?.business_unit_id||req.selected_business_unit_id||req.user.business_unit_id||0)||null;
    return !!(access?.canAction?.(req.user.id,'accounting','create',bu)||access?.canAction?.(req.user.id,'accounting','edit',bu)||access?.can?.(req.user.id,'module.accounting.create',bu)||access?.can?.(req.user.id,'module.accounting.edit',bu));
  }
  function dateOnly(v){const s=text(v);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:''}
  function today(){return new Date().toISOString().slice(0,10)}
  function maskAccount(a){const raw=text(a.account_number),last=text(a.card_last4||a.account_last4||(raw?raw.slice(-4):''));return last?'•••• '+last:''}
  function publicAccount(a){return {id:a.id,business_unit_id:a.business_unit_id,business_unit:a.business_unit||'',name:a.name,payment_type:a.financial_account_type||a.payment_type,currency:a.currency||'KRW',account_country:a.account_country||'',bank_name:a.bank_name||'',account_holder:a.account_holder||'',account_number_masked:maskAccount(a),ledger_code:a.ledger_code||'',ledger_name:a.ledger_name||'',status:a.status||'Active',active:Number(a.active||0),opening_balance_krw:num(a.opening_balance_krw),migration_reference:a.migration_reference||''}}

  function accountEvents(accountId){
    const id=Number(accountId),events=[];
    // Finance is the canonical account-specific source for real receipts/payments.
    if(tableExists('finance_entries')){
      const rows=db.prepare(`SELECT id,COALESCE(transaction_date,substr(created_at,1,10)) tx_date,created_at,type,category,description,reference,krw_amount,amount,original_amount,original_currency,fx_rate,cash_effect,verification_status,accounting_status,source_type,source_id,status
        FROM finance_entries WHERE payment_account_id=? AND COALESCE(status,'')!='Voided' AND COALESCE(cash_effect,0)<>0 ORDER BY tx_date,id`).all(id);
      for(const r of rows){const signed=round2(num(r.krw_amount||r.amount)*Number(r.cash_effect||0));events.push({date:dateOnly(r.tx_date)||String(r.tx_date||'').slice(0,10),entered_at:r.created_at||r.tx_date,sort:10,id:`F${r.id}`,type:r.category||r.finance_role||r.type||'Finance',reference:r.reference||'',description:r.description||'',source:r.source_type||'Finance',source_id:r.source_id||r.id,inflow:signed>0?signed:0,outflow:signed<0?Math.abs(signed):0,verification_status:r.verification_status||'',accounting_status:r.accounting_status||'',original_amount:num(r.original_amount),original_currency:r.original_currency||'KRW',fx_rate:num(r.fx_rate||1)});}
    }
    // Inter-BU transfer is a real account-to-account movement represented outside Finance.
    if(tableExists('accounting_inter_unit_transfers')){
      const rows=db.prepare(`SELECT * FROM accounting_inter_unit_transfers WHERE from_payment_account_id=? OR to_payment_account_id=? ORDER BY transfer_date,id`).all(id,id);
      for(const r of rows){const isFrom=Number(r.from_payment_account_id)===id,amt=round2(r.amount_krw);events.push({date:r.transfer_date,entered_at:r.created_at||r.transfer_date,sort:20,id:`IB${r.id}`,type:'Company Account Transfer',reference:r.reference||r.transfer_no||'',description:r.description||`${r.transfer_no||'Inter-BU transfer'}`,source:'Inter-BU Transfer',source_id:r.id,inflow:isFrom?0:amt,outflow:isFrom?amt:0,verification_status:'',accounting_status:'Posted',original_amount:amt,original_currency:'KRW',fx_rate:1});}
    }
    if(tableExists('accounting_account_transfers_v343')){
      const rows=db.prepare(`SELECT * FROM accounting_account_transfers_v343 WHERE status='Active' AND (from_payment_account_id=? OR to_payment_account_id=?) ORDER BY transfer_date,id`).all(id,id);
      for(const r of rows){const isFrom=Number(r.from_payment_account_id)===id,amt=round2(r.amount_krw);events.push({date:r.transfer_date,entered_at:r.created_at||r.transfer_date,sort:21,id:`AT${r.id}`,type:'Company Account Transfer',reference:r.reference||r.transfer_no||'',description:r.description||`${r.transfer_no} · Internal account transfer`,source:'Company Account Transfer',source_id:r.id,inflow:isFrom?0:amt,outflow:isFrom?amt:0,verification_status:'',accounting_status:'Posted',original_amount:isFrom?num(r.source_amount):num(r.destination_amount),original_currency:isFrom?r.source_currency:r.destination_currency,fx_rate:num(r.fx_rate_to_krw||1)});}
    }
    // Payroll and employee advances are posted directly to Accounting and do not create Finance receipts.
    if(tableExists('payroll_payments')){
      const rows=db.prepare("SELECT p.*,r.payroll_no FROM payroll_payments p LEFT JOIN payroll_runs r ON r.id=p.payroll_run_id WHERE p.payment_account_id=? AND COALESCE(p.status,'Active')='Active' ORDER BY p.payment_date,p.id").all(id);
      for(const r of rows){const amt=round2(r.amount_krw);events.push({date:r.payment_date,entered_at:r.created_at||r.payment_date,sort:30,id:`PP${r.id}`,type:'Payroll Payment',reference:r.reference||'',description:`Payroll ${r.payroll_no||r.payroll_run_id||''}`,source:'Payroll Payment',source_id:r.id,inflow:0,outflow:amt,verification_status:'',accounting_status:'Posted',original_amount:amt,original_currency:'KRW',fx_rate:1});}
    }
    if(tableExists('employee_advances')){
      const rows=db.prepare("SELECT a.*,e.name employee_name FROM employee_advances a LEFT JOIN employees e ON e.id=a.employee_id WHERE a.payment_account_id=? AND COALESCE(a.status,'Active')!='Reversed' ORDER BY a.advance_date,a.id").all(id);
      for(const r of rows){const amt=round2(r.krw_amount);events.push({date:r.advance_date,entered_at:r.created_at||r.advance_date,sort:31,id:`EA${r.id}`,type:'Employee Advance',reference:r.reference||'',description:`Advance to ${r.employee_name||'Employee'}`,source:'Employee Advance',source_id:r.id,inflow:0,outflow:amt,verification_status:'',accounting_status:'Posted',original_amount:num(r.original_amount),original_currency:r.currency||'KRW',fx_rate:num(r.fx_rate||1)});}
    }
    // Pakistan→Korea transfers keep source/destination account identity in their dedicated subledger.
    if(tableExists('excavator_resale_bank_transfers')){
      const rows=db.prepare("SELECT * FROM excavator_resale_bank_transfers WHERE COALESCE(status,'Active')='Active' AND (from_payment_account_id=? OR to_payment_account_id=?) ORDER BY transfer_date,id").all(id,id);
      for(const r of rows){const isFrom=Number(r.from_payment_account_id)===id,sourceKrw=round2(r.source_krw_equivalent),destKrw=round2(r.destination_amount_krw),feeKrw=round2(r.bank_fee_krw),amt=isFrom?sourceKrw+feeKrw:destKrw;events.push({date:r.transfer_date,entered_at:r.created_at||r.transfer_date,sort:22,id:`PK${r.id}`,type:'Pakistan → Korea Bank Transfer',reference:r.reference||'',description:isFrom?'Transfer out to Korea'+(feeKrw?` · Fee ₩ ${feeKrw.toLocaleString()}`:''):'Transfer received from Pakistan',source:'Pakistan Resale Bank Transfer',source_id:r.id,inflow:isFrom?0:amt,outflow:isFrom?amt:0,verification_status:'',accounting_status:'Posted',original_amount:isFrom?num(r.source_amount_pkr):num(r.destination_amount_krw),original_currency:isFrom?'PKR':'KRW',fx_rate:num(r.fx_rate_to_krw||1)});}
    }
    events.sort((a,b)=>String(a.entered_at||a.date||'').localeCompare(String(b.entered_at||b.date||''))||Number(a.sort)-Number(b.sort)||String(a.id).localeCompare(String(b.id)));
    return events;
  }

  function accountStatement(req,res,accountId){
    const a=accountRow(accountId);if(!a){res.status(404).json({error:'Company financial account not found.'});return null}if(!canSeeAccount(req,a)){res.status(403).json({error:'You cannot access this company financial account.'});return null}
    const from=dateOnly(req.query.from),to=dateOnly(req.query.to)||today();if(from&&to&&from>to){res.status(400).json({error:'Statement From date cannot be after To date.'});return null}
    const all=accountEvents(a.id),openingBase=round2(a.opening_balance_krw),before=x=>from&&x.date<from,within=x=>(!from||x.date>=from)&&(!to||x.date<=to);
    let opening=openingBase+all.filter(before).reduce((n,x)=>n+num(x.inflow)-num(x.outflow),0),balance=round2(opening);
    const rows=all.filter(within).map(x=>({...x,balance_krw:(balance=round2(balance+num(x.inflow)-num(x.outflow)))}));
    const periodIn=round2(rows.reduce((n,x)=>n+num(x.inflow),0)),periodOut=round2(rows.reduce((n,x)=>n+num(x.outflow),0));
    const current=round2(openingBase+all.filter(x=>x.date<=today()).reduce((n,x)=>n+num(x.inflow)-num(x.outflow),0));
    return {version:VERSION,account:publicAccount(a),period:{from:from||'',to},opening_balance_krw:round2(opening),money_in_krw:periodIn,money_out_krw:periodOut,closing_balance_krw:round2(balance),current_balance_krw:current,transaction_count:rows.length,rows};
  }

  function escPdf(s){return String(s??'').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\r\n]+/g,' ')}
  function unicodeHex(s){const le=Buffer.from('\uFEFF'+String(s??''),'utf16le');for(let i=0;i<le.length;i+=2){const x=le[i];le[i]=le[i+1];le[i+1]=x}return '<'+le.toString('hex').toUpperCase()+'>'}
  const PDF_KO={'Account Statement':'계좌 명세서','Statement Period':'명세 기간','Opening Balance':'기초 잔액','Money In':'입금','Money Out':'출금','Closing Balance':'기말 잔액','Current Balance':'현재 잔액','Date':'날짜','Type':'유형','Reference':'참조','Description':'설명','Balance':'잔액','Generated':'생성일','Account':'계좌','Business Unit':'사업부','Account Currency':'계좌 통화','No transactions in the selected period.':'선택한 기간에 거래가 없습니다.'};
  function pdfLabel(s,lang){return lang==='ko'?(PDF_KO[s]||s):s}
  function pdfToken(v,lang,translate=false){const s=translate?pdfLabel(v,lang):String(v??'');return /[^\x20-\x7e]/.test(s)?unicodeHex(s):`(${escPdf(s)})`}
  function money(v){return Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
  function statementPdf(s,lang='en'){
    lang=lang==='ko'?'ko':'en';const W=612,H=792,M=32,pages=[];let ops=[],y=0,pageNo=0;
    const push=x=>ops.push(x);const width=(v,size=7)=>[...String(v??'')].reduce((n,ch)=>n+(/[가-힣一-龥]/.test(ch)?size*.92:/[MW@#%&]/.test(ch)?size*.7:/[ilI1.,:;|'`]/.test(ch)?size*.28:size*.5),0);
    function textAt(x,yy,v,size=7,bold=false,tr=false){const shown=tr?pdfLabel(v,lang):String(v??''),uni=/[^\x20-\x7e]/.test(shown),font=uni?(bold?'F4':'F3'):(bold?'F2':'F1');push(`BT /${font} ${size} Tf 0.08 0.13 0.22 rg 1 0 0 1 ${x.toFixed(1)} ${yy.toFixed(1)} Tm ${pdfToken(v,lang,tr)} Tj ET`)}
    function right(x,yy,v,size=7,bold=false,tr=false){const shown=tr?pdfLabel(v,lang):String(v??'');textAt(Math.max(M,x-width(shown,size)),yy,v,size,bold,tr)}
    function rule(yy){push(`q 0.82 0.86 0.91 RG .6 w ${M} ${yy} m ${W-M} ${yy} l S Q`)}
    function wrap(v,max,size=6.2,limit=3){const words=String(v??'').replace(/\s+/g,' ').trim().split(' '),out=[];let line='';for(const w of words){const c=line?line+' '+w:w;if(width(c,size)<=max)line=c;else{if(line)out.push(line);line=w}if(out.length>=limit)break}if(line&&out.length<limit)out.push(line);return out}
    function header(){pageNo++;y=752;textAt(M,y,'BLUE OCEAN MARKET',14,true);right(W-M,y,'Account Statement',11,true,true);y-=13;rule(y);y-=17;textAt(M,y,'Account',6.5,true,true);textAt(M+62,y,s.account.name,7.5,true);right(W-M,y,`${s.account.payment_type} · ${s.account.currency} · ${s.account.account_number_masked||''}`,6.5);y-=13;textAt(M,y,'Business Unit',6,true,true);textAt(M+62,y,s.account.business_unit||'Company / Shared',6.5);right(W-M,y,`${pdfLabel('Statement Period',lang)}: ${s.period.from||'Beginning'} - ${s.period.to}`,6.3);y-=18;const boxes=[['Opening Balance',s.opening_balance_krw],['Money In',s.money_in_krw],['Money Out',s.money_out_krw],['Closing Balance',s.closing_balance_krw]];for(let i=0;i<4;i++){const x=M+i*136;push(`q .97 .98 .99 rg ${x} ${y-25} 128 30 re f Q`);textAt(x+6,y-8,boxes[i][0],5.5,true,true);right(x+122,y-19,'₩ '+money(boxes[i][1]),6.7,true)}y-=41;tableHeader()}
    function tableHeader(){push(`q .92 .95 .98 rg ${M} ${y-5} ${W-2*M} 17 re f Q`);textAt(M+3,y,'Date',5.8,true,true);textAt(M+58,y,'Type',5.8,true,true);textAt(M+150,y,'Reference',5.8,true,true);textAt(M+245,y,'Description',5.8,true,true);right(W-154,y,'Money In',5.6,true,true);right(W-92,y,'Money Out',5.6,true,true);right(W-M-2,y,'Balance',5.6,true,true);y-=20}
    function finish(){textAt(M,18,`BLUE OCEAN MARKET · ${pdfLabel('Account Statement',lang)}`,5.5);right(W-M,18,`Page ${pageNo}`,5.5);pages.push(ops.join('\n'));ops=[]}
    header();for(const r of s.rows){const desc=wrap(r.description,132,5.4,3),ref=wrap(r.reference,88,5.3,2),h=Math.max(20,10+Math.max(desc.length,ref.length,1)*7.2);if(y-h<38){finish();header()}rule(y+5);textAt(M+3,y,r.date,5.4);textAt(M+58,y,r.type,5.2);ref.forEach((v,i)=>textAt(M+150,y-i*7,v,5.1));desc.forEach((v,i)=>textAt(M+245,y-i*7,v,5.1));right(W-154,y,r.inflow?'₩ '+money(r.inflow):'',5.2);right(W-92,y,r.outflow?'₩ '+money(r.outflow):'',5.2);right(W-M-2,y,'₩ '+money(r.balance_krw),5.3,true);y-=h}if(!s.rows.length)textAt(M+6,y-3,'No transactions in the selected period.',7,false,true);finish();
    const objects=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>','<< /Type /Font /Subtype /Type0 /BaseFont /HYSMyeongJo-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [7 0 R] >>','<< /Type /Font /Subtype /Type0 /BaseFont /HYGoThic-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [8 0 R] >>','<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYSMyeongJo-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> >>','<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYGoThic-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> >>'];
    const ids=[];for(const stream of pages){const cid=objects.length+1;objects.push(`<< /Length ${Buffer.byteLength(stream,'utf8')} >>\nstream\n${stream}\nendstream`);const pid=objects.length+1;objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents ${cid} 0 R >>`);ids.push(pid)}objects[1]=`<< /Type /Pages /Count ${ids.length} /Kids [${ids.map(x=>x+' 0 R').join(' ')}] >>`;
    let out='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n',offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(out,'binary'));out+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`}const xref=Buffer.byteLength(out,'binary');out+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let i=1;i<offsets.length;i++)out+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';out+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return Buffer.from(out,'binary')
  }

  app.get('/api/v343/accounting/payment-accounts/:id/statement',auth,allow('finance','accounting'),(req,res)=>{const s=accountStatement(req,res,req.params.id);if(s)res.json(s)});
  app.get('/api/v343/accounting/payment-accounts/:id/statement.pdf',auth,allow('finance','accounting'),(req,res)=>{const s=accountStatement(req,res,req.params.id);if(!s)return;const lang=text(req.query.lang||req.headers['x-language']).toLowerCase()==='ko'?'ko':'en',buf=statementPdf(s,lang),safe=text(s.account.name).replace(/[^a-z0-9_-]+/gi,'_')||`Account_${s.account.id}`;res.set('Content-Type','application/pdf');res.set('Content-Disposition',`attachment; filename="${safe}_Statement.pdf"`);res.set('Cache-Control','no-store');res.send(buf)});

  app.get('/api/v343/accounting/payment-accounts/:id/detail',auth,allow('finance','accounting'),(req,res)=>{const s=accountStatement(req,res,req.params.id);if(!s)return;const peers=db.prepare(`SELECT p.id,p.name,p.currency,p.business_unit_id,b.name business_unit,COALESCE(p.financial_account_type,p.payment_type) payment_type FROM accounting_payment_accounts p LEFT JOIN business_units b ON b.id=p.business_unit_id WHERE p.active=1 AND COALESCE(p.status,'Active')='Active' AND p.id<>? ORDER BY b.name,p.name`).all(Number(req.params.id)).filter(x=>canSeeAccount(req,x));res.json({...s,transfer_accounts:peers,can_transfer:canTransfer(req,accountRow(req.params.id))})});

  app.post('/api/v343/accounting/account-transfers',auth,allow('finance','accounting'),(req,res)=>{try{
    const from=accountRow(req.body.from_payment_account_id),to=accountRow(req.body.to_payment_account_id);if(!from||!to||!Number(from.active)||!Number(to.active))throw Object.assign(new Error('Select valid active source and destination company accounts.'),{status:400});if(Number(from.id)===Number(to.id))throw Object.assign(new Error('Source and destination accounts must be different.'),{status:400});if(!canSeeAccount(req,from)||!canSeeAccount(req,to)||!canTransfer(req,from))throw Object.assign(new Error('You are not authorized to transfer funds from this company account.'),{status:403});if(Number(from.business_unit_id||0)!==Number(to.business_unit_id||0))throw Object.assign(new Error('For accounts in different Business Units, use Accounting → Inter-BU Transfers so inter-unit receivable/payable controls are preserved.'),{status:409});
    const sourceAmount=num(req.body.source_amount),fx=num(req.body.fx_rate_to_krw||1),date=dateOnly(req.body.transfer_date),reference=text(req.body.reference),sourceCurrency=text(req.body.source_currency||from.currency||'KRW').toUpperCase(),destCurrency=text(req.body.destination_currency||to.currency||'KRW').toUpperCase(),destAmount=num(req.body.destination_amount||sourceAmount);if(sourceAmount<=0||fx<=0||destAmount<=0||!date||!reference)throw Object.assign(new Error('Transfer amount, FX rate, destination amount, date and reference are required.'),{status:400});if(sourceCurrency!==text(from.currency||'KRW').toUpperCase())throw Object.assign(new Error(`Source currency must match the source account currency (${from.currency||'KRW'}).`),{status:400});if(destCurrency!==text(to.currency||'KRW').toUpperCase())throw Object.assign(new Error(`Destination currency must match the destination account currency (${to.currency||'KRW'}).`),{status:400});const amountKrw=round2(sourceCurrency==='KRW'?sourceAmount:sourceAmount*fx);if(amountKrw<=0)throw Object.assign(new Error('KRW transfer value must be greater than zero.'),{status:400});const bu=Number(from.business_unit_id||to.business_unit_id||req.selected_business_unit_id||req.user.business_unit_id||0)||null;if(bu&&accounting?.isPeriodClosed?.(bu,date))throw Object.assign(new Error('The transfer date belongs to a closed Accounting period.'),{status:409});if(!from.ledger_account_id||!to.ledger_account_id)throw Object.assign(new Error('Both accounts require valid GL mappings before funds can be transferred.'),{status:409});
    const result=db.transaction(()=>{const transferNo=`ACT-${date.replaceAll('-','')}-${String(Date.now()).slice(-8)}`,description=text(req.body.description)||`${from.name} → ${to.name}`,jid=accounting.postJournal({businessUnitId:bu,transactionDate:date,sourceType:'Company Account Transfer',sourceId:null,sourceLabel:'Accounting → Company Account Transfer',description:`${transferNo} · ${description}`,createdBy:req.user.id,lines:[{account_id:Number(to.ledger_account_id),business_unit_id:bu,debit_krw:amountKrw,credit_krw:0,original_amount:destAmount,original_currency:destCurrency,fx_rate:destCurrency==='KRW'?1:(destAmount?amountKrw/destAmount:1),entity_type:'Company Financial Account',entity_id:to.id,memo:`Transfer received from ${from.name}`},{account_id:Number(from.ledger_account_id),business_unit_id:bu,debit_krw:0,credit_krw:amountKrw,original_amount:sourceAmount,original_currency:sourceCurrency,fx_rate:fx,entity_type:'Company Financial Account',entity_id:from.id,memo:`Transfer sent to ${to.name}`}]});const r=db.prepare(`INSERT INTO accounting_account_transfers_v343(transfer_no,business_unit_id,from_payment_account_id,to_payment_account_id,source_amount,source_currency,fx_rate_to_krw,amount_krw,destination_amount,destination_currency,transfer_date,reference,description,journal_entry_id,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(transferNo,bu,from.id,to.id,sourceAmount,sourceCurrency,fx,amountKrw,destAmount,destCurrency,date,reference,description,jid,req.user.id);db.prepare("UPDATE accounting_journal_entries SET source_id=? WHERE id=? AND source_type='Company Account Transfer'").run(Number(r.lastInsertRowid),jid);return {id:Number(r.lastInsertRowid),transfer_no:transferNo,journal_id:jid,amount_krw:amountKrw}})();audit(req.user,'company_account_transfer',result.id,'create-v343',JSON.stringify({from_account_id:from.id,to_account_id:to.id,source_amount:sourceAmount,source_currency:sourceCurrency,amount_krw:amountKrw,reference}));res.json(result)
  }catch(e){res.status(e.status||400).json({error:e.message})}});

  app.get('/api/v343/excavator/assets/:id/edit-policy',auth,allow('dashboard','sales','purchases','inventory','finance','documents'),(req,res)=>{const bu=Number(currentUnit(req)||req.selected_business_unit_id||req.user.business_unit_id||0),a=db.prepare('SELECT id,lifecycle_stage,status FROM excavator_assets WHERE id=? AND business_unit_id=?').get(Number(req.params.id),bu);if(!a)return res.status(404).json({error:'Machine not found.'});const sold=text(a.lifecycle_stage)==='Sold / Completed';res.json({asset_id:a.id,sold,purchase_editable:!sold,document_archive_ceo_only:sold})});

  return {version:VERSION,accountEvents};
}
module.exports={install,VERSION};
