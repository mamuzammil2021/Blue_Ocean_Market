const VERSION='30.10.0';

function install({app,db,auth,allow,currentUnit,enforceUnit,audit,accounting}){
  const ensureColumn=(table,column,ddl)=>{try{const cols=db.prepare(`PRAGMA table_info(${table})`).all().map(x=>x.name);if(!cols.includes(column))db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`)}catch(e){console.error('V30.2 migration',table,column,e.message)}};
  ensureColumn('finance_entries','finance_role',"TEXT DEFAULT ''");
  ensureColumn('finance_entries','cash_effect','INTEGER DEFAULT 0');
  ensureColumn('finance_entries','source_key',"TEXT DEFAULT ''");
  ensureColumn('pink_salt_import_payments','status',"TEXT DEFAULT 'Active'");
  ensureColumn('pink_salt_import_payments','void_reason',"TEXT DEFAULT ''");
  ensureColumn('pink_salt_import_payments','voided_by','INTEGER');
  ensureColumn('pink_salt_import_payments','voided_at','TEXT');
  ensureColumn('pink_salt_import_costs','status',"TEXT DEFAULT 'Active'");
  ensureColumn('pink_salt_import_costs','void_reason',"TEXT DEFAULT ''");
  ensureColumn('pink_salt_import_costs','voided_by','INTEGER');
  ensureColumn('pink_salt_import_costs','voided_at','TEXT');
  ensureColumn('pink_salt_packaging_movements','status',"TEXT DEFAULT 'Active'");
  ensureColumn('pink_salt_packaging_movements','void_reason',"TEXT DEFAULT ''");
  ensureColumn('pink_salt_packaging_movements','voided_by','INTEGER');
  ensureColumn('pink_salt_packaging_movements','voided_at','TEXT');
  ensureColumn('pink_salt_customer_payments','void_reason',"TEXT DEFAULT ''");
  ensureColumn('pink_salt_customer_payments','voided_by','INTEGER');
  ensureColumn('pink_salt_customer_payments','voided_at','TEXT');
  ensureColumn('pink_salt_customer_refunds','void_reason',"TEXT DEFAULT ''");
  ensureColumn('pink_salt_customer_refunds','voided_by','INTEGER');
  ensureColumn('pink_salt_customer_refunds','voided_at','TEXT');

  function classify(row){
    const st=String(row.source_type||''),type=String(row.type||''),cat=String(row.category||'');
    if(st==='Pink Salt Supplier Advance')return {finance_role:'Supplier Advance Payment',cash_effect:-1};
    if(st==='Pink Salt Supplier Advance Refund')return {finance_role:'Supplier Advance Refund',cash_effect:1};
    if(st==='Pink Salt Import Purchase')return {finance_role:'Purchase / Payable',cash_effect:0};
    if(st==='Pink Salt Import Payment')return {finance_role:'Supplier Payment / Settlement',cash_effect:-1};
    if(st==='Pink Salt Import Cost')return {finance_role:'Import Cost Payment',cash_effect:-1};
    if(st==='Pink Salt Packaging Purchase')return {finance_role:'Packaging Purchase / Payable',cash_effect:0};
    if(st==='Pink Salt Sale')return {finance_role:'Sale / Revenue',cash_effect:0};
    if(st==='Pink Salt Customer Payment')return {finance_role:'Customer Receipt',cash_effect:1};
    if(st==='Pink Salt Customer Refund')return {finance_role:'Customer Refund',cash_effect:-1};
    if(st==='Pink Salt Platform Fee')return {finance_role:'Marketplace Fee Payment',cash_effect:-1};
    if(st==='Pink Salt Waste')return {finance_role:'Inventory Loss',cash_effect:0};
    if(st==='Excavator Sale')return {finance_role:'Sale / Revenue',cash_effect:0};
    if(st==='Excavator Buyer Payment'||st==='Buyer Payment')return {finance_role:'Buyer Receipt',cash_effect:1};
    if(st==='Excavator Buyer Refund')return {finance_role:'Buyer Refund',cash_effect:-1};
    if(st==='Excavator Payment')return {finance_role:'Machine Payment / Settlement',cash_effect:type==='Revenue'?1:-1};
    if(st==='Excavator Cost Transaction'&&cat==='Purchase')return {finance_role:'Purchase / Payable',cash_effect:0};
    if(st.startsWith('Excavator '))return {finance_role:type==='Revenue'?'Revenue':'Machine Cost',cash_effect:type==='Revenue'?0:-1};
    if(st==='Purchase')return {finance_role:'Purchase / Payable',cash_effect:0};
    if(st==='Purchase Payment')return {finance_role:'Supplier Payment / Settlement',cash_effect:-1};
    if(st==='Sale')return {finance_role:'Sale / Revenue',cash_effect:0};
    if(st==='Sale Payment'||st==='MIMI Sale Payment')return {finance_role:'Customer Receipt',cash_effect:1};
    if(st==='Manual')return {finance_role:type==='Revenue'?'Manual Income':'Manual Expense',cash_effect:type==='Revenue'?1:-1};
    if(/payment|receipt|refund/i.test(st+' '+cat))return {finance_role:/refund/i.test(st+' '+cat)?'Refund / Payment':'Payment / Settlement',cash_effect:/refund/i.test(st+' '+cat)?-1:type==='Revenue'||type==='Receipt'?1:-1};
    if(type==='Revenue')return {finance_role:'Revenue',cash_effect:0};
    if(type==='Expense')return {finance_role:'Expense',cash_effect:-1};
    if(type==='Inventory'||type==='Inventory Cost')return {finance_role:'Inventory / Cost',cash_effect:0};
    return {finance_role:type||'Financial Record',cash_effect:0};
  }
  function keyFor(row){return row?.source_type&&row?.source_id!=null&&row.source_type!=='Manual'?`${Number(row.business_unit_id)}|${String(row.source_type)}|${Number(row.source_id)}`:''}
  function refreshClassifications(){
    const rows=db.prepare("SELECT id,business_unit_id,type,category,payment_method,source_type,source_id FROM finance_entries WHERE status!='Voided'").all();
    const up=db.prepare('UPDATE finance_entries SET finance_role=?,cash_effect=?,source_key=? WHERE id=?');
    const tx=db.transaction(()=>{for(const r of rows){const c=classify(r);up.run(c.finance_role,c.cash_effect,keyFor(r),r.id)}});tx();
  }
  function consolidateDuplicates(unit=null){
    const groups=db.prepare("SELECT business_unit_id,source_type,source_id,COUNT(*) c FROM finance_entries WHERE status!='Voided' AND source_type IS NOT NULL AND source_type!='' AND source_type!='Manual' AND source_id IS NOT NULL AND (? IS NULL OR business_unit_id=?) GROUP BY business_unit_id,source_type,source_id HAVING COUNT(*)>1").all(unit,unit);
    // Detection only. Never consolidate or rewrite financial history at startup.
    return {groups:groups.length,voided:0,review_required:groups.length>0,duplicates:groups};
  }

  try{
    db.exec(`CREATE TABLE IF NOT EXISTS system_migrations(migration_key TEXT PRIMARY KEY,applied_at TEXT DEFAULT CURRENT_TIMESTAMP,details TEXT DEFAULT '')`);
    const startupKey='v30.39.2-v302-finance-integrity-bootstrap';
    if(!db.prepare('SELECT 1 FROM system_migrations WHERE migration_key=?').get(startupKey)){
      const result=consolidateDuplicates();refreshClassifications();
      db.prepare('INSERT OR REPLACE INTO system_migrations(migration_key,applied_at,details) VALUES(?,CURRENT_TIMESTAMP,?)').run(startupKey,JSON.stringify(result));
    }
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_active_source_unique_v302 ON finance_entries(business_unit_id,source_type,source_id) WHERE status!='Voided' AND source_type IS NOT NULL AND source_type!='' AND source_type!='Manual' AND source_id IS NOT NULL");
  }catch(e){console.error('V30.2 finance integrity bootstrap:',e.message)}

  app.get('/api/finance/integrity-v302',auth,allow('finance','dashboard'),(req,res)=>{
    let where='1=1',args=[];const bu=currentUnit(req);if(bu){where='business_unit_id=?';args=[Number(bu)]}else if(req.user.role!=='CEO / Owner'){where='business_unit_id=?';args=[Number(req.user.business_unit_id||0)]}
    const dup=db.prepare(`SELECT COUNT(*) c FROM (SELECT business_unit_id,source_type,source_id,COUNT(*) n FROM finance_entries WHERE ${where} AND status!='Voided' AND source_type!='Manual' AND source_id IS NOT NULL GROUP BY business_unit_id,source_type,source_id HAVING n>1)`).get(...args)?.c||0;
    const manual=db.prepare(`SELECT COUNT(*) c FROM finance_entries WHERE ${where} AND status!='Voided' AND source_type='Manual'`).get(...args)?.c||0;
    const paymentRows=db.prepare(`SELECT COUNT(*) c FROM finance_entries WHERE ${where} AND status!='Voided' AND cash_effect!=0`).get(...args)?.c||0;
    const obligations=db.prepare(`SELECT COUNT(*) c FROM finance_entries WHERE ${where} AND status!='Voided' AND finance_role LIKE '%Payable%'`).get(...args)?.c||0;
    const suspected=db.prepare(`SELECT COUNT(*) c FROM (SELECT business_unit_id,date(COALESCE(transaction_date,created_at)) d,lower(trim(reference)) ref,ROUND(COALESCE(krw_amount,amount),2) amt,COUNT(*) n FROM finance_entries WHERE ${where} AND status!='Voided' AND cash_effect!=0 AND trim(COALESCE(reference,''))!='' GROUP BY business_unit_id,d,ref,amt HAVING n>1)`).get(...args)?.c||0;
    res.json({ok:Number(dup)===0,duplicate_active_sources:Number(dup),suspected_duplicate_payments:Number(suspected),manual_entries:Number(manual),cash_movement_rows:Number(paymentRows),obligation_rows:Number(obligations),version:VERSION});
  });
  app.post('/api/finance/integrity-v302/repair',auth,allow('finance'),(req,res)=>{if(!['CEO / Owner','Finance / Admin'].includes(req.user.role))return res.status(403).json({error:'Only CEO or Finance can run Finance integrity repair.'});const unit=Number(currentUnit(req)||(req.user.role==='CEO / Owner'?0:req.user.business_unit_id))||null,result=consolidateDuplicates(unit);audit(req.user,'finance_integrity',0,'review-requested',JSON.stringify(result));res.json({ok:true,...result})});
  console.info('Blue Ocean Market V30.7.0 Finance integrity backend loaded');
  return {VERSION,classify,refreshClassifications,consolidateDuplicates};
}
module.exports={install,VERSION};
