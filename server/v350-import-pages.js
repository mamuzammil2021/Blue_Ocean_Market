'use strict';
// Read-side only. Import purchase/payment/advance mutation and single-import financial context stay in v300/v305.
const {paging}=require('./v349-pink-pages');
function clean(query={}) {return {search:String(query.search||'').trim().slice(0,100),status:String(query.status||'').trim().slice(0,40)};}
function pageSQL(q={}) {
 const a=[],where=['i.business_unit_id=?'];
 if(q.search){where.push('(i.import_no LIKE ? OR i.supplier_invoice_no LIKE ? OR i.container_no LIKE ? OR COALESCE(s.name,i.supplier_name) LIKE ?)');a.push(...Array(4).fill('%'+q.search+'%'));}
 if(q.status){where.push('i.status=?');a.push(q.status);}
 return {where:where.join(' AND '),args:a};
}
const IMPORT_PAGE_SQL=`WITH chosen AS MATERIALIZED (
 SELECT i.*,COALESCE(s.name,i.supplier_name) supplier FROM pink_salt_imports i
 LEFT JOIN pink_salt_suppliers s ON s.id=i.supplier_id AND s.business_unit_id=i.business_unit_id
 WHERE %WHERE% ORDER BY i.id DESC LIMIT ? OFFSET ?
), items AS (SELECT x.import_id,COUNT(*) item_count,COALESCE(SUM(x.total_weight_kg),0) total_weight_kg,
 COALESCE(SUM(x.line_amount_original),0) purchase_original,COALESCE(SUM(x.line_amount_krw),0) purchase_krw
 FROM pink_salt_import_items x JOIN chosen c ON c.id=x.import_id GROUP BY x.import_id),
 costs AS (SELECT x.import_id,COALESCE(SUM(x.krw_amount),0) import_costs_krw FROM pink_salt_import_costs x
 JOIN chosen c ON c.id=x.import_id WHERE COALESCE(x.status,'Active')!='Voided' GROUP BY x.import_id),
 cash AS (SELECT x.import_id,COALESCE(SUM(x.krw_amount),0) cash_paid_krw FROM pink_salt_import_payments x
 JOIN chosen c ON c.id=x.import_id WHERE COALESCE(x.status,'Active')!='Voided' GROUP BY x.import_id),
 advances AS (SELECT x.import_id,COALESCE(SUM(x.amount_krw),0) advance_allocated_krw FROM pink_salt_supplier_advance_allocations x
 JOIN chosen c ON c.id=x.import_id WHERE COALESCE(x.status,'Active')='Active' GROUP BY x.import_id)
 SELECT c.*,COALESCE(it.item_count,0) item_count,COALESCE(it.total_weight_kg,0) total_weight_kg,
 COALESCE(it.purchase_original,0) purchase_original,COALESCE(it.purchase_krw,0) purchase_krw,
 COALESCE(co.import_costs_krw,0) import_costs_krw,COALESCE(ca.cash_paid_krw,0) cash_paid_krw,
 COALESCE(ad.advance_allocated_krw,0) advance_allocated_krw
 FROM chosen c LEFT JOIN items it ON it.import_id=c.id LEFT JOIN costs co ON co.import_id=c.id
 LEFT JOIN cash ca ON ca.import_id=c.id LEFT JOIN advances ad ON ad.import_id=c.id ORDER BY c.id DESC`;
function importPage(db,bu,query={}){
 const q=clean(query),filter=pageSQL(q),args=[bu,...filter.args];
 const from='FROM pink_salt_imports i LEFT JOIN pink_salt_suppliers s ON s.id=i.supplier_id AND s.business_unit_id=i.business_unit_id';
 const total=db.prepare(`SELECT COUNT(*) n ${from} WHERE ${filter.where}`).get(...args).n;
 const pagination=paging(query,total),rows=db.prepare(IMPORT_PAGE_SQL.replace('%WHERE%',filter.where)).all(...args,pagination.pageSize,(pagination.page-1)*pagination.pageSize);
 for(const x of rows){x.paid_krw=Number(x.cash_paid_krw||0)+Number(x.advance_allocated_krw||0);x.outstanding_krw=Math.max(0,Number(x.purchase_krw||0)-x.paid_krw);x.payment_status=x.paid_krw<=0?'Unpaid':x.outstanding_krw<=.01?'Fully Paid / Ready to Receive':'Partially Paid';x.ready_to_receive=x.outstanding_krw<=.01&&Number(x.purchase_krw||0)>0;}
 return {rows,pagination};
}
function install({app,db,auth,allow,currentUnit,enforceUnit}){
 const getUnit=(req,res)=>{const pink=db.prepare("SELECT id FROM business_units WHERE lower(name) LIKE '%pink%salt%' AND status!='Archived' ORDER BY id LIMIT 1").get()?.id;
  if(!pink){res.status(409).json({error:'Pink Salt business unit is not available.'});return null;}
  if(Number(currentUnit(req)||0)!==Number(pink)||!enforceUnit(req,pink)){res.status(403).json({error:'Select the Pink Salt business unit to use this workspace.'});return null;}
  return Number(pink);};
 // Additive read indexes. Existing DB, ledgers and uploaded evidence are never altered.
 try{db.exec(`CREATE INDEX IF NOT EXISTS idx_v350_ps_import_list ON pink_salt_imports(business_unit_id,id DESC);
 CREATE INDEX IF NOT EXISTS idx_v350_ps_import_items ON pink_salt_import_items(import_id);
 CREATE INDEX IF NOT EXISTS idx_v350_ps_import_costs ON pink_salt_import_costs(import_id,status);
 CREATE INDEX IF NOT EXISTS idx_v350_ps_import_payments ON pink_salt_import_payments(import_id,status);`)}catch(e){console.warn('V30.50 import list read indexes:',e.message)}
 app.get('/api/v350/pink-salt/imports/page',auth,allow('purchases','inventory','finance','dashboard'),(req,res)=>{try{const bu=getUnit(req,res);if(!bu)return;res.json(importPage(db,bu,req.query));}catch(e){console.warn('V30.50 import page:',e.message);res.status(500).json({error:'Could not load import shipment page.'});}});
}
module.exports={install,importPage,pageSQL,clean,IMPORT_PAGE_SQL};
